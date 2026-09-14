# Factory Bootstrap — changelog versione corrente

**Ambito**: foglia di dettaglio per il dispatcher `.claude/commands/factory-bootstrap.md`.
Contiene il changelog della versione corrente (v2.40) e di tutte le versioni precedenti
fino a v2.14. Viene letta obbligatoriamente prima di espandere la versione corrente.

---

## Versione corrente: v2.40 (EP-059 Backport delta v2.40 da portale-servizi-factory)

**Cambiamenti chiave v2.40** (gate v2.40.0 PASS — 2026-09-02):
- **EP-059 Backport da portale-servizi-factory** (WaveA TSK-507..526 + WaveB TSK-527..531).
  25 TSK complessivi, backward compat totale v2.39.
- **Nuovo agente `release-manager`** (opt-in): coordina l'intero ciclo vita di una release
  (pianificazione → validazione gate → [GATE UMANO] tag VCS → post-release); skill primaria
  `release-protocol` (4 fasi; gate umano non bypassabile pre-tag).
- **Nuova skill `tpm-reconcile`**: riconciliazione periodica kanban vs esecuzione reale;
  input: filtro epica opzionale; output: report in-chat anomalie + raccomandazioni; sola lettura.
- **Nuova skill `deep-functional-probe`**: probe funzionale avanzato per scenari complessi;
  complemento a `functional-oracle-protocol` (EP-018); opt-in tramite
  `fe_correctness.functional_oracle.enabled: true`; output PASS/FAIL + evidence strutturata.
- **Nuova skill `release-protocol`**: skill primaria di `release-manager`; 4 fasi:
  preparazione → validazione gate → [GATE UMANO] tag VCS → post-release.
- **Nuovo tool `tools/analytics/statusline-ledger.py`**: output compatto su 1 riga
  (`◉ TOKENS  in: Xk  out: Yk  cost: $Z`); flag `--json` per output machine-readable;
  degrada gracefully se il ledger non è attivo (exit 0, riga vuota). Alternativa a
  `show-session-tokens.py` per contesti dove la compattezza è prioritaria.
- **pattern_version bump** `"2.39"` → `"2.40"` in `factory.config.yaml` (SSOT).

**Cambiamenti chiave v2.39** (gate v2.39.0 CONDITIONAL accettato — 2026-08-28):
- **Ponytail Decision Ladder** (EP-057/057.1, PATTERN §36 opt-in). Filone A: YAGNI gate
  7 livelli opt-in — config `ponytail:` + Lint Check 4ao + Pass 4 advisory in
  code-review-protocol (mai determinante) + comandi `/ponytail-review`/`/ponytail-audit`/
  `/ponytail-gain` + invariante R.PY1 (security/a11y/trust-boundary inviolabili); Filone B:
  adapter MCP read-only opt-in — `adapters/mcp/` + config `mcp_server:` (resources wiki/kanban/config,
  tools query_wiki/get_task/lint_status, pin mcp==1.3.0) + invariante R.MCP1 no-write + Check 4am.mcp;
  4 sprint 58-60; backward compat totale v2.38; concetti `wiki/concepts/decision-ladder.md` +
  `wiki/concepts/ponytail.md`.

**Cambiamenti chiave v2.38** (gate v2.38.0 BYPASS — 2026-08-24, SLA ≥3 RUN-REPORT entro v2.39):
- **Integrazione llm_wiki** (TR-llmwiki-20260824, pattern-stealing concettuale GPL v3;
  **delta seed** che estende v2-37); EP-055 Semantic Purpose Layer (`wiki/purpose.md`
  frontmatter YAML domain/priority_entity_types/tone/exclusions + wiki-keeper Step 0 read-only
  + lint Check 4an + PATTERN §34) + EP-056 Wiki Keeper 2.0 (CoT handoff esplicito Fase 1.ter +
  sweep-reviews semantico `wiki_sweep:` con resolution loop bounded gated + comando
  `/sweep-reviews` + PATTERN §35) + PATTERN §23.10 Third-Party License & Pattern-Stealing Policy;
  8 TSK, sprint 56+57; backward compat totale v2.37.

