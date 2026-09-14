# Fase 4 — Sintesi: dettaglio passi 1-3
# Ambito: procedura operativa della Fase 4 del protocollo Tavola Rotonda (EP-039).
# Consumata da: tavola-rotonda-protocol.md al trigger d'ingresso in Fase 4.
# Dipendenze: blackboard con `stato: fase4`, ADR-EP039-001, `wiki/log.md`.

## Role switch attivo

> **ROLE SWITCH AGGREGATORE (R.TR5 — corollario)**
>
> Nelle Fasi 1-3 il moderatore agisce esclusivamente su processo, turni e trascrizione.
> In Fase 4 il role switch è obbligatorio e temporaneo: il moderatore sintetizza il
> risultato della sessione come aggregatore autorevole. Il mandato di non-ancoraggio si
> sospende per questa fase soltanto.

---

### Passo 1 — Produci la sintesi aggregatore

Il moderatore legge l'intero blackboard (`## Posizioni Fase 1`, `## Accordi (congelati)`,
`## Punti Aperti`) e produce la sintesi. La sintesi ha una **struttura obbligatoria** a
quattro sezioni — nessuna sezione è omettibile, neanche in caso di stop forzato:

```markdown
## Sintesi

### Soluzione
<decisione finale — enunciata in modo diretto e non ambiguo.
Se la convergenza è completa: la soluzione che integra gli accordi congelati.
Se la convergenza è parziale (stop forzato): la soluzione migliore derivabile dagli
accordi congelati, con esplicita nota «sintesi forzata per <motivo>».>

### Motivazione
<ragionamento che ha portato alla scelta — riferimento esplicito agli accordi congelati
che la supportano e, se pertinente, alle posizioni di Fase 1 che la prefiguravano.
La motivazione non può essere omessa né abbreviata a una singola riga.>

### Dissensi registrati
<posizioni minoritarie non incorporate nella soluzione finale — con riferimento al
partecipante e al round in cui sono state espresse. Se non ci sono dissensi: scrivi
esplicitamente «Nessun dissenso residuo — convergenza completa».
MAI nascondere dissensi reali: la trasparenza sulle posizioni non incorporate è parte
del valore auditabile della Tavola Rotonda.>

### Criteri di successo verificati
<spunta esplicita dei criteri di successo definiti in Fase 0 Passo 2.
Usa il formato:
- [x] <criterio 1> — <nota breve su come è soddisfatto>
- [✗] <criterio N> — <nota su perché non è soddisfatto o non verificabile>
Tutti i criteri devono comparire, verificati o non verificati.>
```

**Caso speciale — stallo (Condizione 4, Fase 3)**: se il blackboard contiene
l'annotazione `[STALLO]` in `## Accordi (congelati)`, aggiungi il seguente WARNING
come prima riga della sezione `## Sintesi`, prima di `### Soluzione`:

> **Sintesi su stallo: la sessione è terminata per mancanza di progressi
> (≥2 round senza nuovi accordi). La soluzione riflette il massimo consenso
> raggiunto, non un accordo completo.**

**Vincolo verbatim**: il testo della `### Soluzione` e della `### Motivazione` deve
derivare direttamente dagli accordi congelati — non può introdurre elementi non
emersi nel dibattito. Il moderatore sintetizza; non inventa.

---

### Passo 2 — Side-effect canonico: registro decisioni (R.TR6 — non opt-in)

Questo passo è obbligatorio. Non può essere saltato, posticipato o reso opt-in da
configurazione. Il registro decisioni è il meccanismo di persistenza e tracciabilità
delle sessioni Tavola Rotonda nella wiki.

**2a — Scrivi la sezione `## Sintesi` nel blackboard**

Aggiungi la sezione prodotta al Passo 1 al file blackboard
`wiki/decisions/tavola-rotonda-<session-id>-<YYYY-MM-DD>.md` come nuova sezione
finale, dopo `## Punti Aperti`. Il file blackboard — una volta completato con la
`## Sintesi` — è il registro decisioni definitivo della sessione.

Il file deve quindi avere, nell'ordine:
1. Frontmatter (con `stato: terminata` — vedi Passo 3)
2. `## Posizioni Fase 1`
3. `## Accordi (congelati)`
4. `## Punti Aperti`
5. `## Sintesi` (aggiunta in questo passo)

**2b — Append a `wiki/log.md`**

Aggiungi una riga in coda a `wiki/log.md` nel formato:

```
[YYYY-MM-DD HH:MM] tavola-rotonda — <topic> (session: <session-id>) → <N> round, <M> accordi, <K> dissensi registrati — files touched: 1
```

Dove:
- `<topic>` è la formulazione riformulata dal frontmatter del blackboard
- `<session-id>` è il valore del campo `session_id` del frontmatter
- `<N>` è il valore finale di `round_corrente`
- `<M>` è il numero di voci in `## Accordi (congelati)`
- `<K>` è il numero di dissensi nella sezione `### Dissensi registrati`
  (0 se «Nessun dissenso residuo»)

Il file `wiki/decisions/tavola-rotonda-<session-id>-<YYYY-MM-DD>.md` è l'input per
future query `/query` sulla wiki. Il log entry lo rende indicizzabile e tracciabile.

---

### Passo 3 — Aggiorna il frontmatter del blackboard

Aggiorna il campo `stato` nel frontmatter del blackboard da `fase4` a `terminata`.

```yaml
stato: terminata
```

Questa è l'unica operazione che sancisce la chiusura formale della sessione.
Il moderatore non può aggiornare `stato: terminata` prima di aver completato i
Passi 1 e 2 (R.TR6).

**Output Fase 4**: sezione `## Sintesi` scritta nel blackboard con le 4 sottosezioni
obbligatorie (Soluzione, Motivazione, Dissensi registrati, Criteri di successo
verificati). Entry aggiunta a `wiki/log.md`. Frontmatter aggiornato: `stato: terminata`.
La sessione è formalmente chiusa.
