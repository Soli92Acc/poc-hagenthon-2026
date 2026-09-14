# Factory Bootstrap — versioni medie (v2-23..v2-33)

**Ambito**: foglia di dettaglio per il dispatcher `.claude/commands/factory-bootstrap.md`.
Contiene i case di risoluzione versione per v2-33 fino a v2-23 (incluse varianti `-full`).
Viene letta obbligatoriamente quando `--version` cade nel range v2-33..v2-23.

---

- **`--version=v2-33`** → carica il seed v2.33 (Content Share Consumer Layer EP-048;
  **delta seed** che estende v2-32; skill `content-share-protocol` (5 fasi: Pre-flight+EgressCheck →
  Build Payload → Validate → Gate Umano → Dispatch+Log) + comando `/share <html-path>
  [--slug] [--title] [--dry-run]` per pubblicare artefatti HTML su soli-frames via
  `repository_dispatch`; 4 invarianti R.CS1 (slug convention) + R.CS2 (default off) +
  R.CS3 (gate umano obbligatorio) + R.CS4 (egress classification); config `content_share:`
  (enabled: false default, backward compat totale v2.32); runbook setup PAT fine-grained;
  fix soli-frames write-fragments.js: `<a href>` navigazionali permessi; 9 test smoke+size+slug;
  gate v2.33.0 PASS 2026-07-17) →
  leggi `meta-prompts/v2-33/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-32`, l'agente DEVE risolvere la catena
  `v2-33 → v2-32 → v2-31 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-32`** → carica il seed v2.32 (Capability Formativa EP-045 +
  Voice Hardening EP-046; **delta seed** che estende v2-31; DUE capability distinte:
  EP-046 porta il modulo `voice/` a uso non supervisionato via 7 contratti architetturali FSM
  (C1 lifecycle owner single-writer, C2 no-cattura-durante-parlato `playing_watchdog_s`,
  C3 liveness check file-pipe, C4 timer cattura config-driven `speech_onset_deadline_s`+
  `max_capture_duration_s`, C5+C6 gate STT `no_speech_prob`+`compression_ratio`, C7 seam
  `VoiceSessionManager` stub; ADR-EP046-001 GO); EP-045 introduce sistema tutoring adattivo MVP;
  backward compat totale v2.31; gate v2.32.0 PASS 2026-07-10) →
  leggi `meta-prompts/v2-32/factory-bootstrap.md`
- **`--version=v2-31`** → carica il seed v2.31 (Voice Handsfree Improvements EP-044;
  **delta seed** che estende v2-30; hardening e configurabilità del Voice Channel Layer (EP-041,
  PATTERN §30): VAD debounce ms configurabile (US-155) + wake word filter threshold configurabile
  (US-156) + file pipe adapter con fallback polling (US-158: `pipe_poll_ms` + `pipe_timeout`,
  comunicazione CLI senza FIFO bloccante) + PID file path configurabile (US-159) + blocklist
  anti-allucinazione STT (gate RMS pre-Whisper + `no_speech_prob` + pattern ripetitivi);
  include anche EP-041 Voice Channel (STT/TTS/VAD/AEC, state machine 5 stati), EP-042 Hybrid
  Wiki Search (vector+FTS+RRF, LanceDB, skill `wiki-search-protocol`, `/wiki-search`), EP-043
  Temporal Estimate Protocol (skill `temporal-estimate-protocol`, `/sprint-progress`);
  config `voice_channel:` + `wiki_search:` + `temporal:` + `analytics.sprint_progress:`
  (tutti default off, backward compat totale v2.30); gate v2.31.0 PASS 2026-07-09) →
  leggi `meta-prompts/v2-31/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-30`, l'agente DEVE risolvere la catena
  `v2-31 → v2-30 → v2-29 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-31-full`** → carica il seed **self-contained** v2.31 (`meta-prompts/v2-31/factory-bootstrap-full.md`):
  intera catena v2.15→v2.31 inlinata, **nessun `extends:` da risolvere**. Funzionalmente
  identico al delta v2-31 ma leggibile da un solo file. **Consigliato per uso offline / URL
  singola / collega / LLM non-Claude** che non risolve la catena `extends:`.
- **`--version=v2-27`** → carica il seed v2.27 (Tavola Rotonda Mode EP-039;
  **delta seed** che estende v2-26; modalità multi-agente collaborativa opt-in per deliberazioni
  complesse: agente `tavola-rotonda-moderatore` (macchina a stati 5 fasi
  Setup→Posizioni→Confronto→Convergenza→Sintesi) + skill `tavola-rotonda-protocol` (8 invarianti
  R.TR1-R.TR8: blackboard single-writer, Critico obbligatorio, budget guardrail, registro decisioni)
  + comando `/tavola-rotonda` (gate R.P3-TR, flag parsing, dispatch moderatore);
  ADR-EP039-001; PATTERN §28; config `tavola_rotonda.enabled: false` default;
  backward compat totale v2.26; gate v2.27.0 PASS) →
  leggi `meta-prompts/v2-27/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-26`, l'agente DEVE risolvere la catena
  `v2-27 → v2-26 → v2-25 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-27-full`** → carica il seed **self-contained** v2.27 (`meta-prompts/v2-27/factory-bootstrap-full.md`):
  intera catena v2.15→v2.27 inlinata, **nessun `extends:` da risolvere**. Funzionalmente
  identico al delta v2-27 ma leggibile da un solo file. **Consigliato per uso offline / URL
  singola / collega / LLM non-Claude** che non risolve la catena `extends:`.
