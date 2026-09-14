# Fase 2 — Confronto: dettaglio passi 1-5
# Ambito: procedura operativa della Fase 2 del protocollo Tavola Rotonda (EP-039).
# Consumata da: tavola-rotonda-protocol.md al trigger d'ingresso in Fase 2.
# Dipendenze: blackboard con `stato: fase2`, sezione `## Posizioni Fase 1` popolata.

## Mandati attivi in questa fase

> **MANDATO DEL CRITICO IN FASE 2 (R.TR4 — priorità di intervento)**
>
> Il Critico viene convocato sempre per primo. Il suo mandato è produrre critiche
> argomentate, rischi strutturali e debolezze delle proposte — non convergere per
> default. Se il Critico ha riserve reali, DEVE esprimerle con argomentazione esplicita.
>
> Il moderatore NON può saltare o posticipare il turno del Critico.

> **NO MESSAGGI DIRETTI TRA AGENTI (R.TR2 — corollario)**
>
> I partecipanti non comunicano tra loro direttamente. Il moderatore raccoglie le
> risposte come sub-task e trascrive nel blackboard. La lavagna è il canale unico
> di comunicazione della sessione.

---

### Passo 1 — Condividi le posizioni del blackboard

Condividi con tutti i partecipanti il contenuto del blackboard rilevante al round
corrente:

- **Round 1**: passa `## Posizioni Fase 1` (accordi e punti aperti sono ancora vuoti).
- **Round N > 1**: passa l'intero blackboard (`## Posizioni Fase 1` come audit trail
  storico + `## Accordi (congelati)` + `## Punti Aperti` aggiornati al round precedente).

Regola: ogni partecipante deve avere la stessa snapshot del blackboard prima di
produrre il suo intervento nel round corrente.

---

### Passo 2 — Convoca il Critico (priorità di intervento)

Lancia il Critico come sub-task **prima** degli altri. Il sub-task riceve:
- Il blackboard corrente (dal Passo 1)
- Il mandato esplicito del Critico: «identifica rischi strutturali, debolezze
  argomentative e punti di disaccordo nelle proposte. Non convergere per default —
  se hai riserve reali, esprimile con argomentazione esplicita.»

Attendi la risposta del Critico prima di procedere al Passo 3.

---

### Passo 3 — Convoca gli altri partecipanti (in parallelo)

Dopo aver ricevuto la risposta del Critico, convoca gli altri partecipanti in parallelo
(tool `Task`). Ogni sub-task riceve:
- Il blackboard corrente (dal Passo 1)
- L'intervento del Critico già disponibile
- Il mandato: «produci integrazioni, contro-argomenti, rischi aggiuntivi o accordi
  parziali sulle proposte altrui. Porta nuova evidenza o argomentazione; non ripetere
  posizioni già espresse senza sviluppo.»

---

### Passo 4 — Trascrivi gli interventi nel blackboard

Il moderatore trascrive verbatim sotto `## Punti Aperti` gli interventi del round
corrente, come sotto-voci taggate:

```markdown
- [Round <N> — <agent-slug>] <intervento verbatim>
```

Regole di trascrizione:
- Verbatim: nessuna sintesi, parafrasi o omissione (R.TR5 — no anchoring moderatore).
- Il Critico viene trascritto per primo, nell'ordine in cui ha risposto.
- Nuovi rischi o punti emersi dagli interventi vengono aggiunti come voci separate.
- Il moderatore NON decide nel merito: non filtra, non commenta, non valuta.

---

### Passo 5 — Aggiorna il frontmatter: `stato: fase3`

Aggiorna il frontmatter del blackboard: `stato: fase3`.

**Output Fase 2**: `## Punti Aperti` arricchito con gli interventi del round corrente
(voci taggate `[Round N — <agent-slug>]`). `stato: fase3`.
