# wiki/gaps.md — Gap aperti

Registro dei gap semantici e informativi rilevati durante l'ingest o segnalati da agenti.

<!-- formato: ## G_NNN — <titolo breve> | status: open|resolved | data -->

## G_001 — Scelta definitiva del modello LLM per la demo | status: resolved | 2026-09-14

**Rilevato da:** wiki-keeper (ingest `raw/2026-09-14-openrouter-research.md`)

**Risolto:** 2026-09-14 — Maintainer.

**Decisione:** strategia raccomandata approvata, con vincolo incrociato da G_002
(nessuna ricarica preventiva → modelli a pagamento non disponibili → tutto gira su
modelli `:free`).

**Configurazione concreta:**

*Batch fixtures (slot 1:15–2:00, 12-18 chiamate):* singolo modello free pinnato —
`thinkingmachines/inkling-small:free`. Motivo: `openrouter/free` sceglie a caso tra
i modelli gratuiti a ogni richiesta → 18 registri linguistici diversi su 18 fixture.
Per NumeriMiei (frasi max 15 parole, lingua piana, zero vocabolario clinico, utente 11
anni) la coerenza di voce è un requisito di qualità. Modello candidato dichiarato
multilingua conversazionale, 1.05M contesto, variante efficiente.

*Slot live demo (1 chiamata):* fallback array per resilienza:
`models: ["thinkingmachines/inkling-small:free", "nvidia/nemotron-3-super-120b-a12b:free", "openrouter/free"]`

**Nota D3:** `openrouter/free` come ultimo anello filtra automaticamente per capability
(structured outputs incluso) → D3 garantita anche se i modelli pinnati sopra non
supportassero `response_format: json_schema`. Il supporto structured outputs sui singoli
modelli free non è verificabile da documentazione pubblica: va testato nei primi 20
minuti (parte della checklist D1/D3).

**Vincolo incrociato:** G_002 ha ristretto lo spazio di soluzione di G_001 (la
strategia "fixtures con modello di qualità a pagamento" non è eseguibile senza credito).

**Pagine aggiornate:** `wiki/runbooks/openrouter-setup-hagenthon.md`,
`wiki/concepts/openrouter-gateway.md`

---

## G_002 — Decisione di caricare $10 di credito su OpenRouter | status: resolved | 2026-09-14

**Rilevato da:** wiki-keeper (ingest `raw/2026-09-14-openrouter-research.md`)

**Risolto:** 2026-09-14 — Maintainer.

**Decisione:** nessuna ricarica preventiva. Si parte sul tier free a $0. Se il tetto
di 50 req/giorno viene colpito durante l'hackathon, si ricarica in corsa. Rischio
accettato esplicitamente.

**Implicazione su G_001:** i modelli a pagamento non sono disponibili senza credito
(`402 Payment Required`). G_001 è vincolato a soluzioni free-only.

**Implicazione operativa:** il margine sul tetto è nullo (piano realistico 45-55 req
su 50 disponibili). La disciplina di budget dei 6 punti è obbligatoria, non opzionale.
Tenere la carta pronta per ricarica in-corsa: deve costare 2 minuti, non 10.

**Pagine aggiornate:** `wiki/runbooks/openrouter-setup-hagenthon.md`,
`wiki/concepts/openrouter-gateway.md`
