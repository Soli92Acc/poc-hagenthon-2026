#!/usr/bin/env bash
# =============================================================================
# compute-agentic-cost.sh — deterministic tool compute_agentic_cost (EP-009, US-034, TSK-061)
# =============================================================================
#
# Part of the Task Analytics & Cost/Time Estimation (EP-009) capability, instance
# of the pattern [[thin-agents-fat-skills-refactor]]: this is the TOOL (deterministic logic,
# no LLM). It is a side-channel agnostic READER `analytics/events/` (written by
# record_task_event, US-033) e di `analytics/pricing.yaml` (single-writer umano,
# ADR-022). The tool does NOT reason: it filters `actor_type: agent` events, resolves
# the pricing for each event and applies the agent cost formula. The output is
# pure JSON; the interpretation is scope of the skill (US-036) and the agent (US-038).
#
# PATTERN.md §3 — optional canonical operation «Cost Computation» (Agentic Cost).
# Wiki: wiki/concepts/task-analytics-cost-estimation-capability.md
#       [[task-analytics-cost-estimation-capability]] §Agentic cost.
# ADR-022 — `<<pricing_table>>` schema (§B), resolution `<<model_id>>` (§D),
#           `valid_from` semi-open (§E), retrospective determinism (§F).

# ADR-023 §A — analytics tool registration in `.claude/tools/analytics/*` (no MCP),

#           minimal contract: --config optional, stdout=JSON / stderr=log, exit code
#           semantic, stateless.

#
# INVARIANT — never hardcode prices: prices (token + tool) ALWAYS come from

#   `analytics/pricing.yaml`. No monetary values ​​are hard-coded into this file.
#   Unknown model → fail-loud (ADR-022 §D), never silent zero imputation.
#
# INVARIANT — retrospective determinism (ADR-022 §F): the cost of an event at
#   timestamp e.ts is calculated with the pricing valid at e.ts (entry `valid_from`
#   semi-open), NEVER with the current pricing. Same input + same pricing
#   snapshot → same output.

#
# FORMULA (verbatim concept §2.1, applicata sui soli eventi actor_type=agent):
#   cost = Σ_model [ input · price_in + output · price_out
#                       + cache_read·prezzo_cr + cache_write·prezzo_cw ]
#         + Σ_tool    [ qty · prezzo_tool ]
#   Token prices expressed per 1M token in pricing.yaml → division by 1e6.

#
# -----------------------------------------------------------------------------
# INPUT CONTRACT (CLI)
#   --task-id <id> calculates the cost of the single task (filter on task_id).
#   --filter '<JSON>' filter on event store. Shape:

#                          {project_id?, period?:{from,to}, actor_id?, task_type?}.
#                          (period.from inclusive, period.to exclusive, ISO-8601).

#   --pricing <path> path to the pricing table. Default: the value of

#                          analytics.measurement.pricing_table_path da CONFIG,
#                          altrimenti "analytics/pricing.yaml" (ADR-022 §A).
#   --pricing-as-of <date> what-if (ADR-022 §F): force resolution on this date
#                          (YYYY-MM-DD) instead of the event ts. Explicit projection.
#   --config <path> default "factory.config.yaml" (agnostic-test, ADR-023 §A).

#
# --task-id and --filter are combinable (AND). Absence of both = aggregate
# global of all agent events.
#
# OUTPUT CONTRACT (stdout, pure JSON) — scheme US-034 / TSK-061:
#   {
#     "cost": <float>, "currency": "<ISO>",
#     "breakdown": {
#       "per_model": { "<model_id>": <float> },
#       "agentic_by_token_kind": { "input":<f>, "output":<f>, "cache_read":<f>, "cache_write":<f> },
#       "per_tool": { "<tool_name>": <float> }
#     },
#     "events_considered": <int>,
#     "pricing_table_version": "<git-hash-or-date>"
#   }
#
# STDERR
#   human-readable log (fail-loud on error; quiet on success).
#
# EXIT CODES
#   0 cost calculated OR no-op (analytics.measurement.enabled absent/false, R.P3)
#   >0 error (missing prerequisite, missing pricing, unknown model_id, etc.)
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
TASK_ID=""
FILTER="{}"
PRICING=""
PRICING_AS_OF=""
CONFIG="factory.config.yaml"

