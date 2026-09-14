# Prompt operativo — P-B (UI / contenuto / a11y)

> **Da incollare interamente nella prima sessione Claude Code del collega, dentro il clone
> di `poc-hagenthon-2026`.** Contiene tutto il necessario: task, contratti, timeline, regole
> git e regole d'uso della factory. Non serve leggere `PATTERN.md`.

---

Sei **P-B** nello sprint 01 dell'hackathon Hagenthon 2026, progetto **NumeriMiei** (PoC di
apprendimento adattivo su frazioni per studenti con discalculia). Lavori in parallelo a
**P-A**, che ha già il repo e la chiave OpenRouter.

- **Il tuo dominio:** UI, contenuto didattico, accessibilità, deck.
- **Il dominio di P-A:** proxy OpenRouter, engine, explainer/LLM, fixture, QA end-to-end.
- **Budget:** 240 minuti di sviluppo puro + 45 minuti di demo prep. Stop dev netto a 4:00.

## Stato al momento in cui ricevi questo

La metà di P-A è già in piedi. **Non stai aspettando niente da nessuno.**

- I quattro moduli che importi (`engine.js`, `explainer.js`, `router.js`,
  `session-report.js`) sono **implementati e testati**, non stub: 32/32 test verdi.
- `data/fixtures.json` ha **tutte e 10 le chiavi** di remediation raggiungibili: qualunque
  distrattore venga cliccato, il testo è pre-validato. `data/pdp-levels.json` e
  `data/clinical-denylist.json` ci sono.
- **Esiste un curriculum di riferimento conforme a CT-1** in
  `app/tests/fixtures/curriculum-sample.json`. Per TSK-006 **copialo e adattalo**: ha già
  dentro la correzione dello step 2 descritta in §10.2. Ti risparmia quasi tutti i 25 minuti.
- **Un solo server:** `python3 app/proxy.py` serve i file statici *e* il proxy su
  `http://localhost:8080`. Ignora l'istruzione sulla porta 5173 in §1, non serve.
- Dettaglio completo di cosa è stato fatto e delle correzioni al piano:
  [RUN-REPORT-P-A.md](RUN-REPORT-P-A.md).

Il pattern mock-first di §6 resta valido, ma ora ti serve solo per costruire la UI prima
che il *tuo* curriculum esista — non per aggirare un blocco.

## Regola d'oro

**La divisione non è per task, è per file.** Ogni file del repo ha un solo proprietario.
Non apri mai — nemmeno in lettura-e-riscrittura, nemmeno "per una riga" — un file di P-A.
Se ti serve qualcosa da un file di P-A, esiste già un contratto congelato (§5): programmi
contro il contratto, non contro l'implementazione.

---

## 1. Setup (primi 5 minuti)

```bash
git clone https://github.com/Soli92Acc/poc-hagenthon-2026.git
cd poc-hagenthon-2026
git config pull.rebase true
```

Servi l'app con un server HTTP statico (obbligatorio: si usano ES modules, `file://` non funziona):

```bash
cd app && python3 -m http.server 5173
```

- UI su `http://localhost:5173` — **tuo**.
- Proxy OpenRouter su `http://localhost:8080` — **di P-A**, non ti serve mai
  (lavori sempre con `DEMO_MODE = true`).

---

## 2. I tuoi task (12) + i 3 condivisi

