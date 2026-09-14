---
session_id: e3f2a1b4-7c5d-4e8f-9a0b-2d6c3f1e4b7a
topic: "Hagenthon 2026: web app Educazione Digitale Inclusiva in 4h con agentic coding"
moderatore: tavola-rotonda-moderatore
partecipanti: [product-manager, tutor, a11y-specialist, lead-architect, tpm]
critico: lead-architect
round_corrente: 1
max_round: 3
stato: terminata
started_at: 2026-09-14T10:00:00Z
---

## Posizioni Fase 1

### product-manager — 2026-09-14T10:08:00Z

**Verdetto tema**: Tema 03 — conferma senza riserve. Il T01 richiede integrazione con un servizio digitale reale controllabile: in demo l'interfaccia esterna può cambiare o richiedere auth. Il T02 ha il vincolo HARD sulla consulenza finanziaria che rende ogni output LLM un rischio di squalifica non mitigabile in 4h. Il T03 è l'unico dove il team controlla l'intera superficie applicativa: definiscono loro il task, il punto di partenza, la metrica di successo.

**Proposta raccomandata — "DigiStep"**: app per apprendimento dell'upload di un documento PDF su portale PA. Learner Profile: Mario, 61 anni, ex operaio metalmeccanico in cassa integrazione. Deve allegare la lettera di licenziamento al portale regionale per la riqualificazione. Usa WhatsApp da 3 anni ma non ha mai caricato un file su un sito. Si blocca davanti al bottone "Allega documento" perché non capisce cosa significhi "file" né dove trovarlo.

**Capability agentica concreta**: pipeline strutturata a 3 fasi — (1) profiling quiz a 3 domande chiuse → assegna L1 o L2 in modo deterministico; (2) 5 step di apprendimento ciascuno con spiegazione a livello e 1 domanda di comprensione; (3) se risposta errata o "Non ho capito" → trigger LLM con (step_id, livello, risposta_errata) → spiegazione riformulata con analogia concreta. La decisione di avanzare/ri-spiegare è deterministica (if-else), l'LLM fa solo la riformulazione del testo.

**Adaptive Evidence**: step 3 — "dove si trovano i file sul telefono?" → risposta sbagliata → LLM prompt: "spiega trovare un file a chi conosce la galleria foto, usa analogia oggetti fisici" → "È come cercare una lettera in una cartella di carta: il tuo telefono ha cartelle invisibili." → domanda ripresentata. Demo: biforcazione visibile tra L1 (adattamento) e L2 (avanza direttamente).

**Learning Outcome Note**: cosa sa fare Mario dopo: trovare e allegare un PDF in un form web. Misura in demo: mock form web finale con 5 interazioni → "4/5 step al primo tentativo, 1 con aiuto". Completamento del test finale binario: pass/fail. Osservabile in 3 minuti.

**Scope MVP**: profiling 3 domande, 5 step con 1 domanda ciascuno, LLM on-demand su blocco, mock form finale, completion score. **Fuori**: persistenza, auth, TTS, mobile, >1 scenario, dashboard multi-utente.

**Alternative scartate**: (A) quiz vocabolario digitale — nessuno scenario concreto, outcome debole ("sa cosa è un URL"); (B) tutor WhatsApp per anziano — endpoint ambiguo, scivola nel "tutor conversazionale aperto" esplicitamente vietato.

---

### tutor — 2026-09-14T10:09:00Z

**Verdetto pedagogico**: Tema 03 ha il potenziale pedagogico più alto ma il rischio di fallimento più alto. Il T01 ha misurazione del learning outcome più pulita (task completion binaria). Il T02 tende a misurare il testo semplificato non la testa dell'utente. Il T03 è l'unico con framework di valutazione incorporato nei deliverable (LPS + Adaptive Evidence + LO Note), ma richiede disciplina pedagogica che molti team non mantengono sotto pressione di tempo.

**Struttura pedagogicamente valida**: percorso strutturato = curriculo fisso e sequenziale, verifica comprensione prima di procedere, feedback specifico all'errore, utente non può saltare. Profilo proposto: Carmela, 67 anni, ex operaia tessile, pensionata anticipata. Usa WhatsApp per foto ma non sa cosa è un browser. Task bounded: prenotare un appuntamento medico sul portale SSN simulato (3 micro-step: browser+URL, login, prenotazione).

**Macchina a stati esplicita** (non chat): PRE-QUIZ (3 domande chiuse) → classifica L1/L2 → percorso differenziato (screenshot annotati per L1, testo breve per L2) → CHECKPOINT per step → se sbagliato: REMEDIATION specifica pre-scritta → POST-QUIZ identico al PRE-QUIZ → DELTA SCORE = Learning Outcome.

**Retrieval practice in 4h**: ciclo mostra-nascondi-domanda. Mostra schermata, aspetta 5s, nascondi, chiedi. Senza il "nascondi" si misura riconoscimento non retrieval. Realizzabile per 3 checkpoint in 4h.

**COSA NON È un percorso strutturato** (evitare): (1) campo testo libero → risposta LLM = chatbot; (2) "scegli argomento liberamente" = navigazione, non percorso; (3) spiegazione generica non correlata all'errore specifico; (4) learning outcome dichiarato ma non verificato nell'app; (5) curriculum generato dinamicamente da LLM (non testabile, non garantito pedagogicamente).

