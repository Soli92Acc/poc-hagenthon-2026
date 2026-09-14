#!/usr/bin/env bash
# =============================================================================
# run-pert.sh — run_pert deterministic tool (EP-010, US-041, TSK-072)
# =============================================================================
#
# Part of the Task Analytics & Cost/Time Estimation capability (EP-010, face
# forecast), instance of the pattern [[thin-agents-fat-skills-refactor]]: this is the TOOL
# (deterministic logic, no LLM). Implement Method 2 — PERT three-point

# estimation. The tool DOES NOT think about the methodology (which method to apply, which
# similarity, which contingency): that choice is the scope of the `project-estimation` skill
# (US-040) and the `estimation-analyst` agent (US-043). This tool receives O/M/P voices
# ed emette attesa + varianza + std + percentili approssimati. JSON puro su stdout.
#
# PATTERN.md §3 — optional canonical operation «Project Estimation» / «PERT».
# Wiki: wiki/concepts/task-analytics-cost-estimation-capability.md
#       [[task-analytics-cost-estimation-capability]] §Enterprise estimate (forecast face).
#       wiki/syntheses/task-analytics-estimation-methods.md §Metodo 2 — PERT three-point.
# ADR-025 §E — PERT scope ingestion: explicit (default) + `--from-kanban` opt-in.

#           §E punto 5: formula PERT verbatim attesa=(O+4M+P)/6, varianza=((P-O)/6)^2.
# ADR-026 — separate Monte Carlo runtime (run-monte-carlo.py); here only the percentiles
#           approximated by normal distribution (reference to Monte Carlo for precision).
#
# INVARIANT «never punctual number» (PATTERN §3, ADR-024/025): each estimate is an interval.
#   Even with just one entry at std=0 the total shows p50/p85/p95 (possibly equal).
#   The tool NEVER outputs a `mean`/`average`/`average` field as the primary value:
#   `expected` is the expected PERT (three-point weighted average), ALWAYS accompanied by std and
#   percentiles — never presented as a point estimate.
#
# FORMULE VERBATIM (synthesis §Metodo 2 / ADR-025 §E punto 5):
#   attesa   = (O + 4M + P) / 6
#   varianza = ((P - O) / 6)^2
#   std      = sqrt(varianza) = |P - O| / 6
# Aggregazione progetto (somma di voci indipendenti):
#   attesa_totale   = Σ attesa_i
#   varianza_totale = Σ varianza_i
#   std_totale      = sqrt(varianza_totale)
# Approximate percentiles (normal distribution of the total, central limit theorem):
#   p50 ≈ attesa_totale
#   p85 ≈ attesa_totale + 1.04  * std_totale
#   p95 ≈ attesa_totale + 1.645 * std_totale
#
# DOCUMENTED LIMIT (concept §Limits): the tool DOES NOT add person-hours as time
#   calendar. If the entries are in `unit: hours`, the output remains in hours and exposes the
#   note "Effort, not calendar time". The effort→calendar conversion is human scope.
#
# -----------------------------------------------------------------------------
# INPUT CONTRACT (CLI)
#   --voices '<JSON>' JSON list of voices. Shape for voice:


#                          {name, O: float, M: float, P: float, unit?: "days"|"hours"}.
#                          optional `unit` for voice; default = global --unit (days).

#   --unit <days|hours> default unit for entries without a `unit` field (default days).

#   --config <path> default "factory.config.yaml" (ADR-023 §A contract).

#
#   NB: `--from-kanban=<EP-id>` (ADR-025 §E mode 2) is self-decomposition data-driven
#       which requires event store EP-009 and skill US-040 to derive O/M/P from
#       percentiles of the reference class: it is NOT the scope of this numerical tool (R: the tools
#       they don't think about the methodology). The `project-estimation` skill derives O/M/P and then
#       invoke this tool in explicit `--voices` mode. See ADR-025 §E + US-040.
#
# OUTPUT CONTRACT (stdout, pure JSON) — schema US-041 §Tool run_pert / TSK-072:
#   {
#     "voices": [{ "name", "expected", "variance", "std", "unit" }],
#     "total": {
#       "expected", "std", "variance",
#       "p50_approx", "p85_approx", "p95_approx",
#       "unit",
#       "approximation_note"
#     }
#   }
#   If unit == hours, total.effort_note = "Effort, not calendar time".
#
# STDERR
#   human-readable log (fail-loud on error; quiet on success).
#
# EXIT CODES
#   0 estimate produced OR no-op (analytics.estimation.enabled absent/false, R.P3)
#   >0 error (missing prerequisite, invalid/missing voices, non-numeric O/M/P,

#      vincolo O<=M<=P violato)
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
VOICES=""
UNIT="days"
CONFIG="factory.config.yaml"

