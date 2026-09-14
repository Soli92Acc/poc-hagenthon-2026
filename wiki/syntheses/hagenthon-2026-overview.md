---
title: "Hagenthon 2026 — Overview"
type: synthesis
status: approved
created: 2026-09-14
---

# Hagenthon 2026 — Overview

Sintesi dell'hackathon Agentic Coding organizzato da Accenture Application Engineering.

## Contesto

**Hagenthon** (Hackathon Agentic Coding) è un'iniziativa di Accenture Application Engineering
in cui i team utilizzano strumenti di agentic coding per affrontare sfide con impatto
sociale. Il formato prevede team da 2 persone con 5 ore di sviluppo, seguito da demo finale.

**Data:** 14 settembre 2026

## I tre temi della sfida

I team scelgono uno dei tre temi disponibili, definiscono un problema specifico,
costruiscono un prototipo e preparano la demo finale.

| # | Tema | Focus | Pagina |
|---|------|-------|--------|
| 01 | **Accessibilità Digitale** | Affiancare persone con disabilità o fragilità nell'uso di servizi digitali reali | [[wiki/concepts/accessibilita-digitale.md]] |
| 02 | **Inclusione Finanziaria** | Educazione alla finanza personale di base per chi ha bassa alfabetizzazione finanziaria | [[wiki/concepts/inclusione-finanziaria.md]] |
| 03 | **Educazione Digitale Inclusiva** | Abbassare le barriere all'apprendimento digitale per utenti in situazione di svantaggio | [[wiki/concepts/educazione-digitale-inclusiva.md]] |

## Filo conduttore comune

Tutti i temi condividono alcuni principi:

- **Persona prima della tecnologia**: il punto di partenza è sempre un utente concreto
  con una difficoltà precisa, non una funzionalità da implementare
- **Semplificare senza tradire**: il significato delle informazioni originali non deve
  cambiare durante qualsiasi adattamento o semplificazione
- **Demo prima/dopo**: ogni soluzione deve mostrare cosa l'utente non riusciva a fare
  e cosa riesce a fare dopo l'intervento
- **Trasparenza sull'AI**: ogni team deve indicare dove l'AI ha contribuito e dove è
  stata necessaria supervisione umana
- **Capability concreta**: non solo riscrittura di testi, ma logica applicativa misurabile

## Struttura deliverable (comune a tutti i temi)

Ogni tema richiede 3 deliverable specifici (numerati 01-03), tutti orientati a:

1. Identificare chi è l'utente e quale barriera affronta (Persona / Learner / Difficulty Statement)
2. Dimostrare il miglioramento con evidenza concreta (Before/After, Percorso Assistito, Adaptive Evidence)
3. Riflettere su autonomia acquisita, limiti e rischi (Autonomia & Limiti, Risk & Clarity Note, Learning Outcome)

## Gap aperti

Vedi `wiki/gaps.md` per lo stato corrente.

## Aggiornamenti (v2026-09-14)

### Tema scelto e nome prodotto

La tavola rotonda `e3f2a1b4` ha scelto il **Tema 03 — Educazione Digitale Inclusiva**
(4 partecipanti su 5; dissenso TPM registrato nel Round 1). La sessione si è svolta in
**due round**:

- **Round 1** (mattina): scelta Tema 03, prodotto "DigiStep" su alfabetizzazione
  digitale, learner Mario 61 anni. *Superseded dal Round 2.*
- **Round 2** (pomeriggio, vigente): re-scoping su **DSA — discalculia**. Prodotto
  definitivo: **NumeriMiei** — coach di calcolo che spiega l'errore giusto allo studente
  con discalculia (certificazione ASL, L. 170/2010). Learner: Luca, 11 anni, 1ª media,
  misconcepto "denominator magnitude error". Tre audience: studente, docente, genitore.

Invariato tra i round: Tema 03, stack HTML+Tailwind CDN+JS vanilla, piano B LLM
(DEMO_MODE + fixtures.json + live slot), chiave composta fixtures per misconcepto.

Vedere [[wiki/decisions/tavola-rotonda-e3f2a1b4-7c5d-4e8f-9a0b-2d6c3f1e4b7a-2026-09-14.md]]
per il piano operativo completo (Round 2 da riga ~377: `### Posizioni Fase 1 — Round 2`).

### Stack tecnico LLM

La ricerca operativa ha identificato **OpenRouter** come gateway LLM. Il provider
risolve D1 (key), D2 (CORS via mini-proxy Python stdlib), D3 (JSON schema strict).
Rischio operativo identificato: rate limit tier free a 50 req/giorno sotto $10 di
credito — due gap aperti (G_001 scelta modello, G_002 carica credito) monitorati in
`wiki/gaps.md`.

Risorse:
- Concept: [[wiki/concepts/openrouter-gateway.md]]
- Runbook operativo: [[wiki/runbooks/openrouter-setup-hagenthon.md]]

[^src: raw/2026-09-14-openrouter-research.md §1. Cos'è OpenRouter e perché è rilevante per questo progetto]

## Fonti

- [[wiki/sources/hagenthon-2026-temi-sfida.md]]
- [[wiki/sources/openrouter-research.md]]

[^src: raw/2026-09-14-hagenthon-temi-sfida.md §Hagenthon · Temi della sfida]
