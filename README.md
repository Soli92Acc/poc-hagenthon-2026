# NumeriMiei

**Coach di calcolo che spiega l'errore giusto allo studente con discalculia.**

PoC costruito per **Hagenthon 2026** (hackathon di agentic coding, Accenture Application
Engineering) — Tema 03, *Educazione Digitale Inclusiva*. Sprint singolo: 4 ore di sviluppo,
due persone, demo finale di 4 minuti.

---

## Il problema

Luca ha 11 anni, prima media, discalculia certificata (ASL, PDP 2025). Davanti a *1/3 o 1/4?*
risponde 1/4, perché 4 è più grande di 3. È un errore con un nome: **denominator magnitude
error**. Il compito tornato con la crocetta rossa non gliel'ha mai detto.

Le app di esercizi dicono "sbagliato, riprova". Un docente di sostegno gli spiegherebbe
*quell'* errore, e gli metterebbe davanti la linea delle frazioni — lo strumento
compensativo che il suo PDP già prevede. NumeriMiei fa la seconda cosa: riconosce il tipo
di errore dietro la risposta e restituisce la spiegazione che serve a quello, al livello di
supporto deciso dal docente.

Il miglioramento non è "ha imparato le frazioni". È: **usa da solo uno strumento che prima
usava solo se glielo mettevano in mano.**

## Provalo in due minuti

Serve solo Python 3 (già presente su macOS e Linux). Nessun `npm install`, nessuna build,
nessuna chiave API per il percorso normale.

```bash
python3 app/proxy.py          # statici + proxy CORS su http://localhost:8080
```

Poi apri `http://localhost:8080` e scegli un profilo. Il percorso della demo:

1. **Docente** → scegli *Livello 1 — supporto visivo immediato* → conferma
2. **Studente** → sull'esercizio 1 clicca *"1/4, perché 4 è più grande di 3"*
3. Compare la spiegazione di quel misconcetto, e con essa la linea delle frazioni
4. Arriva fino all'**esercizio di verifica** (1/5 vs 1/6, senza supporto): è il transfer
5. **Docente** → il resoconto di sessione, in parole e non in percentuali

Un server statico qualunque va bene (`python3 -m http.server` da `app/`), ma serve un
server: l'app usa ES modules e `file://` non funziona. Con `proxy.py` hai in più il
live slot LLM sulla stessa porta.

## Come funziona

```
curriculum JSON ──▶ engine.js ──▶ app.js (DOM) ──▶ session-report.js
                   (state machine)      │
     risposta sbagliata ────────────────┤
                                        ▼
                              explainer.js
                        1. fixtures.json (pre-validate, zero rete)
                        2. live slot OpenRouter (solo se DEMO_MODE=false, 3s)
                        3. fallback fisso (sempre, offline)
                                        │
                            denylist clinica (30 termini)
                                        ▼
                                    al DOM
```

| Modulo | Ruolo |
|---|---|
| [`app/engine.js`](app/engine.js) | State machine MCQ: `STEP → REMEDIATION → NEXT → STOPPED / COMPLETION`. Logica pura, non tocca il DOM. Stop dopo 3 errori consecutivi. |
| [`app/explainer.js`](app/explainer.js) | `getSafeRemediation()` — **unico** punto da cui un testo di remediation raggiunge la UI. Catena di fallback a 3 livelli + presidio della denylist. |
| [`app/app.js`](app/app.js) | Tutto il rendering. Due shell distinte (studente e docente) sugli stessi token di design. |
| [`app/router.js`](app/router.js) | Ruolo in `?role=`, livello PDP in `localStorage`. `setPdpLevel()` è il **single writer** del livello. |
| [`app/session-report.js`](app/session-report.js) | Resoconto docente. Non calcola un punteggio, di proposito. |
| [`app/proxy.py`](app/proxy.py) | Statici + `POST /complete` verso OpenRouter + `GET /key-info`. La chiave sta in `.env`, mai nel codice. |

Il contenuto didattico non è nel codice. Vive in [`app/data/`](app/data/):

