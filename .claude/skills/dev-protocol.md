---
name: dev-protocol
description: Procedura per un dev-agent che consuma un TSK e produce codice in code_path. Single source of truth per Develop (PATTERN §3).
---
# Procedura — consumare un TSK (Develop, L4 → L5)

Skill condivisa fra `be-dev`, `fe-dev`, `db-dev`, `qa-dev`. La specializzazione
per layer vive nell'agente; questa skill è la spina dorsale comune.

## Preflight R.21 — Cooperative locking (EP-053, multi-utente)

Prima della Fase 0, in contesti multi-utente, verifica `memory/active-sessions.yaml`:

1. Leggi il file. Se assente, prosegui (no-op).
2. Rimuovi entry con TTL scaduto (`started_at + ttl_min < ora`).
3. Se esiste clash su stesso domain → **WARN** in chat; chiedi conferma prima di procedere.
4. Aggiungi claim `{uuid, agent, domain, started_at, ttl_min: 30}`.
5. Rimuovi il claim al termine (Fase 5 handoff finale).

In sessioni single-user questo preflight è no-op (nessun clash trovato = nessun output).

[^src: PATTERN.md §7 r.21 — EP-053 embedding 2026-07-30]

## Fase 0 — Gate preliminare + target resolution (v2.12 multi-repo)

Prima di qualsiasi scrittura:

1. **Leggi `factory.config.yaml`** (root del repo).
2. Verifica:
   - `topology` ammette il tuo layer (es. per `be-dev`: topologia ∈
     {`full-stack-agents`, `hybrid-be-agents`, `custom` con `be-dev` listato}).
   - `routing.<tuo-layer> == agent` (oppure override esplicito via `/dev`).
   - Esiste un percorso L5 risolvibile (vedi step 2-bis: target resolution).
3. **Leggi il TSK**: deve avere `layer: <tuo>`, `consumer: agent`, `status: todo`,
   dipendenze chiuse. Se manca anche solo un campo o un gate, **STOP** e
   segnala in chat (non procedere "in modalità best-effort").

### Step 2-bis — Target resolution (v2.12 multi-repo, PATTERN §5 + §13)

Determina il `code_path` effettivo (`resolved_code_path`) e la `resolved_vcs` da usare:

**Caso A — Legacy single-repo** (`code_path:` valorizzato, `code_paths: []` o assente):
- `resolved_code_path = factory.config.yaml.code_path`
- `resolved_vcs = factory.config.yaml.vcs` (top-level)
- `resolved_target_name = "default"` (per logging)
- Procedi.

**Caso B — Multi-repo** (`code_paths: [<entry>, ...]` non vuoto):

1. Read TSK `target:` frontmatter.
2. Se `target:` valorizzato: cerca `entry = code_paths[name == target]`.
   - Non trovato → **ERROR** «TSK <id> ha `target: <X>` ma nessuna entry in `code_paths` con quel nome». STOP.
   - Trovato ma `<tuo-layer>` non in `entry.layers` → **ERROR** «TSK <id> ha layer <Y> e target <X>, ma entry <X> non lista <Y> in `layers`». STOP.
   - `resolved_code_path = entry.path`; `resolved_vcs = entry.vcs`; `resolved_target_name = entry.name`. Procedi.
3. Se `target:` assente: `candidates = [e for e in code_paths if <tuo-layer> in e.layers]`.
   - `len == 0` → **ERROR** «Nessuna entry in `code_paths` lista <tuo-layer>; routing.<layer>: agent richiede almeno una entry. Lint Check 4c violato». STOP.
   - `len == 1` → auto-derive da `candidates[0]`. Procedi.
   - `len >= 2` → **ERROR** «TSK <id> layer <Y> ambiguo: ≥ 2 entry in `code_paths` listano <Y>. Il TPM doveva valorizzare `target:`. Lint Check 4j violato». STOP. Mai indovinare.