- **`--version=v2-26`** → carica il seed v2.26 (Prototype Generation Layer EP-035;
  **delta seed** che estende v2-25; layer opt-in con cascata adattiva figma→penpot→react→html e
  fallback terminale html garantito (INV-1): skill `backend-resolver` + `prototype-generation-protocol`
  + `html-prototype-mapping` + `react-mapping` (T1) + agente `prototype-generator` + comandi
  `/prototype` + `/prototype-status`; config `prototyping:` default off (R.P3); INV-1..INV-6 locali
  §27; ADR-EP035-001..006 GO; backward compat totale v2.25; gate v2.26.0 PASS 2026-07-02) →
  leggi `meta-prompts/v2-26/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-25`, l'agente DEVE risolvere la catena
  `v2-26 → v2-25 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-26-full`** → carica il seed **self-contained** v2.26 (`meta-prompts/v2-26/factory-bootstrap-full.md`):
  intera catena v2.15→v2.26 inlinata, **nessun `extends:` da risolvere**. Funzionalmente
  identico al delta v2-26 ma leggibile da un solo file. **Consigliato per uso offline / URL
  singola / collega / LLM non-Claude** che non risolve la catena `extends:`.
- **`--version=v2-25`** → carica il seed v2.25 (VCS Branch Awareness Layer EP-034;
  **delta seed** che estende v2-24; layer opt-in declare→inspect→align per rendere preciso e
  visibile «su quale branch sto / su quale devo stare» nei progetti multi-repo/submodule: skill
  `branch-resolver` (expected branch, single source of truth R.B9) + `vcs-preflight-protocol`
  (snapshot read-only R.B7) + comando `/vcs-status` + tabella dashboard `/run` + gate pre-dispatch
  `dev-protocol` Fase 0 Step 2-ter (`dispatch_gate: off|warn|block`, `auto_align: propose`, mai
  checkout silente R.B8) + drift check opt-in in `vcs-handoff`; config `vcs.branch_awareness`
  default off; invarianti locali §15 R.B7-R.B10; ADR-EP034-001 GO; backward compat totale v2.24;
  gate v2.25.0 PASS 2026-07-02) →
  leggi `meta-prompts/v2-25/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-24`, l'agente DEVE risolvere la catena
  `v2-25 → v2-24 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-25-full`** → carica il seed **self-contained** v2.25 (`meta-prompts/v2-25/factory-bootstrap-full.md`):
  intera catena v2.15→v2.25 inlinata, **nessun `extends:` da risolvere**. Funzionalmente
  identico al delta v2-25 ma leggibile da un solo file. **Consigliato per uso offline / URL
  singola / collega / LLM non-Claude** che non risolve la catena `extends:`.
- **`--version=v2-24`** → carica il seed v2.24 (Runtime Contextual Suggestions EP-033;
  **delta seed** che estende v2-23; tre proposte push-based: A = Fase 6 orchestrator.md 6 regole
  condizionali al termine di `/run`, B = sezione Suggerimento post-esecuzione in dev-handoff.md
  per-layer (fe/be/db/qa/docs), C = suggest-next.py + hook Stop opt-in (~220 righe Python stdlib,
  exit 0 always, 5 regole statiche deterministiche, `--dry-run` debug); gate installazione per
  ogni suggerimento (`.claude/commands/<cmd>.md` presente); deduplication via `wiki/log.md`;
  tono non imperativo; nessuna nuova invariante §7 (restano 18); backward compat totale v2.23;
  gate v2.24.0 PENDING) →
  leggi `meta-prompts/v2-24/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-23`, l'agente DEVE risolvere la catena
  `v2-24 → v2-23 → v2-21 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-23`** → carica il seed v2.23 (Semantic Drift Detection — research sprint EP-031;
  **delta seed** che estende v2-21; UNA capability opt-in di research derivabile — EP-031 Semantic Drift
  Detection (piramide ADR-EP031-001 GO-MODIFIED: L1 staleness Check 4ag always-on + L2 LLM-judge corpus
  ≤50 pagine + L3 embedding coseno opt-in; config `wiki_lint.semantic_check:` 6 chiavi, default
  `enabled: false`; skill `semantic-drift-scan-protocol`; comando `/semantic-drift-scan`; convenzione
  frontmatter `pattern_section:`); Check 4ag (staleness) always-on indipendentemente dal flag; nessuna
  nuova invariante §7 (restano 18); gate v2.23.0 PASS 3/3 RUN-REPORT 2026-06-25).
  ⚠️ Essendo un **delta seed** con `extends: v2-21`, l'agente DEVE risolvere la catena
  `v2-23 → v2-21 → v2-20 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
  **Alternativa consigliata per uso offline/collega**: usa `--version=v2-23-full` (nessun extends, unico file).
- **`--version=v2-23-full`** → carica `meta-prompts/v2-23/factory-bootstrap-full.md`, la
  **variante consolidata self-contained v2.23**: identica funzionalmente a v2.23 ma con l'intera
  catena `extends` (v2-23 + v2-21 + v2-20 + v2-19 + v2-18 + v2-17 + v2-16 + v2-15) **inlinata in un
  unico file** (nessun `extends:` da risolvere, nessun seed padre da fetchare). Consigliata
  quando l'agente non risolve in automatico la catena `extends:`. Resta necessario il fetch dei
  template di contenuto (PATTERN.md, file `.claude/*`, manifest adapter) in Fase 3.