| TSK | Cosa | File che tocchi | Priorità |
|---|---|---|---|
| **TSK-002** | `index.html` + Tailwind + HTML semantico + footer Legge 170/2010 permanente | `app/index.html` | P0 |
| **TSK-006** | `curriculum-discalculia.json`: 2 step training + 1 transfer | `app/data/curriculum-discalculia.json` | P0 |
| **TSK-005** | Componente MCQ: domanda + opzioni + regione feedback | `app/index.html`, `app/app.js` | P0 |
| **TSK-007** | Plain language review del curriculum (**gate D6**) | `app/data/curriculum-discalculia.json` | P0 |
| **TSK-013** | Form PDP docente: select L1/L2/L3 + copy obbligatorio | `app/index.html`, `app/app.js` | P0 |
| **TSK-019** | A11y set A: tabular-nums, no animazioni, contrasto, feedback non solo colore | `app/index.html` | P0 |
| **TSK-020** | A11y set B: number line CSS, frazione impilata, scaffold `visibility:hidden`, focus post-submit | `app/index.html`, `app/app.js` | P0 |
| **TSK-015** | Transfer item UI: MCQ senza number line + feedback post-risposta | `app/index.html`, `app/app.js` | P0 |
| **TSK-017** | Report HTML docente: misconcetti + frequenza per step + esito transfer | `app/index.html`, `app/app.js` | P0 |
| **TSK-018** | [COND] `toParentLanguage()` + schermata `?role=parent` | `app/data/parent-language.json`, `app/app.js`, `app/index.html` | P2 |
| **TSK-025** | [OPP] Deck slide 1-2: copertina + LPS Luca | `presentation/numerimiei-deck.md` | P1 |
| **TSK-026** | [COND] Deck slide 3-5: Adaptive Evidence + LO Note + Extension Points | `presentation/numerimiei-deck.md` | P1 |

**Condivisi (si fanno insieme, dopo le 4:00, mai in solitaria):** TSK-022 (script demo),
TSK-023 (rehearsal ×2), TSK-024 (dry run offline — **non negoziabile**).

**Di P-A, mai tuoi:** TSK-001, 003, 004, 008, 009, 010, 011, 012, 014, 016, 021.

Il dettaglio di ogni task è nel repo in `management/kanban/EP-*/US-*/TSK-0NN.md`:
leggilo sempre prima di iniziare (Technical Specs + Definition of Done sono vincolanti).

---

## 3. Matrice di proprietà dei file

| Tuoi (scrivi liberamente) | Di P-A (mai toccare) |
|---|---|
| `app/index.html` | `app/proxy.py` |
| `app/app.js` | `app/engine.js` |
| `app/mock-data.js` *(lo crei tu, §6)* | `app/explainer.js` |
| `app/data/curriculum-discalculia.json` | `app/router.js` |
| `app/data/parent-language.json` | `app/session-report.js` |
| `app/vendor/**` | `app/data/fixtures.json` |
| `presentation/numerimiei-deck.md` | `app/data/clinical-denylist.json` |
| I **tuoi** file `management/kanban/**/TSK-0NN.md` | `app/data/pdp-levels.json` |

**Zona rossa — non committare mai, nemmeno se modificati da un agente:**
`management/kanban/sprint.md` (rigenerato solo da P-A), `wiki/**`, `memory/**`,
`analytics/**`, `code_quality/**`, `factory.config.yaml`, `CLAUDE.md`, `PATTERN.md`.

---

## 4. Cosa cambia rispetto al piano di sprint (leggi, è importante)

Il piano originale mette `initRouter()` (TSK-012, P-A) e `getSessionReport()` (TSK-016, P-A)
dentro `app.js` — che è **tuo**. Sarebbe garanzia di conflitto a ogni commit.

**Risoluzione:** quelle due funzioni escono da `app.js` e diventano moduli di P-A:

- TSK-012 → `app/router.js`
- TSK-016 → `app/session-report.js`

Tu li **importi**, non li scrivi. `app.js` resta al 100% tuo. Nessun altro cambiamento
al piano, agli slot o ai gate.

---

## 5. Contratti di interfaccia — CONGELATI

Questi cinque contratti sono legge per entrambi. Non si rinegoziano in corsa senza
accordo verbale esplicito + push immediato.

### CT-1 — `data/curriculum-discalculia.json` (tu produci, l'engine di P-A consuma)

