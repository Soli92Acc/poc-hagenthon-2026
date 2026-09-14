# Analytics Instrumentation — dev-protocol (dettaglio, opt-in v2.19+)

**Ambito**: schema payload espanso, comandi eseguibili completi (Punti 1-4) e comportamento
in caso di errore di scrittura. Class B (opt-in, attivo solo se
`analytics.measurement.enabled: true` AND `dogfooding.enabled: true`). I comandi di Fase 2
e Fase 5 (Punti 1-2) sono riportati anche inline nel corpo di `dev-protocol.md` per
quick-use. Questa foglia è la fonte autorevole per Punti 3-4 e schema payload completo.

---

## Gate

`factory.config.yaml.analytics.measurement.enabled: true` AND
`factory.config.yaml.analytics.dogfooding.enabled: true`.

SE entrambi `false` (default factory derivate): EARLY RETURN — 0 side effect, 0 eventi scritti.
A `measurement.enabled: true` ma `dogfooding.enabled: false`: cabling no-op (comportamento v2.18).

**Single-writer**: il tool `tools/analytics/record-event.sh` è l'UNICO writer di
`analytics/events/<YYYY-MM>.jsonl`. I punti di iniezione sotto DEVONO passare per quel tool.
Pattern R.G5 (single-writer per side-channel). [^src: design_&_architecture/decisions/ADR-039.md §B]

**PII invariante**: i payload NON contengono mai: contenuto di file, contenuto prompt LLM,
env vars, segreti, PII utente. Solo metadati allowlist-compliant (ADR-040 §A).

---

## Punto 1 — Transizione `state: started` (Fase 2: todo → in-progress)

**Trigger**: dev-agent inizia l'esecuzione di un TSK (status: todo → in-progress).
**Granularità**: attivo per `analytics.granularity` in `{tsk, wave, tool}` (tutti i livelli).
**Payload** (campi allowlist-compliant ADR-040 §A):
```json
{
  "task_id": "<TSK-NNN-slug>",
  "project_id": "<factory-slug>",
  "actor_type": "agent",
  "actor_id": "<be-dev|fe-dev|db-dev|qa-dev>",
  "task_type": "<layer: be|fe|db|qa|docs|...>",
  "state": "started",
  "ts": "<ISO-8601 UTC con Z>",
  "tokens": {"input": 0, "output": 0, "cache_read": 0, "cache_write": 0},
  "model": "<current-model-id>",
  "tool_calls": []
}
```
**Comando eseguibile** (copia, sostituisci i placeholder, esegui via Bash):
```bash
_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
_REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"
bash "$_REPO_ROOT/tools/analytics/record-event.sh" \
  --event "{\"task_id\":\"<TSK-NNN-slug>\",\"project_id\":\"soli-multi-agents-factory\",\"actor_type\":\"agent\",\"actor_id\":\"<agent-slug>\",\"task_type\":\"<layer>\",\"state\":\"started\",\"ts\":\"$_TS\",\"tokens\":{\"input\":0,\"output\":0,\"cache_read\":0,\"cache_write\":0},\"model\":\"claude-sonnet-4-6\",\"tool_calls\":[]}" \
  2>/dev/null || true
```

---

## Punto 2 — Transizione `state: finished` (Fase 5: in-progress → done)

**Trigger**: dev-agent dichiara `status: done` sul TSK dopo DoD superata.
**Granularità**: attivo per `analytics.granularity` in `{tsk, wave, tool}`.
**Payload**: payload di `started` + estensioni:
```json
{
  "elapsed_ms": "<wall-clock ms da started>",
  "tokens": {"input": N, "output": M, "cache_read": K, "cache_write": J},
  "tool_calls": [...]
}
```
**Comando eseguibile**:
```bash
_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
_REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"
bash "$_REPO_ROOT/tools/analytics/record-event.sh" \
  --event "{\"task_id\":\"<TSK-NNN-slug>\",\"project_id\":\"soli-multi-agents-factory\",\"actor_type\":\"agent\",\"actor_id\":\"<agent-slug>\",\"task_type\":\"<layer>\",\"state\":\"finished\",\"ts\":\"$_TS\",\"tokens\":{\"input\":0,\"output\":0,\"cache_read\":0,\"cache_write\":0},\"model\":\"claude-sonnet-4-6\",\"tool_calls\":[]}" \
  2>/dev/null || true
```

