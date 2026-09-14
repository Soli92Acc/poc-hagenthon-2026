# OpenRouter — Ricerca operativa per Hagenthon 2026

**Fonte:** documentazione ufficiale openrouter.ai (consultata 2026-09-14)
**Scopo:** valutare e usare OpenRouter come provider LLM per la web app Tema 03
(Educazione Digitale Inclusiva) decisa nella tavola rotonda `e3f2a1b4`.
**Prodotto (Round 2, vigente):** NumeriMiei — coach di calcolo per studente con discalculia certificata.
**Contesto vincolante:** 4h di sviluppo, D1 = "API key funzionante entro 0:20",
D3 = "output LLM in formato parsabile entro 1:00", demo offline-first (fixtures.json).

---

## 1. Cos'è OpenRouter e perché è rilevante per questo progetto

OpenRouter è un **gateway unificato** verso 400+ modelli di decine di provider
(Anthropic, OpenAI, Google, DeepSeek, Meta, Mistral, ...) dietro **una sola API key**
e **un solo endpoint OpenAI-compatibile**.

Valore specifico per l'hackathon:

| Esigenza del progetto | Cosa risolve OpenRouter |
|---|---|
| D1: key funzionante entro 0:20 | Una sola registrazione, una sola key, nessun contratto per-provider. Signup senza carta se si resta sui modelli `:free`. |
| Rischio "provider down in demo" | Parametro `models: [...]` → failover automatico tra modelli diversi in un'unica chiamata. |
| Scelta del modello non congelata al minuto 0 | Cambiare modello = cambiare una stringa. Nessuna riscrittura di client SDK. |
| Budget hackathon | Modelli `:free` a costo zero + modelli low-cost a ~$0.05/M token. Costo totale stimato del progetto: < $0.10. |
| D3: output parsabile | `response_format: json_schema` con `strict: true` (structured outputs). |

**Trade-off onesto:** OpenRouter aggiunge un fee di piattaforma del **5.5%** sul
pay-as-you-go e introduce un hop di rete in più (latenza leggermente superiore
rispetto alla chiamata diretta al provider). Su 18 chiamate di fixtures è irrilevante.

---

## 2. Setup minimo (target: 10 minuti, copre D1)

### 2.1 Ottenere la key
1. Account su `openrouter.ai` → `openrouter.ai/keys` → "Create key".
2. **Impostare subito un credit limit sulla key** (es. $5): OpenRouter supporta
   limiti di spesa per-key con reset opzionale giornaliero/settimanale/mensile.
3. Esportare come variabile d'ambiente: `export OPENROUTER_API_KEY="sk-or-..."`.
   Mai nel codice, mai nel bundle browser, mai committata.

### 2.2 Smoke test D1 — verifica che la key vive (30 secondi)

```bash
# a) la key è valida e ha credito?
curl -s https://openrouter.ai/api/v1/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
# → { "data": { "limit_remaining": ..., "usage": ..., "is_free_tier": true|false } }

# b) una generazione reale end-to-end
curl -s https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openrouter/free",
    "messages": [{"role":"user","content":"Rispondi solo: ok"}],
    "max_tokens": 10
  }'
```

Se (a) e (b) passano, **D1 è verde**. Se falliscono, si sa entro il minuto 5, non al minuto 90.

### 2.3 Endpoint e header

- Base URL: `https://openrouter.ai/api/v1`
- Endpoint chat: `POST https://openrouter.ai/api/v1/chat/completions`
- Header obbligatorio: `Authorization: Bearer <OPENROUTER_API_KEY>`
- Header opzionali (attribuzione nelle classifiche pubbliche OpenRouter):
  `HTTP-Referer: <url del sito>` e `X-OpenRouter-Title: <nome app>`

### 2.4 Compatibilità OpenAI SDK (drop-in)

OpenRouter è un drop-in replacement dell'API OpenAI: basta puntare `base_url`
a `https://openrouter.ai/api/v1`. Qualsiasi snippet OpenAI trovato in giro funziona
senza ristrutturazione — utile perché gli agentic coding tool generano codice
OpenAI-shaped con altissima densità.

```python
from openai import OpenAI
client = OpenAI(base_url="https://openrouter.ai/api/v1",
                api_key=os.environ["OPENROUTER_API_KEY"])
```

---

## 3. Sicurezza: la key NON va nel browser

