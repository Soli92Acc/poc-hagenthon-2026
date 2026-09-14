---
skill: lint-checks-kanban
part_of: lint-checks (modular)
family: kanban
parent: lint-checks
description: "Check lint su EP/US/TSK frontmatter e struttura kanban — check-family kanban"
---

# Lint Checks — Kanban

> Parte del sistema modulare lint-checks. File principale: `.claude/skills/lint-checks.md`
> Contiene: Check 3 (integrità frontmatter EP/US/TSK), Check 4g (coerenza scheduler/depends_on), Check 4b (coerenza Q ↔ kanban), Check 4m (coerenza risk_classification ↔ Risk Registry)

Check ordinati per severità: ERROR → WARNING → INFO.

---

## Check 3 — Integrità kanban

Per ogni `management/kanban/EP-*/EP-*.md`:
- Frontmatter ha `id`, `title`, `status`, `priority`, `confidence`? Altrimenti **ERROR**.
- `id` matcha il pattern `EP-XXX` con XXX = nome cartella? Altrimenti **ERROR**.

Per ogni `US-*.md`:
- Frontmatter ha `id`, `title`, `role`, `priority`, `status`, `wiki_page`?
- `wiki_page` punta a file esistente? Altrimenti **ERROR**.

Per ogni `TSK-*.md` (v2.7):
- Frontmatter ha `id`, `sprint`, `layer`, `consumer`, `priority`, `estimate`, `status`?
- `id` univoco globalmente (cross-cartelle)?
- `layer` ∈ `{be, fe, db, qa, infra}` → altrimenti **ERROR invalid-layer**.
- `consumer` ∈ `{agent, human}` → altrimenti **ERROR invalid-consumer**.
- Campo legacy `team:` ancora presente → **WARNING deprecated-field** (v2.7,
  migrazione manuale a `layer:`).

### 4g — Coerenza scheduler/depends_on (v2.11, PATTERN §18)

Solo se almeno un EP/US/TSK in `management/kanban/**` ha frontmatter `depends_on:` valorizzato:

- Per ogni artefatto con `depends_on: [...]`:
  - Ogni `<id>` nella lista deve avere lo stesso prefisso dell'artefatto host (EP→EP, US→US, TSK→TSK). Cross-tipo (es. TSK in `depends_on` di US) → **ERROR `invalid-depends-on-type`**.
  - Ogni `<id>` deve essere file esistente in `management/kanban/**/<id>.md`. Assente → **WARNING `orphan-depends-on`** (referenza a artefatto eliminato o rinominato).
  - Auto-riferimento (`depends_on` contiene il proprio `id`) → **ERROR `self-depends-on`**.
- **Cycle detection**: costruisci DAG `E_dep` sull'insieme {EP, US, TSK} e applica toposort (algoritmo di Kahn). Se rimangono nodi con `in_degree > 0` a fine algoritmo → ciclo presente → **ERROR `depends-on-cycle`** con lista dei nodi nel ciclo. Non `heal-eligible` (richiede giudizio semantico).
- **Drift body ↔ frontmatter** (solo TSK): se il body contiene `## Dependencies\n- TSK-XXX` ma `TSK-XXX` non è in `depends_on:` frontmatter (o viceversa) → **WARNING `dependencies-drift`** (frontmatter prevale per lo scheduler; rinconciliare a mano).
- **`code_path` validation** (solo TSK con `code_path:` valorizzato):
  - Ogni glob deve essere stringa non vuota. Glob vuoto → **WARNING `empty-code-path-glob`**.
  - Se `factory.config.yaml.scheduler.code_path_conflict: strict` e ≥ 2 TSK al "level 0" (depends_on vuoto o tutti soddisfatti) condividono lo stesso glob esatto → **INFO `code-path-overlap`** (non error; informativo per chi pianifica lo sprint, segnala che i due TSK saranno serializzati dal partition step).
- **`blocked_by` su TSK** (v2.11, esteso da US):
  - Ogni `Q_NNN` referenziato deve esistere in `management/questions.md`. Assente → **WARNING `orphan-blocked-by-q`**.
  - Q in `[RISOLTE]` ancora in `blocked_by` di un TSK → **WARNING `stale-blocked-by-tsk`** (simmetrico al check 4b su US; genera `reconcile-needed`).
