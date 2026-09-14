# wiki/log.md — Log ingest wiki-keeper

---

## 2026-09-14 — Update: G_004 ampliata a quattro fonti, banner sul verbale Tavola Rotonda

**Operazione:** `update`
**Agente:** wiki-keeper (sessione principale)
**Trigger:** segnalazione da `poc-hagenthon-2026-dc` (terza fonte) + sweep repo-wide
**Verifica:** `grep` su `app/ presentation/ management/ wiki/ raw/` per nomi di modello

### Esito dello sweep

`-dc` ha segnalato che le fonti divergenti erano tre, non due (il deck diceva "Claude").
Lo sweep ne ha trovata una **quarta**, che è l'origine di tutte: il verbale della Tavola
Rotonda delle 10:00Z assume Anthropic / Claude / Haiku in 6 punti, perché fu scritto
*prima* della ricerca OpenRouter. Il deck non ha inventato "Claude": l'ha ereditato.

| Fonte | Diceva | Stato |
|---|---|---|
| `wiki/decisions/tavola-rotonda-e3f2a1b4-…` | Claude / Haiku | banner supersessione, corpo intatto |
| G_001 + runbook | `inkling-small:free` (403 gated) | runbook ⚠️ SUPERSEDED; G_001 da riaprire |
| `presentation/numerimiei-deck.html:394,548` | Claude | corretto da `-dc` |
| `app/explainer.js:31`, `gen-fixtures.mjs:27` | `nex-agi/nex-n2.5-mini:free` | riferimento |

### Pagine aggiornate

| Path | Natura del delta |
|------|-----------------|
| `wiki/gaps.md` | G_004 rititolata "Quattro fonti dichiarano tre modelli LLM diversi"; nuova sezione §Ampliamento con tabella fonti, cronologia della propagazione e nota sul trattamento dei decision record |
| `wiki/decisions/tavola-rotonda-e3f2a1b4-…-2026-09-14.md` | Banner ⚠️ post-hoc in testa, dichiarato come tale; **corpo non modificato** |

### Nota di metodo

Il verbale non è stato riscritto. Un decision record registra ciò che fu deciso:
correggerlo a posteriori distrugge la tracciabilità della catena decisionale, che qui
è esattamente l'informazione di valore (tre strati di scelta sovrapposti in 4 ore).
Annotato, non falsificato.

La classe di difetto: ogni strato decisionale ha lasciato dietro un artefatto non
marcato come superato. Il verbale è il caso peggiore perché "è storia" e non si rilegge
mai — quindi continua a seminare il dato vecchio a valle senza che nessuno lo controlli.

---

## 2026-09-14 — Update: G_003 chiusa, due superfici di copertura, G_004 aperta

**Operazione:** `update`
**Agente:** wiki-keeper (sessione principale)
**Trigger:** correzione deck da `poc-hagenthon-2026-dc`
**Verifica:** `presentation/numerimiei-deck.html:665`, `presentation/demo-script.html`,
`app/explainer.js`, `app/openrouter-budget.md`

### G_003 → resolved

Slide 5 corretta e verificata: nessuna occorrenza residua di "2 misconcep" in
`presentation/`. Il limite "un solo item per step" omesso dall'owner per leggibilità
in sala — scelta consapevole, documentata in gaps.

### Mapping dei 6 criteri: ora due superfici

`demo-script.html` §6 mappa gli stessi 6 criteri sulle **frasi parlate**. La wiki ora
distingue: la slide **dimostra**, la battuta **dichiara**. Il criterio 6 è coperto due
volte di proposito (slide 5 + chiusura parlata sul confine clinico).

### Precisazioni entrate in §Copertura reale

- `round_number_bias` è scoperto **per costruzione**: il degrado per livello in
  `app/explainer.js:151` itera solo su `['L1','L2']` e `step7` non ha chiavi a nessun
  livello → nessun ramo lo risolve da file. Verificato leggendo il codice.
- La generazione dal vivo richiede `DEMO_MODE = false`: col default `true` anche
  `step7` ricade sul testo di ripiego. Lo script demo gestisce il toggle.

### G_004 aperta — divergenza wiki/esecuzione sul modello LLM

