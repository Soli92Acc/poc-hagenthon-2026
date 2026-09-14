---
title: "Runbook — Setup OpenRouter per NumeriMiei (Hagenthon 2026)"
type: runbook
status: approved
created: 2026-09-14
project: hagenthon-2026
tema: "03"
---

# Runbook — Setup OpenRouter per NumeriMiei (Hagenthon 2026)

Procedura operativa per adottare OpenRouter come provider LLM nella web app
NumeriMiei nei primi 20 minuti dell'hackathon. Copre le dipendenze critiche D1, D2,
D3 e il rischio rate limit.

**Contesto vincolante:** 4h di sviluppo, stack HTML+Tailwind CDN+JS vanilla,
piano B LLM obbligatorio (DEMO_MODE + `fixtures.json`).

---

## D1 — Key funzionante entro 0:20

### Passo 1 — Ottenere la key

1. Account su `openrouter.ai` → `openrouter.ai/keys` → "Create key".
2. **Impostare un credit limit sulla key** (es. $5) con reset opzionale.
3. Esportare: `export OPENROUTER_API_KEY="sk-or-..."` — mai nel codice, mai nel
   bundle browser, mai committata.

[^src: raw/2026-09-14-openrouter-research.md §2. Setup minimo (target: 10 minuti, copre D1)]

### Passo 2 — Smoke test (30 secondi)

```bash
# a) La key è valida e ha credito?
curl -s https://openrouter.ai/api/v1/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
# → { "data": { "limit_remaining": ..., "usage": ..., "is_free_tier": true|false } }

# b) Una generazione reale end-to-end
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter/free",
    "messages": [{"role":"user","content":"Rispondi solo: ok"}],
    "max_tokens": 10
  }'
```

Se (a) e (b) passano → **D1 verde**. Se falliscono entro il minuto 5, si sa subito —
non al minuto 90.

[^src: raw/2026-09-14-openrouter-research.md §2. Setup minimo (target: 10 minuti, copre D1)]

### Compatibilità OpenAI SDK

```python
from openai import OpenAI
client = OpenAI(base_url="https://openrouter.ai/api/v1",
                api_key=os.environ["OPENROUTER_API_KEY"])
```

[^src: raw/2026-09-14-openrouter-research.md §2. Setup minimo (target: 10 minuti, copre D1)]

---

## D2 — CORS risolto (key mai nel browser)

La key va **solo server-side**. OpenRouter risponde anche a richieste CORS dal browser,
ma una key in un bundle JS è una key pubblica.

**Opzione A — mini-proxy Python stdlib (zero dipendenze, ~35 righe)**
Coerente con `python3 -m http.server` già previsto nel piano. Serve i file statici
E fa da proxy. Stesso origin → nessun problema CORS.

```python
# proxy.py — python3 proxy.py  → http://localhost:8080
import http.server, json, os, urllib.request

KEY = os.environ["OPENROUTER_API_KEY"]
UPSTREAM = "https://openrouter.ai/api/v1/chat/completions"

class H(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/llm":
            return self.send_error(404)
        body = self.rfile.read(int(self.headers["Content-Length"]))
        req = urllib.request.Request(
            UPSTREAM, data=body,
            headers={"Authorization": f"Bearer {KEY}",
                     "Content-Type": "application/json",
                     "HTTP-Referer": "http://localhost:8080",
                     "X-OpenRouter-Title": "NumeriMiei"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                payload, status = r.read(), 200
        except Exception as e:
            payload, status = json.dumps({"error": str(e)}).encode(), 502
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(payload)

http.server.HTTPServer(("127.0.0.1", 8080), H).serve_forever()
```

Il frontend chiama `fetch("/api/llm", {method:"POST", body: JSON.stringify({...})})`.

**Opzione B — Vite dev server con proxy integrato.** Solo se il team parte con Vite+React.

[^src: raw/2026-09-14-openrouter-research.md §3. Sicurezza: la key NON va nel browser]

---

## D3 — Output parsabile (structured outputs, entro 1:00)

JSON Schema strict tramite `response_format.json_schema`. Schema per NumeriMiei
(dominio: remediation misconcepto matematico in discalculia):

```javascript
{
  "model": "<model-id>",
  "messages": [...],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "remediation",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "headline":    { "type": "string",
                           "description": "Nomina il misconcepto matematico rilevato. Es: 'Sembra che tu pensi che il numero più grande al fondo significhi una frazione più grande.' Frasi max 15 parole. Zero vocabolario clinico." },
          "spiegazione": { "type": "string",
                           "description": "40-50 parole. Spiega perché l'intuizione dell'utente è comprensibile ma porta all'errore. Frasi max 15 parole. Zero termini clinici o riabilitativi." },
          "analogia":    { "type": "string",
                           "description": "Analogia con manipolativo calibrata al livello PDP. L1: linea dei numeri o blocchi base-10, valori ≤20. L2: decomposizione parziale, valori ≤100. Concreta, visiva, evita terminologia specialistica." }
        },
        "required": ["headline", "spiegazione", "analogia"],
        "additionalProperties": false
      }
    }
  }
}
```

