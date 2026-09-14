#!/usr/bin/env bash
# =============================================================================
# generate-report.sh — deterministic tool generate_report (EP-009, US-037, TSK-065)
# =============================================================================
#
# Part of the Task Analytics & Cost/Time Estimation (EP-009) capability, instance
# of the pattern [[thin-agents-fat-skills-refactor]]: this is the TOOL (deterministic logic,
# no LLM). Materialize the "Analytics Report" document (sub-type

# `cost_time_report`) in the canonical schema ADR-024 §A, differentiating content

# and audience privacy masking. It is an AGGREGATOR: invoke the three readers
# existing deterministic — compute-agentic-cost.sh, compute-human-cost.sh,
# analyze-timeline.sh — and assembles their JSON into the standard schema. The tool DOESN'T
# reasons ("why is the review a bottleneck?" is the scope of skill US-036 e
# of agent US-038); calculate the derived split, apply the invariants of
# validation (rate_basis, total, schema_version) and writes to disk.
#
# PATTERN.md §3 — optional canonical operation «Cost/Time Report».
# Wiki: wiki/concepts/task-analytics-cost-estimation-capability.md
#       [[task-analytics-cost-estimation-capability]] §6 (Report, Audience e
#       formato, Schema output, Limiti).
# ADR-024 §A — Documento standard "Analytics Report": schema_version v1, type
#       discriminator, blocchi additivi opzionali (cost/time/split + estimate
#       future EP-010), notes[] required. §B cost, §C time, §D split, §H
#       versioning scheme (non-breaking additivity).


# ADR-023 §C — privacy: audience executive ⇒ no actor_id raw; audience
#       project ⇒ per_actor omesso se N < min_aggregation_n. §E rate_basis
#       mandatory if human > 0.
# ADR-027 §A/§E — storage report scope in analytics/reports/<scope_slug>/<periodo>
#       e adhoc in analytics/reports/_adhoc/<YYYY-MM-DD-HH-MM>-<slug>; single-writer
#       logical skill/agent; analytics/reports/ not gitignored by default.

#
# INVARIANT — additive scheme (ADR-024 §H): the future addition of the block
#   `estimate:` (EP-010 US-042) DOES NOT break existing parsers for cost_time_report.
#   This tool ALWAYS outputs the 6 mandatory top-level fields of the sub-set
#   misurazione (schema_version, scope, type, audience, generated_*, notes[]).
#
# INVARIANT — rate_basis (ADR-023 §E): if cost.human > 0, cost.rate_basis MUST
#   be present. Absence ⇒ fail-loud (never human cost without tariff base).
#
# INVARIANT — never average number in the time block: the p50/p85/p95 percentiles are
#   passed through verbatim from analyze-timeline.sh; this tool does not calculate averages.
#
# CONTENT DIFFERENTIATED BY AUDIENCE (verbatim US-037 §Business Rules / concept):
#   operational → throughput, WIP, bottlenecks, cost per task (+ operational,

#               + breakdown cost). Detail for admitted actor (internal derivative).
#   project → cost to date vs estimate, burn, human/agency split. per_actor omitted
#               se N < threshold (delega a compute-human-cost --audience project).
#   executive → TCO, automation ROI, trend, final estimate. No actor_id
#               raw, no breakdowns per person (aggregates only).

#
# -----------------------------------------------------------------------------
# INPUT CONTRACT (CLI)
#   --scope '<JSON>' analytic filter. Shape: {project_id?, period?, name?,

#                         type?}. period es. "2026-Q2"/"2026-W22"/"2026-06"/range.
#                         Default {} (global aggregate = adhoc report).

#   --audience <lvl>      operativa | progetto | executive — REQUIRED.
#   --format <fmt> md | json | md+json | pdf | html. Default md+json.

#                         md and json always produced; pdf|html fail-loud if engine
#                         external documentation absent.
#   --type <t> sub-type. Default cost_time_report (only one supported in

#                         EP-009; project_estimate/combined arrive with EP-010).
#   --slug <slug> explicit override of the storage slug (kebab-case).

#   --pricing <path>      forward a compute-agentic-cost.sh (--pricing).
#   --rates <path>        forward a compute-human-cost.sh (--rates).
#   --config <path> default "factory.config.yaml" (ADR-023 §A).

#
# OUTPUT CONTRACT
#   stdout : Pure JSON of the report (ADR-024 §A schema) — always.
#   file   : analytics/reports/<scope_slug>/<periodo>.{json,md}  (se scope ha
#            project_id|name + period); altrimenti
#            analytics/reports/_adhoc/<YYYY-MM-DD-HH-MM>-<slug>.{json,md}.
#   stderr : human-readable log (non-blocking warnings; fail-loud on error).