**Cambiamenti chiave v2.37** (gate v2.37.0 PASS — 2026-08-04):
- **Code Intelligence Stack** (EP-054, PATTERN §33, opt-in). Stack a tre layer local-first
  per navigazione codice da parte degli agenti. Zero dipendenze esterne. L1 Symbol Resolver
  (universal-ctags; risponde a "dove è definita X?") + L2 Semantic Search (tree-sitter +
  nomic-embed-code + LanceDB; `/code-search <query>`) + L3 Impact Graph (graphify; Fase 0.bis
  dev-protocol). Config `code_intelligence:` default off (R.CI1). 13 TSK, sprint 54.
  Backward compat totale v2.36.

**Cambiamenti chiave v2.36** (gate v2.36.0 PASS — 2026-07-30):
- **Backport portale-servizi-factory** (EP-053). 5 pattern: R.21 cooperative locking 7 agenti
  (skill /onboarding + vcs-preflight step 2-bis + PATTERN §23.9 ai_attribution_policy +
  dev-protocol checkpoint analysis-only; 8 TSK, sprint 53; backward compat totale v2.35.

**Cambiamenti chiave v2.35** (gate v2.35.0 PASS — 2026-07-21):
- **Bus Factor Mitigation** (EP-051 gate formale sprint 52). soli-boy factory derivata pubblica
  176 TSK done confermata; PATTERN §23.8 sunset policy + sunset_date annotations 6 SUNSET v2.38 +
  2 EXEMPT; guida onboarding secondo maintainer. 6 TSK. Backward compat totale v2.34.

**Cambiamenti chiave v2.34** (gate v2.34.0 PASS — 2026-07-21):
- **Governance Enforcement + Adoption Onboarding + Tech Debt** (EP-049..052). QUICKSTART.md +
  factory-config-dag.md YAML DAG 45 flag + schemas/factory.config.schema.json 16 regole
  cross-flag + factory.starter.config.yaml 5 capability core; lint-checks.md modulare 9
  famiglie; pattern_version SSOT + Check 4am; CQRL router layer_filter [be,fe,db,qa];
  PATTERN §23.8 sunset policy; 37 TSK. Backward compat totale v2.33.

**Cambiamenti chiave v2.33** (gate v2.33.0 PASS — 2026-07-17):
- **Content Share Consumer Layer** (EP-048). skill `content-share-protocol` + comando `/share`
  + R.CS1..R.CS4 + config `content_share:`; dispatch fire-and-forget verso soli-frames;
  gate umano R.CS3; 9 test smoke+size+slug. Backward compat totale v2.32.

**Cambiamenti chiave v2.32** (gate v2.32.0 PASS — 2026-07-10):
- **Voice Hardening** (EP-046, PATTERN §30). Porta il modulo `voice/` a uso non
  supervisionato via 7 contratti architetturali FSM (ADR-EP046-001 GO, Tavola Rotonda 3f8a1c2d,
  consenso unanime Round 2): C1 `lifecycle.py` single-writer `voice-state.json` + PID
  validation; C2 flag `_tts_playing` + watchdog `playing_watchdog_s` (default 10s); C3 liveness
  check heartbeat TTL + `schema_version` in `FilePipeAdapter`; C4 timer cattura config-driven
  `speech_onset_deadline_s` (default 5s) + `max_capture_duration_s` (default 30s); C5+C6 gate
  STT per-segmento `no_speech_prob_threshold` (0.6) + `compression_ratio_threshold` (2.4);
  C7 `VoiceSessionManager` stub. 24 TSK, 9 test. Backward compat totale v2.31.
- **Capability Formativa** (EP-045). Sistema di tutoring adattivo MVP (Opzione B: curriculum
  curato a mano). Agente `tutor.md` (enabled: false default) + 4 skill (`epistemic-tag-protocol`
  L1/L2/L3 INV-T1..T3, `scaffolding-protocol` 3 livelli mastery, `session-mode-protocol`
  Sblocco/Apprendimento 7-step loop, `retrieval-protocol` 4 fasi gap record) + modulo
  `tools/tutor/` (11 moduli Python: Student Model SM-2 spaced repetition + retrieval loop
  5-step INV-L1..L3; CurriculumLoader; curriculum pilota 6 nodi DAG). 35 test. NOTA:
  `tools/tutor/` è un modulo opzionale da installare separatamente (non scaffoldato per default).

**Cambiamenti chiave v2.31** (gate v2.31.0 PASS — 2026-07-09):
- **Voice Handsfree Improvements** (EP-044, PATTERN §30). Hardening Voice Channel Layer
  (EP-041): VAD debounce ms configurabile (US-155, `vad.debounce_ms`) + wake word filter
  threshold configurabile (US-156, `wake_word.filter_threshold`) + file pipe adapter con
  fallback polling (US-158, `runtime.pipe_poll_ms` + `runtime.pipe_timeout`) + PID file path
  configurabile (US-159, `runtime.pid_file_path`, `pkill -fi` case-insensitive); blocklist
  anti-allucinazione STT (gate RMS pre-Whisper + `no_speech_prob` + pattern ripetitivi).
  Config `voice_channel:` aggiornata; tutti i nuovi campi backward compat v2.30.

**Cambiamenti chiave v2.30** (gate v2.30.0 PASS — 2026-07-09):
- **Temporal Generative Time Model** (EP-043, PATTERN §3+§18 estesi). Skill
  `temporal-estimate-protocol` (4 fasi: Estimate→Monitor→Escalate→Conclude). Comando
  `/sprint-progress` (burndown sprint corrente; fallback a conteggio kanban garantito).
  Config `temporal.estimate_protocol:` + `analytics.sprint_progress:` (default off).

**Cambiamenti chiave v2.29** (gate v2.29.0 PASS — 2026-07-08):
- **Hybrid Wiki Search Layer** (EP-042, PATTERN §31). Ricerca semantica ibrida vector+FTS+RRF
  su `wiki/`. LanceDB embedded + sentence-transformers `paraphrase-multilingual-MiniLM-L12-v2`.
  Skill `wiki-search-protocol` (4 step) + comandi `/wiki-search`. Config `wiki_search:` (default off).

**Cambiamenti chiave v2.28** (gate v2.28.0 PASS — 2026-07-08):
- **Voice Channel Layer** (EP-041, PATTERN §30). Modulo Python `voice/` esterno al meta-framework.
  STT via Faster-Whisper + TTS via Piper + VAD via Silero + AEC. State machine 5 stati:
  IDLE→CATTURA→TRASCRIZIONE→ELABORAZIONE→PARLATO. Config `voice_channel:` (default off).

**Cambiamenti chiave v2.27** (gate v2.27.0 PASS):
- **Tavola Rotonda Mode** (EP-039, PATTERN §28). Modalità multi-agente collaborativa opt-in.
  Agente `tavola-rotonda-moderatore` (macchina a stati 5 fasi) + skill `tavola-rotonda-protocol`
  (8 invarianti R.TR1-R.TR8: blackboard single-writer, Critico obbligatorio, budget guardrail,
  registro decisioni) + comando `/tavola-rotonda`. Config `tavola_rotonda.enabled: false` default.
  Runbook `wiki/runbooks/tavola-rotonda.md`. Backward compat totale v2.26.

**Cambiamenti chiave v2.26** (gate v2.26.0 PASS — 2026-07-02):
- **Prototype Generation Layer** (EP-035, PATTERN §27). Cascata adattiva figma→penpot→react→html
  con fallback terminale html garantito (INV-1). Skill `backend-resolver` + `prototype-generation-protocol`
  + `html-prototype-mapping` + `react-mapping` (T1). Agente `prototype-generator`. Comandi
  `/prototype` + `/prototype-status`. Config `prototyping:` (default off). ADR-EP035-001..006 GO.

**Cambiamenti chiave v2.24 → v2.25** (gate v2.25.0 PASS — 2026-07-02):
- **VCS Branch Awareness Layer** (EP-034). Opt-in declare→inspect→align per multi-repo/submodule.
  Skill `branch-resolver` + `vcs-preflight-protocol` + `/vcs-status` + gate dev-protocol Fase 0.
  Config `vcs.branch_awareness` default off. R.B7-R.B10. ADR-EP034-001 GO.

**Cambiamenti chiave v2.23 → v2.24** (gate v2.24.0 PASS — 2026-06-26):
- **Runtime Contextual Suggestions** (EP-033). TRE artefatti push-based: A = Fase 6
  orchestrator.md (6 regole condizionali) + B = dev-handoff.md sezione post-exec per-layer
  (fe/be/db/qa/docs, deduplication, max 3) + C = suggest-next.py (~220 righe Python stdlib,
  exit 0 always, `--dry-run`) + hook Stop. Backward compat totale.

**Cambiamenti chiave v2.21 → v2.23** (gate v2.23.0 PASS — 2026-06-25):
- **Semantic Drift Detection research sprint** (EP-031, ADR-EP031-001 GO-MODIFIED). Piramide:
  L1 staleness (Check 4ag, always-on) + L2 LLM-judge (manuale via `/semantic-drift-scan`) +
  L3 embedding coseno (opt-in). Config `wiki_lint.semantic_check:`. Baseline empirica
  2026-06-25: 10 pagine, FP rate 0%, score medio 0.68.

**Cambiamenti chiave v2.20 → v2.21** (gate v2.21.0 PASS — 2026-06-15):
- **Design Intelligence Layer opt-in** (PATTERN §24, EP-019). Art-director DSL + LLM-Generator
  Separation + Critic/Judge multi-round + Intention Economy. Skills: `art-director-protocol`,
  `design-spec-dsl`, `critic-judge-protocol`, `design-intelligence-protocol`,
  `llm-generator-separation-protocol`. Config `design_intelligence:` (default `enabled: false`).
  ADR-068..071. Nessuna nuova invariante §7 (restano 18).
- **Token Ledger opt-in** (EP-022). Script `show-session-tokens.py` + hook Stop + invariante
  CLAUDE.md. Config `analytics.token_ledger:` (default `enabled: false`).

**Cambiamenti chiave v2.19 → v2.20** (gate v2.20.0):
- **FE Functional Oracle opt-in** (PATTERN §3, EP-018). Prima capability di prodotto
  derivabile: la review che *esercita* il flusso reale dell'app (serve → fixture → interazione
  Playwright → asserzioni domain-agnostic → verdict deterministico). Skill
  `functional-oracle-protocol` + `interaction-drive-protocol` + `/functional-oracle` + schema
  `acceptance-spec`. Default `fe_correctness.functional_oracle.enabled: false`. ADR-065/066/067.