Vincolo architetturale già presente nella decisione della tavola rotonda, confermato
dalle best practice OpenRouter: **la key sta solo server-side**. Tecnicamente OpenRouter
risponde anche a richieste CORS dal browser, ma questo non cambia la raccomandazione:
una key in un bundle JS è una key pubblica.

Due opzioni compatibili con lo stack scelto (HTML + Tailwind CDN + JS vanilla):

**Opzione A — mini-proxy Python stdlib (zero dipendenze, ~35 righe).** Coerente con
`python3 -m http.server` già previsto nel piano. Serve i file statici E fa da proxy:

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
        except Exception as e:                      # fail-soft: il client cade su fallback
            payload, status = json.dumps({"error": str(e)}).encode(), 502
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(payload)

http.server.HTTPServer(("127.0.0.1", 8080), H).serve_forever()
```

Il frontend chiama `fetch("/api/llm", {method:"POST", body: JSON.stringify({...})})`.
Stesso origin → **nessun problema CORS** (copre la dipendenza D2 del piano).

**Opzione B — Vite dev server con proxy integrato.** Solo se il team parte con Vite+React.

---

## 4. Scelta del modello

### 4.1 Criteri per questo progetto
Il carico è: prompt corto (~300-400 token) + output corto (≤50 parole) **in italiano piano**,
con targeting di un misconcepto specifico. Servono: buon italiano, bassa latenza,
aderenza al vincolo di lunghezza. NON servono: contesto lungo, reasoning, tool calling.

### 4.2 Tre strategie

| Strategia | Model id | Costo | Quando usarla |
|---|---|---|---|
| **Zero-budget** | `openrouter/free` (router che sceglie tra i modelli gratuiti disponibili, filtrando per feature richieste) | $0 | Generazione fixtures se non si vuole spendere nulla. Attenzione ai rate limit (§5). |
| **Low-cost consigliata** | modello flash/mini a ~$0.04–$0.18 per 1M token (es. classe DeepSeek V4.1 Flash: $0.06 in / $0.18 out) | ~$0.001 totali | Default raccomandato: qualità e latenza prevedibili a costo nullo di fatto. |
| **Qualità massima** | modello frontier (Claude/GPT/Gemini di fascia alta) | ~$0.05 totali sul progetto | Se la qualità dell'italiano piano nelle fixtures non convince al primo giro. |

**Raccomandazione operativa:** genera le fixtures con un modello di qualità (costa
centesimi e le fixtures sono l'artefatto che la giuria legge), e tieni un modello
low-cost + fallback per lo slot live della demo, dove conta la latenza e la resilienza.

### 4.3 Stima costo del progetto intero
18 chiamate × (~400 token input + ~120 token output) ≈ 7.2k input + 2.2k output.
- Con modello low-cost: **< $0.01**
- Con modello frontier ($3/$15 per 1M): **~$0.05**
- Più il fee di piattaforma 5.5%.

Il budget non è un vincolo di questo progetto. **Non ottimizzare il costo, ottimizza la latenza e l'affidabilità.**

---

## 5. Rate limit — l'unico rischio reale del piano free

Per i modelli con id che termina in `:free`:

| Credito acquistato nella vita dell'account | Richieste/minuto | Richieste/giorno |
|---|---|---|
| Sotto $10 | 20 | **50** |
| $10 o più | 20 | 1.000 |

**Implicazione diretta per il piano 4h:** il piano prevede 12-18 chiamate per generare
`fixtures.json`, più i tentativi di prompt engineering. Con un account free mai
ricaricato il tetto è **50 richieste al giorno**. Due iterazioni sul prompt delle
fixtures e il tetto è consumato — a metà hackathon, senza preavviso, con errore 429.

**Mitigazione (5 minuti, $10):** caricare $10 di credito prima dell'inizio. Alza il
tetto a 1.000 req/giorno sui free e sblocca i modelli a pagamento. Su un hackathon
di 4 ore questo è il singolo miglior rapporto costo/rischio disponibile.

**Gestione 429:** la risposta include `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset` ed eventuale `Retry-After`. Strategia consigliata: exponential
backoff. Creare più account **non** aggira il limite (governance globale).

Altri codici: `402` = credito esaurito, `403` = spend limit, `502` upstream (non addebitato).

---

## 6. Structured outputs — copre D3 ("output parsabile entro 1:00")

OpenRouter supporta JSON Schema strict. Questo elimina la classe di bug "l'LLM ha
risposto in prosa e il parser è esploso in demo".

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
          "headline":  { "type": "string", "description": "Sembra che tu pensi che..." },
          "spiegazione": { "type": "string", "description": "Max 50 parole, frasi max 15 parole" },
          "analogia":  { "type": "string", "description": "Analogia fisica concreta" }
        },
        "required": ["headline", "spiegazione", "analogia"],
        "additionalProperties": false
      }
    }
  }
}
```

