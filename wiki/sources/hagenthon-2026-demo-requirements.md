---
title: "Hagenthon 2026 — Requisiti demo finale"
type: source
status: approved
created: 2026-09-14
source_file: raw/2026-09-14-demo-requirements.md
---

# Hagenthon 2026 — Requisiti demo finale

Documento sorgente estratto da `raw/2026-09-14-demo-requirements.md`, che trascrive
verbatim la sezione "Una demo finale" del brief ufficiale Hagenthon 2026 (originale
in `raw/image.png`).

**Natura del contenuto:** requisiti normativi di valutazione — non descrittivi.
La demo *deve* mostrare tutti e 6 i punti per essere considerata completa.

## I 6 criteri obbligatori (verbatim dal brief)

> La demo dovrà mostrare:
>
> 1. il problema scelto
> 2. l'utente o lo scenario di riferimento
> 3. come funziona la soluzione
> 4. dove interviene l'agente AI
> 5. quale miglioramento viene prodotto
> 6. quali limiti o rischi sono stati considerati

[^src: raw/2026-09-14-demo-requirements.md §Trascrizione verbatim]

## Copertura in NumeriMiei — mapping verificato

Il mapping è stato verificato leggendo direttamente `presentation/numerimiei-deck.html`.
Ogni slide contiene il kicker con il numero del criterio corrispondente (①②③④⑤⑥).

| # | Criterio (verbatim) | Slide | Contenuto verificato |
|---|---------------------|-------|----------------------|
| 1 | il problema scelto | 2 | Misconcepto `denominator_magnitude`: 1/4 > 1/3 "perché 4 > 3". Kicker esplicito ① |
| 2 | l'utente o lo scenario di riferimento | 2 | LPS Luca, 11 anni, 1ª media, PDP 2025, discalculia certificata. Kicker esplicito ② |
| 3 | come funziona la soluzione | 3 | Flow: Docente → MCQ → AI Explainer → Remediation → Transfer Task. Kicker esplicito ③ |
| 4 | dove interviene l'agente AI | 3 | Fixture lookup + `getSafeRemediation()` come unico entry point + denylist clinico. Kicker esplicito ④ |
| 5 | quale miglioramento viene prodotto | 4 | Before/after + transfer task 1/5 vs 1/6 risolto autonomamente (`solvedWithoutScaffold=true`). Kicker esplicito ⑤ |
| 6 | quali limiti o rischi sono stati considerati | 5 + chiusura parlata | Copertura limitata (dato corretto dal 2026-09-14, G_003 chiusa), LLM non deterministico in fallback, confine clinico grep-verificabile, linguaggio ≤15 parole. Kicker esplicito ⑥. **Coperto due volte, di proposito** — vedi §Due superfici |

**Tutti e 6 i criteri coperti** in `presentation/numerimiei-deck.html` (slide 2–5).
Script demo 4 minuti con timestamping in Slide 6.

**Nota sulla validità:** il mapping è una verifica puntuale al 2026-09-14, non un
vincolo attivo. Se il deck cambia, va rivalidato a mano: nessun gate di EP-004
referenzia oggi questi 6 criteri.

[^src: raw/2026-09-14-demo-requirements.md §Mapping su NumeriMiei (sprint 01)]


## Due superfici di copertura — la slide dimostra, la battuta dichiara

Dal 2026-09-14 i 6 criteri sono coperti da **due artefatti distinti**, ed è voluto:

| Superficie | File | Natura della copertura |
|---|---|---|
| Slide | `presentation/numerimiei-deck.html` | **Dimostra** — kicker ①–⑥, evidenza visiva a schermo |
| Script demo | `presentation/demo-script.html` §6 | **Dichiara** — le stesse 6 voci mappate sulle frasi dette a voce |

Il criterio 6 è l'unico coperto **due volte**: slide 5 (riquadro rischi) e chiusura
parlata («non è riabilitazione clinica»). Ridondanza deliberata, non duplicazione da
sanare: il confine clinico è la rivendicazione più esposta del progetto e regge meglio
se è scritta *e* detta.