Trovata per cross-check incidentale, non cercata. G_001 è `resolved` con
`thinkingmachines/inkling-small:free`, che `app/openrouter-budget.md` registra come
**403 gated**. Il codice usa `nex-agi/nex-n2.5-mini:free`; il runbook no.

### Pagine aggiornate

| Path | Natura del delta |
|------|-----------------|
| `wiki/sources/hagenthon-2026-demo-requirements.md` | Nuova §Due superfici; riga 6 del mapping aggiornata; meccanismo "per costruzione" con riferimento al codice; condizione `DEMO_MODE` |
| `wiki/gaps.md` | G_003 → resolved con evidenza; nuovo G_004 (open, owner maintainer) |
| `wiki/runbooks/openrouter-setup-hagenthon.md` | Blocco ⚠️ SUPERSEDED sul modello batch, con modello verificato e rimando a G_004; testo storico conservato |

### Nota

Sul runbook ho aggiunto un avviso, non ho ri-pinnato il modello: la scelta di
configurazione è del maintainer. Un runbook che porta a un 403 sotto pressione è però
un rischio attivo, e segnalarlo non richiede di decidere al posto suo.

---

## 2026-09-14 — Update: ordine curriculum corretto, transfer chiude a ogni livello

**Operazione:** `update`
**Agente:** wiki-keeper (sessione principale)
**Trigger:** fix applicato da `poc-hagenthon-2026-d4` dopo segnalazione da questa sessione
**Verifica:** diretta su `app/data/` + esecuzione `node app/tests/e2e.mjs` → 32/32 PASS

### Cosa è cambiato nel prodotto

`step7` spostato **prima** di `step3`. Ordine filtrato risultante:

| Livello | Sequenza | Ultimo step |
|---|---|---|
| L1 | step1, step4, step5, step6, step3 | `step3` — `scaffold:false`, `transfer:true` |
| L2 | + step2 prima di step3 | `step3` |
| L3 | + step2, step7 prima di step3 | `step3` |

Prima del fix, a L3 la sessione si chiudeva su `step7` (scaffoldato): il transfer non
era in fondo e la dimostrazione del criterio 6 sarebbe stata incoerente col percorso reale.

Il `_nota` del curriculum, che affermava una cosa falsa a L3, è stato riscritto dall'owner.
L'invariante è ora coperta da test su L1/L2/L3, non più da un commento.

### Pagine aggiornate

| Path | Natura del delta |
|------|-----------------|
| `wiki/sources/hagenthon-2026-demo-requirements.md` | §Copertura reale: aggiunta riga "Ordine di gioco per livello"; transfer annotato come ultimo a tutti i livelli; `step7` ora penultimo a L3; nuovo paragrafo sull'invariante coperta da test |

### Nota di provenienza

Il difetto è emerso da una lettura incrociata durante l'ingest, non da un test fallito:
i test allora non coprivano l'assunzione. Registrato qui perché la classe di difetto
— ordine di un array che cambia significato dopo un filtro per livello — è muta finché
qualcuno non la guarda.

---

## 2026-09-14 — Update: copertura reale misconcetti (post espansione curriculum)

**Operazione:** `update`
**Agente:** wiki-keeper (sessione principale)
**Trigger:** segnalazione cross-session da `poc-hagenthon-2026-d4`
**Verifica:** diretta su `app/data/{curriculum-discalculia,fixtures,misconceptions,pdp-levels}.json`

I numeri segnalati dalla sessione peer sono stati **verificati indipendentemente**
prima di entrare in wiki, non accettati sulla parola. Esito: confermati tutti.

| Dato | Verificato |
|---|---|
| 3 misconcetti modellati | sì — `denominator_magnitude`, `numerator_focus`, `round_number_bias` |
| 2 con fixture pre-validate | sì — 22 chiavi, step1–step6, L1/L2 |
| `round_number_bias` scoperto a ogni livello | sì — zero chiavi in `fixtures.json` |
| `step7` = 1/8 vs 1/10, solo L3 | sì — `level: L3`, incluso solo da `pdp-levels.L3.includes_levels` |
| L1→5, L2→6, L3→7 esercizi | sì |
| 1 solo step di transfer (`step3`) | sì — unico con `scaffold: false` + `transfer: true` |

