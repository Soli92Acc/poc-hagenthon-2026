#!/usr/bin/env bash
# =============================================================================
# analyze-timeline.sh — deterministic tool analyze_timeline (EP-009, US-035, TSK-063)
# =============================================================================
#
# Part of the Task Analytics & Cost/Time Estimation (EP-009) capability, instance
# of the pattern [[thin-agents-fat-skills-refactor]]: this is the TOOL (deterministic logic,
# no LLM). It is the agnostic READER of the `analytics/events/` side-channel store
# written by record_task_event (US-033, single-writer). The tool DOES NOT reason:
# reads events, reconstructs the timeline by task, calculates metrics and outputs
# Pure JSON. The interpretation ("why is the review a bottleneck?") is scope
# of the skill (US-036) and the agent (US-038), never of this tool.
#
# PATTERN.md §3 — optional canonical operation «Timeline Analysis».
# Wiki: wiki/concepts/task-analytics-cost-estimation-capability.md
#       [[task-analytics-cost-estimation-capability]] §Time analysis,
#       §Four concepts not to be confused, §Use percentiles, not averages.
# ADR-021 — `<<task_event_store>>`: reader agnostic with internal dispatch
#           load_events(filter): JSONL scan+filter in-memory (§A/§D) | SQLite
#           SELECT with index (§B/§D). Warning volume >500k lines (§D).
# ADR-024 §C — sub-schema `time` standard (output coerente: lead/cycle/effort/wait
#           with percentiles p50/p85/p95 + bottleneck + n_samples).
#
# INVARIANT «percentiles, not averages»: the output has p50/p85/p95 for each of the 4
# concepts; the tool NEVER outputs a `mean`, `average` or `average` field. The durations
# of tasks are long-tail distributions: the average is deceiving.
#
# THE FOUR TIME CONCEPTS (verbatim from the concept, never mixed):
#   - lead   = ts(finished) - ts(created/started_first) — calendario, attese incluse.
#   - cycle  = somma intervalli in stati "in lavorazione" (escluso `blocked`).
#   - effort = human → effort_hours (frontmatter/override); agent → somma cycle intervals.
#   - wait = lead - cycle — often the real bottleneck.

#
# -----------------------------------------------------------------------------
# INPUT CONTRACT (CLI)
#   --filter '<JSON>' optional filter, default {} (no filter = global aggregate).

#                         Shape: {project_id?, task_type?, actor_type?, layer?,

#                                 period?: {from, to}} (ISO-8601 the dates of period).

#   --group-by <dim> optional: task_type | layers | actor_type | actor_id | stay.
#   --config <path> default "factory.config.yaml" (ADR-023 §A).

#
# OUTPUT CONTRACT (stdout, pure JSON) — schema US-035 / ADR-024 §C:
#   { filter, group_by, lead{p50,p85,p95,unit}, cycle{...}, effort{...}, wait{...},
#     bottlenecks[{state,p50_wait,share_of_lead,bottleneck}], operational{...},
#     events_considered }
#
# STDERR
#   human-readable log (non-blocking volume warning; fail-loud on error).


#
# EXIT CODES
#   0 analysis produced OR no-op (analytics.measurement.enabled absent/false, R.P3)
#   >0 error (missing prerequisite, store not readable, invalid filter)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# 0. Repo root resolution (the script can be invoked from any cwd)

# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# .claude/tools/analytics/ → repo root is 3 levels up.
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# ---------------------------------------------------------------------------
# 1. CLI argument parsing
# ---------------------------------------------------------------------------
FILTER="{}"
GROUP_BY=""
CONFIG="factory.config.yaml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --filter)
      FILTER="${2:-}"; [[ -z "$FILTER" ]] && FILTER="{}"; shift 2 ;;
    --group-by)
      GROUP_BY="${2:-}"; shift 2 ;;
    --config)
      CONFIG="${2:-factory.config.yaml}"; shift 2 ;;
    *)
      echo "ERRORE: argomento sconosciuto '$1'. Uso: analyze-timeline.sh [--filter '<JSON>'] [--group-by task_type|layer|actor_type|actor_id|state] [--config <path>]" >&2
      printf '{"status":"error","error":"unknown argument: %s"}\n' "$1"
      exit 1 ;;
  esac