```json
{
  "steps": [
    {
      "step_id": "step1",
      "level": "L1",
      "scaffold": true,
      "transfer": false,
      "question": "Quale è più grande: 1/3 o 1/4?",
      "items": [
        {
          "fraction_a": "1/3",
          "fraction_b": "1/4",
          "correct": "d1",
          "distractors": [
            { "id": "d1", "label": "1/3", "misconcepto_slug": null, "position_pct": 0.333, "correct": true },
            { "id": "d2", "label": "1/4, perché 4 è più grande di 3", "misconcepto_slug": "denominator_magnitude", "position_pct": 0.25, "correct": false },
            { "id": "d3", "label": "Sono uguali, il numeratore è 1 in tutte e due", "misconcepto_slug": "numerator_focus", "position_pct": 0.25, "correct": false }
          ]
        }
      ]
    }
  ]
}
```

Vincoli **non negoziabili** (le chiavi delle fixture LLM di P-A ci si appoggiano sopra):

- `step_id` ∈ `{"step1","step2","step3"}` — esattamente queste stringhe, minuscole.
- `level` ∈ `{"L1","L2","L1|L2"}` — `step3` (transfer) usa `"L1|L2"`.
- `misconcepto_slug` ∈ `{"denominator_magnitude","numerator_focus"}` — **esattamente
  questi due slug**, e `null` sull'opzione corretta. Il nome del campo è
  `misconcepto_slug` (sì, scritto così: è la chiave usata da P-A, non correggerla).
- `position_pct`: decimale 0-1 **precalcolato a tavolino**, mai a runtime.
  `1/2=0.5 · 1/3=0.333 · 1/4=0.25 · 1/5=0.2 · 1/6=0.167 · 1/7=0.143`.
- `step3` ha `scaffold: false` e `transfer: true`.
- Il JSON è **dati, non codice**: nessuna logica, nessun testo che duplichi comportamento.

P-A genera le fixture con chiave composta `<step_id>-<level>-<misconcepto_slug>`
(es. `step1-L1-denominator_magnitude`). Se sbagli uno slug o uno `step_id`, le fixture
non risolvono e si va in fallback: **è il singolo punto più fragile dell'integrazione.**

### CT-2 — `engine.js` (P-A produce, tu consumi)

```js
import { QuizEngine, STATES } from './engine.js';

STATES // { STEP, REMEDIATION, NEXT, STOPPED, COMPLETION }

await QuizEngine.loadCurriculum(pdpLevel);   // 'L1' | 'L2'
QuizEngine.getState();          // -> una stringa di STATES
QuizEngine.getCurrentStep();    // -> oggetto step di CT-1 (con .scaffold, .transfer, .items)
QuizEngine.submit(distractorId);// -> { correct: bool, state: string, misconcepto_slug: string|null }
QuizEngine.nextStep();          // avanza; -> COMPLETION se finiti
QuizEngine.getStopMessage();    // -> stringa fissa dopo 3 errori consecutivi

// Aggiunte rispetto al contratto iniziale (solo additive, niente rotture):
await QuizEngine.startSession();      // legge pdpLevel da localStorage e carica; lancia se manca
QuizEngine.getCurrentItem();          // -> step.items[0], quello che renderizzi
QuizEngine.isTransferStep();          // -> true sullo step senza scaffold
QuizEngine.getScaffoldVisible();      // -> mostrare o no la number line, adesso
QuizEngine.getScaffoldPolicy();       // -> la entry di pdp-levels.json del livello corrente
QuizEngine.getRemediationKeyParts();  // -> { step_id, level, slug } pronti per getSafeRemediation
```

Flusso tipico dopo una risposta sbagliata:

```js
const esito = engine.submit(idScelto);
if (esito.state === 'REMEDIATION') {
  const { step_id, level, slug } = engine.getRemediationKeyParts();
  const { text } = await getSafeRemediation(step_id, level, slug);
  renderFeedback(text);
} else if (esito.state === 'STOPPED') {
  renderStop(engine.getStopMessage());
}
```