#
# EXIT CODES
#   0 product report OR no-op (analytics.measurement.enabled absent/false, R.P3)
#   >0 error (invalid audience, rate_basis missing with human>0, format not
#      supportato senza motore, sub-tool fallito, ecc.)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# 0. Repo root resolution (the script can be invoked from any cwd)

# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# .claude/tools/analytics/ → repo root is 3 levels up.
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

AGENTIC_TOOL="$SCRIPT_DIR/compute-agentic-cost.sh"
HUMAN_TOOL="$SCRIPT_DIR/compute-human-cost.sh"
TIMELINE_TOOL="$SCRIPT_DIR/analyze-timeline.sh"

# ---------------------------------------------------------------------------
# 1. CLI argument parsing
# ---------------------------------------------------------------------------
SCOPE="{}"
AUDIENCE=""
FORMAT="md+json"
TYPE="cost_time_report"
SLUG=""
PRICING=""
RATES=""
CONFIG="factory.config.yaml"

usage() {
  echo "Uso: generate-report.sh --audience operativa|progetto|executive [--scope '<JSON>'] [--format md|json|md+json|pdf|html] [--type cost_time_report] [--slug <slug>] [--pricing <path>] [--rates <path>] [--config <path>]" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)    SCOPE="${2:-}"; [[ -z "$SCOPE" ]] && SCOPE="{}"; shift 2 ;;
    --audience) AUDIENCE="${2:-}"; shift 2 ;;
    --format)   FORMAT="${2:-md+json}"; shift 2 ;;
    --type)     TYPE="${2:-cost_time_report}"; shift 2 ;;
    --slug)     SLUG="${2:-}"; shift 2 ;;
    --pricing)  PRICING="${2:-}"; shift 2 ;;
    --rates)    RATES="${2:-}"; shift 2 ;;
    --config)   CONFIG="${2:-factory.config.yaml}"; shift 2 ;;
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
  echo "Tool generate_report richiede 'jq' per assemblaggio/validazione JSON. Installare jq (brew install jq / apt-get install jq)." >&2
  printf '{"status":"error","error":"missing prerequisite: jq"}\n'
  exit 1
fi

# Validates that --scope is well-formed JSON (fail-loud).
if ! printf '%s' "$SCOPE" | jq -e . >/dev/null 2>&1; then
  echo "ERRORE: --scope non è JSON valido: '$SCOPE'." >&2
  printf '{"status":"error","error":"invalid --scope JSON"}\n'
  exit 1
fi

# --audience required + closed domain (verbatim TSK-065): fail-loud on other values.
if [[ -z "$AUDIENCE" ]]; then
  echo "ERRORE: --audience è obbligatorio (operativa|progetto|executive). Vedi US-037 §Business Rules / ADR-023 §C." >&2; usage
  printf '{"status":"error","error":"missing required --audience"}\n'
  exit 1
fi
case "$AUDIENCE" in
  operativa|progetto|executive) : ;;
  *)
    echo "ERRORE: --audience '$AUDIENCE' non valido (ammessi: operativa|progetto|executive). Vedi US-037 §Business Rules." >&2
    printf '{"status":"error","error":"invalid --audience: %s"}\n' "$AUDIENCE"
    exit 1 ;;
esac

# --type: in EP-009 we only support cost_time_report (estimate/combined → EP-010).
if [[ "$TYPE" != "cost_time_report" ]]; then
  echo "ERRORE: --type '$TYPE' non supportato in EP-009 (solo 'cost_time_report'). I tipi 'project_estimate'/'combined'/'accuracy_retrospective' arrivano con EP-010. Vedi ADR-024 §A." >&2
  printf '{"status":"error","error":"unsupported type: %s"}\n' "$TYPE"
  exit 1
fi