| File | Contenuto |
|---|---|
`curriculum-discalculia.json` | 7 esercizi, con distrattori etichettati per misconcetto. L'ordine dell'array è l'ordine di gioco: divario grande all'inizio, minimo alla fine.
`pdp-levels.json` | L1/L2/L3 — quali esercizi vede ciascun livello, dopo quanti errori compare il supporto visivo, quale modello di quantità usare (fette o striscia).
`misconceptions.json` | I 3 tipi di errore riconosciuti, più `non_classificato`.
`fixtures.json` | 22 spiegazioni pre-validate, indicizzate per chiave composta `<step>-<livello>-<misconcetto>`.
`clinical-denylist.json` | 30 termini che non possono raggiungere lo schermo.
`parent-language.json`, `fraction-labels.json` | Copy della scheda famiglia, etichette delle frazioni.

Tre audience, tre viste: **studente** (`?role=student`) una cosa alla volta, **docente**
(`?role=teacher`) configurazione PDP e resoconto, **famiglia** (`?role=parent`) scheda in
lingua piana. Senza `?role=` si entra dalla home e si dichiara chi sta entrando: l'app non
assume che sia lo studente.

## Dove interviene l'AI, e dove no

Trasparenza richiesta dal brief Hagenthon, e comunque la parte più interessante.

**L'AI scrive le spiegazioni.** Un LLM (`nex-agi/nex-n2.5-mini:free` via OpenRouter) genera
il testo di remediation per ogni combinazione esercizio × livello × misconcetto, con il
prompt di [`app/remediation-prompt.js`](app/remediation-prompt.js).

**Non le scrive durante la demo.** Le 22 spiegazioni sono generate in batch *prima*
(`DEMO_MODE = true`, valore di default) e servite da `fixtures.json`: latenza in decine di
millisecondi, zero rete, nessun rate limit davanti alla giuria. Il **live slot** —
`DEMO_MODE = false` dalla console — mostra la stessa cosa generata dal vivo, con timeout a
3 secondi e fallback garantito. Gira sullo stesso prompt delle fixture proprio perché la
voce narrativa non stoni nel confronto.

**La supervisione umana c'è ed è documentata.** Il gate di contenuto ha bocciato 6 fixture
sulle 10 del primo batch: una matematicamente sbagliata, tre ambigue, una con un termine
fuori registro, due con frasi oltre le 15 parole. Riscritte a mano, non rigenerate — la
disciplina di sprint vieta richieste extra per rifinire una fixture. Il dettaglio è in
[`RUN-REPORT-P-A.md`](RUN-REPORT-P-A.md) e il consumo richieste in
[`app/openrouter-budget.md`](app/openrouter-budget.md) (16 su 50 disponibili).

**L'AI non decide nulla di didattico.** Livello PDP, progressione, soglia di stop e
messaggio di stop sono dati e codice, non generazione. `STOP_MESSAGE` è hardcoded in
`engine.js` per obbligo: è il confine tra didattica e presa in carico, e non può arrivare
da un modello.

Il PoC è stato **scritto con agentic coding** dentro una factory multi-agente
([`PATTERN.md`](PATTERN.md) v2.42): il kanban in [`management/`](management/), le decisioni
di progetto in [`wiki/`](wiki/). Il piano dello sprint è
[`management/kanban/sprint.md`](management/kanban/sprint.md).

## Limiti e rischi

- **Non è uno strumento clinico.** NumeriMiei potenzia l'uso di uno strumento compensativo
  già previsto da un PDP esistente. Non diagnostica, non riabilita, non valuta. Il footer
  di Legge 170/2010 è permanente su tutte le viste e non è decorativo.
- **Il confine clinico è codice, non buone intenzioni.** Un solo punto d'ingresso verso il
  DOM (`getSafeRemediation`), denylist applicata allo scarto *integrale* del testo — non al
  filtraggio parziale — e un solo writer del livello PDP. Verificato da test che iniettano
  termini clinici nelle fixture e controllano che non arrivino a schermo.
- **Copertura ristretta.** Un'area (confronto di frazioni), 3 misconcetti, 7 esercizi. Basta
  a mostrare l'adattamento, non a coprire un anno scolastico.
- **Nessun dato lascia il dispositivo, e nessun dato persiste.** Sessione in `localStorage`,
  azzerata alla sessione successiva. Nessun profilo, nessun account, nessun invio.