usage() {
  echo "Uso: compute-agentic-cost.sh [--task-id <id>] [--filter '<JSON>'] [--pricing <path>] [--pricing-as-of YYYY-MM-DD] [--config <path>]" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-id)
      TASK_ID="${2:-}"; shift 2 ;;
    --filter)
      FILTER="${2:-}"; [[ -z "$FILTER" ]] && FILTER="{}"; shift 2 ;;
    --pricing)
      PRICING="${2:-}"; shift 2 ;;
    --pricing-as-of)
      PRICING_AS_OF="${2:-}"; shift 2 ;;
    --config)
      CONFIG="${2:-factory.config.yaml}"; shift 2 ;;
    *)
      echo "ERRORE: argomento sconosciuto '$1'." >&2; usage
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
  echo "Tool compute_agentic_cost richiede 'jq' per il parsing/calcolo JSON. Installare jq (brew install jq / apt-get install jq)." >&2
  printf '{"status":"error","error":"missing prerequisite: jq"}\n'
  exit 1
fi

# Validate that --filter is well-formed JSON (fail-loud).
if ! printf '%s' "$FILTER" | jq -e . >/dev/null 2>&1; then
  echo "ERRORE: --filter non è JSON valido: '$FILTER'." >&2
  printf '{"status":"error","error":"invalid --filter JSON"}\n'
  exit 1
fi

