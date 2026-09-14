<!-- generated, do not edit -->
# Sprint 01 — Hagenthon 2026: NumeriMiei

**Data:** 2026-09-14 (giorno hackathon)
**Team:** P-A (logica/engine/LLM) · P-B (UI/contenuto/a11y)
**Budget dev puro:** 240 minuti (4h) · **Demo prep:** 45 minuti separati post-dev

> **Routing:** `code_paths: [numerimiei → app/]` configurato → 23/26 TSK hanno `consumer: agent`
> (coerente con factory.config.yaml routing `be/fe/qa/docs: agent`; dispatch via `/run` o `/dev <TSK-id>`).
> Restano `consumer: human` i 3 TSK non delegabili a un agente: **TSK-011** (offline test a rete
> fisicamente staccata), **TSK-023** (rehearsal cronometrato), **TSK-024** (dry run offline).
>
> **Code path per target:** `numerimiei` → `app/` (codice, dati prodotto) · `presentation` → `presentation/`
> (deck PPT, demo script, documentazione). Il layer `docs` e' condiviso dalle due entry, quindi
> tutti i TSK `docs` portano un `target:` esplicito.

---

## Budget richieste OpenRouter — Vincolo di sprint tracciato

**Tetto:** 50 req/giorno (tier free, G_002 resolved). **Piano disciplinato:** ≤20 req.

| Fase | TSK | Req stimate | Cumulative |
|---|---|---|---|
| D1 smoke test + D3 json_schema check | TSK-001 | 3 max | 3 |
| Batch fixture generation (9 chiavi) | TSK-009 | 9 (no retry) | 12 |
| E2E live slot test (1-2 prove) | TSK-010 | 2 max | 14 |
| Demo live slot finale | (demo) | 1 | **15** |
| Headroom per imprevisti | — | 35 | 50 |

**Disciplina obbligatoria:** `DEMO_MODE=true` durante tutto lo sviluppo e i test (zero req API per debug ordinario). Contatore fisico (sticky note) aggiornato a ogni chiamata. **Budget gate:** se il totale supera 35 req a 1:25h → freeze live slot, dichiarare DEMO_MODE permanente per la demo. Ricarica in-corsa possibile in 2 minuti se necessario (G_002).

**Conflitto originale risolto:** il piano pre-disciplina stimava 45-55 req (contro il tetto di 50). La risoluzione è stata: (a) riduzione fixtures da 12 a 9 chiavi (PA-R2-2), (b) DEMO_MODE=true enforced durante dev, (c) fixture generation come operazione quasi-single-shot (tutti i prompt preparati prima di eseguire, zero retry). Il piano attuale stima 15 req (margine 35).

---

## Piano orario — 4h sviluppo puro

### Slot 0:00–0:15 — Setup parallelo

| Orario | P-A | P-B |
|---|---|---|
| 0:00–0:15 | **TSK-001** Setup proxy CORS + smoke test OpenRouter (D1) [15 min] | **TSK-002** index.html + Tailwind + HTML semantico + footer permanente [15 min] |

**Gate D1** (0:10): API key funzionante + 1 call parsabile.
**Gate D2** (0:15): schema fixtures.json scritto + integration test resolveRemediation + conferma verbale P-B. Se D2 fallisce → stop, risolvi in 5 min o tutto il team blocca.

> P-B ha ~5 min di attesa durante il lock D2 (0:10-0:15). **TSK-025** (PPT slide 1-2) può essere eseguito in questo slot se disponibile.

---

### Slot 0:15–1:25 — Core engine + content (D3, D6)

| Orario | P-A | P-B |
|---|---|---|
| 0:15–0:45 | **TSK-003** quiz-engine.js: state machine [30 min] | **TSK-005** MCQ component HTML [25 min] |
| 0:40–0:55 | **TSK-004** pdpLevel gate + pdp-levels.json [15 min] | **TSK-006** curriculum-discalculia.json [25 min] |
| 0:55–1:20 | **TSK-008** explainer.js + denylist.json [25 min] | **TSK-007** PLR review curriculum (D6) [15 min] |
| 1:05–1:25 | **TSK-009** Batch fixture generation 9 chiavi [20 min] | (continua TSK-007 o buffer micro) |