usage() {
  echo "Uso: run-pert.sh --voices '<JSON>' [--unit days|hours] [--config <path>]" >&2
  echo "  voice shape: {\"name\":\"...\",\"O\":2,\"M\":4,\"P\":8,\"unit\":\"days\"}" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --voices)
      VOICES="${2:-}"; shift 2 ;;
    --voices=*)
      VOICES="${1#--voices=}"; shift ;;
    --unit)
      UNIT="${2:-days}"; shift 2 ;;
    --unit=*)
      UNIT="${1#--unit=}"; shift ;;
    --config)
      CONFIG="${2:-factory.config.yaml}"; shift 2 ;;
    --config=*)
      CONFIG="${1#--config=}"; shift ;;
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

# Valid --unit (days|hours).
if [[ "$UNIT" != "days" && "$UNIT" != "hours" ]]; then
  echo "ERRORE: --unit deve essere 'days' o 'hours' (trovato: '$UNIT')." >&2
  printf '{"status":"error","error":"invalid --unit: %s"}\n' "$UNIT"
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Check prerequisiti — fail-loud (ADR-023 §A contract)
# ---------------------------------------------------------------------------
if ! command -v jq >/dev/null 2>&1; then
  echo "Tool run_pert richiede 'jq' per il parsing/calcolo JSON. Installare jq (brew install jq / apt-get install jq)." >&2
  printf '{"status":"error","error":"missing prerequisite: jq"}\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. YAML Helper — extract values ​​from analytics.estimation.<key> (no yq, no deps).
#    Same helper pattern as analyze-timeline.sh / compute-agentic-cost.sh,

#    but on the `estimation` block (prediction face EP-010) instead of `measurement`.
# ---------------------------------------------------------------------------
yaml_estimation_value() {
  # $1 = key under analytics.estimation ; $2 = file
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
      if (line ~ /^analytics:/)    { in_a=1; a_ind=ind; in_e=0; next }
      if (in_a && ind<=a_ind && line !~ /^analytics:/) { in_a=0; in_e=0 }
      if (in_a && line ~ /^estimation:/) { in_e=1; e_ind=ind; next }
      if (in_e && ind<=e_ind) { in_e=0 }
      if (in_e && line ~ ("^" want ":")) {
        v=line; sub(("^" want ":[[:space:]]*"), "", v)
        gsub(/^["'"'"']|["'"'"']$/, "", v)
        print v; exit
      }
    }
  ' "$file"
}

# ---------------------------------------------------------------------------
# 4. Master switch — no-op if the capability is turned off (R.P3, ADR-025 §G).
#    Missing file/block => disabled => exit 0 silent, 0 JSON output.
#    Backward-compat total: factory v2.17- without the estimation = no-op block.
# ---------------------------------------------------------------------------
ENABLED="$(yaml_estimation_value "enabled" "$CONFIG")"
if [[ "$ENABLED" != "true" ]]; then
  echo "run_pert: analytics.estimation.enabled non è true (no-op, R.P3)." >&2
  exit 0
fi

# ---------------------------------------------------------------------------
# 5. Validation of input voices — fail-loud (R.P3: missing input => fail-loud,
#    NOT dummy output). The capability is active but the scope is missing.
# ---------------------------------------------------------------------------
if [[ -z "$VOICES" ]]; then
  echo "ERRORE: --voices mancante. run_pert richiede una lista di voci O/M/P. Vedi US-041 §Tool run_pert." >&2
  usage
  printf '{"status":"error","error":"missing --voices"}\n'
  exit 1
fi

# --voices must be well-formed JSON.
if ! printf '%s' "$VOICES" | jq -e . >/dev/null 2>&1; then
  echo "ERRORE: --voices non è JSON valido: '$VOICES'." >&2
  printf '{"status":"error","error":"invalid --voices JSON"}\n'
  exit 1
fi

# Must be a non-empty array.
if ! printf '%s' "$VOICES" | jq -e 'type == "array" and length > 0' >/dev/null 2>&1; then
  echo "ERRORE: --voices deve essere un array JSON non vuoto di voci {name,O,M,P}." >&2
  printf '{"status":"error","error":"voices must be a non-empty array"}\n'
  exit 1
fi

# Each entry must have numeric O/M/P. Fail-loud with index of the offending voice.
VALIDATION="$(printf '%s' "$VOICES" | jq -r '
  to_entries
  | map(
      .key as $i | .value as $v
      | if ($v.O == null or ($v.O | type) != "number"
            or $v.M == null or ($v.M | type) != "number"
            or $v.P == null or ($v.P | type) != "number")
        then "ERR_NUMERIC:\($i)"
        elif ($v.O > $v.M or $v.M > $v.P)
        then "ERR_ORDER:\($i):O=\($v.O),M=\($v.M),P=\($v.P)"
        else empty
        end
    )
  | first // "OK"
')"

