# Factory Bootstrap — versioni recenti (v2-34..v2-40)

**Ambito**: foglia di dettaglio per il dispatcher `.claude/commands/factory-bootstrap.md`.
Contiene i case di risoluzione versione per v2-40 (corrente) fino a v2-34.
Viene letta obbligatoriamente quando `--version` cade nel range v2-40..v2-34.

---

- **`--version=v2-40` (DEFAULT)** → carica il seed v2.40 (EP-059 Backport delta v2.40 da
  portale-servizi-factory; **delta seed** che estende v2-39; nuovi agenti: `release-manager`
  (coordina ciclo vita release: pianificazione → gate → tag); nuove skill: `tpm-reconcile`
  (riconciliazione periodica kanban vs esecuzione reale; sola lettura; output report in-chat
  anomalie + raccomandazioni), `deep-functional-probe` (probe funzionale avanzato per scenari
  complessi; opt-in `fe_correctness.functional_oracle.enabled: true`; output PASS/FAIL + evidence),
  `release-protocol` (4 fasi: preparazione → validazione gate → [GATE UMANO] tag VCS →
  post-release; gate umano non bypassabile pre-tag; skill primaria di release-manager);
  nuovo tool `tools/analytics/statusline-ledger.py` (output 1 riga `◉ TOKENS  in: Xk  out: Yk
  cost: $Z`; `--json` machine-readable; degrada gracefully); pattern_version "2.39"→"2.40";
  25 TSK WaveA+WaveB (TSK-507..531); backward compat totale v2.39; gate v2.40.0 PASS 2026-09-02) →
  leggi `meta-prompts/v2-40/factory-bootstrap.md`
  ⚠️ `extends: v2-39`, risolvi la catena `v2-40 → v2-39 → v2-38 → … → v2-15 → (Fase 2/5 da v2-12)`.
- **`--version=v2-39`** → carica il seed v2.39 (Ponytail Decision Ladder EP-057/057.1 +
  Factory-as-MCP-Server EP-058; **delta seed** che estende v2-38; Filone A: YAGNI gate 7 livelli
  opt-in — config `ponytail:` + Lint Check 4ao + Pass 4 advisory in code-review-protocol +
  `/ponytail-review`/`/ponytail-audit`/`/ponytail-gain` + invariante R.PY1 + concetti decision-ladder/ponytail;
  Filone B: adapter MCP read-only opt-in — `adapters/mcp/` + config `mcp_server:` (resources wiki/kanban/config,
  tools query_wiki/get_task/lint_status, pin mcp==1.3.0) + invariante R.MCP1 no-write + Check 4am.mcp;
  4 sprint 58-60; backward compat totale v2.38; gate v2.39.0 CONDITIONAL accettato 2026-08-28) →
  leggi `meta-prompts/v2-39/factory-bootstrap.md`
  ⚠️ `extends: v2-38`, risolvi la catena `v2-39 → v2-38 → v2-37 → … → v2-15 → (Fase 2/5 da v2-12)`.
- **`--version=v2-38`** → carica il seed v2.38 (Integrazione llm_wiki
  TR-llmwiki-20260824, pattern-stealing concettuale GPL v3; **delta seed** che estende v2-37;
  EP-055 Semantic Purpose Layer (`wiki/purpose.md` + PATTERN §34 + lint Check 4an) + EP-056
  Wiki Keeper 2.0 (CoT handoff Fase 1.ter + sweep-reviews `/sweep-reviews` + PATTERN §35) +
  PATTERN §23.10 policy licenze terze parti; 8 TSK, sprint 56+57; backward compat totale v2.37;
  gate v2.38.0 BYPASS 2026-08-24, SLA ≥3 RUN-REPORT entro v2.39) →
  leggi `meta-prompts/v2-38/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-37`, l'agente DEVE risolvere la catena
  `v2-38 → v2-37 → v2-36 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-37`** → carica il seed v2.37 (Code Intelligence Stack EP-054; **delta seed**
  che estende v2-36; navigazione codice local-first a 3 layer opt-in — L1 ctags symbol resolver +
  L2 tree-sitter/nomic-embed/LanceDB semantic search (`/code-search`) + L3 graphify impact graph
  (dev-protocol Fase 0.bis); config `code_intelligence:` default off; PATTERN §33; R.CI1..R.CI5;
  zero SaaS; 13 TSK, sprint 54; backward compat totale v2.36; gate v2.37.0 PASS 2026-08-04) →
  leggi `meta-prompts/v2-37/factory-bootstrap.md`
  ⚠️ `extends: v2-36`, risolvi la catena `v2-37 → v2-36 → … → v2-15 → (Fase 2/5 da v2-12)`.
- **`--version=v2-36`** → carica il seed v2.36 (Backport portale-servizi-factory
  EP-053; **delta seed** che estende v2-35; 5 pattern: R.21 cooperative locking 7 agenti +
  skill /onboarding + vcs-preflight step 2-bis + PATTERN §23.9 ai_attribution_policy +
  dev-protocol checkpoint analysis-only; 8 TSK, sprint 53; backward compat totale v2.35;
  gate v2.36.0 PASS 2026-07-30) →
  leggi `meta-prompts/v2-36/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-35`, l'agente DEVE risolvere la catena
  `v2-36 → v2-35 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-35`** → carica il seed v2.35 (Bus Factor Mitigation EP-051
  gate formale sprint 52; **delta seed** che estende v2-34; nessun file nuovo rispetto a v2-34;
  pattern_version bump "2.34"→"2.35"; soli-boy factory derivata pubblica 176 TSK done confermata;
  PATTERN §23.8 sunset policy + sunset_date annotations 6 SUNSET v2.38 + 2 EXEMPT;
  guida onboarding secondo maintainer; 6 TSK; backward compat totale v2.34; gate v2.35.0 PASS
  2026-07-21) →
  leggi `meta-prompts/v2-35/factory-bootstrap.md`
- **`--version=v2-34`** → carica il seed v2.34 (Governance Enforcement EP-049 +
  Adoption Onboarding EP-050 + Bus Factor Mitigation EP-051 + Tech Debt Cleanup EP-052;
  **delta seed** che estende v2-33; QUICKSTART.md + factory-config-dag.md YAML DAG 45 flag +
  schemas/factory.config.schema.json 16 regole cross-flag + factory.starter.config.yaml
  5 capability core; lint-checks.md modulare 9 famiglie; pattern_version SSOT + Check 4am;
  CQRL router layer_filter [be,fe,db,qa]; PATTERN §23.8 sunset policy; 37 TSK; backward compat
  totale v2.33; gate v2.34.0 PASS 2026-07-21) →
  leggi `meta-prompts/v2-34/factory-bootstrap.md`
  ⚠️ Essendo un **delta seed** con `extends: v2-33`, l'agente DEVE risolvere la catena
  `v2-34 → v2-33 → … → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
