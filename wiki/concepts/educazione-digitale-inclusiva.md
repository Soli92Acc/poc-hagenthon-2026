---
title: "Tema 03 — Educazione Digitale Inclusiva"
type: concept
status: approved
created: 2026-09-14
hagenthon_tema: "03"
---

# Tema 03 — Educazione Digitale Inclusiva

## Obiettivo

Usare strumenti di agentic coding per abbassare le barriere di accesso all'apprendimento
digitale, aiutando persone che partono da una situazione di svantaggio.

Il focus riguarda utenti con bassa alfabetizzazione digitale, difficoltà cognitive o
linguistiche, DSA, anziani, lavoratori in riqualificazione o persone che devono imparare
a usare strumenti digitali essenziali. Il focus **non** è creare contenuti formativi
generici, ma supportare un percorso di apprendimento inclusivo in uno scenario concreto.

## La challenge

Team di 2 persone, 5 ore di sviluppo per progettare e realizzare una soluzione che
utilizzi strumenti di agentic coding per rendere più accessibile, comprensibile o
personalizzato un percorso di apprendimento digitale per utenti con difficoltà.

## Profili utente target (esempi)

- Persona anziana con scarsa familiarità digitale
- Persona con bassa alfabetizzazione digitale
- Persona con difficoltà linguistiche (es. straniero, madrelingua non italiana)
- Persona con DSA (disturbi specifici dell'apprendimento)
- Lavoratore in riqualificazione professionale
- Nuovo utente di un processo digitale obbligatorio

## Esempi di soluzioni possibili

- Generatore di micro-lezioni adattate al livello dell'utente
- Guida passo-passo per usare uno strumento digitale reale
- Helper per lettura, comprensione, glossario o sintesi
- Motore di quiz con feedback personalizzato
- Coach che rileva dove l'utente si blocca
- Strumento multilingua per spiegare termini digitali o istituzionali

## Vincoli specifici

- Scegliere un **profilo utente preciso** tra quelli tipici del tema
- Lavorare su uno **scenario di apprendimento concreto**, non astratto
- Dimostrare un miglioramento misurabile in almeno uno tra: comprensione, autonomia,
  completamento del task, riduzione degli errori, capacità di ripetere un'azione
- **Vietato** presentare temi sensibili (sanità clinica, fiscalità personalizzata,
  ambito legale) come consigli professionali
- Includere almeno una **capability agentica concreta**: adattamento dinamico,
  valutazione della comprensione, percorso personalizzato, rilevamento del blocco
  o feedback mirato sugli errori

## Deliverable specifici

| # | Titolo | Descrizione |
|---|--------|-------------|
| 01 | **Learner Profile Statement** | Chi è l'utente target, quale difficoltà ha e in quale scenario. |
| 02 | **Adaptive Evidence** | Un esempio concreto di come la soluzione cambia in base al livello o al bisogno dell'utente. |
| 03 | **Learning Outcome Note** | Cosa l'utente sa fare alla fine che prima non sapeva fare, e come è stato verificato. |

## Cosa evitare

- Generatori generici di lezioni
- Tutor conversazionali aperti senza percorso strutturato
- Pura traduzione automatica
- Soluzioni non collegate a un utente fragile specifico
- Contenuti sensibili trattati come consulenza

## Pagine collegate

- [[wiki/sources/hagenthon-2026-temi-sfida.md]]
- [[wiki/syntheses/hagenthon-2026-overview.md]]

[^src: raw/2026-09-14-hagenthon-temi-sfida.md §Tema 03 — Educazione Digitale Inclusiva]

## Aggiornamenti (v2026-09-14)

### Prodotto vigente — NumeriMiei (Round 2 tavola rotonda e3f2a1b4)

La tavola rotonda `e3f2a1b4` si è svolta in due round. **Il Round 1** (mattina) ha
scelto il Tema 03 con un prodotto di alfabetizzazione digitale (upload PDF su portale
PA, persona Mario). **Il Round 2** (pomeriggio) ha eseguito un re-scoping completo
sul dominio **DSA — discalculia**, producendo il prodotto vigente:

**NumeriMiei — coach di calcolo che spiega l'errore giusto allo studente con
discalculia (certificazione ASL, L. 170/2010).**

| Aspetto | Valore vigente (Round 2) |
|---|---|
| Prodotto | NumeriMiei |
| Dominio | DSA — discalculia, sottotipo number sense |
| Learner | Luca, 11 anni, 1ª media. Misconcepto: "denominator magnitude error" (1/4 > 1/3 perché 4 > 3) |
| Audience | 3: studente (MCQ engine), docente (config PDP — gate clinico), genitore (report read-only) |
| Chiave fixtures | `{step_id}-{level}-{misconcept_id}` |
| Stack | Invariato: HTML+Tailwind CDN+JS vanilla, piano B DEMO_MODE + fixtures.json + live slot |
| Gate clinico | pdpLevel scritto SOLO dalla form docente (single-writer invariante); mai calcolato dalla performance |

Il Round 1 è superseded: il nome "DigiStep Adaptive Misconception Coach" e lo scenario
Mario/upload-PDF non sono più vigenti. La capability irriducibile (targeting del
misconcepto specifico via chiave composta) è invariata; cambia il dominio applicativo.

### Provider LLM — OpenRouter adottato per NumeriMiei

La ricerca operativa successiva alla tavola rotonda ha identificato **OpenRouter**
come gateway LLM. OpenRouter risolve tre dipendenze critiche del piano 4h:

| Dipendenza | Come coperta |
|---|---|
| D1 — API key funzionante entro 0:20 | Signup OpenRouter singolo, una sola key, smoke test via curl in 30s |
| D2 — CORS risolto | Mini-proxy Python stdlib zero-dipendenze (~35 righe), stesso origin |
| D3 — Output LLM parsabile entro 1:00 | `response_format: json_schema` strict, schema `{headline, spiegazione, analogia}` calibrato su misconcepto matematico |

Il piano B LLM (DEMO_MODE + `fixtures.json`) rimane architetturalmente obbligatorio
e indipendente dal provider scelto: a 3:30h la demo deve girare con il cavo di rete
staccato.

**Decisioni operative non ancora congelate** (vedi gap aperti):
- Quale modello usare per la demo live (G_001)
- Se caricare $10 di credito prima dell'inizio per evitare il rate limit tier free
  a 50 req/giorno (G_002)

[^src: raw/2026-09-14-openrouter-research.md §1. Cos'è OpenRouter e perché è rilevante per questo progetto]
[^src: raw/2026-09-14-openrouter-research.md §2. Setup minimo (target: 10 minuti, copre D1)]
[^src: raw/2026-09-14-openrouter-research.md §3. Sicurezza: la key NON va nel browser]

## Storie collegate

- [EP-001](management/kanban/EP-001-core-adattivo-mcq-engine-llm/EP-001.md) — Core Adattivo — MCQ Engine e Spiegazione LLM-driven
- [EP-002](management/kanban/EP-002-viste-per-ruolo/EP-002.md) — Viste per Ruolo — Docente, Transfer Task, Genitore
- [EP-003](management/kanban/EP-003-accessibilita-confine-clinico/EP-003.md) — Accessibilità e Confine Clinico
- [EP-004](management/kanban/EP-004-demo-e-deliverable/EP-004.md) — Demo e Deliverable — Script, Rehearsal, PPT

### Runbook operativo

Procedura dettagliata D1/D2/D3, scelta modello, rate limit, schema fixtures, checklist 20 min:
[[wiki/runbooks/openrouter-setup-hagenthon.md]]

Concept provider:
[[wiki/concepts/openrouter-gateway.md]]
