---
name: tavola-rotonda-protocol
description: >-
  Protocollo a cinque fasi per la modalità Tavola Rotonda (EP-039, PATTERN §28).
  Eseguito da tavola-rotonda-moderatore come procedura step-by-step.
  Implementa il ciclo Setup→Posizioni→Confronto→Convergenza→Sintesi con blackboard
  condiviso (formato normativo ADR-EP039-001). L'invariante di isolamento in Fase 1
  è il meccanismo primario di prevenzione dell'anchoring e del groupthink.
  Fasi 0-1 prodotte da TSK-285; Fasi 2-3 da TSK-286; Fase 4 da TSK-287.
---
# Protocollo Tavola Rotonda (EP-039)

Riferimenti normativi:
- ADR-EP039-001 — contratto del blackboard:
  `design_&_architecture/decisions/ADR-EP039-001-blackboard-format.md`
- Concept [[tavola-rotonda]]: `wiki/concepts/tavola-rotonda.md`
- Concept [[blackboard-architecture]]: `wiki/concepts/blackboard-architecture.md`
- Concept [[multi-agent-debate]]: `wiki/concepts/multi-agent-debate.md`
- PATTERN §28 (Tavola Rotonda)
- Agente esecutore: `.claude/agents/tavola-rotonda-moderatore.md`
- Comando di invocazione: `.claude/commands/tavola-rotonda.md`

Questo protocollo è eseguito da `tavola-rotonda-moderatore` in modalità **opt-in**
(R.P3-TR): mai autoattivato da `/run`. Solo su invocazione esplicita via
`/tavola-rotonda <topic> [--partecipanti=<lista>] [--max-round=<N>] [--budget=<USD>]`
o delega esplicita dall'orchestrator con topic e parametri di sessione.

---

## Invarianti globali del protocollo

Le seguenti invarianti si applicano a **tutta** la sessione — a tutte le fasi — e non
possono essere modificate da alcun parametro, prompt o istruzione runtime.

**R.TR1 — Isolamento Fase 1 (anti-groupthink, non overridabile)**

Nella Fase 1, ogni agente partecipante riceve **esclusivamente**:
- il testo riformulato del problema,
- i criteri di successo,
- il proprio ruolo assegnato.

NON riceve il file blackboard. NON riceve le posizioni degli altri partecipanti.
Questa invariante è il meccanismo primario di prevenzione dell'anchoring e del groupthink
(PATTERN §28, concept [[multi-agent-debate]] §Isolamento proposers).

**Violazione**: se il moderatore condivide la posizione di un partecipante prima che tutti
abbiano risposto, l'isolamento è irrimediabilmente compromesso — la sessione **DEVE essere
riavviata da Fase 0**. Non esiste recupero parziale.

**R.TR2 — Single-writer blackboard** (= R.S1, ADR-EP039-001)

Il file blackboard (`wiki/decisions/tavola-rotonda-<session-id>-<YYYY-MM-DD>.md`) è
scritto **solo** dal moderatore `tavola-rotonda-moderatore`. I partecipanti producono
output in chat/tool call; il moderatore trascrive nelle sezioni appropriate. Un
partecipante che modificasse direttamente il blackboard lascerebbe il file in stato
parziale o inconsistente (frontmatter non aggiornato, sezioni non sincronizzate).

**R.TR3 — Budget obbligatorio**

