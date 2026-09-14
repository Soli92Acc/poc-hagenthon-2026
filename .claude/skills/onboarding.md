---
id: onboarding
version: v1.0
layer: docs
trigger: /onboarding
description: >
  Skill invocabile da un nuovo contributor o agente. Produce un report
  in-chat contestuale (nessun file scritto) con 4 sezioni: factory corrente,
  task onboarding-friendly, 5 invarianti critiche lette da PATTERN.md §7,
  passo successivo statico. Tecnologia-agnostica — legge solo file locali.
---

# Skill: onboarding

> Invocazione: `/onboarding`
> Output: esclusivamente in-chat. **Nessun file viene scritto** (`wiki/`,
> `management/`, o qualsiasi altra directory).
> Sorgenti dichiarate: `factory.config.yaml`, `management/kanban/sprint.md`,
> `PATTERN.md`, `.claude/agents/`.

---

## Procedura

Esegui i passi seguenti nell'ordine. Ogni passo legge una sorgente locale;
non inventare mai dati non presenti nelle sorgenti (invariante R.2).

---

### Passo 1 — Leggi `factory.config.yaml`

Leggi il file `factory.config.yaml` dalla root del repo.

Estrai e presenta come **Sezione 1 — Factory corrente**:

1. **Versione factory** → campo `pattern_version` (o `project.pattern_version`).
2. **Capability attive** → tutte le chiavi di primo livello (o sottochiave) che
   contengono `enabled: true`. Presenta come lista compatta `- <nome>: true`.
   Non elencare capability con `enabled: false` o assenti.
3. **Agenti installati** → conta i file `*.md` presenti in `.claude/agents/`.
   Mostra il conteggio numerico (es. "17 agenti").

Formato atteso per la sezione:

```
## Sezione 1 — Factory corrente

| Campo | Valore |
|---|---|
| Pattern version | <pattern_version> |
| Agenti installati | <N> file in .claude/agents/ |

### Capability attive (enabled: true)
- <capability-1>
- <capability-2>
- ...
```

---

### Passo 2 — Leggi `management/kanban/sprint.md`

Leggi il file `management/kanban/sprint.md`.

Presenta come **Sezione 2 — Task onboarding-friendly**:

- **Caso A**: se esistono task con `status: todo` **e** tag `onboarding-friendly`
  (o etichetta equivalente nel frontmatter/testo), mostrali tutti con ID, titolo
  e file sprint di riferimento.
- **Caso B**: se nessun task ha il tag `onboarding-friendly`, mostra i **3 task
  in `status: todo`** con effort stimato più basso (campo `effort:` o `estimate:`
  nel frontmatter; in assenza di campo effort, considera i task più brevi come
  descrizione). Indica esplicitamente «Nessun tag onboarding-friendly trovato —
  mostro i 3 task a minor effort».

Includi sempre il link al file sprint:
`→ Sprint file: management/kanban/sprint.md`

---

### Passo 3 — Leggi `PATTERN.md §7` (live — non hardcodare)

**Leggi il file `PATTERN.md`** dalla root del repo.

Individua la sezione `§7` (titolo esatto: cerca `## §7` o `# §7` o la sezione
intitolata "Invarianti" / "Invarianti inviolabili"). Estrai il testo delle sole
invarianti **R.1, R.2, R.5, R.12, R.14** riassumendole in una riga ciascuna.

> IMPORTANTE: il testo delle invarianti deve provenire dalla lettura diretta di
> `PATTERN.md` — **non hardcodare il testo in questa skill**. Se il testo in
> `PATTERN.md` viene aggiornato, il report si aggiorna automaticamente.

Presenta come **Sezione 3 — 5 invarianti critiche**:

```
## Sezione 3 — 5 invarianti critiche (da PATTERN.md §7)

| Invariante | Sintesi |
|---|---|
| R.1  | <estratto sintetico da PATTERN.md §7> |
| R.2  | <estratto sintetico da PATTERN.md §7> |
| R.5  | <estratto sintetico da PATTERN.md §7> |
| R.12 | <estratto sintetico da PATTERN.md §7> |
| R.14 | <estratto sintetico da PATTERN.md §7> |

_Il testo viene letto da `PATTERN.md §7` — si aggiorna automaticamente._
```

---

### Passo 4 — Sezione statica: passo successivo

Appendi **sempre** questa sezione statica al report, senza modifiche:

```
## Sezione 4 — Passo successivo

→ Leggi: wiki/onboarding/start-here.md
→ Ciclo di sviluppo: wiki/onboarding/dev-cycle.md
→ Hai domande? wiki/onboarding/faq.md
```

---

## Vincoli

| Vincolo | Dettaglio |
|---|---|
| Nessun file scritto | Output esclusivamente in-chat. Non creare file in `wiki/`, `management/` o altrove. |
| No invenzione (R.2) | Ogni dato mostrato deve provenire da una delle sorgenti dichiarate. Se un file non esiste o un campo è assente, dillo esplicitamente. |
| Lettura live PATTERN.md | Il testo di §7 va letto al momento dell'invocazione — non è hardcodato in questa skill. |
| Tecnologia-agnostica | La skill usa solo lettura di file locali. Nessun tool esterno, nessuna rete. |
| Self-documenting | Ogni sezione dichiara la propria sorgente (es. «letto da factory.config.yaml»). |

---

## Gestione errori

- **`factory.config.yaml` assente**: segnala «`factory.config.yaml` non trovato —
  verifica di essere nella root della factory». Continua con le sezioni successive.
- **`management/kanban/sprint.md` assente**: segnala «sprint.md non trovato —
  consulta `management/kanban/` per il file sprint attivo». Mostra comunque le
  sezioni 3 e 4.
- **`PATTERN.md` assente o §7 non localizzabile**: segnala «`PATTERN.md §7` non
  trovato — le invarianti non possono essere estratte automaticamente. Leggi
  `PATTERN.md` manualmente». Non hardcodare il testo.
- **`.claude/agents/` assente**: conta = 0, segnala.