**Cambiamenti chiave v2.18 → v2.19** (gate v2.19.0):
- **Hardening & Sustainability** (EP-012..017). Delta derivabile minimo: EP-013 Analytics
  Dogfooding opt-in + fix ux_ui anti-fabbricazione ADR-063. §22/§23 governance META non
  scaffoldata in factory derivate. Migration v2.18 → v2.19 = no-op senza attivazione.

**Cambiamenti chiave v2.17 → v2.18** (gate v2.18.0):
- **A11y + UX/UI Integration opt-in** (PATTERN §3). Fase 1.sexies opt-in — capability `a11y`
  (WCAG 2.2 AA via tool `run_a11y_scan` + skill `accessibility-testing-protocol` + agente
  `a11y-specialist`) e `ux_ui` (via skill `ux-ui-review-protocol` + `ux-ui-design-protocol` +
  agenti `ux-ui-reviewer` + `ui-designer`); no-op a flag spento. 7 ADR risolti (ADR-014..020).

**Cambiamenti chiave v2.16 → v2.17** (gate v2.17.0):
- **FE Visual Oracle opt-in** (PATTERN §3). Fase 1.quinquies opt-in: skill `visual-oracle-protocol`
  + `oracle-precheck` + `/visual-oracle` + blocco config `fe_correctness`; no-op a flag spento.