case "$VALIDATION" in
  OK) : ;;
  ERR_NUMERIC:*)
    idx="${VALIDATION#ERR_NUMERIC:}"
    echo "ERRORE: voce all'indice $idx ha O/M/P mancanti o non numerici. Ogni voce richiede O,M,P come numeri. Vedi US-041 §Tool run_pert." >&2
    printf '{"status":"error","error":"voice %s has non-numeric or missing O/M/P"}\n' "$idx"
    exit 1 ;;
  ERR_ORDER:*)
    rest="${VALIDATION#ERR_ORDER:}"
    idx="${rest%%:*}"; vals="${rest#*:}"
    echo "ERRORE: voce all'indice $idx viola il vincolo O<=M<=P ($vals). PERT richiede ottimistico<=probabile<=pessimistico." >&2
    printf '{"status":"error","error":"voice %s violates O<=M<=P: %s"}\n' "$idx" "$vals"
    exit 1 ;;
  *)
    echo "ERRORE: validazione voices fallita (output inatteso: $VALIDATION)." >&2
    printf '{"status":"error","error":"voices validation failed"}\n'
    exit 1 ;;
esac

# ---------------------------------------------------------------------------
# 6. PERT calculation — verbatim formulas in a single deterministic jq program.
#    For each entry: expected=(O+4M+P)/6, variance=((P-O)/6)^2, std=sqrt(variance).
#    Totale: somma attese + somma varianze → std_totale=sqrt(varianza_totale).
#    Percentiles from the total assuming normality (z85=1.04, z95=1.645).
#    `unit` for entry: entry field if present, otherwise global --unit.
#    Determinism: same entries → same output (no randomness, no tailed average).

# ---------------------------------------------------------------------------
RESULT="$(printf '%s' "$VOICES" | jq \
  --arg default_unit "$UNIT" '

  # Arrotondamenti deterministici (no falsa precisione).
  def round2: (. * 100 | round) / 100;
  def round4: (. * 10000 | round) / 10000;

  # Standard normal z-score percentiles (one-sided, upper tail).
  1.04  as $z85
  | 1.645 as $z95

  | ([ .[]
       | (.O) as $O | (.M) as $M | (.P) as $P
       | ((.unit // $default_unit)) as $u
       | (($O + 4*$M + $P) / 6) as $expected
       | (((($P - $O) / 6)) | (. * .)) as $variance
       | ($variance | sqrt) as $std
       | {
           name: (.name // "(unnamed)"),
           expected: ($expected | round2),
           variance: ($variance | round4),
           std: ($std | round2),
           unit: $u
         }
     ]) as $voices

  # Aggregazione progetto: somma attese + somma varianze (voci indipendenti).
  | ([ $voices[] | .expected ] | add) as $sum_expected_rounded
  | ([ $voices[] | .variance ] | add) as $sum_variance_rounded
  | ($sum_variance_rounded | sqrt) as $std_total

  # unit of the total: consistent only if all entries share the unit.
  | ([ $voices[] | .unit ] | unique) as $units
  | (if ($units | length) == 1 then $units[0] else "mixed" end) as $total_unit

  | {
      voices: $voices,
      total: ({
        expected:  ($sum_expected_rounded | round2),
        variance:  ($sum_variance_rounded | round4),
        std:       ($std_total | round2),
        p50_approx: ($sum_expected_rounded | round2),
        p85_approx: (($sum_expected_rounded + $z85 * $std_total) | round2),
        p95_approx: (($sum_expected_rounded + $z95 * $std_total) | round2),
        unit: $total_unit,
        approximation_note: "Percentili derivati da media + std assumendo distribuzione normale (z85=1.04, z95=1.645); per stima rigorosa usare Monte Carlo su questi parametri (run-monte-carlo.py, TSK-073 / ADR-026)."
      }
      # Limite documentato (concept §Limiti): ore-persona != calendario.
      + (if $total_unit == "hours"
           then { effort_note: "Effort, non calendar time. La conversione effort→calendario (capacità team, parallelismo) è scope umano, non del tool." }
           else {} end)
      + (if $total_unit == "mixed"
           then { unit_warning: "Voci con unit eterogenee (days/hours): il totale aggrega quantità non omogenee. Normalizzare lo scope a una sola unit prima di sommare." }
           else {} end))
    }
')"

if [[ -z "$RESULT" ]]; then
  echo "ERRORE: calcolo PERT fallito (jq). Verifica lo schema delle voci (US-041 §Tool run_pert)." >&2
  printf '{"status":"error","error":"pert computation failed"}\n'
  exit 1
fi

# ---------------------------------------------------------------------------
# 7. Emissione output finale — JSON puro su stdout.
#    Invariant «never punctual number»: the output always exposes p50/p85/p95; with
#    a single entry at std=0 the three percentiles coincide (collapsed distribution),

#    but three distinct fields remain (the skill US-040 marks confidence: very_low).
# ---------------------------------------------------------------------------
N_VOICES="$(printf '%s' "$VOICES" | jq -r 'length')"
echo "run_pert: $N_VOICES voci processate (unit default: $UNIT)." >&2

printf '%s\n' "$RESULT"
exit 0