### Pagine aggiornate

| Path | Natura del delta |
|------|-----------------|
| `wiki/sources/hagenthon-2026-demo-requirements.md` | Nuova sezione `## Copertura reale — dati verificati`; riga 6 della tabella mapping annotata come stale; nota sulla validità temporale del mapping |
| `wiki/gaps.md` | Nuovo `G_003` (open) — deck riga 665 dichiara "2 misconcepit" contro 3 modellati; owner `poc-hagenthon-2026-dc` |

### Nota di confine

La correzione della slide 5 **non** è stata eseguita: `presentation/**` è fuori dallo
scope di questa sessione (solo `wiki/`). Il gap è registrato e relayato all'owner.

---

## 2026-09-14 — Ingest: requisiti demo finale Hagenthon 2026 (6 criteri obbligatori)

**Operazione:** `ingest`
**Agente:** wiki-keeper
**Sorgente:** `raw/2026-09-14-demo-requirements.md`
**Trigger:** Richiesta esplicita ingest file raw
**Ramo:** seriale (N=1)

### Verifica mapping eseguita

Il mapping raw→slide dichiarato nella sorgente è stato verificato leggendo direttamente
`presentation/numerimiei-deck.html`. Tutti e 6 i criteri hanno kicker espliciti (①–⑥)
nelle slide 2–5. Nessuna asserzione propagata senza evidenza.

### Pagine create

| Path | Tipo | Status |
|------|------|--------|
| `wiki/sources/hagenthon-2026-demo-requirements.md` | source | approved |

### Pagine aggiornate

| Path | Natura del delta |
|------|-----------------|
| `wiki/syntheses/hagenthon-2026-overview.md` | Nuova sotto-sezione `### Requisiti demo finale — i 6 criteri obbligatori` nel blocco `## Aggiornamenti (v2026-09-14)`; tabella mapping verificata + link a source; aggiornata sezione `## Fonti` |
| `wiki/index.md` | Aggiunta entry source `hagenthon-2026-demo-requirements.md` |

### Gap aperti in questa sessione

Nessuno. Il mapping sui 6 criteri è verificato dal deck HTML. Nessuna asserzione non supportata rilevata nel raw.

### Decisione di non creare concept page

I 6 criteri sono requisiti normativi dell'evento Hagenthon, non un dominio concettuale
riutilizzabile. Una pagina concept non avrebbe sostanza aggiuntiva rispetto alla source.
Decisione: source + aggiornamento synthesis sono sufficienti.

---

## 2026-09-14 — Decisioni G_001 e G_002: configurazione modelli e budget OpenRouter

**Operazione:** `decision`
**Agente:** wiki-keeper
**Trigger:** Maintainer ha chiuso entrambi i gap aperti

### Decisioni registrate

| Gap | Titolo | Decisione |
|-----|--------|-----------|
| G_001 | Scelta modello LLM per la demo | Free-only (vincolato da G_002). Fixtures: `thinkingmachines/inkling-small:free` pinnato. Live slot: array fallback `[inkling-small:free, nemotron-3-super-120b-a12b:free, openrouter/free]`. |
| G_002 | Caricare $10 di credito | Nessuna ricarica preventiva. Tier free $0. Rischio accettato. Ricarica in-corsa se colpito il tetto. |

**Vincolo incrociato:** G_002 ha ristretto lo spazio di G_001 (modelli a pagamento
non disponibili → tutto free-only).

### File toccati

| File | Natura modifica |
|------|----------------|
| `wiki/gaps.md` | G_001 e G_002 → `status: resolved`, decisione + vincolo incrociato |
| `wiki/runbooks/openrouter-setup-hagenthon.md` | Sezione "Scelta del modello" annotata come superseded; nuove sezioni "Configurazione modelli vigente" e "Disciplina di budget (6 punti)"; sezione "Rischio rate limit" aggiornata (ricarica preventiva → ricarica in corsa come fallback); checklist: riga `$10 consigliato` sostituita con `nessuna ricarica preventiva` + carta a portata di mano; aggiunte 2 voci mancanti (test structured outputs su modello free pinnato + prima fixture validata a mano prima del batch) |
| `wiki/concepts/openrouter-gateway.md` | Sezione "Rate Limit" aggiornata con decisione G_002; nuova sezione "Configurazione modelli vigente per NumeriMiei" |

