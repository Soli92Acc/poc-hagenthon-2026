---
description: Scaffolda una nuova Agentic Factory llm-wiki++. Dispatcher thin → v2.39 (corrente, Ponytail Decision Ladder EP-057/057.1 + Factory-as-MCP-Server EP-058: YAGNI gate 7 livelli opt-in (config ponytail: + Lint Check 4ao + Pass 4 advisory + /ponytail-review/audit/gain + R.PY1) + adapter MCP read-only opt-in (adapters/mcp/ + config mcp_server: + R.MCP1 no-write + Check 4am.mcp + pin mcp==1.3.0); 4 sprint 58-60; backward compat totale v2.38; gate v2.39.0 CONDITIONAL accettato 2026-08-28) | v2.38 (previous, Integrazione llm_wiki TR-llmwiki-20260824 pattern-stealing concettuale GPL v3: EP-055 Semantic Purpose Layer wiki/purpose.md + PATTERN §34 + lint 4an + EP-056 Wiki Keeper 2.0 CoT handoff Fase 1.ter + sweep-reviews /sweep-reviews + PATTERN §35 + §23.10 policy licenze terze parti; 8 TSK, sprint 56+57; backward compat totale v2.37; gate v2.38.0 BYPASS 2026-08-24 SLA v2.39) | v2.37 (previous, Code Intelligence Stack EP-054: navigazione codice local-first 3 layer opt-in — L1 ctags + L2 tree-sitter/nomic-embed/LanceDB /code-search + L3 graphify impact dev-protocol Fase 0.bis; config code_intelligence default off; PATTERN §33; zero SaaS; 13 TSK, sprint 54; backward compat totale v2.36; gate v2.37.0 PASS 2026-08-04) | v2.36 (previous, Backport portale-servizi-factory EP-053: R.21 cooperative locking 7 agenti + skill /onboarding + vcs-preflight step 2-bis + PATTERN §23.9 ai_attribution_policy + dev-protocol checkpoint; 8 TSK, sprint 53; backward compat totale v2.35; gate v2.36.0 PASS 2026-07-30) | v2.35 (previous, Bus Factor Mitigation EP-051 gate formale sprint 52: soli-boy factory derivata pubblica 176 TSK done + PATTERN §23.8 sunset policy + sunset_date annotations + guida onboarding secondo maintainer; 6 TSK; backward compat totale v2.34; gate v2.35.0 PASS 2026-07-21) | v2.34 (previous, Governance Enforcement EP-049 + Adoption Onboarding EP-050 + Bus Factor Mitigation EP-051 + Tech Debt Cleanup EP-052: QUICKSTART.md + factory-config-dag.md + JSON schema + starter config + lint-checks modulare 9 famiglie + pattern_version SSOT + CQRL router layer_filter + PATTERN §23.8 sunset policy; 37 TSK; backward compat totale v2.33; gate v2.34.0 PASS 2026-07-21) | v2.33 (previous, Content Share Consumer Layer EP-048: skill content-share-protocol + comando /share + R.CS1..R.CS4 + config content_share:; dispatch fire-and-forget verso soli-frames; gate umano R.CS3; backward compat totale v2.32) | v2.32 (previous, Capability Formativa EP-045 + Voice Hardening EP-046: agente tutor MVP con Student Model + retrieval practice + curriculum YAML; 7 contratti FSM voice hardening C1..C7; backward compat totale v2.31) | v2.31 (previous, Voice Handsfree EP-044: VAD debounce configurabile, wake word filter threshold, file pipe adapter con polling, PID path configurabile; include anche EP-041 Voice Channel, EP-042 Hybrid Wiki Search, EP-043 Temporal Estimate Protocol) | v2-31-full (variante consolidata self-contained v2.31: intera catena v2.15→v2.31 in un unico file, NO extends) | v2.27 (previous, Tavola Rotonda Mode EP-039: modalità multi-agente collaborativa opt-in, 5 fasi Setup→Posizioni→Confronto→Convergenza→Sintesi, blackboard single-writer, Critico obbligatorio, budget guardrail, registro decisioni wiki/decisions/) | v2-27-full (variante consolidata self-contained v2.27: intera catena v2.15→v2.27 in un unico file, NO extends) | v2.26 (previous, Prototype Generation Layer EP-035: cascata adattiva figma→penpot→react→html, fallback html garantito INV-1, backend-resolver + /prototype + /prototype-status, opt-in) | v2-26-full (variante consolidata self-contained v2.26: intera catena v2.15→v2.26 in un unico file, NO extends) | v2.25 (previous, VCS Branch Awareness Layer EP-034: branch-resolver + /vcs-status + gate dev-protocol Fase 0 + drift check vcs-handoff, opt-in per multi-repo/submodule) | v2.24 (Runtime Contextual Suggestions EP-033: Fase 6 orchestrator + dev-handoff post-exec + suggest-next.py hook) | v2.23 (Semantic Drift Detection EP-031 research sprint) | v2-23-full (variante consolidata self-contained v2.23: intera catena v2.15→v2.23 in un unico file, NO extends) | v2.21 (Design Intelligence Layer EP-019 + Token Ledger EP-022 opt-in) | v2-21-full (variante consolidata self-contained v2.21) | v2.20 (FE Functional Oracle EP-018 opt-in) | v2.19 (Hardening & Sustainability EP-012..017) | v2.18 (A11y + UX/UI Integration opt-in) | v2-18-full (variante consolidata self-contained v2.18) | v2.17 (FE Visual Oracle Integration opt-in) | v2.16 (Premortem Integration opt-in) | v2.15 (consolidation release del Compression Layer) | v2.14 (compression layer first introduction) | v2.13 (multi-adapter) | v2.12 (legacy, single-adapter) | v2.11 (snapshot storico).
argument-hint: [nome-progetto] [path-destinazione] [--version=v2-42|v2-41|v2-40|v2-39|v2-38|v2-37|v2-36|v2-35|v2-34|v2-33|v2-32|v2-31|v2-31-full|v2-27|v2-27-full|v2-26|v2-26-full|v2-25|v2-25-full|v2-24|v2-23|v2-23-full|v2-21|v2-21-full|v2-20|v2-19|v2-18|v2-18-full|v2-17|v2-16|v2-15|v2-14|v2-13|v2-12|v2-11]
allowed-tools: Read, Write, Edit, Bash, Glob, TodoWrite, WebSearch, WebFetch
---

