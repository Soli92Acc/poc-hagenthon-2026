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

---

## G_003 — Il deck dichiara "2 misconcepit" mentre il curriculum ne modella 3 | status: resolved | 2026-09-14

**Rilevato da:** wiki-keeper (ingest `raw/2026-09-14-demo-requirements.md`), su
segnalazione della sessione `poc-hagenthon-2026-d4`, verificato su `app/data/`.

**Discrepanza:** `presentation/numerimiei-deck.html` riga 665 (slide 5, blocco
"Rischi considerati" → "Copertura limitata") recita:

> Sprint 01: 2 misconcepit, frazioni con numeratore 1.

L'affermazione è **non qualificata**: si legge come *misconcetti riconosciuti*.
Dopo l'espansione del curriculum (3→7 esercizi, fixture 10→22) i misconcetti
modellati sono **3**, di cui 2 con spiegazioni pre-validate e 1 (`round_number_bias`)
deliberatamente scoperto per la generazione dal vivo.

**Perché conta:** la slide 5 è l'unica che copre il criterio 6 del brief ("quali
limiti o rischi sono stati considerati"). Sottodichiarare la copertura nasconde
il punto forte della demo — il terzo misconcetto scoperto *è* la dimostrazione
che l'agente AI genera davvero, e non è una lacuna.

**Non era sbagliato quando è stato scritto**, e resterebbe vero se la slide
dicesse esplicitamente *spiegazioni pre-validate*. È stale solo nella lettura
"misconcetti riconosciuti".

**Owner:** sessione `poc-hagenthon-2026-dc` (possiede `presentation/**`).
Non correggibile da wiki-keeper: fuori dallo scope `wiki/`.

**Dati corretti:** vedi `wiki/sources/hagenthon-2026-demo-requirements.md`
§Copertura reale.

**Risolto:** 2026-09-14 — sessione `poc-hagenthon-2026-dc`. Verificato da wiki-keeper
su `presentation/numerimiei-deck.html:665`; nessuna occorrenza residua di "2 misconcep"
in `presentation/`. Testo nuovo:

> Sprint 01: 3 misconcetti modellati, 2 con spiegazioni pre-validate offline, 1 scoperto
> di proposito per la generazione dal vivo. Un solo dominio: frazioni con numeratore 1,
> denominatori fino a 10.

Il limite "un solo item per step" è stato deliberatamente **omesso** dall'owner per
leggibilità in sala (il riquadro diventava un paragrafo a 15px). Scelta di presentazione
consapevole, non una dimenticanza: resta documentata qui e in §Copertura reale.

---

## G_004 — Quattro fonti dichiarano tre modelli LLM diversi | status: open | 2026-09-14

**Rilevato da:** wiki-keeper, cross-check incidentale durante l'aggiornamento di G_003.

**Discrepanza.** G_001 è marcata `resolved` e fissa come modello pinnato
`thinkingmachines/inkling-small:free`, con array di fallback
`[inkling-small:free, nemotron-3-super-120b-a12b:free, openrouter/free]`.
`app/openrouter-budget.md` registra che durante l'esecuzione:

- `thinkingmachines/inkling-small:free` → **403 gated**, "only available on agentic
  harnesses" — non utilizzabile via API, mai;
- `nvidia/nemotron-3-super-120b-a12b:free` → scartato (reasoning leak in `content`,
  tronca) e in una seconda prova **502 provider overloaded**;
- modello effettivamente adottato: **`nex-agi/nex-n2.5-mini:free`** con
  `reasoning: {enabled: false}` — italiano pulito, zero reasoning leak.

Il codice usa il modello corretto (`app/explainer.js:31`, `app/tools/gen-fixtures.mjs:27`).
È la **wiki** a essere ferma alla decisione pre-esecuzione.

**Perché conta.** `wiki/runbooks/openrouter-setup-hagenthon.md:191` istruisce a usare
`inkling-small:free`. Un runbook è il documento che qualcuno segue **sotto pressione**,
senza rileggere il codice: qui porta dritto a un 403 durante l'hackathon. Due dei tre
anelli del fallback array sono noti come non funzionanti.

