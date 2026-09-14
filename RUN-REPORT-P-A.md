# Run report — P-A, sprint 01 (NumeriMiei)

Esito dell'esecuzione dei task di P-A. Il riepilogo operativo è in fondo: **cosa resta
da fare a mano** e **cosa deve sapere P-B**.

## Stato dei task

| TSK | Stato | Consegnato |
|---|---|---|
| TSK-001 | done | `app/proxy.py` (CORS + statici + `/complete` + `/key-info`), `app/data/fixtures.json` seed |
| TSK-003 | done | `app/engine.js` — state machine 5 stati |
| TSK-004 | done | `app/engine.js` gate pdpLevel fail-loud, `app/data/pdp-levels.json` |
| TSK-008 | done | `app/explainer.js`, `app/data/clinical-denylist.json` (30 termini), `app/remediation-prompt.js` |
| TSK-009 | done | 10 fixture su 10 chiavi raggiungibili |
| TSK-012 | done | `app/router.js` |
| TSK-014 | done | OutcomeTracker + scaffold-fading in `app/engine.js` |
| TSK-016 | done | `app/session-report.js` |
| TSK-010 | **in-progress** | parte headless completa; 2 verifiche richiedono la UI di P-B |
| TSK-021 | **in-progress** | 8 check su 10 PASS; 2 richiedono `index.html`/`app.js` |
| TSK-011 | todo | umano per definizione; automatizzata la parte anticipabile |

## Verifiche eseguite

| Suite | Comando | Esito |
|---|---|---|
| E2E moduli | `node app/tests/e2e.mjs` | **32/32 PASS** |
| Qualità contenuto | `node app/tests/content-gate.mjs` | **72/72 PASS** su 10 fixture |
| Confine clinico | `bash app/tests/clinical-gate.sh` | **PASS** (2 SKIP su file di P-B) |
| Prontezza offline | `node app/tests/offline-check.mjs` | **PASS** |
| Live slot reale | `node app/tests/live-slot.mjs` | **PASS** — 1 richiesta, 1.18 s |

**Gate:** D1 PASS · D2 PASS (schema fixtures lockato) · D3 PASS (10 chiavi, soglia 6) ·
D4 parziale (manca la UI). **Budget OpenRouter: 16 / 50** — dettaglio in
[app/openrouter-budget.md](app/openrouter-budget.md).

## Cose che non tornavano nel piano, e come sono state risolte

**1. Il modello pinnato in TSK-009 non esiste come API.**
`thinkingmachines/inkling-small:free` risponde `403 — only available on agentic harnesses`.
Ho provato 5 modelli free: due sono reasoning-only e troncano prima di produrre output, due
Google sono rate-limited a livello di pool condiviso. Pinnato **`nex-agi/nex-n2.5-mini:free`**
(italiano pulito, non-reasoning, structured output). La DoD di TSK-009 che cita il modello
originale non è soddisfacibile: va considerata superata. **Non usare i modelli Google come
fallback durante la demo: erano già saturi oggi.**

**2. Il filtro per livello descritto in TSK-003 rompeva il transfer.**
La spec dice di filtrare gli step per denominatore (L1 ≤4, L2 ≤10). Applicandolo, lo step
transfer (1/5 vs 1/6) sparisce per L1 — cioè per il flusso principale della demo. Ho reso
la progressione **dato, non codice**: `includes_levels` in `pdp-levels.json` decide quali
step vede ciascun livello. L1 vede step1 + transfer, L2 vede step1 + step2 + transfer, che
è anche quello che il test 2 di TSK-010 dà per scontato.

**3. I grep gate di TSK-010/021 non sopravvivono ai moduli ES.**
`grep -c renderRemediation ... = 1` non è soddisfacibile: una funzione definita e chiamata
conta almeno 2. Stessa cosa per `grep -nE 'misconcepto|...' = 0`, dato che `misconcepto_slug`
è il nome di campo del contratto e deve comparire nel codice che legge il JSON.
Ho implementato **l'intento** in [app/tests/clinical-gate.sh](app/tests/clinical-gate.sh), che
verifica ciò che conta davvero (un solo entry point, un solo writer di `pdpLevel`, zero prosa
didattica nel codice, zero frazioni letterali) e riporta accanto a ogni check il comando
originale e quello corretto.