**Condizione non negoziabile**: zero input testuale libero lato utente. Solo MCQ. Il curriculum deve essere pre-scritto e testato, non generato da LLM. L'LLM può riformulare testo di remediation, NON generare lezioni.

**Misura in demo**: pretest 3 domande → percorso → posttest 3 stesse domande in ordine diverso. Delta 1/3→3/3 osservabile in 30 secondi.

---

### a11y-specialist — 2026-09-14T10:10:00Z

**Verdetto inclusione reale**: Tema 03 più credibile per demo di inclusione in 4h, MA solo con profilo coerente con a11y implementata. Scegliere "anziano con DSA" e consegnare app con font 12px è peggio che non partecipare.

**Profilo proposto**: Maria, 71 anni, ex cassiera, pensionata. Usa smartphone Android per WhatsApp vocali. Non sa usare WhatsApp Web. Vista affaticata (occhiali). Più di 4 elementi interattivi contemporaneamente la bloccano. Task: imparare a fare una videochiamata per parlare con i nipoti.

**Requisiti a11y MINIMI NON NEGOZIABILI** (stima tempo implementazione):

| Requisito | Tempo | Verifica fail |
|---|---|---|
| Font ≥18px corpo, sans-serif, line-height 1.5 | 5 min | Testo "da computer" non "da libro" |
| Contrasto ≥4.5:1 (AA) | 10 min | DevTools contrast check |
| Target touch ≥44×44px + spaziatura 8px | 10 min | Tap impreciso su mobile |
| Una sola azione per schermata | 0 min se progettato dall'inizio; 30 min se retrofit | Utente non sa dove guardare |
| Lingua piana: frasi max 15 parole, no termine tecnico senza spiegazione | 30 min (revisione manuale, non delegabile ad AI) | Giuria legge le istruzioni ad alta voce |
| Indicatore progresso visibile (es. "Passo 2 di 5") | 15 min | Utente non sa quanto manca |
| Nessun timeout / avanzamento automatico | 5 min verifica | Sistema avanza mentre utente legge |
| Pulsante "Ripeti" / "Torna indietro" sempre visibile | 15 min | Errore irreversibile |
| Alt text su immagini non decorative | 10 min | Screen reader / audit HTML |
| HTML semantico (heading, landmark) | 10 min (agentic coding genera bene) | Screen reader / browser audit |

**Totale stima: 75-90 minuti.** Va allocato esplicitamente nel piano, non gestito "a margine".

**Tagli brutali**: screen reader ARIA completo (1h+ solo testing), modalità alto contrasto, voice input, mobile responsive, internazionalizzazione.