L'engine è **logica pura: non tocca il DOM**. Tutto il rendering è tuo.
Il messaggio di stop è hardcoded in `engine.js`, mai da LLM: lo mostri verbatim in
`#stop-region` e **rimuovi il pulsante submit dal DOM**.

### CT-3 — `explainer.js` (P-A produce, tu consumi)

```js
import { getSafeRemediation } from './explainer.js';

const { text, wasCleaned } = await getSafeRemediation(step_id, level, misconcepto_slug);
```

**Unico entry point** per qualunque testo di remediation che raggiunge il DOM (requisito
di sicurezza US-011, confine clinico). Regole per te:

- **Un solo call site** in tutto `app.js`, dentro la tua `renderFeedback()`.
- Nessun testo di remediation arriva al DOM per altre strade. Mai concatenare, mai
  interpolare pezzi di testo LLM altrove.
- Non filtri, non sanifichi, non ritocchi tu: se `wasCleaned === true` mostri `text`
  così com'è (è già il fallback sicuro).

### CT-4 — `router.js` (P-A produce, tu consumi)

```js
import { initRouter, getRole, getPdpLevel, setPdpLevel } from './router.js';

initRouter({ student: renderStudentView, teacher: renderTeacherView, parent: renderParentView });
getPdpLevel();        // -> 'L1' | 'L2' | 'L3' | null
setPdpLevel('L1');    // usato dal form PDP docente (TSK-013)
```

`initRouter` riceve **le tue** funzioni di render: P-A non le conosce e non le chiama
per nome. Round-trip del ruolo via URL param + reload. **Nessun `addEventListener('storage')`**:
niente sync cross-tab, è una scelta di design (PA-R2-1).

### CT-5 — `session-report.js` (P-A produce, tu renderizzi in TSK-017)

```js
import { getSessionReport } from './session-report.js';

getSessionReport();
// {
//   stepsData: [ { step_id: 'step1', attempts: 3, misconceptErrors: [ { slug: 'denominator_magnitude', count: 2 } ] } ],
//   transferOutcome: 'Transfer completato autonomamente' | 'Transfer non completato autonomamente'
// }
```

**Nessun punteggio numerico prominente nel report.** Niente "73% corretto": il report
mostra fatti specifici (quali misconcetti, quante volte, su quale step). È un requisito
di prodotto, non uno stile.

---

## 6. Mock-first: non aspetti mai P-A

Con i contratti sopra congelati, **nessuno dei tuoi task è realmente bloccato**. Alla riga 1
crei `app/mock-data.js` (tuo, nessuno lo tocca):

```js
export const MOCK = true;                 // -> false all'integrazione (sync S2)
export const mockStep = { /* uno step conforme a CT-1 */ };
export const mockEngine = { /* stessa firma di CT-2 */ };
export const mockRemediation = async () => ({ text: 'Spiegazione di prova.', wasCleaned: false });
export const mockReport = { /* stessa forma di CT-5 */ };
```

In `app.js` un solo punto di switch:

```js
const engine = MOCK ? mockEngine : QuizEngine;
```

Costruisci tutta la UI, la a11y e il report contro i mock. All'integrazione giri `MOCK`
a `false` e, se i contratti sono rispettati, non cambia nient'altro. A fine giornata
`mock-data.js` resta nel repo ma non viene caricato (`MOCK = false`): non è debito da pulire
prima della demo.

---

## 7. Timeline e punti di sincronizzazione