**Gate D3** (1:25): fixtures.json ≥6 chiavi.
**Gate D6** (1:25): curriculum validato, plain language, zero denylist.

> TSK-003/TSK-004 e TSK-005/TSK-006 si sovrappongono parzialmente per P-A: la fixture generation (TSK-009) avviene per lo più in attesa API, permettendo di completare TSK-008 in parallelo.

---

### Slot 1:25–2:25 — A11y + audience views (D5)

| Orario | P-A | P-B |
|---|---|---|
| 1:25–1:35 | **TSK-012** URL param router + pdpLevel read [10 min] | **TSK-013** Form PDP docente: select L1/L2/L3 [20 min] |
| 1:35–2:00 | Verifica logica single-writer + debug fixtures | **TSK-019** A11y set A: tabular-nums + no-animation + contrasto + feedback [25 min] |
| 2:00–2:25 | Debug + revisione integrazione engine-explainer | **TSK-020** A11y set B: number line CSS + stacked fraction + visibility:hidden + focus [35 min → overflow 2:30-2:50] |

**Gate D5** (2:25): a11y must-have completato da P-B.

> TSK-020 (35 min) inizia a 2:00 e overflow al slot successivo fino a 2:35. Il sequenza di taglio se il tempo è insufficiente: (1) stacked fraction → slash con gap ≥8px (-20 min); (2) sticky-top question (-15 min).

---

### Slot 2:25–2:30 — CHECKPOINT GO/NO-GO

| Scenario | Condizione | Azione |
|---|---|---|
| **GO** | Flusso L1 errore→remediation→riprova→avanza. Offline test. Docente view visibile. A11y pass. | Procedi con scaffold-fading (TSK-014/015) |
| **PARZIALE-A** | Engine OK, live slot instabile o non testato | DEMO_MODE puro, "output pre-validati" + mostra il codice del prompt |
| **PARZIALE-B** | Transfer task non pronto | Dichiara LO come "task completion" (onesto, non bluff) |
| **NO-GO** | <2 step funzionanti | Mostra quello che funziona, dichiarazione aperta |

---

### Slot 2:30–3:30 — Integrazione + E2E + scaffold-fading

| Orario | P-A | P-B |
|---|---|---|
| 2:30–2:35 | Continua da TSK-020 overflow (assist) | **TSK-020** overflow a11y set B [fino a 2:50] |
| 2:30–2:45 | **TSK-014** OutcomeTracker + scaffold flag [15 min] | — |
| 2:45–2:50 | **TSK-016** Wiring localStorage → report data [5 min] | **TSK-015** Transfer item UI [20 min] (2:50–3:10) |
| 2:50–3:10 | **TSK-010** E2E test L1/L2 + live slot + grep gate (D4) [20 min] | **TSK-015** continua |
| 3:10–3:20 | **TSK-021** Verifica presidio confine clinico [10 min] | **TSK-017** Report HTML docente [20 min] (3:10–3:30) |
| 3:20–3:30 | Fix bug critici / debug | **TSK-017** continua |

**Gate D4** (2:30 → target 3:10 E2E): flusso completo L1/L2 + transfer + report.

---

### Slot 3:30–4:00 — Buffer tecnico

| Orario | P-A | P-B |
|---|---|---|
| 3:30–3:50 | **TSK-011** Offline test: rete staccata, flusso completo [20 min] | **TSK-018** [COND] toParentLanguage() + ?role=parent [15 min] — solo se GO checkpoint |
| 3:50–4:00 | Fix eventuali crash da offline test | **TSK-026** [COND] PPT slide 3-5 [15 min] — solo se buffer non consumato |

> Il buffer ha 30 min. TSK-011 è obbligatorio (20 min). I rimanenti 10 min sono per fix critici. TSK-018 e TSK-026 sono condizionali e si eseguono SOLO se il buffer tecnico non è stato consumato.

**4:00 — STOP DEV NETTO.** Nessuna feature aggiuntiva dopo questo punto.

---

## Blocco separato 4:00–4:45 — Demo Prep