# --format: closed domain. pdf|html require external engine → fail-loud if absent.
case "$FORMAT" in
  md|json|md+json) : ;;
  pdf|html)
    # Cerca un motore documentale (pandoc o wkhtmltopdf). Assenza ⇒ fail-loud (DoD).
    if ! command -v pandoc >/dev/null 2>&1 && ! command -v wkhtmltopdf >/dev/null 2>&1; then
      echo "ERRORE: formato '$FORMAT' richiede un motore documentale esterno (pandoc o wkhtmltopdf) non disponibile. Installalo o usa --format md+json (default). Vedi US-037 §Business Rules / ADR-024." >&2
      printf '{"status":"error","error":"format %s requires external document engine (pandoc/wkhtmltopdf)"}\n' "$FORMAT"
      exit 1
    fi
    echo "WARNING generate_report: formato '$FORMAT' richiesto; md+json sono comunque prodotti come baseline di audit. Il rendering $FORMAT è additivo." >&2 ;;
  *)
    echo "ERRORE: --format '$FORMAT' non valido (ammessi: md|json|md+json|pdf|html)." >&2
    printf '{"status":"error","error":"invalid --format: %s"}\n' "$FORMAT"
    exit 1 ;;
esac

# ---------------------------------------------------------------------------
# 3. YAML Helper — extracts analytics.measurement.<key> (same helper as tools

#    sibling: record-event.sh / compute-*-cost.sh / analyze-timeline.sh, no yq).
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
# 4. Master switch — no-op if the capability is turned off (R.P3, ADR-021 §F).
#    Missing file/block => disabled => exit 0 silent, 0 files written.
# ---------------------------------------------------------------------------
ENABLED="$(yaml_measurement_value "enabled" "$CONFIG")"
if [[ "$ENABLED" != "true" ]]; then
  echo "generate_report: analytics.measurement.enabled non è true (no-op, R.P3)." >&2
  exit 0
fi

# Opt-in flag for cost.agentic.cache_savings_pct subfield (telemetry
# compression v2.14). Default false: included only if true AND there are cache_read>0.

REPORT_CACHE="$(yaml_measurement_value "report_compression_savings" "$CONFIG")"
[[ -z "$REPORT_CACHE" ]] && REPORT_CACHE="false"

# Price drift threshold in days (>90 defaults). Note warning in notes[] if old.

PRICE_DRIFT_DAYS="$(yaml_measurement_value "pricing_drift_warn_days" "$CONFIG")"
[[ -z "$PRICE_DRIFT_DAYS" ]] && PRICE_DRIFT_DAYS="90"

# ---------------------------------------------------------------------------
# 5. Tool-level audience mapping (sibling tools use 'project', not 'project').
#    compute-human-cost.sh accepts executive|project|operational for masking N>=5.
# ---------------------------------------------------------------------------
case "$AUDIENCE" in
  progetto)  TOOL_AUDIENCE="project" ;;
  *)         TOOL_AUDIENCE="$AUDIENCE" ;;
esac

