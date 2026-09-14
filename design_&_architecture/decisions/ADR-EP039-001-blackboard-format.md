---
id: ADR-EP039-001
title: "Tavola Rotonda — Formato normativo del blackboard (lavagna condivisa)"
status: accepted
epic_id: EP-039
created: 2026-07-06
updated: 2026-07-06
decision: GO
---

# ADR-EP039-001 — Formato normativo del blackboard

## Contesto

La modalità Tavola Rotonda (EP-039) richiede una struttura dati condivisa che faccia
da unico canale di comunicazione tra i partecipanti. Seguendo il principio architetturale
hub-and-spoke mutuato dalla Blackboard Architecture (HEARSAY-II, Erman et al. 1980), ogni
agente legge dalla lavagna e scrive le proprie posizioni/critiche tramite il moderatore —
nessun canale diretto peer-to-peer.

Senza un formato normativo, ogni sessione produrrebbe una struttura ad hoc: nomi di campo
inconsistenti, sezioni mancanti, stato non leggibile dai parser downstream (skill
`tavola-rotonda`, moderatore, agenti partecipanti). La skill che implementa il protocollo
a cinque fasi deve poter scrivere e leggere il blackboard in modo deterministico.

## Problema

**Context explosion O(n×m)**. Con N agenti e M round di confronto, scambiare il
transcript completo come contesto conversazionale produce O(n×m) token a ogni invocazione.
Con N=4 agenti e M=4 round: 16 contesti pieni circolano nel sistema per ogni sessione.

Il problema si aggrava con il pattern peer-to-peer: se ogni agente legge tutti i messaggi
di tutti gli altri a ogni turno (grafo completo), la crescita è O(n²) per round.

La soluzione richiede un formato di file che:
1. Mantenga solo lo stato incrementale — accordi congelati (non ridiscutibili) +
   punti aperti (focus del round corrente) invece del transcript integrale.
2. Segua la topologia hub-and-spoke: single-writer (il moderatore), multi-reader
   (i partecipanti leggono prima di ogni turno).
3. Sia parsabile deterministicamente da skill e agenti — frontmatter machine-readable
   + sezioni markdown con heading riconoscibili.

## Alternative valutate

| Alternativa | Descrizione | Motivo scartata |
|---|---|---|
| **Transcript completo (JSON)** | File JSON con la sequenza cronologica di tutti i messaggi di tutti i partecipanti | Context size O(n×m): ogni agente riceve l'intero transcript; non scala con N e M; non ha compressione progressiva degli accordi |
| **Messaggi per-agente separati** | Un file per agente contenente le sue posizioni | Multi-writer implicito; nessun punto di aggregazione; il moderatore deve riconciliare N file per estrarre accordi/disaccordi; viola il principio hub-and-spoke |
| **Database/key-value store** | Stato in struttura persistente esterna (SQLite, Redis) | Dipendenza esterna non disponibile in ogni runtime Claude Code; non accessibile direttamente come contesto file agli agenti; setup non zero |
| **File markdown libero (struttura ad hoc)** | Nessuna sezione obbligatoria, il moderatore scrive in forma libera | Non parsabile in modo affidabile; il cambio di stato (round_corrente, stato sessione) richiederebbe regex fragili; non normativo per la skill |
| **File markdown strutturato (questa ADR)** | Frontmatter YAML machine-readable + tre sezioni obbligatorie con heading riconoscibili; single-writer; sintesi progressiva incorporata nella struttura | — (scelta adottata) |

## Decisione: GO

Adottiamo il **file markdown strutturato** come formato normativo del blackboard.

### Nome file e posizione

```
wiki/decisions/tavola-rotonda-<session-id>-<YYYY-MM-DD>.md
```

- **Posizione durante la sessione**: `wiki/decisions/` (directory temporanea per la
  durata della sessione).
- **Promozione a decisione persistente**: a sessione terminata (`stato: terminata`),
  il moderatore promuove il file — rinominandolo se necessario — nella directory
  appropriata della wiki. Il registro decisioni (Fase 4) viene estratto dal blackboard
  e archiviato in `wiki/syntheses/` o come ADR, a seconda della natura della decisione.
- `<session-id>` è uno UUID v4 generato dal moderatore alla creazione della sessione
  (R.S2). Garantisce unicità anche se due sessioni condividono data e topic.

### Frontmatter obbligatorio