**Constraint sul testo delle fixture:** il testo di ogni fixture non deve mai usare
vocabolario clinico o riabilitativo (diagnosi, disturbo, deficit, riabilit*, clinic*,
specialista, etc.). Il presidio è una denylist deterministica lato rendering
(`data/clinical-denylist.json`); il constraint si applica anche nel prompt di
generazione come primo strato.

**Chiave composta fixtures:** `{step_id}-{level}-{misconcept_id}` — il campo
`misconcept_id` (non `distractor_id`) identifica il misconcepto matematico specifico
rivelato dalla risposta sbagliata (es. `denominator_magnitude`, `concatenation`).
Chiave piatta = stessa risposta per qualsiasi errore = riscrittura generica.
Chiave composta = risposta diversa per ogni misconcepto = capability irriducibile.

Aggiungere `provider: { require_parameters: true }` per instradare solo verso provider
che supportano structured outputs.

[^src: raw/2026-09-14-openrouter-research.md §6. Structured outputs — copre D3 ("output parsabile entro 1:00")]

---

## Scelta del modello — contesto generale

Il carico è: prompt corto (~300-400 token) + output corto (≤50 parole) **in italiano
piano**, con targeting di un misconcepto specifico. Servono: buon italiano, bassa
latenza, aderenza al vincolo di lunghezza. NON servono: contesto lungo, reasoning,
tool calling.

> **Nota (2026-09-14):** la tabella delle tre strategie (zero-budget / low-cost /
> qualità massima) è superseded dalla **Configurazione modelli vigente** nella sezione
> successiva. G_001 e G_002 risolti: nessuna ricarica preventiva → tutto gira su
> modelli `:free`. Vedi `wiki/gaps.md` per il razionale della decisione.

[^src: raw/2026-09-14-openrouter-research.md §4. Scelta del modello]

---

## Configurazione modelli vigente (decisione 2026-09-14)

**Vincolo a monte:** nessuna ricarica preventiva (G_002 risolto) → modelli a pagamento
non disponibili (`402 Payment Required`) → tutto free-only.

### Batch fixtures (slot 1:15–2:00, 12-18 chiamate)

> ⚠️ **SUPERSEDED DALL'ESECUZIONE — non seguire il blocco qui sotto.**
> `thinkingmachines/inkling-small:free` restituisce **403 gated** ("only available on
> agentic harnesses"): non è utilizzabile via API. Modello realmente adottato e
> verificato in esecuzione:
>
> ```javascript
> { "model": "nex-agi/nex-n2.5-mini:free", "reasoning": { "enabled": false }, "messages": [...] }
> ```
>
> Evidenza: `app/openrouter-budget.md` (registro chiamate reali) · codice allineato in
> `app/explainer.js:31` e `app/tools/gen-fixtures.mjs:27`. Gap aperto: **G_004**.
> Il testo storico resta sotto per tracciabilità della decisione originaria.

```javascript
{ "model": "thinkingmachines/inkling-small:free", "messages": [...] }
```

**Motivo del modello pinnato** (non `openrouter/free`): `openrouter/free` sceglie a
caso tra i modelli gratuiti disponibili a ogni richiesta. Su 18 fixture questo produce
18 registri linguistici diversi. Per NumeriMiei — frasi max 15 parole, lingua piana,
zero vocabolario clinico, audience 11 anni — la **coerenza di voce tra fixture è un
requisito di qualità**. Candidato: `thinkingmachines/inkling-small:free` (dichiarato
multilingua conversazionale, 1.05M contesto, variante efficiente).

### Slot live in demo (1 chiamata)

Per il live slot conta la resilienza, non la coerenza di registro:

```javascript
{
  "models": [
    "thinkingmachines/inkling-small:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openrouter/free"
  ],
  "messages": [...],
  "provider": { "sort": "latency" }
}
```

**Nota D3:** `openrouter/free` come ultimo anello del fallback filtra automaticamente
per capability (structured outputs incluso) — D3 garantita anche se i modelli pinnati
sopra non supportassero `response_format: json_schema`. Il supporto structured outputs
sui singoli modelli free non è verificabile da documentazione pubblica: **testarlo nei
primi 20 minuti** con una chiamata reale (integrata nella checklist D1/D3).

---

## Disciplina di budget (tetto 50 req/giorno, margine nullo)

Il piano realistico consuma 45-55 richieste sul tetto di 50: il margine è nullo. La
disciplina seguente è obbligatoria, non opzionale.

1. **Validare l'italiano su UNA sola fixture prima del batch.** Se il registro non
   convince, cambiare modello lì — non dopo 18 chiamate.
2. **Congelare il prompt iterando su una fixture singola**, poi eseguire il batch
   una volta sola. Nessuna iterazione sul prompt a batch avviato.
3. **Scrivere ogni risposta su disco immediatamente.** Un 429 a metà batch non deve
   costare le fixture già ottenute. Mai tenerle in memoria.
4. **Controllare il contatore con `GET /api/v1/key` prima e dopo il batch.**
5. **Ripartizione suggerita del tetto** (50 req totali):
   - ~10 tuning prompt (iterazioni su fixture singola)
   - 18 batch (una passata)
   - ~10 riserva live slot e prove demo
   - ~12 margine buffer
6. **Tenere la carta pronta:** se serve la ricarica in corsa deve costare 2 minuti,
   non 10. Il processo è: `openrouter.ai` → sezione crediti → aggiungi $10 → tetto
   sale a 1.000 req/giorno istantaneamente.

---

## Affidabilità in demo — model fallback array

```javascript
{
  "models": ["<primario>", "<backup-1>", "<backup-2>"],
  "messages": [...]
}
```

Per lo slot live: aggiungere `"provider": { "sort": "latency" }`.

Il fallback cammina l'array **una volta sola**. Non combinare `fallbacks` (API
Anthropic Messages) con `models` → errore 400.