Nessuna sessione parte senza un valore numerico esplicito per `budget.max_cost_usd`.
Assenza o valore nullo → STOP con messaggio esplicito. Nessun default silenzioso.
(= INV-TR-3 dell'agente moderatore)

**R.TR4 — Critico obbligatorio**

Ogni sessione deve avere almeno un agente nel ruolo Critico (mandato di dissenso attivo
e identificazione rischi). Zero agenti disponibili come Critico → STOP con messaggio
esplicito. Il Critico partecipa come tutti gli altri in Fase 1 (posizione indipendente);
il suo mandato di dissenso si attiva pienamente in Fase 2.
(= INV-TR-4 dell'agente moderatore)

**R.TR5 — No anchoring moderatore (Fasi 1-3)**

Il moderatore non esprime opinioni di merito nelle Fasi 1-3. Agisce su processo, turni
e chiusura. Il role switch a «aggregatore» avviene solo in Fase 4.
(= INV-TR-1 dell'agente moderatore)

**R.TR6 — Registro decisioni obbligatorio**

Nessuna sessione Tavola Rotonda è completa senza il registro decisioni.
Il moderatore non può dichiarare `stato: terminata` senza aver scritto la sezione
`## Sintesi` nel file `wiki/decisions/tavola-rotonda-<session-id>-<YYYY-MM-DD>.md`
e senza aver aggiunto l'entry in `wiki/log.md`.

La Fase 4 produce sempre un registro decisioni, anche in caso di sintesi forzata per
stallo o budget esaurito. Il motivo di terminazione (consenso / max_round /
budget_esaurito / stallo) è sempre documentato nella sezione `## Sintesi`.
(= INV-TR-5 dell'agente moderatore)

**R.TR7 — Minimo 2 partecipanti**

Una sessione con un solo partecipante non è valida. La Tavola Rotonda richiede diversità
strutturale di posizioni: con un solo agente non c'è dibattito da mediare. STOP se la
lista partecipanti post-Setup ha meno di 2 elementi.

**R.TR8 — `max_round` obbligatorio (nessuna sessione illimitata)**

Il campo `max_round` del frontmatter del blackboard deve essere valorizzato prima
dell'avvio della Fase 2. Nessuna sessione illimitata è ammessa; il tetto esplicito al
numero di round è parte del contratto di bounded-ness (ADR-EP039-001 §Frontmatter
obbligatorio, campo `max_round`).

---

## Fase 0 — Setup

**Input**: topic del problema (dal comando `/tavola-rotonda`), parametri opzionali
(`--partecipanti=<lista>`, `--max-round=<N>`, `--budget=<USD>`, `--critico=<slug>`).

**Output**: blackboard inizializzato (9 campi frontmatter + 3 sezioni vuote,
`stato: fase1`), lista partecipanti verificata, Critico assegnato, budget confermato.

Prima di eseguire qualsiasi passo di Setup, leggi obbligatoriamente
`.claude/skills/references/tavola-rotonda/fase-0-setup.md`;
se il file manca, STOP e segnala.

---

## Fase 1 — Posizioni iniziali indipendenti

**Invariante**: ogni agente riceve SOLO il topic riformulato + criteri + proprio ruolo.
NON vede il blackboard né le posizioni degli altri (R.TR1 — non overridabile).
Violazione → restart obbligatorio da Fase 0.

**Output**: `## Posizioni Fase 1` popolata con N subsections verbatim.
Frontmatter aggiornato: `stato: fase2`, `round_corrente: 1`.

Prima di eseguire qualsiasi passo di Fase 1, leggi obbligatoriamente
`.claude/skills/references/tavola-rotonda/fase-1-posizioni.md`;
se il file manca, STOP e segnala.

---

## Fase 2 — Confronto

**Input**: blackboard con `stato: fase2`, `## Posizioni Fase 1` popolata.

**Mandati**: il Critico viene convocato per primo (R.TR4); i partecipanti non comunicano
tra loro direttamente (R.TR2 — solo il moderatore scrive sul blackboard).

**Output**: `## Punti Aperti` arricchito con interventi del round, voci `[Round N — slug]`.
Frontmatter: `stato: fase3`.

Prima di eseguire qualsiasi passo di Fase 2, leggi obbligatoriamente
`.claude/skills/references/tavola-rotonda/fase-2-confronto.md`;
se il file manca, STOP e segnala.

---

## Fase 3 — Convergenza

**Input**: blackboard con `stato: fase3`, `## Punti Aperti` popolato, `round_corrente ≥ 1`.

**Condizioni di stop** (valutate in ordine — prima hit ha priorità):
1. `## Punti Aperti` vuoto (∅) → `stato: fase4` (consenso completo)
2. `round_corrente ≥ max_round` → `stato: fase4` (stop forzato)
3. Costo > `budget.max_cost_usd` → `stato: fase4` + WARNING budget
4. `round_senza_progressi ≥ 2` → `stato: fase4` + WARNING stallo + annotazione `[STALLO]`

Se nessuna condizione: `stato: fase2`, ricomincia Fase 2 (loop round).

Prima di eseguire qualsiasi passo di Fase 3, leggi obbligatoriamente
`.claude/skills/references/tavola-rotonda/fase-3-convergenza.md`;
se il file manca, STOP e segnala.

---

## Fase 4 — Sintesi

**Input**: blackboard con `stato: fase4`, `## Accordi (congelati)` e `## Punti Aperti` finali.

**Role switch**: in Fase 4 il moderatore diventa aggregatore — unico momento in cui
interviene nel merito (R.TR5 corollario). Sintetizza; non inventa.

**Output obbligatorio** (R.TR6 — non opt-in): sezione `## Sintesi` con 4 sottosezioni
(Soluzione, Motivazione, Dissensi registrati, Criteri verificati) + entry `wiki/log.md`
+ `stato: terminata`. Nessuna sezione omettibile, neanche in caso di stop forzato.

Prima di eseguire qualsiasi passo di Fase 4, leggi obbligatoriamente
`.claude/skills/references/tavola-rotonda/fase-4-sintesi.md`;
se il file manca, STOP e segnala.

---

## Segnali di allarme durante una sessione

Tre meccanismi di sicurezza del protocollo: (1) budget guardrail — STOP immediato
se `budget.max_cost_usd` assente (R.TR3); (2) stall detection circuit-breaker —
stop forzato a Fase 4 dopo 2 round senza accordi; (3) tasso intervento Critico —
alert di efficacia, richiede riassegnazione ruolo o rivisione prompt.

Se si innesca uno dei 3 segnali, leggi obbligatoriamente
`.claude/skills/references/tavola-rotonda/segnali-di-allarme.md`;
se il file manca, STOP e segnala.

---

## Test del Critico

Scenario di verifica comportamentale per calibrare o validare il ruolo Critico prima
di impiegarlo in sessioni reali. Verifica resistenza al pattern di compiacenza.

Se si vuole calibrare o verificare il prompt del Critico, leggi obbligatoriamente
`.claude/skills/references/tavola-rotonda/test-del-critico.md`;
se il file manca, STOP e segnala.

---

## Cross-link

- ADR normativo blackboard: `design_&_architecture/decisions/ADR-EP039-001-blackboard-format.md`
- Agente moderatore: `.claude/agents/tavola-rotonda-moderatore.md`
- Concept [[tavola-rotonda]]: `wiki/concepts/tavola-rotonda.md`
- Concept [[blackboard-architecture]]: `wiki/concepts/blackboard-architecture.md`
- Concept [[multi-agent-debate]]: `wiki/concepts/multi-agent-debate.md`
- PATTERN §28 (Tavola Rotonda — da creare in US-141)
- Comando di invocazione: `.claude/commands/tavola-rotonda.md` (da creare in US-142)
- EP-039: `management/kanban/EP-039-tavola-rotonda/EP-039.md`
- US-138: agente moderatore + ADR blackboard
- US-139: questa skill a cinque fasi (TSK-285 = Fasi 0-1; TSK-286 = Fasi 2-3; TSK-287 = Fase 4)