# ---------------------------------------------------------------------------
# 6. Construction of --filter for sub-tools starting from --scope.
#    I reader (cost/timeline) accettano {project_id?, period?:{from,to}, ...}.
#    The scope.period (e.g. "2026-Q2") is a human label; if it isn't already one
#    {from,to} pair we pass it only as a label in the report (the tools do
#    global aggregate). project_id is propagated as a real filter.
# ---------------------------------------------------------------------------
FILTER="$(printf '%s' "$SCOPE" | jq -c '{
  project_id: (.project_id // null),
  task_type:  (.task_type // null),
  period:     (if (.period | type) == "object" then .period else null end)
} | with_entries(select(.value != null))')"

# ---------------------------------------------------------------------------
# 7. Invoke the three deterministic readers. Propagate error with fail-loud (un
#    sub-tool that exits !=0 and is NOT the no-op at exit 0 is a real error).
#    Note: each sub-tool is also no-op with the capability turned off, but here we are
#    already inside enabled==true, so an exit 0 with empty stdout = 0 events.
# ---------------------------------------------------------------------------
run_subtool() {
  # $1 = path tool ; remainder = args. Print stdout; returns tool exit code.
  local tool="$1"; shift
  if [[ ! -x "$tool" ]]; then
    echo "ERRORE: sub-tool non eseguibile o assente: $tool. La capability è attiva ma il tool dipendente manca." >&2
    printf '{"status":"error","error":"missing sub-tool: %s"}\n' "$(basename "$tool")"
    exit 1
  fi
  "$tool" "$@"
}

AGENTIC_ARGS=( --filter "$FILTER" --config "$CONFIG" )
[[ -n "$PRICING" ]] && AGENTIC_ARGS+=( --pricing "$PRICING" )
HUMAN_ARGS=( --filter "$FILTER" --audience "$TOOL_AUDIENCE" --config "$CONFIG" )
[[ -n "$RATES" ]] && HUMAN_ARGS+=( --rates "$RATES" )
TIMELINE_ARGS=( --filter "$FILTER" --config "$CONFIG" )

set +e
AGENTIC_JSON="$(run_subtool "$AGENTIC_TOOL" "${AGENTIC_ARGS[@]}" 2>/dev/null)"; RC_A=$?
HUMAN_JSON="$(run_subtool "$HUMAN_TOOL" "${HUMAN_ARGS[@]}" 2>/dev/null)"; RC_H=$?
TIMELINE_JSON="$(run_subtool "$TIMELINE_TOOL" "${TIMELINE_ARGS[@]}" 2>/dev/null)"; RC_T=$?
set -e

for pair in "compute-agentic-cost:$RC_A" "compute-human-cost:$RC_H" "analyze-timeline:$RC_T"; do
  name="${pair%%:*}"; rc="${pair##*:}"
  if [[ "$rc" -ne 0 ]]; then
    echo "ERRORE: sub-tool $name è uscito con codice $rc. Report non producibile. Rilancia il tool isolato per il dettaglio dell'errore." >&2
    printf '{"status":"error","error":"sub-tool %s failed with exit %s"}\n' "$name" "$rc"
    exit 1
  fi
done

# A no-op tool (event store absent) outputs 0 with empty stdout → we treat as
# zero cost/timeline (neutral JSON default), no fail.

[[ -z "$AGENTIC_JSON" ]]  && AGENTIC_JSON='{"cost":0,"currency":"EUR","breakdown":{"per_model":{},"agentic_by_token_kind":{"input":0,"output":0,"cache_read":0,"cache_write":0},"per_tool":{}},"events_considered":0,"pricing_table_version":""}'
[[ -z "$HUMAN_JSON" ]]    && HUMAN_JSON='{"cost":0,"currency":"EUR","breakdown":{"per_role":{}},"events_considered":0,"rate_card_version":"","notes":[]}'
[[ -z "$TIMELINE_JSON" ]] && TIMELINE_JSON='{"lead":{"p50":0,"p85":0,"p95":0,"unit":"days"},"cycle":{"p50":0,"p85":0,"p95":0,"unit":"days"},"effort":{"p50":0,"p85":0,"p95":0,"unit":"hours"},"wait":{"p50":0,"p85":0,"p95":0,"unit":"days"},"bottlenecks":[],"operational":{"throughput_per_week":0,"wip_avg":0,"wip_max":0},"n_samples":0,"events_considered":0}'

# Validation: The three outputs must be well-formed JSON.
for nm in "agentic:$AGENTIC_JSON" "human:$HUMAN_JSON" "timeline:$TIMELINE_JSON"; do
  body="${nm#*:}"
  if ! printf '%s' "$body" | jq -e . >/dev/null 2>&1; then
    echo "ERRORE: output del sub-tool '${nm%%:*}' non è JSON valido. Report non producibile." >&2
    printf '{"status":"error","error":"sub-tool %s emitted invalid JSON"}\n' "${nm%%:*}"
    exit 1
  fi
done

# ---------------------------------------------------------------------------
# 8. rate_basis (ADR-023 §E) — the human cost block exposes it only if cost>0.
#    We recover it to validate the downstream invariant (fail-loud if human>0
#    senza rate_basis).
# ---------------------------------------------------------------------------
HUMAN_COST="$(printf '%s' "$HUMAN_JSON" | jq -r '.cost // 0')"
RATE_BASIS="$(printf '%s' "$HUMAN_JSON" | jq -r '.rate_basis // ""')"

# ---------------------------------------------------------------------------
# 9. pricing_table_version + price drift (>N days ⇒ warning in notes[]).

#    pricing_table_version can be a git-hash or a YYYY-MM-DD date (fallback
#    mtime, see compute-agentic-cost.sh §6). Check drift is only possible if
#    it can be interpreted as a date; if it's a hash, I derive the date from the commit.
# ---------------------------------------------------------------------------
PRICING_VERSION="$(printf '%s' "$AGENTIC_JSON" | jq -r '.pricing_table_version // ""')"
PRICE_DRIFT_NOTE=""
PRICING_AS_OF_DATE=""

if [[ -n "$PRICING_VERSION" ]]; then
  if [[ "$PRICING_VERSION" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    PRICING_AS_OF_DATE="$PRICING_VERSION"
  elif command -v git >/dev/null 2>&1 && git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    # version is a commit hash → gets the commit date (YYYY-MM-DD).
    PRICING_AS_OF_DATE="$(git -C "$REPO_ROOT" show -s --format=%cd --date=format:%Y-%m-%d "$PRICING_VERSION" 2>/dev/null || true)"
  fi
fi

if [[ -n "$PRICING_AS_OF_DATE" && "$PRICING_AS_OF_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  # Diff in days between today (UTC) and the pricing date. Portable macOS/Linux via jq.
  AGE_DAYS="$(jq -n --arg d "$PRICING_AS_OF_DATE" '
    (($d + "T00:00:00Z") | fromdateiso8601) as $then
    | ((now - $then) / 86400 | floor)' 2>/dev/null || echo "")"
  if [[ -n "$AGE_DAYS" && "$AGE_DAYS" =~ ^-?[0-9]+$ && "$AGE_DAYS" -gt "$PRICE_DRIFT_DAYS" ]]; then
    PRICE_DRIFT_NOTE="WARNING drift prezzi: pricing_table non aggiornata da ${AGE_DAYS} giorni (ultimo aggiornamento $PRICING_AS_OF_DATE, soglia ${PRICE_DRIFT_DAYS}gg). I costi potrebbero non riflettere le tariffe correnti. Vedi ADR-022 §F."
  fi
fi

# ---------------------------------------------------------------------------
# 10. Slug + periodo + routing storage (scope vs adhoc) — ADR-027 §A/§E.
#     scope_slug: --explicit slug, otherwise scope.project_id|name kebab-case.

#     periodo: scope.period (etichetta). Se manca project_id|name + period →
#     report ADHOC (analytics/reports/_adhoc/<YYYY-MM-DD-HH-MM>-<slug>).
# ---------------------------------------------------------------------------
kebab() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

SCOPE_ID="$(printf '%s' "$SCOPE" | jq -r '.project_id // .name // ""')"
SCOPE_PERIOD="$(printf '%s' "$SCOPE" | jq -r '
  if (.period | type) == "string" then .period
  elif (.period | type) == "object" then ((.period.from // "") + "_" + (.period.to // ""))
  else "" end' | sed -E 's/[^A-Za-z0-9._-]+/-/g; s/^-+//; s/-+$//')"

if [[ -z "$SLUG" ]]; then
  if [[ -n "$SCOPE_ID" ]]; then SLUG="$(kebab "$SCOPE_ID")"; else SLUG="adhoc"; fi
fi
[[ -z "$SLUG" ]] && SLUG="adhoc"

GENERATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STAMP="$(date -u +%Y-%m-%d-%H-%M)"

REPORTS_ROOT="$REPO_ROOT/analytics/reports"
if [[ -n "$SCOPE_ID" && -n "$SCOPE_PERIOD" ]]; then
  OUT_DIR="$REPORTS_ROOT/$SLUG"
  OUT_BASE="$SCOPE_PERIOD"
  STORAGE_KIND="scope"
else
  OUT_DIR="$REPORTS_ROOT/_adhoc"
  OUT_BASE="${STAMP}-${SLUG}"
  STORAGE_KIND="adhoc"
fi
OUT_JSON="$OUT_DIR/$OUT_BASE.json"
OUT_MD="$OUT_DIR/$OUT_BASE.md"

# ---------------------------------------------------------------------------
# 11. Assembly of the report in the ADR-024 §A scheme (measurement sub-assembly).
#     - cost  (§B): agentic/human/total/currency/rate_basis (+ breakdown audience).
#     - time (§C): pass-through of percentiles from analyze-timeline (never averages).
#     - split (§D): derivatives (never entered manually): agentic_pct/human_pct +
#                   agentic_share_of_cost + cache_savings_pct condizionale.
#     - notes[] REQUIRED (array, even empty): version pricing, drift, privacy.

#     Audience Privacy Masking (ADR-023 §C):
#       executive → no per-person/per-actor breakdown (only aggregates).

#       project → per_actor already suppressed upstream by compute-human-cost if N<th.
#       operativa → breakdown completo (+ operational), per_actor ammesso.
# ---------------------------------------------------------------------------
REPORT_JSON="$(jq -n \
  --argjson scope     "$SCOPE" \
  --argjson agentic   "$AGENTIC_JSON" \
  --argjson human     "$HUMAN_JSON" \
  --argjson timeline  "$TIMELINE_JSON" \
  --arg audience      "$AUDIENCE" \
  --arg type          "$TYPE" \
  --arg generated_at  "$GENERATED_AT" \
  --arg rate_basis    "$RATE_BASIS" \
  --arg report_cache  "$REPORT_CACHE" \
  --arg pricing_ver   "$PRICING_VERSION" \
  --arg price_drift   "$PRICE_DRIFT_NOTE" \
  --arg pricing_asof  "$PRICING_AS_OF_DATE" \
  '
  def round2: (. * 100 | round) / 100;

  ($agentic.cost // 0)                       as $agentic_cost
  | ($human.cost // 0)                       as $human_cost
  | ($agentic_cost + $human_cost)            as $total_cost
  | ($agentic.currency // $human.currency // "EUR") as $currency

  # ---- derivative splits (ADR-024 §D) — never entered manually ----
  | (if $total_cost > 0 then ($agentic_cost / $total_cost * 100 | round2) else 0 end) as $agentic_pct
  | (if $total_cost > 0 then ($human_cost   / $total_cost * 100 | round2) else 0 end) as $human_pct

  # ---- cache_savings_pct (telemetria compression v2.14) ----
  # Included ONLY if report_compression_savings: true AND there are cache_read > 0.
  # Formula concept: cache_read_cost / (input+output+cache_read) * 100.
  | ($agentic.breakdown.agentic_by_token_kind // {}) as $bk
  | (($bk.input // 0) + ($bk.output // 0) + ($bk.cache_read // 0)) as $cache_denom
  | (($bk.cache_read // 0) > 0) as $has_cache
  | (if ($report_cache == "true" and $has_cache and $cache_denom > 0)
       then (($bk.cache_read // 0) / $cache_denom * 100 | round2) else null end) as $cache_savings

  # ---- cost block (ADR-024 §B). rate_basis included only if human > 0. ----
  | (
      {
        agentic:  ($agentic_cost | round2),
        human:    ($human_cost   | round2),
        total:    ($total_cost   | round2),
        currency: $currency
      }
      + (if $human_cost > 0 then { rate_basis: $rate_basis } else {} end)
      # cache_savings_pct as agent cost detail sub-field; the
      # we also display in split (§D) for consumer ergonomics.
      + (if $cache_savings != null then { agentic_cache_savings_pct: $cache_savings } else {} end)
    ) as $cost_base

  # ---- audience-based cost breakdown (ADR-023 §C) ----
  # operational: full detail (per_model/per_token_kind/per_tool/per_role/per_actor).

  # project: per_role + per_actor (already masked upstream by compute-human-cost).

  # executive: no per-person breakdown; cost/split aggregates only.
  | (($human.breakdown.per_actor // null) as $per_actor
     | (if $per_actor != null then { human_by_actor: $per_actor } else {} end) as $actor_obj
     | if $audience == "operativa" then
         { breakdown: (
             {
               agentic_by_model:      ($agentic.breakdown.per_model // {}),
               agentic_by_token_kind: $bk,
               agentic_by_tool:       ($agentic.breakdown.per_tool // {}),
               human_by_role:         ($human.breakdown.per_role // {})
             } + $actor_obj )
         }
       elif $audience == "progetto" then
         { breakdown: (
             { human_by_role: ($human.breakdown.per_role // {}) } + $actor_obj )
         }
       else
         {}   # executive: no per-person breakdown (ADR-023 §C)
       end) as $cost_breakdown

  | ($cost_base + $cost_breakdown) as $cost

  # ---- split block (ADR-024 §D) ----
  | ({
      agentic_pct: $agentic_pct,
      human_pct:   $human_pct,
      agentic_share_of_cost: $agentic_pct
    }
    + (if $cache_savings != null then { cache_savings_pct: $cache_savings } else {} end)) as $split

  # ---- block time (ADR-024 §C) — pass-through percentiles (never averages) ----
  | {
      lead_p50_days:   ($timeline.lead.p50  // 0),
      lead_p85_days:   ($timeline.lead.p85  // 0),
      lead_p95_days:   ($timeline.lead.p95  // 0),
      cycle_p50_days:  ($timeline.cycle.p50 // 0),
      cycle_p85_days:  ($timeline.cycle.p85 // 0),
      cycle_p95_days:  ($timeline.cycle.p95 // 0),
      effort_p50_hours:($timeline.effort.p50 // 0),
      effort_p85_hours:($timeline.effort.p85 // 0),
      wait_p50_days:   ($timeline.wait.p50  // 0),
      wait_p85_days:   ($timeline.wait.p85  // 0),
      bottleneck:      ((($timeline.bottlenecks // []) | map(select(.bottleneck == true)) | first | .state) // "n/a"),
      bottleneck_state:((($timeline.bottlenecks // []) | map(select(.bottleneck == true)) | first | .state) // null),
      n_samples:       ($timeline.n_samples // 0)
    } as $time

  # ---- operational (operational audience only, US-037 §Business Rules) ----
  | (if $audience == "operativa" then
       ($timeline.operational // {})
       + { cost_per_task: (if ($timeline.n_samples // 0) > 0
                             then ($total_cost / ($timeline.n_samples) | round2)
                             else 0 end) }
     else null end) as $operational

  # ---- notes[] REQUIRED (even if empty) ----
  | ([]
     + (if $pricing_ver != "" then ["Pricing table version: " + $pricing_ver
                                    + (if $pricing_asof != "" then " (as-of " + $pricing_asof + ")" else "" end)] else [] end)
     + ($human.notes // [])
     + (if $price_drift != "" then [$price_drift] else [] end)
     + (if ($timeline.n_samples // 0) < 10
          then ["Time stats based on N=" + (($timeline.n_samples // 0)|tostring)
                + " samples; treat percentiles cautiously (ADR-024 §C)."] else [] end)
    ) as $notes

  # ---- documento Analytics Report (ADR-024 §A), additivo ----
  | {
      schema_version: "v1",
      scope:    $scope,
      type:     $type,
      audience: $audience,
      generated_at: $generated_at,
      generated_by: "generate-report.sh (tool EP-009 US-037)",
      cost:  $cost,
      time:  $time,
      split: $split
    }
    + (if $operational != null then { operational: $operational } else {} end)
    + { notes: $notes }
')"

if [[ -z "$REPORT_JSON" ]]; then
  echo "ERRORE: assemblaggio report fallito (jq)." >&2
  printf '{"status":"error","error":"report assembly failed"}\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 12. Hard invariant validation before writing (ADR-024 §A-D, ADR-023 §E).
# ---------------------------------------------------------------------------
# 12a. rate_basis required if cost.human > 0 (ADR-023 §E).
if [[ "$(printf '%s' "$REPORT_JSON" | jq -r '(.cost.human // 0) > 0')" == "true" ]]; then
  RB="$(printf '%s' "$REPORT_JSON" | jq -r '.cost.rate_basis // ""')"
  if [[ -z "$RB" ]]; then
    echo "ERRORE: cost.human > 0 ma cost.rate_basis assente. Invariante ADR-023 §E violata: nessun costo umano senza base tariffaria esplicita. Verifica analytics/rates.yaml.rate_basis." >&2
    printf '{"status":"error","error":"missing rate_basis with human cost > 0"}\n'
    exit 1
  fi
fi

# 12b. total = agentic + human (tolleranza floating ±0.01) — ADR-024 §B.
TOTAL_OK="$(printf '%s' "$REPORT_JSON" | jq -r '
  ((.cost.agentic // 0) + (.cost.human // 0)) as $sum
  | ((.cost.total // 0) - $sum | if . < 0 then -. else . end) <= 0.01')"
if [[ "$TOTAL_OK" != "true" ]]; then
  echo "ERRORE: cost.total != cost.agentic + cost.human (oltre tolleranza ±0.01). Invariante ADR-024 §B violata." >&2
  printf '{"status":"error","error":"cost.total mismatch"}\n'
  exit 1
fi

# 12c. executive must not contain actor_id raw (ADR-023 §C).
if [[ "$AUDIENCE" == "executive" ]]; then
  HAS_ACTOR="$(printf '%s' "$REPORT_JSON" | jq -r 'if (.cost.breakdown.human_by_actor // null) != null then "yes" else "no" end')"
  if [[ "$HAS_ACTOR" == "yes" ]]; then
    echo "ERRORE: audience executive non può esporre human_by_actor (actor_id raw). Invariante ADR-023 §C violata." >&2
    printf '{"status":"error","error":"executive report exposes raw actor_id"}\n'
    exit 1
  fi
fi

# 12d. notes must be an array (even empty) — ADR-024 §A.
if [[ "$(printf '%s' "$REPORT_JSON" | jq -r '.notes | type')" != "array" ]]; then
  echo "ERRORE: notes[] deve essere un array (anche vuoto). Invariante ADR-024 §A violata." >&2
  printf '{"status":"error","error":"notes must be an array"}\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 13. Human-readable MD rendering (always produced; JSON audit digest).
# ---------------------------------------------------------------------------
render_md() {
  printf '%s' "$REPORT_JSON" | jq -r --arg kind "$STORAGE_KIND" '
    def pct: (. // 0 | tostring) + "%";
    def money: (.cost.currency // "EUR") as $c | ($c);

    "# Analytics Report — " + (.type) + " (" + (.audience) + ")",
    "",
    "- schema_version: `" + .schema_version + "`",
    "- generated_at: `" + .generated_at + "`",
    "- generated_by: `" + .generated_by + "`",
    "- scope: `" + (.scope | tojson) + "`",
    "",
    "## Cost (" + (.cost.currency // "EUR") + ")",
    "",
    "| Voce | Valore |",
    "|---|---|",
    "| agentic | " + ((.cost.agentic // 0)|tostring) + " |",
    "| human | " + ((.cost.human // 0)|tostring) + " |",
    "| total | " + ((.cost.total // 0)|tostring) + " |",
    (if (.cost.rate_basis // "") != "" then "| rate_basis | " + .cost.rate_basis + " |" else empty end),
    (if (.cost.agentic_cache_savings_pct // null) != null then "| cache_savings_pct | " + ((.cost.agentic_cache_savings_pct)|tostring) + "% |" else empty end),
    "",
    "## Split umano / agentico",
    "",
    "- agentic: " + ((.split.agentic_pct // 0)|tostring) + "%",
    "- human: " + ((.split.human_pct // 0)|tostring) + "%",
    (if (.split.cache_savings_pct // null) != null then "- cache_savings: " + ((.split.cache_savings_pct)|tostring) + "%" else empty end),
    "",
    "## Time (percentili — mai medie)",
    "",
    "| Metrica | p50 | p85 | p95 |",
    "|---|---|---|---|",
    "| lead (days) | " + ((.time.lead_p50_days // 0)|tostring) + " | " + ((.time.lead_p85_days // 0)|tostring) + " | " + ((.time.lead_p95_days // 0)|tostring) + " |",
    "| cycle (days) | " + ((.time.cycle_p50_days // 0)|tostring) + " | " + ((.time.cycle_p85_days // 0)|tostring) + " | " + ((.time.cycle_p95_days // 0)|tostring) + " |",
    "| effort (hours) | " + ((.time.effort_p50_hours // 0)|tostring) + " | " + ((.time.effort_p85_hours // 0)|tostring) + " | — |",
    "| wait (days) | " + ((.time.wait_p50_days // 0)|tostring) + " | " + ((.time.wait_p85_days // 0)|tostring) + " | — |",
    "",
    "- bottleneck: `" + (.time.bottleneck // "n/a") + "`",
    "- n_samples: " + ((.time.n_samples // 0)|tostring),
    "",
    (if (.operational // null) != null then
      "## Operational\n\n"
      + "- throughput_per_week: " + ((.operational.throughput_per_week // 0)|tostring) + "\n"
      + "- wip_avg: " + ((.operational.wip_avg // 0)|tostring) + "\n"
      + "- cost_per_task: " + ((.operational.cost_per_task // 0)|tostring) + "\n"
     else empty end),
    "## Notes",
    "",
    ( (.notes // []) | if length == 0 then "- (nessuna nota)" else (.[] | "- " + .) end ),
    "",
    "---",
    "_Report " + $kind + " generato da generate-report.sh (EP-009, US-037). Schema ADR-024 §A; storage ADR-027 §A. Capability [[task-analytics-cost-estimation-capability]] §6._"
  '
}

# ---------------------------------------------------------------------------
# 14. Disk persistence (always md + json; ADR-027 §A logical single-writer).
# ---------------------------------------------------------------------------
mkdir -p "$OUT_DIR"
printf '%s\n' "$REPORT_JSON" | jq . > "$OUT_JSON"
render_md > "$OUT_MD"

REL_JSON="${OUT_JSON#"$REPO_ROOT"/}"
REL_MD="${OUT_MD#"$REPO_ROOT"/}"
echo "generate_report: report '$STORAGE_KIND' (audience=$AUDIENCE) scritto in $REL_JSON + $REL_MD." >&2

# pdf|html: if required and engine present, try best-effort additive rendering.
case "$FORMAT" in
  pdf|html)
    if command -v pandoc >/dev/null 2>&1; then
      OUT_DOC="$OUT_DIR/$OUT_BASE.$FORMAT"
      if pandoc "$OUT_MD" -o "$OUT_DOC" >/dev/null 2>&1; then
        echo "generate_report: rendering additivo $FORMAT prodotto in ${OUT_DOC#"$REPO_ROOT"/} (via pandoc)." >&2
      else
        echo "WARNING generate_report: rendering $FORMAT via pandoc fallito; md+json restano l'output autoritativo." >&2
      fi
    fi ;;
esac

# ---------------------------------------------------------------------------
# 15. Final output output to stdout — pure JSON of the report (schema ADR-024 §A).
# ---------------------------------------------------------------------------
printf '%s\n' "$REPORT_JSON" | jq .
exit 0