**Trappole demo fatali**: (1) font 14px su profilo anziano; (2) palette grigio chiaro su bianco (#999 su #fff = 2.5:1, WCAG fail visibile); (3) demo con mouse su profilo smartphone; (4) istruzioni con terminologia tecnica ("clicca sull'icona del profilo" invece di "tocca la tua foto in basso a destra"); (5) >4 elementi interattivi su stessa schermata.

**Agentic coding per a11y**: ottimo per HTML semantico, alt text, ARIA labels standard, palette CSS con variabili. Manuale obbligatorio: plain language review, contrast check devtools, tab order test, touch target verification, flusso simulato dal POV del profilo.

---

### lead-architect — 2026-09-14T10:11:00Z

*(Doppio mandato: lead-architect + Critico)*

**CRITICO — Assunzione più fragile**: l'assunzione centrale del progetto Tema 03 "adattamento dinamico" è che l'adattamento LLM sia *visibilmente e convincentemente diverso* tra livelli di learner. L'adattamento LLM di testo educativo breve è spesso cosmetico: accorcia frasi e tono, ma un giudice esperto vede che è la stessa semplificazione generica che l'LLM fa per chiunque. L'"adattamento" collassa in "abbiamo messo il profilo nel prompt" — esattamente il fallimento "generatore generico" che il tema mette in guardia. Il rischio non è tecnico, è di sostanza: la giuria fa una domanda, il team risponde onestamente, e la capability risulta essere interpolazione di stringhe.

**CRITICO — Scenario di fallimento**: il team cambia profilo da "anziano" a "straniero A2" e ri-esegue uno step. I due output sono simili all'80%. Un giudice chiede: "cosa è cambiato tecnica­mente?" La risposta onesta è "abbiamo messo il profilo nel prompt". La barra "capability concreta" non è raggiunta.

**CRITICO — Domanda dirompente**: "Se cancellassimo del tutto l'LLM e scrivessimo a mano 3 livelli di difficoltà della stessa lezione, la demo sembrerebbe sensibilmente peggiore? Se no — quale è esattamente la capability *agentica irriducibile* che stiamo rivendicando?"

**Valutazione tecnica 3 temi**: T03 unico auto-contenuto (rischio demo sotto controllo progettuale, non in mano a servizi esterni come T01 o a domande avversariali come T02). T01 rischioso per dipendenza servizi reali. T02 rischio squalifica da singola domanda avversariale all'LLM.

**Stack raccomandato**: HTML+Tailwind CDN + JS vanilla (preferito per velocità: zero npm, zero build, `python -m http.server`, apribile in browser). Alternativa: Vite+React+Tailwind (se il team conosce React e lo setup è già pronto, HMR + density training data agentic tools). Provider LLM: quello per cui si ha già la key funzionante oggi. Key NON esposta nel browser: mini-proxy Express (10 min) o Vite proxy. Persistenza: zero — `localStorage` per state intra-sessione.

**Architettura minima (4 componenti)**:
1. `LearnerProfile`: onboarding 3-5 domande MCQ → assegna parametri adattamento
2. `GuidedTaskRunner`: step-by-step con checkpoint MCQ per ogni step
3. `AdaptiveEngine` (CUORE): logica deterministica (if-else) che decide avanza/ri-spiega/segnala-blocco; LLM chiamato SOLO per generare il testo di ri-spiegazione dato (step, livello, errore_specifico)
4. `OutcomeTracker`: registra before/after, numero aiuti, completion score

**Piano B LLM — architetturale, non opzionale**: DEMO_MODE flag. Quando ON, legge da `fixtures.json` (output LLM pre-registrati durante sviluppo, chiamate reali salvate su disco, indicizzate per step+livello+errore). UI identica. La demo gira offline tranne LLM live opzionale. Regola non negoziabile: **a 3:30h la demo deve girare con cavo di rete staccato**.

**Taglio brutale**: UN solo scenario rifinito (non una libreria), nessun TTS/STT (enorme time-sink + fragile in demo), niente responsive oltre Tailwind gratuito.

---

### tpm — 2026-09-14T10:12:00Z

**Verdetto pianificabilità — DISSENSO**: raccomando Tema 02 (Inclusione Finanziaria), non Tema 03. Motivazione: il T02 ha pianificabilità massima. Il vincolo HARD "vietata consulenza finanziaria" elimina la direzione di scope creep più pericolosa. Il deliverable 02 Before/After Simplicity Evidence è il più dimostrabile in demo di tutti i temi: si vede, si confronta, non richiede spiegazione. Non servono API esterne: una fixture di bolletta gas è costruibile in 10 minuti. La capability software è un singolo LLM call su testo in ingresso con output strutturato. Stima lavoro effettivo T02: 2h codice + 45 min demo. Il T03 richiede 4 componenti (profiling + percorso + adaptive engine + outcome tracker) — con 2 persone in ~2h30 di coding effettivo (tolto setup + deliverables + demo), è il scenario a più alto rischio di consegnare demo con capability agentica non visibile.

**Se il team sceglie T03 nonostante il mio dissenso**, il piano deve essere:

**Piano operativo T03 — "DigitSkill Coach" (form INPS)**:

| Slot | Attività | P-A (logica) | P-B (UI/contenuto) |
|---|---|---|---|
| 0:00–0:20 | Setup | API key test, `python -m http.server`, proxy se CORS | index.html + Tailwind CDN, struttura HTML base |
| 0:20–0:50 | Quiz engine core | `quiz-data.json` (5 step × 3 domande), scoring logic | Componente MCQ + area feedback |
| 0:50–1:30 | Adaptive explainer | `explainer.js` (legge fixtures.json, fallback API call), pre-genera `fixtures.json` via API | Componente spiegazione adattiva + pulsante "riprova" |
| 1:30–2:10 | UI completa + a11y | Integrazione engine+explainer | Font 18px, contrasto, label, pulsanti 44px, tab order |
| 2:10–2:30 | Integration test | Flusso E2E: sbaglia step → spiegazione → riprova → passa → completion | Fix bug, verifica fixtures.json copre tutti gli slot |
| 2:30–3:00 | **CHECKPOINT GO/NO-GO** | Se OK: polish. Se NO-GO: demo con fixtures.json puro, zero LLM live | Slide 3 deliverable (1 slide / deliverable) |
| 3:00–3:30 | Demo preparation | Script narrativo 2 min (storia prima/dopo), test scenario 3×, consegna deliverable testi | a11y checklist 7 punti: contrasto, font, touch target |
| 3:30–4:00 | Dry run + buffer | Dry run completo, cavo rete staccato come test piano B | — |

**Checkpoint GO/NO-GO a 2:30h**: GO = flusso quiz→spiegazione→variante funziona E2E (anche con fixtures.json solo). NO-GO = demo mostra solo i primi 2 step funzionanti, dichiara apertamente "abbiamo implementato 2/5 step". Non si improvvisa.

**Dipendenze critiche** (fallimento entro 60-90 min → rosso): D1 API key funzionante entro 0:20; D2 CORS risolto (proxy Python verificato prima); D3 output LLM in formato parsabile entro 1:00; D4 scenario demo testato E2E entro 2:30; D5 a11y checklist completata entro 3:30.

**Scope tagliato (non negoziabile)**: auth, backend, DB, salvataggio sessioni, >5 step, domande generate dinamicamente, multilingua, mobile responsive, screen reader avanzato, vera integrazione portale INPS.

**Tempo demo fisso: 45 minuti** (15 script narrativo + 10 E2E test + 10 slide + 10 rehearsal). Non comprimibili. Se il rehearsal non viene fatto, la demo va fuori dai 4 minuti sotto pressione.

## Accordi (congelati)

- [Round 1] Zero database, zero auth, nessun deploy cloud: la demo gira su localhost. Accordo unanime da Fase 1 — nessun partecipante ha contestato.
- [Round 1] Piano B LLM architetturalmente obbligatorio: fixtures pre-generate (output LLM reali salvati su disco) o DEMO_MODE flag, da costruire nelle prime 2h di sviluppo, non come afterthought. Il Critico in Fase 2 ha rafforzato l'obbligo ma ha anche rivelato la tensione con la trasparenza AI (→ PA-2, non ancora risolto come gestirla in demo).
- [Round 1] Un solo profilo utente specifico (non multiple personas): tutte le posizioni convergono sulla necessità, ma su quale profilo divergono (→ PA-3 ancora aperto).
- [Round 1] Demo preparation: 45 minuti fissi non comprimibili (script narrativo + E2E test + slide + rehearsal). TPM esplicito, tutti impliciti.
- [Round 1] Checkpoint GO/NO-GO esplicito a ~2:30h con fallback dichiarato: se il flusso core non funziona a quel punto, si consolida quello che c'è, non si improvvisa.
- [Round 1] Requisiti a11y minimi obbligatori: font ≥18px, contrasto AA (≥4.5:1 testo normale), touch target ≥44×44px, una sola azione per schermata, plain language (frasi max 15 parole), indicatore progresso visibile. Stimati 75-90 min: vanno allocati esplicitamente nel piano, non come rifinitura.
- [Round 1] Scope tagliato hard (non negoziabile): no auth utente, no backend/DB, no mobile responsive oltre Tailwind gratuito, no screen reader ARIA completo, no multilingua, no >5 step nel percorso, no domande generate dinamicamente da LLM, no integrazione con portale reale.
- [Round 1] Stack base: HTML + Tailwind CDN + JS (preferito per velocità zero-setup) oppure Vite+React+Tailwind (solo se team conosce React e setup è pronto entro 0:20). Decisione deve essere presa al minuto 0, non dopo.
- [Round 1] Zero input testuale libero lato utente: solo MCQ. Nessun campo di testo dove l'utente scrive liberamente. Questo è sia il vincolo anti-chatbot del tema che il gate di robustezza della demo.
- [Round 1] Tema 03 è la scelta (4/5 partecipanti) — il dissenso TPM (Tema 02) è valutato come fondato sulla disciplina di pianificazione ma non sull'analisi del rischio: il T02 ha lo stesso problema di "capability = riscrittura" con il rischio aggiuntivo di correttezza semantica falsificabile adversarialmente (il Critico in Fase 2 ha argomentato questo). Tema 03 confermato con scope più aggressivo rispetto a quanto proposto da PM (3 step non 5, se necessario).

## Accordi aggiuntivi da Fase 3 Round 1

- [Round 1 F3] **PA-1 RISOLTO — Capability agentica irriducibile**: tripletta (step_id, level, distractor_id) → prompt LLM che targettizza il misconcepto specifico dell'utente con analogia concreta per il profilo. fixtures.json con chiave composta (non piatta). Prova di non-hardcodabilità: la giuria può chiedere "cambia errore" e ottenere output qualitativamente diverso. La capability è nel targeting del misconcepto, non nella riscrittura generica.
- [Round 1 F3] **PA-2 RISOLTO — Trasparenza AI + DEMO_MODE**: le fixtures sono dichiarate come "generate da Claude, validate dal team, in cache per affidabilità". Un live slot (un distractore non in fixture) rimane come chiamata LLM live dimostrabile in 90s. Fallback automatico se la chiamata fallisce. Questo è onesto e soddisfa il deliverable di trasparenza.
- [Round 1 F3] **PA-3 RISOLTO — Profilo utente**: Mario Rossi, 61 anni, ex operaio metalmeccanico in CIG. Task: caricare la lettera di licenziamento sul portale regionale per la riqualificazione. Portale simulato. Completamento binario: file appare = pass. Nessun dominio sensibile. La prenotazione medica (Carmela) eliminata per rischio dominio sanitario.
- [Round 1 F3] **PA-4 RISOLTO — Misura LO**: transfer task = mock-form-2.html con layout diverso (bottone in posizione diversa, label "Carica file"). Stessa skill, portale diverso. Osservabile in 30s. Off-percorso-critico: eliminabile al checkpoint 2:30h senza impatto su GO/NO-GO.
- [Round 1 F3] **PA-5 RISOLTO — Interpretazione**: la giuria valuta il prodotto a runtime. Architettura ibrida: DEMO_MODE default (output Claude reali validati, affidabile) + live slot obbligatorio (dimostra capability live). Il messaggio di demo è "il prodotto targettizza il misconcepto specifico dell'utente, ecco live".

## Punti Aperti

*[Vuoto — tutti i Punti Aperti risolti in Round 1 Fase 3. Condizione di stop: consenso. Motivo: consenso.]*

## Registro Decisioni — 2026-09-14T12:00:00Z

## Sintesi della sessione tavola-rotonda-e3f2a1b4-7c5d-4e8f-9a0b-2d6c3f1e4b7a

### Soluzione

**Terminazione**: consenso raggiunto in Round 1 Fase 3. Motivo: tutti i Punti Aperti risolti.

---

#### 1. Verdetto sulla scelta del tema

**TEMA 03 — Educazione Digitale Inclusiva. Confermato.**

Rationale ancorato alle 4 ore:

- Il Tema 01 (Accessibilità Digitale) richiede integrazione con un servizio digitale reale o realistico: in 4h costruire un mock credibile di un servizio PA + il wrapper assistivo è doppio scope. Il rischio demo-failure è esterno (il servizio cambia, richiede auth, ha DOM imprevedibile).
- Il Tema 02 (Inclusione Finanziaria) è stato proposto dal TPM come più pianificabile, e questa osservazione è fondamentalmente corretta sul piano della complessità di sviluppo. Tuttavia il Critico ha evidenziato che il T02 ha lo stesso problema strutturale di "capability = riscrittura di testi" (esplicitamente esclusa) con l'aggiunta di un rischio di correttezza semantica adversarialmente falsificabile: ogni numero finanziario semplificato dall'LLM può essere sbagliato o alterato, e un giurato può verificarlo in 10 secondi. Questo rischio è più difficile da mitigare del rischio di complessità di T03.
- Il Tema 03 è l'unico auto-contenuto: il team controlla l'intera superficie applicativa. Il rischio di demo-failure è progettuale, non esterno. La disciplina di pianificazione del TPM (checkpoint, dipendenze critiche, scope cut aggressivo) si applica a T03 senza cambiare tema.

Il T03 si porta in demo con scope ridotto a 3 step (non 5) e con il piano B LLM architetturale. Se il piano operativo mostra segnali rossi al checkpoint 2:30h, si consegna quello che c'è, non si improvvisa.

---

#### 2. Proposta raccomandata di web app

**Nome operativo: "DigiStep — Adaptive Misconception Coach"**

**Learner Profile Statement (Deliverable 01)**:
Mario Rossi, 61 anni, ex operaio metalmeccanico in cassa integrazione. Deve caricare la lettera di licenziamento sul portale regionale per avviare la riqualificazione professionale. Usa WhatsApp per messaggi vocali ma non ha mai caricato un file su un sito. Ha uno smartphone Android. Quando vede il bottone "Allega documento" si blocca: non sa cosa significa "file", non sa dove trovarlo sul telefono. Non ha mai aperto la galleria con l'intenzione di "trovare un documento".

**Capability agentica concreta: targeting del misconcepto specifico**

La capability NON è "adattamento generico al livello". La capability è: (step_id, level, distractor_id) → prompt LLM che identifica il misconcepto rivelato dalla risposta sbagliata dell'utente e genera una spiegazione che corregge QUEL misconcepto specifico, con un'analogia concreta per il profilo.

Esempio completo: step 2 ("dove si trovano i file sul telefono"), livello L1, l'utente sceglie l'opzione "li cerco nell'email ricevuta". Il sistema riconosce il misconcepto "confonde storage locale con allegati email". Il prompt LLM diventa: "L'utente di 61 anni ha confuso il file allegato alla email con un file sul dispositivo. Spiega con un'analogia fisica concreta (massimo 50 parole, frasi di max 15 parole) la differenza tra un documento già sul telefono e un allegato email che ancora non si è salvato." L'LLM risponde con qualcosa come: "Un file sul tuo telefono è come una lettera già nella tua cartella a casa. Un allegato email è come una lettera ancora nella busta che il postino tiene: devi prima salvarla tu." Questa granularità non è hardcodabile: lo spazio dei misconcepted è ≥2-3 per step e per livello.

**Il fixtures.json usa chiave composta** `{step_id}-{level}-{distractor_id}`. Chiave piatta = stessa risposta per qualsiasi errore = riscrittura generica. Chiave composta = risposta diversa per ogni misconcepto = capability irriducibile.

**La giuria può probe "cambia errore"** e ottenere output qualitativamente diverso in 10 secondi — questa è la dimostrazione live della capability.

**Adaptive Evidence (Deliverable 02)**:
Schermata demo affiancata: a sinistra, L2 che risponde correttamente a step 2 e avanza direttamente (nessuna remediation, progresso immediato). A destra, L1 che sceglie il distractore "email" → appare headline "Sembra che tu pensi che il file sia nella email" → testo di remediation con analogia → pulsante "Riprova" → risponde correttamente → avanza. Il delta è visivo, non solo dichiarato.

**Learning Outcome Note (Deliverable 03)**:
Cosa Mario sa fare dopo: trovare un file PDF nella galleria/file manager del telefono e caricarlo in un form web. Come si misura: transfer task — dopo il percorso principale (3 step su portale A), Mario affronta mock-form-2.html (portale B, layout diverso, stesso task). Se Mario trova il bottone "Carica file" senza aiuto al primo tentativo → la skill è generalizzata, non memorizzata. Misura in demo: "portale A: 2 tentativi con rimediazione → portale B: 1 tentativo senza aiuto". Osservabile in 30 secondi dalla giuria.

**Demo narrativa (3 minuti totali)**:
- 0:00-0:30 "prima": schermata del portale reale (screenshot o iframe), Mario che si blocca al bottone "Allega documento". "Questo è il blocco che impedisce a Mario di accedere alla riqualificazione."
- 0:30-2:00 "durante": percorso DigiStep. Profiling 3 domande → L1 assegnato. Step 1 risposta corretta → avanza. Step 2 sceglie "email" → headline misconcepto → remediation → riprova → avanza. Step 3 → completion score 3/3. Transfer task: portale B, Mario trova il bottone al primo tentativo.
- 2:00-3:00 "dopo + live probe": moderatore dice "vi faccio vedere cosa succede con un errore che Mario non ha mai incontrato". Seleziona distractore non-fixture → DEMO_MODE=false per questa chiamata → loader → output LLM live → testo targeting quel misconcepto. "Questo è il motore che adatta in tempo reale."

**Alternative scartate con motivo**:
1. Tutor conversazionale aperto (chatbot generico sul digitale): esplicitamente vietato dal Tema 03 ("tutor conversazionali aperti senza percorso strutturato"). Eliminata in Fase 0.
2. Quiz sul vocabolario digitale ("sai cosa è un URL?"): scartata (PM Fase 1) perché non ha uno scenario concreto di apprendimento — imparare definizioni non mappa su task reale misurabile. Il before/after è debole ("prima non sapeva cosa fosse un URL, dopo lo sa"): la giuria non vede un cambio di comportamento.

---

#### 3. Scope MVP vs scope tagliato

**DENTRO le 4 ore (MVP)**:
- Profiling quiz: 3 domande MCQ → assegnazione L1 o L2 deterministica
- 3 step del percorso di apprendimento (ridotto da 5 a 3 per scope aggressivo) — ciascuno con: spiegazione livello-appropriata + 1 domanda MCQ checkpoint
- AdaptiveEngine: logica di routing deterministica (se-sbaglia-allora-remediation) + chiamata LLM con chiave composta step/level/distractor
- Fixtures.json pre-generate per tutte le combinazioni step×level×distractor (12-18 chiavi, generate nelle prime 1h15 di sviluppo)
- Live slot: 1 distractore non in fixtures per dimostrazione capability live
- Mock-form-1: portale A simulato (3 interazioni per il task upload)
- Mock-form-2: portale B per transfer task (layout diverso, stesso task)
- Completion score + riepilogo step
- UI con requisiti a11y minimi
- DEMO_MODE flag con fallback automatico

**ESPLICITAMENTE FUORI (scope tagliato)**:
- Più di 3 step nel percorso (tagliato da 5 a 3)
- Domande generate dinamicamente da LLM (tutte hardcoded in JSON)
- Auth utente, login, sessioni persistenti
- Backend/database
- Mobile responsive (oltre Tailwind gratuito)
- Screen reader ARIA completo
- Multilingua
- Vera integrazione con portale INPS o PA reale
- Dashboard analytics, storico multi-utente
- TTS/STT/input vocale
- Accessibilità avanzata oltre i 7 requisiti minimi

---

#### 4. Stack tecnico consigliato

**Stack**: HTML + Tailwind CDN + JavaScript vanilla. File singolo (o max 3 file: index.html, engine.js, data/) apribile con `python3 -m http.server 8080`. Zero npm, zero build step, zero setup infrastrutturale.

**Motivazione velocità 4h**: agentic coding è ottimizzato per HTML+JS vanilla (massima densità di training data, nessun toolchain da configurare). Se uno dei due ha React e il setup è testato in 10 minuti → ok, altrimenti non si tocca.

**Chiamate LLM**: API Anthropic (Haiku per latenza mediana ~1s e costo contenuto, oppure il provider per cui si ha già la key funzionante). Le chiamate NON vengono esposte direttamente dal browser (espone la key): si usa un mini-proxy Python/Express locale (10 minuti di setup, 30 righe). Alternativa se CORS non è gestibile: Vite dev server con proxy integrato. La key va testata entro i primi 20 minuti — questa è la dipendenza D1 critica.

**Persistenza**: `localStorage` per lo stato intra-sessione (livello assegnato, step corrente, score). Zero persistenza cross-sessione — ogni reload ricomincia. Questo è uno scope cut esplicito, non un bug.

**Deploy demo**: `python3 -m http.server 8080` nella cartella del progetto. Demo su laptop del presentatore in localhost. ZERO dipendenza da rete per il flusso principale (tutte le chiamate LLM sono in fixtures.json).

**Gestione LLM in produzione di fixtures**:
- Durante le prime 1h15: P-A chiama l'API per generare le 12-18 risposte di remediation e le salva in fixtures.json.
- In demo: DEMO_MODE=true (lettura da fixtures.json, zero chiamata di rete).
- Live slot: 1 distractore non in fixtures → DEMO_MODE=false per quella singola chiamata.

**Piano B se l'LLM non risponde in demo**:
- Prima scelta: fixtures.json (già nel dispositivo, zero rete). DEMO_MODE è ON di default.
- Seconda scelta (live slot fallisce): il componente mostra un fallback testuale pre-scritto ("La connessione è temporaneamente non disponibile. Ecco la spiegazione già preparata: [testo]") senza crash visibile, senza spinner infinito.
- Regola operativa: a 3:30h il team stacca il cavo di rete e rifa il flusso completo. Se crasha, il problema è risolto prima della demo.
- Lo scenario "l'LLM non risponde in demo" non esiste se DEMO_MODE è on: la demo gira offline.

---

#### 5. Piano operativo 4 ore

**Assunzione**: 4 ore include dev + demo preparation. Coding effettivo stimato: 2h30 (tolti setup, deliverable testuali, demo). Pessimista, non ottimista.

| Slot | P-A (logica/engine/LLM) | P-B (UI/contenuto/a11y) |
|---|---|---|
| 0:00–0:20 | API key test, proxy CORS (Python 30 righe), schema fixtures.json con chiave composta {step_id}-{level}-{distractor_id} definito e condiviso | index.html + Tailwind CDN, font 18px + palette AA (#1a1a1a su #fff), struttura HTML (main, sections) |
| 0:20–0:50 | quiz-engine.js: profiling quiz (3 MCQ → L1/L2 deterministico), state machine PROFILING→STEP→CHECKPOINT→REMEDIATION→NEXT→COMPLETION | mario-content.json: 3 step × 1 MCQ × 2-3 distractori con campo `misconcepto`. Testo max 15 parole per frase |
| 0:50–1:15 | explainer.js: `resolveRemediation(step, level, distractor)` → cerca fixtures.json (chiave composta), se assente chiama API, se fallisce ritorna fallback testo | Componente spiegazione adattiva: headline "Sembra che tu pensi che...", testo remediation, pulsante Riprova (44px) |
| 1:15–2:00 | **Genera fixtures.json**: chiama API per ogni combinazione step/level/distractor (12-18 call). Identifica il live slot (1 distractore non salvato). Testa DEMO_MODE on/off | **A11y pass (45 min allocati, non comprimibili)**: contrasto DevTools, touch target, una-azione-per-schermata, plain language review, progress indicator, HTML semantico |
| 2:00–2:20 | Integration: wiring engine + content + fixtures. DEMO_MODE=true di default | mock-form-2.html: stesso task, layout diverso (transfer task) |
| 2:20–2:30 | E2E test: flusso L2 nominale + flusso L1 con errore + live slot. Offline test (rete staccata) | Fix bug visivi/a11y se trovati durante E2E |
| 2:30 | **CHECKPOINT GO/NO-GO** | |
| 2:30–3:00 | Script narrativo demo (2 min), sequenza live slot nella narrazione, Adaptive Evidence (2 screenshot affiancati L1/L2) | Slide 3 deliverable: LPS (Mario + difficoltà + scenario), AE (screenshot), LO Note (completion score + transfer) |
| 3:00–3:30 | Rehearsal 3× del flusso demo, cronometro (target ≤4 min). Accordo su "chi parla / chi clicca" | a11y checklist finale 7 punti (15 min). Rehearsal |
| 3:30–4:00 | Dry run con cavo staccato. Buffer per ≤1 bug critico. Stop sviluppo a 4:00 netto | — |

**Divisione lavoro — parallelismo massimo fino a 2:00h**:
- P-A: engine.js, fixtures LLM, wiring, script demo
- P-B: HTML/CSS, mario-content.json, a11y pass, slide deliverable
- Punto di sincronizzazione a 2:00h per integration

**Checkpoint GO/NO-GO a 2:30h**:
- GO: 3 flussi E2E passati (L2 nominale, L1 con remediation, offline). Si procede a polish.
- PARZIALE-A (flusso ok, live slot instabile): DEMO_MODE puro, narrazione "output Claude pre-validati" + mostra il codice del prompt live.
- PARZIALE-B (transfer task non pronto): si elimina, LO misurato su completion step 3 (metrica binaria).
- NO-GO (meno di 2 step funzionanti): si presenta quello che funziona. Dichiarato apertamente: "abbiamo implementato X/3 step; la capability è dimostrabile sui step completati."

**Dipendenze critiche (rosso se non risolte entro la scadenza)**:
- D1 — API key funzionante entro 0:20
- D2 — CORS/proxy risolt entro 0:30
- D3 — schema fixtures.json definito e condiviso tra P-A e P-B entro 0:20 (è il contratto tra i due)
- D4 — Fixtures.json con almeno 6 chiavi (top 2 distractori per step) entro 1:15
- D5 — Flusso E2E pass entro 2:30

---

#### 6. Rischi principali (top 5)

**R1 — Capability percepita come "riscrittura" dalla giuria (rischio squalifica)**
Descrizione: la giuria chiede "cos'è esattamente la capability agentica" e la risposta non convince — o perché l'adattamento è cosmetico (solo tono diverso), o perché si usa DEMO_MODE senza live slot dimostrativo.
Mitigazione: fixtures.json con chiave composta (per misconcepto, non per step); live slot obbligatorio nella narrazione; la risposta alla domanda della giuria è preparata: "il prodotto rileva il misconcepto specifico dall'errore e genera la spiegazione che corregge quel misconcepto — non il concetto in generale".
Probabilità residua senza mitigazione: alta. Con mitigazione: bassa-media.

**R2 — Superamento del vincolo "tutor conversazionale aperto" (rischio squalifica formale)**
Descrizione: l'app viene giudicata come un "tutor conversazionale aperto senza percorso strutturato" — esplicitamente vietato dal Tema 03.
Mitigazione: ZERO input testuale libero lato utente (solo MCQ, deciso come accordo congelato). Il curricolo ha 3 step in ordine fisso. L'utente non può scegliere cosa imparare. Il percorso è teacher-led (l'app guida), non user-led.
Probabilità residua senza mitigazione: media (facile scivolare). Con mitigazione implementata: minima.

**R3 — Demo failure per LLM instabile nel live slot**
Descrizione: la chiamata LLM live (il distractore non-fixture) fallisce o tarda durante la demo.
Mitigazione: DEMO_MODE on per tutto il resto della demo. Il live slot è una demo opzionale della capability, non il percorso portante. Se fallisce → fallback testuale senza crash, narratore dice "stiamo avendo un problema di rete, ma vi mostro il codice del prompt che questa chiamata avrebbe eseguito". Non si dipende dalla rete per la dimostrazione del prodotto.
Probabilità residua: bassa (il fallback è architetturale, non improvvisato).

**R4 — Overrun a11y con demo non credibile per giuria inclusione**
Descrizione: i 75-90 minuti di a11y non vengono allocati e la demo ha font piccolo, basso contrasto o istruzioni tecniciste. La giuria di inclusione vede un prodotto non usabile da Mario.
Mitigazione: P-B ha slot dedicato 1:15-2:00 per a11y (45 min allocati esplicitamente). Palette AA definita a 0:00 (non retrofitted). Plain language review del contenuto mario-content.json fatta da P-B a 0:20-0:50 mentre scrive. Nessuna immagine di persone giovani o ambienti da ufficio.
Probabilità residua senza mitigazione: alta. Con mitigazione: bassa.

**R5 — Punto di non ritorno raggiunto con flusso rotto (rischio consegna)**
Descrizione: a 2:30h il flusso E2E non funziona. Il team non ha un fallback dichiarato e improvvisa in demo.
Mitigazione: GO/NO-GO a 2:30h esplicito con tre scenari definiti (GO / PARZIALE-A / PARZIALE-B / NO-GO). In ogni scenario si sa cosa mostrare. La demo script è pronta per tutti gli scenari. Si smette di sviluppare a 4:00 netto — non si aggiunge nemmeno una feature.
Probabilità residua: presente (inherente alla complessità), ma gestita.

---

#### 7. Punti Aperti residui

Nessun punto aperto residuo di natura decisionale. Tutti i PA della sessione sono stati risolti.

**Nota tecnica residua** (non è un PA — è un rischio implementativo da monitorare): la stima di P-B per la generazione del fixtures.json (12-18 chiamate API) dipende dalla latenza dell'API Anthropic in quel momento. Se ogni chiamata costa 2-3 secondi, le 18 chiamate richiedono 36-54 secondi in burst → accettabile. Se c'è rate limiting → si riduce a 6 chiamate prioritarie (1 distractore per step per livello) e si aggiungono le altre solo se rimane tempo. Questo non impatta GO/NO-GO.

---

### Motivazione

La soluzione è emersa dalla convergenza di 5 prospettive specialistiche con tensioni reali. Il Critico ha svolto il suo ruolo in modo decisivo: ha identificato che l'adattamento "cosmetico" (solo riscrittura) non supera la barra del tema, forzando il team a identificare la capability irriducibile (targeting del misconcepto specifico via chiave composta). La disciplina di pianificazione del TPM (checkpoint, dipendenze critiche, 45 min demo fissi) è stata integrata nel piano operativo anche per T03.

Il piano B LLM (DEMO_MODE + fixtures.json) è stato trasformato da "rete di sicurezza" a "architettura dichiarata": non è inganno verso la giuria, è validazione anticipata delle risposte AI che si presenta come tale — e consente di avere un live slot isolato per dimostrare la capability effettiva.

### Dissensi registrati

**TPM**: il dissenso sulla scelta del tema (T02 vs T03) è stato formalmente registrato. Il TPM ha argomentato con criteri di pianificabilità validi. La Tavola Rotonda ha valutato che il rischio di correttezza semantica adversariale di T02 (numeri finanziari semplificati in modo sbagliato) è più difficile da mitigare del rischio di complessità di T03, e ha confermato T03. Il piano operativo ha adottato la disciplina del TPM anche su T03: checkpoint a 2:30h, GO/NO-GO esplicito, scope cut a 3 step, 45 min demo fissi.

### Criteri di successo verificati

- [x] Verdetto sulla scelta del tema con rationale ancorato alle 4 ore: SODDISFATTO (T03, rationale esplicito vs T01 e T02)
- [x] 1 proposta web app raccomandata + 2 alternative scartate: SODDISFATTO (DigiStep + 2 scartate con motivo)
- [x] Learner Profile Statement preciso: SODDISFATTO (Mario Rossi, 61a, ex operaio, upload PDF portale regionale)
- [x] Capability agentica concreta: SODDISFATTO (targeting misconcepto via chiave composta step/level/distractor)
- [x] Adaptive Evidence: SODDISFATTO (demo biforcazione L1 vs L2 sulla stessa domanda)
- [x] Learning Outcome Note misurabile in ≤3 min: SODDISFATTO (transfer task portale B, osservabile in 30s)
- [x] Scope MVP vs tagliato: SODDISFATTO (lista esplicita in/out)
- [x] Stack tecnico con piano B LLM: SODDISFATTO (HTML+Tailwind CDN + fixtures.json + live slot con fallback)
- [x] Piano operativo 4h con slot e checkpoint go/no-go: SODDISFATTO (tabella slot + GO/NO-GO a 2:30h con 3 scenari)
- [x] Top 3-5 rischi con mitigazione: SODDISFATTO (5 rischi, inclusi 2 di squalifica)
- [x] Punti Aperti residui: SODDISFATTO (nessun PA aperto)