- **L'AI può sbagliare la matematica.** È già successo, in una fixture su dieci. Per questo
  la generazione è batch e revisionata, non in tempo reale sul bambino.

## Verifiche

Otto suite, un comando. Nessun costo API (il live slot reale è escluso per default).

```bash
bash app/tests/run-all.sh              # tutte le suite, avvia il proxy se serve
bash app/tests/run-all.sh --quick      # salta le 3 suite che aprono un browser
bash app/tests/run-all.sh --live       # + live slot reale (COSTA 1 richiesta OpenRouter)
```

| Suite | Cosa verifica |
|---|---|
`e2e.mjs` (×2) | Engine, explainer, router, report — 32 asserzioni, girate sul curriculum di riferimento e su quello di produzione
`content-gate.mjs` | Le fixture: denylist, registro non tecnico, lunghezza frasi, immagine discreta per L1 e lineare per L2
`clinical-gate.sh` | Un solo entry point, un solo writer di `pdpLevel`, zero prosa didattica nel codice. Include `static-copy-gate.mjs` sulla copy statica
`offline-check.mjs` | Flusso completo con la rete irraggiungibile, senza browser
`browser-e2e.mjs` | Flusso reale in Chromium, richieste di rete incluse
`a11y-gate.mjs` | WCAG 2.2 AA: contrasto su testo realmente visibile, focus, `tabular-nums`, `prefers-reduced-motion`, feedback non affidato al solo colore
`offline-browser.mjs` | Rete staccata a sessione avviata, proxy compreso

Le tre suite browser richiedono Playwright/Chromium; senza, si usa `--quick`.

> **Stato al 2026-09-14: 8 suite su 8 verdi**, live slot escluso.
>
> Ci si è arrivati nell'ultimo giro. Il curriculum di produzione è passato da 3 a 7
> esercizi e per un po' quattro suite sono state rosse: tre perché avanzavano a passo
> fisso dando per scontato che l'esercizio di verifica fosse il terzo, una perché il
> contrasto del paragrafo *"Report al termine della sessione"* in vista docente stava a
> 4.27:1 contro il minimo AA di 4.5:1. Entrambe le cose sono chiuse.

## Deliverable e documentazione

| Dove | Cosa |
|---|---|
[`presentation/numerimiei-deck.html`](presentation/numerimiei-deck.html) | Deck 5 slide. Copre i 6 criteri obbligatori del brief, con kicker espliciti ①–⑥
[`presentation/demo-script.html`](presentation/demo-script.html) | Script demo, 4 minuti con timestamp
[`wiki/syntheses/hagenthon-2026-overview.md`](wiki/syntheses/hagenthon-2026-overview.md) | Contesto hackathon, tema scelto, mapping dei criteri
[`wiki/decisions/`](wiki/decisions/) | Registro della tavola rotonda che ha scelto tema e prodotto
[`design_&_architecture/ui-review-2026-09-14.md`](design_&_architecture/ui-review-2026-09-14.md) | Review grafica e funzionale: 10 difetti trovati eseguendo l'app, e come sono stati chiusi
[`RUN-REPORT-P-A.md`](RUN-REPORT-P-A.md) · [`HANDOFF-P-B.md`](HANDOFF-P-B.md) | Le due metà dello sprint: cosa è stato consegnato e con quali contratti

## Estendere

Gli extension point sono dati, non codice — ed è una promessa verificata dai test, non
soltanto una slide.

- **Nuovo tipo di errore** → una voce in `misconceptions.json` + i distrattori che lo
  citano nel curriculum + le fixture per quella chiave
- **Nuovo distrattore** → una voce nell'array `distractors` del curriculum, reload, appare
- **Nuovo esercizio** → una voce in `steps`, con `label` e `includes_levels` coerenti
- **Nuova area matematica** → un nuovo `curriculum-*.json`
- **Nuova lingua** → i `label` dei distrattori e le fixture

Serve il live slot? La chiave OpenRouter va in `.env` alla root come `OPEN_ROUTER_KEY`
(oppure `OPENROUTER_API_KEY`), e il setup completo è in
[`wiki/runbooks/openrouter-setup-hagenthon.md`](wiki/runbooks/openrouter-setup-hagenthon.md).
I provider free di Google sono risultati saturi a livello di pool condiviso: non usarli
come fallback durante una demo.
