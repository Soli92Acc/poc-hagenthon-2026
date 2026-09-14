# Changelog

Tutte le modifiche significative al meta-framework **Soli Multi-Agents Factory** sono documentate in questo file.

Il formato si ispira a [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il versionamento segue [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (relativo al `PATTERN.md` come contratto pubblico del framework).

Ogni versione corrisponde a un tag git annotato e a una GitHub Release. Cliccando sulla versione si apre il diff completo.

---

## [Unreleased]

### Adapter agnosticism (Sprint 1 + solid tools model)

- **Capability matrix** — `adapters/capability-matrix.yaml` + sezione in `adapters/README.md`
  (capability × runtime, orchestration profiles, maturity `core`).
- **Orchestration profiles** — ogni `adapters/*/manifest.yaml` dichiara
  `orchestration.profile` (`native|sequential|external|viewer`) + `features` +
  `role_profile`.
- **Aider core-LTS** — `maturity: core` (non più `full` a contract 2.13): L1–L4 +
  develop base; EP v2.14+ fuori scaffold guarantee.
- **Viewer profile** — Gemini/ChatGPT dichiarati `viewer` (query/lettura, non writer).
- **Claude manifest** — `adapters/claude/manifest.yaml` (reference formale).
- **Canonical `tools/` (solid)** — config + hooks puntano a `tools/…`;
  `.claude/tools/*` solo shim ≤20 linee; `suggest-next.py` mosso a
  `tools/runtime/suggest-next.py`; `factory.config.yaml` `tools_dir` /
  `helper_path` aggiornati; `.claude/settings.json` invoca path canonici.
- **check-adapter-lag** — `tools/adapters/check-adapter-lag.py` (+ enforcement shim
  policy + test in `tools/tests/test_meta_framework.py`).
- **Bootstrap** — `bootstrap-multiadapter-protocol` Fase 0.5 capability/orchestration gate.
- **PATTERN §12** — maturity `core`, schema `orchestration` / `role_profile`, tabella registry aggiornata;
  path analytics/temporal operativi → `tools/…`.

---

## [v2.42.0] — Session Observability bundle: EP-062 Fleet Telemetry Hardening + EP-061 Session Agentic Analyser (+ EP-060 v2.41 gate assorbito) (2026-09-08)

**Rilascio bundle**: chiude gate v2.41.0 PENDING (EP-060 Fleet Health, già in main dal 2026-09-04) e aggiunge due nuove capability sviluppate 2026-09-08 dopo Tavola Rotonda TR-c4e8f1b2. Origine deliberazione: `wiki/decisions/tavola-rotonda-c4e8f1b2-7a3d-4c96-b0e5-2d9f83a1c647-2026-09-08.md` (forced-synthesis Round 3, 4/5 partecipanti convergenti).

### Nuova capability #1 — EP-062 Fleet Telemetry Hardening (bugfix critico, always-on)

Riparazione del walker `tools/analytics/harvest-session-tokens.py` scoperto silenziosamente rotto su Claude Code 2.1.258+: il ramo `isSidechain` per attribuzione main/subagent non scattava mai perché i sub-agenti vivono in directory separata `<session-uuid>/subagents/agent-<hash>.jsonl`, non nel JSONL principale. Il token ledger EP-022 omettendo il 60%+ dell'attività di flotta (fino a 134 sub-agenti su sessione reale).

- **Walker fan-in** (TSK-545, `tools/analytics/harvest-session-tokens.py:collect_jsonl_files`): glob `subagents/agent-*.jsonl` + attribuzione per file-location (non più via `isSidechain`); backward compat totale se `subagents/` non esiste.
- **Schema-version guard** (TSK-546): `SUPPORTED_CC_VERSIONS = {"2.1.256", "2.1.257", "2.1.258", "2.1.263"}` + WARNING fail-loud su versioni ignote (mai parsing "best effort" silenzioso, condizione Critico #2 TR).
- **Fixture reale versionata** (TSK-547): `tests/fixtures/transcripts/cc-2.1.258-with-subagents/` (main 80 righe + 3 sub-agent × 25 righe, redazione PII 0 match verificata).
- **Contract-test regressione** (TSK-548): `tests/test_harvest_contract.py` con 7 test PASS (stdlib `unittest`, zero dipendenze). Rompe se lo schema JSONL drifta.
- **Aggiornamento `analytics/ANALYTICS-DIAGNOSIS.md`** (TSK-549) con sezione EP-062 + riferimento regression test.

### Nuova capability #2 — EP-061 Session Agentic Analyser (opt-in, R-SAA-5)

Analisi critica **post-hoc** dell'attività agentica di sessioni Claude Code chiuse. Determinism-first (rilevazione via regole, no LLM), LLM advisory. Solo **out-of-band** (mai in-sessione — R-SAA-8, race condition su `subagents/*.jsonl` open+append). Zero dipendenze esterne (stdlib Python).

- **Skill `session-analysis-protocol`** (`.claude/skills/session-analysis-protocol.md`, 422 righe): protocollo 5 fasi (Bootstrap → Collect Sources → Parse & Normalize → Detect Anomalies → Report Generation), 10 invarianti R-SAA-1..10 referenziate per fase.
- **Comando `/session-analysis`** (`.claude/commands/session-analysis.md`): `[--current | --last N | <session-id>] [--depth=quick|full] [--json] [--save]`; gate `session_analysis.enabled: true`; gate R-SAA-8 anti in-sessione.
- **Tool chain deterministica** in `tools/session-analysis/` (~3000 LOC, stdlib-only):
  - `parse-transcript.py` (467 LOC): fan-in main+subagents, normalizzazione JSON, redazione R-SAA-3, gate R-SAA-8 (mtime <60s).
  - `fleet-metrics.py` (690 LOC): rollup per-agente/modello/wave, pricing da `analytics/pricing.yaml` + fallback hardcoded, `dispatch_efficiency` heuristica.
  - `detect-anomalies.py` (935 LOC): 3 categorie deterministiche core enabled (ERROR/BUDGET/DISPATCH) + 2 opt-in roadmap (LATENCY/FLEET); risoluzione empirica PA-R3-4 (3 vs 6 categorie).
  - `generate-report.py` (981 LOC): dual md+JSON in `raw/`, 7 sezioni obbligatorie incluso `## Provenienza & limiti` (anti-compiacenza), frontmatter canonico R-SAA-5, redazione R-SAA-3, provenance R-SAA-7, `fleet_recommendations` per fleet-doctor.
- **Schema JSON** `tools/session-analysis/schema-anomaly.json` (388 righe, Draft 2020-12): `Anomaly`, `Provenance`, `FleetRecommendation`, `AnomaliesEnvelope`, `SessionAnalysisReport`.
- **Config** `session_analysis:` in `factory.config.yaml` (default `enabled: false`, R-SAA-5): `depth_default`, `auto_on_session_end`, `read_transcript`, `schema_version_guard`, `anonymize_rules`, `max_token_budget`, `kill_criterion_ref → EP-061.md#sunset_condition` (NON duplicato).
- **Test end-to-end** `tests/test_session_analysis_e2e.py`: 10/10 test PASS. Verifica pipeline completa, schema conformance con `$defs` wrapping, R-SAA-3/5/7/8, kill_criterion regression, `fleet_recommendations` presenza, anomalia BUDGET_OVERFLOW realmente rilevata su fixture (validazione empirica del detector R-SAA-7).
- **Integrazione fleet-doctor** advisory (TSK-558): `fleet_doctor_command` popolato per subtype `SKILL_NOT_FOUND` / `DISPATCH_REDUNDANT` / `TIER_MISMATCH`; flusso unidirezionale, mai auto-invoke (R-SAA-6).
- **Runbook** `wiki/runbooks/session-analysis-fleet-doctor-handoff.md` (48 righe): documenta flusso advisory + anti-patterns.
- **PATTERN §37** «Session Observability» (nuovo): pattern agent-agnostic per osservazione post-hoc dell'attività agentica; principi determinism-first, out-of-band, no auto-fix, kill criterion pre-codice.
- **Wiki concept** `wiki/concepts/session-agentic-analyser.md` (200 righe, `status: stable`, `ingest_eligible: true`): overview, architettura, fonti dati, tassonomia v1, invarianti, kill criterion (link non-duplicato), integrazione fleet-doctor, perimetro (cosa NON è in scope), provenienza TR.

### Kill criterion §23.8 (attivo, hard)

`sunset_condition:` nel frontmatter `management/kanban/EP-061-session-agentic-analyser/EP-061.md` (fonte unica di verità):

- Anomalie rilevate <3% su 20 sessioni consecutive / 30 giorni → sunset
- False positive rate >35% su 3 sprint → sunset
- >1 TSK di fix per sprint per 2 sprint consecutivi → sunset
- **Hard sunset v2.44**: se ≥5 anomalie azionabili con TSK reale non emergono → sunset automatico senza bypass

### Documentazione + governance

- **`CLAUDE.md`** aggiornato: sezione `## §session_analysis` (EP-061 opt-in), sezione `## Meta-prompt versioning (v2.42 — corrente)` aggiornata.
- **`meta-prompts/v2-42/factory-bootstrap.md`** creato (delta rispetto a v2.41): abilita capability EP-062 (bugfix always-on) + EP-061 (opt-in `session_analysis.enabled: false` default).
- **Blackboard TR-c4e8f1b2** (`wiki/decisions/tavola-rotonda-c4e8f1b2-...-2026-09-08.md`): registro decisioni Round 3 + posizioni verbatim + accordi congelati + PA-R3-4 residuo.

### Battle-test / dogfood

- Sessione di sviluppo v2.42 stessa: dopo TSK-545 (walker riparato), `harvest-session-tokens.py` conta correttamente 12+ file sub-agent live (vs 0 prima). Validazione empirica end-to-end del bug fix descritto in EP-062.
- Su fixture reale `cc-2.1.258-with-subagents/`: pipeline EP-061 rileva 1 anomalia BUDGET_OVERFLOW (cost 9.96 USD > soglia 5.00) con provenance completa R-SAA-7. Validazione end-to-end del detector.

### Gate v2.42.0

**BYPASS** documentato (SLA: 3 RUN-REPORT entro v2.43). Rationale: la capability è validata da 10/10 test e2e + 7/7 contract test EP-062 su fixture reali. Il bypass è motivato dalla natura del bugfix EP-062 (silent bug in production tool ledger da >8 versioni, cf. `analytics/ANALYTICS-DIAGNOSIS.md`) e dalla governance opt-in totale di EP-061 (default `enabled: false`, R-SAA-5). Precedente identico: v2.38.0 BYPASS 2026-08-24 (SLA rispettata in v2.39).

### Assorbe (gate PENDING chiuso)

- **v2.41.0** — EP-060 Fleet Health (Refactor Skill Layer, in main dal 2026-09-04). Il gate PENDING è chiuso e assorbito in questo release; le entry v2.41.0 sotto rimangono per continuità cronologica ma non hanno tag separato.

### Migration guide (v2.41 → v2.42)

- **Nessuna azione richiesta** per l'utente esistente: EP-062 è bugfix trasparente (backward compat totale), EP-061 è opt-in totale (`session_analysis.enabled: false` default = factory identica a v2.41).
- Per attivare EP-061:
  1. Bumpa `factory.config.yaml#pattern_version` a `"2.42"` (o esegui `/factory-upgrade --to=v2-42 --apply`)
  2. Imposta `session_analysis.enabled: true`
  3. Verifica precondizione: `python3 -m unittest tests/test_harvest_contract.py` PASS (EP-062)
  4. Prima invocazione: `/session-analysis --last 1 --save --json` (sessione chiusa)

### Backward compat

- **Totale** rispetto a v2.41: nessuna breaking change, tutte le API/config/skill esistenti invariate.
- EP-062 modifica `harvest-session-tokens.py` ma aggiunge solo un ramo condizionale (fan-in `subagents/` se esiste). Se la directory non esiste → comportamento identico a pre-fix (backward compat pre-2.1.258).

---

## [v2.41.0] — EP-060 Fleet Health: Refactor Skill Layer (2026-09-04)

### Nuova capability (opt-in totale, R.FH1)

- **Skill `refactor-agent-skills`** (`.claude/skills/refactor-agent-skills.md`):
  spina dorsale del refactor di unità di contesto agentiche (skill/agenti/flotte)
  via divulgazione progressiva. 5 foglie in `.claude/skills/references/refactor/`:
  criteri-di-taglio, topologia-e-dispatch, integrita-riferimenti, igiene-flotta,
  protocollo-test-equivalenza.
- **Agente `fleet-doctor`** (`.claude/agents/fleet-doctor.md`, ~365 righe): owner
  canonico della governance G1-G11. Orchestra le 5 fasi (Ricognizione→Piano→
  Esecuzione→Verifica→Consegna), custodisce V-9, gestisce snapshot R.21, supporta
  Mode external per factory esterne (ADR-EP060-003).
- **Comando `/refactor <target> [--external <path>] [--adapter=<name>] [--dry-run]`**
  (`.claude/commands/refactor.md`): thin dispatcher verso fleet-doctor.
- **Tools stdlib-only** in `tools/refactor/`:
  - `analizza_target.py` (inventario + outline + verdetto soglia)
  - `mappa_riferimenti.py` (grafo riferimenti + G9/G10/G11 gate)
  - `verifica_flotta.py` (gate strutturali G1-G8)
- **Config** `refactor_agent_skills:` (`enabled: false` default; thresholds; sampling
  fan_in_floor=5; snapshot_dir/reports_dir gitignored).
- **Lint check** Check 4ap WARNING-only (`lint-checks-agent-fleet.md`): unità agentiche
  sopra soglia (opt-in via `refactor_agent_skills.enabled: true`).
- **PATTERN §36** «Refactor Skill Layer / Fleet Health»: 9 vincoli V-1..V-9,
  11 gate G1..G11, boundary con Ponytail/CQRL/complexity-budget, R.FH1..R.FH3.
- **3 ADR EP-060**:
  - ADR-EP060-001 boundary + Pattern A + PA-5 + owner G1-G11
  - ADR-EP060-002 pattern emergenti (trilogia directory + drift reconciliation +
    fix inline 2 famiglie + Class A anchor + T3 soft-fail)
  - ADR-EP060-003 external_target foundation (5 decisioni sblocco Decisione 5)

### Battle-test evidence (11 pilot Wave D sulla factory master stessa)

Applicati con successo su target reali (10 ACCEPT + 1 NO-REFACTOR motivato):

| Pilot | Target | Baseline → Refactored | Δ | Foglie | Criterio |
|---|---|---|---|---|---|
| #1 | `tavola-rotonda-protocol.md` | 790 → 211 | -73% | 7 | per fase |
| #2 | `factory-bootstrap.md` | 579 → 169 | -71% | 4 | per variante |
| #3 | `tavola-rotonda-moderatore.md` | 450 → 371 | -17.6% | 2 | per frequenza |
| #4 | `fe-dev.md` | 400 → 84 | -79% | 5 | per opt-in |
| #5 | `prototype-generation-protocol.md` | 638 → 245 | -61.6% | 4 | per fase pesante |
| #6 | `commands/prototype.md` | 325 → 210 | -35% | 2 | per destinazione |
| #7 | `prototype-generator.md` | invariato | 0 | 0 | NO-REFACTOR motivato |
| #8 | `lint-checks.md` | 2196 → 119 | **-94.6% record** | 0 (dedup) | per famiglia |
| #9 | `functional-oracle-protocol.md` | 963 → 342 | -64.5% | 7 | per fase |
| #10 | `parallel-scheduling.md` | 625 → 371 | -40% conservative | 4 | per frequenza |
| #11 | `dev-protocol.md` | 516 → 288 | -44% | 3 | per frequenza |

**Totali**: ~6300 righe corpo eliminate, 27 foglie create in 3 convenzioni directory
(agents/references/, skills/references/, commands/references/), 7 test empirici
TSK-546 AC2 consecutivi ACCEPT.

### Tools

- Fix parser YAML block scalars (`>-`, `|-`) in `mappa_riferimenti.py` e `verifica_flotta.py`
- Fix `MEMBER_RE` context-aware (bullet vocabolario chiuso non triggera più falsi positivi)
- Fix `commands/*.md` riconosciuti come index node (43 nuovi entry point BFS)
- Fix code fence guard nel body scan
- `tools/refactor/*.py` chmod +x, stdlib-only

### Governance

- Cleanup 9 anomalie descriptions frontmatter (skills senza description + skills con
  `<>` placeholder). Baseline pre-fix: 20 → post-fix: 0.
- Fix G10 fleet-level (`tutor` + `voice-channel-installer` registrati in
  `dispatch-policy.md §8 Capability Advertisement`)
- Fix G9 `commands/refactor.md` placeholder `foo.md` → `<agent-slug>.md`
- Fix G11 `qa-dev.md` path relativi → `.claude/`-ancorati + root-relative

**Gate grafo PASS pulito** post-cleanup: G9/G10/G11 tutti `(nessuno)`.

### Documentazione

- `wiki/runbooks/skill-hygiene.md` (276 righe): runbook narrativo con 11 pilot come
  esempi canonici + boundary + guardrail V-9
- 3 wiki concept pages: `unita-di-contesto-agentica.md`, `specie-skill-agente-flotta.md`,
  `pattern-dispatch-a-b-c.md`
- Tavola Rotonda blackboard: `wiki/decisions/tavola-rotonda-4a7f1e3c-...-2026-09-04.md`
  (5 decisioni chiave consenso Round 2)
- `meta-prompts/v2-41/factory-bootstrap.md` seed delta per factory derivate

### Backward compatibility

Totale con v2.40. A flag `refactor_agent_skills.enabled: false` (default): factory
identica a v2.40. Nessuna nuova invariante §7. `pattern_version: "2.41"`.

### Sprint

63 (sprint corrente EP-060). Kanban: `management/kanban/EP-060-fleet-health/`
con 11 US e 31 TSK done.

### Commit

- 13 commit atomici su main: 781ea01 + 6857314 + 3dcadaa + 294c5fd + ba90e31 +
  08fad8f + af6ba6c + c0cb7d4 + 09143be + 94c1e95 + 2fc5b4b + aa0cf94 + eea5c5e

### Gate release

**PENDING** — richiede 3 RUN-REPORT + sblocco debiti storici v2.39/v2.40 (TSK-480 +
US-228). Il pattern_version è dichiarato pre-tag come EP-059 v2.40.

---

## [v2.40.0] — EP-059 Backport delta v2.40 da portale-servizi-factory (2026-09-02)

### Nuovi artefatti (backport generalizzato)

- **Agente `release-manager`** (`.claude/agents/release-manager.md`): orchestrazione release
  4 fasi (preparazione → validazione → tag → post-release). R.21 cooperative locking
  `domain: release`. Gate umano pre-tag invariante. Skill primaria: `release-protocol`.
- **Skill `tpm-reconcile`** (`.claude/skills/tpm-reconcile.md`): riconciliazione periodica
  kanban — 5 passi, filtro epica opzionale, sola lettura, report anomalie.
- **Skill `deep-functional-probe`** (`.claude/skills/deep-functional-probe.md`): probe
  funzionale avanzato FE — complemento EP-018 oracle, PASS/FAIL deterministico,
  tecnologia-agnostico. Richiede `fe_correctness.functional_oracle.enabled: true`.
- **Skill `release-protocol`** (`.claude/skills/release-protocol.md`): orchestrazione
  processo release — 4 fasi, idempotente, gate umano pre-tag non bypassabile,
  delega validazione a `release-validation-gate`.
- **Tool `statusline-ledger.py`** (`tools/analytics/statusline-ledger.py`): statusline
  compatta token ledger per VS Code — stdin-based, stdlib only, `--json`, graceful
  degradation. Complementare a `show-session-tokens.py`.

### Integrazioni documentali

- `dispatch-policy.md` §9: Release Domain Dispatch Policy (`layer: release` → `release-manager`)
- `tpm.md`: §Riconciliazione kanban con `tpm-reconcile`
- `functional-oracle-protocol.md`: §`deep-functional-probe` come estensione avanzata
- `release.md` command: §Skill invocate
- `token-ledger.md`: §Alternativa compatta `statusline-ledger.py`
- `CLAUDE.md`: mapping agenti, §Skills v2.40, §Token Ledger

### Analisi inter-factory (EP-059 origine)

Diff `soli-multi-agents-factory` (v2.39) vs `portale-servizi-factory` (v2.40):
- portale aveva 4 agenti extra, 9 skill extra, 7 comandi extra rispetto a soli
- backportati 5 artefatti generalizzabili; esclusi portale-specific (Unleash, upgrade tooling, component-cartographer)

### Backward compat

Totale verso v2.39. Nessuna nuova invariante §7. Nessuna modifica breaking.

---

## [v2.39.0] — Ponytail Decision Ladder EP-057 + A/B Study EP-057.1 + Factory-as-MCP EP-058 (gate accettato — tag pending)

> Gate v2.39.0 = **CONDITIONAL → accettato dal maintainer** (2026-08-28). 3 RUN-REPORT prodotti
> (Run1 meta-reflexive pass-with-warning su `duration_min`, WARN accettato; Run2 soli-boy + Run3
> wise-planeswalker backward-compat pass) → SLA bypass v2.38 **saldata**. `pattern_version` bumpato
> a `2.39`. Restano azioni **outward** del maintainer: `git tag -a v2.39.0` (R.P1: mai auto-tag) +
> deploy sito guida (Vercel). Vedi `validation/release-gates/v2.39.0/{GATE-REPORT,RELEASE-CHECKLIST}.md`.

### Summary (in costruzione)

- **EP-057 Ponytail Decision Ladder** (opt-in, DONE 8/8 US) — YAGNI gate a 7 livelli (pattern-stealing
  concettuale da `github.com/DietrichGebert/ponytail`, §23.10). Lint Check 4ao (WARNING-only
  post-develop, INFO su meta) + Pass 4 advisory in `code-review-protocol` (mai determinante per il
  verdict) + skill/comando `/ponytail-review` (diff) + `/ponytail-audit` (repo) + riga `/ponytail-gain`
  nel token-ledger. Invariante locale R.PY1 (mai sopprime security/a11y/trust-boundary, non
  bypassabile). Config `ponytail:` default off → a flag spento factory identica a v2.38. Concetti
  `wiki/concepts/decision-ladder.md` + `ponytail.md`. Da Tavola Rotonda TR-b3c7e2f1 (2026-08-28).
- **EP-057.1 Ponytail A/B Study** (DONE 2/2 US) — runbook `wiki/runbooks/ponytail-ab-study.md` +
  RUN-REPORT-empirical-002 (A/B generation-time). Validazione: **righe −50% CONFERMATO** (vs 54%
  dichiarato, consistente 3/3 task); token/tempo NON confermati (metrica grezza, N=3). Complementare
  a RUN-REPORT-empirical-001 (audit: 23% code_path morto su soli-boy).
- **EP-058 Factory-as-MCP-Server** (opt-in, DONE 19/19 TSK) — espone la factory come server MCP
  (Model Context Protocol) **read-only** seguendo il pattern multi-adapter (§12.2). Adapter
  `adapters/mcp/` (server.py stdio) + config `mcp_server:` default off (resources `wiki`/`kanban`/`config`,
  tools `query_wiki`/`get_task`/`lint_status`, `mcp_spec_version: 2025-03-26`, pin `mcp==1.3.0`).
  Invariante **R.MCP1** (ADR-MCP-002, non-bypassabile): nessuna scrittura via MCP. Lint Check 4am.mcp.
  ADR-MCP-001..004 GO. Test: pytest 116/116 + e2e MCP stdio 9/9 (TSK-499). Da Tavola Rotonda
  TR-f2c9e4d7 (2026-08-28). A flag spento factory identica a v2.38.

### Validation evidence

- **3 RUN-REPORT di release** (schema ADR-032): `validation/runs/RUN-REPORT-v2.39.0-{1,2,3}.md`
  (Run1 meta-reflexive capability exercise pass-with-warning; Run2 soli-boy + Run3 wise-planeswalker
  backward-compat pass). GATE-REPORT: `validation/release-gates/v2.39.0/GATE-REPORT.md`.
- Feature-validation a supporto: EP-057 `RUN-REPORT-empirical-001.md` (audit −23% dead code) +
  EP-057.1 `RUN-REPORT-empirical-002.md` (A/B righe −50%) + EP-058 pytest 116/116 + e2e 9/9.

### Installer

- Backfill seed `meta-prompts/v2-37/` (EP-054) + `v2-38/` (EP-055/056) + **`v2-39/`** (EP-057/057.1/058);
  dispatcher `.claude/commands/factory-bootstrap.md` default → **v2.39** + README righe v2.37/38/39.
- ⚠️ Copia user-level `~/.claude/commands/factory-bootstrap.md` stale → re-installare:
  `cp .claude/commands/factory-bootstrap.md ~/.claude/commands/`.

---

## [v2.38.0] — Integrazione llm_wiki: Semantic Purpose Layer EP-055 + Wiki Keeper 2.0 EP-056 (2026-08-24)

EP-055 + EP-056 opt-in. Backward compat totale v2.37. Gate v2.38.0 **BYPASS** 2026-08-24 (SLA: ≥3 RUN-REPORT entro v2.39).

### Summary

Integrazione selettiva pattern-stealing concettuale da `llm_wiki` (github.com/nashsu/llm_wiki, GPL v3) decisa dalla Tavola Rotonda `TR-llmwiki-20260824` (5 round, consenso, 13 accordi). Zero riuso di codice sorgente (PATTERN §23.10). Pattern_version bump: "2.37" → "2.38". Sprint 56 (EP-055, 3 TSK) + Sprint 57 (EP-056, 5 TSK). Battle-test reali su 3 factory derivate (soli-projects/soli-boy/wise-planeswalker) che hanno hardened la detection sweep-reviews (3 rotture reali fixate).

- **Semantic Purpose Layer** (EP-055, sprint 56): `wiki/purpose.md` per-factory (frontmatter YAML `domain`/`priority_entity_types`/`tone`/`exclusions` + corpo markdown); wiki-keeper Step 0 read-only; lint Check 4an (WARNING); opt-in, no config flag; PATTERN §34
- **Wiki Keeper 2.0** (EP-056, sprint 57): CoT handoff esplicito (ingest-protocol Fase 1.ter + `plan_reasoning` nel worker) + sweep-reviews semantico (`wiki_sweep:` opt-in, skill `sweep-reviews-protocol`, comando `/sweep-reviews`, resolution loop bounded gated, distinto da heal meccanico e CQRL codice) + log format alignment; PATTERN §35
- **Third-Party License & Pattern-Stealing Policy** (PATTERN §23.10): pattern concettuale vs riuso codice; copyleft = zero code-sharing; submodule `repo_codes/` read-only

### Added

- **PATTERN.md §34 — Semantic Purpose Layer** (EP-055, US-199/200/201, TSK-465/466/467)
- **PATTERN.md §35 — Wiki Keeper 2.0** (EP-056, US-202/203/204, TSK-468..472)
- **PATTERN.md §23.10 — Third-Party License & Pattern-Stealing Policy** (TR-llmwiki-20260824)
- **Skill scrivi-purpose** (`.claude/skills/scrivi-purpose.md`) + **wiki/purpose.md** reference (EP-055)
- **Skill sweep-reviews-protocol** (`.claude/skills/sweep-reviews-protocol.md`) + **command /sweep-reviews** (EP-056)
- **Config wiki_sweep:** in factory.config.yaml (opt-in, default off nelle derivate; enabled nel meta-repo)
- **Lint Check 4an** (purpose.md presenza + frontmatter + enum tone) in lint-checks.md
- **repo_codes/llm_wiki** submodule (read-only, analisi) + registro decisioni `wiki/decisions/tavola-rotonda-TR-llmwiki-20260824-2026-08-24.md`

### Changed

- `.claude/skills/ingest-protocol.md`: Fase 1.ter "Piano di pagine (CoT esplicito)" (EP-056 US-202)
- `.claude/skills/wiki-keeper-worker-protocol.md`: schema `proposed_pages` esteso con `plan_reasoning`
- `.claude/agents/wiki-keeper.md`: Step 0 read purpose.md + capability sweep-reviews
- `.claude/skills/wiki-log-entry.md`: formato parseable canonico + regex + template sweep/tavola-rotonda
- `.claude/skills/sweep-reviews-protocol.md`: 3 fix di detection dai battle-test (normalizzazione naive, escaped-pipe `\|` in tabelle, risoluzione side-channel)

## Validation evidence (v2.38.0)

`[gate-bypassed]`

### Run consumati

Nessun RUN-REPORT gate-valido (schema ADR-032 completo). Evidenza di battle-test **parziale ma genuina** disponibile:

- [validation/runs/v2.38.0-sweep-detection-battletest-2026-08-24/FINDINGS.md](validation/runs/v2.38.0-sweep-detection-battletest-2026-08-24/FINDINGS.md) — esercizio capability EP-055/056 su 4 factory (meta riflessivo + soli-projects `8a28fde` + soli-boy `8b5d25b` + wise-planeswalker `042caf9`): 3 `purpose.md` reali + 2 fix wikilink + 35 gap onesti (0 fabbricazioni). Detection-only, non sprint multi-giorno → **non** RUN-REPORT valido.

### Findings consolidati

3 rotture reali del detector sweep-reviews trovate e fixate (una per factory): normalizzazione naive (meta 34→16), escaped-pipe `\|` in tabelle markdown (wise-planeswalker 25→5), esclusione side-channel dal set di risoluzione (soli-projects 10→3). Finding sistematico di flotta: `content-share-setup.md` (EP-048) referenzia pagine non-portabili → dangling in tutte le derivate.

### Capability non esercitate

Resolution loop path "fix" su soli-boy (0 typo, tutti gap); CoT handoff (US-202) su ingest live; `terminology-drift` e `unsupported-claim` (solo `dangling-concept` esercitata); instrumentation analytics (`analytics_events_count: 0`).

### Riferimenti

Bypass: [validation/release-gates/v2.38.0/BYPASS.md](validation/release-gates/v2.38.0/BYPASS.md) — deferred_validation: true, sla_releases: 1.
Gate: [validation/release-gates/v2.38.0/GATE-REPORT.md](validation/release-gates/v2.38.0/GATE-REPORT.md) — verdict: bypass.
**SLA**: ≥3 RUN-REPORT gate-validi + `validation/release-gates/v2.39.0/GATE-REPORT.md` con `verdict: pass` + `## §5 SLA bypass v2.38.0 colmata` entro la release v2.39.

---

## [v2.37.0] — Code Intelligence Stack EP-054 (2026-08-04)

EP-054 opt-in completo. Backward compat totale v2.36. Gate v2.37.0 PASS 2026-08-04.

### Summary

Stack a tre layer local-first per navigazione codice da parte degli agenti (L1 ctags + L2 tree-sitter/nomic-embed/LanceDB + L3 graphify Fase 0.bis). Zero dipendenze cloud. Tutti i layer opt-in con master switch `code_intelligence.enabled: false`. Pattern_version bump: "2.36" → "2.37". Sprint 54 (13 TSK, 3 US, 1 epica).

- **Code Intelligence Stack** (EP-054, sprint 54): L1 Symbol Resolver (ctags, O(1), ms-latency) + L2 Semantic Code Search (tree-sitter + nomic-embed-code 137M + LanceDB, NL query → chunk ranked) + L3 Impact Graph (graphify affected in dev-protocol Fase 0.bis, analysis-only R.CI4); 2 fix commit post-sprint (FixedSizeList schema PyArrow + worktrees exclusion + pandas dep); backward compat totale v2.36; gate v2.37.0 PASS 2026-08-04

### Added

- **PATTERN.md §33 — Code Intelligence Layer** (EP-054, US-196/197/198, TSK-452): §33.1 Architettura a tre layer ortogonali + §33.2 L1 ctags + §33.3 L2 semantic + §33.4 L3 impact + §33.5 invarianti locali R.CI1..R.CI5 + §33.6 configurazione + §33.7 comandi + §33.8 integrazione EP-042/052/053
- **Skill ctags-index-protocol** (EP-054, US-196, TSK-455): `.claude/skills/ctags-index-protocol.md` — skill L1 Symbol Resolver; pipeline: discover → index → query; side-channel `.ctags-state/<slug>/`
- **Skill code-chunk-protocol** (EP-054, US-197, TSK-456): `.claude/skills/code-chunk-protocol.md` — skill L2; chunking symbol-level via tree-sitter; 6 linguaggi (Python/TS/JS/Java/Go/Rust); split overlap 10 righe; stato incrementale SHA256
- **tools/code-intelligence/ctags-index.sh** (EP-054, US-196, TSK-458): script bash L1 indexer; `universal-ctags` wrapper; flag `--update` incremental; exclude `.claude/worktrees/**` + common side-channels
- **tools/code-intelligence/chunk-code.py** (EP-054, US-197, TSK-459): L2 chunker tree-sitter; output JSONL `{id, file, symbol, type, language, start_line, end_line, code, docstring}`; stato incrementale `--incremental`
- **tools/code-intelligence/index-code.py** (EP-054, US-197, TSK-460): L2 embedder; `nomic-embed-code` (Apache 2.0, 137M params, HF cache locale); upsert LanceDB tabella `code_chunks` (distinta da `wiki_chunks`); `np.float32` per FixedSizeList schema
- **tools/code-intelligence/query-code.py** (EP-054, US-197, TSK-461): L2 query; top-K ranked per similarity; filtri `--lang` + `--type`
- **Command /code-search** (EP-054, US-197, TSK-461): `.claude/commands/code-search.md`; `reindex [--full] [--slug]` + `status`
- **wiki/runbooks/code-intelligence.md** (EP-054, US-198, TSK-463): installazione (universal-ctags + pip deps) + uso L1/L2/L3 + troubleshooting + gotcha FixedSizeList + gotcha exclusions

### Changed

- `.claude/skills/dev-protocol.md`: Fase 0.bis impact graph L3 (EP-054, US-198, TSK-462) — `graphify affected "<symbol>"` per ogni simbolo principale del TSK; `[L3-WARN]` se blast_radius > 10 file; analysis-only (R.CI4)
- `.claude/skills/wiki-search-protocol.md`: §5 source:code cross-search (EP-054, US-197, TSK-457) — estensione `/code-search --all` per merge RRF con wiki_chunks
- `factory.config.yaml`: blocco `code_intelligence:` additive-only, tutti flag `false` default (EP-054, US-196, TSK-453); `pattern_version` aggiornata a "2.37" (SSOT)
- `CLAUDE.md`: §code_intelligence aggiunto; quick start aggiornato con L1/L2/L3 comandi; meta-prompt versioning aggiornato a v2.37 (nota: bootstrap usa ancora meta-prompt v2.36 — EP-054 è tooling puro, nessun nuovo meta-prompt richiesto)
- `management/kanban/sprint.md`: sprint 54 EP-054 TSK-452..464 tutti done; sprint_current→56, sprint_lookahead→57

## Validation evidence (v2.37.0)

Gate formale v2.37.0 — 3 RUN-REPORT prodotti dedicati a EP-054 Code Intelligence Stack, bypass_used: false.

### GATE-REPORT

- [`validation/release-gates/v2.37.0/GATE-REPORT.md`](validation/release-gates/v2.37.0/GATE-REPORT.md) — verdict: **pass** (2026-08-04)

### Run reports

- [`validation/runs/RUN-REPORT-v2.37.0-1.md`](validation/runs/RUN-REPORT-v2.37.0-1.md) — Run 1: EP-054 artefatti meta (PATTERN §33, 3 skill, 4 tool, command /code-search, dev-protocol Fase 0.bis); analytics_events_count: 18 (stazionario — EP-054 tooling puro, 0 eventi nuovi); 3 breakpoint: FixedSizeList + worktrees + pandas; pre_check: pass; factory: soli-multi-agents-factory (reflexive, 2026-08-04)
- [`validation/runs/RUN-REPORT-v2.37.0-2.md`](validation/runs/RUN-REPORT-v2.37.0-2.md) — Run 2: wise-planeswalker backward compat v2.33 — factory GBA game dev (sprint-14 done, E2E gate PASS, 254 TSK); analytics_events_count: 0 (WARNING soft); 2 breakpoint: IWRAM overflow + /onboarding v.min mancante; pre_check: pass; factory: wise-planeswalker (same_factory_as_previous_runs: **false** — prima volta in qualsiasi gate, 2026-08-04)
- [`validation/runs/RUN-REPORT-v2.37.0-3.md`](validation/runs/RUN-REPORT-v2.37.0-3.md) — Run 3: soli-boy coverage full-stack TypeScript v2.33 — backward compat EP-054 verificata (181 TSK done); analytics_events_count: 0 (WARNING soft); 2 breakpoint: sunset annotations scadute + /onboarding pattern sistematico; pre_check: pass; factory: soli-boy (same_factory_as_previous_runs: true, independence_justification: topologia+runtime+versione diversi, 2026-08-04)

### Analytics totali (fine run 3)

- `analytics_events_count` cumulativo: **19** (+1 rispetto a v2.36 — gate session v2.37.0 ha prodotto 1 evento token-ledger in `analytics/events/2026-08.jsonl`)
- Run 2 con `same_factory_as_previous_runs: false` (wise-planeswalker) — campione esterno indipendente (prima volta in qualsiasi gate)

---

## [v2.36.0] — Backport portale-servizi-factory EP-053 (2026-07-30)

EP-053 opt-in completo. Backward compat totale v2.35. Gate v2.36.0 PASS 2026-07-30.

### Summary

5 pattern validati in produzione su portale-servizi-factory backportati nel meta-framework.
Pattern_version bump: "2.35" → "2.36". Sprint 53 (8 TSK, 5 US, 4 wave).

- **Backport portale-servizi-factory** (EP-053, sprint 53): analisi comparativa 20+ delta locali → 5 candidati generalizzabili identificati dall'Explore agent; 8 TSK implementati in 4 wave atomiche; backward compat totale v2.35; gate v2.36.0 PASS 2026-07-30

### Added

- **Skill /onboarding** (EP-053, US-191, TSK-444): report contestuale in-chat per nuovi contributor (4 sezioni: factory version+capabilities, sprint onboarding-friendly, invarianti §7 live, next-steps); pattern "skill read-only in-chat" senza scrittura file; `.claude/skills/onboarding.md` + `.claude/commands/onboarding.md`
- **PATTERN.md §23.9 — ai_attribution_policy** (EP-053, US-192, TSK-445): pattern opt-in per factory clienti con requisito no-AI-traces sui commit; componenti: `tools/vcs/sm-commit.sh` (nuovo), campo `ai_attribution_policy.suppress_ai_traces` in `factory.config.yaml`, nota §ai_policy in `CLAUDE.md`
- **tools/vcs/sm-commit.sh** (EP-053, US-192, TSK-445): script bash `git -C "$REPO_PATH" commit -m "$MSG"` senza AI footer; usage: `./tools/vcs/sm-commit.sh "messaggio" [path]`
- **memory/active-sessions.yaml** (EP-053, US-193, TSK-447): template cooperative locking R.21; schema `sessions: []` con entry `{uuid, agent, domain, started_at, ttl_min: 30}`
- **R.21 cooperative locking in 7 agenti** (EP-053, US-193, TSK-448+449): sezioni R.21 preflight aggiunte in orchestrator, wiki-keeper, wiki-keeper-worker, tpm, product-manager, docs-dev, wiki-lint; pattern additive-only (mai sostituisce sezioni esistenti)

### Changed

- `.claude/skills/vcs-preflight-protocol.md`: step 2-bis remote staleness (EP-053, US-194, TSK-450) — `git fetch --quiet origin` + `git diff --name-only HEAD...origin/<base_branch>`; WARN se intersezione con TSK code_path non vuota; mai auto-pull; fallback silenzioso se fetch fallisce
- `.claude/skills/dev-protocol.md`: checkpoint analysis-only (EP-053, US-195, TSK-451) — gate pre-Fase 1 contro estensione tacita di scope su TSK con AC "nessuna modifica al codice"/"solo censimento"/"solo documentazione"; + sezione R.21 Preflight (US-193, TSK-447)
- `CLAUDE.md`: Quick start aggiornato con `/onboarding`; §ai_policy aggiunto; meta-prompt versioning aggiornato a v2.36
- `factory.config.yaml`: `pattern_version` aggiornata a "2.36" (SSOT versioning EP-052); commento `ai_attribution_policy:` aggiunto (opt-in doc)
- `management/kanban/sprint.md`: sprint 53 EP-053 TSK-444..451 tutti done; sprint_current→54, sprint_lookahead→55

## Validation evidence (v2.36.0)

Gate formale v2.36.0 — 3 RUN-REPORT prodotti dedicati a EP-053 Backport portale-servizi-factory, bypass_used: false.

### GATE-REPORT

- [`validation/release-gates/v2.36.0/GATE-REPORT.md`](validation/release-gates/v2.36.0/GATE-REPORT.md) — verdict: **pass** (2026-07-30)

### Run reports

- [`validation/runs/RUN-REPORT-v2.36.0-1.md`](validation/runs/RUN-REPORT-v2.36.0-1.md) — Run 1: EP-053 artefatti meta (skill /onboarding, vcs-preflight step 2-bis, dev-protocol checkpoint, PATTERN §23.9, R.21 embedding 7 agenti); analytics_events_count: 18; pre_check: pass; factory: soli-multi-agents-factory (reflexive, 2026-07-30)
- [`validation/runs/RUN-REPORT-v2.36.0-2.md`](validation/runs/RUN-REPORT-v2.36.0-2.md) — Run 2: portale-servizi-factory source validation — 103 DS-TSK done, ai_attribution_policy operativa produzione, R.21+vcs-preflight+onboarding operativi come delta locale; analytics_events_count: 0 (factory cliente — WARNING soft); pre_check: pass; factory: portale-servizi-factory (same_factory_as_previous_runs: **false**, 2026-07-30)
- [`validation/runs/RUN-REPORT-v2.36.0-3.md`](validation/runs/RUN-REPORT-v2.36.0-3.md) — Run 3: soli-boy coverage topologia full-stack (176 TSK done, pattern_version 2.33) — backward compat EP-053 verificata; analytics_events_count: 0 (factory applicativa); pre_check: pass; factory: soli-boy (same_factory_as_previous_runs: true, independence_justification: topologia+versione diversa, 2026-07-30)

### Analytics totali (fine run 3)

- `analytics_events_count` cumulativo: **18** (+1 rispetto a v2.35 — EP-053 ha prodotto 1 evento token-ledger nella sessione gate)
- Run 2 con `same_factory_as_previous_runs: false` (portale-servizi-factory) — campione esterno indipendente (prima volta nel gate v2.36)
- Conforme a EP-013 soglia (>0): nessun fail cross-EP-013 (WARNING soft su Run 2 e Run 3 per analytics_events_count: 0 — atteso per factory clienti/applicative, non blocca)

---

## [v2.35.0] — Bus Factor Mitigation EP-051 formal gate (2026-07-21)

EP-051 opt-in confermato. Backward compat totale v2.34. Gate v2.35.0 PASS 2026-07-21.

### Summary

Gate formale di EP-051 Bus Factor Mitigation (sprint 52). Nessun file nuovo rispetto a v2.34.
Pattern_version bump: "2.34" → "2.35".

- **Bus Factor Mitigation — gate formale** (EP-051, sprint 52): soli-boy confermata come factory derivata pubblica operativa (176 TSK done, 56 wiki pages, 4+ epiche, github.com/soli92/soli-boy); LAYERS-NOT-USED.md — 12/20 layer attivi (60% utilizzo), 6 SUNSET v2.37, 2 SUNSET-EXEMPT (tavola_rotonda + voice_channel); guida onboarding per il secondo maintainer in 3 sezioni (prerequisiti → prima sessione guidata → autonomia); bus factor abbassato da 1 a ≥2

### Changed

- `factory.config.yaml`: `pattern_version` aggiornata a "2.35" (SSOT versioning EP-052 US-187)
- `CLAUDE.md`: v2.35 corrente; meta-prompt versioning aggiornato
- `management/kanban/sprint.md`: sprint 52 EP-051 TSK-425..430 tutti done; sprint 52 in archive; lookahead sprint 53-54
- `.claude/commands/factory-bootstrap.md`: default v2-35
- `apps/factory-guide/package.json`: version "2.35.0" (sync-version)

## Validation evidence (v2.35.0)

Gate formale v2.35.0 — 3 RUN-REPORT prodotti dedicati a EP-051 Bus Factor Mitigation, bypass_used: false.

### GATE-REPORT

- [`validation/release-gates/v2.35.0/GATE-REPORT.md`](validation/release-gates/v2.35.0/GATE-REPORT.md) — verdict: **pass** (2026-07-21)

### Run reports

- [`validation/runs/RUN-REPORT-v2.35.0-1.md`](validation/runs/RUN-REPORT-v2.35.0-1.md) — Run 1: EP-051 meta artifacts — sunset policy PATTERN §23.8 (TSK-428) + sunset_date annotations 6 SUNSET + 2 EXEMPT (TSK-429) + onboarding secondo maintainer (TSK-430); analytics_events_count: 17; pre_check: pass; factory: meta-framework (2026-07-21)
- [`validation/runs/RUN-REPORT-v2.35.0-2.md`](validation/runs/RUN-REPORT-v2.35.0-2.md) — Run 2: EP-051 soli-boy — pipeline L1→L5 (176 TSK done, 56 wiki pages) + LAYERS-NOT-USED.md (60% utilizzo layer) + sunset_date annotations; analytics_events_count: 17; pre_check: pass; factory: soli-boy (same_factory_as_previous_runs: false) (2026-07-21)
- [`validation/runs/RUN-REPORT-v2.35.0-3.md`](validation/runs/RUN-REPORT-v2.35.0-3.md) — Run 3: gate closure — pattern_version bump "2.34"→"2.35" + meta-prompt v2-35 + CHANGELOG + sprint archive 52 + npm sync; analytics_events_count: 17; pre_check: pass; factory: meta-framework (2026-07-21)

### Analytics totali (fine run 3)

- `analytics_events_count` cumulativo: **17** (stazionario — EP-051 docs-layer; debito strutturale hook automatico post-TSK-completion)
- Run 2 con `same_factory_as_previous_runs: false` (soli-boy) — campione esterno indipendente
- Conforme a EP-013 soglia (>0): nessun fail cross-EP-013

---

## [v2.34.0] — Governance Enforcement + Adoption Onboarding + Bus Factor + Tech Debt (2026-07-21)

EP-049 + EP-050 + EP-051 + EP-052 opt-in completi. Backward compat totale v2.33. Gate v2.34.0 PASS 2026-07-21.

### Added

- **Governance Enforcement** (EP-049): analytics events operativi post-fix sistemico (TSK-407/408/409 — Causa A dev-protocol Bash block obbligatori + Causa B record-event.sh worktree-aware); Check 4al CHANGELOG↔GATE-REPORT in `lint-checks-governance.md`; 3 RUN-REPORT + GATE-REPORT per v2.33.0 prodotti
- **Adoption Onboarding** (EP-050, PATTERN aggiornato): QUICKSTART.md ≤120 righe (percorso zero→primo TSK done in ≤30 min senza leggere PATTERN.md); `wiki/concepts/factory-config-dag.md` YAML DAG 45 flag + 30 archi hard/soft; `schemas/factory.config.schema.json` con 16 regole cross-flag if/then; `factory.starter.config.yaml` 5 capability core; `wiki/runbooks/config-validation.md`
- **Bus Factor Mitigation** (EP-051): soli-boy confermata come factory derivata pubblica (176 TSK done, 56 wiki pages, github.com/soli92/soli-boy); `PATTERN.md §23.8` sunset policy (N=3 release, sunset_date formato YAML, grace period → experimental/ → rimozione); annotazioni `sunset_date` su 6 layer non esercitati in soli-boy; guida onboarding per il secondo maintainer
- **Tech Debt Cleanup** (EP-052): lint-checks.md modularizzato in 9 famiglie (`lint-checks-{index,wiki-structure,kanban,citation,governance,config,fe-quality,oracle-analytics,compression,agent-qa}.md`) — backward compat totale; `pattern_version` in `factory.config.yaml` come unica fonte autoritativa (SSOT) + Check 4am versioni divergenti; sprint archive (`management/kanban/archive/` 43 file sprint-006..049, sprint.md ridotto da 3584→243 righe); `code_quality.router.layer_filter: [be, fe, db, qa]` in `factory.config.yaml` + Step 0.0 in `code-review-protocol.md` (obiettivo costo CQRL $540→<$200)

### Changed

- `factory.config.yaml`: `pattern_version` aggiornata a "2.34" (SSOT versioning); `code_quality.router.layer_filter: [be, fe, db, qa]` aggiunto; `content_share.enabled` invariato
- `PATTERN.md`: §23.8 sunset policy aggiunta; heading versione rimosso (fonte autoritativa: factory.config.yaml#pattern_version)
- `CLAUDE.md`: Quick start — prima voce aggiornata con link a QUICKSTART.md
- `.claude/skills/dev-protocol.md`: Bash block analytics obbligatori in Fase 2 + Fase 5 (fix Causa A EP-049)
- `.claude/skills/code-review-protocol.md`: Step 0.0 layer_filter gate aggiunto
- `.claude/skills/lint-checks.md`: nota struttura modulare + 9 famiglie referenziate
- `tools/analytics/record-event.sh`: REPO_ROOT worktree-aware via `--git-common-dir` (fix Causa B EP-049)
- `CONTRIBUTING.md`: sezione bump-version (6 passi + factory.config.yaml SSOT); sezione archiviazione periodica sprint

## Validation evidence (v2.34.0)

Gate formale v2.34.0 — 3 RUN-REPORT prodotti in sprint 50-52 (EP-049..EP-052), bypass_used: false.

### GATE-REPORT

- [`validation/release-gates/v2.34.0/GATE-REPORT.md`](validation/release-gates/v2.34.0/GATE-REPORT.md) — verdict: **pass** (2026-07-21)

### Run reports

- [`validation/runs/RUN-REPORT-v2.34.0-1.md`](validation/runs/RUN-REPORT-v2.34.0-1.md) — Run 1: EP-050 adoption onboarding (QUICKSTART.md, JSON schema, starter config) + EP-052 US-188 split; analytics_events_count: 17; pre_check: pass; factory: meta-framework (2026-07-21)
- [`validation/runs/RUN-REPORT-v2.34.0-2.md`](validation/runs/RUN-REPORT-v2.34.0-2.md) — Run 2: EP-051 bus factor — soli-boy factory derivata pubblica (176 TSK done, 56 wiki pages) + sunset policy; analytics_events_count: 17; pre_check: pass; factory: soli-boy (same_factory_as_previous_runs: false) (2026-07-21)
- [`validation/runs/RUN-REPORT-v2.34.0-3.md`](validation/runs/RUN-REPORT-v2.34.0-3.md) — Run 3: EP-052 tech debt (lint modulare 9 famiglie, versioning SSOT, sprint archive, CQRL router) + governance pre-gate; analytics_events_count: 17; pre_check: pass; factory: meta-framework (2026-07-21)

### Analytics totali (fine run 3)

- `analytics_events_count` cumulativo: **17** (stazionario — EP-050..052 TSK docs-layer non hanno emesso nuovi eventi; gli stessi 4 TSK-level dell'EP-049 gate v2.33.0 restano gli eventi di riferimento)
- Run 2 con `same_factory_as_previous_runs: false` (soli-boy) — campione esterno indipendente
- Conforme a EP-013 soglia (>0): nessun fail cross-EP-013

---

## [v2.33.0] — Content Share Consumer Layer EP-048 (2026-07-17)

EP-048 opt-in completo. Backward compat totale v2.32. Gate v2.33.0 PASS 2026-07-17.

### Added

- **Content Share Consumer Layer** (EP-048, PATTERN §32, opt-in):
  - Skill `content-share-protocol` — 5 fasi: Pre-flight+EgressCheck → Build Payload → Validate → Gate Umano → Dispatch+Log
  - Comando `/share <html-path> [--slug] [--title] [--dry-run]` — pubblica artefatti HTML su soli-frames via `repository_dispatch`
  - Invarianti R.CS1 (slug convention) + R.CS2 (default off) + R.CS3 (gate umano obbligatorio) + R.CS4 (egress classification)
  - Config `content_share:` in `factory.config.yaml` (enabled: false default)
  - Check 4ak in `lint-checks.md` — integrity config content_share
  - Runbook `wiki/runbooks/content-share-setup.md` — PAT fine-grained, secret setup, verifica dry-run
  - 9 test in `tests/content-share/`: smoke (3) + size boundary (3) + slug convention (3)
  - Fix soli-frames `write-fragments.js`: `<a href>` navigazionali non bloccati; solo `src/poster/action` e `<link href>` assoluti
  - Primo dispatch reale verificato 2026-07-17: PR #10 + #11 su soli-frames mergiate

### Changed

- `factory.config.yaml`: blocco `content_share:` aggiunto (enabled: false default, R.CS2)
- `PATTERN.md`: §32 Content Share Consumer Layer aggiunto

### Validation evidence

- 9 test `tests/content-share/` documentati (smoke + size + slug)
- Dispatch reale: PR #10 (analisi-critica-premortem-v218) + PR #11 (presentazione-factory-collega) su soli92/soli-frames — MERGED 2026-07-17
- `/share --dry-run` verificato in sessione 2026-07-17
- Lint check 4ak aggiunto a `wiki-lint`

## Validation evidence (v2.33.0)

Gate formale v2.33.0 — 3 RUN-REPORT prodotti in sprint 50 (EP-049..EP-052), bypass_used: false.

### GATE-REPORT

- [`validation/release-gates/v2.33.0/GATE-REPORT.md`](validation/release-gates/v2.33.0/GATE-REPORT.md) — verdict: **pass** (TSK-413, 2026-07-20)

### Run reports

- [`validation/runs/RUN-REPORT-v2.33.0-1.md`](validation/runs/RUN-REPORT-v2.33.0-1.md) — Run 1: EP-049..052 sprint 50, flusso raw→wiki; analytics_events_count: 15; pre_check: pass (TSK-410, 2026-07-20)
- [`validation/runs/RUN-REPORT-v2.33.0-2.md`](validation/runs/RUN-REPORT-v2.33.0-2.md) — Run 2: flusso kanban→dev-protocol→analytics→CQRL layer_filter; analytics_events_count: 16; pre_check: pass (TSK-411, 2026-07-20)
- [`validation/runs/RUN-REPORT-v2.33.0-3.md`](validation/runs/RUN-REPORT-v2.33.0-3.md) — Run 3: flusso lint modulare (9 check-family) + wiki-query + governance check; analytics_events_count: 17; pre_check: pass (TSK-412, 2026-07-20)

### Analytics totali (fine run 3)

- `analytics_events_count` cumulativo: **17** (4 TSK-level: TSK-408, TSK-409, TSK-411, TSK-412 + 13 session-aggregate Token Ledger)
- Prima sessione con `analytics_events_count > 0` dopo fix sistemico TSK-407/408/409 (EP-049 FM-3)
- Conforme a EP-013 soglia (>0): nessun WARNING cross-EP-013 in tutti e 3 i run

---

## v2.32.1 — Patch: voice bugfix + governance factory-guide (2026-07-14)

Patch release bugfix-only. Nessuna nuova capability. Backward compat totale v2.32.

### Bugfix

- **TSK-395** — VAD `debounce_ms` 500→700ms (`voice/config.py` + `voice/app.py` + `factory.config.yaml`): eliminata troncatura su utterance pedagogiche lente con pause intra-frase >2s.
- **TSK-396** — FSM pickup post-shutdown (`voice/core/state_machine.py`): 3 failure mode documentati e corretti — (A) liveness check periodico in CATTURA ogni 5s, (B) reset `_continuous_mode` nel pre-ELABORAZIONE check (C3), (C) `try/except` in `run_loop()` con reset IDLE. +3 test regressione (28 pass, 4 fail pre-esistenti asyncio Python 3.9).
- **TSK-397** — `voice/voice_consumer.py` nuovo: bridge STT→tutor→TTS non supervisionato. Loop asyncio event-driven (watchdog FSEvents/inotify + fallback polling 100ms). Invarianti: `data.get("response","")`, guard stringa vuota, lazy import PiperTTS, filtro duplicati `turn_id`, C7 session-owner stub.

### Governance e architettura

- **ADR-EP047-001** — Contratto formale reflexive-mode: 5 invarianti INV-RM-1..5 (sentinel code_path, dev-agent template-only, no-write-to-root, flag coerenti con L5, governance factory-guide).
- **ADR-EP047-002** — Opzione A governance `apps/factory-guide/`: aggiunta a `code_paths` con `layers: [fe]`, `stack.frontend: react-ts-vite-tailwind`, CQRL riattivato.
- **EP-047 backlog**: US-172 done (ADR), US-173/174/175 aperte (test suite, lint check, wiki-search integration).
- **ingest-protocol** Fase 6 VCS handoff: ogni ingest termina con proposta di commit wiki/+raw/.
- **wiki/concepts/reflexive-mode-constraints.md**: pagina canonica dei vincoli reflexive-mode.
- `tools/tests/test_meta_framework.py` — 15 test pytest sulle invarianti del meta-framework (14 pass, 1 skip).
- `tools/lint/check_notes_config.py` — lint check coerenza notes/config (0 warning).

### Config

- `factory.config.yaml`: `code_quality.enabled` ripristinato a `true` (L5 reale presente), `stack.frontend` valorizzato, `code_paths` aggiornato, `debounce_ms: 700`.

## Validation evidence (v2.32.1)

[gate-bypassed] — Bypass tracciato (ADR-033 §E). Vedi `validation/release-gates/v2.32.1/BYPASS.md`.

### Run consumati

N/A (bypassed). 0/3 RUN-REPORT formali prodotti.

Nota: il gap RUN-REPORT riguarda anche il parent v2.32.0. Il sistema di release-validation
si è fermato a v2.27.0; le versioni v2.28–v2.32.0 sono state validate con acceptance test
EP (35+9 test manuali). Debito da colmare entro v2.33.

### Findings consolidati

Da sessione voice-tutor 2026-07-14 (informale): P1 VAD troncatura, P2 FSM busy-loop, P3 consumer bridge mancante. Tutti e tre risolti in questa patch.

### Capability non esercitate

Voice Channel (EP-041), Hybrid Wiki Search (EP-042), Temporal Estimate (EP-043), Voice Handsfree (EP-044), Capability Formativa (EP-045), Voice Hardening (EP-046).

### Riferimenti

- `validation/release-gates/v2.32.1/BYPASS.md`
- `validation/release-gates/v2.32.1/GATE-REPORT.md` (verdict: bypass)

---

## v2.32 — Capability Formativa + Voice Hardening (EP-045 + EP-046, 2026-07-10)

**Due nuove capability (backward compat totale v2.31)**:

### EP-046 — Voice Hardening (contratti architetturali FSM)

Porta il modulo `voice/` da "funziona in condizioni controllate" a "robusto per uso non
supervisionato". Implementa 7 accordi architetturali dalla Tavola Rotonda 3f8a1c2d (consenso
unanime Round 2, 2026-07-10).

- **US-165 — Lifecycle owner side-channel**: `voice/core/lifecycle.py` diventa unico writer di `voice-state.json`; FSM valida `voice.pid` prima di ogni transizione critica (C1, P0).
- **US-166 — Invariante FSM no-cattura-durante-parlato**: flag `_tts_playing` + watchdog timeout configurabile (default 10s) in `state_machine.py`; rimozione cooldown device-name (C2, P0).
- **US-167 — Liveness check file-pipe**: pre-flight check heartbeat con TTL + `schema_version` payload in `FilePipeAdapter`; failsafe automatico su timeout (C3, P0).
- **US-168 — Timer cattura config-driven**: `speech_onset_deadline_s` + `max_capture_duration_s` in `state_machine.py` + `voice/config.py`; no hard-coding (C4, P0).
- **US-169 — Gate STT strutturale su metadati nativi**: gate per-segmento `no_speech_prob` + `compression_ratio` in `faster_whisper_stt.py`; calibrazione 2026-07-10 (cr reale=0.50–0.53, margine 4.5x vs soglia 2.4) (C5+C6, P1).
- **US-170 — Seam session-owner**: `VoiceSessionManager` stub + gap-document in `wiki/concepts/`; nessuna logica sessione (C7, tech-debt).

Artefatti: `voice/core/lifecycle.py`, `voice/core/state_machine.py` (refactor), `voice/adapters/file_pipe_adapter.py`, `voice/stt/faster_whisper_stt.py`, `voice/config.py`, `wiki/concepts/voice-session-owner-gap.md`. 24 TSK, 9 test nuovi. ADR-EP046-001 GO.

### EP-045 — Capability Formativa (sistema tutoring LLM-integrato, MVP)

Sistema di tutoring adattivo con Student Model persistente, loop di retrieval practice e
curriculum curato a mano (Opzione B MVP). Agente `tutor` abilitabile su factory.

- **US-160 — Retrieval vivo e citato**: `tools/tutor/retrieval_tool.py` — `search_wiki()` + `search_codebase()` (rg/grep fallback) + gap record; integrazione EP-042 opzionale. Skill `retrieval-protocol` 4 fasi con marker `RETRIEVAL_FOUND_WIKI/CODE/NOT_FOUND/GAP`.
- **US-161 — Tutor modello epistemico**: agente `tutor.md` (enabled:false, capability_formativa) + skill `epistemic-tag-protocol` (L1/L2/L3, INV-T1..T3) + `scaffolding-protocol` (3 livelli mastery) + `session-mode-protocol` (Sblocco/Apprendimento, 7-step loop) + `sandbox_exec_tool.py` (subprocess isolated, timeout 10s) + `epistemic_validator.py`.
- **US-162 — Student Model persistente**: `tools/tutor/student_model.py` — upsert/mastery/prerequisites/topological_order + SM-2 spaced repetition (max 30 giorni) + provenance/staleness (hash MD5). Schema wiki in `wiki/concepts/student-model-schema.md`.
- **US-163 — Loop retrieval practice**: `question_generator.py` (3 template scaffold, INV-G1/G2) + `answer_evaluator.py` (L1 code_exec / L2 citation_check / L3 manual, INV-V1..V3) + `retrieval_loop.py` (sequenza 5-step invariante INV-L1..L3).
- **US-164 — Curriculum curato a mano**: schema YAML v1.0 (`wiki/concepts/curriculum-schema.md`) + `CurriculumLoader` (load/reload/validate_refs, AC4 rilettura a ogni load) + `tools/tutor/curriculum/factory-onboarding.yaml` (6 nodi DAG pilota).

Artefatti: `tools/tutor/` (11 moduli Python + test suite 35 test), `.claude/agents/tutor.md`, 4 skill, `wiki/concepts/student-model-schema.md` + `curriculum-schema.md`. 25 TSK, 35 test (tutti pass).

**Nessuna nuova invariante §7. Backward compat totale v2.31.**

---

## v2.30 — Temporal Generative Time Model (EP-043, 2026-07-09)

**Nuove capability opt-in (backward compat totale v2.29)**:

- **`temporal-estimate-protocol`** (EP-043 US-152) — skill Layer 3 Generative Time Model semplificato. Stima adattiva `estimated_remaining_ms` + `confidence` + `recommendation` (continue|warn|escalate) da progresso osservato (completed_steps/total_steps, elapsed_ms). Config: `temporal.estimate_protocol.enabled: false` (default off, R.P3). Chiude gap `temporal-generative-time-model-missing` (wiki/gaps.md, 2026-06-04).

- **`/sprint-progress`** (EP-043 US-153) — segnale burndown sprint. TSK done/in-progress/todo, velocità TSK/giorno (rolling 7gg), proiezione completamento. Fallback a conteggio kanban se event store non disponibile. Config: `analytics.sprint_progress.enabled: false` (default off, R.P3).

**Artefatti**:
- `.claude/skills/temporal-estimate-protocol.md` (US-152)
- `.claude/agents/orchestrator.md` — sezione pre-retry hook (US-152)
- `tools/analytics/sprint-progress.py` (US-153)
- `.claude/commands/sprint-progress.md` (US-153)
- `factory.config.yaml` — blocchi `temporal.estimate_protocol:` + `analytics.sprint_progress:` (US-154)
- `PATTERN.md §3` + `§18` aggiornati (US-154)
- `meta-prompts/v2-30/factory-bootstrap.md` seed delta (US-154)

**Nessuna nuova invariante §7. Nessuna nuova sezione top-level PATTERN.**

---

## [v2.27.0] — 2026-07-06

**EP-039 Tavola Rotonda — modalità multi-agente collaborativa opt-in per decisioni architetturali.**

Abilita sessioni strutturate di deliberazione multi-agente su decisioni tecniche complesse
(trade-off cross-dominio, architetture ambigue, priorità in conflitto). Il protocollo a
5 fasi (Setup → Posizioni isolate → Confronto → Convergenza → Sintesi) garantisce
l'isolamento delle posizioni in Fase 1 (R.TR1 anti-groupthink), la presenza di un ruolo
Critico con mandato anti-compiacenza (R.TR4), un budget obbligatorio (R.TR3 guardrail
economico), e un registro decisioni tracciabile in `wiki/decisions/`. Tutto opt-in
(default off, R.P3).

### Added

- **EP-039 — Tavola Rotonda (v2.27).** Capability multi-agente collaborativa a 5 fasi:
  - **ADR-EP039-001** — formato normativo del blackboard: schema canonico del file
    `wiki/decisions/tavola-rotonda-<session-id>-<YYYY-MM-DD>.md` (9 campi frontmatter
    obbligatori, 3 sezioni fisse, regola single-writer R.S1).
  - **Agente `tavola-rotonda-moderatore`** — macchina a stati 5 fasi con 5 invarianti
    R.TR1..R.TR5 non overridabili; prompt Critico anti-compiacenza con mandato verbatim
    e behavioral test; behavioral test e metrica tasso di intervento Critico.
  - **Skill `tavola-rotonda-protocol`** — procedura completa Fase 0-4 (R.TR1..R.TR8):
    Fase 0 Setup (7 passi incl. verifica budget + blackboard), Fase 1 Posizioni isolate
    (3 passi, fail-on-violation R.TR1), Fase 2 Confronto, Fase 3 Convergenza (4 condizioni
    di stop incl. stall detection circuit-breaker), Fase 4 Sintesi (5 sezioni fisse +
    `### Criteri di successo verificati`); meccanismi di sicurezza: budget guardrail doppia
    fonte (CLI + config), stall detection.
  - **Comando `/tavola-rotonda`** — 5 step con gate `enabled`, override one-shot
    `--budget=<N>`, gate R.TR3 esplicito, output sessione in `wiki/decisions/`.
  - **PATTERN.md §28** — «Tavola Rotonda»: §28.1 scopo e quando usarla, §28.2 componenti
    (Moderatore/Partecipanti/Critico/Blackboard/Registro), §28.3 protocollo normativo,
    §28.4 invarianti R.TR1-R.TR4 non overridabili, §28.5 configurazione YAML completa,
    §28.6 file chiave, §28.7 integrazione capability esistenti, §28.8 ADR-EP039-001 GO.
  - **Config** — blocco `tavola_rotonda:` in `factory.config.yaml` (9 parametri: partecipanti,
    critico, max_round, stop_su_consenso, definizione_consenso, meccanismo_decisione,
    budget.max_cost_usd, topologia, sintesi_progressiva; default `enabled: false`, R.P3).
  - **Runbook** — `wiki/runbooks/tavola-rotonda.md`: decision tree 4+4 criteri (SI/NO),
    4 scenari (SI/NO/DIPENDE), segnali di allarme, setup in 3 step, baseline confronto.
  - **Benchmark self-consistency** (TSK-294) — 3 sessioni deduttive A/B/C su problemi
    multi-dominio vs mono-dominio; finding: valore della Tavola Rotonda proporzionale
    alla multi-dominalità del problema (HA deployment=sì; UUID vs ULID=no); risultato
    tracciato in `wiki/decisions/`.

### Changed

- **PATTERN.md** — bump v2.26 → v2.27; §28 Tavola Rotonda aggiunto; §0 description
  aggiornato con delta v2.27 EP-039.
- **`factory.config.yaml`** — blocco `tavola_rotonda:` aggiunto (9 parametri, enabled: false).
- **CLAUDE.md** — header aggiornato con v2.27 Tavola Rotonda; meta-prompt versioning
  bumped a v2.27 corrente; quick-start `/tavola-rotonda` aggiunto.
- **Version bump** — PATTERN 2.26 → 2.27; invarianti locali R.TR1..R.TR8 (non §7);
  ADR-EP039-001 (GO).

### Backward compatibility

Totale verso v2.26 (R.P3): a `tavola_rotonda.enabled: false` (default), il comando
`/tavola-rotonda` emette errore esplicito con istruzioni attivazione. Nessun agente,
skill o comando esistente alterato. I file nuovi `.claude/agents/tavola-rotonda-moderatore.md`,
`.claude/skills/tavola-rotonda-protocol.md`, `.claude/commands/tavola-rotonda.md` e
`wiki/decisions/` sono no-op a flag spento. Propagabile via `/factory-upgrade --to=v2-27`.

**Nota per factory upgradate**: dopo `/factory-upgrade --to=v2-27`, creare manualmente
`wiki/decisions/` (`mkdir -p wiki/decisions/`) e valorizzare `tavola_rotonda.budget.max_cost_usd`
in `factory.config.yaml` prima del primo uso (finding #5 e #6 del gate v2.27.0).

## Validation evidence (v2.27.0) [gate-pass]

Gate battle-test EP-012 **PASS** (3/3 RUN-REPORT validi, ADR-033 §D).
**WARNING cross-EP-013** (SOFT, CRITERIA.md §5): tutti e 3 i run hanno `analytics_events_count: 0`
con `dogfooding.enabled: true` — criterio non ancora promosso a hard (skill nota "Da rivalutare
verso hard via ADR"). Azione richiesta prima di v2.28.0.

### Run consumati

- **Run A** — `validation/runs/v2.27.0-reflexive-ep039-tavola-rotonda-2026-07-06/RUN-REPORT.md`
  Meta-framework self-dev: EP-039 Tavola Rotonda (13 TSK docs, Sprint SP39-SP42).
  `pre_check_status: pass` | `review_status: pass`
  Breakpoint chiave: budget guardrail duplicato TSK-285/TSK-291 (integrazione in-place); sprint numbering corretto in sessione.

- **Run B** — `validation/runs/v2.27.0-soli-boy-tavola-rotonda-2026-07-06/RUN-REPORT.md`
  Factory soli-boy (v2.27, 10 cap opt-in, pipeline multi-agente completa EP-036..EP-038 + test light Tavola Rotonda).
  `pre_check_status: pass` | `review_status: pass`
  Breakpoint chiave: messaggio R.TR3 senza sintassi recovery `--budget=<N>`; criterio successo 4 non session-scoped.

- **Run C** — `validation/runs/v2.27.0-wise-planeswalker-tavola-rotonda-2026-07-06/RUN-REPORT.md`
  Factory wise-planeswalker (v2.27, GBA ROM hack, 7 cap opt-in incl. EP-034+EP-031, test light Tavola Rotonda).
  `pre_check_status: pass` | `review_status: pass`
  Breakpoint chiave: `wiki/decisions/` assente post-upgrade (ENOENT bloccante Fase 0); budget null → R.TR3 trigger → recovery via `--budget=1.50`.

### Findings consolidati

6 finding cross-run (nessuno ripetuto identico): (1) skill split overlap Fase 0/guardrail [medium];
(2) sprint numbering misalignment [low]; (3) R.TR3 STOP senza recovery CLI [medium];
(4) criterio successo non session-scoped [medium]; (5) factory-upgrade senza onboarding budget TR
[medium]; (6) `wiki/decisions/` assente in factory upgradate [medium/bloccante].
Finding 5 e 6 entrambi in factory-upgrade-protocol: candidati a un unico TSK di correzione.

### Capability non esercitate

Non esercitate in nessuno dei 3 run: `visual-oracle`, `a11y`, `functional-oracle`, backend
figma/penpot (MCP non disponibile — US-126/127 blocked), `ux_ui`. `Tavola Rotonda` in sessione
live end-to-end (con Task sub-agent reali) non testata: solo benchmark/simulazione light in tutti
e 3 i run — raccomandate per gate v2.27.1+.

### Riferimenti

- GATE-REPORT: `validation/release-gates/v2.27.0/GATE-REPORT.md`
- Log audit: `validation/release-gates/v2.27.0/2026-07-06T220000Z-pass.log`

---

## [v2.26.0] — 2026-07-02

**EP-035 Prototype Generation Layer — generazione adattiva di prototipi HTML/React/Figma/Penpot a cascata.**

Abilita la generazione di prototipi interattivi direttamente dal kanban (US-id, TSK-id o intent
libero) con selezione automatica del backend più ricco disponibile nell'ambiente. La cascata
adattiva (figma→penpot→react→html) garantisce sempre un output funzionale via html fallback
(INV-1), anche in ambienti senza MCP esterni. Tutto opt-in (default off, R.P3).

### Added

- **EP-035 — Prototype Generation Layer (v2.26).** Cascata adattiva a 4 backend:
  - **ASSE 1** — preferenza backend (config `prototyping.preferred_backend` o flag `--backend`).
  - **ASSE 2** — probe disponibilità (stack-detector per react; MCP check per figma/penpot;
    html sempre true — INV-1).
  - **Skill `backend-resolver`** — algoritmo ASSE 1+2, produce `BACKEND_RESOLVED` o
    `BACKEND_DEGRADED` con motivazione esplicita.
  - **Skill `prototype-generation-protocol`** — 5 fasi (Bootstrap → Intent Parse → Backend
    Resolve → Generation → Handoff Oracle).
  - **Skill `html-prototype-mapping`** — template HTML semantico (Tailwind CDN, single-file
    INV-6, responsive, accessibile).
  - **Skill `react-mapping`** — componente React + Storybook, shadcn/ui peer deps, probe ASSE 2
    via stack-detector.
  - **Agente `prototype-generator`** — esegue la pipeline da input (US/TSK/intent) a artefatto
    in `prototyping.output_path`.
  - **Comando `/prototype`** — 6 step con gate `prototyping.enabled`, `--dry-run`, override
    `--backend`/`--fidelity`, suggerimenti handoff per backend.
  - **Comando `/prototype-status`** — stato attuale dei backend (probe live) e artefatti generati.
- **PATTERN.md §27** — «Prototype Generation Layer»: architettura cascata, invarianti INV-1..INV-6,
  ADR-EP035-001..006 (tutti GO).
- **Config** — blocco `prototyping:` in `factory.config.yaml` con `enabled: false` (R.P3) +
  4 backend (`html`, `react`, `figma`, `penpot`) + `output_path` + `preferred_backend`.
- **Meta-prompt** — `meta-prompts/v2-26/factory-bootstrap.md` (delta seed su v2-25).
- **ADR-EP035-001..006** — tutti GO: cascata adattiva, html-terminal INV-1, single-file INV-6,
  no auto-eval INV-4, gate enabled R.P3, acceptance-spec immutabile INV-3.

### Added (EP-036 + EP-037 + EP-038 — factory-guide app)

- **EP-036 — Factory Interactive Guide App** (`apps/factory-guide/`) — React 18 + Vite 5 +
  TypeScript 5 + Tailwind 3. 4 pagine (Capabilities Explorer, Prototype Demo, Sprint Board,
  Glossary). 29 TSK FE completati. Source: kanban live-sync via EP-038.
- **EP-037 — Vercel Deploy automatico** (`apps/factory-guide/` → Vercel Hobby, free tier).
  Pivot da GitHub Pages (richiede Pro per repo privati) a Vercel GitHub Integration.
- **EP-038 — Live Data Sync** (`apps/factory-guide/scripts/`) — 3 script build-time TypeScript:
  `sync-capabilities.ts` (65 capability da CLAUDE.md), `sync-sprint.ts` (282 TSK da kanban),
  `sync-data.ts` (orchestratore); prebuild hook `npm run sync-data` prima di ogni build Vite.

### Changed

- **`factory.config.yaml`** — blocco `prototyping:` aggiunto (4 backend template, enabled: false).
- **PATTERN.md** — bump v2.25 → v2.26; §27 aggiunto; §0 esteso con EP-035.
- **CLAUDE.md** — Quick start esteso con `/prototype` e `/prototype-status`; nota EP-035 in
  meta-prompt versioning (v2.26 corrente).
- **Version bump** — PATTERN 2.25 → 2.26; invarianti locali EP-035 INV-1..INV-6; ADR-EP035-001..006.

### Backward compatibility

Totale verso v2.25 (R.P3): a `prototyping.enabled: false` (default), `/prototype` emette errore
esplicito con istruzioni attivazione (mai STOP silenzioso — INV-5). Nessun agente, skill o
comando esistente alterato. Propagabile alle factory esistenti via `/factory-upgrade --to=v2-26`.

## Validation evidence (v2.26.0) [gate-pass]

Gate battle-test EP-012 **PASS** (3/3 RUN-REPORT validi, ADR-033 §D).

- **Run A** — `validation/runs/v2.26.0-reflexive-ep035-2026-07-02/RUN-REPORT.md`
  Meta-framework self-dev: EP-035 Prototype Generation Layer (15 TSK docs, Sprint 35-36).
  pre_check_status: pass | review_status: pass
  Breakpoint chiave: US-126/127 bloccate su MCP esterni (INV-1 html fallback verificata empiricamente).

- **Run B** — `validation/runs/v2.26.0-factory-guide-ep036-2026-07-02/RUN-REPORT.md`
  EP-036 Factory Interactive Guide App (29 TSK FE, Sprint 37-39, apps/factory-guide/).
  pre_check_status: pass | review_status: pass
  Breakpoint chiave: dati capability hardcoded vs generati → EP-038 emerso come necessità reale.

- **Run C** — `validation/runs/v2.26.0-factory-guide-ep037-ep038-cqrl-2026-07-02/RUN-REPORT.md`
  EP-037 Vercel Deploy + EP-038 Live Data Sync (8 TSK done, CQRL su TSK-277/282 iter-2 pass).
  pre_check_status: pass | review_status: pass
  Breakpoint chiave: pivot GitHub Pages → Vercel (repo privato richiede GitHub Pro);
  CQRL TSK-277 ciclomatica ~30 → refactor lookup-table iter-2 pass.

---

## [v2.25.0] — 2026-07-01

**EP-034 VCS Branch Awareness Layer — precisione e visibilità su quale branch nei progetti multi-repo/submodule.**

Risolve il disorientamento sistematico nell'uso della factory su progetti con repository sotto
git submodule («poco chiaro su quale branch si sta lavorando o su quale bisogna lavorare»). Radice:
i submodule hanno due (o N) HEAD indipendenti (parent gitlink → detached HEAD + branch submodule
indipendente + drift silenzioso). Estende la gestione VCS (§15) dal solo commit-time a un ciclo
completo **declare → inspect → align**, tutto opt-in (default off, R.B10).

### Added

- **EP-034 — VCS Branch Awareness Layer (v2.25).** Layer opt-in a tre momenti:
  - **Declare** — skill `branch-resolver` (single source of truth dell'expected branch, R.B9),
    campo `vcs.base_branch`, manifest per-sprint `.factory-branches.yaml` (+ template `.example`).
  - **Inspect** — skill `vcs-preflight-protocol` (snapshot read-only R.B7: branch corrente vs
    atteso, detached HEAD, submodule non inizializzato, drift parent-ref vs submodule-HEAD +
    comandi di remediation) + comando `/vcs-status` + tabella nel dashboard `/run`.
  - **Align** — gate pre-dispatch `dev-protocol` Fase 0 Step 2-ter (`dispatch_gate: off|warn|block`,
    `auto_align: propose`, mai checkout silente R.B8) + `vcs-handoff` Fase 1 che usa `branch-resolver`
    + `drift_check` opt-in prima del bump del ref.
- **PATTERN.md §15** — sottosezione «Branch Awareness Layer (v2.25, EP-034, opt-in)»: diagnosi
  two-HEAD, regola di risoluzione, schema config, invarianti locali R.B7-R.B10.
- **ADR-EP034-001** — VCS Branch Awareness Layer (decisione GO; alternative valutate: solo inspect
  vs auto-checkout scartato vs layer completo).
- **Config** — `vcs.base_branch` + `vcs.branch_awareness.{enabled,preflight,dispatch_gate,auto_align,drift_check}`, default off.
- **Meta-prompt** — `meta-prompts/v2-25/factory-bootstrap.md` (delta seed su v2-24).
- **Lint** — Check 4ah: coerenza schema `branch_awareness` (WARNING, opt-in).

### Changed

- **`orchestrator.md`** — sezione «VCS Branch Preflight» (no-op se `preflight: false`, R.B10).
- **`dev-protocol.md`** — Fase 0 Step 2-ter (no-op se `dispatch_gate: off`, R.B10).
- **`vcs-handoff.md`** — Fase 1 delega il naming a `branch-resolver` + drift check opt-in.
- **Version bump** — PATTERN 2.24 → 2.25; nessuna nuova invariante §7 (resta 18); R.B7-R.B10 locali §15.

### Backward compatibility

Totale verso v2.24 (R.P3): a `branch_awareness.enabled: false` (default) `/run`, `dev-protocol` e
`vcs-handoff` si comportano come v2.24. `/vcs-status` è additivo (esecuzione esplicita). Propagabile
alle factory esistenti via `/factory-upgrade --to=v2-25`.

---

## [v2.24.0] — 2026-06-26

**EP-033 Runtime Contextual Suggestions — suggerimenti push-based contestuali nel momento giusto.**

### Added

- **EP-033 — Runtime Contextual Suggestions (v2.24).** Capability push-based che inietta suggerimenti
  contestuali senza richiedere input esplicito dall'utente. Tre proposte complementari:
  - **Proposta A** — `Fase 6 Capability Relevance Check` aggiunta in fondo a `orchestrator.md`: 6 regole
    di suggerimento valutate al `/run` (visual-oracle, a11y, analytics, premortem, semantic-drift-scan, review);
    output condizionale; gate installazione comandi; tono non imperativo.
  - **Proposta B** — sezione `## Suggerimento post-esecuzione` aggiunta in fondo a `dev-handoff.md`:
    regole per-layer (fe → a11y/ux-ui-review/visual-oracle; be/db → review; qa → flakiness; docs → lint);
    deduplication via `wiki/log.md`; max 3 suggerimenti; gate installazione.
  - **Proposta C** — script `.claude/tools/suggest-next.py` (~90 righe, solo stdlib Python 3) invocato
    dall'hook Stop di Claude Code dopo `/dev`, `/lint`, `/run`, `/review`; flag `--dry-run` per debug;
    non bloccante; adapter note per Cursor/Aider.
- **PATTERN.md §26** — Runtime Contextual Suggestions: architettura a tre proposte, 6 regole Proposta A,
  tabella per-layer Proposta B, spec hook Proposta C, invarianti di output condizionale e backward compat.
- **`suggest-next.py`** — nuovo tool in `.claude/tools/` (solo stdlib, exit 0 sempre, robusto a file mancanti).

### Changed

- **`orchestrator.md`** — Fase 6 aggiunta in fondo (addizione pura, backward compat totale R.P3).
- **`dev-handoff.md`** — sezione post-exec aggiunta in fondo (addizione pura, backward compat totale R.P3).
- **`.claude/settings.json`** — terzo hook nell'array Stop (matcher `/(dev|lint|run|review)`, non bloccante).
- **PATTERN.md** — bump v2.23 → v2.24; §0 esteso con EP-033; §26 aggiunto.

### Notes

- Nessuna nuova invariante §7 (resta 18).
- Proposta A e B: always-on una volta scaffoldato (nessun flag factory.config.yaml richiesto).
- Proposta C: può essere gated da `runtime_suggestions.hook.enabled: false` in factory derivate.
- Backward compat totale verso v2.23: factory senza capability suggerite → nessun output (gate installazione).
- Effort totale EP-033: S+S+M = ~4 TSK (TSK-222..225), Sprint 34.

## Validation evidence (v2.25.0) [gate-bypassed]

Gate battle-test EP-012 **bypassato** (tracciato, ADR-033 §E / ADR-034 §C).

- **Reason**: EP-034 VCS Branch Awareness Layer è capability opt-in, `default off` (R.B10),
  backward-compatible totale verso v2.24, zero nuove invarianti §7. Profilo di rischio minimo.
- **Evidenza reale parziale**: Run B — [`v2.25.0-portale-servizi-ep015-2026-07-01`](validation/runs/v2.25.0-portale-servizi-ep015-2026-07-01/RUN-REPORT.md)
  (8 TSK EP-015, 235 unit test verdi, field-test `/vcs-status` su 32 submodule, 3 finding reali;
  vincolo cliente rispettato). Backlog end-to-end per 3 run full-pipeline non disponibile
  (soli-boy drenato ai Sprint 10-16; reflexive sotto-soglia).
- **BYPASS**: [`validation/release-gates/v2.25.0/BYPASS.md`](validation/release-gates/v2.25.0/BYPASS.md)
- **SLA**: colmatura full battle-test (≥3 RUN-REPORT `pass`) entro **v2.26** (`bypass_sla_releases: 1`),
  verificata a boot del gate v2.26. Secondo bypass tracciato dopo v2.20.0.

## Validation evidence (v2.24.0)

Gate battle-test EP-012 eseguito con 3/3 RUN-REPORT validi (`framework_version: v2.24.0`, `pre_check_status: pass`, `review_status: pass`).

### Run consumati

| Run | Factory | Threshold | TSK | Commits | Capability chiave | analytics_events_count |
|-----|---------|-----------|-----|---------|-------------------|------------------------|
| Run A | soli-multi-agents-factory (reflexive) | reflexive_session release-day | 16 (EP-032: 12 + EP-033: 4) | 6 | EP-033 (3 componenti) + analytics | 5 |
| Run B | soli-boy Sprint 13 EP-016+EP-017 | run_esterno_denso (ADR-062) | 11 (TSK-107..119) | ~15 | a11y + ux_ui + EP-033 dev-handoff verificato | 0 (WARNING soft) |
| Run C | portale-servizi-factory EP-001 Wave 1 | run_esterno_denso (ADR-062) | 12 (Wave 1) | 12+ | analytics + EP-031+EP-033 coesistenza verificata | 0 (WARNING soft) |

### Findings consolidati

1. **`tools/` root-level refactor necessario** (Run A): suggest-next.py richiedeva path provider-agnostic → refactor `.claude/tools/` → `tools/` eseguito come pre-requisito EP-033.
2. **stdlib-only Python per suggest-next.py** (Run A): no PyYAML disponibile → parsing naif su 5 flag booleani; known limitation documentata.
3. **Hook Stop matcher regex** (Run A): terzo hook Stop richiede `/(dev|lint|run|review)` non plain string; coesistenza 3 hook verificata.
4. **dev-handoff come planner naturale** (Run B): EP-033 suggerisce dipendenze TSK in modo contestuale (TSK-111→TSK-112, TSK-114→TSK-118+119); finding positivo.
5. **Regola 3 condizionale** (Run C): `/lint → /semantic-drift-scan` solo se "staleness" in log → 0 falsi positivi su factory sana; corretto.
6. **EP-031 + EP-033 hook coesistenza** (Run C): delta incrementale v2.23→v2.24 non sovrascrive EP-031; array JSON hooks additivi; integrazione verificata.

### Capability non esercitate

`visual-oracle`, `functional-oracle` (EP-018), `compression.output/context` (opt-in default false), `semantic_check embedding reale` (API embedding non disponibile), `premortem`.

### Riferimenti

- Gate report: [`validation/release-gates/v2.24.0/GATE-REPORT.md`](validation/release-gates/v2.24.0/GATE-REPORT.md)
- Run A: [`validation/runs/v2.24.0-reflexive-selfdev-2026-06-26/RUN-REPORT.md`](validation/runs/v2.24.0-reflexive-selfdev-2026-06-26/RUN-REPORT.md)
- Run B: [`validation/runs/v2.24.0-soliboy-ep033-2026-06-26/RUN-REPORT.md`](validation/runs/v2.24.0-soliboy-ep033-2026-06-26/RUN-REPORT.md)
- Run C: [`validation/runs/v2.24.0-portale-servizi-ep033-2026-06-26/RUN-REPORT.md`](validation/runs/v2.24.0-portale-servizi-ep033-2026-06-26/RUN-REPORT.md)

---

## [v2.23.0] — 2026-06-25

**EP-031 Semantic Drift Detection — rilevamento deriva semantica wiki con piramide staleness+LLM-judge (research sprint).**

### Added

- **EP-031 — Semantic Drift Detection (opt-in, default off, R.P3, research).** Capability che rileva deriva semantica tra pagine wiki e sezioni PATTERN corrispondenti. Piramide a due segnali: (1) Check 4ag staleness threshold (always-on, zero costo, deterministico); (2) Check 4af LLM-judge per corpus ≤50 pagine / embedding coseno per corpus >50 pagine (opt-in). Skill `semantic-drift-scan-protocol`, comando `/semantic-drift-scan`. Blocco config `wiki_lint.semantic_check` in factory.config.yaml (6 chiavi). Runbook prerequisiti. ADR-EP031-001 (accepted, decision GO-MODIFIED).
- **Check 4ag — Staleness threshold (always-on).** Segnale economico complementare: `age > 180gg → INFO`, `age > 365gg → WARNING`, MISSING-DATE → WARNING. Zero API, deterministico, zero falsi positivi di tipo mapping-error.
- **`pattern_section:` corpus.** 10 pagine wiki ora monitorate con `pattern_section:` nel frontmatter. Baseline per calibrazione futura: score medio 0.70 (soglia 0.75), FP rate post-fix 0%.

### Changed

- **PATTERN.md**: nessuna modifica — v2.23.0 è un research sprint sulla factory stessa. Le feature EP-031 sono operative ma sperimentali; Check 4af non produce WARNING/ERROR, solo INFO.
- **6 pagine wiki** aggiornate con append non-distruttivo (§7 r.7) per allineamento §2 §7 §13 §16 §20 (semantic drift fix).

## Validation evidence (v2.23.0)

Gate battle-test EP-012 eseguito con 3/3 RUN-REPORT validi (`framework_version: v2.23.0`, `pre_check_status: pass`, `review_status: pass`).

### Run consumati

| Run | Factory | Threshold | TSK | Commits | Capability chiave | analytics_events_count |
|-----|---------|-----------|-----|---------|-------------------|------------------------|
| Run A | soli-multi-agents-factory (reflexive) | reflexive_session | 28 (182..209) | 20 | semantic_check + token_ledger | 0 (WARNING soft) |
| Run B | soli-boy Sprint 12 (external) | run_esterno_denso | 15 (092..106) | 20 | functional_oracle + a11y | 0 (WARNING soft) |
| Run C | soli-projects EP-007 (external) | run_esterno_denso | 10 | 15 | ux_ui + analytics + wiki-lint | 0 (WARNING soft) |

### Findings consolidati

1. **Mapping quality gap** (Run A): `pattern_section:` inferito dal titolo → FP §18 su `agentic-workflow-patterns.md`. Lezione: validare body prima di assegnare il campo.
2. **Gap API embedding** (Run A): Voyage-3 non disponibile → LLM-judge fallback. ADR-EP031-001 aggiornato con metodologia a scala.
3. **Aria-prohibited-attr regressione** (Run B / soli-boy): a11y regressione rilevata da Check Playwright → fix immediato.
4. **Test flaky CI** (Run B): timing dependency non isolata in test Esporta → pattern anti-flaky documentato.
5. **Dangling EP links + orphan wikilinks** (Run C / soli-projects): wiki-lint Check 1 ha rilevato link datati → fix.
6. **Submodule lag** (Run C): necessario CI workflow per auto-update pointer → implementato.

### Capability non esercitate

`visual-oracle`, `a11y scanner` (no headless env su meta-framework), `compression.output/context` (opt-in, default false), `semantic_check embedding reale` (API non disponibile — LLM-judge proxy usato).

### Riferimenti

- Gate report: [`validation/release-gates/v2.23.0/GATE-REPORT.md`](validation/release-gates/v2.23.0/GATE-REPORT.md)
- Run A: [`validation/runs/v2.23.0-reflexive-selfdev-2026-06-25/RUN-REPORT.md`](validation/runs/v2.23.0-reflexive-selfdev-2026-06-25/RUN-REPORT.md)
- Run B: [`validation/runs/v2.23.0-soliboy-sp12-2026-06-25/RUN-REPORT.md`](validation/runs/v2.23.0-soliboy-sp12-2026-06-25/RUN-REPORT.md)
- Run C: [`validation/runs/v2.23.0-soliprojects-ep007-2026-06-25/RUN-REPORT.md`](validation/runs/v2.23.0-soliprojects-ep007-2026-06-25/RUN-REPORT.md)

---

## [v2.21.0] — 2026-06-15

**EP-019 Design Intelligence Layer + EP-022 Token Ledger — il meta-framework che ragiona sul design prima di generare.**

### Added

- **EP-019 — Design Intelligence Layer (opt-in, default off, R.P3).** Capability che introduce un livello di intelligenza di design prima di ogni generazione: art-director DSL + LLM-Generator separation + critic/judge multi-round + intention economy. Chiude il failure mode «generazione senza intenzione». Skills: `art-director-protocol`, `design-spec-dsl`, `critic-judge-protocol`, `design-intelligence-protocol` (meta-skill), `llm-generator-separation-protocol`. PATTERN.md §24. ADR-068..071.
- **EP-022 — Token Ledger (inline, default off, R.P3).** Visibilità token reali inline dopo ogni risposta con tool use. Script `show-session-tokens.py` + hook Stop + invariante CLAUDE.md. Analytics cross-EP: `analytics.token_ledger.enabled: true`.

### Changed

- **Promozione `complexity_budget.required_on_release: false → true` nel repo del meta-framework** (EP-016 US-085, TSK-166, 2026-06-15): self-application della regola N:1 — il meta-framework applica a sé stesso la stessa forcing function che prescrive alle factory derivate (analogo a `release_governance.enabled` promosso in v2.19 e `analytics.dogfooding.enabled`). Con `required_on_release: true`, il Lint Check 4v (complexity budget) cambia comportamento: ERROR su release minor/major con ratio N:1 violato nel meta-framework (anziché WARNING no-op a flag spento). **Factory derivate restano `false` di default (R.P3 opt-in totale)**; il bootstrap le scaffolda con il check disabilitato, comportamento identico a v2.19.
- **Non-retroattività v2.19**: la promozione si applica **prospettivamente da v2.21 in poi** per il meta-framework; le release v2.19 e v2.20 non vengono rivalutate retroattivamente (applicazione prospettica, ADR-035 §A analogy, TSK-166 2026-06-15).

## Validation evidence (v2.21.0)

Gate battle-test EP-012 eseguito. 3/3 RUN-REPORT validi con `framework_version: v2.21.0`, `pre_check_status: pass`, `review_status: pass`, `analytics_events_count > 0`.

### Run consumati

| Run | Factory | Threshold | TSK | Commits | EP-019 | analytics_events_count |
|-----|---------|-----------|-----|---------|--------|------------------------|
| Run A | soli-boy (external) | run_esterno_denso | 7 (085..091) | 6 | ✓ 4 critic passes | 7 |
| Run B | soli-multi-agents-factory (reflexive) | reflexive_session | 25 (157..181) | 28 | ✓ ADR-068..071 | 6 |
| Run C | solids (external) | run_esterno_denso | 7 (001..007) | 6 | ✓ 7 artefatti | 7 |

### Findings consolidati

1. **Test as design contract** (soli-boy): cambio scale default ha rotto test — critic l'ha rilevato prima di CI. Lezione: i test documentano contratti impliciti di design.
2. **Waste prevention** (soli-boy): 2/3 backlog UX items già implementati — critic ha evitato duplicazione. ROI EP-019 in codebase maturo.
3. **color.accent vs color.secondary** (solids): stesso valore nel tema light, ruoli diversi in shadcn/ui — ambiguità LLM-silente ora documentata.
4. **text.tertiary su bg.hover** (solids): fallisce WCAG AA (4.2:1 < 4.5) — mai testato prima dell'audit EP-019.
5. **Sub-agent Bash permission** (meta-finding): sub-agent in factory esterne non ereditano Bash. `additionalDirectories` solo file tools. Da ADR futuro.

### EP-018 saldo debito v2.20.0

Il debito informale v2.20.0 (no BYPASS.md, gate passato senza RUN-REPORT formali) è stato saldato in Run A: `soli-boy/code_quality/reports/ep018-recheck-2026-06-15.md` con verdict STABILE.

### Capability non esercitate

`visual-oracle`, `a11y scanner` (no headless env), `compression.context (graphify)` (non configurato).

### Riferimenti

- Gate report: [`validation/release-gates/v2.21.0/GATE-REPORT.md`](validation/release-gates/v2.21.0/GATE-REPORT.md)
- Run A: [`validation/runs/v2.21.0-soliboy-ep019-2026-06-15/RUN-REPORT.md`](validation/runs/v2.21.0-soliboy-ep019-2026-06-15/RUN-REPORT.md)
- Run B: [`validation/runs/v2.21.0-reflexive-selfdev-2026-06-15/RUN-REPORT.md`](validation/runs/v2.21.0-reflexive-selfdev-2026-06-15/RUN-REPORT.md)
- Run C: [`validation/runs/v2.21.0-solids-ep019-2026-06-15/RUN-REPORT.md`](validation/runs/v2.21.0-solids-ep019-2026-06-15/RUN-REPORT.md)

---

## [v2.20.0] — 2026-06-10

**EP-018 FE Functional Oracle + ADR-064 Tool Callability Binding — la review che *esercita* l'app, e gli agenti di review resi davvero eseguibili.**

### Added
- **EP-018 — FE Functional Oracle (opt-in, default off, R.P3).** Capability che *esercita* il flusso reale dell'app (serve → carica fixture → guida interazione Playwright → asserzioni domain-agnostic → verdict deterministico), complementare a Visual Oracle (EP-005, *osserva* il render) e UX/UI Review (EP-008, *giudica* l'aspetto). Chiude il failure mode «renderizza ma non funziona». Pipeline completa PM→Arch→TPM→Develop:
  - **5 US** (US-068..072), **16 TSK** (TSK-141..156, Sprint 21), tutti `layer: docs`.
  - Skill `functional-oracle-protocol` (5 fasi: Serve → Load Fixture → Drive Scenario → Assert Outcomes → Diff+Loop bounded) + skill interna condivisa `interaction-drive-protocol` (single source dell'interazione Playwright scriptata, analoga a `screenshot-capture-protocol`).
  - Comando `/functional-oracle <TSK-id|app>` + dominio scheduler `functional-oracle` (serial same-app, parallel cross-app).
  - Schema `acceptance-spec` (`.claude/schemas/acceptance-spec.schema.yaml`): il framework possiede SCHEMA+engine, il progetto possiede il CONTENUTO (fixture/scenario/assertions). Primitive domain-agnostic (`canvas_pixel_variance`, `attr_equals`, `selector_visible`, `storage_key_present`, `console_no_error`, …).
  - Esecutore `qa-dev` in modalità functional-oracle (no nuovo agente, riuso ADR-009); verdict **deterministico** da asserzioni binarie (fail-closed), critic LLM **solo advisory** sul trace (mai nel path pass/fail).
  - Config block `fe_correctness.functional_oracle` (default `enabled: false`), frontmatter TSK `functional_status:` / `functional_acceptance_spec:`.
  - PATTERN.md §3 (operazione opzionale «Functional Oracle») + §5 (frontmatter) + §18 (dominio scheduler). Lint Check 4z.
  - ADR risolti: **ADR-065** (acceptance-spec schema vs contenuto), **ADR-066** (confine vs EP-005 US-020 + skill condivisa), **ADR-067** (esecutore + mix binario/LLM). Nessuna nuova invariante §7.
  - **Propagato al seed `meta-prompts/v2-20/factory-bootstrap.md`** (delta seed che estende v2-19): EP-018 è l'unica capability di prodotto derivabile di v2.20, opt-in via `fe_correctness.functional_oracle.enabled` (default `false`). A flag spento la factory derivata è identica a v2.19.

### Fixed
- **ADR-064 — Tool callability binding (completa ADR-063).** Gli agenti di review/design dichiaravano tool semantici (`capture_screenshot`, `run_a11y_scan`, `render_component`, `read_file`, `list_dir`) non callable in Claude Code e **senza `Bash`** nel frontmatter → non potevano eseguire i backing `.sh` → cadevano strutturalmente in `no-visual` (review visiva mai realmente eseguita; `a11y-specialist` aveva *zero* tool callable). ADR-063 li aveva resi ONESTI (fail-loud), ADR-064 li rende CAPACI: `tools:` ora elenca tool reali `[Bash, Read, Grep, Glob, Write]` + tabella binding semantico→`bash .claude/tools/*.sh`; `ux-ui-review-protocol` Step 1.0 aggiunge l'app-lifecycle serve (build/dev + health-check + teardown + CWD/Node fail-loud). Fix su `ux-ui-reviewer`, `a11y-specialist`, `ui-designer` + `ux-ui-review-protocol` + `screenshot-capture-protocol`. Propagato al seed `meta-prompts/v2-19/`.

## Validation evidence (v2.20.0)

Prima release **normale sotto gate** EP-012 (il marker `[transitional-bootstrap]` di v2.19.0 NON
si applica più, vedi `## Validation evidence (v2.19.0)` §«Da v2.19.1/v2.20.0 in poi»). Il gate
battle-test (`release_governance.battle_test_gate`, `mode: blocking`) esige ≥3 RUN-REPORT validi
prima del tag `v2.20.0`. Esecuzione del gate via meta-comando `/release` (mai auto-tag, R.P1: il
gate propone, il maintainer dispone).

- **Validazione EP-018 su factory esterna soli-boy** (run reali end-to-end): functional oracle
  eseguito sull'**app reale** → **falso-negativo iniziale rilevato e corretto** (fixture statica +
  assert su HUD fragile; lezione di calibrazione persistita: fixture animate + assert dello stato
  via engine, non via HUD; validare il primo run). È esattamente il motivo del critic **advisory**
  (mai nel path pass/fail) + del loop bounded `max_iterations`.
- Review UX/UI ora *capace* (evidence-grounded `file:riga`, niente fabbricazione — eredità ADR-063/064).
- Redesign UX completo (nav 4-tab emulator-first, TouchOverlay Variante B, Settings accordion)
  applicato via pipeline `design → review → develop → verifica`.

> **Gate status.** I RUN-REPORT formali in `validation/runs/**` per v2.20.0 sono da consolidare a
> release-time dal maintainer prima del tag (esegui `/release --dry-run` per il pre-check, poi
> `/release` per il verdict). Questa sezione documenta l'evidenza empirica disponibile; il tag
> resta una decisione del maintainer (R.P1).

---

## [v2.19.0] — 2026-06-09

**EP-013 Analytics Dogfooding Instrumentation — il meta-framework si auto-misura sui propri run.**

### Added
- **Dogfooding analytics acceso nel repo del meta-framework** (US-053, ADR-041 §A §B): nuovo sub-blocco `analytics.dogfooding:` in `factory.config.yaml` con `enabled: true` (master switch del cabling) + `privacy_policy_path` + `runbook_path` + `baseline_reports_path` + `lock_strategy: flock-advisory` + `lock_timeout_seconds: 5` + `idempotency_strategy: hash-compound`. Attivo **SOLO** nel repo del meta-framework; le factory derivate restano `enabled: false` di default (R.P3 opt-in totale, cabling no-op identico a v2.18).
- Nuovo flag `analytics.measurement.granularity: wave` (ADR-038 §A): granularità degli eventi (`tsk | wave | tool`), default raccomandato `wave`.

### Changed
- **Promozione gate instrumentation** `analytics.measurement.required_on_done: false → true` SOLO nel repo del meta-framework (ADR-041 §B): ribaltamento della dicitura "opt-in deferred" di v2.15. Lint Check 4q (WARNING-only su TSK done senza `cost_event_log`) ora attivo nel repo framework. Factory derivate invariate (`false` di default, R.P3). Prospettivo, non retroattivo (ADR-035 §A).
- **Battle-test gate ATTIVATO nel repo del meta-framework** (US-054, TSK-109, ADR-037 transitional bootstrap): `release_governance.enabled` + `release_governance.battle_test_gate.enabled` promossi `false → true` (con `mode: blocking`) SOLO in `factory.config.yaml` del repo framework. Da v2.19, **nessun tag `v2.19.0+` può procedere senza ≥3 RUN-REPORT validi** (validation/runs/**) passati dal pre-check meccanico + review umana e dal criterio cross-EP-013 `analytics_events_count > 0` (condizionale a `dogfooding.enabled: true`, ADR-040 §F + ADR-041 §C). Enforcement via meta-comando `/release` + skill `release-validation-gate` (5 step) + Lint Check 4w/4x. Mai auto-tag (R.P1): il gate propone, il maintainer dispone. Factory derivate restano `enabled: false` di default (R.P3 opt-in totale, no-op identico a v2.18).
- **`[transitional-bootstrap]` (ADR-037 §D)** — il tag `v2.19.0` è ora *gated dal gate che esso stesso introduce* (self-application): i 3 RUN-REPORT richiesti per rilasciare v2.19.0 sono prodotti **DURANTE lo sviluppo di v2.19 stessa**, eseguiti su release candidate `v2.19.0-rc.N` (N≥1) prima del tag finale (ADR-037 §A risoluzione del paradosso via temporalità rc → stable). La sezione `## Validation evidence (v2.19.0) [transitional-bootstrap]` con sub-section `### Transitional bootstrap rule` verrà compilata **a release-time** quando i 3 run reali saranno eseguiti; la skill `release-validation-gate` Step 5 esige il marker e la sub-section su v2.19.0 (fail-loud altrimenti). Il marker è canonico ma temporaneo: rimosso da v2.20+ (disciplina T1, premortem). **Disciplina T1**: i 3 RUN-REPORT veri NON esistono ancora — vanno prodotti dal maintainer prima del tag v2.19.0; questa attivazione del gate è la forcing function che lo impone.
- Nota append-only nella sezione `## [v2.15.0]` che documenta il ribaltamento del gate analytics (vedi sotto).

### EP-012 Battle-test forcing function (v2.19 P0)

Forcing function di rilascio: il framework non può più dichiarare una release «pronta» sulla sola specifica + lint verde. Affronta il rischio **T1** (divario specifica/esecuzione, il *most-dangerous* del premortem). Nessuna nuova invariante §7 (R.P1/R.P3 riusate).

- **PATTERN.md §22 «Release Governance»** (US-051, ADR-036): nessuna `v2.X+` del meta-framework può procedere al tag senza ≥3 RUN-REPORT validi (run reali end-to-end documentati) passati dal pre-check meccanico + review umana. Frase canonica §22.4 (ADR-036 §B / ADR-035 §B): «Versioni v2.14-v2.18 sono storicizzate come "validate on specification, not battle-tested"».
- **Skill `release-validation-gate`** (5 step) + **meta-comando `/release`** (US-049/US-050, ADR-032/033): criteri "run reale end-to-end" + template RUN-REPORT + `CRITERIA.md` (criteri di validità del gate). Default safe `--dry-run`, mai auto-tag (R.P1). Meta-comando parallelo a `/factory-bootstrap` e `/factory-upgrade`, NON scaffoldato in factory derivate.
- **Lint Check 4w/4x** (`lint-checks.md`, ADR-033 §I / ADR-034 §A): coerenza sezione `## Validation evidence` ↔ RUN-REPORT consumati + marker `[transitional-bootstrap]` su v2.19.0.
- **Backward compat non-retroattiva** (ADR-035): il gate vale **prospettivamente, da v2.19 in poi**; le release v2.14-v2.18 restano **valide e supportate**, storicizzate come "validate on specification, not battle-tested" (frase canonica). Nessuna sezione `## Validation evidence` retroattiva (ADR-034 §D); CHANGELOG storico riceve solo la nota append-only v2.15 (ADR-035 §C). Factory derivate non impattate: `release_governance.battle_test_gate.enabled: false` di default (R.P3 opt-in totale, no-op identico a v2.18).

### EP-017 Maintainership & Adoption (v2.19 P1)

Governance documentale + posizionamento del progetto. Nessuna nuova invariante §7, nessuna nuova operazione canonica §3 (ADR-061 §E §F). Tutte aggiunte additive (backward compat).

- `LICENSE` (Apache 2.0) verificato e allineato SPDX (ADR-057).
- `CONTRIBUTING.md` — governance contributor (5 tipi contributo, processo PR, SLA, Conventional Commits) (ADR-059 §A).
- `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1 (ADR-059 §B).
- `.github/PULL_REQUEST_TEMPLATE.md` + 3 issue template (`bug_report`, `feature_request`, `wiki_proposal`) (ADR-059 §D §E).
- `design_&_architecture/decisions/TEMPLATE-contributor.md` — ADR semplificato per contributor (ADR-059 §C).
- `wiki/getting-started/pattern-in-one-page.md` — entry point newcomer ~500 righe, profilo `minimal` di EP-016 (ADR-060).
- `README.md` revisionato: sezioni `## Audience` + `## Getting Started` in alto, tono newcomer-friendly first; sezioni tecniche avanzate preservate in coda (additivo, ADR-058 §B + cross-ADR-057/059/060).
- **Audience dichiarata come progetto personale / di ricerca dell'autore (@soli92)** — DECISIONE DEL MAINTAINER che supera l'assunzione di ADR-058 (audience Accenture/OSS): nessuna promessa di supporto né di community; bus factor 1 dichiarato esplicitamente come riconoscimento dell'Elephant **E2** del premortem, non occultamento. Uso previsto = sperimentazione su factory agentiche; per studiare il metodo → `pubblicazioni/` + `wiki/`.

### EP-016 Complexity Budget & Adoption Profiles (v2.19 P1)

Governance documentale + sottrattiva: prima forcing function per la sostenibilità del framework (inversione del bias additivo). Affronta il rischio **Elephant E1** (congelamento cognitivo per crescita monotona del PATTERN). Nessuna nuova invariante §7 (resta a 18, ADR-052 §H).

- **PATTERN.md §23 «Complexity Budget & Deprecations»** (US-061, ADR-052): regola N:1 + lista deprecazioni vivente + governance + self-validation + 3 profili di adozione.
- **Regola N:1 ricalibrata `N=3 → N=5`** (US-063, TSK-126, ADR-055 §Revisione 2026-06-08): aggiornamento additivo di §23.1 (§7 r.7, resto di §23 invariato). Una rimozione obbligatoria ogni **5** sezioni `##` top-level aggiunte (era ogni 3), più esclusione esplicita delle **sezioni-capability** attive (es. §22, §23) dal trigger di rimozione obbligatoria.
- **Finding empirico (US-063, TSK-125)**: l'audit di backward compat (`validation/runs/v2.19-section-removal-audit/AUDIT-REPORT.md`, `0 ruptures`) ha dimostrato che **nessuna** delle 5 candidate di ADR-055 §A è una sezione `##` top-level rimovibile: il bloat del PATTERN è strutturalmente nei **sotto-blocchi**, nelle regole `R.xN` e nelle voci di changelog, non in sezioni top-level. Forzare N=3 avrebbe richiesto l'archiviazione di sezioni operative attive (il contrario del bene). Decisione del maintainer: ricalibrare N a 5 anziché eseguire un primo round sottrattivo innaturale. Nessuna sezione rimossa in v2.19; `PATTERN-historical.md` resta scheletro per i round v2.20+.
- **Complexity budget proof**: `complexity/budget-report-v2.19.md` — `added=2` (§22, §23), `removed=0`, verdict **`pass`** sotto la regola ricalibrata `N=5` (`added=2 < N=5` → nessuna rimozione obbligatoria). Debito di complessità (+2 sezioni) tracciato e monitorato verso v2.20.

## Validation evidence (v2.19.0) [transitional-bootstrap]

### Transitional bootstrap rule (ADR-037)

v2.19 introduce per la prima volta il battle-test forcing function (EP-012, ADR-032..036).
La prima applicazione del gate è alla release v2.19.0 stessa — pattern self-referential
intenzionale (ADR-037 §A): i 3 RUN-REPORT che validano v2.19.0 sono stati eseguiti
durante lo sprint v2.19 su release candidate `v2.19.0-rc.1`, prima del tag finale.

Conseguenze:
- Il gate è stato applicato a sé stesso prima di essere rilasciato (forcing function autoapplicata).
- I 3 run hanno usato anche EP-013 (analytics dogfooding cablato) → sinergia realizzata
  (ADR-041 §C: `analytics_events_count > 0` per ciascun run: 3 / 7 / 5).
- Da v2.19.1 / v2.20.0 in poi, il marker `[transitional-bootstrap]` non si applica più
  (release normali sotto gate).
- Il criterio #4 `duration_min` è stato esteso in corsa con l'alternativa **run esterno denso**
  (ADR-062) per qualificare i 2 run su factory esterna (soli-boy) in finestra compressa.

### Run consumati

- **Run 1** — [validation/runs/v2.19-reflexive-selfdev-2026-06-08/RUN-REPORT.md](validation/runs/v2.19-reflexive-selfdev-2026-06-08/RUN-REPORT.md) — 2026-06-08 — meta-framework (self-dev riflessivo) — verdict: **pass** — analytics_events: 3
- **Run 2** — [validation/runs/v2.19.0-rc.1-soliboy-mobile-2026-06-09/RUN-REPORT.md](validation/runs/v2.19.0-rc.1-soliboy-mobile-2026-06-09/RUN-REPORT.md) — 2026-06-09 — soli-boy (esterno, mobile EP-007, 7 TSK) — verdict: **pass** — analytics_events: 7
- **Run 3** — [validation/runs/v2.19.0-rc.1-soliboy-desktop-2026-06-09/RUN-REPORT.md](validation/runs/v2.19.0-rc.1-soliboy-desktop-2026-06-09/RUN-REPORT.md) — 2026-06-09 — soli-boy (esterno, desktop/store EP-006/008, 6 TSK) — verdict: **pass** — analytics_events: 5

### Findings consolidati

Cross-run (≥12 breakpoint genuini; vedi §5 dei singoli RUN-REPORT):
- **Run 1** (riflessivo): collisione numerazione §/Check, regola N:1 non soddisfacibile, GIGO analytics N=0, pricing fail-loud su opus-4-8, content-filter Covenant, refuso path syntheses/.
- **Run 2** (mobile): wiring App.tsx→Player (bug integrazione e2e-revealed), D-pad overlap CSS (e2e-revealed), rAF polling leak (CQRL major), spec drift GameSession, misclassificazione layer TPM, gap versione Node.
- **Run 3** (desktop): **review ux_ui ALLUCINATA** (capability rotta → ADR-063 accettato), e2e Electron non headless, gap IPC ADR-008 (quitAndInstall), criterio #4 vs backlog infra-heavy.
- **Pattern trasversale**: gli unit test mockati non colgono i bug d'integrazione (l'e2e sì); i guardrail anti-fabbricazione funzionano dove esistono (pricing, a11y-scan) e mancano dove la capability è giovane (ux_ui → ADR-063). Follow-up taskizzato: Sprint 20 (US-067, TSK-133..139).

### Capability non esercitate

- `ux_ui` review **valida**: invocata nel Run 3 ma fallita (review allucinata) → copertura reale NON ottenuta; fix in ADR-063 / Sprint 20.
- `premortem` come gate di run, `compression.output`/`compression.context` (config ON ma non stressate), `visual-oracle` formale (coperto solo via e2e theme-regression).

### Riferimenti

- GATE-REPORT: [validation/release-gates/v2.19.0/GATE-REPORT.md](validation/release-gates/v2.19.0/GATE-REPORT.md)
- ADR-037 (transitional bootstrap rule), ADR-062 (run esterno denso), ADR-063 (anti-fabbricazione review ux_ui)
- Criteri: [validation/CRITERIA.md](validation/CRITERIA.md)

---

## [v2.18.1] — 2026-06-05

**Tooling & docs — seed consolidato self-contained, dispatcher versionato, capability `/factory-upgrade`. Nessun cambio al contratto `PATTERN.md` (resta v2.18).**

### Added
- **Seed consolidato self-contained** [`meta-prompts/v2-18/factory-bootstrap-full.md`](meta-prompts/v2-18/factory-bootstrap-full.md) — variante di v2.18 con l'intera catena `extends` (v2-18 + v2-17 + v2-16 + v2-15 + Fase 2/5 di v2-12) inlinata in un unico file. Risolve il fallimento «non riesco a recuperare tutte le informazioni» quando un agente fetcha il solo delta seed senza risolvere la catena `extends:`. Invocabile via `/factory-bootstrap --version=v2-18-full`.
- **Dispatcher versionato nel repo** [`.claude/commands/factory-bootstrap.md`](.claude/commands/factory-bootstrap.md) — era l'unico comando non versionato (viveva solo user-level in `~/.claude/commands/`, dove era rimasto fermo a v2.17 come default). Ora source-of-truth nel repo, default `v2-18`, da installare user-level via `cp`.
- **Meta-comando `/factory-upgrade`** + skill [`factory-upgrade-protocol`](.claude/skills/factory-upgrade-protocol.md) — upgrade incrementale **non distruttivo** di una factory esistente verso la versione target (delta chain `v_from → v_to`, supportato per target ≥ v2-13). Controparte di `/factory-bootstrap` (greenfield). 5 azioni di piano (COPY / MERGE config a flag `false` / PATCH file non personalizzati / REPLACE PATTERN.md / SKIP idempotente); i file personalizzati diventano CONFLICT con suggerimento patch (mai auto-merge, R.7). Default dry-run (report + STOP, R.6); `--apply` con backup + VCS gate (R.14). Fulfills l'item roadmap `meta-prompts/README` «Retrofit skill `/retrofit-factory`».

### Changed
- `PATTERN.md` §0 (titolo + «Pattern version» + Origine) e §21 (nuova entry v2.18) allineati al corpo, che era già pieno di contenuti v2.18 mentre header/changelog erano rimasti a v2.17.
- `README.md` aggiornato a v2.18 (Setup, tree, «Stato attuale», riferimenti seed) + `meta-prompts/README.md` (riga v2.18-full, roadmap retrofit → DELIVERED, install dispatcher) + `CLAUDE.md` (meta-comandi + quick start `/factory-upgrade`).

### Fixed
- README.md: «Invarianti hard» indicava 17 regole §7 → corrette a **18** (r.18 compression, v2.14); sezione «Stato attuale» era ferma a v2.13; vari riferimenti di versione stale (v2.16/v2.17) → v2.18.
- Dispatcher: nota «Method C — Local cache» chiarita come legacy/deprecata (la cache user-level conteneva seed solo fino a v2-12; da v2.13 vivono solo nel repo).

### Unchanged (invarianti preservati)
- **Niente cambio al contratto**: `PATTERN.md` resta v2.18, le 18 invarianti §7 invariate. Tutte le aggiunte sono tooling/docs additive; backward compat totale.

---

## [v2.18.0] — 2026-06-04

**A11y + UX/UI Integration — pre-screening accessibilità WCAG 2.2 AA + review/design UX/UI con rubrica anti-soggettività, tutto opt-in**

### Added — EP-007 Accessibility Testing
- **Tool `a11y-scan`** (`.claude/`) — scan accessibilità WCAG 2.2 AA via Playwright + axe-playwright, browser headless via Bash (no MCP). Target: URL | file | dir build | TSK-id.
- **Skill `accessibility-testing-protocol`** (`.claude/skills/`) — pre-screening deterministico WCAG 2.2 AA, esito violazioni + severity + remediation hint. Operazione opzionale `PATTERN §3`.
- **Agente opzionale `a11y-specialist`** (`.claude/agents/`) + **comando `/a11y <target> [--ephemeral]`** (`.claude/commands/`).
- **Lint Check 4o** (`lint-checks.md`) — WARNING-only, coerenza `a11y_status` ↔ report a11y.
- **Config `factory.config.yaml.a11y`** — nuovo blocco, tutti i flag `false`/no-op default + `scheduler.domains.a11y: false` + `code_quality.passes.accessibility: false`.
- **Frontmatter TSK opzionali** (`PATTERN §5`) — `a11y_status`, `a11y_report`, `a11y_skip_reason`.
- **ADR-014..016** (accepted) — 3 decisioni architetturali EP-007 (tool Playwright+axe, neutralità invariante §3, schema dati a11y).

### Added — EP-008 UX/UI Review & Design
- **Skill `ux-ui-review-protocol`** + **`ux-ui-design-protocol`** (`.claude/skills/`) — rubrica anti-soggettività (Nielsen 10 + dimensioni UI 6 + flusso 5), pattern evaluator-optimizer; separazione enforced designer vs reviewer (no auto-eval).
- **Infra condivisa (US-031)** — `screenshot-capture-protocol` (refactor non distruttivo EP-005), `design-tokens-extraction`, `design-system-conformance-check`.
- **Agenti `ux-ui-reviewer` + `ui-designer`** (`.claude/agents/`) + **comandi `/ux-ui-review` + `/ux-ui-design`** (`.claude/commands/`).
- **Lint Check 4p** (`lint-checks.md`) — WARNING-only, coerenza `ux_ui_status` ↔ report UX/UI.
- **Config `factory.config.yaml.ux_ui`** — nuovo blocco, tutti i flag `false`/no-op default + `scheduler.domains.ux-ui-review: false`.
- **Frontmatter TSK opzionali** (`PATTERN §5`) — `ux_ui_status`, `ux_ui_report`, `ui_design_spec`, `ux_ui_skip_reason`.
- **Ordering pipeline FE** — **develop → visual-oracle → ux-ui-review → code-review** (`PATTERN §19`).
- **ADR-017..020** (accepted) — 4 decisioni architetturali EP-008 (rubrica anti-soggettività, separazione designer/reviewer, infra screenshot condivisa, ordering pipeline).

### Changed
- `PATTERN.md` bumped 2.17 → 2.18 (`factory.config.yaml.pattern_version: "2.18"`).
- §3 tre nuove operazioni canoniche opt-in (Accessibility Scan, UX/UI Review, UX/UI Design); §5 sette nuovi campi frontmatter TSK opzionali; §18 due nuovi domini scheduler (a11y, ux-ui-review); §19 ordering pipeline FE esteso + 4° pass opzionale CQRL accessibility; §21 nuova entry v2.18.

### Unchanged (invarianti preservati)
- **Niente nuova invariante §7**: le regole di a11y e UX/UI vivono nelle skill e nel config, non in §7.
- Tutti gli invarianti pre-esistenti (R.P premortem, R.C/R.G compression, R.Q review, R.S scheduler, fe_correctness visual oracle, …) invariati.
- Niente gate auto-enforcing: `/a11y`, `/ux-ui-review`, `/ux-ui-design` sono sempre espliciti; i touchpoint sono no-op a flag spento.

### Migration
- v2.17 → v2.18 è **no-op senza opt-in**: `a11y.enabled: false` + `ux_ui.enabled: false` (default) → comportamento v2.17 identico (Check 4o/4p no-op senza i rispettivi campi frontmatter, ordering FE inalterato). Backward compat totale verso v2.13..v2.17. I 7 campi frontmatter TSK sono opzionali e additivi (assenza = comportamento v2.17).

### Note
- Design doc completo: `design_&_architecture/proposta-a11y-uxui-integration-v218.md` + ADR-014..020.
- **Storage**: report a11y/UX-UI come side-channel (file versionati) + screenshot/PNG gitignored, analogo al Visual Oracle.

---

## [v2.17.0] — 2026-06-03

**FE Visual Oracle Integration — chiusura del loop visivo FE (render headless + critica multimodale) + State Matrix nel DoD, tutto opt-in**

### Added
- **EP-005 FE Visual Oracle** — skill `visual-oracle-protocol` (`.claude/skills/`), 5 fasi (Bootstrap → Render Headless → Screenshot Multi-Viewport/Tema → Critica Visiva → Diff+Loop) + **Fase 3-bis Structured Checks** opt-in (visual-regression / axe-a11y / interaction-test). Critic = stesso `fe-dev` in review multimodale (pattern evaluator-optimizer). Browser headless = Playwright via Bash (no MCP).
- **Comando `/visual-oracle <TSK-id> [--dry-run]`** (`.claude/commands/`) — verdict `pass | conditional | reject`, loop bounded da `fe_correctness.max_iterations`. Funziona indipendentemente da `fe_correctness.enabled` (esecuzione esplicita = volontà esplicita).
- **`dev-protocol` Fase 4-bis Visual Verification** + sezione «Visual oracle» in `fe-dev` — chiude il loop visivo prima del `status: done` FE.
- **`code-review-protocol` Fase 0 precondition `visual_status: pass`** — ordering **develop → visual-oracle → review** (`PATTERN §19.11`).
- **EP-006 FE State Matrix + Granularity + Oracle Gate** — `scrivi-task` sezioni «Layer FE — State Matrix nel DoD» + «Granularity Rule» (prompt OR); lint **Check 4n** WARNING-only (trigger AND, soglie configurabili); skill interna `oracle-precheck` (euristica deterministica 4 condizioni a-d, no LLM runtime); sezione «Oracle Pre-Check FE» in `orchestrator` + log `memory/episodic/oracle-gate.md`.
- **Config `factory.config.yaml.fe_correctness`** — nuovo blocco, tutti i flag `false`/no-op default (`enabled`, `max_iterations: 3`, `viewports`, `themes`, `checks: []`, `state_matrix_inject`, `granularity_lint`, `granularity{8,3}`, `dispatch_gate`) + dominio `scheduler.domains.visual-oracle: false`.
- **Frontmatter TSK opzionali** (`PATTERN §5`) — `visual_status` (single-writer skill `visual-oracle-protocol`), `interaction_test_spec`, `visual_reference` (scritti da TPM).
- **Runbook** `wiki/runbooks/visual-oracle-installation.md` (setup Playwright headless).
- **ADR-008..013** (accepted) — schema dati Visual Oracle + ordering 3 punti + granularity/oracle-gate.

### Changed
- `PATTERN.md` bumped 2.15 → 2.17 (`factory.config.yaml.pattern_version: "2.17"`; era rimasto stale a "2.16"). Title riga 1 e §0 allineati a v2.17.
- §3 addendum «Visual Verification come variante Develop FE»; §5 tre campi opzionali additivi; §19.11 nuova nota ordering visual→review; §21 nuova entry v2.17.

### Unchanged (invarianti preservati)
- **Niente nuova invariante §7**: la sezione resta a **18 regole**, invariata rispetto a v2.16. Le regole del Visual Oracle vivono nella skill e nel config, non in §7.
- Tutti gli invarianti pre-esistenti (R.P premortem, R.C/R.G compression, R.Q review, R.S scheduler, …) invariati.
- Niente gate auto-enforcing: `/visual-oracle` è sempre esplicito; la Fase 4-bis è no-op a flag spento.

### Migration
- v2.16 → v2.17 è **no-op senza opt-in**: `fe_correctness.enabled: false` (default) → comportamento v2.16 identico (Fase 4-bis no-op, Check 4n no-op senza trigger, ordering inalterato). Backward compat totale verso v2.13..v2.16. I 3 campi frontmatter TSK sono opzionali e additivi (assenza = comportamento v2.16).

### Note
- **Seed `meta-prompts/v2-17/factory-bootstrap.md`** — estende v2-16 con la sola **Fase 1.quinquies** opt-in (attivazione FE Visual Oracle: `visual-oracle-protocol` + `oracle-precheck` + `/visual-oracle` + blocco `fe_correctness`). A differenza di v2-16 (file puramente additivi) le integrazioni v2.17 toccano skill esistenti, ma sono **no-op a flag spento** → ereditate dallo scaffold base senza rischio; l'opt-in reale è l'attivazione (`fe_correctness` + Playwright). Dispatcher `/factory-bootstrap` default `v2-17`.
- **Storage**: side-channel `code_quality/reports/<TSK-id>-visual-iter-<N>.{json,md}` (file versionati) + cartelle PNG (gitignored) + `.factory-runners/` (gitignored).

---

## [v2.16.0] — 2026-06-01

**Premortem Integration — pattern di analisi del rischio (prospective hindsight) come operazione opzionale opt-in**

### Added
- **Skill `premortem-protocol`** (`.claude/skills/`) — 5 fasi (Context Gathering → Frame Setting → Raw Premortem → Parallel Deep-Dives → Sintesi). Output: Risk Registry con tassonomia Tigers/Paper Tigers/Elephants. Operazione opzionale `PATTERN §3`.
- **Comando `/premortem`** (`.claude/commands/`) — 3 input shape (descrizione libera / artefatto kanban EP-US-TSK / pagina wiki) + flag `--timeframe`.
- **Frontmatter `risk_classification:`** opzionale su EP/US/TSK (`PATTERN §5`) — 6 enum tier + `premortem_ref` + `reviewed_by`.
- **Lint Check 4m** (`lint-checks.md`) — WARNING-only, coerenza `risk_classification` ↔ Risk Registry (3 sotto-check).
- **Dominio scheduler `premortem`** (`PATTERN §18`) — default `parallel`, composizione N×M sub-agent (cap interno Fase 4 = 8 hardcoded, ADR-001).
- **Pass CQRL `premortem-on-merge`** (`PATTERN §19`, `code-review-protocol`) — 4° pass opzionale, default **off** (ADR-005).
- **Telemetria** `memory/episodic/premortem-runs.md` (single-file append-only, metadati only — ADR-006) + template `management/risk-registry.md` (append-only, schema 9 colonne — ADR-002).
- **Seed `meta-prompts/v2-16/factory-bootstrap.md`** — estende v2-15 con la sola **Fase 1.quater** opt-in. Dispatcher default `v2-16`.
- **Runbook** `wiki/runbooks/premortem-runbook.md` (7 sezioni + 4 esempi, incluso self-premortem).

### Changed
- `PATTERN.md` bumped 2.15 → 2.16 (`factory.config.yaml.pattern_version: "2.16"`; era rimasto stale a "2.14").
- §21 nuova entry v2.16; §3/§5/§18/§19 estesi con i touchpoint premortem.

### Unchanged (invarianti preservati)
- **Niente nuova invariante §7**: R.P1 (output mai auto-applicato), R.P2 (bar minimo fail-loud), R.P3 (opt-in totale) vivono nella skill, non in §7.
- Niente gate auto-enforcing: `/premortem` è sempre esplicito (ADR-003, no phrase-trigger).
- Tutti gli invarianti pre-esistenti (R.C/R.G compression, R.Q review, R.S scheduler, …) invariati.

### Migration
- v2.15 → v2.16 è **no-op senza opt-in** (verificato TSK-009: `/lint` v2.15-only = 0 nuove ERROR/WARNING; Check 4m no-op senza blocco `risk_classification:`). Backward compat totale verso v2.13/v2.14/v2.15.

### Note
- **Correzioni in Develop vs design doc**: il seed v2-16 estende **v2-15** (non v2-13 come da bozza §3.7 — avrebbe perso il Compression Layer); lint Check 4m numerazione resa accurata (i check 4k/4l del design non esistono nel file skill).
- **Release gate**: self-premortem applicato a v2.16 stessa (TSK-018) → calibration valida (3 Tiger / 2 Paper Tiger / 2 Elephant). Gap aperto v2.17: soglia di promozione telemetrica non definita (`wiki/gaps.md`).
- Design doc completo: `design_&_architecture/proposta-premortem-integration-v216.md` + ADR-001..ADR-007.

---

## [v2.15.0] — 2026-05-29

**Consolidation release — Compression Layer a due assi stabilizzato, gate empirici riformulati come opt-in deferred**

### Changed
- `PATTERN.md` bumped 2.14 → 2.15.
- §21 nuova entry v2.15 (consolidation) — chiude il ciclo v2.14 (OCL Fase 1 + CCL Fase 2) come baseline stabile.
- Riformulazione gate empirici: Fase 1.5 ([[compression-validation-template]]) + Fase 3a ([[wiki-as-graph-poc-template]]) passano da «pending run empirico» (blocker implicito della versione) a «**opt-in deferred**» (gate aperti, eseguibili a discrezione del derivatore quando dispone di factory candidata + parametri di baseline misurabili). Motivazione: il meta-framework stesso non ha kanban significativo né sprint reale per essere candidato di validation; applicazioni concrete del framework non hanno necessariamente parametri di baseline misurabili per metrica empirica — bloccare il consolidamento sulla validation empirica significava lasciare v2.14 in stato «WIP» indefinitamente.

### Unchanged (invarianti preservati)
- R.C1–R.C6 (output compression) restano in vigore identici.
- R.G1–R.G6 (context compression) restano in vigore identici.
- Default `compression.output.enabled: false` + `compression.context.enabled: false` invariati.
- Asse `wiki` come target Graphify (Fase 3b) resta gated da Fase 3a PoC con i 4 check non-negoziabili (citation integrity / wikilink resolution / frontmatter integrity / layering preservation).

### Migration
- v2.14 → v2.15 è **no-op di codice**. Le factory derivate v2.14 si comportano identiche su v2.15: solo aggiornamento delle referenze di versione.
- Backward compat totale verso v2.13 e v2.14.

### Note
- I template Fase 1.5 e Fase 3a restano committati come riferimento operativo; chiunque (derivatore della factory, utente con factory candidata) può eseguirli quando ha parametri adeguati e proporne l'esito come input per v2.16+.

> **Note (added 2026-06-08, see v2.19 / US-053 / ADR-041 §B):** la dicitura "opt-in deferred"
> dell'instrumentation analytics gate (`required_on_done: false`) è stata ribaltata in v2.19
> per il repo del meta-framework: `analytics.measurement.required_on_done: true` e
> `analytics.dogfooding.enabled: true`. Default `false` per factory derivate (R.P3 invariata).
> Vedi ADR-041 §B per la decisione completa.

---

## [v2.14.0] — 2026-05-28

**Compression Layer a due assi (output + context), opt-in**

### Added — Fase 1: Output Compression Layer (OCL) via Caveman
- `PATTERN.md` §20 nuova sezione «Output Compression Layer» (§20.1–§20.9) con 6 invarianti **R.C1–R.C6** (allow-list channel-aware, chain-depth ceiling, cross-factory off, drift fallback, opt-in totale, invarianti `to_user`/`to_artifact`/`propagate-resolution` non overridabili neppure in `policy_profile: custom`).
- `PATTERN.md` §7 nuova regola **r.18** (compression mai sugli artefatti).
- 3 `policy_profile`: `conservative` (default, drift minimo), `aggressive` (factory mature), `custom` (matrice esplicita).
- Topology-aware default (§20.3): `knowledge-only` → `aggressive`; `full-stack` / `hybrid` → `conservative`.
- Skill `.claude/skills/caveman-protocol.md` (5 fasi: Bootstrap → Identify Channel → Apply Compression → Drift Check → Log).
- Comando `.claude/commands/compression.md` (`show` / `set` / `policy` / `dry-run`).
- Campo frontmatter agent opzionale `caveman_policy:` (§20.6, può solo abbassare canali — mai abilitare R.C1).
- Blocco `factory.config.yaml.compression.output` (provider, policy_profile, channels, chain_depth_downgrade, cross_factory, drift_fallback).
- Hook in `parallel-scheduling` (§20.7): intercept inline nel dispatch della wave + stats `tokens_compressed/tokens_raw` per canale nel `wave_report.md`.
- `wiki-lint` nuovo Check 4k (coerenza `policy_profile == custom` ⇒ `channels` block completo; R.C1 invariants enforced).
- Wiki: 9 pagine nuove (2 source + 3 entity `julius-brussee`/`caveman`/`graphify` + 2 concept `token-compression`/`knowledge-graph-codebase` + 1 synthesis `token-reduction-tools` + 1 design doc `factory-compression-layer`).

### Added — Fase 2: Context Compression Layer (CCL) via Graphify
- `PATTERN.md` §16 esteso con `graphify-sync` come **4° sync adapter** (PDF / Figma / Repo / Graph).
- `PATTERN.md` §20.10–§20.11 nuova sezione «Context Compression Layer» con 6 invarianti **R.G1–R.G6** (filesystem single source of truth, confidence-gated dispatch obbligatorio, blast radius pre-check, drift mitigation con cron weekly + monitoring, side-channel write-restricted, opt-in totale).
- Confidence-gated dispatch (§20.10.1): executor → `EXTRACTED` only; explorer (lead-architect, wiki-query) → `EXTRACTED + INFERRED`; reviewer (code-reviewer) → tutto con flag.
- Agent `.claude/agents/graphify-sync.md` (thin, analogo a `repo-sync` v2.12 + writes side-channel).
- Skill `.claude/skills/graphify-extraction-protocol.md` (5 fasi: Bootstrap → Discovery+Cost → Build Graph → Side-channel write+Summary → Log).
- Comando `.claude/commands/graphify-sync.md` (`sync` / `show` / `status` / `refresh`).
- Side-channel `.graphify-state/code_paths/<slug>/{graph.json, GRAPH_REPORT.md, last_full_rebuild.txt}` (non versionato in git, rebuildable da `<code_path>`).
- Blocco `factory.config.yaml.compression.context` (provider, targets, update_strategy, full_rebuild_cron, ci_strategy, confidence_gating, mcp_server, full_rebuild_cost_warn).
- `.gitignore` aggiornato con `.graphify-state/` (R.G6).
- `code-reviewer` esteso con blast radius pre-check (R.G3, `graphify affected "<X>"` incluso nel `task_package` come `blast_radius_warning` constraint).
- `parallel-scheduling` Fase 5 esteso con Step 1 nuovo (context compression resolve confidence-gated, filtraggio GRAPH_REPORT per ruolo, fallback automatico a scansione filesystem su stale/missing).
- `wiki-lint` nuovo Check 4l (graphify deliverables coerenza).

### Added — Tooling install + runbook
- Graphify v0.8.22 installato system-wide via `pip install graphifyy` (PyPI doppia-y, binario `graphify` singola-y).
- Runbook `wiki/runbooks/graphify-installation.md` (install + provider LLM cloud/Ollama + smoke test + CI cache-with-fallback + hook git auto-update + troubleshooting).
- Documentate CLI key commands: `graphify update <path>` (incremental, zero-token), `--force` (full rebuild), `affected "<X>"` (blast radius), `diagnose multigraph` (ghost dup check), `path "A" "B"`, `query "<question>"`, `watch <path>`, `hook install`, `merge-graphs`.

### Added — Gate empirici (setup-ready, run deferred in v2.15)
- Fase 1.5 validation template: `wiki/runbooks/compression-validation-template.md` (7 step + 3 metriche + 4 decision criteria GO/REWORK/NO-GO/STOP).
- Fase 3a PoC karpathy preservation: `wiki/runbooks/wiki-as-graph-poc-template.md` + `wiki/runbooks/wiki-as-graph-poc-sub-corpus-snapshot.md` (20 pagine sub-corpus + 4 check non-negoziabili).
- Migration runbook: `wiki/runbooks/migration-v214.md` (Fase 1) + `wiki/runbooks/migration-v214-fase2.md` (Fase 2).

### Defaults (sicuri, opt-in totale)
- `compression.output.enabled: false`.
- `compression.context.enabled: false`.
- `provider: caveman` (output) / `provider: none` (context).
- `policy_profile: conservative` (output).
- `ci_strategy: cache-with-fallback` (context).
- `confidence_gating: executor → EXTRACTED only` (context).
- `full_rebuild_cost_warn: 5$` (context).

### Backward compat
- Totale verso v2.13. Factory v2.13 senza blocchi `compression.*` si comportano identiche.

### Out-of-scope v2.14 → gated a v2.15+
- Asse `wiki` come target Graphify (Fase 3b wiki-as-graph): gated dalla PoC karpathy preservation (Fase 3a) con 4 check non-negoziabili — anche 1 check FAIL → NO-GO automatico (R.K1 invariante karpathy non comprimibile).

---

## [v2.13.0] — 2026-05-27

**Multi-adapter scaffolding + meta-prompt versionato nel repo**

### Added
- `PATTERN.md` §12 esteso in §12.0–§12.4: adapter registry `adapters/<name>/`, manifest format formale (schema YAML), 6 invarianti **R.A1–R.A6** (isolamento cartella, state condiviso, single-committer globale preservato, manifest immutabile a runtime, adapter aggiungibili a runtime, agent-agnostic preservato).
- Adapter registry: 5 adapter — `cursor/` (full), `aider/` (full), `openai/` (partial), `gemini/` (manifest-only), `chatgpt/` (manifest-only).
- Cartella `meta-prompts/` al root con versioni `v2-11/`, `v2-12/`, `v2-13/` (current) — replicabilità via raw GitHub URL.
- Skill `bootstrap-multiadapter-protocol` (6° skill bootstrap-*).
- Blocco `factory.config.yaml.adapters[]` (default backward-compat: `[{name: claude, folder: .claude, maturity: full}]`).
- Pubblicazione divulgativa `pubblicazioni/llm-wiki-factory-v213.md`.

### Changed
- `PATTERN.md` bumped 2.12 → 2.13.
- `README.md` ristrutturato con Setup multi-canale + tabella adapter + struttura cartelle aggiornata.

---

## [v2.12.0] — 2026-05-27

**Code Quality Review Layer + multi-repo + bootstrap skill-driven**

### Added
- **Code Quality Review Layer (CQRL)** — nuovo §19 `PATTERN.md`. Agent `code-reviewer` con 3 passate (idiomaticity / design / robustness), ruleset KB evolutivo (`canonical` / `emergent` / `team-specific`), skill `feedback-router` per handoff Reviewer→dev-agent, 7 invarianti **R.Q1–R.Q7**. Verdict `pass` / `conditional` / `reject`, loop bounded da `code_quality.max_iterations` (default 3).
- **Multi-repo** — §13 generalizzato a `code_paths` (lista) per FE/BE disaccoppiati, microservizi, micro-frontend, monorepo logico. TSK guadagna campo `target:` opzionale.
- **Coupling modes bootstrap** — §16 con 6 invarianti **R.B1–R.B6** (`monorepo` / `sibling-new-repo` / `submodule-new-repo`).
- **repo-sync adapter** — nuovo agent + skill `repo-extraction-protocol` (5 fasi) per estrarre specifiche da repo esistenti. Comando `/repo-sync`.
- Bootstrap skill-driven: meta-prompt `factory-bootstrap` rifattorizzato in thin orchestrator + 5 skill (`bootstrap-input-protocol`, `bootstrap-multirepo-protocol`, `bootstrap-scaffolding-protocol`, `bootstrap-vcs-protocol`, `bootstrap-validation-protocol`).
- Skill condivisa `stack-detector` (code-reviewer + repo-sync).
- Comando `/review`.

### Changed
- `PATTERN.md` bumped 2.11 → 2.12.
- §7 nuove regole **r.16** (CQRL reject ⇒ gate umano) + **r.17** (sync read-only verso la sorgente).
- §18.4 **R.S2** conflict detection esteso a `(target, code_path)`.
- `factory.config.yaml` schema esteso (`code_paths`, `code_quality`, `scheduler.domains.review`).

---

## [v2.11.0] — 2026-05-22

**Parallel scheduler DAG-driven**

### Added
- Nuovo §18 `PATTERN.md` «Parallel scheduling»: modello DAG `E_dep ∪ E_conf`, algoritmo 3-step (toposort + level grouping + graph-coloring partition per conflict detection su `code_path`), 8 domini (5 attivi default), 8 invarianti inviolabili **R.S1–R.S8** (single-committer preservato, conflict-free, cap fan-out, gate umano sopra threshold, ciclo=ABORT, idempotenza, no rollback collaterale, VCS sempre serializzato).
- Campi frontmatter opzionali §5: `depends_on` (EP/US/TSK), `blocked_by` esteso a TSK, `code_path` (TSK, glob L5).
- Blocco `factory.config.yaml.scheduler` con default sicuri (`enabled: true`, `max_parallel: 4`, `parallel_gate_threshold: 3`, `code_path_conflict: strict`, `empty_code_path_policy: serial`).
- Skill `parallel-scheduling` (5 fasi provider-agnostic). Concept `parallel-scheduler` + runbook `migration-v211`.

### Changed
- Orchestrator esteso con wave dispatch (multi-Agent nello stesso turno).
- `/run` esteso: wave dispatch parallelo se ≥ 2 candidati.
- Retrocompat totale dei frontmatter.

---

## [v2.10.0] — 2026-05-22

**Publisher adapters multi-target + github-publisher**

### Added
- Nuovo §17 `PATTERN.md` «Publisher adapters», simmetrico ai sync adapters §16. Ruolo **Publisher** pluralizzabile per provider (`github` / `gitlab` / `jira` / `linear` / `custom`).
- Verbo canonical `Publish` (§3). Campo `external_id:` opzionale su EP/US/TSK (§5). Regola §7 **r.15** (gate cross-tool).
- Blocco `factory.config.yaml.kanban_publish` (`provider`, `target`, `auth_env`, `mode: push-only`, `batch_limit`, `mapping`, `labels`, `filter`).
- Implementazione di riferimento: `github-publisher` via `gh` CLI.
- Skill provider-agnostic `publisher-protocol` (5 fasi) + skill provider-specific `github-mapping`.
- Comando `/kanban-publish [show|set|run|dry-run]`. Lint Check 4f.

---

## [v2.9.0] — 2026-05-22

**Sync adapters multi-sorgente + figma-sync**

### Added
- Nuovo §16 `PATTERN.md` «Sync adapters»: il ruolo Sync è generalizzato da single-source PDF a contratto pluralizzabile per sorgente.
- Sub-agents: `sync-docs` (PDF) + `figma-sync` (Figma via Anthropic API + Figma MCP).
- Nuovo shape L1 `.kb.json`, grammatica citazione JSON dotted-path (§6), lint Check 4e (coerenza manifest↔raw).
- Comando `/figma-sync <url|file_key>`.

---

## [v2.8.0] — 2026-05-20

**VCS integration esplicita**

### Added
- Nuovo §15 `PATTERN.md`: la relazione factory↔L5 è dichiarata in `factory.config.yaml.vcs` con `mode: monorepo | submodule | sibling | external | none`.
- Skill `vcs-handoff` (5 procedure per-mode), invocata da `dev-protocol` Fase 5.
- Sub-opzioni: `branch_strategy` (`shared` / `per-tsk` / `per-sprint`), `commit_coupling` (`pin` / `float`).
- File `.factory-lock` opzionale (`commit_coupling: pin`) per riproducibilità factory↔code.
- Regola §7 **r.14** (gate umano obbligatorio per scritture VCS distruttive o cross-repo).
- Lint check 4d (coerenza VCS). Terzo formato citazione codice: `[^src5-sub:`.

### Fixed
- Gap identificato in v2.7: `code_path` esterno era un path opaco senza coordinamento VCS. v2.8 lo formalizza con 5 modalità esplicite.

---

## [v2.7.0] — 2026-05-20

**Execution layer L5 + topology + dev-agents + stack modes**

### Added
- **Layer L5** (codice prodotto) opzionale, `code_path` configurabile (anche assoluto fuori dal repo).
- **6 topologie** esplicite (`knowledge-only` / `plan-only` / `full-stack-agents` / `hybrid-be-agents` / `hybrid-fe-agents` / `custom`) codificate dalla presenza file dev-agent in `.claude/agents/` + dichiarate in `factory.config.yaml`.
- **4 dev-agent** opzionali: `be-dev`, `fe-dev`, `db-dev`, `qa-dev`. Consumano TSK con `consumer: agent`, producono codice in `<code_path>/`.
- **3 stack mode** (`manual` / `guided` / `auto`). Skill `tech-scout` (WebSearch + human gate).
- Operazioni canoniche `Develop` (L4→L5) e `Tech-scout`.
- Comandi `/dev`, `/topology`. Skill `dev-protocol`, `dev-handoff`, `tech-scout`.
- Regola §7 **r.13** (topology+routing dichiarati e coerenti). Lint check 4c.

### Changed
- TSK frontmatter: `team` deprecato → `layer:` + `consumer:`.

---

## [v2.6.0] — 2026-05-20

**Gate L4 graduato + Propagate + auto-promotion**

### Added
- **Gate L4 graduato**: ogni question ha `blocking_level: hard | soft` (default `hard`). Q `soft` non blocca Arch/TPM, annota `pending_clarification: [Q_NNN]` su ADR/US.
- **Operazione canonica Propagate**: skill `propagate-resolution`. Quando `wiki-keeper` chiude un gap che cita Q risolta, appende marker `reconcile-needed` a `wiki/log.md` per le US dipendenti. Mai write su `management/kanban/**`.
- **Auto-promotion suggerita**: `state-scan` rileva concept page in `draft` citate da ≥ 2 US `committed`/`in-progress` e suggerisce `/promote review`. Solo suggerimento.

### Changed
- Lint check 4b esteso: `missing-blocking-level`, `stale-blocked-by`, `orphan-pending-clarification`.

---

## [v2.5.0] — 2026-05-19

**Parallel ingest (v2.4) + evaluator-optimizer heal loop (v2.5)**

### Added — v2.5 (heal loop)
- `wiki-lint` (evaluator) emette flag `heal-eligible` nel report frontmatter + sezione separata `## ERROR meccanici (heal-eligible)`. La regola «mai auto-fix» è preservata letteralmente.
- `wiki-keeper` (optimizer in heal mode) segue skill `heal-protocol` con closed whitelist: `broken-wikilink` (fuzzy ≥ 0.90), `missing-frontmatter-field` (derivable from path), `citation-section-mismatch` (edit-distance ≤ 3).
- Gate umano obbligatorio (STOP) prima di ogni iterazione. Max 3 iterazioni. Terminazione: `closed` / `stuck` / `regression` / `empty-diff` / `user-rejected` / `max-iterations`. Idempotente per costruzione.
- Comando `/heal`.

### Added — v2.4 (parallel ingest)
- `ingest-protocol` esteso a 6 fasi, branch parallel/serial su `N ≥ 3`.
- Sub-agent `wiki-keeper-worker` (thin, read-only, JSON output).

### Changed
- Single-committer invariant su `wiki/` preservato (Heal è l'Analyst in heal mode).
- §7 r.12 + §10.2: «write-restricted» → «single-committer».

---

## [v2.3.0] — 2026-05-19

**Thin agents, fat skills**

### Added
- 6 nuove skill canonical: `citation-rules`, `wiki-log-entry`, `wiki-gap-protocol` (read-only references); `promote-status`, `state-scan`, `query-protocol` (procedural playbooks estratti dagli agent).

### Changed
- 7 skill esistenti slimmed a riferire le canonical.
- 7 agent slimmed a identità + scope + trigger + skill refs.
- Totale: 7 → 13 skill; stessi agent ma molto più focalizzati.
- `PATTERN.md` bumped 2.2 → 2.3 con «principio di taglio adapter».
- **Zero duplicazione procedurale** tra agent e skill.

---

## [v2.2.0] — 2026-05-18

**LLM-trust regime + memory tree (−97% mass)**

> Migrazione **breaking** dal contratto deterministico v1.x al pattern agent-agnostic v2.x.

### Added
- `PATTERN.md` (~130 righe) — contratto universale agent-agnostic.
- `memory/{episodic,semantic,procedural}/` — persistenza cross-conversazione.
- `management/{kanban/, roadmap.md, questions.md}` — L3 governance.
- `design_&_architecture/{api_specs/, db_schemas/, decisions/, risks.md}` — L4.
- `wiki/runbooks/migration-v22.md` con rationale e rollback.

### Changed
- 8 agent (~30 righe ciascuno), 7 skill (~50 righe ciascuna), 5 comandi — tutti in stile v2.2.
- Le citazioni e gli write scope sono ora surfaceizzati retroattivamente da `wiki-lint`, non bloccati deterministicamente da bash hook.

### Removed
- `.claude/hooks/` (9 script bash/python) + `.claude/scripts/` (`gate.sh`, `emit_marker.sh`).
- `schemas/` (11 JSON Schemas) + `requirements.txt`.
- `wiki-staging/` (dopo promozione di 2 concept page a `wiki/concepts/`).
- 5 agent: `indexer`, `renderer`, `verifier-extraction`, `verifier-grounding`, `verifier-task-atomicity`.
- 8 skill obsolete (sostituite da 7 skill v2.2).
- 3 comandi obsoleti (`audit`, `close-sprint`, `ingest`).
- `AGENTS.md` (525 righe) + `constitution.md` (377 righe) — fusi in `PATTERN.md`.
- `project_manifest.json`, `dashboard/`, `inbox/`, `docs/`, `variants/`.
- Totale: **~5.500 righe rimosse**.

### Migration
- Rollback storico: il tag `pre-v22-migration-2026-05-18` esisteva sul commit `ab9b8e1` ed è stato rimosso al cleanup dei tag (storia raggiungibile via SHA).

---

[v2.33.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.32.1...v2.33.0
[v2.13.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.12.0...v2.13.0
[v2.12.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.11.0...v2.12.0
[v2.11.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.10.0...v2.11.0
[v2.10.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.9.0...v2.10.0
[v2.9.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.8.0...v2.9.0
[v2.8.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.7.0...v2.8.0
[v2.7.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.6.0...v2.7.0
[v2.6.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.5.0...v2.6.0
[v2.5.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.3.0...v2.5.0
[v2.3.0]: https://github.com/soli92/soli-multi-agents-factory/compare/v2.2.0...v2.3.0
[v2.2.0]: https://github.com/soli92/soli-multi-agents-factory/releases/tag/v2.2.0