- **`scheduler:` block coerenza** (solo se `factory.config.yaml.scheduler` esiste):
  - `enabled` ∈ `{true, false}`. Altrimenti → **ERROR `invalid-scheduler-enabled`**.
  - `max_parallel` intero ≥ 1. Altrimenti → **WARNING `invalid-max-parallel`** (applica default 4).
  - `parallel_gate_threshold` intero ≥ 1 e ≤ `max_parallel`. Altrimenti → **WARNING `invalid-gate-threshold`** (applica default 3).
  - `code_path_conflict` ∈ `{strict, warn, off}`. Altrimenti → **ERROR `invalid-conflict-mode`**.
  - `empty_code_path_policy` ∈ `{serial, parallel}`. Altrimenti → **ERROR `invalid-empty-policy`**.

### 4b — Coerenza Q ↔ kanban (v2.6, gate L4 graduato)

- Per ogni `Q_NNN` in `management/questions.md` `[APERTE]`: verifica presenza
  campo `**Bloccante:** hard | soft`. Assenza → **WARNING missing-blocking-level**
  (non ERROR, per compatibilità retroattiva pre-v2.6; default = `hard`).
- Per ogni `Q_NNN` in `[RISOLTE]`: cerca US con `blocked_by:.*Q_NNN` o
  `pending_clarification:.*Q_NNN`. Match → **WARNING stale-blocked-by**:
  la US referenzia una Q già chiusa. Suggerisce: invocare `product-manager`
  o riconciliare manualmente. (Vedi marker `reconcile-needed` in `wiki/log.md`
  generati da `propagate-resolution`.)
- Per ogni US con `pending_clarification:` non vuota: verifica che almeno
  un ADR la citi nel proprio `pending_clarification:` frontmatter. Mismatch →
  **WARNING orphan-pending-clarification**.

### 4m — Coerenza `risk_classification` ↔ Risk Registry (v2.16 opt-in, PATTERN §3/§5)

**WARNING-only — nessun ERROR meccanico** (R.P3 opt-in totale). Il check non blocca
mai `/lint`. Eventuale promozione a ERROR è candidato v2.17+ post-evidenza.

**Pre-condizioni di silenzio** (no-op se):
- l'artefatto EP/US/TSK **non** ha il blocco `risk_classification:` nel frontmatter → no-op totale;
- `management/risk-registry.md` **non** esiste → 4m.1 e 4m.2 si skippano (il Registry è opt-in); solo 4m.3 (broken ref) può ancora scattare.

Tre sotto-check (per ogni artefatto con `risk_classification:` valorizzato):

- **4m.1 — Drift tier**: se `tier` MATCHES `/^tiger-/` e una sezione del Registry per quel target esiste, ma il tier nel Registry ≠ tier nel frontmatter → **WARNING `drift_tier`**.
- **4m.2 — Missing Registry row**: se `tier` MATCHES `/^tiger-/`, il Registry esiste, ma non c'è alcuna sezione/riga per quel target → **WARNING `missing_registry_row`** (suggerimento: esegui `/premortem <target>`).
- **4m.3 — Broken premortem_ref**: se `premortem_ref` è valorizzato e `(path, anchor)` non è risolvibile (file inesistente o anchor assente) → **WARNING `broken_premortem_ref`**.

**Output format** (sezione `## WARNING (igiene)` del report):

```
- [WARNING][risk_classification][4m.1] EP-042: drift_tier — frontmatter=tiger-launch-blocking, registry=tiger-fast-follow (suggerimento: riconciliare)
- [WARNING][risk_classification][4m.2] US-017: missing_registry_row — esegui /premortem US-017
- [WARNING][risk_classification][4m.3] TSK-103: broken_premortem_ref — management/risk-registry.md#pm-inesistente
```

**Numerazione**: «4m» è il check del pattern Premortem (v2.16). La lettera segue la
serie OCL/CCL prevista in v2.14 (4k/4l); non collide con alcun check esistente in
questo file (4b–4g). Mai `heal-eligible` (WARNING-only, giudizio semantico).
