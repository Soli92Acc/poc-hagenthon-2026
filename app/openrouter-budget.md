# Contatore budget OpenRouter — sprint 01

**Tetto:** 50 richieste di inferenza / giorno (tier free).
**Piano:** ≤20. **Budget gate:** se >35 a 1:25h → freeze live slot, DEMO_MODE permanente.

Aggiornare a ogni chiamata. Le chiamate non-inferenza (`GET /key-info`, `GET /models`) e le
risposte `403`/`429`/`502` upstream **non** consumano budget: annotate ma non conteggiate.

| # | Quando | TSK | Modello | Esito | Conteggiata |
|---|---|---|---|---|---|
| — | D1 | TSK-001 | — | `GET /key-info` → free tier, usage_daily 0 | no |
| — | D1 | TSK-001 | `thinkingmachines/inkling-small:free` | **403 gated** — "only available on agentic harnesses" | no |
| 1 | D1 | TSK-001 | `nvidia/nemotron-3-super-120b-a12b:free` | scarto: reasoning leak in `content`, tronca | sì |
| 2 | D1 | TSK-001 | `nex-agi/nex-n2.5-pro:free` | scarto: 609 token di reasoning, zero content | sì |
| — | D1 | TSK-001 | `google/gemma-4-31b-it:free` | 429 upstream (shared pool) | no |
| — | D1 | TSK-001 | `google/gemma-4-26b-a4b-it:free` | 429 upstream (shared pool) | no |
| — | D1 | TSK-001 | `nvidia/nemotron-3-super-120b-a12b:free` | 502 provider overloaded | no |
| 3 | D1 | TSK-001 | `dots-studio/dots-3-note-preview:free` | JSON ok ma leak lessicale inglese ("divides") | sì |
| 4 | D1 | TSK-001 | `nex-agi/nex-n2.5-mini:free` | **SCELTO** — italiano pulito, 36 parole, zero reasoning | sì |

| 5-13 | 1:05 | TSK-009 | `nex-agi/nex-n2.5-mini:free` | batch 9 chiavi — 8 ok, 1 fallita (nessun retry in corsa) | sì ×9 |
| 14 | 1:10 | TSK-009 | `nex-agi/nex-n2.5-mini:free` | recupero della chiave fallita `step3-L1-denominator_magnitude` | sì |
| 15 | 2:55 | TSK-010 | `nex-agi/nex-n2.5-mini:free` | live slot test — funziona ma **fuori tema**: prompt senza contesto esercizio | sì |
| 16 | 3:05 | TSK-010 | `nex-agi/nex-n2.5-mini:free` | live slot test dopo il fix del prompt — **in tema, 1.18 s** | sì |

**Totale inferenze consumate: 16 / 50.** Restano 34. Piano rispettato (tetto pianificato 20).

Le 6 fixture riscritte a mano dopo la generazione **non** hanno consumato richieste:
la disciplina di sprint vieta richieste extra per migliorare una fixture esistente.

## Decisione modello (sostituzione forzata del pin di TSK-009)

`thinkingmachines/inkling-small:free` — pinnato in TSK-009 — **non è utilizzabile via API**:
OpenRouter lo restituisce con `403 Gate Free Endpoints by Agentic Harness`. La DoD di TSK-009
che lo richiede non è soddisfacibile e va considerata superata da questa nota.

**Sostituto pinnato: `nex-agi/nex-n2.5-mini:free`**, con `reasoning: {enabled: false}` e
`response_format: {type: "json_object"}`. Criteri: italiano corretto senza leak, registro
concreto adatto a 9 anni, nessun termine tecnico spontaneo, output non-reasoning (niente
troncamenti), structured output supportato. Stesso modello per tutte le 9 chiavi → voce
narrativa coerente, come richiesto dalla spec originale.

I provider free di Google (gemma-4) sono risultati rate-limited a livello di pool condiviso
e Nvidia intermittente: **non usarli come fallback durante la demo.**
