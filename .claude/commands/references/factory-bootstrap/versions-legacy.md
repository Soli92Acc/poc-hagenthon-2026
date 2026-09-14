# Factory Bootstrap — versioni legacy (v2-11..v2-21)

**Ambito**: foglia di dettaglio per il dispatcher `.claude/commands/factory-bootstrap.md`.
Contiene i case di risoluzione versione per v2-21 fino a v2-11 (incluse varianti `-full`).
Viene letta obbligatoriamente quando `--version` cade nel range v2-21..v2-11.

---

- **`--version=v2-21`** → carica il seed v2.21 (Design Intelligence Layer EP-019 + Token Ledger EP-022;
  **delta seed** che estende v2-20; DUE capability opt-in derivabili — EP-019 Design Intelligence Layer
  (art-director DSL + LLM-Generator Separation + Critic/Judge + Intention Economy; skills
  `art-director-protocol`, `design-spec-dsl`, `critic-judge-protocol`, `design-intelligence-protocol`,
  `llm-generator-separation-protocol`; PATTERN §24; ADR-068..071) e EP-022 Token Ledger (visibilità
  token reali inline, script `show-session-tokens.py` + hook Stop); default
  `design_intelligence.enabled: false` / `analytics.token_ledger.enabled: false` → factory identica
  a v2.20; nessuna nuova invariante §7 (restano 18)).
  ⚠️ Essendo un **delta seed** con `extends: v2-20`, l'agente DEVE risolvere la catena
  `v2-21 → v2-20 → v2-19 → v2-18 → v2-17 → v2-16 → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
  **Alternativa consigliata per uso offline/collega**: usa `--version=v2-21-full` (nessun extends, unico file).
- **`--version=v2-21-full`** → carica `meta-prompts/v2-21/factory-bootstrap-full.md`, la
  **variante consolidata self-contained v2.21**: identica funzionalmente a v2.21 ma con l'intera
  catena `extends` (v2-21 + v2-20 + v2-19 + v2-18 + v2-17 + v2-16 + v2-15) **inlinata in un
  unico file** (1423 righe, nessun `extends:` da risolvere, nessun seed padre da fetchare). Consigliata
  quando l'agente non risolve in automatico la catena `extends:`. Resta necessario il fetch dei
  template di contenuto (PATTERN.md, file `.claude/*`, manifest adapter) in Fase 3.
- **`--version=v2-20`** → carica il seed v2.20 (FE Functional Oracle EP-018;
  **delta seed** che estende v2-19; unica capability di prodotto derivabile = EP-018 FE
  Functional Oracle opt-in — skill `functional-oracle-protocol` + `interaction-drive-protocol`
  + comando `/functional-oracle` + schema `acceptance-spec` + dominio scheduler
  `functional-oracle`; default `fe_correctness.functional_oracle.enabled: false` → factory
  identica a v2.19; nessuna nuova invariante §7).
  ⚠️ Essendo un **delta seed** con `extends: v2-19`, l'agente DEVE risolvere la catena
  `v2-20 → v2-19 → v2-18 → v2-17 → v2-16 → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-19`** → carica il seed v2.19 (Hardening & Sustainability;
  **delta seed** che estende v2-18; unico delta derivabile = EP-013 Analytics Dogfooding
  opt-in + fix ux_ui anti-fabbricazione ADR-063; §22/§23 governance META non scaffoldata in
  factory derivate; nessuna nuova invariante §7).
  ⚠️ Essendo un **delta seed** con `extends: v2-18`, l'agente DEVE risolvere la catena
  `v2-19 → v2-18 → v2-17 → v2-16 → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre.
- **`--version=v2-18`** → carica il seed v2.18 (A11y + UX/UI Integration
  opt-in; **delta seed** che estende v2-17 con la Fase 1.sexies opt-in — capability `a11y`
  (accessibility testing WCAG 2.2 AA via tool `run_a11y_scan` + skill
  `accessibility-testing-protocol` + agente `a11y-specialist`) e `ux_ui` (UX/UI Review &
  Design via skill `ux-ui-review-protocol` + `ux-ui-design-protocol` + agenti
  `ux-ui-reviewer` + `ui-designer`); tutte le integrazioni no-op a flag spento).
  ⚠️ Essendo un **delta seed** con `extends: v2-17`, l'agente DEVE risolvere la catena
  `v2-18 → v2-17 → v2-16 → v2-15 → (Fase 2/5 da v2-12)` fetchando ogni seed padre, oppure
  usare la variante consolidata `--version=v2-18-full`.
- **`--version=v2-18-full`** → carica `meta-prompts/v2-18/factory-bootstrap-full.md`, la
  **variante consolidata self-contained**: identica funzionalmente a v2.18 ma con l'intera
  catena `extends` (v2-18 + v2-17 + v2-16 + v2-15 + Fase 2/5 di v2-12) **inlinata in un
  unico file** (nessun `extends:` da risolvere). Consigliata quando l'agente non risolve in
  automatico la catena `extends:`. Resta necessario il fetch dei template di contenuto.
- `--version=v2-17` → v2.17 (FE Visual Oracle Integration opt-in; estende v2-16 con la
  Fase 1.quinquies opt-in per attivare il FE Visual Oracle — skill `visual-oracle-protocol`
  + `oracle-precheck` + comando `/visual-oracle` + blocco config `fe_correctness`).
- `--version=v2-16` → v2.16 (Premortem Integration opt-in; estende v2-15 con la Fase
  1.quater opt-in per scaffoldare la skill `premortem-protocol`).
- `--version=v2-15` → v2.15 (consolidation release del Compression Layer; gate Fase 1.5
  + 3a riformulati come opt-in deferred).
- `--version=v2-14` → v2.14 (introduzione Compression Layer a due assi opt-in, gate
  empirici come «pending run»).
- `--version=v2-13` → v2.13 (multi-adapter scaffolding, meta-prompt versionato nel repo).
- `--version=v2-12` → v2.12 (self-contained portable, single-adapter, CQRL + multi-repo).
- `--version=v2-11` → v2.11 (snapshot legacy, monolitico, parallel scheduler).