```yaml
---
session_id: <uuid-v4>
topic: <string — formulazione non ambigua del problema, max 120 caratteri>
moderatore: tavola-rotonda-moderatore
partecipanti: [<agent-slug-1>, <agent-slug-2>, ...]
critico: <agent-slug — uno dei partecipanti o "rotation" se ruolo a rotazione>
round_corrente: <int — inizia a 0 in setup, diventa 1 alla prima fase di confronto>
max_round: <int — obbligatorio, nessuna sessione illimitata (INV-TR-1)>
stato: setup|fase1|fase2|fase3|fase4|terminata
started_at: <ISO-8601 UTC con Z, es. 2026-07-06T14:00:00Z>
---
```

Tutti i campi sono obbligatori. Un blackboard con frontmatter incompleto è considerato
malformato dalla skill `tavola-rotonda`; la sessione viene bloccata con errore esplicito.

### Tre sezioni obbligatorie

Il corpo del file deve contenere esattamente queste tre sezioni di livello 2, in quest'ordine:

```markdown
## Posizioni Fase 1
<!-- Una subsection per agente: ### <AgentSlug> — <ISO8601-timestamp> -->
<!-- Contenuto: posizione iniziale scritta in isolamento (senza vedere le altre). -->
<!-- Questa sezione viene popolata durante Fase 1 e rimane invariata nei round successivi. -->

## Accordi (congelati)
<!-- Punti di consenso raggiunto: il moderatore li trascrive qui dopo ogni round di confronto. -->
<!-- Una volta scritto qui, un punto non è più ridiscutibile nei round successivi. -->
<!-- Formato: lista markdown, una voce per punto di accordo. -->

## Punti Aperti
<!-- Punti ancora in dibattito: focus del round corrente. -->
<!-- Il moderatore aggiorna questa sezione a ogni round: rimuove i punti diventati accordi, -->
<!-- aggiunge nuovi punti emersi dalla discussione. -->
<!-- Formato: lista markdown, una voce per punto aperto. -->
```

Le heading devono corrispondere esattamente (case-sensitive, incluso il testo dei
commenti HTML che servono da guida ma non sono normativi). Le subsection di
`## Posizioni Fase 1` hanno heading di livello 3: `### <AgentSlug> — <ISO8601-timestamp>`.

### Regola single-writer (R.S1)

Il blackboard è scritto **solo dal moderatore** (`tavola-rotonda-moderatore`). I
partecipanti leggono il file prima di ogni turno ma non lo modificano direttamente —
producono output in chat/tool call che il moderatore trascrive nelle sezioni appropriate.

Questa regola preserva la topologia hub-and-spoke e garantisce la consistenza del file:
un partecipante che scrivesse direttamente potrebbe lasciare il blackboard in stato
parziale o inconsistente (frontmatter non aggiornato, sezioni non sincronizzate).

### Ciclo di vita del frontmatter

| Transizione di stato | Campo aggiornato | Regola |
|---|---|---|
| Creazione sessione | tutti i campi | `stato: setup`, `round_corrente: 0` |
| Avvio Fase 1 | `stato` | `stato: fase1` |
| Avvio Fase 2 (confronto) | `stato`, `round_corrente` | `stato: fase2`, `round_corrente: 1` |
| Fine round, round successivo | `round_corrente` | incrementa di 1 |
| Convergenza / `max_round` raggiunto | `stato` | `stato: fase3` poi `fase4` poi `terminata` |

### Complessità token (beneficio atteso)

Con la sintesi progressiva incorporata nella struttura:

- **`## Accordi (congelati)`** cresce con i punti risolti ma non è rielaborato — lettura
  O(1) per agente (non genera dibattito).
- **`## Punti Aperti`** è bounded dalla risoluzione: a ogni round i punti aperti non
  possono aumentare indefinitamente (tetto strutturale `max_round`).
- Il contesto che ogni agente riceve è il blackboard corrente, non il transcript
  accumulato: O(punti-aperti + accordi) invece di O(n×m).

Con N=4 agenti, M=4 round, 3 punti aperti per round: il blackboard cresce di ~3 voci
per round vs. un transcript completo che accumula ~N×M=16 contributi pieni.

## Conseguenze

- **Nessuna nuova invariante §7 globale**. R.S1 (single-writer) e R.S2 (UUID session-id)
  sono invarianti locali di EP-039, non globali del framework.
- **Backward compat totale**: il blackboard è un file wiki temporaneo; la sua struttura
  non interferisce con nessun layer precedente del framework (v2.26 e precedenti).
- **Prerequisito per la skill `tavola-rotonda`** (US-139): la skill implementerà il
  protocollo a cinque fasi leggendo e scrivendo il blackboard nel formato qui definito.
  Questo ADR è il contratto normativo.
- **Prerequisito per l'agente `tavola-rotonda-moderatore`** (US-138): l'agente usa il
  frontmatter `stato` e `round_corrente` come macchina a stati implicita.