**4. Il live slot produceva testo corretto ma fuori tema.**
Alla prima esecuzione reale ha spiegato 1/2 invece del confronto 1/3 vs 1/4: il prompt non
riceveva l'esercizio. È il momento "wow" della demo, quindi l'ho sistemato estraendo
[app/remediation-prompt.js](app/remediation-prompt.js), condiviso fra generazione batch e live
slot — così il testo generato dal vivo ha la stessa voce di quelli pre-validati, che è
esattamente il confronto che il pubblico fa. Seconda esecuzione: in tema, 1.18 s.

**5. Sei fixture su dieci erano difettose.**
Il gate di contenuto che ho scritto ha intercettato una spiegazione **matematicamente
sbagliata** ("Tre quarti delle fette sono più grandi di quattro parti uguali"), tre ambigue,
un termine tecnico fuori registro ("frazione") e due frasi oltre le 15 parole. Riscritte a
mano — la disciplina di sprint vieta richieste extra per migliorare una fixture. Ora
`content-gate.mjs` verifica a ogni run: denylist, registro non tecnico, lunghezza frasi,
numero parole, e che L1 usi l'immagine discreta (pizza) e L2 quella lineare (metro).

**6. TSK-012 e TSK-016 scrivevano in `app.js`, che è di P-B.**
Estratti in `router.js` e `session-report.js`. I `code_path` nel kanban sono stati allineati.

## Cosa resta da fare a mano

**Dopo che P-B consegna `index.html` e `app.js`** (ri-eseguire, non serve altro):

```bash
bash app/tests/clinical-gate.sh     # sblocca il check footer e il call site in app.js
node app/tests/offline-check.mjs    # sblocca il controllo CDN su index.html
```

**TSK-010, verifiche che richiedono il browser:**
- flusso L1 in DevTools con tab Network aperta → zero richieste durante la remediation
  (già verificato headless, ma la giuria guarda il browser);
- live slot dal vivo: console → `DEMO_MODE = false`, distrattore non coperto, **poi subito
  `DEMO_MODE = true`**.

**TSK-021, verifiche visive:** messaggio di stop dopo 3 errori con il pulsante submit
rimosso dal DOM; footer Legge 170/2010 visibile senza scroll su `?role=student`,
`?role=teacher`, `?role=parent`.

**TSK-011, dry run offline (umano, non negoziabile):** stacca il wifi, ricarica
`http://localhost:8080`, esegui il flusso completo L1 fino al report. Il rischio residuo
numero uno è il Tailwind da CDN in `index.html`: `offline-check.mjs` lo intercetta, ma il
file è di P-B.

## Cosa deve sapere P-B

1. **I quattro moduli del contratto sono reali, non stub**: `engine.js`, `explainer.js`,
   `router.js`, `session-report.js` si possono importare subito. `mock-data.js` serve solo
   per costruire la UI in parallelo, non per sbloccarsi.
2. **Esiste un curriculum di riferimento conforme a CT-1**:
   [app/tests/fixtures/curriculum-sample.json](app/tests/fixtures/curriculum-sample.json).
   Copiarlo come punto di partenza di TSK-006 fa risparmiare la maggior parte dei 25 minuti.
   Ha già dentro la correzione dello step 2 (1/4 vs 1/7) che salva l'invariante del transfer.
3. **Un solo server:** `python3 app/proxy.py` serve sia i file statici sia il proxy su
   `http://localhost:8080`. Non serve un secondo server sulla 5173.
4. **CT-2 si è allargato** (solo aggiunte, niente rotture): `startSession()`,
   `getCurrentItem()`, `getScaffoldVisible()`, `isTransferStep()`, `getScaffoldPolicy()`,
   `getRemediationKeyParts()`. Quest'ultimo restituisce `{step_id, level, slug}` già pronti
   da passare a `getSafeRemediation()`.
5. **Le fixture coprono tutte e 10 le chiavi raggiungibili**: qualunque distrattore la giuria
   clicchi, il testo è pre-validato. Il fallback generico non dovrebbe mai comparire.

---

# Integrazione con la metà di P-B (dopo il pull)

Rebase pulito, nessun conflitto. P-B ha consegnato `index.html`, `app.js`, il curriculum,
la scheda genitori e il deck. **Il curriculum è conforme a CT-1**: la mia suite completa
gira su quello reale senza modifiche (32/32).

## Verifiche sul codice integrato