# Factory Bootstrap — dispatcher

> **Sede e installazione.** Questo file è la **source-of-truth versionata** del dispatcher,
> co-locato con tutti gli altri comandi dell'adapter Claude Code in `.claude/commands/`.
> Per usarlo come slash command Claude Code va **installato user-level** copiandolo in
> `~/.claude/commands/factory-bootstrap.md`:
> ```bash
> cp <your-clone>/.claude/commands/factory-bootstrap.md ~/.claude/commands/factory-bootstrap.md
> ```
> A differenza degli altri comandi dell'adapter, il dispatcher **non** viene scaffoldato
> nelle factory derivate (non è nella lista curata di Fase 4.c del seed): è un meta-comando
> che *crea* factory, non uno che vive *dentro* una factory.
>
> **Nota Opzione B (Wave D #2 refactor):** le foglie di dettaglio di questo dispatcher vivono
> **in-repo** in `.claude/commands/references/factory-bootstrap/`. Il dispatcher richiede
> pertanto di essere invocato dall'interno del clone del meta-framework `soli-multi-agents-factory`.
> Se le foglie non vengono trovate, i trigger fail-closed sottostanti riporteranno istruzioni.

Argomenti utente: `$ARGUMENTS`

## Risoluzione versione

Parse `$ARGUMENTS` cercando `--version=<X>`.

Versioni disponibili: `v2-42` (default), `v2-41`, `v2-40`, `v2-39`, `v2-38`, `v2-37`, `v2-36`, `v2-35`, `v2-34`,
`v2-33`, `v2-32`, `v2-31`, `v2-31-full`, `v2-27`, `v2-27-full`, `v2-26`, `v2-26-full`,
`v2-25`, `v2-25-full`, `v2-24`, `v2-23`, `v2-23-full`, `v2-21`, `v2-21-full`, `v2-20`,
`v2-19`, `v2-18`, `v2-18-full`, `v2-17`, `v2-16`, `v2-15`, `v2-14`, `v2-13`, `v2-12`, `v2-11`.

**Versione inesistente** (`--version=<X>` non in lista): STOP fail-loud — niente silent fallback:

```
ERROR: versione '<X>' non supportata. Versioni disponibili: v2-42 (default), v2-41, v2-40, v2-39, v2-38, v2-37,
v2-36, v2-35, v2-34, v2-33, v2-32, v2-31, v2-31-full, v2-27, v2-27-full, v2-26, v2-26-full,
v2-25, v2-25-full, v2-24, v2-23, v2-23-full, v2-21, v2-21-full, v2-20, v2-19, v2-18, v2-18-full,
v2-17, v2-16, v2-15, v2-14, v2-13, v2-12, v2-11.
```

Prima di espandere la versione selezionata, determinare la foglia in base a `--version`:

- **v2-42..v2-34** → leggi obbligatoriamente
  `.claude/commands/references/factory-bootstrap/versions-recent.md`;
  se il file manca, STOP:
  ```
  STOP: Foglia versions-recent.md non trovata. Sei sicuro di invocare /factory-bootstrap
  dal clone del meta-framework soli-multi-agents-factory? Le foglie sono in-repo (Opzione B).
  ```

- **v2-33..v2-23** (incluse varianti `-full`) → leggi obbligatoriamente
  `.claude/commands/references/factory-bootstrap/versions-mid.md`;
  se il file manca, STOP identico (con nome foglia `versions-mid.md`).

- **v2-21..v2-11** (incluse varianti `-full`) → leggi obbligatoriamente
  `.claude/commands/references/factory-bootstrap/versions-legacy.md`;
  se il file manca, STOP identico (con nome foglia `versions-legacy.md`).

Il resto degli argomenti (`[nome-progetto] [path-destinazione]`) viene passato verbatim alla versione scelta.

## Risoluzione source del seed

Il seed v2.13+ vive **nel repo meta-framework** (`<repo>/meta-prompts/v2-XX/`).

**Method A — Local clone (preferito)**: se hai clonato il meta-framework localmente,
il seed è in:
```
<your-clone>/meta-prompts/v2-42/factory-bootstrap.md        # DEFAULT corrente (delta seed)
<your-clone>/meta-prompts/v2-39/factory-bootstrap.md        # previous (delta seed)
<your-clone>/meta-prompts/v2-31/factory-bootstrap-full.md   # consigliata uso offline v2.31 (self-contained)
<your-clone>/meta-prompts/v2-27/factory-bootstrap-full.md   # consigliata uso offline v2.27 (self-contained)
<your-clone>/meta-prompts/v2-23/factory-bootstrap-full.md   # consigliata uso offline v2.23 (self-contained)
<your-clone>/meta-prompts/v2-21/factory-bootstrap-full.md   # consigliata uso offline v2.21 (self-contained)
<your-clone>/meta-prompts/v2-18/factory-bootstrap-full.md   # consigliata uso offline v2.18 (self-contained)
```
Lista completa: ogni versione ha la propria directory in `meta-prompts/`.

**Method B — GitHub raw URL** (sempre fresco):
```
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-42/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-39/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-38/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-37/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-36/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-35/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-34/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-33/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-32/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-31/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-31/factory-bootstrap-full.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-27/factory-bootstrap-full.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-26/factory-bootstrap-full.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-25/factory-bootstrap-full.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-24/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-23/factory-bootstrap-full.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-21/factory-bootstrap-full.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-20/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-19/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-18/factory-bootstrap-full.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-17/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-16/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/v2-15/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/archive/v2-14/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/archive/v2-13/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/archive/v2-12/factory-bootstrap.md
https://raw.githubusercontent.com/soli92/soli-multi-agents-factory/main/meta-prompts/archive/v2-11/factory-bootstrap.md
```

**Method C — Local cache legacy** (solo pre-v2.13, deprecato): `~/.claude/factory-bootstrap/v2-XX/`
conteneva i seed user-level **fino a v2-12**. Da v2.13 in poi i seed vivono **solo nel repo**
(`meta-prompts/`, Method A/B): questa cache NON contiene v2-13+ e va usata esclusivamente come
fallback offline per le versioni storiche v2-11/v2-12. Per le versioni correnti usa Method A o B.

## Versione corrente: v2.40 (EP-059 Backport delta v2.40 da portale-servizi-factory)

Seed corrente: `meta-prompts/v2-42/factory-bootstrap.md`; **delta seed** che estende v2-39;
gate v2.40.0 PASS 2026-09-02; backward compat totale v2.39.

Per il changelog completo della versione corrente e di tutte le versioni precedenti,
leggi obbligatoriamente `.claude/commands/references/factory-bootstrap/changelog-corrente.md`;
se il file manca, STOP: "Foglia changelog-corrente.md non trovata. Sei sicuro di invocare
/factory-bootstrap dal clone del meta-framework soli-multi-agents-factory?"

## Esecuzione

**Read** il file della versione risolta (via Method A/B/C) e seguilo letteralmente.
Il seed è auto-contenuto: include riferimenti a PATTERN.md (fetched), agli adapter
manifests, e ai template di reference.

## Cronologia versioni

| Versione | Data | Cambiamenti principali |
|---|---|---|
| **v2.40 (corrente)** | 2026-09-02 | **EP-059 Backport delta v2.40 da portale-servizi-factory**: agente `release-manager` + skill `tpm-reconcile` + `deep-functional-probe` + `release-protocol` + `tools/analytics/statusline-ledger.py`; 25 TSK (WaveA TSK-507..526 + WaveB TSK-527..531). Backward compat totale v2.39. Gate v2.40.0 PASS. |
| v2.39 | 2026-08-28 | **Ponytail Decision Ladder + Factory-as-MCP-Server** (EP-057/057.1 + EP-058): YAGNI gate 7 livelli opt-in (config `ponytail:` + Lint Check 4ao + Pass 4 advisory + `/ponytail-review/audit/gain` + R.PY1) + adapter MCP read-only opt-in (`adapters/mcp/` + config `mcp_server:` + R.MCP1 + Check 4am.mcp). Gate v2.39.0 CONDITIONAL accettato 2026-08-28. |
| v2.38 | 2026-08-24 | **Integrazione llm_wiki** (TR-llmwiki-20260824, GPL v3 pattern-stealing): EP-055 Semantic Purpose Layer (`wiki/purpose.md` + PATTERN §34 + lint 4an) + EP-056 Wiki Keeper 2.0 (CoT handoff Fase 1.ter + sweep-reviews + PATTERN §35) + §23.10 policy licenze terze parti. Gate v2.38.0 BYPASS 2026-08-24 SLA v2.39. |
| v2.37 | 2026-08-04 | **Code Intelligence Stack** (EP-054, PATTERN §33, opt-in): L1 ctags + L2 tree-sitter/nomic-embed/LanceDB (`/code-search`) + L3 graphify impact graph (dev-protocol Fase 0.bis). Config `code_intelligence:` default off. 13 TSK, sprint 54. Gate v2.37.0 PASS. |
| v2.36 | 2026-07-30 | **Backport portale-servizi-factory** (EP-053): R.21 cooperative locking 7 agenti + skill `/onboarding` + vcs-preflight step 2-bis + PATTERN §23.9 ai_attribution_policy + dev-protocol checkpoint. 8 TSK. Gate v2.36.0 PASS. |
| v2.35 | 2026-07-21 | **Bus Factor Mitigation** (EP-051 gate formale): soli-boy factory derivata pubblica 176 TSK + PATTERN §23.8 sunset policy + sunset_date annotations + guida onboarding secondo maintainer. 6 TSK. Gate v2.35.0 PASS. |
| v2.34 | 2026-07-21 | **Governance + Onboarding + Tech Debt** (EP-049..052): QUICKSTART.md + factory-config-dag.md YAML DAG 45 flag + JSON schema 16 regole + starter config; lint-checks modulare 9 famiglie; CQRL router layer_filter; PATTERN §23.8. 37 TSK. Gate v2.34.0 PASS. |
| v2.33 | 2026-07-17 | **Content Share Consumer Layer** (EP-048): skill `content-share-protocol` + comando `/share` + R.CS1..R.CS4 + config `content_share:`; dispatch fire-and-forget verso soli-frames; gate umano R.CS3. Gate v2.33.0 PASS. |
| v2.32 | 2026-07-10 | **Capability Formativa + Voice Hardening** (EP-045 + EP-046). Estende v2-31. EP-046: 7 contratti FSM voice hardening (C1..C7); ADR-EP046-001 GO. EP-045: tutoring adattivo MVP (agente `tutor.md` + 4 skill + `tools/tutor/` 11 moduli, 35 test); Student Model SM-2; curriculum YAML. Backward compat totale v2.31. Gate v2.32.0 PASS 2026-07-10. |
| v2.31 | 2026-07-09 | **Voice Handsfree Improvements** (EP-044, PATTERN §30). Estende v2-30. VAD debounce configurabile + wake word threshold + file pipe adapter polling + PID path + blocklist anti-allucinazione STT. Include EP-041/EP-042/EP-043. Gate v2.31.0 PASS. |
| v2.30 | 2026-07-09 | **Temporal Generative Time Model** (EP-043, PATTERN §3+§18). Skill `temporal-estimate-protocol` + `/sprint-progress` (burndown sprint). Config `temporal.estimate_protocol:` + `analytics.sprint_progress:`. Gate v2.30.0 PASS. |
| v2.29 | 2026-07-08 | **Hybrid Wiki Search Layer** (EP-042, PATTERN §31). Ricerca semantica ibrida vector+FTS+RRF su `wiki/`. LanceDB + sentence-transformers. Skill `wiki-search-protocol` + `/wiki-search`. Config `wiki_search:`. Gate v2.29.0 PASS. |
| v2.28 | 2026-07-08 | **Voice Channel Layer** (EP-041, PATTERN §30). Modulo Python `voice/` esterno. STT Faster-Whisper + TTS Piper + VAD Silero + AEC. State machine 5 stati. Config `voice_channel:`. Gate v2.28.0 PASS. |
| v2.27 | 2026-07-06 | **Tavola Rotonda Mode** (EP-039, PATTERN §28). Modalità multi-agente collaborativa opt-in. Agente `tavola-rotonda-moderatore` (5 fasi) + skill `tavola-rotonda-protocol` (R.TR1-R.TR8) + `/tavola-rotonda`. Config `tavola_rotonda.enabled: false`. **Variante `v2-27-full`**: catena `extends` (v2.15→v2.27) consolidata in unico file self-contained. Gate v2.27.0 PASS. |
| v2.26 | 2026-07-02 | **Prototype Generation Layer** (EP-035, PATTERN §27). Cascata adattiva figma→penpot→react→html (INV-1 fallback html). Skills + agente `prototype-generator` + `/prototype`. Config `prototyping:`. ADR-EP035-001..006 GO. Gate v2.26.0 PASS. **Variante `v2-26-full`** self-contained. |
| v2.25 | 2026-07-02 | **VCS Branch Awareness Layer** (EP-034, opt-in). declare→inspect→align per multi-repo/submodule. `branch-resolver` + `vcs-preflight-protocol` + `/vcs-status`. Config `vcs.branch_awareness` off. R.B7-R.B10. Gate v2.25.0 PASS. **Variante `v2-25-full`** self-contained. |
| v2.24 | 2026-06-26 | **Runtime Contextual Suggestions** (EP-033). TRE artefatti push-based: Fase 6 orchestrator.md + dev-handoff.md sezione post-exec + suggest-next.py + hook Stop. Backward compat totale. Gate v2.24.0 PASS. |
| v2.23 | 2026-06-25 | **Semantic Drift Detection** (EP-031, research sprint). Piramide L1 staleness (Check 4ag, always-on) + L2 LLM-judge + L3 embedding coseno (opt-in). Config `wiki_lint.semantic_check:`. Gate v2.23.0 PASS. **Variante `v2-23-full`** self-contained. |
| v2.21 | 2026-06-15 | **Design Intelligence Layer + Token Ledger** (EP-019 + EP-022, opt-in). Art-director DSL + Critic/Judge + Intention Economy (PATTERN §24; ADR-068..071) + Token Ledger inline (`show-session-tokens.py`). Default entrambi `false`. Gate v2.21.0 PASS. **Variante `v2-21-full`** self-contained. |
| v2.20 | 2026-06-10 | **FE Functional Oracle** (EP-018, opt-in). Skill `functional-oracle-protocol` + `interaction-drive-protocol` + `/functional-oracle` + schema `acceptance-spec`. ADR-065/066/067. |
| v2.19 | 2026-06-09 | **Hardening & Sustainability** (EP-012..017). EP-013 Analytics Dogfooding opt-in + fix ux_ui anti-fabbricazione ADR-063. §22/§23 governance META. |
| v2.18 | 2026-06-04 | **A11y + UX/UI Integration** opt-in. Fase 1.sexies opt-in (`a11y` + `ux_ui`); no-op a flag spento. 7 ADR risolti. **Variante `v2-18-full`** self-contained. |
| v2.17 | 2026-06-03 | **FE Visual Oracle Integration** opt-in. Fase 1.quinquies opt-in (`visual-oracle-protocol` + `/visual-oracle` + `fe_correctness`). |
| v2.16 | 2026-06-01 | **Premortem Integration** opt-in. Fase 1.quater opt-in (`premortem-protocol` + `/premortem`). |
| v2.15 | 2026-05-29 | **Consolidation release** del Compression Layer v2.14. Gate Fase 1.5 + 3a riformulati come opt-in deferred. |
| v2.14 | 2026-05-28 | **Compression Layer a due assi opt-in** (§20): Output via Caveman (R.C1-R.C6) + Context via Graphify (R.G1-R.G6). 4° sync adapter `graphify-sync`. |
| v2.13 | 2026-05-27 | Multi-adapter scaffolding parallelo (§12 esteso). Registry + 5 adapter + R.A1-R.A6. |
| v2.12 | 2026-05-27 | CQRL (§19) + multi-repo `code_paths` (§13) + coupling modes R.B1-R.B6 + existing-repo wiki feeding. |
| v2.11 | 2026-05-26 | Parallel scheduler DAG-driven (§18). |
| v2.10 | 2026-05-25 | Publisher adapters (§17). |
| v2.9 | 2026-05-21 | Sync adapters multi-sorgente — figma-sync (§16). |
| v2.8 | precedente | VCS integration (§15). |
| v2.7 | precedente | Execution layer L5, dev-agent opzionali, topology esplicite. |

Per il diff completo + statistiche evolutive vedi
[`meta-prompts/README.md`](../../meta-prompts/README.md).
