#!/usr/bin/env bash
# =============================================================================
# migrate-jsonl-to-sqlite.sh — promote JSONL → SQLite store (EP-009, US-033, TSK-059)

# =============================================================================
#
# Part of the Task Analytics & Cost/Time Estimation (EP-009) capability, instance
# of the pattern [[thin-agents-fat-skills-refactor]]: deterministic TOOL (no LLM). Scripts
# one-shot to promote the event store from JSONL (default) to SQLite (opt-in for

# high volumes), as decided in ADR-021 §B/§C. Idempotent: re-executable without
# duplicate rows (dedup for ts+task_id).
#
# PATTERN.md §3 — optional canonical operation «Task Analytics – Event Recording».
# Wiki: wiki/concepts/task-analytics-cost-estimation-capability.md
#       [[task-analytics-cost-estimation-capability]]
# ADR-021 §B — SQLite schema table `events`; §C — JSONL ↔ SQLite exclusive switch,

#           runtime migration allowed only once via this script.

# ADR-023 §A — analytics tool registration in `.claude/tools/analytics/*` (no MCP),

#           stdout=JSON / stderr=log, semantic exit code, stateless.

#
# -----------------------------------------------------------------------------
# INPUT CONTRACT (CLI)
#   --events-dir <path> default "analytics/events" (relative to the root repo).

#   --db <path> default "analytics/events.db".
#
# OUTPUT CONTRACT (stdout, pure JSON)
#   {"status":"ok","db":"analytics/events.db","inserted":N,"skipped":M,"files":K}
#   {"status":"error","error":"<message>"}
#
# EXIT CODES 0 success | >0 error (prerequisite missing, absent, etc.)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

EVENTS_DIR="analytics/events"
DB="analytics/events.db"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --events-dir) EVENTS_DIR="${2:-analytics/events}"; shift 2 ;;
    --db)         DB="${2:-analytics/events.db}"; shift 2 ;;
    *)
      echo "ERRORE: argomento sconosciuto '$1'. Uso: migrate-jsonl-to-sqlite.sh [--events-dir <path>] [--db <path>]" >&2
      printf '{"status":"error","error":"unknown argument: %s"}\n' "$1"
      exit 1 ;;
  esac
done

