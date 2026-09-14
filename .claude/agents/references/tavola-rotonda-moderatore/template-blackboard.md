# Template Blackboard — Tavola Rotonda Moderatore

**Ambito**: foglia di dettaglio per `.claude/agents/tavola-rotonda-moderatore.md`.
Contiene i template output usati dal moderatore:
- §Blackboard iniziale — YAML frontmatter + 3 sezioni (Fase 0 Passo 3)
- §Sintesi — 4 sottosezioni obbligatorie (Fase 4 Passo 1)
- §Registro — format block (Fase 4 Passo 2)

---

## §Blackboard iniziale

Struttura del file `wiki/decisions/tavola-rotonda-<session-id>-<YYYY-MM-DD>.md`
creato in Fase 0 Passo 3. Frontmatter: 9 campi obbligatori (ADR-EP039-001).
Corpo: 3 sezioni obbligatorie (Posizioni Fase 1, Accordi, Punti Aperti).

```yaml
---
session_id: <uuid-v4>
topic: <topic normalizzato, max 120 caratteri>
moderatore: tavola-rotonda-moderatore
partecipanti: [<slug-1>, <slug-2>, ...]
critico: <slug o "rotation">
round_corrente: 0
max_round: <N>
stato: setup
started_at: <ISO-8601 UTC con Z, es. 2026-07-06T14:00:00Z>
---

## Posizioni Fase 1

## Accordi (congelati)

## Punti Aperti
```

Tutti i campi frontmatter sono obbligatori. Se un campo è assente, la sessione
è bloccata (blackboard malformato — ADR-EP039-001 §Frontmatter obbligatorio).

---

## §Sintesi

Template per la sezione `## Sintesi` prodotta in Fase 4 Passo 1.
Le 4 sottosezioni sono obbligatorie (INV-TR-5): nessuna è omettibile,
neanche in caso di stop forzato.

> **Nota drift-reconciliation (2026-09-04)**: questo template è la canonical SoT
> per il formato della sintesi. Il template precedente nel corpo dell'agente
> includeva un metadata header ridondante con il frontmatter YAML (`**Topic**:`,
> `**Data**:`, `**Partecipanti**:`, ecc.) e `### Soluzione / Decisione finale` come
> titolo di sezione. Rimossi in favore del formato più snello allineato a
> `fase-4-sintesi.md` (foglia pilot #1, commit 6857314).
> Fonte: drift reconciliation cross-pilot, 2026-09-04 (pilot #3).

```markdown
## Sintesi della sessione tavola-rotonda-<session-id>

### Soluzione
<la soluzione o decisione emersa dalla convergenza>
<oppure, in caso di sintesi forzata: la soluzione parziale con le aree di accordo>

### Motivazione
<perché questa soluzione — basata sugli accordi congelati e sul ragionamento
dei partecipanti, non sul mio giudizio a priori>

### Dissensi registrati
<eventuali posizioni non convergenti ancora presenti in ## Punti Aperti al momento
della terminazione — non nasconderli, trascriverli integralmente>
<se motivo: consenso → questa sezione è vuota o assente>

### Criteri di successo verificati
<verifico esplicitamente i criteri di successo definiti in Setup uno per uno>
```

---

## §Registro

Format block per la sezione `## Registro Decisioni` aggiunta in Fase 4 Passo 2
al file blackboard come sezione finale.

```markdown
## Registro Decisioni — <ISO8601-timestamp>

<contenuto della sintesi prodotta al Passo 1>
```

Questo side-effect è obbligatorio (INV-TR-5) anche in caso di sintesi forzata
per stallo o budget esaurito. Il motivo di terminazione è sempre documentato.