4. Verifica accessibilità `resolved_code_path`: esiste sul filesystem o è creabile.
   - Non esiste e non creabile → **ERROR** «code_path <path> per target <name> non accessibile». STOP.
5. Log a chat: `Target resolved: <name> → <resolved_code_path> (vcs: <mode>)`

Tutto il resto del protocollo (Fasi 1-5) usa `resolved_code_path` e `resolved_vcs` al
posto del legacy `code_path` + `vcs`. La citazione codice nei dev-agent usa il prefisso
appropriato in base a `resolved_vcs.mode`.

### Step 2-ter — Branch alignment gate (opt-in, EP-034 v2.25, PATTERN §15)

Gate **pre-dispatch** che verifica di trovarsi sul branch giusto *prima* di scrivere codice.
Critico per target `submodule`/`sibling` (problema dei due HEAD).

**No-op a flag spento (default)**: si attiva **solo se**
`resolved_vcs.branch_awareness.enabled: true` AND `resolved_vcs.branch_awareness.dispatch_gate ≠ off`.
Altrimenti comportamento identico a v2.24 (R.B10): salta direttamente a Fase 1.

Quando attivo, e **solo** per `resolved_vcs.mode ∈ {submodule, sibling}` (per `monorepo`/`external`
il gate è degenere e viene saltato):

1. Calcola `expected_branch` invocando `branch-resolver` (R.B9) con `resolved_vcs`,
   `resolved_target_name` e il TSK corrente.
2. Determina lo stato reale del target (read-only, R.B7):
   - Se `submodule` e `<submodule_path>/.git` assente → **STOP** «submodule <name> non
     inizializzato: `git submodule update --init <submodule_path>`».
   - Branch corrente via `git -C <dir> symbolic-ref --short HEAD` (fallisce = detached).
3. Confronta:
   - **detached HEAD** → gestione secondo `dispatch_gate` (vedi sotto).
   - `expected_branch` valorizzato E ≠ branch corrente → mismatch.
   - `expected_branch` null (es. `shared` senza `base_branch`) e HEAD su un branch → OK.
4. Azione secondo `dispatch_gate`:
   - **`block`** → **STOP** con il comando esatto di remediation. Non procedere alla Fase 1.
   - **`warn`** → WARNING inline con il comando suggerito, poi **procedi**.
   - Se `auto_align: propose` → proponi `git checkout <expected_branch>` sotto **gate umano**
     (mai eseguirlo in autonomia, R.B8). Su conferma esplicita checkout; senza → STOP.

**Vincolo (R.B8)**: il gate **non esegue mai `git checkout` automatico**. Al massimo lo propone
sotto gate umano (`auto_align: propose`). La responsabilità dello stato dei repo esterni resta umana.

### Checkpoint analysis-only (EP-053, loop-1)

Applicabile al **primo ciclo di esecuzione (loop-1)** quando le AC del TSK includono
formule come: «nessuna modifica al codice», «solo censimento», «solo documentazione»,
«analysis only», o equivalenti.

Prima di produrre qualsiasi modifica al codice:

1. **Verifica esplicita**: controlla se un'istruzione umana (nel thread corrente) estende o
   sovrascrive lo scope del TSK originale.
2. Se l'estensione è **ambigua** (formulazione informale, implicita, o non riconducibile
   univocamente a una AC del TSK) → **STOP**: chiedi conferma esplicita prima di procedere.
3. Registra la decisione nel log di sessione (in chat o in `wiki/log.md`).

Un'estensione verbale informale non sovrascrive le AC del TSK. L'ambiguità va sciolta
*prima* dell'azione, non dopo.

[^src: portale-servizi-factory .claude/skills/dev-protocol.md §Checkpoint loop-1 — EP-053 backport 2026-07-30]

## Fase 0.bis — Impact Pre-Analysis (L3, opt-in, R.CI4)

