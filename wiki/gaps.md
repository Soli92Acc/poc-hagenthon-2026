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

**La capability adiacente esiste e non copre il caso.** Va detto esplicitamente,
altrimenti il primo che rilegge accende `wiki_lint.semantic_check` convinto di aver
risolto. Verificato su `.claude/skills/lint-checks-wiki-structure.md`:

| Check | Cosa misura | Perché non vede questo difetto |
|---|---|---|
| **4ag** — staleness (always-on, WARNING) | **età** della pagina (soglie 180/365 giorni) | Il verbale ha un giorno. Sul contenuto non dice nulla. L'unico segnale che può emettere su questo file è `MISSING-DATE` (il frontmatter ha `started_at` ma non `created:`/`updated:`) — igiene dei metadati, non il fatto che nomini un modello morto. |
| **4af** — embedding similarity (opt-in, INFO, mai gate) | deriva della pagina rispetto a **`PATTERN.md`** | Due motivi indipendenti: (a) esclude ogni pagina senza `pattern_section:` nel frontmatter, e il verbale non ce l'ha; (b) anche se ce l'avesse, confronta wiki ↔ meta-pattern, non wiki ↔ codice. Correggerne uno non basta. |

**Sull'esclusione: i due entry point non si comportano allo stesso modo.** Dettaglio
emerso da un controllo incrociato con `poc-hagenthon-2026-dc` e verificato su entrambe
le skill — avevamo ragione tutti e due, su file diversi:

| Entry point | Trattamento delle pagine senza `pattern_section:` |
|---|---|
| `/lint` → Check 4af | **skip silenzioso**, dichiarato due volte in `lint-checks-wiki-structure.md` (§Algoritmo passo 1 e §Invarianti). Il verbale non compare da nessuna parte nell'output. |
| `/semantic-drift-scan` → `semantic-drift-scan-protocol.md` | **esclusione dichiarata**: passo 2 le raccoglie in una lista «non scansionati» e il report ha la sezione §Pagine non scansionate, con raccomandazione n. 2 ad aggiungere il campo. |

La conclusione non cambia — il verbale resta fuori dalla detection per due motivi
indipendenti — ma cambia la qualità del buco a seconda di come ci si arriva. Dal comando
manuale l'esclusione è **visibile**, ed è la forma peggiore: una riga «non scansionata»
si scorre senza fermarsi, e un'esclusione dichiarata dà l'impressione che qualcuno
l'abbia decisa. Da `/lint` non è visibile affatto.

Il punto non è la configurazione: è la **direzione**. Il drift detection di questa
factory misura wiki contro PATTERN. Il difetto qui vive sull'asse wiki contro `app/`,
che nessuno strumento percorre. Accendere `semantic_check` non lo troverebbe.

[^src: `.claude/skills/lint-checks-wiki-structure.md` §Check 4ag §Check 4af + `.claude/skills/semantic-drift-scan-protocol.md` §Fase 1 §Pagine non scansionate — verificato 2026-09-14; segnalazione iniziale da `poc-hagenthon-2026-dc`]

### La lezione generale: stato vs decisione

Osservazione di `poc-hagenthon-2026-dc`, con istanza verificata. Tutti gli artefatti
di questo gap condividono una proprietà: **descrivono uno stato, non una decisione**.
Un artefatto che registra *cosa fu deciso* resta vero per sempre. Un artefatto che
registra *com'è il mondo* invecchia alla velocità con cui il mondo cambia.

Il verbale della Tavola Rotonda non era sbagliato: diceva «useremo Anthropic», che era
una decisione. Il danno è arrivato dai punti in cui descriveva lo stato previsto del
sistema — quale modello *sarà* in uso — perché quello stato è cambiato due volte e la
frase è rimasta.

**Istanza fresca, misurata in minuti anziché in giorni.** Il commit `e9e4240` conteneva
una nota di provenienza che rimandava a `248ef34` per il lavoro su `app/`. Era vera
quando è stata scritta. Un `pull --rebase` di pochi minuti dopo ha riscritto `248ef34`
in `0b8845e`, rendendo lo SHA irraggiungibile da qualunque ref: chi avesse seguito la
nota non avrebbe trovato nulla — esattamente il lettore disorientato che la nota voleva
aiutare. Corretto con un commit aggiuntivo (`41042e8`) invece che con un `--amend`,
perché `e9e4240` era già pubblicato.

**Regola pratica che ne deriva:** in un artefatto destinato a durare, preferire i
riferimenti stabili (percorso di file, nome di simbolo, titolo di sezione) a quelli
volatili (SHA di commit, numero di riga, conteggio di occorrenze). E quando lo stato
va registrato per forza, datarlo e dichiararne la volatilità, come fa §Copertura reale
in `wiki/sources/hagenthon-2026-demo-requirements.md`.

[^src: `git log -1 e9e4240` + `git log -1 41042e8` — verificato 2026-09-14]

**Resta aperto (maintainer):** ri-pinnare il modello in G_001 + runbook e sostituire il
fallback array, di cui due anelli su tre sono noti non funzionanti.