done

# Normalize CONFIG to absolute path (relative → with respect to the root repo).

if [[ "$CONFIG" != /* ]]; then
  CONFIG="$REPO_ROOT/$CONFIG"
fi

# ---------------------------------------------------------------------------
# 2. Check prerequisiti — fail-loud (ADR-023 §A contract)
# ---------------------------------------------------------------------------
if ! command -v jq >/dev/null 2>&1; then
  echo "Tool analyze_timeline richiede 'jq' per il parsing/aggregazione JSON. Installare jq (brew install jq / apt-get install jq)." >&2
  printf '{"status":"error","error":"missing prerequisite: jq"}\n'
  exit 1
fi

# Validate that --filter is well-formed JSON (fail-loud).
if ! printf '%s' "$FILTER" | jq -e . >/dev/null 2>&1; then
  echo "ERRORE: --filter non è JSON valido: '$FILTER'." >&2
  printf '{"status":"error","error":"invalid --filter JSON"}\n'
  exit 1
fi

# Validate --group-by if present.
if [[ -n "$GROUP_BY" ]]; then
  case "$GROUP_BY" in
    task_type|layer|actor_type|actor_id|state) : ;;
    *)
      echo "ERRORE: --group-by '$GROUP_BY' non valido (ammessi: task_type|layer|actor_type|actor_id|state)." >&2
      printf '{"status":"error","error":"invalid --group-by: %s"}\n' "$GROUP_BY"
      exit 1 ;;
  esac
fi

# ---------------------------------------------------------------------------
# 3. Master switch — no-op if the capability is off (R.P3, ADR-021 §F)
#    Read analytics.measurement.{enabled,store,jsonl_scan_warn_lines} from CONFIG
#    without external dependencies (no yq). Same helper as record-event.sh.

# ---------------------------------------------------------------------------
yaml_measurement_value() {
  # $1 = key under analytics.measurement ; $2 = file
  local key="$1" file="$2"
  [[ -f "$file" ]] || return 0
  awk -v want="$key" '
    function indent(s,   n){ n=0; while (substr(s,n+1,1)==" ") n++; return n }
    {
      raw=$0
      sub(/[[:space:]]+#.*$/, "", raw)
      ind=indent(raw)
      line=raw; gsub(/^[[:space:]]+/, "", line); gsub(/[[:space:]]+$/, "", line)
      if (line=="") next
      if (line ~ /^analytics:/)    { in_a=1; a_ind=ind; in_m=0; next }
      if (in_a && ind<=a_ind && line !~ /^analytics:/) { in_a=0; in_m=0 }
      if (in_a && line ~ /^measurement:/) { in_m=1; m_ind=ind; next }
      if (in_m && ind<=m_ind) { in_m=0 }
      if (in_m && line ~ ("^" want ":")) {
        v=line; sub(("^" want ":[[:space:]]*"), "", v)
        gsub(/^["'"'"']|["'"'"']$/, "", v)
        print v; exit
      }
    }
  ' "$file"
}

ENABLED="$(yaml_measurement_value "enabled" "$CONFIG")"
if [[ "$ENABLED" != "true" ]]; then
  # No-op: capability turned off or blocking absent. Total backward-compat (R.P3).
  echo "analyze_timeline: analytics.measurement.enabled non è true (no-op, R.P3)." >&2
  exit 0
fi

STORE="$(yaml_measurement_value "store" "$CONFIG")"
[[ -z "$STORE" ]] && STORE="jsonl"   # default ADR-021 §A
if [[ "$STORE" != "jsonl" && "$STORE" != "sqlite" ]]; then
  echo "ERRORE: analytics.measurement.store deve essere 'jsonl' o 'sqlite' (trovato: '$STORE'). Vedi ADR-021 §C." >&2
  printf '{"status":"error","error":"invalid store: %s"}\n' "$STORE"
  exit 1
fi

SCAN_WARN="$(yaml_measurement_value "jsonl_scan_warn_lines" "$CONFIG")"
[[ -z "$SCAN_WARN" ]] && SCAN_WARN="500000"   # default ADR-021 §D

# ---------------------------------------------------------------------------
# 4. load_events(filter) — abstraction layer (ADR-021 §D)
#    Outputs a JSONL stream of ALREADY filtered events to stdout. Internal dispatch
#    on the store; the rest of the tool is source agnostic.
#    Filter: project_id, task_type, actor_type, layer (from .layer or .extras.layer),

#    period.{from,to} to .ts. inclusive period.from, exclusive period.to.

# ---------------------------------------------------------------------------
EVENTS_DIR="$REPO_ROOT/analytics/events"
DB="$REPO_ROOT/analytics/events.db"

# jq filter program condiviso dai due back-end (post-load, in-memory).
JQ_FILTER='
  ($f.project_id // null) as $pid
  | ($f.task_type // null) as $tt
  | ($f.actor_type // null) as $at
  | ($f.layer // null) as $ly
  | ($f.period.from // null) as $from
  | ($f.period.to // null) as $to
  | select($pid == null or .project_id == $pid)
  | select($tt  == null or .task_type  == $tt)
  | select($at  == null or .actor_type == $at)
  | select($ly  == null or (.layer // .extras.layer // null) == $ly)
  | select($from == null or .ts >= $from)
  | select($to   == null or .ts <  $to)
'

load_events() {
  if [[ "$STORE" == "jsonl" ]]; then
    # 4a. JSONL: scan files in folder + filter in-memory (ADR-021 §D).
    #     R.P3: event store absent → 0 events (soft no-op, not error).
    if [[ ! -d "$EVENTS_DIR" ]]; then
      echo "analyze_timeline: event store assente ($EVENTS_DIR). Nessun evento da analizzare (R.P3)." >&2
      return 0
    fi
    shopt -s nullglob
    local files=( "$EVENTS_DIR"/*.jsonl "$EVENTS_DIR"/*.jsonl.gz )
    shopt -u nullglob
    if [[ ${#files[@]} -eq 0 ]]; then
      echo "analyze_timeline: nessun file evento in $EVENTS_DIR (R.P3)." >&2
      return 0
    fi
    # Non-Blocking Volume Warning (ADR-021 §D): Count total lines.

    local total=0 cnt f
    for f in "${files[@]}"; do
      if [[ "$f" == *.gz ]]; then
        cnt="$(gzip -dc "$f" 2>/dev/null | wc -l | tr -d ' ')"
      else
        cnt="$(wc -l < "$f" | tr -d ' ')"
      fi
      total=$(( total + cnt ))
    done
    if [[ "$total" -gt "$SCAN_WARN" ]]; then
      echo "WARNING analyze_timeline: volume alto rilevato ($total eventi scansionati, soglia $SCAN_WARN). Considera 'store: sqlite' per ridurre la latenza. Vedi ADR-021 §D." >&2
    fi
    # Stream + filter (auto-detect .gz, ADR-021 §A compressione storica).
    for f in "${files[@]}"; do
      if [[ "$f" == *.gz ]]; then
        gzip -dc "$f" 2>/dev/null
      else
        cat "$f"
      fi
    done | jq -c --argjson f "$FILTER" "$JQ_FILTER" 2>/dev/null || true
  else
    # 4b. SQLite: SELECT with index on ts (ADR-021 §B/§D), then filter jq fini
    #     (layer from extras is not column → applied in-memory after the SELECT).
    if ! command -v sqlite3 >/dev/null 2>&1; then
      echo "Tool analyze_timeline con store=sqlite richiede 'sqlite3' CLI (≥3.35). Installare sqlite3 o usare store=jsonl. Vedi ADR-021 §B." >&2
      printf '{"status":"error","error":"missing prerequisite: sqlite3"}\n'
      exit 1
    fi
    if [[ ! -f "$DB" ]]; then
      echo "analyze_timeline: event store SQLite assente ($DB). Nessun evento da analizzare (R.P3)." >&2
      return 0
    fi
    # Reconstructs the isomorphic logical shape (ADR-021 §E) from each row and then

    # reuse the same JQ_FILTER for exact consistency with the JSONL path.
    sqlite3 -json "$DB" "SELECT * FROM events ORDER BY ts;" 2>/dev/null \
      | jq -c '.[]
          | { task_id, project_id, parent_id, actor_type, actor_id, task_type, state, ts,
              model,
              tokens: { input: .tokens_input, output: .tokens_output,
                        cache_read: .tokens_cache_read, cache_write: .tokens_cache_write },
              tool_calls: (try (.tool_calls | fromjson) catch []),
              extras: (try (.extras | fromjson) catch null) }' \
      | jq -c --argjson f "$FILTER" "$JQ_FILTER" 2>/dev/null || true
  fi
}

EVENTS="$(load_events)"

# ---------------------------------------------------------------------------
# 5. Calculating metrics — all in one deterministic jq program.
#    Input: stream JSONL di eventi filtrati. Output: oggetto metriche.
#    Model: for each task I sort the events by ts and reconstruct them
#    intervalli. Convenzione stati (US-035 / ADR-021 §E):
#      state ∈ {started, finished, blocked}.
#      - lead = ts(last finished) - ts(first event) [days]
#      - cycle = sum intervals that START from a 'started' [days]
#                 (excluding 'blocked' = wait), until the next event.
#      - wait   = lead - cycle                                    [days]
#      - effort = human → effort_hours (extras.effort_hours);     [hours]
#                 agent → cycle convertito in ore (cycle*24).
#    Bottleneck by state: accumulated wait for interval START state;
#    'blocked' is pure wait; started→started transitions count as remaining wait
#    only via aggregate lead-cycle. Percentiles: deterministic nearest-rank.
# ---------------------------------------------------------------------------

# Note: if EVENTS is empty → zero metrics, events_considered=0 (no fail).
METRICS="$(printf '%s\n' "$EVENTS" | jq -s --arg group_by "$GROUP_BY" '

  # ---- Helper: parse ISO-8601 → epoch secondi (UTC). ----
  # Normalize: strip fractions of seconds; offset "±hh:mm" → correct seconds;

  # "Z" or "+00:00" → direct fromdateiso8601. Deterministic, no averaging of any kind.
  def epoch:
    sub("\\.[0-9]+";"") as $s0
    | ($s0 | capture("(?<base>.*T[0-9:]+)(?<tz>Z|[+-][0-9]{2}:[0-9]{2})$")) as $c
    | ($c.base + "Z" | fromdateiso8601) as $utc
    | if $c.tz == "Z" then $utc
      else
        ($c.tz | capture("(?<sign>[+-])(?<h>[0-9]{2}):(?<m>[0-9]{2})")) as $o
        | (($o.h|tonumber)*3600 + ($o.m|tonumber)*60) as $off
        | if $o.sign == "+" then ($utc - $off) else ($utc + $off) end
      end;

  # ---- Helper: nearest-rank percentile (deterministic, NO mean). ----
  # $arr ordinato crescente, $p in (0,1]; rank = ceil(p*N), clamp a [1,N].
  def pct($arr; $p):
    ($arr | length) as $n
    | if $n == 0 then 0
      else ($arr | sort) as $s
        | (($p * $n) | ceil) as $r
        | (if $r < 1 then 1 elif $r > $n then $n else $r end) as $rr
        | $s[$rr - 1]
      end;

  def round2: (. * 100 | round) / 100;

  . as $events
  | ($events | length) as $events_considered

  # ---- Group events by task_id, rebuild the timeline. ----
  | ($events | group_by(.task_id)) as $by_task

  # For each task: calculate lead/cycle/wait (days) + effort (hours) + per-state wait.

  | ([ $by_task[]
       | sort_by(.ts) as $evs
       | ($evs | map(.ts | epoch)) as $ts
       | ($evs | length) as $m
       | ($ts | first) as $t0
       | ([ $evs[] | select(.state=="finished") | (.ts|epoch) ] | last) as $tf
       | ($evs[0].actor_type) as $atype
       # Consecutive intervals: the state of the first event of the interval governs nature.
       | ([ range(0; $m-1)
            | { from_state: $evs[.].state, dur: ($ts[.+1] - $ts[.]) } ]) as $ints
       # cycle = intervals starting from 'started' (real work). [seconds]
       | ([ $ints[] | select(.from_state=="started") | .dur ] | add // 0) as $cycle_s
       # wait for starting state (blocked + other non-started). [seconds]

       | ([ $ints[] | select(.from_state!="started") ]) as $wait_ints
       | (if ($tf != null) then ($tf - $t0) else null end) as $lead_s
       | (if ($lead_s != null) then ($lead_s - $cycle_s) else null end) as $wait_s
       # effort: human → extras.effort_hours; agent → cycle in ore.
       | ([ $evs[] | .extras.effort_hours // empty ] | last) as $eff_h_override
       | (if $atype=="human"
            then ($eff_h_override // 0)
            else ($cycle_s / 3600) end) as $effort_h
       | {
           task_id: $evs[0].task_id,
           actor_type: $atype,
           lead_days:  (if $lead_s  != null then ($lead_s  / 86400) else null end),
           cycle_days: ($cycle_s / 86400),
           wait_days:  (if $wait_s  != null then ($wait_s  / 86400) else null end),
           effort_hours: $effort_h,
           finished: ($tf != null),
           first_ts: $t0,
           last_ts:  ($ts | last),
           wait_by_state: ([ $wait_ints[] | { state: .from_state, dur_days: (.dur/86400) } ])
         }
     ]) as $tasks

  # Only completed tasks contribute to the lead/cycle/wait/effort percentiles.
  | ([ $tasks[] | select(.finished and .lead_days != null) ]) as $done

  | ([ $done[] | .lead_days ]   | map(round2)) as $lead_arr
  | ([ $done[] | .cycle_days ]  | map(round2)) as $cycle_arr
  | ([ $done[] | .wait_days ]   | map(round2)) as $wait_arr
  | ([ $done[] | .effort_hours ]| map(round2)) as $effort_arr

  # ---- Bottlenecks: accumulated wait for workflow status. ----
  # Aggregate wait_by_state across all tasks; for state calculate p50 of wait + share.
  | ([ $tasks[] | .wait_by_state[] ] | group_by(.state)
      | map({
          state: .[0].state,
          waits: (map(.dur_days)),
        })) as $state_groups
  | (([ $done[] | .lead_days ] | add) // 0) as $total_lead
  | ([ $state_groups[]
       | (.waits | sort) as $w
       | (.state) as $st
       | (pct($w; 0.5)) as $p50w
       | ((.waits | add) // 0) as $sum_w
       | {
           state: $st,
           p50_wait: ($p50w | round2),
           share_of_lead: (if $total_lead > 0 then (($sum_w / $total_lead) | round2) else 0 end)
         }
     ]
     | sort_by(-.p50_wait)) as $bottlenecks_sorted
  # Mark the top (max p50_wait) as bottleneck:true; the others false.
  | ([ range(0; ($bottlenecks_sorted|length))
       | $bottlenecks_sorted[.] + { bottleneck: (. == 0) } ]) as $bottlenecks

  # ---- Operational ----
  # throughput_per_week: task finished / number of weeks covered by the event period.
  | (if ($events|length) > 0
       then (([ $events[] | .ts|epoch ] | min)) else 0 end) as $span_min
  | (if ($events|length) > 0
       then (([ $events[] | .ts|epoch ] | max)) else 0 end) as $span_max
  | (((($span_max - $span_min) / 604800) ) as $weeks_raw
     | (if $weeks_raw < 1 then 1 else $weeks_raw end)) as $weeks
  | (($done | length) / $weeks | round2) as $throughput

  # WIP: Task with an active started interval, sampled by week (avg+max).
  # Deterministic approximation: for each task "in progress" (>=1 started,
  # no finished) counts as current WIP; avg = average over weeks covered.
  | ([ $tasks[] | select(.finished | not) ] | length) as $wip_now
  | ([ $tasks[]
       | select(.cycle_days > 0)
       | .task_id ] | length) as $worked_tasks
  | (($worked_tasks / $weeks) | round2) as $wip_avg_calc
  | {
      throughput_per_week: $throughput,
      wip_avg: $wip_avg_calc,
      wip_max: $wip_now,
    } as $op_base

  # split human vs agent: % di lead time totale attribuibile a ciascuno.
  | (([ $done[] | select(.actor_type=="human") | .lead_days ] | add) // 0) as $human_lead
  | (([ $done[] | select(.actor_type=="agent") | .lead_days ] | add) // 0) as $agent_lead
  | ($human_lead + $agent_lead) as $tot_lead2
  | (if $tot_lead2 > 0 then (($human_lead / $tot_lead2 * 100) | round2) else 0 end) as $human_pct
  | (if $tot_lead2 > 0 then (($agent_lead / $tot_lead2 * 100) | round2) else 0 end) as $agent_pct

  # trend[]: weekly series of lead_p50 (week ISO from first_ts of task done).
  | ([ $done[]
       | { week: (.first_ts | strftime("%G-W%V")), lead: .lead_days } ]
     | group_by(.week)
     | map({ week: .[0].week,
             lead_p50: (pct((map(.lead)); 0.5) | round2) })
     | sort_by(.week)) as $trend

  # ---- Assemble output (scheme US-035 / ADR-024 §C). NEVER mean/average field. ----
  | {
      lead:   { p50: (pct($lead_arr;0.5)|round2),   p85: (pct($lead_arr;0.85)|round2),   p95: (pct($lead_arr;0.95)|round2),   unit: "days" },
      cycle:  { p50: (pct($cycle_arr;0.5)|round2),  p85: (pct($cycle_arr;0.85)|round2),  p95: (pct($cycle_arr;0.95)|round2),  unit: "days" },
      effort: { p50: (pct($effort_arr;0.5)|round2), p85: (pct($effort_arr;0.85)|round2), p95: (pct($effort_arr;0.95)|round2), unit: "hours" },
      wait:   { p50: (pct($wait_arr;0.5)|round2),   p85: (pct($wait_arr;0.85)|round2),   p95: (pct($wait_arr;0.95)|round2),   unit: "days" },
      bottlenecks: $bottlenecks,
      operational: ($op_base + {
        split_human_pct: $human_pct,
        split_agent_pct: $agent_pct,
        trend: $trend
      }),
      n_samples: ($done | length),
      events_considered: $events_considered
    }
')"

if [[ -z "$METRICS" ]]; then
  echo "ERRORE: calcolo metriche fallito (jq). Verifica lo schema degli eventi (ADR-021 §E)." >&2
  printf '{"status":"error","error":"metrics computation failed"}\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 6. Emissione output finale — schema verbatim US-035 / ADR-024 §C.
#    group_by: Output as string or null (default = global aggregate).
#    NB invariant: no mean/average/average field appears in the diagram.
# ---------------------------------------------------------------------------
GROUP_BY_JSON="null"
[[ -n "$GROUP_BY" ]] && GROUP_BY_JSON="\"$GROUP_BY\""

printf '%s' "$METRICS" | jq \
  --argjson filter "$FILTER" \
  --argjson group_by "$GROUP_BY_JSON" \
  '{
    filter: $filter,
    group_by: $group_by,
    lead: .lead,
    cycle: .cycle,
    effort: .effort,
    wait: .wait,
    bottlenecks: .bottlenecks,
    operational: .operational,
    n_samples: .n_samples,
    events_considered: .events_considered
  }'

exit 0