Il fallback **non sostituisce** il Piano B (DEMO_MODE + `fixtures.json`): protegge
da "provider down", non da "sala senza rete".

[^src: raw/2026-09-14-openrouter-research.md §7. Affidabilità in demo — model fallback]

---

## Rischio rate limit — mitigazione

Con account mai ricaricato: 50 req/giorno sui modelli `:free`. Il piano realistico
consuma 45-55 richieste: il margine è nullo.

**Decisione vigente (G_002 risolto, 2026-09-14):** nessuna ricarica preventiva.
Si parte a $0 sul tier free. Se il tetto viene colpito durante l'hackathon, si ricarica
in corsa. Vedi la disciplina di budget (6 punti nella sezione omonima) per gestire il
tetto senza colpirlo.

**Ricarica in corsa (fallback):** `openrouter.ai` → crediti → aggiungi $10 → tetto
sale a 1.000 req/giorno istantaneamente. Deve costare 2 minuti, non 10: carta pronta,
non cercarla sotto pressione.

Gestione 429: exponential backoff. Le risposte includono `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, `X-RateLimit-Reset`, eventuale `Retry-After`. Creare
più account non aggira il limite.

[^src: raw/2026-09-14-openrouter-research.md §5. Rate limit — l'unico rischio reale del piano free]

---

## Checklist di adozione (nei primi 20 minuti)

- [ ] Account OpenRouter creato
- [ ] Nessuna ricarica preventiva (decisione G_002): si parte a $0 sul tier free, tetto 50 req/giorno
- [ ] Carta di credito a portata di mano per la ricarica in corsa (deve costare 2 minuti, non 10)
- [ ] Key creata con credit limit esplicito, esportata in `OPENROUTER_API_KEY`
- [ ] `GET /api/v1/key` risponde 200 → **D1 verde**
- [ ] Una generazione reale riuscita via curl → D1 confermato end-to-end
- [ ] `response_format: json_schema` testato sul modello free pinnato con una chiamata reale
      → il supporto structured outputs sui singoli modelli `:free` NON è documentato pubblicamente,
        va verificato empiricamente. Se fallisce: `openrouter/free` in coda al fallback array lo copre.
- [ ] Prima fixture generata e italiano validato a mano PRIMA di lanciare il batch da 18
      (punto 1 della disciplina di budget — cambiare modello qui costa 1 chiamata, dopo il batch ne costa 18)
- [ ] `proxy.py` attivo su :8080, `fetch("/api/llm")` risponde dal browser → **D2 verde**
- [ ] Array `models` con 2 backup configurato per lo slot live
- [ ] Model id effettivamente usato loggato per ogni fixture (trasparenza AI, deliverable 03)

[^src: raw/2026-09-14-openrouter-research.md §9. Checklist di adozione (da eseguire nei primi 20 minuti)]

---

## Cosa NON serve — scope cut esplicito

Da ignorare per non bruciare tempo: Auto Router (`openrouter/auto`), streaming SSE,
tool calling, web search nativa, reasoning tokens, OAuth PKCE, BYOK, preset
config-as-code, session stickiness.

[^src: raw/2026-09-14-openrouter-research.md §8. Cosa NON serve per questo progetto]

---

## Riferimenti ufficiali

- Quickstart: https://openrouter.ai/docs/quickstart
- Autenticazione e key: https://openrouter.ai/docs/api-reference/authentication
- Rate limit e tier free: https://openrouter.ai/docs/api-reference/limits
- Parametri richiesta: https://openrouter.ai/docs/api-reference/parameters
- Structured outputs: https://openrouter.ai/docs/features/structured-outputs
- Model fallbacks: https://openrouter.ai/docs/guides/routing/model-fallbacks
- Provider routing: https://openrouter.ai/docs/features/provider-routing
- Modelli gratuiti: https://openrouter.ai/collections/free-models
- Free models router: https://openrouter.ai/openrouter/free
- Pricing e fee: https://openrouter.ai/pricing

[^src: raw/2026-09-14-openrouter-research.md §10. Riferimenti]

---

## Pagine collegate

- [[wiki/concepts/openrouter-gateway.md]]
- [[wiki/sources/openrouter-research.md]]
- [[wiki/concepts/educazione-digitale-inclusiva.md]]
