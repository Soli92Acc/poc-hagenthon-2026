# NumeriMiei — Hagenthon 2026 — Tema 03

> Controparte testuale di `numerimiei-deck.html` (sorgente per l'export PPT).
> Se cambia una slide, cambiano entrambi i file. Brand: Accenture — viola `#A100FF`,
> marchio in basso a destra su ogni slide interna.

---

## Slide 1 — Copertina

**accenture** › Application Engineering

Hagenthon 2026 · Tema 03 — Educazione Digitale Inclusiva · Sprint 01

### NumeriMiei

**Coach di calcolo che spiega l'errore giusto allo studente con discalculia**

| | |
|---|---|
| Tecnologie | OpenRouter · nex-n2.5-mini:free · ES Modules · Tailwind locale |
| Tre viste, tre compiti | Studente · Docente · Famiglia |

Demo coprirà: ① Problema ② Utente ③ Soluzione ④ Intervento AI ⑤ Miglioramento ⑥ Rischi

---

## Slide 2 — Problema + Utente  [① ②]

**Un errore sistematico, non una lacuna generica**

**Il problema — misconcetto `denominator_magnitude`**

- Risposta sbagliata: 1/4 > 1/3, «perché 4 > 3»
- La realtà: 1/3 > 1/4 — più pezzi = pezzi più piccoli

Le app di esercizi dicono *«sbagliato, riprova»*. NumeriMiei riconosce **il tipo di
errore** dietro la risposta — uno dei **3 misconcetti** modellati — e spiega quello.

**L'utente — LPS Luca**

- Luca, 11 anni, 1ª media
- Discalculia certificata (PDP 2025)
- Difficoltà: confronto frazioni con denominatori diversi
- Misconcetto attivo: `denominator_magnitude`

> "La 1/4 è più grande perché 4 è più grande di 3"

Linea delle frazioni: 1/4 dove Luca la colloca · 1/3 dov'è davvero.

Il compito tornato con la crocetta rossa non gliel'ha mai detto. Un docente di sostegno
gli spiegherebbe *quell'*errore, e gli metterebbe davanti la linea delle frazioni — lo
strumento che il suo PDP già prevede.

---

## Slide 3 — Come funziona + AI  [③ ④]

**MCQ adattivo + spiegazione generata, con il confine clinico nel codice**

Flusso: Docente (livello PDP L1/L2/L3) → Percorso adattivo (7 esercizi filtrati:
L1→5, L2→6, L3→7) → **Spiegazione AI** (per misconcetto e per livello) → Supporto che
si ritira (linea + modello di quantità, soglia decisa dal PDP) → Verifica (1/5 vs 1/6,
senza alcun supporto).

**Dove interviene l'AI — catena a tre anelli**

- L'engine classifica la risposta sbagliata in un `misconcetto_slug`
- **1.** `fixtures.json` — 22 spiegazioni pre-validate, indicizzate per *esercizio ×
  livello × misconcetto*. Zero rete, decine di ms
- **2.** *live slot* OpenRouter `nex-n2.5-mini:free` — solo con `DEMO_MODE=false`,
  timeout 3s
- **3.** fallback fisso — sempre disponibile, anche a rete staccata
- Tutto esce da `getSafeRemediation()`: unico punto verso il DOM, denylist di 30
  termini a scarto integrale

**Stessa domanda, stesso errore, livello diverso**

| L1 — supporto immediato | L2 — supporto differito |
|---|---|
| "Attenzione: un denominatore più grande significa pezzi più piccoli! Guarda la linea." | "Guarda i pezzi, non solo il numero in basso. Più pezzi uguali = pezzi più piccoli." |

Chiavi `step1-L1-denominator_magnitude` e `step1-L2-denominator_magnitude`.

**Dove l'AI non decide.** Livello PDP, progressione, soglia di stop e `STOP_MESSAGE`
sono dati e codice, non generazione. Il messaggio di stop è hardcoded per obbligo: è il
confine tra didattica e presa in carico.

**Supervisione umana.** Il gate di contenuto ha bocciato **6 fixture su 10** del primo
batch — 1 matematicamente sbagliata, 3 ambigue, 1 fuori registro, 2 oltre le 15 parole.
Riscritte a mano, non rigenerate.

---

## Slide 4 — Miglioramento  [⑤]

**Il supporto si ritira, e l'ultimo esercizio misura se è servito**

**Il supporto segue il livello PDP, non lo step**

| | L1 | L2 | L3 |
|---|---|---|---|
| Esercizi | 5 | 6 | 7 |
| Supporto visivo | dal 1° errore | dal 2° errore | mai |
| Modello di quantità | fette | striscia | striscia |
| Denominatore max | 6 | 10 | 10 |

Accanto alla linea compare il **modello di quantità** — il salto che la discalculia
rende costoso è simbolo → quantità, e due numeri su una retta sono entrambi simboli.

**Prima e dopo, sullo stesso studente**

| Prima | Dopo — esercizio di verifica |
|---|---|
| Sceglie la frazione col numero più grande sotto: 1/4 → "più grande" | Usa la linea **su un item mai visto, senza supporto a schermo**: 1/5 > 1/6 → autonomo |

`step3` è l'unico con `scaffold: false` ed è l'ultimo a tutti e tre i livelli: la
sessione chiude sempre su una misura, mai su un aiuto.

**Cosa vede il docente — e cosa non gli diamo**

- Tentativi per esercizio, e se è stato preso al primo colpo
- Se è servito il supporto, per ciascun esercizio, non in media
- **Nessun punteggio**, di proposito: il resoconto è in parole, non in percentuali

---

## Slide 5 — Limiti e rischi  [⑥]

**I limiti sono dichiarati, e i presidi sono verificabili**

**Rischi considerati**

- **L'AI può sbagliare la matematica.** È già successo, in una fixture su dieci.
  *Mitigazione:* generazione in batch e revisionata, mai in tempo reale sul bambino.
- **Copertura ristretta.** Un solo dominio (frazioni con numeratore 1, denominatori
  fino a 10). 3 misconcetti modellati: 2 con spiegazioni pre-validate, 1 lasciato
  scoperto di proposito per la generazione dal vivo.
  *Mitigazione:* curriculum JSON estendibile senza codice.
- **LLM non deterministico nel live slot.** La risposta varia tra sessioni.
  *Mitigazione:* timeout 3s, fallback fisso garantito, denylist deterministica a valle.
- **Confine riabilitazione / strumento.** Potenzia uno strumento già previsto dal PDP.
  Non diagnostica, non riabilita, non valuta. Footer Legge 170/2010 permanente su ogni vista.
- **Nessun dato lascia il dispositivo.** Sessione in `localStorage`, azzerata alla
  successiva. Nessun profilo, nessun account, nessun invio.

**Verificato, non promesso**

```
bash app/tests/run-all.sh
→ 8 suite su 8 verdi   (2026-09-14)
```

| Suite | Cosa verifica |
|---|---|
| `clinical-gate.sh` | un solo entry point verso il DOM, un solo writer di `pdpLevel` |
| `content-gate.mjs` | denylist, registro non tecnico, frasi ≤ 15 parole |
| `a11y-gate.mjs` | WCAG 2.2 AA su browser vero: contrasto, focus, reduced-motion |
| `offline-browser.mjs` | rete staccata a sessione avviata, proxy compreso |

Il confine clinico è **codice, non buone intenzioni**: la denylist scarta il testo *per
intero*, non filtra le parole. I test iniettano termini clinici nelle fixture e
controllano che non arrivino a schermo.

---

## Slide 6 — Demo live + estensione

**Sequenza live** — target 3:00, stop a 4:00

| | |
|---|---|
| 0:00 | Apertura — chi è Luca, home con le tre schede profilo |
| 0:12 | La docente configura **L1 — supporto visivo immediato** |
| 0:32 | Luca sbaglia — `denominator_magnitude` riconosciuto |
| 0:57 | Spiegazione mirata, compare la linea, riprova, avanza |
| 1:32 | Raccordo — tre esercizi, divario che si stringe |
| 2:00 | Verifica — «Prova questa!», 1/5 vs 1/6, nessun supporto |
| 2:30 | **Live probe** — `step7`, l'esercizio per cui non abbiamo scritto niente |
| 3:10 | Chiusura — il limite dichiarato a voce |

**Il live probe non è una scenografia.** `step7` non ha chiavi in `fixtures.json` a
nessun livello: è l'unico punto in cui la catena arriva davvero al modello. Con
`DEMO_MODE=false` la spiegazione nasce sul palco. Budget OpenRouter: 16 richieste su 50,
la demo ne prevede **1**.

**Estendere è un dato, non un commit**

- **EP-1:** nuovo tipo di errore → voce in `misconceptions.json` + distrattori + fixture
- **EP-2:** nuovo distrattore → voce nell'array, reload, appare (30s)
- **EP-3:** nuovo esercizio → voce in `steps` con `label` e `includes_levels`
- **EP-4:** nuova area o nuova lingua → nuovo `curriculum-*.json`

Promessa verificata dai test: le suite derivano il percorso dal curriculum, non lo assumono.

**Cosa resta aperto — e perché non l'abbiamo chiuso**

- Pulsante *«fammi vedere»* per lo studente — coerente con lo strumento compensativo
  come diritto, ma renderebbe ambigua la colonna «supporto usato» del resoconto
- Sintesi vocale — `speechSynthesis`, locale e a costo quasi nullo. Esclusa per non
  aggiungere superficie non testata a ridosso della demo
- Un solo transfer — con due verifiche l'ultima sovrascriverebbe la prima: va cambiato
  il contratto, non aggiunto uno step

**Caveat invariante:** NumeriMiei potenzia l'uso di uno strumento già previsto dal PDP.
Non è riabilitazione clinica. Non prescrive diagnosi.