| Slot | Task | Nota |
|---|---|---|
| 0:00–0:15 | **TSK-002** | scaffold, footer permanente, Tailwind **locale** (§9.1) |
| 0:15–0:40 | **TSK-006** | ⚠️ **prioritario**: sblocca TSK-008/009 di P-A |
| 0:40–1:05 | **TSK-005** | contro `mock-data.js` |
| 1:05–1:20 | **TSK-007** | gate D6 |
| 1:20–1:25 | commit + **TSK-025** | slide 1-2 opportunistiche |
| 1:25–1:45 | **TSK-013** | usa `setPdpLevel()` di CT-4 |
| 1:45–2:10 | **TSK-019** | a11y set A |
| 2:10–2:25 | **TSK-020** (1/2) | number line CSS + frazione impilata |
| 2:25–2:30 | **CHECKPOINT GO/NO-GO** | con P-A, 5 min, si decide lo scenario demo |
| 2:30–2:50 | **TSK-020** (2/2) | scaffold `visibility:hidden` + focus post-submit → **D5** |
| 2:50–3:10 | **TSK-015** | transfer UI — consegna **entro 3:10** |
| 3:10–3:30 | **TSK-017** | report docente — consegna **entro 3:30** |
| 3:30–3:45 | **TSK-018** [COND] | solo se GO e buffer non consumato |
| 3:45–4:00 | **TSK-026** [COND] | solo se buffer non consumato |
| **4:00** | **STOP DEV NETTO** | nessuna feature dopo questo punto |
| 4:00–4:45 | TSK-022 / 023 / 024 | insieme a P-A |

**Quattro sync, non uno di più:**

- **S0 — 0:00** · Handshake contratti. P-A pusha entro 0:10 gli **stub** di `engine.js`,
  `explainer.js`, `router.js`, `session-report.js` con le firme di CT-2..CT-5 (corpi vuoti).
  Tu confermi a voce i due `misconcepto_slug` di CT-1. Da qui in poi: silenzio operativo.
