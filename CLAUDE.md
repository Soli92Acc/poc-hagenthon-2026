# CLAUDE.md — Soli Multi-Agents Factory

Questo repo segue il pattern definito in [`PATTERN.md`](PATTERN.md) (v2.21, agent-agnostic, multi-adapter, compression layer a due assi opt-in: output Caveman + context Graphify; v2.42 = Session Observability bundle (release da Tavola Rotonda TR-c4e8f1b2, forced-synthesis Round 3 2026-09-08): EP-062 Fleet Telemetry Hardening bugfix always-on (walker fan-in `<session-uuid>/subagents/agent-*.jsonl` in `harvest-session-tokens.py` + `SUPPORTED_CC_VERSIONS` schema-guard con WARNING fail-loud + fixture reale `tests/fixtures/transcripts/cc-2.1.258-with-subagents/` + contract-test 7/7 PASS in `tests/test_harvest_contract.py` — riparazione bug silente che omettendo `isSidechain` non intercettava ~60% attività flotta su Claude Code 2.1.258+) + EP-061 Session Agentic Analyser opt-in (skill `session-analysis-protocol` 5 fasi + comando `/session-analysis` post-hoc su sessioni chiuse + config `session_analysis:` default off + tool chain deterministica stdlib-only in `tools/session-analysis/` [parse-transcript.py 467 LOC + fleet-metrics.py 690 LOC + detect-anomalies.py 935 LOC + generate-report.py 981 LOC] + JSON Schema `schema-anomaly.json` Draft 2020-12 + 10 invarianti R-SAA-1..10 con determinism-first/redazione R-SAA-3/no auto-fix R-SAA-6/out-of-band gate R-SAA-8/kill_criterion R-SAA-10 + tassonomia v1 3 categorie core deterministiche ERROR/BUDGET/DISPATCH + 2 opt-in roadmap LATENCY/FLEET + PATTERN §37 «Session Observability» + integrazione fleet-doctor advisory `fleet_recommendations` mai auto-invoke + runbook handoff + wiki concept + kill_criterion §23.8 hard sunset v2.44 se <5 anomalie azionabili con TSK reale + 10/10 test e2e PASS in `tests/test_session_analysis_e2e.py` + validazione empirica su fixture reale con 1 BUDGET_OVERFLOW rilevata); bundle assorbe gate v2.41.0 PENDING; backward compat totale v2.41; gate v2.42.0 BYPASS 2026-09-08 SLA v2.43 (3 RUN-REPORT); v2.41 = Fleet Health EP-060 opt-in (Refactor Skill Layer: skill `refactor-agent-skills` + agente `fleet-doctor` + Check 4ap WARNING-only + config `refactor_agent_skills:` default off; 9 vincoli V-1..V-9 + 11 gate G1..G11; PATTERN §36; R.FH1/R.FH2/R.FH3; backward compat totale v2.40; gate v2.41.0 PENDING); v2.40 = EP-059 Backport delta da portale-servizi-factory (release-manager + tpm-reconcile + deep-functional-probe + release-protocol + statusline-ledger.py; backward compat totale v2.39; gate v2.40.0 PASS 2026-09-02); v2.38 = Integrazione llm_wiki (TR-llmwiki-20260824, pattern-stealing concettuale GPL v3): EP-055 Semantic Purpose Layer opt-in (`wiki/purpose.md` frontmatter YAML domain/priority_entity_types/tone/exclusions; wiki-keeper Step 0 read-only; lint Check 4an; PATTERN §34) + EP-056 Wiki Keeper 2.0 opt-in (CoT handoff esplicito Fase 1.ter + sweep-reviews semantico `wiki_sweep:` con resolution loop bounded gated + comando `/sweep-reviews`; PATTERN §35) + PATTERN §23.10 Third-Party License & Pattern-Stealing Policy; 8 TSK, sprint 56+57; battle-test reali su 3 factory derivate (3 rotture detector fixate); backward compat totale v2.37; gate v2.38.0 BYPASS 2026-08-24 SLA v2.39; v2.36 = Backport portale-servizi-factory EP-053 (5 pattern: R.21 cooperative locking in 7 agenti + skill /onboarding read-only in-chat + vcs-preflight step 2-bis remote staleness + PATTERN §23.9 ai_attribution_policy + dev-protocol checkpoint analysis-only; 8 TSK, sprint 53; backward compat totale v2.35; gate v2.36.0 PASS 2026-07-30); v2.35 = Bus Factor Mitigation EP-051 gate formale (sprint 52: soli-boy factory derivata pubblica github.com/soli92/soli-boy 176 TSK done + PATTERN §23.8 sunset policy + sunset_date annotations 6 SUNSET v2.38 + 2 EXEMPT + guida onboarding secondo maintainer); 6 TSK, backward compat totale v2.34; gate v2.35.0 PASS 2026-07-21); v2.34 = Governance Enforcement EP-049 (analytics fix + lint Check 4al) + Adoption Onboarding EP-050 (QUICKSTART.md + factory-config-dag.md + JSON schema + starter config) + Bus Factor Mitigation EP-051 (soli-boy factory derivata pubblica + PATTERN §23.8 sunset policy + onboarding) + Tech Debt EP-052 (lint-checks modulare 9 famiglie + pattern_version SSOT + sprint archive + CQRL router layer_filter); 37 TSK, backward compat totale v2.33; gate v2.34.0 PASS 2026-07-21); v2.33 = Content Share Consumer Layer EP-048 opt-in (skill `content-share-protocol` + comando `/share` + invarianti R.CS1..R.CS4 + config `content_share:`; dispatch fire-and-forget via `repository_dispatch` verso soli-frames; gate umano obbligatorio R.CS3; 8 TSK, 9 test; backward compat totale v2.32; gate v2.33.0 PASS 2026-07-17); v2.32 = Capability Formativa EP-045 opt-in (sistema tutoring adattivo MVP: agente tutor abilitabile + 4 skill epistemic-tag/scaffolding/session-mode/retrieval + Student Model SM-2 + retrieval practice loop + curriculum YAML curato a mano; config `capability_formativa:`; 25 TSK, 35 test; backward compat totale v2.31; gate v2.32.0 PASS 2026-07-10) + Voice Hardening EP-046 opt-in (7 contratti FSM voice non supervisionato: lifecycle single-writer C1 + no-cattura-durante-parlato `playing_watchdog_s` C2 + liveness file-pipe C3 + timer cattura config-driven C4 + gate STT `no_speech_prob`+`compression_ratio` C5+C6 + session-owner stub C7; ADR-EP046-001 GO; 24 TSK, 9 test; backward compat totale v2.31; gate v2.32.0 PASS 2026-07-10); v2.31 = Voice Handsfree Improvements EP-044 opt-in (5 fix modulo voice/: debounce VAD US-155 + filtro wake-word Levenshtein US-156 + STT model medium US-157 + file-pipe event-driven watchdog US-158 + PID lock singola istanza US-159; nuovi campi config voice_channel: vad.debounce_ms=500, wake_word.filter_threshold=3, stt.model=medium, runtime.pipe_poll_ms=100+pipe_timeout=180; dipendenza opzionale watchdog; PATTERN §30 esteso; nessuna nuova invariante §7; backward compat totale v2.30; gate v2.31.0 PASS 2026-07-09); v2.30 = Temporal Generative Time Model EP-043 opt-in (Layer 3 Coordinazione real-time: skill `temporal-estimate-protocol` stima adattiva elapsed/progress; comando `/sprint-progress` burndown sprint; config `temporal.estimate_protocol:` + `analytics.sprint_progress:`; PATTERN §3+§18 estesi; backward compat totale v2.29); v2.29 = Hybrid Wiki Search Layer EP-042 opt-in (ricerca semantica ibrida vector+FTS+RRF; LanceDB embedded; sentence-transformers multilingua; skill `wiki-search-protocol`; comandi `/wiki-search`; config `wiki_search:`; PATTERN §31; R.WS1..R.WS3; backward compat totale v2.28); v2.28 = Voice Channel Layer EP-041 opt-in (modulo Python `voice/` esterno al meta-framework; STT/TTS/VAD/AEC; state machine 5 stati; custom loop adapter Opzione B; config `voice_channel:`; PATTERN §30; backward compat totale v2.27); v2.27 = Tavola Rotonda Mode EP-039 opt-in (modalita' multi-agente collaborativa per problemi genuinamente complessi e multi-dominio; agente tavola-rotonda-moderatore; blackboard strutturato wiki/decisions/; skill tavola-rotonda-protocol 5 fasi; Critico anti-compiacenza; R.TR1-R.TR4; comando /tavola-rotonda; config `tavola_rotonda:`; PATTERN §28; ADR-EP039-001 GO; backward compat totale v2.26); v2.26 = Prototype Generation Layer EP-035 opt-in (cascata adattiva figma→penpot→react→html; fallback terminale html garantito INV-1; skill backend-resolver + prototype-generation-protocol + html-prototype-mapping + react-mapping; agente prototype-generator; comandi /prototype + /prototype-status; config `prototyping:`; PATTERN §27; INV-1..INV-6; ADR-EP035-001..006 GO; backward compat totale v2.25); v2.25 = VCS Branch Awareness Layer EP-034 opt-in (declare→inspect→align per multi-repo/submodule: branch-resolver + /vcs-status + gate dev-protocol Fase 0 + drift check vcs-handoff; config `vcs.branch_awareness`; R.B7-R.B10; PATTERN §15 esteso); v2.24 = Runtime Contextual Suggestions EP-033 (push-based: Fase 6 orchestrator + dev-handoff post-exec + suggest-next.py hook); v2.23 = Semantic Drift Detection EP-031 research sprint; PATTERN §25 aggiunto (Semantic Drift Detection); v2.21 = Design Intelligence Layer EP-019 opt-in + Token Ledger EP-022 opt-in; v2.21 = Art-Director DSL + LLM-Generator Separation + Critic/Judge Design + Intention Economy + Token Ledger; PATTERN §24 aggiunto; nessuna nuova invariante §7; v2.20 = FE Functional Oracle EP-018 opt-in; v2.19 = Hardening & Sustainability EP-012..017; v2.18 = A11y + UX/UI Integration opt-in — vedi `CHANGELOG.md`).

## Meta-prompt versioning (v2.42 — corrente) (authoritative source: factory.config.yaml#pattern_version)

Da v2.13 i meta-prompt seed vivono **nel repo** (versionati col PATTERN), accessibili a qualunque agente via raw GitHub URL o local clone:

- [`meta-prompts/v2-42/factory-bootstrap.md`](meta-prompts/v2-42/factory-bootstrap.md) — **current** (Session Observability bundle: EP-062 Fleet Telemetry Hardening bugfix always-on + EP-061 Session Agentic Analyser opt-in + PATTERN §37; assorbe gate v2.41.0 EP-060 PENDING; backward compat totale v2.41; gate v2.42.0 BYPASS 2026-09-08 SLA v2.43)
- [`meta-prompts/v2-41/factory-bootstrap.md`](meta-prompts/v2-41/factory-bootstrap.md) — previous (EP-060 Fleet Health opt-in: refactor_agent_skills + fleet-doctor + Check 4ap + PATTERN §36 + runbook skill-hygiene; backward compat totale v2.40; gate v2.41.0 assorbito da v2.42.0 2026-09-08)
- [`meta-prompts/v2-40/factory-bootstrap.md`](meta-prompts/v2-40/factory-bootstrap.md) — previous (EP-059 Backport delta v2.40 da portale-servizi-factory: release-manager + tpm-reconcile + deep-functional-probe + release-protocol + statusline-ledger.py; backward compat totale v2.39; gate v2.40.0 PASS 2026-09-02)
- [`meta-prompts/v2-36/factory-bootstrap.md`](meta-prompts/v2-36/factory-bootstrap.md) — previous (Backport portale-servizi-factory EP-053: R.21 cooperative locking in 7 agenti + skill /onboarding + vcs-preflight step 2-bis + PATTERN §23.9 ai_attribution_policy + dev-protocol checkpoint analysis-only; 8 TSK, sprint 53; gate v2.36.0 PASS 2026-07-30; backward compat totale v2.35)
- [`meta-prompts/v2-35/factory-bootstrap.md`](meta-prompts/v2-35/factory-bootstrap.md) — previous (Bus Factor Mitigation EP-051 gate formale sprint 52: soli-boy factory derivata pubblica 176 TSK done + PATTERN §23.8 sunset policy + sunset_date annotations 6 SUNSET v2.38 + 2 EXEMPT + guida onboarding secondo maintainer; 6 TSK; gate v2.35.0 PASS 2026-07-21; backward compat totale v2.34)
- [`meta-prompts/v2-34/factory-bootstrap.md`](meta-prompts/v2-34/factory-bootstrap.md) — previous (Governance Enforcement EP-049 + Adoption Onboarding EP-050 + Bus Factor Mitigation EP-051 + Tech Debt Cleanup EP-052: QUICKSTART.md + factory-config-dag.md YAML DAG 45 flag + schemas/factory.config.schema.json 16 regole cross-flag + factory.starter.config.yaml 5 capability core; lint-checks.md modulare 9 famiglie; pattern_version SSOT + Check 4am; PATTERN §23.8 sunset policy; 37 TSK; backward compat totale v2.33; gate v2.34.0 PASS 2026-07-21)
- [`meta-prompts/v2-33/factory-bootstrap.md`](meta-prompts/v2-33/factory-bootstrap.md) — previous (Content Share Consumer Layer EP-048: skill `content-share-protocol` + comando `/share` + R.CS1..R.CS4 + config `content_share:`; dispatch fire-and-forget verso soli-frames; gate umano R.CS3; 8 TSK, 9 test; backward compat totale v2.32; gate v2.33.0 PASS 2026-07-17)
- [`meta-prompts/v2-32/factory-bootstrap.md`](meta-prompts/v2-32/factory-bootstrap.md) — previous (Capability Formativa EP-045 + Voice Hardening EP-046: tutoring adattivo MVP agente tutor + Student Model SM-2 + retrieval practice + curriculum YAML; 7 contratti FSM voice hardening C1..C7; ADR-EP046-001 GO; 25+24 TSK, 35+9 test; backward compat totale v2.31; gate v2.32.0 PASS 2026-07-10)
- [`meta-prompts/v2-31/factory-bootstrap.md`](meta-prompts/v2-31/factory-bootstrap.md) — previous (Voice Handsfree Improvements EP-044: 5 fix modulo voice/ — debounce VAD 500ms (US-155), filtro wake-word Levenshtein threshold=3 (US-156), STT model default medium WER 2.9% (US-157), FilePipeAdapter event-driven watchdog + fallback 100ms (US-158), PID lock singola istanza (US-159); nuovi campi config voice_channel; watchdog opzionale; PATTERN §30 esteso; nessuna nuova invariante §7; backward compat totale v2.30; gate v2.31.0 PASS 2026-07-09)
- [`meta-prompts/v2-30/factory-bootstrap.md`](meta-prompts/v2-30/factory-bootstrap.md) — previous (Temporal Generative Time Model EP-043 opt-in: Layer 3 skill `temporal-estimate-protocol` stima adattiva + comando `/sprint-progress` burndown sprint; config `temporal.estimate_protocol:` + `analytics.sprint_progress:`; PATTERN §3+§18 estesi; nessuna nuova invariante §7; backward compat totale v2.29; gate v2.30.0 PASS 2026-07-09)
- [`meta-prompts/v2-29/factory-bootstrap.md`](meta-prompts/v2-29/factory-bootstrap.md) — previous (Hybrid Wiki Search Layer EP-042 opt-in: ricerca semantica ibrida vector+FTS+RRF su `wiki/`; LanceDB embedded; sentence-transformers `paraphrase-multilingual-MiniLM-L12-v2`; chunk H2-section cap 2000 chars; skill `wiki-search-protocol` 4-step; comandi `/wiki-search <query>` + `reindex [--full]` + `status`; config `wiki_search:` default off; PATTERN §31; R.WS1 fallback garantito + R.WS2 opt-in + R.WS3 read-only; ADR-EP042 GO; backward compat totale v2.28; gate v2.29.0 PASS 2026-07-08)
- [`meta-prompts/v2-28/factory-bootstrap.md`](meta-prompts/v2-28/factory-bootstrap.md) — previous (Voice Channel Layer EP-041 opt-in: modulo Python `voice/` esterno al meta-framework; STT/TTS/VAD/AEC; state machine 5 stati IDLE→CATTURA→TRASCRIZIONE→ELABORAZIONE→PARLATO; custom loop adapter Opzione B; EventRouter allowlist TTS-safe; barge-in Fase 3; AEC Fase 4; config `voice_channel:` default off; PATTERN §30; ADR-EP041-001 GO; backward compat totale v2.27; gate v2.28.0 PASS 2026-07-08)
- [`meta-prompts/v2-27/factory-bootstrap.md`](meta-prompts/v2-27/factory-bootstrap.md) — previous (Tavola Rotonda Mode EP-039: modalità multi-agente collaborativa opt-in; agente `tavola-rotonda-moderatore`; skill `tavola-rotonda-protocol` 5 fasi; comando `/tavola-rotonda`; blackboard strutturato; Critico anti-compiacenza; INV-TR-1..5; R.TR1-R.TR4; config `tavola_rotonda:` default off; PATTERN §28; ADR-EP039-001 GO; backward compat totale v2.26; gate v2.27.0 PASS 2026-07-06)
- [`meta-prompts/v2-27/factory-bootstrap-full.md`](meta-prompts/v2-27/factory-bootstrap-full.md) — **full self-contained** (intera catena v2.15→v2.27 inline, 2165 righe, no `extends:`; consigliata per uso offline / URL singola / LLM non-Claude)
- [`meta-prompts/v2-26/factory-bootstrap.md`](meta-prompts/v2-26/factory-bootstrap.md) — previous (Prototype Generation Layer EP-035: cascata adattiva figma→penpot→react→html opt-in; skill `backend-resolver` + `prototype-generation-protocol` + `html-prototype-mapping` + `react-mapping`; agente `prototype-generator`; comandi `/prototype` + `/prototype-status`; config `prototyping:` default off; PATTERN §27; INV-1..INV-6 locali; ADR-EP035-001..006 GO; backward compat totale v2.25; gate v2.26.0 PASS 2026-07-02)
- [`meta-prompts/v2-25/factory-bootstrap.md`](meta-prompts/v2-25/factory-bootstrap.md) — previous (VCS Branch Awareness Layer EP-034: declare→inspect→align opt-in per multi-repo/submodule; skill `branch-resolver` + `vcs-preflight-protocol` + comando `/vcs-status` + gate `dev-protocol` Fase 0 + drift check `vcs-handoff`; config `vcs.branch_awareness` default off; PATTERN §15 esteso + R.B7-R.B10 locali; nessuna nuova invariante §7 (resta 18); ADR-EP034-001 GO; backward compat totale v2.24; gate v2.25.0 PENDING)
- [`meta-prompts/v2-24/factory-bootstrap.md`](meta-prompts/v2-24/factory-bootstrap.md) — previous (Runtime Contextual Suggestions EP-033: Fase 6 orchestrator.md 6 regole push-based + dev-handoff sezione post-exec per-layer + suggest-next.py hook Stop; backward compat totale v2.23; nessuna nuova invariante §7; gate v2.24.0 PENDING)
- [`meta-prompts/v2-23/factory-bootstrap.md`](meta-prompts/v2-23/factory-bootstrap.md) — previous (Semantic Drift Detection EP-031 research sprint; estende v2-21; capability derivabile: semantic_drift (Check 4ag staleness always-on + Check 4af embedding opt-in + skill `semantic-drift-scan-protocol` + comando `/semantic-drift-scan`; config `wiki_lint.semantic_check:`; ADR-EP031-001 GO-MODIFIED; piramide L1 staleness + L2 LLM-judge + L3 embedding); nessuna nuova invariante §7; gate v2.23.0 PASS 2026-06-25)
- [`meta-prompts/v2-23/factory-bootstrap-full.md`](meta-prompts/v2-23/factory-bootstrap-full.md) — **full self-contained** (intera catena v2.15→v2.23 inline, no `extends:`; consigliata per uso offline / URL singola / LLM non-Claude)
- [`meta-prompts/v2-21/factory-bootstrap.md`](meta-prompts/v2-21/factory-bootstrap.md) — previous (Design Intelligence Layer EP-019 opt-in + Token Ledger EP-022 opt-in; estende v2-20; capability derivabili: design_intelligence (art-director DSL + reasoning-first + LLM-Generator Separation + Critic/Judge + Intention Economy, ADR-068..071) + token_ledger (visibilità token reali inline, EP-022); PATTERN §24 «Design Intelligence Layer»; nessuna nuova invariante §7; +1 N:1 complexity budget)
- [`meta-prompts/v2-21/factory-bootstrap-full.md`](meta-prompts/v2-21/factory-bootstrap-full.md) — previous full self-contained (intera catena v2.15→v2.21 inline, 1423 righe, no `extends:`)
- [`meta-prompts/v2-20/factory-bootstrap.md`](meta-prompts/v2-20/factory-bootstrap.md) — previous (FE Functional Oracle EP-018 opt-in; estende v2-19; unica capability di prodotto derivabile: functional oracle via `functional-oracle-protocol` + `interaction-drive-protocol` + `/functional-oracle` + schema `acceptance-spec` + dominio scheduler `functional-oracle`; default `fe_correctness.functional_oracle.enabled: false`; ADR-065/066/067; nessuna nuova invariante §7)
- [`meta-prompts/v2-19/factory-bootstrap.md`](meta-prompts/v2-19/factory-bootstrap.md) — previous (Hardening & Sustainability EP-012..017; estende v2-18; delta derivabile: EP-013 Analytics Dogfooding opt-in + fix ux_ui anti-fabbricazione ADR-063; §22/§23 governance META non scaffoldata; nessuna nuova invariante §7)
- [`meta-prompts/v2-18/factory-bootstrap.md`](meta-prompts/v2-18/factory-bootstrap.md) — legacy (A11y + UX/UI Integration opt-in; estende v2-17 con Fase 1.sexies opt-in — attiva `a11y` (Accessibility Testing WCAG 2.2 AA) + `ux_ui` (UX/UI Review & Design); 7 ADR risolti ADR-014..020; integrazioni no-op a flag spento)
- [`meta-prompts/v2-17/factory-bootstrap.md`](meta-prompts/v2-17/factory-bootstrap.md) — legacy (FE Visual Oracle Integration opt-in; estende v2-16 con Fase 1.quinquies opt-in — attiva `visual-oracle-protocol` + `oracle-precheck` + `/visual-oracle` + config `fe_correctness`; integrazioni no-op a flag spento)
- [`meta-prompts/v2-16/factory-bootstrap.md`](meta-prompts/v2-16/factory-bootstrap.md) — legacy (Premortem Integration opt-in; estende v2-15 con Fase 1.quater)
- [`meta-prompts/v2-15/factory-bootstrap.md`](meta-prompts/v2-15/factory-bootstrap.md) — legacy (consolidation release Compression Layer)
- [`meta-prompts/v2-14/factory-bootstrap.md`](meta-prompts/v2-14/factory-bootstrap.md) — legacy (Compression Layer a due assi opt-in)
- [`meta-prompts/v2-13/factory-bootstrap.md`](meta-prompts/v2-13/factory-bootstrap.md) — legacy (multi-adapter scaffolding parallelo)
- [`meta-prompts/v2-12/factory-bootstrap.md`](meta-prompts/v2-12/factory-bootstrap.md) — legacy (CQRL + multi-repo)
- [`meta-prompts/v2-11/factory-bootstrap.md`](meta-prompts/v2-11/factory-bootstrap.md) — snapshot storico
- [`meta-prompts/README.md`](meta-prompts/README.md) — changelog inter-versione

Dispatcher Claude Code: source-of-truth versionata in [`.claude/commands/factory-bootstrap.md`](.claude/commands/factory-bootstrap.md) (default v2.40), da installare user-level con `cp .claude/commands/factory-bootstrap.md ~/.claude/commands/`.

Per usare versione specifica: `/factory-bootstrap <args> --version=v2-40` (corrente, delta) o `--version=v2-36` (previous, delta) o `--version=v2-35` (previous, delta) o `--version=v2-34` (previous, delta) o `--version=v2-33` (previous, delta) o `--version=v2-32` (previous, delta) o `--version=v2-31` (previous, delta) o `--version=v2-28` (previous, delta) o `--version=v2-27` (previous, delta) o `--version=v2-27-full` (**consigliata per offline/collega v2.27**: seed integrale, no extends) o `--version=v2-26` (previous, delta) o `--version=v2-26-full` (seed integrale v2.26) o `--version=v2-25` (previous, delta) o `--version=v2-25-full` (**consigliata per offline/collega v2.25**: seed integrale, no extends) o `--version=v2-24` (previous, delta) o `--version=v2-23` (delta) o `--version=v2-23-full` (seed integrale v2.23, no extends) o `--version=v2-21` o `--version=v2-21-full` o `--version=v2-20` o `--version=v2-19` o `--version=v2-18-full` (variante consolidata self-contained v2.18) o `--version=v2-18` (o v2-17/v2-16/v2-15/v2-14/v2-13/v2-12/v2-11).

## Adapter registry (v2.32)

Multi-adapter support via [`adapters/<name>/manifest.yaml`](adapters/README.md):

| Adapter | Maturity | Folder runtime |
|---|---|---|
| `.claude/` | full reference | `.claude/` (root del meta-framework) |
| `.cursor/` | full v2.32 | [`adapters/cursor/`](adapters/cursor/) |
| `.aider/` | full v2.13 | [`adapters/aider/`](adapters/aider/) |
| `.openai/` | partial (setup.py stub) | [`adapters/openai/`](adapters/openai/) |
| `.gemini/` | manifest-only | [`adapters/gemini/`](adapters/gemini/) |
| `.chatgpt/` | manifest-only | [`adapters/chatgpt/`](adapters/chatgpt/) |

Una factory può ospitare 1+ adapter simultaneamente (R.A1-R.A6, PATTERN §12.2).

## Adapter Claude Code

L'adapter Claude Code vive in `.claude/`:
- **Agenti** (`.claude/agents/`):
  - core — `orchestrator` (con parallel scheduler v2.11), `sync-docs`, `figma-sync` (v2.9), `repo-sync` (v2.12), `graphify-sync` (v2.14 Fase 2), `wiki-keeper`, `wiki-keeper-worker` (sub-agent ingest paralleli, v2.4), `product-manager`, `lead-architect`, `tpm`, `wiki-query`, `wiki-lint`
  - dev (v2.7, opzionali per topologia) — `be-dev`, `fe-dev`, `db-dev`, `qa-dev`
  - publisher (v2.10, opzionali per `kanban_publish.provider`) — `github-publisher` (e futuri `gitlab-publisher`/`jira-publisher`/`linear-publisher`)
  - review (v2.12, opzionale per `code_quality.enabled: true`) — `code-reviewer`
  - release (v2.40, opt) — `release-manager` (coordina ciclo vita release: pianificazione → gate → tag)
- **Skill** (`.claude/skills/`): template e procedure ri-utilizzabili
  - core: `scrivi-wiki-page`, `scrivi-epica`, `scrivi-user-story`, `scrivi-task`, `apri-question`, `ingest-protocol`, `lint-checks`, `heal-protocol`, `propagate-resolution`
  - dev (v2.7): `dev-protocol`, `dev-handoff`, `tech-scout`
  - VCS (v2.8): `vcs-handoff`
  - sync (v2.9-v2.14): `figma-extraction-protocol`, `repo-extraction-protocol` (v2.12), `graphify-extraction-protocol` (v2.14 Fase 2)
  - publisher (v2.10): `publisher-protocol` (provider-agnostic), `github-mapping` (provider-specific)
  - scheduler (v2.11): `parallel-scheduling` (DAG dispatcher)
  - CQRL (v2.12): `stack-detector` (condivisa code-reviewer + repo-sync), `code-review-protocol` (5 fasi), `feedback-router` (handoff Reviewer→dev-agent)
  - **tpm (v2.40)**: `tpm-reconcile` (riconciliazione periodica kanban vs esecuzione reale; input: filtro epica opzionale; output: report in-chat anomalie + raccomandazioni; sola lettura)
  - **qa / oracle (v2.40)**: `deep-functional-probe` (probe funzionale avanzato per scenari complessi; complemento a `functional-oracle-protocol` EP-018; opt-in: `fe_correctness.functional_oracle.enabled: true`; output PASS/FAIL + evidence)
  - **release (v2.40)**: `release-protocol` (4 fasi: preparazione → validazione gate → [GATE UMANO] tag VCS → post-release; skill primaria di release-manager; gate umano non bypassabile pre-tag; complementare a `release-validation-gate`)
  - **fleet-health (v2.41, opt)**: `refactor-agent-skills` (skill operativa refactor unità agentiche in divulgazione progressiva; 5 fasi 0–5; V-1..V-9; G1..G11; agente owner `fleet-doctor`; soglie config-driven; snap/rollback via V-6; Pattern A dispatch-safe)
  - **session-observability (v2.42, EP-061, opt-in)**: `session-analysis-protocol` (skill 5 fasi Bootstrap → Collect Sources → Parse & Normalize → Detect Anomalies → Report Generation per analisi critica post-hoc di sessioni Claude Code chiuse; determinism-first, LLM advisory; solo out-of-band; 10 invarianti R-SAA-1..10; tool chain deterministica stdlib-only in `tools/session-analysis/`; kill_criterion §23.8 hard sunset v2.44; PATTERN §37)
  - **routing (v2.27, factory-optimization)**: `dispatch-policy` (contratto unico di dispatch condizionale — thin-orchestrator pattern; 8 sezioni: VCS Preflight §1, Oracle §2, A11y §3, UX/UI §4, Functional Oracle §5, Temporal Context §6, Fase 6 §7, Capability Advertisement §8) + `wiki-keeper-worker-protocol` (protocollo worker sub-agent ingest parallelo — input/output/vincoli/errori)
  - **bootstrap (v2.12, usate dal meta-prompt `/factory-bootstrap`)**: `bootstrap-input-protocol`, `bootstrap-multirepo-protocol`, `bootstrap-scaffolding-protocol`, `bootstrap-vcs-protocol`, `bootstrap-validation-protocol`
  - **compression (v2.14)**: `caveman-protocol` (Fase 1 output, 5 fasi: Bootstrap → Identify Channel → Apply Compression → Drift Check → Log; intercept inline nel `parallel-scheduling`), `graphify-extraction-protocol` (Fase 2 context, 5 fasi: Bootstrap → Discovery+Cost → Build Graph → Side-channel write+Summary → Log)
- **Commands** (`.claude/commands/`): `/run` (esteso v2.11: wave dispatch parallelo se ≥ 2 candidati), `/sync-docs`, `/figma-sync` (v2.9), `/repo-sync` (v2.12), `/graphify-sync` (v2.14 Fase 2), `/kanban-publish` (v2.10), `/review` (v2.12), `/compression` (v2.14), `/query`, `/lint`, `/promote`, `/heal`, `/dev` (v2.7), `/topology` (v2.7), `/tavola-rotonda` (v2.27, EP-039 opt-in — deliberazione multi-agente strutturata), `/session-analysis` (v2.42, EP-061 opt-in — analisi critica post-hoc dell'attività agentica di una sessione chiusa; determinism-first + out-of-band + no auto-fix)
  - **Meta-comandi** (operano su una factory dall'esterno, NON scaffoldati nelle factory derivate): `/factory-bootstrap` (crea factory nuova), `/factory-upgrade` (aggiorna factory esistente alla versione target via delta incrementale non distruttivo; skill `factory-upgrade-protocol`; default dry-run, `--apply` per eseguire; fulfills roadmap `/retrofit-factory`)

## Configurazione factory

[`factory.config.yaml`](factory.config.yaml) al root del repo configura:
- **Central Model Registry** (v2.27, factory-optimization): `models.routing.tier_fast` / `tier_default` / `tier_deep` — unico posto dove aggiornare i model ID per tutti gli agenti; `models.overrides: {}` per eccezioni per-agente. Tier di default: `tier_fast: claude-haiku-4-5-20251001`, `tier_default: claude-sonnet-4-6`, `tier_deep: claude-opus-4-8` (PATTERN §29.2, cap fan-out + costo ottimizzato).
- **Topologia** (`knowledge-only` | `plan-only` | `full-stack-agents` | `hybrid-be-agents` | `hybrid-fe-agents` | `custom`)
- **Code paths** (v2.12 multi-repo, PATTERN §13): lista di entry `{name, path, layers, tags, vcs}` per supportare FE/BE disaccoppiati, microservizi, micro-frontend, monorepo logico. Legacy `code_path:` (singolare) accettato e auto-promosso. TSK guadagna campo `target:` opzionale (required solo se ambiguità).
- **VCS mode** per ciascuna entry (multi-repo) o top-level (legacy): `monorepo` | `submodule` | `sibling` | `external` | `none` + `branch_strategy` + `commit_coupling` — v2.8. Al massimo **una** entry può essere `monorepo` (R.B6).
- **Stack mode** (`manual` | `guided` | `auto`)
- **Routing** TSK → consumer (`agent` | `human`) per layer
- **Kanban publish** (v2.10): `kanban_publish.provider` (`none` | `github` | `gitlab` | `jira` | `linear` | `custom`) + `target` + `auth_env` + `mode: push-only` + `batch_limit` + `mapping` + `labels` + `filter`
- **Parallel scheduler** (v2.11): `scheduler.enabled` (default `true`) + `max_parallel` (cap fan-out, default `4`) + `parallel_gate_threshold` (gate umano sopra N parallel, default `3`) + `code_path_conflict` (`strict|warn|off`) + `empty_code_path_policy` (`serial|parallel`) + `domains:` (opt-in/out per dominio: ingest/develop/lint/query/plan/design/publish/sync/**review v2.12**)
- **Code quality review** (v2.12): `code_quality.enabled` (default `false`) + `max_iterations` (default 3, R.Q4) + `thresholds` (`confidence_min: 0.6`, `batching_split: 7`, `pass_rate_warn: 0.05`, `false_positive_warn: 0.30`) + `passes` (idiomaticity/design/robustness) + `router` (`strategy: severity-tiered`, `max_diff_lines: 80`) + `ruleset.path` + `reports.path`
- **Compression layer** (v2.14, PATTERN §20):
  - **Asse output (Fase 1)**: `compression.output.enabled` (default `false`, opt-in R.C6) + `provider: caveman` + `policy_profile` (`conservative` default | `aggressive` | `custom`) + `invariants` non overridabili (`to_user`/`to_artifact`/`propagate_resolution` sempre off, R.C1) + `channels` (solo se `custom`) + `chain_depth_downgrade` (R.C3) + `cross_factory: off` (R.C4 in federated) + `drift_fallback` (R.C5, marker `AMBIGUOUS_HANDOFF`/`REQUEST_CLARIFY`)
  - **Asse context (Fase 2)**: `compression.context.enabled` (default `false`, opt-in R.G6) + `provider` (`none` | `graphify-cloud` | `graphify-ollama`) + `targets` (lista `{kind: code_path|wiki, name|path, gitignore_patterns}`) + `update_strategy` (default `incremental`) + `full_rebuild_cron` (weekly drift mitigation R.G4) + `ci_strategy` (`cache-with-fallback` default) + `confidence_gating` (R.G2: executor → `EXTRACTED` only / explorer → `+INFERRED` / reviewer → tutto) + `full_rebuild_cost_warn` (USD soglia conferma esplicita) + `mcp_server` (per-agent default | shared opt-in)
- **Hybrid Wiki Search** (v2.29, EP-042, PATTERN §31, opt-in): `wiki_search.enabled` (default `false`) + `embedding_model: paraphrase-multilingual-MiniLM-L12-v2` + `mode: hybrid` (hybrid|vector|fts) + `top_k: 5` + `exclude_types: [meta]`; a flag spento factory identica a v2.28; dipendenze `lancedb`/`sentence-transformers` non importate (R.WS2); indice in `.wiki-search/index.lance` (gitignored); aggiornamento via `/wiki-search reindex`
- **Temporal Estimate Protocol** (v2.30, EP-043, opt-in): `temporal.estimate_protocol.enabled` (default `false`) + `budget_ms` (S/M/L/XL in ms) + `thresholds` (warn/escalate_time_ratio, escalate_confidence_min); skill `.claude/skills/temporal-estimate-protocol.md` 4 fasi; invocazione post temporal-budget-governor pre-retry-wave
- **Sprint Progress Signal** (v2.30, EP-043, opt-in): `analytics.sprint_progress.enabled` (default `false`) + `velocity_rolling_days: 7`; tool `tools/analytics/sprint-progress.py`; comando `/sprint-progress`; fallback kanban garantito
- **Ponytail Decision Ladder** (v2.39, EP-057, opt-in): `ponytail.enabled` (default `false`) + `passes.yagni_ladder` (richiede `code_quality.enabled: true`, HARD DEP) + `lint.severity` (warning|info, forzato info su `code_path: "."`) + `audit.exclude_patterns`; YAGNI gate a 7 livelli (Lint Check 4ao WARNING-only post-develop + Pass 4 advisory in code-review-protocol mai determinante); comandi `/ponytail-review` + `/ponytail-audit` + riga `/ponytail-gain` nel token ledger; invariante locale R.PY1 (security/a11y/trust-boundary inviolabili, non bypassabile); a flag spento factory identica a v2.38; vedi `wiki/concepts/decision-ladder.md`

Vedi `PATTERN.md` §13 (topology), §14 (stack modes), §15 (VCS), §16 (sync adapters multi-sorgente — PDF + Figma + repo esistente v2.12 + **graph v2.14 Fase 2**), §17 (publisher adapters multi-target), §18 (parallel scheduling v2.11), §19 (code quality review layer v2.12), §20 (compression layer a due assi v2.14), **§29 (factory scalability patterns v2.27: thin-orchestrator, capability advertisement, WAVE_ID propagation, Check 4ai)**.

## Quick start

- Percorso guidato da zero a primo TSK done: **[QUICKSTART.md](QUICKSTART.md)** (≤30 min, senza leggere PATTERN.md)
- **Onboarding per nuovi contributor** (v2.36, EP-053): `/onboarding` → report in-chat contestuale (versione factory, task onboarding-friendly, 5 invarianti §7, passo successivo)
- Scoprire la capability giusta per il tuo task: `/help <domanda in linguaggio naturale>`
- Stato del progetto + wave dispatch parallelo se applicabile (v2.11): `/run`
- Nuovo PDF in `raw/`: `/sync-docs` → poi invoca `wiki-keeper` per l'ingest
- Estrazione da file Figma: `/figma-sync <url|file_key>` → poi invoca `wiki-keeper` per l'ingest L1→L2 (v2.9)
- **Estrazione da repo esistente** (v2.12): `/repo-sync <path>` → produce `raw/YYYY-MM-DD-repo-<slug>.md` → poi `wiki-keeper` per l'ingest
- Domanda al wiki: `/query <domanda>` (aggiungi `--ephemeral` per non salvare)
- **Ricerca semantica wiki** (v2.29, EP-042, opt-in): `/wiki-search <domanda>` (richiede `wiki_search.enabled: true` in `factory.config.yaml`; `/wiki-search reindex` per costruire l'indice; `/wiki-search status` per diagnostica)
- **Code Intelligence Stack L1** (v2.37, EP-054, opt-in): lookup esatto simbolo senza ML → `bash tools/code-intelligence/ctags-index.sh <path> <slug>` poi query `grep "^<symbol>\t" .ctags-state/<slug>/tags`; richiede `universal-ctags` + `code_intelligence.l1_ctags.enabled: true`
- **Code Intelligence Stack L2** (v2.37, EP-054, opt-in): `/code-search <domanda>` ricerca semantica symbol-level (richiede `code_intelligence.l2_semantic.enabled: true`; `/code-search reindex` per costruire l'indice; `/code-search status` per diagnostica)
- **Code Intelligence Stack L3** (v2.37, EP-054, opt-in): `graphify affected "<symbol>"` integrato in Fase 0.bis del `dev-protocol` se `code_intelligence.l3_impact.enabled: true`; installazione e uso: [`wiki/runbooks/code-intelligence.md`](wiki/runbooks/code-intelligence.md)
- **Burndown sprint corrente** (v2.30, EP-043, opt-in): `/sprint-progress` (sprint corrente), `/sprint-progress <N>` (sprint specifico), `/sprint-progress --json` (machine-readable); fallback a conteggio kanban se event store non disponibile
- Health check: `/lint`
- Heal ERROR meccanici da lint report: `/heal [<report-path>]`
- Promote pagina: `/promote <path> <new-status>`
- Topologia / routing: `/topology [show|set <topology>]` (v2.7)
- Consumare un TSK con dev-agent: `/dev <TSK-id>` (v2.7)
- Pubblicare kanban su tool esterno: `/kanban-publish [show|set <provider>|run|dry-run]` (v2.10)
- **Code review di un TSK done** (v2.12): `/review <TSK-id>` → verdict pass/conditional/reject; loop bounded da `code_quality.max_iterations`
- **YAGNI review di un diff** (v2.39, EP-057, opt-in): `/ponytail-review <TSK-id|branch|file|--staged> [--save]` → tabella candidati alla semplificazione via Decision Ladder (Pass 4 advisory standalone, nessun verdict); richiede `ponytail.enabled: true`. Full-repo: `/ponytail-audit [<path>]`
- **Configurare compression layer** (v2.14): `/compression [show|set <k> <v>|policy <profile>|dry-run]` → mostra/cambia policy_profile + stats wave; intercept inline nel scheduler quando `enabled: true`
- **Estrarre knowledge graph da code_path** (v2.14 Fase 2): `/graphify-sync <target>` → produce `raw/<data>-graph-<slug>.md` + side-channel `.graphify-state/code_paths/<slug>/{graph.json,GRAPH_REPORT.md}`; consumato dai dev-agent come context replacement quando `compression.context.enabled: true`. Prerequisito install: vedi [`wiki/runbooks/graphify-installation.md`](wiki/runbooks/graphify-installation.md) — `pip install graphifyy` (PyPI doppia-y) → binario `graphify` (singola-y) v0.8.22+. CLI key commands: `graphify update <path>` (incremental), `--force` (full rebuild), `affected "<X>"` (blast radius pre-check), `diagnose multigraph` (ghost dup check).
- **Aggiornare una factory esistente alla versione target**: `/factory-upgrade [factory-path] [--to=v2-19] [--apply]` → rileva la versione corrente, calcola la catena di delta e applica SOLO le parti mancanti in modo additivo e non distruttivo (file nuovi + blocchi config con flag `false` + sezioni in file non personalizzati + `PATTERN.md` verbatim); i file personalizzati diventano CONFLICT con suggerimento patch (mai auto-merge). Default dry-run (piano + STOP); `--apply` esegue con backup + VCS gate. Skill `factory-upgrade-protocol`.
- Eseguire functional oracle su TSK o app: `/functional-oracle <TSK-id|app>` (v2.20, EP-018, opt-in)
- **Avviare sessione Tavola Rotonda** (v2.27, EP-039, opt-in): `/tavola-rotonda "<topic>" [--partecipanti=<lista>] [--max-round=<N>] [--budget=<USD>] [--critico=<slug>]` — richiede `tavola_rotonda.enabled: true` in `factory.config.yaml` (o `--budget=<USD>` obbligatorio se `budget.max_cost_usd` assente; vedi PATTERN §28 + `wiki/runbooks/tavola-rotonda.md` per decision tree attivazione)

## Pipeline tipica con CQRL attivo (v2.12)

```
TSK status:todo ─/dev─▶ status:done, review_status:pending
                              │
                              ▼ (auto via /run, dominio scheduler `review`)
                       /review <TSK-id>
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
       pass: chiusura  conditional: dispatch  reject: gate umano
                       dev-agent (loop max 3) (PATTERN §7 r.16)
```

## Memoria cross-conversazione

Il tree `memory/{episodic,semantic,procedural}/` persiste tra conversazioni. L'orchestrator
scrive in `episodic/`; `semantic/` e `procedural/` sono curati a mano o promossi. Con
CQRL attivo (v2.12), il `feedback-router` aggiorna `memory/semantic/dev-<layer>-recurring-issues.md`
con i pattern ricorrenti per dev-agent → input per i prossimi Develop ("miglioramento a monte").

## Storage CQRL (v2.12)

- `code_quality/rules/{canonical,emergent,team-specific}/<rule_id>.md` — KB evolutiva (filesystem-based)
- `code_quality/reports/<TSK-id>-iter-<N>.{json,md}` — report per iterazione (JSON machine-readable + digest umano)
- `code_quality/reports/_digests/<dev-agent>-<YYYY-WW>.md` — digest aggregati settimanali per dev-agent

Side-channel (non un layer del cascade L1→L5), analogo a `memory/`. Scritto solo da
`code-reviewer` (R.Q2 + R.Q6). Le regole `canonical` e `team-specific` sono curate a mano.

## Mapping ruoli PATTERN.md → file adapter

| Ruolo §2 | File |
|---|---|
| Orchestrator | `.claude/agents/orchestrator.md` |
| Sync (PDF) | `.claude/agents/sync-docs.md` |
| Sync (Figma, v2.9) | `.claude/agents/figma-sync.md` |
| Sync (Repo, v2.12) | `.claude/agents/repo-sync.md` |
| Analyst | `.claude/agents/wiki-keeper.md` |
| PM | `.claude/agents/product-manager.md` |
| Arch | `.claude/agents/lead-architect.md` |
| TPM | `.claude/agents/tpm.md` |
| Query | `.claude/agents/wiki-query.md` |
| Lint | `.claude/agents/wiki-lint.md` |
| BE-Dev (v2.7, opt) | `.claude/agents/be-dev.md` |
| FE-Dev (v2.7, opt) | `.claude/agents/fe-dev.md` |
| DB-Dev (v2.7, opt) | `.claude/agents/db-dev.md` |
| QA-Dev (v2.7, opt) | `.claude/agents/qa-dev.md` |
| Publisher GitHub (v2.10, opt) | `.claude/agents/github-publisher.md` |
| Code Reviewer (v2.12, opt) | `.claude/agents/code-reviewer.md` |
| Release Manager (v2.40, opt) | `.claude/agents/release-manager.md` |
| Fleet Doctor (v2.41, opt) | `.claude/agents/fleet-doctor.md` |
| Ingest worker (v2.4, sub-agent) | `.claude/agents/wiki-keeper-worker.md` |

## §code_intelligence — Code Intelligence Stack (EP-054, v2.37, opt-in)

Stack a tre layer local-first per navigazione codice da parte degli agenti.
Zero dipendenze esterne. `code_intelligence.enabled: false` di default (R.CI1).

| Layer | Tool | Risponde a | Comando |
|---|---|---|---|
| L1 Symbol Resolver | universal-ctags | "dove è definita X?" | `grep` su `.ctags-state/` |
| L2 Semantic Search | tree-sitter + nomic-embed-code + LanceDB | "dove viene gestita Y?" | `/code-search <query>` |
| L3 Impact Graph | graphify (EP-052) | "cosa si rompe se cambio Z?" | Fase 0.bis dev-protocol |

Installazione e configurazione completa: [`wiki/runbooks/code-intelligence.md`](wiki/runbooks/code-intelligence.md)

## §refactor_agent_skills — Fleet Health (EP-060, v2.41, opt-in)

Capability opt-in per il refactor di skill/agenti/flotte via divulgazione
progressiva. Zero dipendenze esterne (stdlib Python).

| Aspetto | Valore |
|---|---|
| Skill | `.claude/skills/refactor-agent-skills.md` |
| Foglie | `.claude/skills/references/refactor/` (5 file) |
| Script | `tools/refactor/{analizza_target,mappa_riferimenti,verifica_flotta}.py` |
| Agente owner | `fleet-doctor` (`.claude/agents/fleet-doctor.md`) |
| Config gate | `refactor_agent_skills.enabled: false` (default) |
| Lint check | Check 4ap (WARNING-only, `.claude/skills/lint-checks-agent-fleet.md`) |
| Runbook | [`wiki/runbooks/skill-hygiene.md`](wiki/runbooks/skill-hygiene.md) |

Vedi PATTERN.md §36 per il pattern completo.

## §session_analysis — Session Agentic Analyser (EP-061, v2.43-candidate, opt-in)

Capability opt-in per analisi critica post-hoc dell'attivita agentica di sessioni
Claude Code chiuse. Determinism-first (regole deterministiche, no LLM per detection),
LLM advisory. Solo out-of-band (mai in-sessione, R-SAA-8). Zero dipendenze esterne
(stdlib Python).

| Aspetto | Valore |
|---|---|
| Skill | `.claude/skills/session-analysis-protocol.md` (5 fasi) |
| Comando | `/session-analysis [--last N|<session-id>] [--depth=quick|full] [--json] [--save]` |
| Tool | `tools/session-analysis/{parse-transcript,fleet-metrics,detect-anomalies,generate-report}.py` |
| Schema | `tools/session-analysis/schema-anomaly.json` (Draft 2020-12) |
| Config gate | `session_analysis.enabled: false` (default) |
| Precondizione HARD | EP-062 Fleet Telemetry Hardening (walker subagent-aware) |
| Report output | `raw/YYYY-MM-DD-session-analysis-<id-8char>.{md,json}` (dual) |
| Frontmatter invariante | `ingest_eligible: false`, `wiki_ingest_policy: incidents-only`, `ttl_days: 90` |
| Tassonomia v1 (deterministica) | ERROR, BUDGET, DISPATCH (3 core enabled); LATENCY, FLEET (2 opt-in roadmap) |
| Integrazione fleet-doctor | Advisory (`fleet_recommendations` campo JSON), mai auto-invoke (R-SAA-6) |
| Runbook handoff | [`wiki/runbooks/session-analysis-fleet-doctor-handoff.md`](wiki/runbooks/session-analysis-fleet-doctor-handoff.md) |
| Kill criterion §23.8 | Hard sunset v2.44 se <5 anomalie azionabili con TSK reale (vedi `EP-061.md#sunset_condition`) |
| Invarianti | R-SAA-1..10 (read-only, redazione, no auto-fix, out-of-band, schema-guard, kill criterion) |
| Provenienza | Tavola Rotonda TR-c4e8f1b2 (forced-synthesis Round 3) — `wiki/decisions/tavola-rotonda-c4e8f1b2-...-2026-09-08.md` |

Concept wiki: [`wiki/concepts/session-agentic-analyser.md`](wiki/concepts/session-agentic-analyser.md)

## §ai_policy — AI Attribution Policy (EP-053, v2.36, opt-in)

Per factory con un `code_path` appartenente a un cliente che non vuole AI attribution
nei commit: imposta `ai_attribution_policy.suppress_ai_traces: true` in `factory.config.yaml`
e usa `tools/vcs/sm-commit.sh "messaggio"` per i commit nel repo cliente (non per i commit
del framework). Vedi [PATTERN.md §23.9](PATTERN.md) per il pattern completo.

## Token Ledger (EP-022, v2.21)

`analytics.token_ledger.enabled: true` — **a fine di ogni risposta che include tool call, sub-agent o modifiche file**, esegui e mostra inline:

```bash
python3 "/Users/simone.olivieri/Documents/Personal/Repos/soli-multi-agents-factory/tools/analytics/show-session-tokens.py"
```

Output compatto (default) — oppure `--full` per il box completo. Questo sostituisce il
meccanismo hook `Stop` che non è visibile nella chat dell'estensione VS Code. Per altri
adapter (Cursor, Aider) il hook nel rispettivo adapter config gestisce la visualizzazione.
Invariante: mai omettere il token count se `token_ledger.enabled: true` e la risposta ha
prodotto lavoro concreto (modifica file, tool use, lancio agente).

**`/ponytail-gain` (EP-057, v2.39, opt-in)**: se `ponytail.enabled: true` e almeno un report
`code_quality/reports/ponytail-audit-*.md` esiste, `show-session-tokens.py` stampa una riga
aggiuntiva `◉ PONYTAIL  audit: <N> file  candidati: <M>  saving stimato: ~<K> righe`
(dall'ultimo audit). A flag spento o senza report la riga è omessa (fail-open, zero nuove
dipendenze). Alimentata da `/ponytail-audit`.

**Alternativa compatta (v2.40)**: `python3 tools/analytics/statusline-ledger.py` →
output su 1 riga (`◉ TOKENS  in: Xk  out: Yk  cost: $Z`); `--json` per machine-readable.
Degrada gracefully se il ledger non è attivo (exit 0, riga vuota).
