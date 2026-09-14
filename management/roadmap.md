---
title: Roadmap — NumeriMiei PoC Hagenthon 2026
updated: 2026-09-14
---

# Roadmap — NumeriMiei PoC Hagenthon 2026

## Release 1.0 — Demo Hagenthon (4h sviluppo + 45 min demo prep)

Tutte le epiche e storie qui sotto devono essere in stato done entro la fine del blocco demo prep (4h + 45 min).

### Slot 0:00–1:25 — Setup, Engine, Content (P-A + P-B in parallelo)

| Epica | US | Priorità | Layer | Stima P-A | Stima P-B |
|---|---|---|---|---|---|
| EP-001 | US-001 Setup e schema condiviso | P0 / high | fe | 15 min | 15 min |
| EP-001 | US-002 Engine MCQ state machine | P0 / high | fe | 60 min | 25 min |
| EP-001 | US-003 Content JSON discalculia | P0 / high | docs | — | 40 min |
| EP-001 | US-004 Spiegazione adattiva fixtures | P0 / high | fe | 45 min | — |

### Slot 1:25–2:25 — A11y + Viste docente (D5 dipendenza critica)

| Epica | US | Priorità | Layer | Stima P-A | Stima P-B |
|---|---|---|---|---|---|
| EP-003 | US-010 Must-have a11y discalculia | P0 / high | fe | 10 min | 60 min |
| EP-002 | US-006 Configurazione PDP docente | P0 / high | fe | 10 min | 20 min |
| EP-003 | US-011 Presidio confine clinico | P0 / high | fe | 10 min | — |

### Checkpoint 2:25–2:30 — GO/NO-GO

| Scenario | Azione |
|---|---|
| GO | Flusso E2E L1 sbaglia → remediation → riprova → avanza. Offline test. Docente view visibile. Procedi. |
| PARZIALE-A | Engine OK, live slot instabile → DEMO_MODE puro. Consolida. |
| PARZIALE-B | Solo core + a11y, zero audience views → demo "prodotto studente", audience come roadmap. |
| NO-GO | Meno di 2 step funzionanti → si mostra quello che funziona. Dichiarazione aperta. |

### Slot 2:30–3:30 — Integration, Scaffold-fading, Report

| Epica | US | Priorità | Layer | Stima P-A | Stima P-B |
|---|---|---|---|---|---|
| EP-001 | US-005 Live slot LLM e Piano B | P0 / high | fe | incluso | — |
| EP-002 | US-007 Scaffold-fading e transfer task | P0 / high | fe | 15 min | 20 min |
| EP-002 | US-008 Report post-sessione docente | P0 / high | fe | 5 min | 20 min |

### Slot 3:30–4:00 — Buffer tecnico

| Epica | US | Priorità | Layer | Condizione attivazione |
|---|---|---|---|---|
| EP-002 | US-009 Scheda genitore plain-language | P2 / low | fe | Solo se buffer non consumato da bug critici |
| EP-004 | US-014 PPT assemblea (porzione) | P0 / high | docs | Opzione 1: assemblaggio frazionato durante sviluppo |

### Slot 4:00–4:45 — Demo prep (blocco separato, fuori dai 240 min dev)

| Epica | US | Priorità | Layer | Slot |
|---|---|---|---|---|
| EP-004 | US-012 Script narrativo demo | P0 / high | docs | 4:00–4:15 |
| EP-004 | US-013 Rehearsal ×2 + dry run offline | P0 / high | docs | 4:15–4:45 |
| EP-004 | US-014 PPT assemblea (completamento) | P0 / high | docs | Opzione 2/3: incluso qui solo se non fatto durante sviluppo |

---

## Decisione aperta richiesta prima dell'hackathon

**PPT — collocazione temporale.** Opzioni:
1. Assemblaggio frazionato durante sviluppo (attesa D2 a 0:15 + buffer 3:30-4:00) — max 5 slide. Nessuna estensione blocco.
2. Estensione blocco post-sviluppo a 60 min (+15 min). Richiede coordinamento organizzatori.
3. PPT ridotto a 3-4 slide essenziali, 10 min nel buffer. Nessuna estensione.

Il dry run offline NON viene sacrificato per il PPT in nessuno scenario.

---

## Release 1.1+ — Post-hackathon (roadmap dichiarata, non implementata nel PoC)

- `focusMisconceptions`: il docente indica quali misconcezioni prioritizzare in base alle osservazioni in classe (campo opzionale nel curriculum JSON, architettura predisposta).
- Nuovo modulo: aritmetica con prestito, decimali, percentuali — aggiunti via `data/curriculum-*.json` senza modifiche al codice (EP-1 dimostrato in demo).
- Scheda genitore completa con storico sessioni (se US-009 non implementata nel PoC).
- Swap dominio: `data/curriculum-dislessia.json` con stesso schema — stesso engine gira esercizi di lettura (EP-4).