**Cambiamenti chiave v2.15 → v2.16** (gate v2.16.0):
- **Premortem opt-in** (PATTERN §3). Fase 1.quater opt-in: skill `premortem-protocol` +
  `/premortem` + template `management/risk-registry.md`. Default N (zero friction).

**Cambiamenti chiave v2.14 → v2.15** (gate v2.15.0):
- **Consolidation release** del Compression Layer. Gate Fase 1.5 + 3a riformulati come opt-in
  deferred. Migration v2.14 → v2.15 = no-op di codice.

**Cambiamenti chiave di v2.14** (eredità preservata):
- **Compression Layer a due assi opt-in** (PATTERN §20): Asse OUTPUT (Fase 1 OCL via Caveman,
  R.C1-R.C6) + Asse CONTEXT (Fase 2 CCL via Graphify, R.G1-R.G6). Nuova §7 r.18. 4° sync
  adapter `graphify-sync`. Tooling: Graphify v0.8.22+ (`pip install graphifyy`).

**Architettura skill-driven** (invariata da v2.13):
```
factory-bootstrap (thin orchestrator)
    │
    ├── bootstrap-input-protocol         (input + archetipi)
    ├── bootstrap-multirepo-protocol     (coupling se existing-repo)
    ├── bootstrap-multiadapter-protocol  (adapter selection + scaffold)
    ├── bootstrap-scaffolding-protocol   (file + dir L1-L5 + compression artefacts v2.14+)
    ├── bootstrap-vcs-protocol           (submodule stamps + .factory-lock)
    └── bootstrap-validation-protocol    (35+ check + wiki feeding + report)
```