# Valid --pricing-as-of if present (YYYY-MM-DD).
if [[ -n "$PRICING_AS_OF" ]] && ! printf '%s' "$PRICING_AS_OF" | grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
  echo "ERRORE: --pricing-as-of deve essere YYYY-MM-DD (trovato: '$PRICING_AS_OF')." >&2
  printf '{"status":"error","error":"invalid --pricing-as-of: %s"}\n' "$PRICING_AS_OF"
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. YAML helper — extract values ​​from analytics.measurement.<key> (same helper
#    di record-event.sh / analyze-timeline.sh, no dipendenze esterne / no yq).
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

# ---------------------------------------------------------------------------
# 4. Master switch — no-op if the capability is turned off (R.P3, ADR-022 §G)
#    Missing file/block => disabled => exit 0 silent, 0 files written.
# ---------------------------------------------------------------------------
ENABLED="$(yaml_measurement_value "enabled" "$CONFIG")"
if [[ "$ENABLED" != "true" ]]; then
  echo "compute_agentic_cost: analytics.measurement.enabled non è true (no-op, R.P3)." >&2
  exit 0
fi

STORE="$(yaml_measurement_value "store" "$CONFIG")"
[[ -z "$STORE" ]] && STORE="jsonl"   # default ADR-021 §A
if [[ "$STORE" != "jsonl" && "$STORE" != "sqlite" ]]; then
  echo "ERRORE: analytics.measurement.store deve essere 'jsonl' o 'sqlite' (trovato: '$STORE'). Vedi ADR-021 §C." >&2
  printf '{"status":"error","error":"invalid store: %s"}\n' "$STORE"
  exit 1
fi

# ---------------------------------------------------------------------------
# 5. Resolution path pricing.yaml (--pricing > config > default ADR-022 §A).

#    Clear fail-loud if pricing file is missing (R.P3 / ADR-022 §G).

# ---------------------------------------------------------------------------
if [[ -z "$PRICING" ]]; then
  PRICING="$(yaml_measurement_value "pricing_table_path" "$CONFIG")"
fi
[[ -z "$PRICING" ]] && PRICING="analytics/pricing.yaml"   # default ADR-022 §A
if [[ "$PRICING" != /* ]]; then
  PRICING="$REPO_ROOT/$PRICING"
fi

if [[ ! -f "$PRICING" ]]; then
  REL_PRICING="${PRICING#"$REPO_ROOT"/}"
  echo "ERRORE: pricing table mancante ($REL_PRICING). La capability è attiva ma il file di pricing non esiste. Crealo copiando analytics/pricing.yaml.template. Vedi ADR-022 §B/§G." >&2
  printf '{"status":"error","error":"missing pricing table: %s"}\n' "$REL_PRICING"
  exit 1
fi

# ---------------------------------------------------------------------------
# 6. pricing_table_version — git hash of the file if under git, otherwise mtime date.
#    Determinism: the version identifies the snapshot pricing used (audit, US-034).
# ---------------------------------------------------------------------------
PRICING_VERSION=""
if command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  PRICING_VERSION="$(git -C "$REPO_ROOT" log -1 --format=%H -- "$PRICING" 2>/dev/null || true)"
fi
if [[ -z "$PRICING_VERSION" ]]; then
  # Fallback: File last modified date (YYYY-MM-DD), macOS/Linux portable.
  PRICING_VERSION="$(date -u -r "$PRICING" +%Y-%m-%d 2>/dev/null || date -u +%Y-%m-%d)"
fi

# ---------------------------------------------------------------------------
# 7. Parse pricing.yaml → JSON (no yq: minimal awk parser for schema §B
#    ADR-022). Emette { currency, models:[{id,aliases:[],pricing:[{valid_from,
#    input_per_1m_tokens,output_per_1m_tokens,cache_read_per_1m_tokens,
#    cache_write_per_1m_tokens}]}], tools:[{name,pricing:[{valid_from,price_per_unit}]}] }.
#    I prezzi assenti → 0 (ADR-022 §B: cache_* omessi = 0).
# ---------------------------------------------------------------------------
PRICING_JSON="$(awk '
  function flush_price(){
    if (in_price) {
      printf("%s{\"valid_from\":\"%s\",\"input_per_1m_tokens\":%s,\"output_per_1m_tokens\":%s,\"cache_read_per_1m_tokens\":%s,\"cache_write_per_1m_tokens\":%s,\"price_per_unit\":%s}",
        (p_count>0?",":""), pf, (pi==""?"0":pi), (po==""?"0":po), (pcr==""?"0":pcr), (pcw==""?"0":pcw), (ppu==""?"0":ppu))
      p_count++
      in_price=0; pf=""; pi=""; po=""; pcr=""; pcw=""; ppu=""
    }
  }
  function close_aliases(){ if (in_aliases){ printf("]"); in_aliases=0 } }
  function close_entry(){
    if (entry_open) { flush_price(); printf("]"); close_aliases_if(); printf("}"); entry_open=0; p_count=0 }
  }
  # close pending aliases block inside an entry before closing it
  function close_aliases_if(){ }
  BEGIN{
    section="";   # "models" | "tools"
    printf("{")
    currency_done=0
    first_model=1; first_tool=1
    entry_open=0; in_price=0; p_count=0; in_aliases=0; alias_count=0
    models_open=0; tools_open=0
  }
  {
    raw=$0
    # strip inline comments (after " #") — not inside quoted strings (simple pattern).
    sub(/[[:space:]]+#.*$/, "", raw)
    sub(/^#.*$/, "", raw)
    # compute indent
    ind=0; while (substr(raw, ind+1, 1)==" ") ind++
    line=raw; gsub(/^[[:space:]]+/, "", line); gsub(/[[:space:]]+$/, "", line)
    if (line=="") next

    # top-level currency
    if (ind==0 && line ~ /^currency:/) {
      v=line; sub(/^currency:[[:space:]]*/, "", v); gsub(/^["'"'"']|["'"'"']$/, "", v)
      printf("\"currency\":\"%s\"", v); currency_done=1
      next
    }

    # section headers
    if (ind==0 && line ~ /^models:/) {
      close_entry()
      if (currency_done) printf(",")
      printf("\"models\":["); section="models"; models_open=1; first_model=1
      next
    }
    if (ind==0 && line ~ /^tools:/) {
      close_entry()
      if (models_open) { printf("]"); models_open=0 }
      printf(",\"tools\":["); section="tools"; tools_open=1; first_tool=1
      next
    }

    # new entry: "- id:" (models) or "- name:" (tools)
    if (line ~ /^- (id|name):/) {
      close_entry()
      key="id"; if (line ~ /^- name:/) key="name"
      v=line; sub("^- " key ":[[:space:]]*", "", v); gsub(/^["'"'"']|["'"'"']$/, "", v)
      if (section=="models") { if (!first_model) printf(","); first_model=0; printf("{\"id\":\"%s\",\"aliases\":[", v); in_aliases=1; alias_count=0 }
      else                   { if (!first_tool)  printf(","); first_tool=0;  printf("{\"name\":\"%s\",\"aliases\":[", v); in_aliases=1; alias_count=0 }
      entry_open=1; p_count=0
      next
    }

    # aliases block header
    if (line ~ /^aliases:/) { next }   # entries already opened "aliases":[
    # alias list item: "- value" (when not "- id"/"- name"/"- valid_from")
    if (in_aliases && line ~ /^- / && line !~ /^- (id|name|valid_from):/) {
      v=line; sub(/^-[[:space:]]*/, "", v); gsub(/^["'"'"']|["'"'"']$/, "", v)
      printf("%s\"%s\"", (alias_count>0?",":""), v); alias_count++
      next
    }

    # pricing/rates block header
    if (line ~ /^(pricing|rates):/) {
      if (in_aliases) { printf("]"); in_aliases=0; printf(",\"pricing\":[") }
      else            { printf(",\"pricing\":[") }
      next
    }

    # a new price entry begins with "- valid_from:"
    if (line ~ /^- valid_from:/) {
      flush_price()
      in_price=1
      v=line; sub(/^- valid_from:[[:space:]]*/, "", v); gsub(/^["'"'"']|["'"'"']$/, "", v)
      pf=v
      next
    }

    # price sub-fields
    if (in_price) {
      if (line ~ /^input_per_1m_tokens:/)        { v=line; sub(/^input_per_1m_tokens:[[:space:]]*/,"",v); pi=v; next }
      if (line ~ /^output_per_1m_tokens:/)       { v=line; sub(/^output_per_1m_tokens:[[:space:]]*/,"",v); po=v; next }
      if (line ~ /^cache_read_per_1m_tokens:/)   { v=line; sub(/^cache_read_per_1m_tokens:[[:space:]]*/,"",v); pcr=v; next }
      if (line ~ /^cache_write_per_1m_tokens:/)  { v=line; sub(/^cache_write_per_1m_tokens:[[:space:]]*/,"",v); pcw=v; next }
      if (line ~ /^price_per_unit:/)             { v=line; sub(/^price_per_unit:[[:space:]]*/,"",v); ppu=v; next }
    }
  }
  END{
    close_entry()
    if (models_open) printf("]")
    if (tools_open) printf("]")
    printf("}")
  }