**Natura del difetto.** G_001 non era sbagliata quando è stata scritta: era la migliore
decisione disponibile *prima* di provare. È stata invalidata dall'esecuzione, e nessuno
ha riaperto il gap — la decisione è rimasta `resolved` mentre il mondo si muoveva sotto.
Un gap chiuso non è un gap immune.

**Owner:** maintainer. Riguarda `wiki/` (mio scope) ma la decisione di ri-pinnare è sua.

**Azione minima suggerita:** allineare runbook e G_001 al modello reale, e sostituire il
fallback array con anelli verificati. Non eseguita in autonomia: è una decisione di
configurazione della demo, non una correzione redazionale.

---

### Ampliamento 2026-09-14 — il perimetro è di quattro fonti, non due

Aperta come "runbook vs codice". La sessione `poc-hagenthon-2026-dc` ha segnalato una
terza fonte; uno sweep su tutto il repo ne ha rivelata una quarta, che è l'**origine**.

| # | Fonte | Diceva | Stato |
|---|---|---|---|
| 1 | `wiki/decisions/tavola-rotonda-e3f2a1b4-…-2026-09-14.md` (10:00Z) | Anthropic / **Claude** / Haiku | banner di supersessione aggiunto, corpo intatto |
| 2 | `wiki/gaps.md` G_001 + `wiki/runbooks/openrouter-setup-hagenthon.md` | `thinkingmachines/inkling-small:free` | runbook annotato ⚠️ SUPERSEDED; G_001 da riaprire (maintainer) |
| 3 | `presentation/numerimiei-deck.html:394,548` | **Claude** | corretto da `-dc` 2026-09-14 |
| 4 | `app/explainer.js:31`, `app/tools/gen-fixtures.mjs:27` | `nex-agi/nex-n2.5-mini:free` | **corretto — è il riferimento** |

**La catena di propagazione, in ordine cronologico.** Il verbale della Tavola Rotonda
(fonte 1, la più vecchia) assumeva Anthropic perché fu scritto *prima* della ricerca
OpenRouter. Il deck ha ereditato "Claude" da lì: non l'ha inventato. Poi G_001 ha
sostituito la scelta con inkling, e l'esecuzione ha sostituito inkling con nex-n2.5-mini.
Tre strati di decisione, e ogni strato ha lasciato dietro di sé un artefatto non marcato.

**Perché il perimetro stretto era sbagliato.** Chiudere G_004 come "runbook vs codice"
avrebbe lasciato fuori `presentation/` e `wiki/decisions/`. Alla prossima rivalidazione
nessuno avrebbe guardato lì, e il verbale — che non si rilegge mai perché "è storia" —
avrebbe continuato a seminare il nome sbagliato a valle.

**Sul verbale.** Non va riscritto: un decision record è un registro di ciò che fu
deciso, e falsificarlo a posteriori distrugge la tracciabilità. Gli è stato aggiunto un
banner post-hoc dichiarato come tale, col corpo intatto. È la differenza tra correggere
la storia e annotarla.

**Perché nessun gate lo intercetta** (osservazione di `poc-hagenthon-2026-dc`, qui
precisata). Le tre verifiche automatiche del progetto guardano superfici diverse e
nessuna copre questo caso: il content-gate verifica i dati, i test verificano il codice,
`/lint` verifica la wiki — ma su **struttura** (wikilink orfani, claim senza fonte), non
su **attualità**. Un verbale può citare un modello che non esiste più e restare
formalmente valido: i wikilink risolvono, le affermazioni hanno la loro fonte, e la
fonte è il verbale stesso. Nessun check confronta il contenuto di un decision record con
il codice che quel record ha generato. Il difetto non è che il verbale sia fuori
perimetro — è che l'unico perimetro che lo tocca non fa la domanda giusta.

**Resta aperto (maintainer):** ri-pinnare il modello in G_001 + runbook e sostituire il
fallback array, di cui due anelli su tre sono noti non funzionanti.