**Attenzione:** il supporto a structured outputs **varia per modello E per provider** —
lo stesso modello può supportarlo via un provider e non via un altro. Due difese:
1. filtrare i modelli su `openrouter.ai/models?supported_parameters=structured_outputs`;
2. passare `provider: { require_parameters: true }` → instrada solo verso provider
   che supportano tutti i parametri della richiesta.

---

## 7. Affidabilità in demo — model fallback

Parametro `models` (array ordinato) al posto di `model`: se il primo fallisce
(provider down, rate limit, moderazione, context length), OpenRouter prova il
successivo, **in un solo round-trip**.

```javascript
{
  "models": ["<primario>", "<backup-1>", "<backup-2>"],
  "messages": [...]
}
```

- Il billing usa il modello **effettivamente** utilizzato, restituito nel campo
  `model` della risposta (utile anche per la trasparenza AI richiesta dai deliverable).
- Cammina l'array **una volta sola**, in ordine: nessuna catena di retry infinita.
- Se anche l'ultimo fallisce, l'errore viene restituito.
- `route: "fallback"` rende esplicito il failover di provider (attivo di default).
- Non combinare `fallbacks` (Anthropic Messages API) con `models`: → errore 400.

Sul livello **provider** (stesso modello, provider diversi) esiste l'oggetto `provider`:
`order`, `allow_fallbacks` (default `true`), `only`, `ignore`, `require_parameters`,
`max_price`, `sort` (`"price"` | `"throughput"` | `"latency"`). Per lo slot live della
demo: `provider: { sort: "latency" }`.

**Nota critica, però:** il fallback di OpenRouter **non sostituisce** il Piano B
architetturale già deciso (DEMO_MODE + `fixtures.json`). Il fallback protegge da
"il modello X è down"; non protegge da "in sala non c'è rete". La regola della tavola
rotonda resta: *a 3:30h la demo deve girare con il cavo di rete staccato.*

---

## 8. Cosa NON serve per questo progetto

Da ignorare esplicitamente per non bruciare tempo: Auto Router (`openrouter/auto`) e i
suoi `cost_tier`/`allowed_models`, streaming SSE, tool calling, web search nativa,
reasoning tokens, OAuth PKCE, BYOK, preset config-as-code, session stickiness.
Sono tutte feature reali ma fuori scope in 4 ore.

---

## 9. Checklist di adozione (da eseguire nei primi 20 minuti)

- [ ] Account OpenRouter creato
- [ ] $10 di credito caricato (sblocca 1.000 req/giorno + modelli a pagamento) — **consigliato**
- [ ] Key creata con credit limit esplicito, esportata in `OPENROUTER_API_KEY`
- [ ] `GET /api/v1/key` risponde 200 → **D1 verde**
- [ ] Una generazione reale riuscita via curl → D1 confermato end-to-end
- [ ] `proxy.py` attivo su :8080, `fetch("/api/llm")` risponde dal browser → **D2 verde**
- [ ] Un JSON schema strict che ritorna un oggetto parsabile → **D3 verde**
- [ ] Array `models` con 2 backup configurato per lo slot live
- [ ] Model id effettivamente usato loggato per ogni fixture (trasparenza AI, deliverable 03)

---

## 10. Riferimenti

- Quickstart: https://openrouter.ai/docs/quickstart
- Autenticazione e key: https://openrouter.ai/docs/api-reference/authentication
- Rate limit e tier free: https://openrouter.ai/docs/api-reference/limits
- Parametri richiesta: https://openrouter.ai/docs/api-reference/parameters
- Structured outputs: https://openrouter.ai/docs/features/structured-outputs
- Model fallbacks: https://openrouter.ai/docs/guides/routing/model-fallbacks
- Provider routing: https://openrouter.ai/docs/features/provider-routing
- Modelli gratuiti: https://openrouter.ai/collections/free-models
- Free models router: https://openrouter.ai/openrouter/free
- Pricing e fee di piattaforma: https://openrouter.ai/pricing
- Listino modelli ordinabile per prezzo: https://openrouter.ai/models?fmt=table&order=pricing-low-to-high
