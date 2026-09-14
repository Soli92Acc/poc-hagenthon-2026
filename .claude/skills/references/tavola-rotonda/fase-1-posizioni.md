# Fase 1 — Posizioni iniziali indipendenti: dettaglio passi 1-3
# Ambito: procedura operativa della Fase 1 del protocollo Tavola Rotonda (EP-039).
# Consumata da: tavola-rotonda-protocol.md al trigger d'ingresso in Fase 1.
# Dipendenze: blackboard con `stato: fase1`, ADR-EP039-001.

## Vincolo di isolamento attivo

> **INVARIANTE DI ISOLAMENTO (R.TR1 — non overridabile)**
>
> Ogni agente partecipante riceve SOLO: il testo riformulato del problema + i criteri
> di successo + il proprio ruolo assegnato. NON vede il file blackboard. NON vede le
> posizioni degli altri partecipanti.
>
> Questo vale fino a che **tutti** i partecipanti non abbiano risposto.
>
> Se il moderatore condivide la posizione di un partecipante prima che tutti abbiano
> risposto, l'isolamento è irrimediabilmente violato — la sessione DEVE essere
> riavviata da Fase 0. Non esiste recupero parziale.

Il meccanismo anti-groupthink si basa interamente sull'indipendenza delle posizioni in
questa fase. Riferimento: concept [[multi-agent-debate]] (letteratura MoA, isolamento
proposers) e PATTERN §28.

---

### Passo 1 — Lancia i partecipanti in parallelo

Usa il tool `Task` per lanciare ogni partecipante in un sub-task isolato. Ogni sub-task
riceve **esattamente** questo contesto — e nient'altro:

- Il testo riformulato del problema (Fase 0 Passo 1)
- I criteri di successo (Fase 0 Passo 2)
- Il proprio ruolo assegnato — es.:
  - Per partecipante standard: «Sei il `lead-architect`. Produce una posizione
    indipendente sul problema. Non conosci le posizioni degli altri partecipanti.»
  - Per il Critico: «Sei il `qa-dev` nel ruolo Critico. Il tuo mandato è identificare
    rischi strutturali e debolezze nelle soluzioni possibili. Non convergere per
    default — se hai riserve reali, esprimile con argomentazione esplicita.»

Il contesto è **identico** per tutti (stesso topic, stessi criteri di successo). Solo
il ruolo varia. Il moderatore NON passa il file blackboard in questa fase.

**WARNING**: il moderatore NON deve condividere la risposta di nessun partecipante
prima che tutti abbiano risposto. Farlo viola R.TR1 — la sessione deve essere
riavviata da Fase 0.

---

### Passo 2 — Trascrivi le posizioni nel blackboard

Dopo che **tutti** i partecipanti hanno risposto, il moderatore trascrive le posizioni
nella sezione `## Posizioni Fase 1` del blackboard. Per ogni partecipante, aggiunge
una subsection di livello 3 nel formato prescritto da ADR-EP039-001:

```markdown
### <agent-slug> — <ISO8601-timestamp>

<posizione integrale — trascrizione verbatim, nessun riassunto>
```

**Regola verbatim**: le posizioni vengono trascritte integralmente, senza riassunti né
parafrasi. Il riassunto introduce distorsione e viola R.TR5 (no anchoring moderatore).

**Immutabilità post-scrittura**: il contenuto di `## Posizioni Fase 1` non viene
modificato nei round successivi. Resta come audit trail storico dell'indipendenza
delle posizioni iniziali (ADR-EP039-001 §Tre sezioni obbligatorie).

---

### Passo 3 — Transizione a Fase 2

Aggiorna il frontmatter del blackboard: `stato: fase2`, `round_corrente: 1`
(ADR-EP039-001 §Ciclo di vita del frontmatter).

**Output Fase 1**: sezione `## Posizioni Fase 1` popolata con N subsections (una per
agente, heading `### <slug> — <ISO8601>`, posizione verbatim). Frontmatter aggiornato:
`stato: fase2`, `round_corrente: 1`.