- **Audit trail**: il file blackboard, una volta promosso, costituisce il registro
  decisionale della sessione: posizioni iniziali, percorso di convergenza, dissensi
  registrati.

## Cross-link

- Concept: `wiki/concepts/tavola-rotonda.md` (protocollo a cinque fasi, parametri)
- Concept: `wiki/concepts/blackboard-architecture.md` (HEARSAY-II, hub-and-spoke)
- Concept: `wiki/concepts/multi-agent-debate.md` (letteratura MoA, isolamento Fase 1)
- EP-039: `management/kanban/EP-039-tavola-rotonda/EP-039.md`
- US-138: blackboard + agente moderatore (questa US produce il presente ADR + scaffolding agente)
- US-139: skill `tavola-rotonda` a cinque fasi (userà questo ADR come contratto)
- PATTERN §26 (sezione Tavola Rotonda, da creare in US-141)

---

## Appendice — Esempio di blackboard popolato

Sessione fittizia: 2 agenti (`lead-architect`, `qa-dev`), critico `qa-dev`,
2 round di confronto. Topic: scelta del meccanismo di caching per l'API gateway.

```markdown
---
session_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
topic: "Meccanismo di caching per l'API gateway — in-memory vs Redis vs nessun caching"
moderatore: tavola-rotonda-moderatore
partecipanti: [lead-architect, qa-dev]
critico: qa-dev
round_corrente: 2
max_round: 4
stato: fase3
started_at: 2026-07-06T10:00:00Z
---

## Posizioni Fase 1

### lead-architect — 2026-07-06T10:05:00Z

**Proposta**: Redis come layer di caching distribuito.

Motivazione: il progetto è su Kubernetes multi-replica — il caching in-memory per
processo non è condiviso tra repliche (cache invalidation implicita problematica).
Redis è già nel tech stack per le sessioni; aggiungere caching sull'API gateway riusa
l'infrastruttura esistente. TTL configurabile per endpoint, invalidazione esplicita
via key pattern.

Rischi identificati: latenza aggiuntiva ~1-2ms per round trip Redis (accettabile su
p99 target 200ms); complexity operativa Redis (già mitigata dall'uso esistente per sessioni).

### qa-dev — 2026-07-06T10:07:00Z

**Posizione critica**: nessun caching per ora, con condizioni di attivazione.

Motivazione (Critico): la proposta Redis introduce una dipendenza di runtime non
necessaria allo stato attuale del progetto (0 utenti in produzione, nessuna misura
di latenza reale). L'ottimizzazione prematura è il nemico della semplicità. Prima
misurare, poi ottimizzare.

Condizioni che cambierebbero la mia posizione: latenza p99 > 500ms osservata in
staging; oppure costo infrastruttura API provider > 50$/mese su traffico atteso.

Rischio della proposta arch: invalidazione della cache come fonte di bug silenti
(dato stale non invalidato correttamente).

## Accordi (congelati)

- [Round 1] Il caching in-memory per-processo è escluso: il deployment è multi-replica
  e la cache non sarebbe condivisa tra repliche. Punto chiuso — non si ridiscute.
- [Round 1] Redis è già nel tech stack per le sessioni: se si adottasse il caching,
  Redis è l'unica opzione sensata (no nuovi servizi). Punto chiuso.

## Punti Aperti

- [Round 2] **Timing dell'adozione**: attivare Redis caching ora (proposta arch) vs.
  dopo aver misurato latenza in staging con traffico simulato (posizione qa). Critico:
  senza SLA di latenza misurata, il trade-off costo/complessità non è giustificabile.
- [Round 2] **Soglia di attivazione**: se si sceglie di posticipare, quali metriche
  concrete (p99 latency ms, costo $) triggheranno l'adozione? Nessun accordo ancora.
```

**Note sull'esempio:**
- `round_corrente: 2` indica che siamo al secondo round di confronto.
- `stato: fase3` indica la fase di convergenza (Round 2 in corso, accordi già estratti).
- `## Accordi (congelati)` contiene 2 punti risolti nel Round 1 — non saranno
  ridiscussi nei round successivi.
- `## Punti Aperti` contiene i 2 punti ancora in dibattito nel Round 2.
- `## Posizioni Fase 1` è invariata dal Round 1: le posizioni iniziali non vengono
  modificate — restano come riferimento storico per l'audit trail.
- Il Critico (`qa-dev`) ha già svolto il suo ruolo nella Fase 1 (posizione dissenziente
  con condizioni esplicite di cambio posizione) e continua nelle fasi successive.