| Orario | Attività | TSK |
|---|---|---|
| 4:00–4:15 | Script narrativo 3 min + accordo speaker/clicker | **TSK-022** |
| 4:15–4:30 | Rehearsal ×2 cronometrato + a11y checklist finale | **TSK-023** |
| 4:30–4:45 | **Dry run offline** (NON NEGOZIABILE) — rete staccata, flusso completo | **TSK-024** |

> Il PPT (TSK-025 opportunistico + TSK-026 condizionale) viene assemblato DURANTE lo sviluppo (Opzione 1), non in questo blocco. Il blocco 4:00-4:45 è saturo con script+rehearsal+dry run = 45 min. Aggiungere il PPT qui significherebbe togliere 15-20 min al dry run — inaccettabile (vedi decisione PPT).

---

## Dipendenze critiche D1-D6

| Dep | Scadenza | Azione in caso di fallimento |
|---|---|---|
| **D1** — API key funzionante + 1 call parsabile | 0:10 | → Piano B: 5-6 fixtures scritte a mano, stop tentativi API |
| **D2** — schema fixtures.json scritto + integration test | 0:15 | → Rischio silenzioso: NON si procede su US-003 finché non risolto (max 5 min) |
| **D3** — fixtures.json ≥6 chiavi | 1:25 | → Fallback: hardcode chiavi mancanti in fixtures.json come testi manuali |
| **D4** — flusso E2E completo (transfer incluso) | 2:30 | → Scenario PARZIALE o NO-GO al checkpoint |
| **D5** — a11y must-have completato | 2:25 | → Senza a11y la giuria boccia la capability prima di vederla |
| **D6** — contenuto discalculia validato (plain language, zero denylist) | 1:25 | → Contenuto stigmatizzante è trappola fatale per la demo |

---

## Sequenza di taglio (in caso di overrun)

Ordine di priorità per il taglio, decrescente:

1. **TSK-018** — View genitore (US-009, P2): fuori dal piano base, prima a cadere
2. **TSK-020** stacked fraction → slash con gap ≥8px (-20 min): candidato taglio a11y
3. **TSK-020** sticky-top question (-15 min): secondo candidato taglio a11y
4. **TSK-014/TSK-015** — Transfer item/scaffold-fading (US-007): riduce LO claim a "task completion" ma non impedisce la demo
5. **MAI tagliate:** denylist clinica (renderRemediation), grep gate, footer Legge 170/2010, must-have a11y restanti

---

## Tutti i TSK del sprint (vista aggregata)

| TSK | US | Owner | Layer | Consumer | Estimate | Slot | Priorità | Status | Note |
|---|---|---|---|---|---|---|---|---|---|
| TSK-001 | US-001 | P-A | infra | human | XS | 0:00–0:15 | P0 | todo | D1 gate |
| TSK-002 | US-001 | P-B | fe | human | XS | 0:00–0:15 | P0 | todo | footer permanente |
| TSK-003 | US-002 | P-A | fe | human | XS | 0:15–0:45 | P0 | todo | |
| TSK-004 | US-002 | P-A | fe | human | XS | 0:40–0:55 | P0 | todo | pdpLevel gate |
| TSK-005 | US-002 | P-B | fe | human | XS | 0:15–0:40 | P0 | todo | MCQ component |
| TSK-006 | US-003 | P-B | docs | human | XS | 0:15–0:40 | P0 | todo | D6 input |
| TSK-007 | US-003 | P-B | docs | human | XS | 1:05–1:20 | P0 | todo | D6 gate |
| TSK-008 | US-004 | P-A | fe | human | XS | 0:55–1:20 | P0 | todo | denylist inclusa |
| TSK-009 | US-004 | P-A | fe | human | XS | 1:05–1:25 | P0 | todo | D3 gate — budget |
| TSK-010 | US-005 | P-A | qa | human | XS | 2:50–3:10 | P0 | todo | D4 gate + grep |
| TSK-011 | US-005 | P-A | qa | human | XS | 3:30–3:50 | P0 | todo | offline test |
| TSK-012 | US-006 | P-A | fe | human | XS | 1:25–1:35 | P0 | todo | URL router |
| TSK-013 | US-006 | P-B | fe | human | XS | 1:25–1:45 | P0 | todo | form docente |
| TSK-014 | US-007 | P-A | fe | human | XS | 2:30–2:45 | P0 | todo | OutcomeTracker |
| TSK-015 | US-007 | P-B | fe | human | XS | 2:50–3:10 | P0 | todo | transfer UI |
| TSK-016 | US-008 | P-A | fe | human | XS | 2:45–2:50 | P0 | todo | wiring 5 min |
| TSK-017 | US-008 | P-B | fe | human | XS | 3:10–3:30 | P0 | todo | report HTML |
| TSK-018 | US-009 | P-B | fe | human | XS | 3:30–3:45 | P2 | todo | CONDIZIONALE |
| TSK-019 | US-010 | P-B | fe | human | XS | 1:45–2:10 | P0 | todo | a11y set A |
| TSK-020 | US-010 | P-B | fe | human | XS | 2:00–2:50 | P0 | todo | a11y set B |
| TSK-021 | US-011 | P-A | qa | human | XS | 3:10–3:20 | P0 | todo | verifica clinico |
| TSK-022 | US-012 | team | docs | human | XS | 4:00–4:15 | P0 | todo | script demo |
| TSK-023 | US-013 | team | docs | human | XS | 4:15–4:30 | P0 | todo | rehearsal ×2 |
| TSK-024 | US-013 | team | docs | human | XS | 4:30–4:45 | P0 | todo | dry run NON NEG |
| TSK-025 | US-014 | P-B | docs | human | XS | 0:10–0:15 | P1 | todo | OPPORTUNISTICO |
| TSK-026 | US-014 | P-B | docs | human | XS | 3:45–4:00 | P1 | todo | CONDIZIONALE |