| Suite | Comando | Esito |
|---|---|---|
| E2E moduli (riferimento) | `node app/tests/e2e.mjs` | **32/32 PASS** |
| E2E moduli (curriculum di P-B) | `CURRICULUM=prod node app/tests/e2e.mjs` | **32/32 PASS** |
| Qualità contenuto | `node app/tests/content-gate.mjs` | **72/72 PASS** |
| Confine clinico | `bash app/tests/clinical-gate.sh` | **PASS** (ora senza SKIP) |
| Copy statica | `node app/tests/static-copy-gate.mjs` | **PASS** |
| Prontezza offline | `CURRICULUM=prod node app/tests/offline-check.mjs` | **PASS** |
| **Browser E2E reale** | `node app/tests/browser-e2e.mjs` | **PASS** — 15 check, zero eccezioni JS |

Il browser E2E chiude le verifiche che nei TSK erano descritte come manuali: flusso L1
errore con la tab Network (47 ms, zero richieste), scaffold dopo il primo errore, stop a
3 tentativi con il submit rimosso, sessione L2 fino al completamento, report docente
popolato senza percentuali, footer su tutte e tre le view.

## Sette difetti trovati integrando, tutti corretti

**1. `MOCK = true` era ancora attivo.** Il più grave: l'app girava interamente su dati
finti — engine, explainer, router e report reali scollegati, **denylist clinica
scavalcata**. Il flag andava girato al sync S2 e non è stato girato. Ora
`clinical-gate.sh` fallisce se qualcuno lo riattiva, così non può succedere di nuovo.

**2. A fine sessione veniva cancellato il report.**
`localStorage.setItem('session_errors', JSON.stringify({done:true}))` sovrascriveva
l'array dei misconcetti: il docente avrebbe visto una sessione vuota proprio dopo il
completamento, cioè il momento in cui guarda.

**3. La view docente non mostrava mai il report a chi non sbaglia.** Il discriminante
era la presenza di `session_errors`, che l'engine scrive solo in caso di errore. Una
sessione perfetta — lo scenario più probabile in una demo pilotata — finiva sulla form
di configurazione. Sostituito con `hasSessionData()`, che guarda gli step affrontati.

**4. La remediation del transfer cadeva sempre sul fallback generico.** `app.js` passava
`step.level`, che sul transfer vale `"L1|L2"` e non corrisponde a nessuna chiave fixture.
Ora la chiave la costruisce l'engine con `getRemediationKeyParts()`.

**5. Vicolo cieco all'ultimo esercizio.** Il ramo di completamento si attivava su
`submit() === 'COMPLETION'`, che non accade mai: `submit()` restituisce `NEXT`, è
`nextStep()` a dichiarare la fine. Il pulsante avrebbe portato a `renderStep(null)`.

**6. Doppio writer di `pdpLevel` e doppio `OutcomeTracker`.** `mock-data.js` scriveva la
chiave reale (invariante single-writer di US-011 rotta) e `app.js` ridefiniva il tracker
del transfer già implementato nell'engine.

**7. Frazioni scritte nel codice.** La mappa frazione→parola per i lettori di schermo era
inline in `app.js`: aggiungere un esercizio avrebbe richiesto una modifica al codice.
Spostata in `data/fraction-labels.json`.

## Un falso positivo che non ho corretto

Il nuovo gate sulla copy statica segnalava il footer: *"studenti con diagnosi certificata
di discalculia… non sostituisce la valutazione clinica"*. Quel paragrafo **deve** contenere
quei termini — è l'enunciato che traccia il confine clinico, non una sua violazione. Il
footer è escluso dalla scansione e al suo posto si verifica che esista e sia completo.

## Cosa resta

- **TSK-011** — dry run a rete fisicamente staccata (umano). La parte anticipabile è verde:
  nessuna risorsa esterna, Tailwind vendorizzato da P-B, flusso completo senza rete.
- **TSK-022 / TSK-023 / TSK-024** — blocco demo: script, rehearsal ×2, dry run. Da fare
  insieme dopo le 4:00. Il pulsante *Nuova sessione* ora azzera davvero i dati di
  sessione, quindi il rehearsal ×2 è eseguibile senza aprire DevTools.

**22 TSK su 26 chiusi.** I 4 aperti sono i tre del blocco demo (TSK-022/023/024) e il
dry run offline (TSK-011): tutte attività umane, nessuna riga di codice mancante.