- **S1 — 0:40** · Tu pushi `curriculum-discalculia.json`. **P-A è bloccato su questo**
  (TSK-008 → TSK-009 → gate D3 all'1:25). È la tua consegna più urgente della giornata.
- **S2 — 1:25** · Gate D3 (fixture ≥6 chiavi) + D6 (curriculum validato). Fai `git pull`,
  giri `MOCK = false`, prima integrazione reale.
- **S3 — 2:25** · Checkpoint GO/NO-GO (5 min).
- **S4 — 3:10 / 3:30** · Consegni TSK-015 e TSK-017: P-A ci esegue sopra l'E2E (TSK-010)
  e poi l'offline test (TSK-011). **Ogni minuto di ritardo qui mangia il dry run.**

---

## 8. Regole git anti-conflitto

Lavorate **entrambi su `main`, in commit diretti**. Funziona solo se rispetti queste quattro regole:

1. **Mai `git add -A`, mai `git add .`, mai `git commit -a`.** Solo path espliciti:
   ```bash
   git add app/index.html app/app.js
   ```
2. **`git pull --rebase` prima di ogni commit**, e comunque almeno ogni 20 minuti.
3. **Un commit per TSK completato**, messaggio `feat(TSK-0NN): <cosa>`. Commit piccoli e
   frequenti: riducono la finestra di collisione.
4. **Se ti trovi un conflitto su un file di P-A, ti sei sbagliato tu**: `git checkout --theirs <file>`
   e avvisa. Non risolvere mai a mano dentro il dominio altrui.

Se un agente della factory ti modifica file in zona rossa (§3), semplicemente non li
aggiungi al commit: restano sporchi nel working tree, non è un problema.

---

## 9. Uso della factory (Claude Code)

La factory è configurata `full-stack-agents`, routing `fe`/`docs` → `agent`: i tuoi task
sono delegabili a un dev-agent.

- ✅ **`/dev TSK-0NN`** — dispatch esplicito di **un solo** task per volta. È il tuo comando.
- ❌ **`/run` per il dispatch a wave — NON usarlo.** Lo scheduler è attivo con
  `max_parallel: 4` e pescherebbe anche i TSK di P-A, scrivendo nei suoi file. È il modo
  più rapido per far saltare la divisione.
- ⚠️ `/lint`, `/query`, `/review`: costano tempo e scrivono in zona rossa. In una giornata
  da 4 ore, saltali. Se proprio usi `/query`, usalo con `--ephemeral`.
- Aggiorna `status: todo → done` **solo** nei tuoi `TSK-0NN.md`. `sprint.md` non si tocca:
  lo rigenera P-A a fine giornata.

---

## 10. Tre problemi noti nel piano — chiudili subito

### 10.1 Tailwind CDN vs dry run offline — risolvi in TSK-002 (~2 min)

TSK-002 prevede Tailwind da CDN, ma TSK-024 (dry run offline, **non negoziabile**) stacca
fisicamente la rete. Senza rete la CDN non carica e **la demo si presenta senza stili**.
Non fidarti della cache del browser.

Nel primo slot: scarica Tailwind in locale e referenzialo da lì.

```bash
mkdir -p app/vendor && curl -sL https://cdn.tailwindcss.com -o app/vendor/tailwind.js
```

```html
<script src="./vendor/tailwind.js"></script>
```

Committa `app/vendor/tailwind.js`. Verifica staccando il wifi e ricaricando la pagina.

### 10.2 Contraddizione sull'invariante transfer in TSK-006 — decidi e comunica

TSK-006 chiede che i denominatori **5 e 6** dello step transfer non compaiano in nessuno
step training, ma poi specifica lo step 2 training come **1/5 vs 1/7**. Le due cose non
possono valere insieme: il 5 comparirebbe in training e il transfer non sarebbe più transfer
(è esattamente il claim didattico che la giuria verificherà).

**Risoluzione proposta** — cambia lo step 2 in **1/4 vs 1/7** (denominatori dal set {3,4,7}),
lasciando il transfer 1/5 vs 1/6. Non impatta le chiavi fixture di P-A (dipendono da
`step_id` + `level` + slug, non dai denominatori). Comunicalo a P-A a S0 e vai.

### 10.3 Ordine E2E vs consegne UI — sappilo prima, non alle 3:10

TSK-010 (E2E, P-A) dipende da TSK-015 e TSK-017, che nel tuo slot finiscono alle 3:10 e 3:30.
P-A eseguirà l'E2E in due passate (core L1/L2 alle 3:10, transfer+report alle 3:30). Se sei
in ritardo, **avvisa subito**: meglio consegnare TSK-015 monco alle 3:10 che completo alle 3:25.

---

## 11. Sequenza di taglio (se sei in ritardo, in quest'ordine)

1. **TSK-018** — view genitore (P2, fuori dal piano base): la prima a cadere.
2. **TSK-020** frazione impilata → slash con gap ≥8px (−20 min).
3. **TSK-020** sticky-top della domanda (−15 min).
4. **TSK-015** transfer item: riduce il claim a "task completion" — onesto, non un bluff.

**Mai tagliate, in nessuno scenario:** denylist clinica e unico entry point di remediation,
footer Legge 170/2010 permanente, i must-have a11y restanti, il dry run offline.

---

## 12. Checklist di consegna (verifica prima delle 4:00)

- [ ] La pagina si carica e funziona **con il wifi staccato** (Tailwind locale, zero CDN).
- [ ] `?role=student` senza `pdpLevel` mostra il messaggio di configurazione, non un errore JS.
- [ ] `?role=teacher` → form PDP → salva → `?role=student` parte con il livello giusto.
- [ ] Flusso L1: errore → remediation → riprova → avanza. Tre errori → messaggio di stop,
      pulsante submit rimosso.
- [ ] Un solo call site di `getSafeRemediation` in `app.js`.
- [ ] Numeri in `tabular-nums`, zero animazioni, `prefers-reduced-motion` rispettato,
      feedback mai veicolato dal solo colore, focus outline 3px visibile.
- [ ] Report docente: misconcetti per step + esito transfer, **nessuna percentuale**.
- [ ] Footer Legge 170/2010 visibile su **tutte** le schermate.
- [ ] `git status` pulito sui tuoi file; zero file di P-A o di zona rossa nei tuoi commit.
