---
title: "OpenRouter — Gateway LLM multi-provider"
type: concept
status: approved
created: 2026-09-14
project: hagenthon-2026
---

# OpenRouter — Gateway LLM multi-provider

## Cos'è

OpenRouter è un **gateway unificato** verso 400+ modelli LLM di decine di provider
(Anthropic, OpenAI, Google, DeepSeek, Meta, Mistral, ...) accessibili tramite
**una sola API key** e **un solo endpoint OpenAI-compatibile**.

Valore specifico per il progetto Hagenthon 2026 — NumeriMiei:

| Esigenza | Cosa risolve OpenRouter |
|---|---|
| D1: key funzionante entro 0:20 | Una sola registrazione, una sola key, nessun contratto per-provider. Signup senza carta se si resta sui modelli `:free`. |
| Rischio "provider down in demo" | Parametro `models: [...]` → failover automatico tra modelli in un'unica chiamata. |
| Scelta del modello non congelata | Cambiare modello = cambiare una stringa. Nessuna riscrittura di client SDK. |
| Budget hackathon | Modelli `:free` a costo zero + modelli low-cost a ~$0.05/M token. Costo totale stimato: < $0.10. |
| D3: output parsabile | `response_format: json_schema` con `strict: true` (structured outputs). |

[^src: raw/2026-09-14-openrouter-research.md §1. Cos'è OpenRouter e perché è rilevante per questo progetto]

## Endpoint e compatibilità OpenAI

- **Base URL**: `https://openrouter.ai/api/v1`
- **Endpoint chat**: `POST https://openrouter.ai/api/v1/chat/completions`
- **Header obbligatorio**: `Authorization: Bearer <OPENROUTER_API_KEY>`
- **Compatibilità OpenAI SDK**: drop-in replacement — basta puntare `base_url` a
  `https://openrouter.ai/api/v1`. Qualsiasi snippet OpenAI funziona senza ristrutturazione.
  Utile perché gli agentic coding tool generano codice OpenAI-shaped ad alta densità.

[^src: raw/2026-09-14-openrouter-research.md §2. Setup minimo (target: 10 minuti, copre D1)]

## Fee di piattaforma e latenza

OpenRouter aggiunge un fee del **5.5%** sul pay-as-you-go e introduce un hop di rete
in più rispetto alla chiamata diretta al provider. Su 18 chiamate di fixtures per il
progetto NumeriMiei è irrilevante. Il budget non è un vincolo; la priorità è latenza e
affidabilità.

[^src: raw/2026-09-14-openrouter-research.md §1. Cos'è OpenRouter e perché è rilevante per questo progetto]

## Rate Limit (rischio operativo)

Per i modelli con id che termina in `:free`:

| Credito acquistato nella vita dell'account | Req/min | Req/giorno |
|---|---|---|
| Sotto $10 | 20 | **50** |
| $10 o più | 20 | 1.000 |

Con un account mai ricaricato il tetto di 50 req/giorno è un rischio concreto in
un hackathon di 4h: due iterazioni sul prompt delle fixtures lo esauriscono. La
mitigazione possibile è caricare $10 prima dell'inizio (tetto → 1.000 req/giorno).

**Decisione vigente per NumeriMiei (G_002 risolto, 2026-09-14):** nessuna ricarica
preventiva. Si parte sul tier free a $0. Rischio accettato esplicitamente dal
maintainer. Se il tetto viene colpito durante l'hackathon, si ricarica in corsa
(2 minuti). Conseguenza: modelli a pagamento non disponibili → tutto gira su modelli
`:free` (vedi sezione successiva e G_001 risolto).

Errori da gestire: `429` (rate limit), `402` (credito esaurito — `402` atteso su
modelli a pagamento senza credito; su modelli `:free` non si applica), `403` (spend
limit), `502` upstream (non addebitato).

[^src: raw/2026-09-14-openrouter-research.md §5. Rate limit — l'unico rischio reale del piano free]

## Configurazione modelli vigente per NumeriMiei (G_001 risolto, 2026-09-14)

Per questo progetto sono stati scelti modelli free-only (vincolo da G_002).

| Slot | Configurazione | Motivo |
|---|---|---|
| Batch fixtures (12-18 chiamate) | `model: "thinkingmachines/inkling-small:free"` (pinnato) | Coerenza di voce tra fixture: `openrouter/free` sceglie a caso ogni chiamata → 18 registri diversi su 18 fixture. Per frasi max 15 parole / lingua piana / utente 11 anni, la coerenza è requisito di qualità. |
| Live slot demo (1 chiamata) | `models: ["thinkingmachines/inkling-small:free", "nvidia/nemotron-3-super-120b-a12b:free", "openrouter/free"]` | Resilienza prima di coerenza. `openrouter/free` come ultimo anello copre D3 (filtra per structured outputs). |

La disciplina di budget (6 punti, tetto nullo) e la configurazione dettagliata sono
nel runbook operativo: [[wiki/runbooks/openrouter-setup-hagenthon.md]]

## Structured Outputs (JSON Schema strict)

OpenRouter supporta JSON Schema strict tramite `response_format.json_schema` con
`strict: true`. Elimina la classe di bug "l'LLM ha risposto in prosa e il parser è
esploso in demo" — copre la dipendenza D3.

Attenzione: il supporto **varia per modello e per provider**. Due difese:
1. Filtrare i modelli su `openrouter.ai/models?supported_parameters=structured_outputs`.
2. Passare `provider: { require_parameters: true }` → instrada solo verso provider che
   supportano tutti i parametri della richiesta.

[^src: raw/2026-09-14-openrouter-research.md §6. Structured outputs — copre D3 ("output parsabile entro 1:00")]

## Model Fallback Array

Il parametro `models` (array ordinato) al posto di `model` abilita il failover
automatico: se il primo modello fallisce (provider down, rate limit, moderazione,
context length), OpenRouter prova il successivo **in un solo round-trip**.

- Il billing usa il modello **effettivamente** utilizzato (campo `model` della risposta).
- `route: "fallback"` rende esplicito il failover di provider (attivo di default).
- Per lo slot live della demo: `provider: { sort: "latency" }`.

**Nota critica:** il fallback di OpenRouter non sostituisce il Piano B architetturale
(DEMO_MODE + `fixtures.json`). Il fallback protegge da "il modello X è down"; non
protegge da "in sala non c'è rete". La regola della tavola rotonda resta: a 3:30h la
demo deve girare con il cavo di rete staccato.

[^src: raw/2026-09-14-openrouter-research.md §7. Affidabilità in demo — model fallback]

## Cosa NON serve in 4h

Da ignorare esplicitamente: Auto Router (`openrouter/auto`), streaming SSE, tool
calling, web search nativa, reasoning tokens, OAuth PKCE, BYOK, preset
config-as-code, session stickiness. Sono feature reali ma fuori scope.

[^src: raw/2026-09-14-openrouter-research.md §8. Cosa NON serve per questo progetto]

## Pagine collegate

- [[wiki/sources/openrouter-research.md]]
- [[wiki/runbooks/openrouter-setup-hagenthon.md]]
- [[wiki/concepts/educazione-digitale-inclusiva.md]]