' "$PRICING")"

# Validates that the parse produced well-formed JSON (fail-loud).
if ! printf '%s' "$PRICING_JSON" | jq -e . >/dev/null 2>&1; then
  echo "ERRORE: parsing di pricing.yaml fallito o schema non riconosciuto ($PRICING). Verifica lo schema ADR-022 §B (lista models[].pricing[] con valid_from)." >&2
  printf '{"status":"error","error":"pricing parse failed"}\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 8. load_events(filter) — store agnostic reader (internal dispatch).

#    Outputs to stdout a JSONL stream of events ALREADY filtered for:
#    actor_type=agent (always — only agent events have model cost),
#    task_id (if --task-id), and the --filter fields (project_id, actor_id,
#    task_type, period.{from,to}). The same jq program is shared by the two
#    backend for exact consistency (same pattern as analyze-timeline.sh).
# ---------------------------------------------------------------------------
EVENTS_DIR="$REPO_ROOT/analytics/events"
DB="$REPO_ROOT/analytics/events.db"

JQ_FILTER='
  ($f.project_id // null) as $pid
  | ($f.task_type // null) as $tt
  | ($f.actor_id // null) as $aid
  | ($f.period.from // null) as $from
  | ($f.period.to // null) as $to
  | select(.actor_type == "agent")
  | select($task == "" or .task_id == $task)
  | select($pid == null or .project_id == $pid)
  | select($tt  == null or .task_type  == $tt)
  | select($aid == null or .actor_id  == $aid)
  | select($from == null or .ts >= $from)
  | select($to   == null or .ts <  $to)
'

load_events() {
  if [[ "$STORE" == "jsonl" ]]; then
    # R.P3: event store absent → 0 events (soft no-op, not error).
    if [[ ! -d "$EVENTS_DIR" ]]; then
      echo "compute_agentic_cost: event store assente ($EVENTS_DIR). Nessun evento da valutare (R.P3)." >&2
      return 0
    fi
    shopt -s nullglob
    local files=( "$EVENTS_DIR"/*.jsonl "$EVENTS_DIR"/*.jsonl.gz )
    shopt -u nullglob
    if [[ ${#files[@]} -eq 0 ]]; then
      echo "compute_agentic_cost: nessun file evento in $EVENTS_DIR (R.P3)." >&2
      return 0
    fi
    local f
    for f in "${files[@]}"; do
      if [[ "$f" == *.gz ]]; then gzip -dc "$f" 2>/dev/null; else cat "$f"; fi
    done | jq -c --argjson f "$FILTER" --arg task "$TASK_ID" "$JQ_FILTER" 2>/dev/null || true
  else
    if ! command -v sqlite3 >/dev/null 2>&1; then
      echo "Tool compute_agentic_cost con store=sqlite richiede 'sqlite3' CLI (≥3.35). Installare sqlite3 o usare store=jsonl. Vedi ADR-021 §B." >&2
      printf '{"status":"error","error":"missing prerequisite: sqlite3"}\n'
      exit 1
    fi
    if [[ ! -f "$DB" ]]; then
      echo "compute_agentic_cost: event store SQLite assente ($DB). Nessun evento da valutare (R.P3)." >&2
      return 0
    fi
    sqlite3 -json "$DB" "SELECT * FROM events ORDER BY ts;" 2>/dev/null \
      | jq -c '.[]
          | { task_id, project_id, parent_id, actor_type, actor_id, task_type, state, ts,
              model,
              tokens: { input: .tokens_input, output: .tokens_output,
                        cache_read: .tokens_cache_read, cache_write: .tokens_cache_write },
              tool_calls: (try (.tool_calls | fromjson) catch []) }' \
      | jq -c --argjson f "$FILTER" --arg task "$TASK_ID" "$JQ_FILTER" 2>/dev/null || true
  fi
}

EVENTS="$(load_events)"

# ---------------------------------------------------------------------------
# 9. Resolution model_id (ADR-022 §D) — performed here deterministically for
#    each distinct raw model present in the events, before calculation, so as to
#    be able to fail-loud with the event ID on the unknown event (DoD).
#    Procedura §D:
#      1. norm = lowercase(model).replace('.', '-')
#      2. match pricing.models[].id == norm OR aliases[*] == norm OR == raw
#      3. no match → fail-loud "Unknown model_id ... in event T-XXX ..."
#    NB: the resolution of valid_from is done inside jq at step 10 (per event).

# ---------------------------------------------------------------------------
# For each agent event, verify that the model resolves to a canonical id.
# We iterate event-by-event (no bash arrays) to be able to quote task_id in the message.
if [[ -n "$EVENTS" ]]; then
  while IFS= read -r ev; do
    [[ -z "$ev" ]] && continue
    raw_model="$(printf '%s' "$ev" | jq -r '.model // ""')"
    ev_task="$(printf '%s' "$ev" | jq -r '.task_id // "?"')"
    ev_ts="$(printf '%s' "$ev" | jq -r '.ts // "?"')"
    # An agent event with tokens but without model is not resolvable → fail-loud.
    if [[ -z "$raw_model" || "$raw_model" == "null" ]]; then
      tok_sum="$(printf '%s' "$ev" | jq -r '((.tokens.input//0)+(.tokens.output//0)+(.tokens.cache_read//0)+(.tokens.cache_write//0))')"
      if [[ "$tok_sum" != "0" ]]; then
        echo "ERRORE: evento $ev_task ($ev_ts) ha token agentici ma campo 'model' assente. Impossibile risolvere il pricing. Vedi ADR-022 §D." >&2
        printf '{"status":"error","error":"missing model in event %s"}\n' "$ev_task"
        exit 1
      fi
      continue
    fi
    norm="$(printf '%s' "$raw_model" | tr '[:upper:]' '[:lower:]' | tr '.' '-')"
    matched="$(printf '%s' "$PRICING_JSON" | jq -r --arg norm "$norm" --arg raw "$raw_model" '
      [ .models[] | select(.id == $norm or (.aliases // []) as $a | ($a | index($norm)) != null or ($a | index($raw)) != null) | .id ] | first // ""')"
    if [[ -z "$matched" || "$matched" == "null" ]]; then
      echo "ERRORE: Unknown model_id \`$raw_model\` in event $ev_task: add entry in analytics/pricing.yaml (vedi ADR-022)." >&2
      printf '{"status":"error","error":"unknown model_id %s in event %s"}\n' "$raw_model" "$ev_task"
      exit 1
    fi
  done <<< "$EVENTS"
fi

# ---------------------------------------------------------------------------
# 10. Cost calculation — formula §2.1 verbatim, in a single program jq.
#     For each agent event:
#       - solve model → canonical id (norm + aliases)
#       - select pricing entry with valid_from <= ts_resolution < next.valid_from
#         (ts_resolution = pricing-as-of se fornito, altrimenti e.ts) — ADR-022 §D/§E
#       - token: (n / 1e6) · price_per_1m (prices per 1M token in pricing.yaml)

#       - tool : Σ qty · price_per_unit of the tool resolved by name
#     Fail-loud (step 9 already covers unknown model). Here is an expired pricing
#     (no valid_from <= ts) → error with event id (ADR-022 §D point 5).
# ---------------------------------------------------------------------------
DATEKEY="$PRICING_AS_OF"   # vuoto = usa e.ts; valorizzato = what-if as-of

RESULT="$(printf '%s\n' "$EVENTS" | jq -s \
  --argjson pricing "$PRICING_JSON" \
  --arg asof "$DATEKEY" \
  --arg pricing_version "$PRICING_VERSION" '

  def round6: (. * 1000000 | round) / 1000000;

  # ---- Helper: resolution date for an event (as-of override or ts → YYYY-MM-DD). ----
  # valid_from in pricing.yaml ha granularity day; confrontiamo su date stringa
  # (lexicographic ISO-8601 = chronological ordering). Extracts the first 10 chars of the ts.
  def res_date($ts): (if $asof != "" then $asof else ($ts[0:10]) end);

  # ---- Helper: solve model raw → canonical id (norm + aliases). ----
  def canon($raw):
      ($raw | ascii_downcase | gsub("\\.";"-")) as $norm
      | ( [ $pricing.models[]
            | select(.id == $norm
                     or ((.aliases // []) | index($norm)) != null
                     or ((.aliases // []) | index($raw)) != null) ] | first );

  # ---- Helper: select the pricing entry valid on date $d (semi-open). ----
  # valid entry = valid_from <= $d, and you choose the MAXIMUM valid_from <= $d.
  def pick_pricing($entries; $d):
      [ $entries[] | select(.valid_from <= $d) ] | sort_by(.valid_from) | last;

  ($pricing.currency // "EUR") as $currency

  | . as $events
  | ($events | length) as $events_considered

  # ---- Accumulate costs per event. ----
  | reduce $events[] as $e (
      { cost: 0,
        per_model: {},
        by_kind: { input:0, output:0, cache_read:0, cache_write:0 },
        per_tool: {} };

      # --- model token cost (only if model present) ---
      ( ($e.model // "") ) as $raw
      | ( if $raw == "" then .
          else
            (canon($raw)) as $m
            | ($m.id) as $mid
            | (res_date($e.ts)) as $d
            | (pick_pricing($m.pricing; $d)) as $pr
            | if $pr == null then
                error("No valid pricing for model \"" + $mid + "\" at " + $d + " in event " + ($e.task_id // "?") + " (vedi ADR-022 §D)")
              else
                (($e.tokens.input       // 0) / 1000000 * ($pr.input_per_1m_tokens       // 0)) as $c_in
                | (($e.tokens.output     // 0) / 1000000 * ($pr.output_per_1m_tokens      // 0)) as $c_out
                | (($e.tokens.cache_read // 0) / 1000000 * ($pr.cache_read_per_1m_tokens  // 0)) as $c_cr
                | (($e.tokens.cache_write// 0) / 1000000 * ($pr.cache_write_per_1m_tokens // 0)) as $c_cw
                | ($c_in + $c_out + $c_cr + $c_cw) as $c_model
                | .cost += $c_model
                | .by_kind.input       += $c_in
                | .by_kind.output      += $c_out
                | .by_kind.cache_read  += $c_cr
                | .by_kind.cache_write += $c_cw
                | .per_model[$mid] = ((.per_model[$mid] // 0) + $c_model)
              end
          end )

      # --- cost of tool calls (Σ qty · price_per_unit) ---
      | reduce ($e.tool_calls // [])[] as $tc (.;
          ($tc.name // "") as $tname
          | if $tname == "" then .
            else
              ( [ $pricing.tools[]? | select(.name == $tname) ] | first ) as $tdef
              | ( if $tdef == null then 0
                  else
                    (res_date($e.ts)) as $td
                    | (pick_pricing($tdef.pricing; $td)) as $tpr
                    | (($tpr.price_per_unit // 0)) as $unit
                    | (($tc.qty // 0) * $unit)
                  end ) as $c_tool
              | .cost += $c_tool
              | .per_tool[$tname] = ((.per_tool[$tname] // 0) + $c_tool)
            end )
    )

  # ---- Arrotonda e assembla output finale (schema US-034 / TSK-061). ----
  | {
      cost: (.cost | round6),
      currency: $currency,
      breakdown: {
        per_model: (.per_model | map_values(round6)),
        agentic_by_token_kind: {
          input:       (.by_kind.input       | round6),
          output:      (.by_kind.output      | round6),
          cache_read:  (.by_kind.cache_read  | round6),
          cache_write: (.by_kind.cache_write | round6)
        },
        per_tool: (.per_tool | map_values(round6))
      },
      events_considered: $events_considered,
      pricing_table_version: $pricing_version
    }
')"

if [[ -z "$RESULT" ]]; then
  echo "ERRORE: calcolo costo fallito (jq). Verifica lo schema eventi (ADR-021 §E) e pricing (ADR-022 §B)." >&2
  printf '{"status":"error","error":"cost computation failed"}\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 11. Emissione output finale — JSON puro su stdout.
# ---------------------------------------------------------------------------
EVENTS_N="$(printf '%s' "$RESULT" | jq -r '.events_considered')"
echo "compute_agentic_cost: $EVENTS_N eventi agent valutati con pricing $PRICING (version $PRICING_VERSION)." >&2

printf '%s\n' "$RESULT"
exit 0