[[ "$EVENTS_DIR" != /* ]] && EVENTS_DIR="$REPO_ROOT/$EVENTS_DIR"
[[ "$DB" != /* ]] && DB="$REPO_ROOT/$DB"

# Prerequisiti — fail-loud.
for bin in jq sqlite3; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Tool migrate-jsonl-to-sqlite richiede '$bin'. Installarlo (brew/apt)." >&2
    printf '{"status":"error","error":"missing prerequisite: %s"}\n' "$bin"
    exit 1
  fi
done

if [[ ! -d "$EVENTS_DIR" ]]; then
  echo "ERRORE: events dir non trovata: $EVENTS_DIR" >&2
  printf '{"status":"error","error":"events dir not found"}\n'
  exit 1
fi

# DDL idempotente (schema §B ADR-021), allineato a record-event.sh.
sqlite3 "$DB" <<'SQL'
CREATE TABLE IF NOT EXISTS events (
  rowid       INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     TEXT    NOT NULL,
  project_id  TEXT    NOT NULL,
  parent_id   TEXT,
  actor_type  TEXT    NOT NULL CHECK(actor_type IN ('agent', 'human')),
  actor_id    TEXT    NOT NULL,
  task_type   TEXT    NOT NULL,
  state       TEXT    NOT NULL CHECK(state IN ('started', 'finished', 'blocked')),
  ts          TEXT    NOT NULL,
  model       TEXT,
  tokens_input        INTEGER DEFAULT 0,
  tokens_output       INTEGER DEFAULT 0,
  tokens_cache_read   INTEGER DEFAULT 0,
  tokens_cache_write  INTEGER DEFAULT 0,
  tool_calls  TEXT,
  extras      TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_task ON events(task_id);
CREATE INDEX IF NOT EXISTS idx_events_project_ts ON events(project_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_task_type_ts ON events(task_type, ts);
SQL

sql_q() { printf '%s' "$1" | sed "s/'/''/g"; }

INSERTED=0
SKIPPED=0
FILES=0

shopt -s nullglob
for f in "$EVENTS_DIR"/*.jsonl; do
  FILES=$((FILES + 1))
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    # line malformata → skip difensivo (no fail-loud sull'intera migrazione).
    if ! printf '%s' "$line" | jq -e . >/dev/null 2>&1; then
      SKIPPED=$((SKIPPED + 1)); continue
    fi
    TASK_ID="$(printf '%s' "$line" | jq -r '.task_id // ""')"
    TS="$(printf '%s' "$line" | jq -r '.ts // ""')"
    [[ -z "$TASK_ID" || -z "$TS" ]] && { SKIPPED=$((SKIPPED + 1)); continue; }

    # Idempotent dedup for (ts, task_id).
    EXISTS="$(sqlite3 "$DB" "SELECT COUNT(*) FROM events WHERE ts='$(sql_q "$TS")' AND task_id='$(sql_q "$TASK_ID")';")"
    if [[ "$EXISTS" != "0" ]]; then
      SKIPPED=$((SKIPPED + 1)); continue
    fi

    PROJECT_ID="$(printf '%s' "$line" | jq -r '.project_id // ""')"
    PARENT_ID="$(printf '%s' "$line" | jq -r '.parent_id // ""')"
    ACTOR_TYPE="$(printf '%s' "$line" | jq -r '.actor_type // ""')"
    ACTOR_ID="$(printf '%s' "$line" | jq -r '.actor_id // ""')"
    TASK_TYPE="$(printf '%s' "$line" | jq -r '.task_type // ""')"
    STATE="$(printf '%s' "$line" | jq -r '.state // ""')"
    MODEL="$(printf '%s' "$line" | jq -r '.model // ""')"
    TOK_IN="$(printf '%s' "$line" | jq -r '.tokens.input // 0')"
    TOK_OUT="$(printf '%s' "$line" | jq -r '.tokens.output // 0')"
    TOK_CR="$(printf '%s' "$line" | jq -r '.tokens.cache_read // 0')"
    TOK_CW="$(printf '%s' "$line" | jq -r '.tokens.cache_write // 0')"
    TOOL_CALLS="$(printf '%s' "$line" | jq -c '.tool_calls // []')"
    EXTRAS="$(printf '%s' "$line" | jq -c '.extras // null')"

    sqlite3 "$DB" <<SQL
INSERT INTO events
  (task_id, project_id, parent_id, actor_type, actor_id, task_type, state, ts,
   model, tokens_input, tokens_output, tokens_cache_read, tokens_cache_write,
   tool_calls, extras)
VALUES
  ('$(sql_q "$TASK_ID")', '$(sql_q "$PROJECT_ID")', '$(sql_q "$PARENT_ID")',
   '$(sql_q "$ACTOR_TYPE")', '$(sql_q "$ACTOR_ID")', '$(sql_q "$TASK_TYPE")',
   '$(sql_q "$STATE")', '$(sql_q "$TS")', '$(sql_q "$MODEL")',
   $TOK_IN, $TOK_OUT, $TOK_CR, $TOK_CW,
   '$(sql_q "$TOOL_CALLS")', '$(sql_q "$EXTRAS")');
SQL
    INSERTED=$((INSERTED + 1))
  done < "$f"
done
shopt -u nullglob

REL_DB="${DB#$REPO_ROOT/}"
echo "migrate-jsonl-to-sqlite: $INSERTED inseriti, $SKIPPED saltati, $FILES file processati → $REL_DB." >&2
printf '{"status":"ok","db":"%s","inserted":%d,"skipped":%d,"files":%d}\n' "$REL_DB" "$INSERTED" "$SKIPPED" "$FILES"
exit 0