---

## Verifica capacità (240 min per persona)

**P-A — ore sviluppo assegnate:**
TSK-001 (15) + TSK-003 (30) + TSK-004 (15) + TSK-008 (25) + TSK-009 (20) + TSK-012 (10) + TSK-014 (15) + TSK-016 (5) + TSK-010 (20) + TSK-021 (10) + TSK-011 (20) = **185 min assegnati + ~55 min overhead/debug/checkpoint = 240 min. ENTRA.**

**P-B — ore sviluppo assegnate:**
TSK-002 (15) + TSK-005 (25) + TSK-006 (25) + TSK-007 (15) + TSK-013 (20) + TSK-019 (25) + TSK-020 (35) + TSK-015 (20) + TSK-017 (20) = **200 min core + TSK-018 [COND 15] + TSK-025 [OPP 5] + TSK-026 [COND 15] = 235 min. ENTRA** (le attività condizionali usano il buffer 3:30-4:00 e non sono garantite).

**Tensione identificata:** TSK-020 (a11y set B, 35 min) inizia a 2:00 nel slot 1:25-2:25 (60 min) che contiene già TSK-013 (20 min) e TSK-019 (25 min) = 80 min totali per P-B in 60 min di slot. Risoluzione: TSK-020 overflow di 20 min nel slot 2:30-3:30 (porta P-B a iniziare TSK-015 alle 2:50 anziché 2:30). Il piano rimane fattibile grazie alla riduzione delle fixture (PA-R2-2) che ha liberato il buffer.

---

## Decisione PPT — Opzione 1 scelta (motivazione)

**Decisione:** Opzione 1 — assemblaggio frazionato durante le attese dello sviluppo, ≤5 slide.

**Motivazione:**
- Il blocco 4:00-4:45 è genuinamente saturo: script (15 min) + rehearsal ×2 (15 min) + dry run (15 min) = 45 min. Inserire 20 min di PPT qui significherebbe togliere 20 min al dry run, che è non negoziabile (US-013 esplicito).
- P-B ha finestre di attesa reali durante lo sviluppo: (a) attesa D2 lock 0:10-0:15 (~5 min), (b) buffer 3:30-4:00 se non consumato da bug (~15 min). Usare queste finestre non porta rischio aggiuntivo.
- Opzione 2 (estendere a 60 min) richiederebbe coordinamento con gli organizzatori.
- Opzione 3 (3-4 slide in 10 min) è troppo compressa e produrrebbe materiale di scarsa qualità.
- **Vincolo non derogabile rispettato:** il dry run (TSK-024) non può essere spiazzato dal PPT in nessuno scenario.