---

## Punto 3 — Transizione `state: blocked` (Fase 4: DoD fallisce o blocked_by dichiarato)

**Trigger**: dev-agent dichiara `blocked_by: [...]` nel frontmatter TSK O `pending_clarification`.
**Granularità**: attivo per `analytics.granularity` in `{tsk, wave, tool}`.
**Payload**: payload di `started` + estensioni:
```json
{
  "blocked_reason": "<slug strutturato max 200 char, es. dep-unresolved — NO testo libero ADR-040 §B cat 7>",
  "blocking_artifacts": ["<path-file-1>", "<path-file-2>"]
}
```
**Comando eseguibile**:
```bash
_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
_REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"
bash "$_REPO_ROOT/tools/analytics/record-event.sh" \
  --event "{\"task_id\":\"<TSK-NNN-slug>\",\"project_id\":\"soli-multi-agents-factory\",\"actor_type\":\"agent\",\"actor_id\":\"<agent-slug>\",\"task_type\":\"<layer>\",\"state\":\"blocked\",\"ts\":\"$_TS\",\"tokens\":{\"input\":0,\"output\":0,\"cache_read\":0,\"cache_write\":0},\"model\":\"claude-sonnet-4-6\",\"tool_calls\":[],\"blocked_reason\":\"<slug-dep-max-200-char>\"}" \
  2>/dev/null || true
```

---

## Punto 4 — Transizione `state: aborted` (ADR-042 §A)

**Trigger**: TSK interrotto mid-sprint per timeout, override umano, errore non recuperabile.
**Granularità**: attivo per `analytics.granularity` in `{tsk, wave, tool}`.
**Payload**: payload di `started` + estensioni:
```json
{
  "aborted_reason": "<slug strutturato max 200 char — NO testo libero ADR-040 §B cat 7>"
}
```
**Comando eseguibile**:
```bash
_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
_REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"
bash "$_REPO_ROOT/tools/analytics/record-event.sh" \
  --event "{\"task_id\":\"<TSK-NNN-slug>\",\"project_id\":\"soli-multi-agents-factory\",\"actor_type\":\"agent\",\"actor_id\":\"<agent-slug>\",\"task_type\":\"<layer>\",\"state\":\"aborted\",\"ts\":\"$_TS\",\"tokens\":{\"input\":0,\"output\":0,\"cache_read\":0,\"cache_write\":0},\"model\":\"claude-sonnet-4-6\",\"tool_calls\":[],\"aborted_reason\":\"<slug-max-200-char>\"}" \
  2>/dev/null || true
```

---

## Comportamento in caso di errore di scrittura

SE la scrittura a `analytics/events/<YYYY-MM>.jsonl` fallisce (disk full, lock contention >5s):
- Il dev-protocol **prosegue** il workflow normale (fail-open sul workflow osservato).
- Aggiunge WARNING in `wiki/log.md`: `[analytics-write-fail] TSK-NNN state=<state> at <ts>`.
- NON blocca il TSK. NON riprova la scrittura (no retry loop).

[^src: design_&_architecture/decisions/ADR-038.md §B — 4 punti di iniezione TSK (started/finished/blocked/aborted), default granularity wave]
[^src: design_&_architecture/decisions/ADR-039.md §A §B §C — single-writer record-event.sh, dedup hash compound, side-channel R.G5]
[^src: design_&_architecture/decisions/ADR-040.md §A §B — payload allowlist-compliant, PII invariante, slug strutturato cat 7]
[^src: design_&_architecture/decisions/ADR-042.md §A §B — nuovo enum aborted/wave_started/wave_completed, schema extension senza breaking]
[^src: management/kanban/EP-013-analytics-dogfooding-instrumentation/US-052-cabling-record-task-event-dev-protocol-scheduler/US-052.md §Business Rules — gate measurement+dogfooding, fail-open scrittura]