---

## 2026-09-14 — Rettifica ingest: DigiStep → NumeriMiei (Round 2 re-scoping)

**Operazione:** `correction`
**Agente:** wiki-keeper
**Trigger:** Segnalazione coordinatore — contesto di progetto passato all'ingest era
obsoleto (fermo al Round 1). La sessione tavola rotonda `e3f2a1b4` ha avuto un Round 2
di re-scoping DSA/discalculia che ha sostituito il prodotto "DigiStep" con "NumeriMiei".

**Motivo:** 12 occorrenze di "DigiStep" nelle pagine create dall'ingest precedente;
zero occorrenze di "NumeriMiei". Il contesto del coordinatore descriveva il Round 1
(Mario, upload PDF) senza menzionare il Round 2 vigente (Luca, discalculia, frazioni).

### File toccati e righe modificate

| File | Tipo modifica | Righe |
|------|--------------|-------|
| `wiki/sources/openrouter-research.md` | Rename 2× `DigiStep` → `NumeriMiei` (abstract riga 13 e riga 21) — file omesso dalla lista originale del coordinatore, allineato in rettifica successiva | 13, 21 |
| `wiki/concepts/openrouter-gateway.md` | Rename 2× `DigiStep` → `NumeriMiei` | 17, 44 |
| `wiki/runbooks/openrouter-setup-hagenthon.md` | Rename 3× `DigiStep` → `NumeriMiei` (title frontmatter, H1, corpo testo); `X-OpenRouter-Title` → `"NumeriMiei"`; schema D3 ricalibrato su misconcepto matematico discalculia + constraint no-clinical + chiave composta `{step_id}-{level}-{misconcept_id}` | 2, 10, 13, 94, 118–156 |
| `wiki/concepts/educazione-digitale-inclusiva.md` | Sezione `## Aggiornamenti` riscritta: Round 2 vigente (NumeriMiei, Luca, discalculia, 3 audience, chiave fixtures) dichiarato esplicitamente; Round 1 superseded | 82–115 |
| `wiki/syntheses/hagenthon-2026-overview.md` | Sezione `### Tema scelto e nome prodotto`: due round descritti, Round 1 superseded, Round 2 vigente (NumeriMiei) | 61–72 |
| `wiki/index.md` | Descrizione runbook: `DigiStep` → `NumeriMiei` | 23 |

### Nota merito — schema D3 aggiornato

Il campo `headline` ora specifica che nomina il misconcepto matematico rilevato (non
una frase generica); `spiegazione` è 40-50 parole; `analogia` è calibrata al livello
PDP (L1 = linea dei numeri + blocchi base-10 ≤20; L2 = decomposizione parziale ≤100).
Aggiunto il constraint sul testo fixture: nessun vocabolario clinico/riabilitativo,
presidiato da `data/clinical-denylist.json` lato rendering.

### Contenuto tecnico OpenRouter invariato

Endpoint, auth, rate limit, structured outputs, model fallback, proxy Python, costi:
non toccati. Corretti solo i riferimenti al prodotto e il domain-specific dello schema.

---

## 2026-09-14 — Ingest: OpenRouter ricerca operativa (Hagenthon 2026)

**Operazione:** `ingest`
**Agente:** wiki-keeper
**Sorgente:** `raw/2026-09-14-openrouter-research.md`
**Trigger:** Richiesta esplicita ingest file raw
**Ramo:** seriale (N=1)

### Pagine create

| Path | Tipo | Status |
|------|------|--------|
| `wiki/sources/openrouter-research.md` | source | approved |
| `wiki/concepts/openrouter-gateway.md` | concept | approved |
| `wiki/runbooks/openrouter-setup-hagenthon.md` | runbook | approved |
| `wiki/index.md` | meta | rigenerato |

### Pagine aggiornate