**Conseguenza per chi rivalida:** cambiare una slide non basta più a invalidare il
mapping, ma non basta nemmeno a ripararlo. Vanno guardate entrambe le superfici.


## Copertura reale — dati verificati su `app/data/` (2026-09-14)

Numeri segnalati dalla sessione `poc-hagenthon-2026-d4` e **verificati direttamente**
su `app/data/curriculum-discalculia.json`, `app/data/fixtures.json`,
`app/data/misconceptions.json`, `app/data/pdp-levels.json`.

| Grandezza | Valore verificato |
|---|---|
| Misconcetti modellati nel curriculum | **3** — `denominator_magnitude`, `numerator_focus`, `round_number_bias` |
| Misconcetti con spiegazioni pre-validate offline | **2** — `denominator_magnitude`, `numerator_focus` (22 chiavi in `fixtures.json`, step1–step6, livelli L1/L2) |
| Misconcetti volutamente scoperti | **1** — `round_number_bias`: zero chiavi in `fixtures.json` a qualunque livello |
| Esercizi nel curriculum | **7** step, **1 item per step** |
| Esercizi visibili per livello | L1 → 5, L2 → 6, L3 → 7 (filtro via `includes_levels` in `pdp-levels.json`) |
| Ordine di gioco per livello | L1 → step1, step4, step5, step6, **step3** · L2 → +step2 prima di step3 · L3 → +step2, step7 prima di step3 |
| Step di transfer | **1** — `step3` (1/5 vs 1/6), unico con `scaffold: false` e `transfer: true`; **ultimo step a tutti e tre i livelli** |

`round_number_bias` è scoperto **per costruzione**, non per una svista né per una
forzatura manuale. Il meccanismo, verificato in `app/explainer.js:146-163`: la catena
prova la chiave esatta, poi *degrada per livello* cercando lo stesso `step_id` negli
altri livelli — ma il loop itera solo su `['L1','L2']`, e `step7` non ha chiavi in
`fixtures.json` a nessun livello. Nessun ramo della catena può risolverlo da file.
È il motivo per cui è l'unico punto in cui si arriva davvero al modello. È la dimostrazione del percorso
generativo dal vivo, non una lacuna. Dal 2026-09-14 `step7` è **penultimo** a L3:
il live probe resta raggiungibile, ma la sessione si chiude sempre sul transfer.

**Condizione necessaria:** la chiamata al modello parte solo con `DEMO_MODE = false`
(`app/explainer.js:158`). Col default `DEMO_MODE = true` anche `step7` ricade sul testo
di ripiego fisso, e la generazione dal vivo non avviene. Lo script demo lo gestisce
esplicitamente (`presentation/demo-script.html:598` — toggle da console prima del passaggio).

**Formulazione corretta del limite** (da usare al posto di "copertura limitata: 2
misconcepit"): *3 misconcetti modellati, 2 con spiegazioni pre-validate offline,
1 lasciato scoperto per la generazione dal vivo.*

**I limiti che reggono ancora** e restano dichiarabili come tali: un solo dominio
matematico (confronto di frazioni unitarie, denominatori fino a 10) e un solo item
per step.

**Invariante ora verificata dai test:** `app/tests/e2e.mjs` ("L1 e contenuto in L2, e
il transfer chiude entrambi i percorsi") asserisce su L1, L2 **e L3** che esista un solo
step con `scaffold: false` e che sia in ultima posizione. Eseguita in questa sessione:
32/32 PASS. Prima del 2026-09-14 l'assunzione non era coperta e a L3 era falsa
(`step7` chiudeva la sessione con uno step scaffoldato).

[^src: verifica diretta su `app/data/` + esecuzione `node app/tests/e2e.mjs` — 2026-09-14; segnalazione originaria da sessione `poc-hagenthon-2026-d4`]

## Pagine collegate

- Synthesis: [[wiki/syntheses/hagenthon-2026-overview.md]]
- Decisione prodotto: [[wiki/decisions/tavola-rotonda-e3f2a1b4-7c5d-4e8f-9a0b-2d6c3f1e4b7a-2026-09-14.md]]