**Gate**: esegui solo se `code_intelligence.l3_impact.enabled: true` in `factory.config.yaml`.
Se disabled o chiave assente → **skip silenzioso**, procedi direttamente a Fase 1.

**Prerequisiti** (R.CI2 — SKIP non STOP):
- `which graphify` → se assente: log `[L3-SKIP] graphify not installed — see wiki/runbooks/code-intelligence.md` e procedi
- Graph costruito: `.graphify-state/code_paths/<slug>/graph.json`
  → se assente: log `[L3-SKIP] graph not built — run /graphify-sync <target> first` e procedi

**Esecuzione** (R.CI4 — analysis-only, zero scrittura file in questa fase):
1. Dal frontmatter del TSK, estrai i simboli/moduli principali da modificare
2. Per ogni simbolo: `graphify affected "<symbol>" --format=json --depth=2`
3. Aggrega come `blast_radius`: `{symbol, affected_files, affected_symbols, depth}`

**Output atteso** (solo in memoria dell'agente — non scrivere file):
```
[L3] Impact analysis: auth_middleware
  → affected files  (depth 1): middleware/base.py, views/api.py (+3 altri)
  → affected symbols (depth 2): APIView.dispatch, require_auth
  → blast_radius: 7 files, 12 symbols — MEDIUM
```

**Livelli blast_radius**: LOW ≤3 file → procedi; MEDIUM 4-10 → segnala in TSK Analysis;
HIGH >10 → `[L3-WARN]` + verifica copertura TSK o esplicitazione out-of-scope.

**Scope extension check**: se blast_radius include file/moduli fuori scope TSK → segnala
"scope extension rilevata: <lista file>" nella sezione Analysis e attendi conferma umana.

**Note**: step read-only (no modifica al graph).
Se `auto_run_on_dev: false` (default): eseguito solo su richiesta esplicita.
Se `auto_run_on_dev: true`: eseguito automaticamente.

## Fase 1 — Preparazione contesto

1. Leggi la US riferita dal TSK (path deducibile: `EP-XXX-*/US-YYY-*/US-YYY.md`).
2. Leggi l'ADR / sezione di `design_&_architecture/` citato.
3. Apri le pagine `wiki/` citate transitivamente dalla US (concept/entity/synthesis).
   Non citarle direttamente nel codice — citazione cascade: il codice cita TSK/ADR.
4. Leggi `raw/tech_stack.md` per vincoli (versioni, standards).
5. Esplora `<code_path>/**` per capire layout esistente.

## Fase 2 — Handoff iniziale

1. Edit del TSK: `status: in-progress`, aggiungi `updated: YYYY-MM-DD HH:MM`.
2. **[Analytics — step obbligatorio]** Emetti evento `started` se
   `analytics.measurement.enabled: true` AND `dogfooding.enabled: true`
   (il tool fa early-return silenzioso se i flag sono `false` — no-op sicuro):
   ```bash
   # [analytics] record TSK started — eseguire SUBITO DOPO l'edit status: in-progress
   _TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   _REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"
   bash "$_REPO_ROOT/tools/analytics/record-event.sh" \
     --event "{\"task_id\":\"<TSK-NNN-slug>\",\"project_id\":\"soli-multi-agents-factory\",\"actor_type\":\"agent\",\"actor_id\":\"<agent-slug>\",\"task_type\":\"<layer>\",\"state\":\"started\",\"ts\":\"$_TS\",\"tokens\":{\"input\":0,\"output\":0,\"cache_read\":0,\"cache_write\":0},\"model\":\"claude-sonnet-4-6\",\"tool_calls\":[]}" \
     2>/dev/null || true
   # Se il comando fallisce (exit non-zero), prosegui comunque (fail-open, ADR-039 §D).
   ```
3. Non toccare il corpo del TSK.

## Fase 3 — Implementazione

1. Implementa secondo:
   - Implementation Steps del TSK (ordine indicativo, non vincolante)
   - Technical Specs del TSK
   - Standards verbatim citati nei raw (PATTERN §11)
2. Atomicità: tutto il cambiamento per **un singolo TSK** deve essere
   coerente (un commit logico, anche se il VCS lo separa in più commit).
3. Se durante l'implementazione scopri che il TSK è **sotto-specificato**:
   - Gap di knowledge base → append `wiki/gaps.md` (vedi `wiki-gap-protocol`)
   - Decisione architetturale mancante → STOP e segnala in chat (`tpm` o
     `lead-architect` la prenderanno; non improvvisare design)
   - Bug pre-esistente fuori scope → segnala in chat (TPM aprirà TSK separato),
     non fixare opportunisticamente (PATTERN §7 r.8)

## Fase 4 — Definition of Done

Verifica la DoD del TSK punto per punto:
- [ ] Codice compila / build passa
- [ ] Test unitari relativi passano
- [ ] (Se applicabile) Test integrazione passano
- [ ] Documentazione inline minima (docstring, README locale solo se richiesto)
- [ ] Niente file fuori scope toccati

Se anche un solo punto fallisce e non puoi risolverlo nel TSK corrente:
- Rollback delle modifiche già fatte (preferibile) o segnala chiaramente in chat lo stato parziale.
- Edit `status: in-progress` (NON `done`), e descrivi il blocker in chat.

## Fase 4-bis — Visual Verification (trigger, opt-in fe_correctness)

**Condizione (AND)**: `TSK.layer == 'fe'` AND `fe_correctness.enabled: true`.

**No-op esplicito**: `layer != fe` OR `fe_correctness.enabled: false` → skip diretto a Fase 5.
Comportamento identico a v2.16 su factory senza opt-in.

**Fail-loud**: trigger soddisfatto ma skill `visual-oracle-protocol` assente →
ERROR «`fe_correctness.enabled: true` ma skill `visual-oracle-protocol` assente; impossibile eseguire la Fase 4-bis». STOP.
Mai degradare silenziosamente a no-op quando il flag è attivo.

**Procedura completa, esiti e loop bounded**:
Leggi `.claude/skills/references/dev-protocol/fase4-bis-visual-verification.md`
(esiti: `pass` → Fase 5; `conditional` → loop fe-dev bounded `fe_correctness.max_iterations`; `reject` → gate umano).

## Fase 4-ter — UX/UI Review (trigger, opt-in ux_ui)

**Condizione (AND)**: `TSK.layer == 'fe'` AND `ux_ui.enabled: true`.
**Pre-condizione**: `visual_status` non-pending (Fase 4-bis conclusa); se `visual_status: reject` → SKIP.

**No-op esplicito**: `layer != fe` OR `ux_ui.enabled: false` → skip diretto a Fase 5.
Comportamento identico a v2.17 su factory senza opt-in.

**Fail-loud**: trigger soddisfatto ma né skill `ux-ui-review-protocol` né agente `ux-ui-reviewer` presenti →
ERROR «`ux_ui.enabled: true` ma nessun esecutore ux-ui-review disponibile». STOP.

**Procedura completa, esiti e loop bounded**:
Leggi `.claude/skills/references/dev-protocol/fase4-ter-ux-ui-review.md`
(esiti: `pass` → Fase 5; `conditional` → loop fe-dev bounded `ux_ui.max_iterations`; `reject` → gate umano; `visual_status: reject` → SKIP).

## Fase 5 — Handoff finale (Develop completato)

1. **[Analytics — step obbligatorio]** Emetti evento `finished` PRIMA di editare
   `status: done` (il tool fa early-return silenzioso se i flag sono `false` — no-op sicuro):
   ```bash
   # [analytics] record TSK finished — eseguire PRIMA dell'edit status: done
   _TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   _REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"
   bash "$_REPO_ROOT/tools/analytics/record-event.sh" \
     --event "{\"task_id\":\"<TSK-NNN-slug>\",\"project_id\":\"soli-multi-agents-factory\",\"actor_type\":\"agent\",\"actor_id\":\"<agent-slug>\",\"task_type\":\"<layer>\",\"state\":\"finished\",\"ts\":\"$_TS\",\"tokens\":{\"input\":0,\"output\":0,\"cache_read\":0,\"cache_write\":0},\"model\":\"claude-sonnet-4-6\",\"tool_calls\":[]}" \
     2>/dev/null || true
   # Se il comando fallisce (exit non-zero), prosegui comunque (fail-open, ADR-039 §D).
   ```
2. Edit del TSK: `status: done`, `updated: YYYY-MM-DD HH:MM`.
3. Invoca `dev-handoff` (skill) per scrivere l'entry su `wiki/log.md`.
4. **Invoca `vcs-handoff`** (skill, v2.8 esteso multi-repo v2.12) passando
   `resolved_vcs` + `resolved_target_name` (da Fase 0 step 2-bis). La skill coordina
   i commit per la topologia VCS del **target risolto**, non per la factory globale:
   - `monorepo` → propone commit nel factory repo (path = `resolved_code_path` sotto factory root).
   - `submodule` → propone commit nel submodule referenziato da `resolved_vcs.submodule_path`, poi bump del ref nel factory.
   - `sibling` → propone commit nel repo esterno (`resolved_code_path`) + avviso PR.
   - `external` → solo log, nessuna operazione VCS.
   - `none` → STOP (incoerenza: develop su mode `none` non dovrebbe accadere).

   In multi-repo, **ogni vcs-handoff è per-target**: mai operazioni coordinate cross-target
   automaticamente. Se un TSK richiede modifiche cross-repo, si scompone in N TSK con target
   distinti (responsabilità del TPM). Gate umano obbligatorio per ogni `git commit` (PATTERN §7 r.14).

## Vincoli inviolabili

- **Mai editare il corpo del TSK** (solo `status:` e `updated:`).
- **Mai scrivere su `wiki/**`** se non append a `wiki/log.md` e `wiki/gaps.md`.
- **Mai scrivere su `design_&_architecture/`** (è proprietà di Arch).
- **Mai scrivere su `management/kanban/**`** fuori dal proprio TSK (la generazione TSK è proprietà del TPM).
- **Mai inventare endpoint, tabelle, classi** non specificati nel design.
- **Standards verbatim** (PATTERN §11): se SAML/OIDC/FHIR citati, implementa esattamente quelli.
- **Stop se code_path non è valorizzato.** Mai scrivere "a indovinare" in `./src/`.

## Analytics Instrumentation (opt-in v2.19+)

**Gate**: `analytics.measurement.enabled: true` AND `dogfooding.enabled: true`.
SE entrambi `false` (default): EARLY RETURN — 0 side effect, 0 eventi scritti.
A `measurement.enabled: true` ma `dogfooding.enabled: false`: cabling no-op (comportamento v2.18).

**Single-writer**: `tools/analytics/record-event.sh` è l'UNICO writer di
`analytics/events/<YYYY-MM>.jsonl` (R.G5). [^src: ADR-039 §B]

**PII invariante**: payload senza contenuto file, prompt LLM, env vars, segreti, PII utente (ADR-040 §A).

**Punti attivi** (comandi inline in Fase 2 e Fase 5 sopra):
- Punto 1: `state: started` (Fase 2, todo → in-progress)
- Punto 2: `state: finished` (Fase 5, in-progress → done)

**Schema payload espanso + Punto 3 (blocked) + Punto 4 (aborted) + comportamento errore scrittura**:
Se gate attivo → leggi `.claude/skills/references/dev-protocol/analytics-instrumentation.md`

[^src: design_&_architecture/decisions/ADR-038.md §B — 4 punti di iniezione TSK (started/finished/blocked/aborted)]
[^src: design_&_architecture/decisions/ADR-040.md §A — payload allowlist, PII invariante]