| Path | Natura del delta |
|------|-----------------|
| `wiki/concepts/educazione-digitale-inclusiva.md` | Sezione `## Aggiornamenti (v2026-09-14)`: provider LLM (OpenRouter), dipendenze D1/D2/D3, gap G_001/G_002, link a runbook e concept |
| `wiki/syntheses/hagenthon-2026-overview.md` | Sezione `## Aggiornamenti (v2026-09-14)`: tema scelto (DigiStep), stack LLM OpenRouter, link runbook e concept |
| `wiki/gaps.md` | Apertura G_001 (scelta modello LLM per demo) e G_002 (carica credito $10) |

### Gap aperti in questa sessione

| ID | Titolo | Blocking |
|----|--------|----------|
| G_001 | Scelta definitiva del modello LLM per la demo | no |
| G_002 | Decisione di caricare $10 di credito su OpenRouter | no |

### Note

Nessuna contraddizione con pagine esistenti. Il documento è coerente con le decisioni
della tavola rotonda `e3f2a1b4` (piano B LLM, proxy, D1/D2/D3). Prima directory
`wiki/runbooks/` creata in questo ingest.

---

## 2026-09-14 — Sessione Tavola Rotonda Round 2: Re-scoping PoC Hagenthon su supporto DSA

**entry_type:** develop
**agent:** tavola-rotonda-moderatore
**artifact:** `wiki/decisions/tavola-rotonda-e3f2a1b4-7c5d-4e8f-9a0b-2d6c3f1e4b7a-2026-09-14.md`
**note:** "Round 2 terminato. Motivo: consenso (Fase 3 Round 1, tutti i PA risolti). Round R2: 1 round di convergenza. Accordi R2 congelati: 3 (discalculia+prodotto, feature 4h dev, a11y must-have). Dissensi: 0 residui (a11y-specialist aggiornata da dislessia a discalculia in Fase 2). Prodotto: NumeriMiei — coach di calcolo per studente con discalculia certificata. Stack: HTML+Tailwind CDN+JS vanilla. Deliverable: LPS Luca + AE denominator_magnitude + LO transfer task scaffold-fading."

---

## 2026-09-14 — Sessione Tavola Rotonda: Hagenthon 2026 tema e web app

**entry_type:** develop
**agent:** tavola-rotonda-moderatore
**artifact:** `wiki/decisions/tavola-rotonda-e3f2a1b4-7c5d-4e8f-9a0b-2d6c3f1e4b7a-2026-09-14.md`
**note:** "Sessione terminata. Motivo: consenso (Round 1 Fase 3, tutti i PA risolti). Round: 1. Accordi: 15 (10 da Fase 1/2 + 5 da Fase 3). Dissensi registrati: 1 (TPM su Tema 02 vs Tema 03 — dissenso fondato sulla pianificabilità, risolto nella sintesi con adozione della disciplina TPM su T03). Decisione: Tema 03 — DigiStep Adaptive Misconception Coach. Stack: HTML+Tailwind CDN+JS vanilla. Piano B LLM: DEMO_MODE+fixtures.json+live slot."

---

## 2026-09-14 — Ingest iniziale: Hagenthon 2026 temi sfida

**Operazione:** `ingest`  
**Agente:** wiki-keeper  
**Sorgente:** `raw/2026-09-14-hagenthon-temi-sfida.md`  
**Trigger:** Richiesta esplicita ingest file raw  

### Pagine create

| Path | Tipo | Status |
|------|------|--------|
| `wiki/sources/hagenthon-2026-temi-sfida.md` | source | approved |
| `wiki/concepts/accessibilita-digitale.md` | concept | approved |
| `wiki/concepts/inclusione-finanziaria.md` | concept | approved |
| `wiki/concepts/educazione-digitale-inclusiva.md` | concept | approved |
| `wiki/syntheses/hagenthon-2026-overview.md` | synthesis | approved |
| `wiki/gaps.md` | meta | initialized |
| `wiki/log.md` | meta | initialized |

### Note

Prima esecuzione su wiki vuota. Struttura karpathy-style inizializzata con le
cartelle `sources/`, `concepts/`, `syntheses/`. Nessun gap rilevato: il documento
sorgente è completo e autocontenuto per i 3 temi della sfida.
