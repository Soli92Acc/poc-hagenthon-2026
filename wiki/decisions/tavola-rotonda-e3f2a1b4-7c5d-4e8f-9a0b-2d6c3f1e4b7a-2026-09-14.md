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

---

## ROUND 2 — RE-SCOPING DSA

*Sessione avviata 2026-09-14T14:00:00Z — Moderatore: tavola-rotonda-moderatore*
*Parametri: topic "Re-scoping PoC Hagenthon su supporto DSA: 3 audience, 4-5 feature, 4h dev pure" | max_round: 2 | budget: 4.00 USD | Critico: lead-architect*
*Cosa resta immutabile dal Round 1: verdetto Tema 03, divieti, piano B LLM, zero DB/auth, stack HTML+Tailwind+JS, solo MCQ, capability = misconcepto targeting (chiave composta).*
*Cosa cambia: dominio DSA (dislessia o discalculia), 3 audience (docenti/genitori/studenti), 4h dev pure (45 min demo separati), 4-5 feature, scalabilità come criterio.*

### Posizioni Fase 1 — Round 2

### product-manager — 2026-09-14T14:08:00Z

**Scelta: DISCALCULIA.**

La capability irriducibile del Round 1 era la tripletta (step_id, level, distractor_id) → LLM targettizza il misconcepto specifico. Per la discalculia il distractor è un numero: lo studente che sceglie 46 invece di 55 su "34 + 21 = ?" rivela il misconcepto "posizionamento valore", mappabile con precisione. La chiave composta produce spiegazioni qualitativamente diverse per ogni errore. La giuria può chiedere "cambia distractor" e verificare in 10 secondi.

Con la dislessia, il mapping distractor→misconcepto in MCQ-only è diffuso: lo studente può aver sbagliato per decodifica fallita, working memory o inferenza errata — indistinguibili. La capability collassa in "riscrittura generica" esattamente come il fallimento critico identificato nel Round 1. In più, gli strumenti di supporto per dislessia (TTS, font) sono già nei sistemi operativi — una demo hackathon rischia di reinventare l'accessibilità di base.

**Scarto esplicito della dislessia:** TTS è la compensazione primaria e il suo time-sink è enorme; mapping distractor→misconcepto diffuso; contenuto più soggettivo.

**Nome prodotto: "NumeriMiei" — Coach di calcolo che spiega l'errore giusto allo studente con discalculia.**

**Tre audience:**
- STUDENTE (primaria): sequenza esercizi MCQ discalculia, una sola operazione per schermata. Se sbaglia: headline che nomina il misconcepto rilevato + spiegazione 40-50 parole + pulsante Riprova. Audience non riducibile.
- DOCENTE (configurazione + monitoraggio): seleziona livello PDP dello studente (L1/L2/L3 — già certificato clinicamente, NON assegnato dal sistema). Report post-sessione con lista misconcepit rilevati e frequenza. Gate clinico: il sistema non assegna mai il livello autonomamente. Copy: "Seleziona il livello indicato nel PDP del tuo studente."
- GENITORE (informativa — audience ridotta dichiarata): schermata read-only, riepilogo plain-language. Dati dal medesimo localStorage della sessione studente. 20-25 minuti implementazione. Primo taglio al checkpoint 2:30h se in rosso.

**Le 5 feature (P0/P1/P2):**
- F1 — Configurazione PDP docente: docente seleziona livello da menu (3 opzioni), sistema carica esercizi calibrati. 20 min. P0.
- F2 — Engine MCQ con misconcepto targeting (CORE — capability irriducibile): 3-4 opzioni, ogni opzione errata corrisponde a misconcepto categorizzato in content JSON, tripletta step/level/distractor. 75 min incluso content JSON. P0.
- F3 — Spiegazione adattiva LLM-driven: chiave composta → fixtures.json → live slot per 1 distractor non in fixtures. Headline descrive il misconcepto, testo 50 parole max. 45 min. P0.
- F4 — Report post-sessione docente: tentativi, step, lista misconcepit. Da localStorage, zero API. 35 min. P1.
- F5 — Scheda genitore plain-language: traduce report in frasi comuni. 20 min. P2 — primo taglio.

**Demo narrative:** Il filo è il percorso di Luca visto da tre angoli. 0:00-0:30 docente configura L1. 0:30-1:45 Luca sbaglia ("46") → headline misconcepto → spiegazione → riprova → avanza; biforcazione visibile L1 vs L2. 1:45-2:15 report docente + scheda genitore. 2:15-3:00 live probe: distractor non in fixtures → LLM live → spiegazione nuova. Le tre audience condividono lo stesso stato localStorage → non sembrano tre app ma tre lenti sullo stesso percorso.

**Difesa "3 audience in 4h":** La view docente è architetturalmente necessaria (è il gate clinico — senza di essa il sistema deve assegnare il livello autonomamente, che è screening). Costo audience secondarie: 75 min totali. L'80% del tempo va alla capability core. La view genitore (P2) è il primo taglio.

**Confine clinico nel prodotto:** (a) zero path nel codice che calcola pdpLevel dalla performance — single-writer invariant sulla form docente; (b) feedback riferisce sempre all'errore matematico, mai al profilo clinico; (c) no output con "questo suggerisce difficoltà di livello X"; (d) dopo 3 tentativi falliti sullo stesso punto: "Questo esercizio è meglio affrontarlo con il tuo insegnante"; (e) footer permanente: "NumeriMiei è uno strumento didattico compensativo per studenti con diagnosi certificata di discalculia ai sensi della Legge 170/2010. Non sostituisce la valutazione clinica."

---

### tutor — 2026-09-14T14:09:00Z

**Scelta: DISCALCULIA. Senza riserve.**

Argomento strutturale: il vincolo MCQ-only è congelato dal Round 1 ed è ortogonale alla dislessia ma coerente con la discalculia. Un MCQ è testo: uno studente con dislessia che sbaglia un MCQ può averlo fatto per decodifica fonologica fallita, difficoltà di working memory o incomprensione concettuale — i tre casi sono indistinguibili in MCQ-only. La tripletta step/level/distractor perde valore diagnostico: non sai perché ha scelto quel distractor. Per la dislessia lo strumento compensativo più validato è il TTS — che rimuove la barriera di decodifica. Senza TTS un MCQ-only per dislessici è peggio di un foglio di carta.

Per la discalculia gli errori in matematica seguono pattern prevedibili (Ni e Zhou 2005 sulle frazioni; Geary 2004 sul number sense): "23+9=212" → misconcepto *concatenazione*; "1/3 > 1/2" → misconcepto *denominator magnitude error*. Ogni distractor È un misconcepto. La tripletta è diagnostica.

**Scarto dislessia:** MCQ-only non osserva il processo di decodifica. Il mapping distractor→misconcepto è diffuso. Senza TTS il prodotto non compensa la dislessia; con TTS è un time-sink architetturale insostenibile in 4h.

**Il nodo pedagogico: compensazione vs apprendimento (Sweller + Geary 2004):**
Distinguere discalculia procedurale (calcolatrice compensa) da difficoltà nel number sense (non compensabile con calcolatrice — richiede sviluppo di intuizione quantitativa). Il PoC si posiziona sul secondo tipo: la linea dei numeri visiva è lo strumento compensativo per ACCEDERE al ragionamento, ma il LO è che lo studente impara a USARLA autonomamente. Questo è pedagogicamente legittimo e misurabile.

Per ridurre extraneous cognitive load (CLT): una sola azione per schermata, istruzioni ≤15 parole, zero elementi decorativi. La linea dei numeri visiva riduce l'intrinsic load (libera working memory dal posizionamento numerico). Il germane load — dove avviene l'apprendimento — è lo schema "uso la linea per confrontare grandezze". Questo schema è disponibile allo studente anche senza il prodotto dopo la sessione.

**I 3 deliverable riformulati per discalculia:**

*Learner Profile Statement (Deliverable 01):* Luca, 11 anni, classe 1a media. Diagnosi: discalculia (certificazione ASL, PDP ottobre 2025). Sottotipo: difficoltà nel number sense, specificamente nel confronto di frazioni con denominatori diversi. Misconcepto documentato: "denominator magnitude error" (Ni e Zhou, 2005) — risponde sistematicamente "1/4 è maggiore di 1/3 perché 4 > 3". Scenario concreto: la docente ha introdotto le frazioni. Il PDP prevede uso di linea dei numeri come misura compensativa ma Luca non sa usarla autonomamente.

*Adaptive Evidence (Deliverable 02):* Il sistema cambia in base al tipo di errore, non solo al "livello generico". Errore tipo A (distractor "1/4 perché 4 > 3"): il sistema identifica il misconcepto "confonde grandezza denominatore con grandezza frazione" → mostra pizza divisa in 3 vs 4 parti → chiede "in quale caso ogni fetta è più grande?" → ripresenta la domanda. Errore tipo B (risposta "non so"): torna al prerequisito. Risposta corretta: avanza con variante più complessa (2/5 vs 2/4) per verificare generalizzazione.

*Learning Outcome Note (Deliverable 03):* Prima: Luca risponde basandosi sul valore del denominatore. Dopo: usa la linea delle frazioni come strategia procedurale per confrontare frazioni con stesso numeratore. Metrica in ≤3 min: domanda transfer non vista "1/5 vs 1/6?" — se usa la linea autonomamente → metodo acquisito, non memorizzato. Osservabile in 30 secondi. Caveat onesto: questo LO è all'interno del PDP (linea dei numeri era già prevista come misura compensativa). Il prodotto ha insegnato a Luca a USARLA autonomamente — non è riabilitazione, è potenziamento dell'uso di uno strumento già previsto.

**Trappole pedagogiche da evitare:** (1) compensazione spacciata per apprendimento ("la app legge al suo posto" → LO zero); (2) DSA come etichetta monolitica senza specificare sottotipo; (3) feedback generico "Risposta errata, riprova" invece di targettizzare il meccanismo; (4) overload working memory nell'interfaccia (troppe informazioni contemporanee); (5) report numerico "73% corretto" spacciato per LO invece di transfer task su item non visto.

**Le 3 audience dal punto di vista pedagogico:**
Il feedback allo studente deve essere in seconda persona singola e non giudicante. Gli errori non devono essere visibili al docente in tempo reale (privacy — il prodotto non è un sistema di sorveglianza). Il docente idealmente seleziona non solo "livello" ma anche quali misconcezioni prioritizzare (basato su osservazioni in classe). Il report genitore: descrittivo non valutativo, nessun termine clinico, una cosa concreta senza raccomandare pratiche autonome (quella è scelta clinica del PDP).

**Retrieval practice per DSA discalculia:** feedback immediato e specifico (non differito); blocked practice prima di interleaving (studente acquisisce la strategia su tipo uniforme prima di mescolare); domande progettate per esporre il misconcepto, non per testare recall; sessioni brevi e frequenti (5-8 minuti, non 30 continui).

---

### a11y-specialist — 2026-09-14T14:10:00Z

**Scelta: DISLESSIA.**

**Argomento 1 — Implementabilità a11y in 4h:**
Dislessia: i requisiti si traducono interamente in CSS (letter-spacing, word-spacing, line-height, max-width, hyphens, background-color) più Web Speech API opzionale. DOM invariato. Profilo tipografico compliant in 30-45 minuti, misurabile visivamente dalla giuria. WCAG 1.4.12 Text Spacing fornisce baseline testabile con axe.

Discalculia: i requisiti a11y implicano rappresentazione visiva di strutture numeriche (allineamento colonne, color coding per posizione cardinale, number line, blocchi Dienes). Non sono CSS su testo esistente: richiedono componenti custom (SVG, Canvas, HTML strutturato). Complessità 3-5x superiore. Non esiste un subset WCAG che copra specificatamente la cognizione numerica.

**Argomento 2 — Rischio demo:** Per dislessia il rischio è implementare il mito OpenDyslexic — mitigabile (se ne conosco la letteratura). Per discalculia il rischio è produrre uno strumento che riduce il carico per un utente generico ma non per un discalculico specificamente. Non c'è criterio visivo semplice per dimostrarlo senza test utente reali. La demo diventa una promessa non falsificabile.

**Scarto discalculia:** le componenti custom (number line, blocchi) hanno complessità implementativa che supera di 3-5x la CSS-only approach della dislessia; non c'è standard a11y di riferimento consolidato per discalculia nel digitale.

**Requisiti DSA per dislessia (evidence-based):**
- Font: OpenDyslexic è un mito parzialmente smentito (Rello & Baeza-Yates 2013; Marinus et al. 2016). Non superiore ad Arial, Verdana, Comic Sans. Usare sans-serif system con spaziature corrette. OpenDyslexic solo come opzione personale, non come soluzione universale.
- Spaziatura: letter-spacing 0.12em (WCAG 1.4.12), word-spacing 0.16em, line-height 1.5 minimo (1.8 ottimale per dislessia), max-width 60ch (BDA Style Guide — non "più è meglio", curve a U).
- Hyphens: `hyphens: none` OBBLIGATORIO. Parole spezzate a fine riga aumentano il carico decodificativo. Usare `text-align: left`, mai `justify`.
- TTS: non obbligatorio WCAG AA, best practice COGA. Web Speech API: play/pause su paragrafo 45-60 min, speed control 15 min aggiuntivi. Evidenziazione sincronizzata TTS+highlight: 3-4h standalone → TAGLIARE.
- Overlay colori: evidenza controversa (Meares-Irlen). Background crema #FFF8E7 con testo #333333 supera 4.5:1 e riduce l'abbagliamento percepito. Offrire theme switcher bianco/crema (45 min).

**Must-have dislessia in 4h (tabella):**
| Requisito | Tempo | Categoria |
|---|---|---|
| Font sans-serif ≥18px, letter-spacing 0.12em, word-spacing 0.16em, line-height 1.5 | 15 min CSS | MUST |
| max-width 60ch su testo | 5 min | MUST |
| hyphens: none; text-align: left | 2 min | MUST |
| Contrasto AA 4.5:1 verificato | 20 min | MUST |
| HTML semantico + focus visible outline 3px | 15 min | MUST |
| Chunking visivo (1 blocco per schermata) | 30 min UX writing | MUST |
| Theme switcher bianco/crema (min 2 opzioni) | 45 min | NICE |
| TTS play/pause + rate control | 60-90 min | NICE |
| TTS + word highlight sincronizzato | 3-4h | TAGLIA |

MUST totali: ~1.5-2h. Lascia 2-2.5h per feature di prodotto.

**Trappole che la giuria riconosce in 5 secondi (dislessia):** (1) text-align: justify; (2) font serifato per corpo testo; (3) "usato OpenDyslexic perché aiuta i dislessici" (mito documentato); (4) TTS senza controllo velocità; (5) UI che fa implicito screening (schermata "Rileva la tua difficoltà prima di iniziare").

**Miti a11y per DSA da sfatare:** (1) OpenDyslexic superiore ad Arial (Rello 2013 dice no); (2) più contrasto = sempre meglio per tutti (extreme contrast può peggiorare il visual stress per una subset di dislessici); (3) TTS risolve la dislessia digitale (TTS senza highlight e calibrazione può aumentare il carico, non ridurlo); (4) WCAG AA copre tutti i requisiti DSA (WCAG non copre font choice, TTS, chunking cognitivo — serve COGA supplementare); (5) più contenuto per schermata aiuta (meno è meglio per dislessia, evidence-based: Swanson & Siegel 2001).

**Per le 3 audience:** i requisiti a11y DSA-specifici si applicano principalmente alla view studente. Eccezione 1: la dislessia è ereditaria (~40-60% — Snowling); una frazione di genitori ha tratti dislessici → applicare almeno line-height 1.5, max-width 70ch, sans-serif ≥16px anche alle view docente e genitore. Eccezione 2: contenuti adattati condivisi cross-audience mantengono stessa spaziatura. Nessuna delle 3 audience richiede TTS nella navigazione dell'app — solo nella view studente per i contenuti.

---

### lead-architect — 2026-09-14T14:11:00Z

*(Doppio mandato: lead-architect + Critico)*

**Scelta tecnica: DISCALCULIA. Cinque argomenti tecnici.**

1. **Chiave composta e mapping discreto:** In matematica il misconcepto è discreto e nominato. `23+9=212` → misconcepto *concatenazione*; `0,25>0,5` → misconcepto *"più lungo è più grande"*. Ogni distractor È un misconcepto — non multi-causale. Per dislessia MCQ-only, la risposta sbagliata è diffusa (decodifica fallita, working memory, inferenza errata) — il mapping collassa verso "riscrittura generica", esattamente il fallimento identificato dal Critico nel Round 1.

2. **Verificabilità dalla giuria:** la spiegazione del meccanismo d'errore matematico è oggettivamente falsificabile (giusto o sbagliato, standard in letteratura didattica). Una remediation di lettura è soggettiva ("meglio/peggiore"). La falsificabilità qui è un pregio per la demo.

3. **Nessuna dipendenza TTS:** la compensazione primaria della dislessia È il TTS. Web Speech API introduce fragilità demo ambiente-dipendente: voce italiana non garantita su hardware sconosciuto, Chrome tronca utterance >15s, race di getVoices(). La compensazione della discalculia è visiva (linea dei numeri, allineamento colonna) → puro HTML/CSS, deterministico, zero API browser rischiose.

4. **Nessun MathJax:** il livello compensativo è aritmetico (interi, decimali semplici, frazioni base) — renderizza in testo + CSS (grid per colonne, SVG/CSS per linea dei numeri). MathJax serve solo per notazione algebrica avanzata. Zero build, zero CDN ~1MB.

5. **Autorabilità del contenuto in 4h:** item aritmetici + distractor con misconcepto categorizzato sono finiti, generabili, testabili a tavolino.

**State management 3 audience:** UN solo stato (localStorage, single source of truth) + TRE proiezioni con permessi diversi. Role-switch: `?role=teacher|parent|student` come selettore di funzione di render su AppState condiviso. Perché URL param: istantaneamente dimostrabile (cambio URL e lo stesso stato si renderizza in tre modi → prova visiva); roleness ispezionabile. Demo convincente "role round-trip": errore studente → `?role=teacher` (stesso URL) → misconcepto loggato → `?role=parent` → "Marco ha esercitato le addizioni, 3 tentativi, in miglioramento". Stesso stato, tre lenti, redazione applicata.

**Scalabilità — 4 extension point reali (non retorica):**
Regola invariante: tutto il contenuto via `data/*.json` fetchato a runtime (fetch live = edit+reload, zero rebuild). Struttura: `data/curriculum-discalculia.json`, `data/misconceptions.json`, `data/fixtures.json`, `data/pdp-levels.json`.

EP-1: Nuovo modulo = oggetto JSON, zero JS. Demo 30s: incollo modulo "sottrazione con prestito", reload, appare nel selettore docente.
EP-2: Nuovo misconcepto + fixture = un distractor + una chiave in fixtures.json, zero JS. Demo 30s: aggiungo distractor "212" per 23+9, reload, appare la spiegazione mirata.
EP-3: Nuovo livello PDP = oggetto JSON in pdp-levels.json, zero JS. Il docente seleziona "L3", stessi esercizi si renderizzano con parametri diversi.
EP-4: Swap dominio del disturbo = swap cartella dati. L'engine è disorder-agnostic (schema-driven). `curriculum-dislessia.json` con stesso schema → stessa shell gira esercizi di lettura. Questo dimostra che discalculia è la prima istanza, non un hardcoding.

**Architettura aggiornata:**
- `LearnerProfile` → MUTATO (zona pericolo clinico): rimuovere quiz che assegna livello. Diventa lettore del livello fornito dal docente + eventuale warm-up non-clinico (preferenze di presentazione). Mai calcola pdpLevel dalla performance.
- `GuidedTaskRunner` → regge.
- `AdaptiveEngine` → regge, più pulito per discalculia.
- `OutcomeTracker` → regge, aggiunge tracking per-misconcepto e scaffold-fading.
- Nuovi: `TeacherConfigView` (~35 min — scrive SOLO config, mai tentativi — gate clinico), `ParentReportView` (~20 min — read-only + layer redazione che mappa nomi-misconcepto clinici → linguaggio incoraggiante).

**Gate clinico — 3 invarianti ispezionabili:**
1. Single-writer su pdpLevel: esiste un solo code path che scrive pdpLevel = la form docente. AdaptiveEngine lo legge, mai lo scrive. Grep del codice: un solo writer.
2. Output allowlist: OutcomeTracker registra fatti (tentativi, quale misconcepto, risolto sì/no), mai giudizi clinici. ParentReportView renderizza da allowlist di frasi incoraggianti.
3. Affordance UI: la form docente etichetta "Livello PDP (dal Piano Didattico Personalizzato certificato)". La UI dichiara che il livello viene dal PDP, non dall'app.

**Piano B LLM per discalculia:** chiave `{step_id}-{level}-{misconcept_id}` (distractor_id ↔ misconcept_id). Fixture è spiegazione del meccanismo d'errore + analogia con manipolativo calibrata al livello (L1 = linea numeri + blocchi base-10 ≤20; L2 = decomposizione parziale ≤100). 12-18 fixtures. Live slot confermato. Testo fixture non usa mai vocabolario clinico/riabilitativo (constraint esplicito nel prompt di generazione).

**Punti di attacco Critico (Fase 2):**
a) **Sconfinamento clinico subdolo:** il punto più fragile non è la form docente (presidio facile) ma il testo LLM del live slot (non pre-vetted) e il warm-up (se sconfina dal "preferenze di presentazione" al "profilare"). Qualsiasi linguaggio normativo/comparativo nel report genitore ("sotto la media per l'età") = screening mascherato. Chiederò: dove è il filtro sul testo LLM live?
b) **3 audience come feature theater:** la view docente deve SCRIVERE davvero config che cambia il comportamento studente. La view genitore deve REDIGERE davvero (trasformazione, non filtro CSS). Se nessuna delle due esiste → tre temi CSS.
c) **Feature contata ma non funzionante a 3:45h:** candidato numero 1: sincronizzazione cross-tab role round-trip. L'evento `storage` non scatta nella stessa tab che ha scritto — quirk noto. Se dimenticiamo il listener → sembra rotto in demo. Candidato 2: live slot (già noto Round 1).
d) **Scalabilità raccontata vs dimostrata:** reale = il runtime legge il nuovo JSON al reload SENZA rebuild (garantito solo se zero contenuto inlined in JS). Falso = JSON "esterno" ma serve un rebuild o il contenuto è string literal nel .js. Chiederò: "aprite il JS — nessun testo di esercizio inline, zero".
e) **Compensazione spacciata per apprendimento — il più profondo:** Se lo studente può ritentare infinitamente con spiegazione migliore ogni volta, dov'è il Learning Outcome? La tensione: tool che compensa basta non produce delta misurabile; tool che misura il miglioramento rischia assessment/screening. Risoluzione non-negoziabile che propongo: **scaffold-fading + transfer task**. L'outcome è "autonomia riduzione scaffolding": lo studente risolve item equivalente NUOVO con meno scaffolding (senza linea dei numeri, o al primo tentativo) dopo la remediation. Senza scaffold-fading il deliverable 03 collassa in "retry infiniti = nessun LO". Questa è la singola cosa più importante da costruire.

---

### tpm — 2026-09-14T14:12:00Z

**Scelta pianificativa: DISCALCULIA. Dislessia scartata.**

Overhead implementativo dislessia: TTS/read-aloud 45-60 min + font toggle 10 min + overlay 20 min = 90-95 minuti di requisiti DSA-specifici che non esistono senza DSA. Con 2:30h di coding effettivo prima del checkpoint, 90 min su requisiti DSA lasciano 60 min per il core engine. Matematicamente insufficiente.

Overhead implementativo discalculia: numeri in lettere accanto alle cifre nel JSON 10 min + colore non usato come unico segnale (già incluso nel contrasto check) + feedback che nomina tipo errore (nella logica engine.js, costo zero aggiuntivo) + spazio bianco tra elementi numerici (architetturale, costo zero se fatto dall'inizio) = 15-20 minuti totali.

Scarto dislessia: overhead tecnico DSA-specifico di 90 min in budget di 240 min porta il piano in rosso strutturalmente. Non è un rischio gestibile al checkpoint — è una certezza matematica.

**La matematica reale — 4h piene con 2 persone (240 min):**

| Voce | Elapsed (min) | P-A | P-B | Note |
|---|---|---|---|---|
| Setup | 10 | API key test, proxy CORS, schema fixtures.json condiviso | index.html + Tailwind CDN, struttura HTML semantica | Parallelo totale |
| Core engine (profiling + MCQ + adaptive explainer + fixtures) | 70 | quiz-engine.js state machine, explainer.js chiave composta, genera 12-18 fixtures via API | mario-content.json 3 step × MCQ × 2-3 distractori con misconcepto_slug | Sync a 1:20 per schema condiviso |
| A11y base + DSA discalculia | 65 | 10 min verifica logica | 55 min: contrasto DevTools 10, touch target 10, plain language review discalculia 20 (non delegabile a LLM), progress indicator 15 | P-B sequenziale dopo content JSON |
| 3 audience (URL param + docente panel + genitore report) | 45 | 5 min URL param detection | 40 min: docente panel 20, genitore report 20 | P-B dopo a11y |
| Integration + E2E | 30 | Wiring + test flussi L1/L2/offline | Fix bug visivi | |
| Buffer tecnico | 20 | Per bug imprevisti | — | Non toccare per feature aggiuntive |
| **TOTALE** | **240** | | | A 4:00 stop netto. |

**Piano operativo — slot espliciti 0:00-4:00:**

| Slot | P-A | P-B | Dipendenze |
|---|---|---|---|
| 0:00–0:10 | API key test, proxy CORS Python 30 righe, schema fixtures.json definito e scritto | index.html Tailwind CDN, font 18px sans-serif, palette #1a1a1a/#ffffff, HTML semantico | D1: API key entro 0:10; D2: schema fixtures condiviso entro 0:10 |
| 0:10–1:20 | quiz-engine.js (PROFILING→STEP→CHECKPOINT→REMEDIATION→NEXT→COMPLETION), profiling 3 MCQ discalculia → L1/L2. explainer.js: resolveRemediation via chiave composta, fallback API, fallback testuale. Genera fixtures.json 12-18 chiavi | mario-content.json: 3 step discalculia × 1 MCQ × 2-3 distractori, campo misconcepto_slug. Testo max 15 parole per frase | D3: fixtures.json ≥6 chiavi entro 1:20 |
| 1:20–2:25 | Verifica logica (1 azione/schermata, no timeout, no auto-avanzamento). Poi debug fixtures, schema JSON docente | A11y 55 min + audience views: docente panel ?role=docente (20 min), genitore report ?role=genitore (20 min) | D5: A11y pass completato entro 2:25 |
| **2:25–2:30** | **CHECKPOINT GO/NO-GO** | GO: L1 sbaglia→remediation→riprova→avanza + offline test + docente view visibile. PARZIALE-A: engine OK, genitore assente. PARZIALE-B: solo core+a11y, zero audience. NO-GO: <2 step funzionanti. | D4: flusso E2E entro 2:25 |
| 2:30–3:30 | Wiring engine+content+fixtures, test L2 nominale, test L1 errore da fixtures, test offline, test live slot. Fix bug critici | Fix bug a11y. Screenshot Adaptive Evidence (L1 vs L2 affiancati) | |
| 3:30–4:00 | Buffer per ≤1 bug critico. Se non consumato: secondo live slot o transfer task | | |

**4:00 STOP DEV — 4:00–4:45 DEMO PREP SEPARATO**
Script narrativo 3 min (4:00-4:15) + rehearsal 2× cronometrato (4:15-4:30) + dry run cavo staccato (4:30-4:45).

**Feature prioritizzate:**

| Feature | P0/P1/P2 | P-A min | P-B min |
|---|---|---|---|
| F1 — Profiling quiz discalculia (3 MCQ → L1/L2) | P0 | 20 | 15 |
| F2 — Adaptive MCQ engine + fixtures.json | P0 | 60 | 25 |
| F3 — A11y DSA discalculia | P0 | 10 | 55 |
| F4 — Docente config view + report | P1 | 5 | 20 |
| F5 — Genitore report view | P2 — primo taglio | 5 | 20 |

**Rischio "3 audience = nessuna fatta bene":** il budget è saturato a 240 min. Proposta: eliminare genitore view (F5) dal piano base. F5 diventa bonus al checkpoint se il buffer non è stato consumato. Questo porta il buffer a 40 min (da 20 min). La genitore view rimane in roadmap dichiarata.

**Dipendenze critiche aggiornate D1-D6:**
- D1 (0:10): API key funzionante, una call di prova con risposta parsabile. Fallimento → Plan B manual fixtures (5-6 scritte a mano), stop tentativi dopo 15 min.
- D2 (0:10): schema fixtures.json condiviso tra P-A e P-B. Rischio silenzioso più sottovalutato: disallineamento emerge a 2:00h quando è troppo tardi. Risolto in 5 min al minuto 10.
- D3 (1:20): fixtures.json ≥6 chiavi prioritarie (1 distractor per step per livello, 3 step × 2 livelli).
- D4 (2:25): flusso studente E2E completo (L1 sbaglia → remediation → riprova → avanza → completion). Offline test.
- D5 (2:25): A11y pass completato da P-B.
- D6 (1:20): contenuto discalculia validato: nessun numero senza contesto, frasi <15 parole, feedback che nomina tipo errore invece di "sbagliato". Non delegabile a P-A o a LLM.

---

## Fase 2 — Confronto Round 2 — 2026-09-14T14:20:00Z

### a11y-specialist — aggiornamento posizione

**Aggiorna a DISCALCULIA.** L'argomento del lead-architect sul mapping distractor→misconcepto convincente per ragioni tecniche precise: in MCQ per dislessia, il distractor errato cattura difficoltà di decodifica, non un misconcepto matematico nominabile. L'indistinguibilità diagnostica annulla il valore dell'MCQ engine. Aggiorna anche la stima number line: una number line statica CSS con click-to-place (non drag) è 45-60 min, non "3-5x" — la stima precedente era per componente interattivo generico.

Requisiti a11y specifici per discalculia (aggiornati):
- `font-variant-numeric: tabular-nums` su elementi con digit — evidence-based (Butterworth), 5 min.
- Stacked fraction (numeratore/denominatore visivamente separati, ≥28px per numero), non slash inline — componente HTML+CSS, 20-30 min.
- Number line statica HTML+CSS con `position: relative` + marker assoluti a percentuali precalcolate — 25-45 min P-B.
- Una coppia di frazioni per schermata. Zero animazioni su elementi numerici (`prefers-reduced-motion` + no-animation default su numeri). Domanda persistente in viewport (sticky top). Gap ≥1.5rem tra opzioni MCQ. Single-column layout MCQ.
- `visibility: hidden` (non `display:none`) per elementi scaffold nel transfer task (mantiene box model, no layout shift).
- Feedback: mostrare risposta corretta CON number line che evidenzia la posizione. No punteggio numerico prominente in sessione.
- Miti sfatati: (1) OpenDyslexic superiore ad Arial → no evidence; (2) più contrasto sempre meglio → falso per visual stress; (3) standard WCAG bastano → WCAG non copre cognizione numerica, serve COGA.
- Condizione per scaffold-fading nell'a11y: elementi scaffold nel transfer item a `visibility: hidden`, no layout shift, focus management invariato, `aria-live: off` durante la transizione.

### lead-architect (Critico) — confronto argomentato

**a) Sconfinamento clinico live slot:** Il presidio è un denylist clinico deterministico — file `data/clinical-denylist.json` (~20-25 termini: diagnosi, disturbo, specialista, riabilit*, deficit, clinic*, etc.). Un unico entry point di rendering `renderRemediation(text)` usato SIA per fixtures SIA per live slot — ritorna il testo solo se nessun termine denylist è presente; altrimenti fallback pre-scritto. Verificabile: `grep -c renderRemediation *.js` = 1. Costo: ~10 min. Il prompt-constraint resta come primo strato; il denylist deterministico è il presidio reale.

**b) Feature theater 3 audience:** La view docente deve SCRIVERE config che cambia il comportamento studente. Propone `focusMisconceptions: [slug]` come secondo campo write — non derivabile dal livello, cambia il comportamento studente al reload (i primi item sono quelli targettizzati). Se al 2:25 l'engine non legge `focusMisconceptions`, degrada a `?level=` param (2 audience oneste). Alternativa: il PM ha dimostrato che pdpLevel L1 vs L2 cambia il set di esercizi, i distractor disponibili, e la policy di scaffold-fading — quindi il single-writer su pdpLevel è già architetturalmente significativo.

**c) Cross-tab sync:** Tagliare il live cross-tab sync è doppiamente corretto — sia per il quirk `storage` event, sia perché il tutor dice esplicitamente che gli errori non devono essere visibili al docente in tempo reale (privacy). Decisione: role round-trip single-tab via URL param reload. Zero listener `storage`. Costo: 0 min.

**d) Scalabilità:** Gate meccanico al sync 1:20 e checkpoint 2:25 — `grep -nE 'misconcepto|frazione|denominatore' *.js`. Match ≠ 0 → il contenuto è inlined, la scalabilità è finta → si sposta in JSON PRIMA di dichiararla in demo.

**e) Scaffold-fading:** Non buffer material — è il deliverable 03. Costo P-A 15 min + P-B 20 min = 35 min totali. Finanziato tagliando F5 genitore dal piano base + step 3 diventa item transfer (2 step training + 1 fade). Se scaffold-fading non gira al 2:25, si rivendica "task completion" non "Learning Outcome".

**f) Number line:** SVG custom è per componente generico/interattivo. CSS+HTML con posizioni precalcolate è sufficiente per scope di questo PoC (25 min P-B). L'assenza di standard WCAG per cognizione numerica si gestisce spostando il claim: non si rivendica "ridotto il carico cognitivo per un discalculico" ma "targettizzato IL misconcepto denominator-magnitude di Luca con la remediation corretta" — questo secondo claim è falsificabile dalla giuria in 10 secondi.

### tutor — confronto pedagogico

**Scaffold-fading:** conferma "non negoziabile" per il transfer item. Evidence-based: CRA-sequence (Maccini e Gagnon 2000) per math learning disabilities ha rating "strong" nel What Works Clearinghouse. Il transfer item presenta la stessa domanda-struttura senza la linea dei numeri (non `visibility: hidden` ma fisicamente assente nel componente). Lo studente deve rispondere basandosi sullo schema procedurale acquisito. Se la linea è visibile ma non usata, la giuria non può distinguere autonomia da dipendenza. Il feedback sul transfer: mostrare risposta corretta CON la number line solo dopo che lo studente ha risposto — non durante.

**Profilo Luca frazioni vs aritmetica base:** Luca/frazioni è pedagogicamente superiore. Il denominator magnitude error (Ni e Zhou 2005; Vamvakoussi e Vosniadou 2010) ha nome, causa, letteratura — un giudice non specialista capisce immediatamente perché quell'errore è logico per il bambino. Con aritmetica base la spiegazione richiede mediazione.

**Sessioni brevi vs demo 3 min:** la tensione è reale e va dichiarata esplicitamente. La soluzione è narrativa: "una sessione reale dura 5-8 minuti — vi mostriamo la struttura." La demo mostra 1 loop completo (errore → targeting → risoluzione → transfer), non tutti e 3 gli step.

**Report genitore:** taglio confermato come prima azione. Se GO a 2:30h: 1 slide, 20 secondi di demo. La perdita pedagogica esiste (il genitore DSA ha un ruolo nel PDP) ma è accettabile in demo.

### product-manager — confronto product

**Risposta al Critico su 3 audience:** la selezione docente L1 vs L2 cambia CONCRETAMENTE: (a) set esercizi caricato (denominatori ≤4 vs ≤10), (b) distractor disponibili e relativi misconcepto_id, (c) chiave fixtures generata, (d) policy scaffold-fading (L2 mostra number line solo dopo due tentativi falliti; L1 la mostra subito). Il sistema si rifiuta di operare senza pdpLevel — non esiste default. Questo soddisfa la condizione del Critico ("mostrami UNA cosa che la view docente SCRIVE che cambia il comportamento studente").

**Scaffold-fading adottato come requisito di prodotto.** Presentazione allo studente: "Prova questa!" senza annunci ("ora togliamo gli aiuti") — la linea semplicemente non appare. Se lo studente chiede "e la linea?", è già un risultato pedagogico. Report docente: "Transfer task completato autonomamente. Supporto visivo non richiesto."

**Demo narrative aggiornata (con scaffold-fading):** 0:00-0:25 docente configura L1. 0:25-1:30 Luca percorso guidato: step 1 corretto → step 2 sbaglia → headline misconcepto → number line + analogia pizza → riprova → avanza. 1:30-2:00 transfer task "Prova questa!": 1/5 vs 1/6, senza linea, corretto al primo tentativo → "Marco ha risolto un esercizio nuovo da solo". 2:00-2:30 report docente (+ scheda genitore se in piano). 2:30-3:00 live probe: distractor non-fixture → LLM live → output diverso. "Il motore non ha letto da un file."

### tpm — confronto pianificativo

**Scaffold-fading nel piano:** 35 min (P-A 15 + P-B 20), slot 2:30-3:30. Budget aggiornato: 275 min vs 240 → deficit 35 min. Soluzione concreta: (a) 1 item transfer (no mock-form-2 separata) → risparmio 15 min; (b) fixtures 9 chiavi invece di 12 (elimina step3×L2×distractor_B) → risparmio 13 min di API call; (c) plain language review 15 min invece di 20 → risparmio 5 min. Totale recupero: 33 min. Buffer residuo: ~13 min. Piano in equilibrio.

**Cross-tab:** opzione (a) single-tab URL param, costo 0 min. Regola operativa: commento nel codice "NO cross-tab sync by design".

**Number line:** HTML+CSS con posizioni precalcolate nel content JSON (position_pct per ogni frazione). 25 min P-B. I valori `position_pct` vanno precalcolati e inseriti nel JSON durante la scrittura del content (non derivati a runtime in JS).

**D2 schema procedure:** file-first concreta → P-A scrive `fixtures.json` con UNA chiave reale a 0:05 → P-B legge e scrive `mario-content.json` allineato a 0:08 → integration test `resolveRemediation("step1","L1","denominator_magnitude")` a 0:12 → schema locked a 0:15. Formato chiave: `{step_id}-{level}-{misconcepto_slug}` (non `distractor_id`).

**Luca/frazioni vs aritmetica:** +15 min content JSON per frazioni vs interi, accettabile per la maggiore evidenza visiva in demo.

**Genitore P2:** fuori piano base; bonus esplicito nel buffer 3:30-4:00 SE buffer non consumato. Se attivato: funzione `toParentLanguage(report)` lookup table che mappa `denominator_magnitude` → "Marco sta imparando a confrontare le frazioni" (non CSS filter). 15 min.

---

## Punti Aperti Round 2

*[Vuoto — tutti i PA Round 2 risolti in Fase 3 Round 1. Condizione di stop: consenso. Motivo: consenso.]*

## Accordi Round 2 (congelati)

- [Round 2 F3] **PA-R2-1 RISOLTO — focusMisconceptions**: pdpLevel single-writer è la condizione sufficiente per una view docente architetturalmente non-teatro. L1 vs L2 cambia set esercizi, distractor disponibili, policy scaffold-fading (L1 mostra number line da subito; L2 solo dopo 2 tentativi) — divergenza dimostrabile in demo. `focusMisconceptions` documentato come EP post-hackathon, zero implementazione nel PoC.

- [Round 2 F3] **PA-R2-2 RISOLTO — Budget equilibrio 240 min**: soluzione TPM accettata unanimemente. (a) 1 item transfer MCQ single-column (no mock-form-2 separata) → risparmio 15 min P-B; (b) 9 fixtures invece di 12 → risparmio 13 min P-A; (c) plain language review 15 min invece di 20 → risparmio 5 min P-B. Buffer residuo: ~13 min. Il transfer item DEVE avere denominatori non visti in training (1/5 vs 1/6 dopo training su 1/3 e 1/4). Ordine di taglio in caso di overrun: prima cade l'item transfer, MAI la denylist clinica o i must-have a11y.

- [Round 2 F3] **PA-R2-3 RISOLTO — Lista a11y must-have discalculia**: tabular-nums (5 min), stacked fraction ≥28px + aria-label parlato ("un terzo") (20-30 min), number line CSS statica con ancoraggi 0/1 e posizioni proporzionali (25 min), no animation su numeri + prefers-reduced-motion (5 min), single-column MCQ + gap 1.5rem (0 min extra), visibility:hidden per scaffold nel transfer task (5 min), feedback con number line DOPO risposta + focus spostato sulla regione feedback con aria-live="polite" (5-10 min), no punteggio numerico prominente in sessione, feedback correct/incorrect non solo con colore. Nice-to-have (se buffer): domanda sticky-top. Totale must-have: ~60-70 min P-B (redistributi nel slot 1:20-2:25; stacked fraction è candidato al taglio in caso di sforamento, degrada a slash inline con gap aumentato).

---

## Registro Decisioni — Round 2 Re-scoping DSA — 2026-09-14T16:00:00Z

**Terminazione**: consenso raggiunto in Fase 3 Round 1. Motivo: tutti i Punti Aperti risolti (PA vuoto). Partecipanti: product-manager, tutor, a11y-specialist, lead-architect (Critico), tpm.

---

### 1. Scelta Dislessia vs Discalculia

**DISCALCULIA. Confermata con accordo unanime (5/5).**

L'a11y-specialist ha aggiornato la propria posizione da dislessia a discalculia in Fase 2, portando la convergenza a unanimità.

**Rationale della scelta:**

Il vincolo congelato dal Round 1 — MCQ-only, zero input testuale libero — è ortogonale alla dislessia ma coerente con la discalculia. Per la dislessia, il mapping distractor→misconcepto in un MCQ è multi-causale e diffuso: uno studente può scegliere l'opzione errata per decodifica fonologica fallita, working memory o inferenza sbagliata — i tre casi sono indistinguibili senza audio. La tripletta (step_id, level, distractor_id) perde valore diagnostico e la capability collassa nella "riscrittura generica" esattamente come il fallimento critico identificato dal Critico nel Round 1.

Per la discalculia, l'errore è discreto e nominato: "23+9=212" → misconcepto *concatenazione*; "1/3 > 1/2" → misconcepto *denominator magnitude error*. Ogni distractor È un misconcepto — mappabile, nominabile, verificabile. La tripletta è diagnostica. La giuria può chiedere "cambia errore" e l'output LLM cambia qualitativamente in modo falsificabile in 10 secondi.

In più, la compensazione primaria per dislessia è il TTS — che crea una dipendenza da Web Speech API con fragilità demo ambiente-dipendente (voce italiana non garantita su hardware sconosciuto, race conditions, qualità non controllabile). La compensazione per discalculia è visiva (number line CSS, stacked fraction) — puro HTML/CSS, deterministico, zero API browser rischiose.

**Motivo esplicito dello scarto della dislessia:**
- MCQ-only rende la dislessia una trappola metodologica: il sistema non può osservare la decodifica fonologica e la chiave composta misura risposta, non difficoltà DSA specifica.
- TTS = dipendenza esterna fragile in demo. Senza TTS il prodotto non compensa effettivamente la dislessia (è il suo strumento primario), non si degrada gracefully.
- Gli strumenti di supporto per dislessia (TTS, font, spaziatura) esistono già nei browser e sistemi operativi — una demo hackathon rischia di reinventare l'accessibilità di base.

**Sottotipo specifico scelto:** difficoltà nel confronto di frazioni con denominatori diversi — misconcepto *denominator magnitude error* (Ni e Zhou, 2005; Vamvakoussi e Vosniadou, 2010). Il bambino applica correttamente la regola "numero più grande = quantità maggiore" in un dominio dove non funziona. Questo misconcepto è documentato, ha una causa identificabile, e la spiegazione correttiva è verificabile dalla giuria.

---

### 2. Il Prodotto

**Nome operativo: "NumeriMiei"**

**One-liner (13 parole):** Coach di calcolo che spiega l'errore giusto allo studente con discalculia.

#### Learner Profile Statement (Deliverable 01)

Luca, 11 anni, classe 1a media. Diagnosi: discalculia certificata (certificazione ASL, PDP redatto con la scuola, ottobre 2025). Sottotipo: difficoltà nel number sense — specificamente nel confronto di frazioni con denominatori diversi (compromissione del sistema approssimativo di grandezza, non difficoltà procedurale pura). Il misconcepto attivo è *denominator magnitude error*: Luca risponde sistematicamente "1/4 è maggiore di 1/3 perché 4 > 3", applicando la regola corretta per numeri interi a un dominio dove è sbagliata.

Scenario concreto: la docente di matematica ha introdotto le frazioni. Il PDP prevede uso di linea dei numeri stampata come misura compensativa, ma Luca non sa usarla in modo autonomo — la guarda e non sa dove posizionare 1/3. Si blocca davanti ai problemi di confronto tra frazioni e copia dal vicino per non mostrare di non capire.

#### Le tre audience

**STUDENTE — audience primaria e non riducibile.** Vede una sequenza di esercizi MCQ su confronto di frazioni, uno per schermata. Se sbaglia: il sistema mostra un'headline che nomina il misconcepto ("Sembra che tu stia guardando solo il numero sotto della frazione"), seguita da una spiegazione in 40-50 parole che usa un'analogia concreta (pizza divisa in pezzi) con la number line visiva. Pulsante "Riprova". L'ultimo step del percorso è il transfer task: stessa struttura, denominatori nuovi (non visti in training), senza number line. "Prova questa!" senza annunci.

**DOCENTE — audience di configurazione e gate clinico.** Seleziona il livello PDP di Luca (L1/L2/L3 — già certificato dall'ASL, non assegnato dal sistema). Il sistema si rifiuta di avviare il percorso senza questa configurazione (nessun default). La selezione L1 vs L2 cambia concretamente: (a) set di esercizi caricato (L1: denominatori ≤4; L2: denominatori ≤10), (b) distractor disponibili e relativi misconcepto_id, (c) policy scaffold-fading (L1: number line visibile da subito; L2: appare solo dopo 2 tentativi falliti). Report post-sessione: lista misconcepit rilevati con frequenza + esito del transfer task ("Transfer completato autonomamente / con supporto"). Questa divergenza L1 vs L2 è dimostrabile in demo.

**GENITORE — audience informativa, P2 condizionale al checkpoint.** Schermata read-only con funzione `toParentLanguage()` che mappa i termini clinici dei misconcepit in frasi in linguaggio comune: `denominator_magnitude` → "Luca sta imparando a confrontare le frazioni guardando le dimensioni, non i numeri". Zero terminologia clinica, zero diagnosi implicita, zero raccomandazioni riabilitative. Implementata solo se al checkpoint 2:30h il team è in GO con buffer intatto. Se assente: roadmap dichiarata.

---

### 3. Le 4-5 Feature

| # | Nome feature | Cosa fa | Audience | Stima (min) | Priorità |
|---|---|---|---|---|---|
| F1 | Configurazione PDP docente | Il docente seleziona livello L1/L2/L3 dal PDP certificato. Il sistema carica il curriculum calibrato. Gate clinico: nessun default, nessun path che assegna autonomamente il livello. Copy: "Seleziona il livello indicato nel PDP del tuo studente." | Docente | P-A 10, P-B 15 | P0 |
| F2 | Adaptive MCQ Engine con misconcepto targeting (CORE — capability irriducibile) | Presenta esercizi MCQ su confronto frazioni. Ogni opzione errata corrisponde a un misconcepto categorizzato. La tripletta (step_id, level, misconcepto_slug) identifica il misconcepto rivelato dall'errore. State machine: STEP → CHECKPOINT → REMEDIATION → NEXT → COMPLETION. | Studente | P-A 60, P-B 25 | P0 |
| F3 | Spiegazione adattiva LLM-driven | Dalla chiave composta recupera fixtures.json. Headline descrive il misconcepto. Spiegazione 40-50 parole con analogia e number line. Live slot: 1 distractor non in fixtures → LLM live → filtro denylist clinico → rendering. DEMO_MODE default ON. | Studente | P-A 45 | P0 |
| F4 | Report post-sessione docente + Transfer Task | Report: lista misconcepit, frequenza per step, esito transfer ("completato autonomamente / con supporto"). Il transfer task è un MCQ con denominatori non visti (1/5 vs 1/6 dopo training su 1/3 e 1/4) senza number line visibile (visibility:hidden). Scaffold-fading: OutcomeTracker registra se risolto senza scaffolding. | Docente + Studente | P-A 15 (scaffold flag) + P-B 20 (transfer item + report HTML) | P0 — questo è il Deliverable 03 |
| F5 | Scheda genitore plain-language | Funzione toParentLanguage() (lookup table JSON: misconcepto_slug → frase incoraggiante). Schermata read-only ?role=parent. | Genitore | P-B 15 | P2 — bonus al checkpoint 2:30h |

**Nota sulla feature irriducibile:** la capability agentica non è "la spiegazione" in sé — è la tripletta. La giuria può chiedere "cambia errore" (seleziona un distractor diverso dallo stesso step) e ottenere una spiegazione qualitativamente diversa in 10 secondi perché targeting misconceiti diversi. Questo non è hardcodabile con la stessa risposta per tutti gli errori.

---

### 4. I 3 Deliverable del Tema 03

**Deliverable 01 — Learner Profile Statement:**
Luca, 11 anni, 1a media, discalculia certificata (ASL, PDP 2025). Difficoltà specifica: confronto di frazioni con denominatori diversi. Misconcepto attivo: *denominator magnitude error* — risponde sistematicamente "1/4 > 1/3 perché 4 > 3". Scenario: docente ha introdotto le frazioni; PDP prevede linea dei numeri come compensativo ma Luca non sa usarla autonomamente.

**Deliverable 02 — Adaptive Evidence:**
Il sistema cambia in base al tipo di errore, non solo al livello. Errore tipo A (distractor "1/4 perché 4 > 3") → misconcepto *denominator_magnitude* → headline "Sembra che tu stia guardando solo il numero sotto" → show number line + analogia pizza (L1) o metro lineare (L2). Errore tipo B (distractor "1/2" su un confronto diverso) → misconcepto diverso → spiegazione diversa. Stessa domanda, distractor diverso, spiegazione qualitativamente diversa. Il live probe dimostra lo stesso con un distractor non in fixtures: LLM genera la spiegazione corretta in tempo reale.

**Deliverable 03 — Learning Outcome Note:**
Prima: Luca risponde basandosi sul valore del denominatore (risposta sbagliata sistematica). Dopo: usa la strategia procedurale della linea delle frazioni autonomamente su item transfer non visto (1/5 vs 1/6, denominatori mai incontrati nel percorso). Il transfer task viene presentato senza la linea dei numeri. Se Luca risponde correttamente → il metodo è acquisito, non memorizzato. Metrica osservabile in 30 secondi. Caveats espliciti: il LO è la capacità di usare lo strumento compensativo previsto dal PDP in modo autonomo — non riabilitazione, non aumento dell'intuizione numerica innata. Questo è pedagogicamente onesto e clinicamente sicuro (CRA-sequence, What Works Clearinghouse rating "strong").

---

### 5. Scalabilità — Extension Points Reali

Regola invariante: tutto il contenuto via `data/*.json` fetchato a runtime. Con zero build (python3 -m http.server), `fetch('data/x.json')` è live — edit + reload = cambiamento visibile senza rebuild. Nessun contenuto inline nei .js. Gate al checkpoint 2:25: `grep -nE 'misconcepto|frazione|denominatore' *.js` deve restituire 0.

**EP-1 — Nuovo modulo di esercizi:** oggetto JSON in `data/curriculum-discalculia.json`. Demo 30s: incollo modulo "sottrazione con prestito" → reload → appare nel selettore docente e funziona.

**EP-2 — Nuovo misconcepto + fixtures:** aggiunto un distractor con `misconcepto_slug` + una chiave in `data/fixtures.json`. Zero modifica al codice JS. Demo 30s: aggiungo distractor "212" per 23+9 → reload → appare la spiegazione targettizzata.

**EP-3 — Nuovo livello PDP:** oggetto JSON in `data/pdp-levels.json` (scaffold_policy, max_denominator, show_number_line_immediately). Zero modifica al codice. Demo 30s: il docente seleziona "L3" → lo stesso esercizio si renderizza con parametri diversi.

**EP-4 — Swap dominio del disturbo:** l'engine è disorder-agnostic (schema-driven). Fornendo `data/curriculum-dislessia.json` con lo stesso schema, la stessa shell gira esercizi di lettura. La discalculia è la prima istanza; l'architettura generalizza. Dimostrazione in 30s: "ecco il file curriculum-dislessia.json che usereste per espandere a dislessia — stessa struttura, contenuto diverso."

**`focusMisconceptions` come EP documentato (post-hackathon):** il docente potrà indicare quali misconcezioni prioritizzare in base alle osservazioni in classe. Non implementato nel PoC; l'architettura è predisposta (`focusMisconceptions: [slug]` nel curriculum JSON come campo opzionale).

---

### 6. Stack + Piano B LLM + A11y aggiornati

**Stack:** HTML + Tailwind CDN + JavaScript vanilla. Zero npm, zero build. `python3 -m http.server 8080`. Role routing: URL param `?role=student|teacher|parent` — selettore di funzione di render su AppState condiviso in localStorage. Single-tab, reload-based. Zero listener `storage` by design (commento obbligatorio nel codice).

**Struttura file:**
```
index.html, app.js, engine.js, explainer.js
data/
  curriculum-discalculia.json   (step → items → distractors → misconcepto_slug)
  misconceptions.json           (slug → nome, categoria, manipolativo)
  fixtures.json                 (chiave {step_id}-{level}-{misconcepto_slug} → testo)
  pdp-levels.json               (level_id → parametri adattamento)
  clinical-denylist.json        (~25 termini clinici vietati nell'output LLM)
```

**Provider LLM:** Anthropic Haiku (latenza ~1s, costo basso) o qualsiasi provider con key funzionante al minuto 0. Key NON nel browser: mini-proxy Python locale (30 righe, 10 min setup).

**Piano B LLM (DEMO_MODE default ON):**
- Tier 1: fixtures.json con chiave composta — 9 chiavi pre-generate durante lo sviluppo (6 canoniche + 3 ad alta frequenza). Zero rete richiesta.
- Tier 2: live slot — 1 distractor non in fixtures. DEMO_MODE=false SOLO per questa chiamata. Output passa per `renderRemediation()` con filtro denylist prima del rendering.
- Tier 3: fallback testuale pre-scritto — se il live slot fallisce, appare il fallback senza crash, senza spinner infinito. Il presentatore dice: "Vi mostro il prompt che questa chiamata avrebbe eseguito."
- Regola operativa: a 3:45h il team stacca il cavo di rete e ri-esegue il flusso completo. Se crasha, il problema si risolve qui.

**Requisiti a11y MUST-HAVE per discalculia/Luca (lista definitiva):**

| Requisito | Dettaglio | Stima P-B | Categoria |
|---|---|---|---|
| font-variant-numeric: tabular-nums | Su tutti gli elementi con digit | 5 min | MUST |
| Stacked fraction ≥28px + aria-label parlato | "un terzo" — non slash inline | 20-30 min | MUST (candidato taglio → slash con gap) |
| Number line CSS statica + ancoraggi 0/1 | position_pct precalcolate JSON | 25 min | MUST |
| No animation su numeri + prefers-reduced-motion | No transizioni su elementi numerici by default | 5 min | MUST |
| Single-column MCQ + gap 1.5rem | Linear layout, no 2-column grid | 0 min extra | MUST |
| visibility:hidden per scaffold in transfer task | No layout shift, zero display:none | 5 min | MUST |
| Focus post-submit su regione feedback | element.focus() + aria-live="polite" | 5-10 min | MUST |
| No punteggio numerico prominente in sessione | Il contatore errori non appare in real-time | 5 min | MUST |
| Feedback correct/incorrect non solo colore | Shape o icona aggiuntiva, WCAG 1.4.1 | 5 min | MUST |
| Contrasto AA 4.5:1 (baseline WCAG) | #1a1a1a su #ffffff | 10 min verifica | MUST |
| HTML semantico + focus visible 3px | Heading, landmark, outline | 10 min | MUST |
| Domanda sticky-top | position:sticky con overflow check | 15 min | NICE (se buffer) |

Totale must-have: ~60-70 min P-B. Slot 1:20-2:25.

**Confine clinico nell'interfaccia (non a parole):**
- Nessun path nel codice che calcola o assegna pdpLevel dalla performance (single-writer invariant — grep verificabile).
- `clinical-denylist.json` (~25 termini) + unico entry point `renderRemediation()` che filtra output LLM PRIMA del rendering. Questo copre SIA le fixtures SIA il live slot.
- Copy dell'interfaccia: "Seleziona il livello indicato nel PDP del tuo studente" (non "valuta il livello"). "NumeriMiei è pensato per studenti con diagnosi certificata di discalculia" (non "rileva difficoltà").
- Il sistema mostra la schermata docente e non avanza senza pdpLevel configurato — fail-loud.
- Dopo 3 tentativi consecutivi falliti sullo stesso step: "Questo esercizio è meglio affrontarlo con il tuo insegnante o il tuo tutor di riferimento." Stop, nessun'altra remediation.
- Footer permanente su tutte le schermate: "NumeriMiei è uno strumento didattico compensativo per studenti con diagnosi certificata di discalculia ai sensi della Legge 170/2010. Non sostituisce la valutazione clinica o il percorso previsto dal PDP."

---

### 7. Piano Operativo — 4h Sviluppo Puro + 45 min Demo Prep Separati

Budget: 240 minuti di dev puro (4h). I 45 min di demo prep sono un blocco SEPARATO, dopo le 4h.

| Slot | P-A (logica / engine / LLM) | P-B (UI / contenuto / a11y) | Dipendenze |
|---|---|---|---|
| **0:00–0:15** Setup | API key test (1 call di prova parsabile), proxy CORS Python 30 righe, schema fixtures.json scritto come FILE REALE con 1 chiave e integration test `resolveRemediation("step1","L1","denominator_magnitude")` a 0:12 → schema locked a 0:15 | index.html + Tailwind CDN, font 18px sans-serif, palette #1a1a1a/#ffffff, struttura HTML semantica (main, sections, headings, landmark) | **D1**: API key entro 0:10. **D2**: schema fixtures.json scritto e testato entro 0:15 (risk più sottovalutato) |
| **0:15–1:25** Core engine + content | quiz-engine.js: state machine (PROFILING→STEP→CHECKPOINT→REMEDIATION→NEXT→COMPLETION). explainer.js: `resolveRemediation(step, level, slug)` → chiave composta → fixtures.json → fallback API → fallback testuale → filtro denylist. Genera 9 fixtures (6 canoniche + 3 ad alta frequenza denominator_magnitude) tramite API. | mario-content.json: 2 step training (frazioni con denominatori L1: {1/2,1/3,1/4}; L2: {1/3,1/5,1/7}) + 1 step transfer (1/5 vs 1/6, `scaffold:false`). Per ogni distractor: campo `misconcepto_slug`. Frasi max 15 parole. Number line posizioni precalcolate (position_pct). | **D3**: fixtures.json ≥6 chiavi entro 1:25. **D6**: contenuto discalculia validato (plain language, nessun termine clinico) entro 1:25 |
| **1:25–2:25** A11y + audience views | Verifica logica: single-writer pdpLevel, no code path che lo deriva dalla performance. Docente view (?role=teacher): form pdpLevel (3 opzioni), report read-only. Commento nel codice "NO cross-tab sync by design". | A11y must-have (70 min): tabular-nums 5, stacked fraction 20, number line CSS 25, no-animation 5, visibility:hidden scaffold 5, focus post-submit aria-live 10. Se buffer: sticky-top 15. | **D5**: a11y pass completato entro 2:25 |
| **2:25–2:30** | **CHECKPOINT GO/NO-GO** | GO: flusso L1 sbaglia → remediation da fixtures → riprova → avanza → transfer senza number line. Offline test (rete staccata). Docente view visibile. → Procedi. PARZIALE-A: engine OK, genitore assente → elimina P2, consolida. PARZIALE-B: solo core, zero audience views → demo "prodotto studente", audience come roadmap. NO-GO: <2 step funzionanti → mostra quello che c'è. | **D4**: flusso E2E entro 2:25 |
| **2:30–3:30** Integration + E2E + scaffold-fading | Wiring engine + content + fixtures + scaffold flag. Test flusso L2 nominale (avanza senza remediation). Test L1 con errore (remediation da fixtures). Test offline. Test live slot. Test transfer MCQ senza number line → OutcomeTracker.solvedWithoutScaffold. Fix bug critici. | Fix bug visivi/a11y. Screenshot Adaptive Evidence (L1 vs L2 affiancati stessa domanda). |  |
| **3:30–4:00** Buffer | Buffer per ≤1 bug critico. Se buffer non consumato: view genitore (F5, 15 min — lookup table toParentLanguage + schermata ?role=parent). A 4:00 stop netto. Nessuna feature aggiuntiva. | |

**Checkpoint GO/NO-GO a 2:30h:**
- **GO**: 3 flussi E2E passati (L2 nominale, L1 con remediation, offline). Scaffold-fading: transfer item senza number line. → Polish.
- **PARZIALE-A**: engine OK, live slot instabile → DEMO_MODE puro, "output Claude pre-validati" + mostra il codice del prompt.
- **PARZIALE-B**: transfer task non pronto → LO dichiarato come "task completion" non "schema acquisito". Onestà esplicita.
- **NO-GO**: meno di 2 step funzionanti → si mostra quello che funziona. Dichiarazione aperta.

**Dipendenze critiche:**

| Dep | Scadenza | Rischio fallimento |
|---|---|---|
| D1 — API key funzionante + 1 call parsabile | 0:10 | → Plan B: 5-6 fixtures scritte a mano, stop tentativi dopo 15 min |
| D2 — schema fixtures.json scritto + integration test | 0:15 | → Rischio silenzioso: disallineamento P-A/P-B emerge a 2:00h. Risolto in 5 min o NON si procede |
| D3 — fixtures.json ≥6 chiavi | 1:25 | → fallback: fixtures hardcoded nel codice (scalabilità ridotta ma demo funzionante) |
| D4 — flusso E2E completo (transfer incluso) | 2:25 | → qualsiasi scenario E2E rotto = PARZIALE o NO-GO |
| D5 — a11y pass completato | 2:25 | → senza a11y la giuria inclusione boccia prima della capability agentica |
| D6 — contenuto discalculia validato | 1:25 | → contenuto stigmatizzante o tecnicista è trappola demo fatale |

**4:00 STOP DEV NETTO.**

**4:00–4:45 Demo Prep (blocco separato):**
- 4:00–4:15: script narrativo 3 min (docente configura → Luca sbaglia step 2 → misconcepto → number line → riprova → transfer autonomo → live probe). Accordo "chi parla / chi clicca".
- 4:15–4:30: rehearsal 2× cronometrato (target ≤4 min). A11y checklist finale.
- 4:30–4:45: dry run con cavo staccato. Se crasha → il problema si risolve qui.

---

### 8. Top 5 Rischi

**R1 — Sconfinamento clinico in demo (rischio squalifica — in cima):**
Il prodotto è per studenti con diagnosi certificata. Il punto di massima esposizione è il live slot: LLM raw output davanti alla giuria. Output come "Questo tipo di errore è tipico di bambini con difficoltà nel number sense — potrebbe valutare con il suo specialista" → squalifica.
Mitigazione: `clinical-denylist.json` (~25 termini) + unico entry point `renderRemediation()` che filtra output LLM prima del rendering. Stesso filtro su fixtures e live slot. Il prompt-constraint è il primo strato; il denylist deterministico è il presidio verificabile con `grep`. Probabilità residua senza mitigazione: alta. Con mitigazione: bassa.

**R2 — "3 audience = nessuna fatta bene" (rischio feature theater):**
La view docente è architetturalmente significativa (single-writer pdpLevel, divergenza L1 vs L2 dimostrabile). La view genitore è P2 bonus — fuori dal piano base. Se il checkpoint 2:30h è in PARZIALE, il genitore cade senza impatto sul GO/NO-GO. Il rischio "feature theater" è presidiato dal fatto che L1 vs L2 diverge concretamente in demo (scelta esplicita docente → diverso comportamento sistema).
Mitigazione: genitore fuori dal piano base; view docente con divergenza L1 vs L2 dimostrabile.

**R3 — Capability percepita come riscrittura generica (rischio squalifica parziale):**
La giuria chiede "cos'è la capability?" e la risposta non convince perché l'adattamento è cosmetico. Mitigazione: live probe — selezionare un distractor non-fixture → LLM live → output diverso dai fixtures. La risposta alla giuria è preparata: "Il prodotto rileva IL misconcepto specifico dall'errore e genera la spiegazione che corregge QUEL meccanismo — non il concetto in generale. Qui vedete due distractor diversi sullo stesso step: due spiegazioni qualitativamente diverse."

**R4 — Learning Outcome non dimostrabile (deliverable 03 vuoto):**
Se il scaffold-fading non è implementato, il deliverable 03 si riduce a "completion score" — un numero, non un LO. Mitigazione: scaffold-fading è nel piano base (35 min, slot 2:30-3:30), non nel buffer. Ordine di taglio: prima l'item transfer cade, non il flag. Se al checkpoint 2:25 scaffold-fading non gira → si rivendica "task completion" non "Learning Outcome" — dichiarazione onesta, non bluff.

**R5 — Budget a11y/scaffolding (overrun P-B):**
I must-have a11y per discalculia sono ~60-70 min P-B. Con scaffold-fading e content JSON frazioni (+15 min vs aritmetica base), P-B è il critical path. Candidato primo taglio: stacked fraction (degrada a slash con gap aumentato, risparmio 20 min). Candidato secondo taglio: item transfer ridotto a 1 (già nel piano). La sequenza di taglio è definita e non improvvisata.

---

### 9. Punti Aperti Residui

Nessun punto aperto decisionale. Tutti i PA del Round 2 risolti in Fase 3 Round 1 per consenso unanime.

**Note tecniche residue (non PA — rischi implementativi da monitorare):**
- Il disallineamento schema fixtures.json (D2) è il rischio più sottovalutato del piano — risolto alla procedura file-first a 0:15, ma richiede disciplina (P-A scrive il file, P-B lo legge e conferma con integration test).
- La number line CSS con posizioni precalcolate richiede che i valori `position_pct` siano nel content JSON sin dall'inizio. Se vengono calcolati a runtime in JS, la scalabilità (EP-2) è compromessa.
- Il live slot deve passare per `renderRemediation()` e non avere un code path diretto al DOM — verificabile con `grep -c renderRemediation *.js`.

---

### Motivazione

La sessione ha prodotto convergenza completa (5/5 partecipanti) su tutte le scelte fondamentali. La tensione principale era dislessia vs discalculia: l'a11y-specialist ha aggiornato la propria posizione da dislessia a discalculia in Fase 2, dopo l'argomento decisivo del Critico (maping distractor→misconcepto diffuso per dislessia = collasso della capability). La seconda tensione — sconfinamento clinico — ha prodotto il presidio più importante del prodotto: il denylist clinico deterministico su unico entry point `renderRemediation()`, che è la sola mitigazione verificabile in 2 secondi con un grep.

Il contributo del Critico (lead-architect) ha svolto il suo ruolo in modo determinante: ha identificato scaffold-fading come non-negoziabile per il deliverable 03 (senza scaffold-fading il LO collassa in "retry infiniti = nessun apprendimento misurabile"), ha forzato il presidio concreto del live slot, e ha sfidato la "3 audience" fino a ottenere la dimostrazione che pdpLevel L1 vs L2 produce divergenza comportamentale reale.

### Dissensi registrati

Nessun dissenso residuo. L'a11y-specialist ha cambiato posizione in Fase 2 con argomenti tecnici espliciti.

### Criteri di successo verificati

- [x] Scelta dislessia vs discalculia con rationale e scarto motivato: SODDISFATTO (discalculia unanime)
- [x] Prodotto: nome, one-liner, 3 audience con ruolo e costo: SODDISFATTO (NumeriMiei)
- [x] 4-5 feature con audience, stima, priorità: SODDISFATTO (F1-F4 P0, F5 P2)
- [x] 3 deliverable Tema 03 riformulati: SODDISFATTO (LPS Luca + AE denominator_magnitude + LO transfer)
- [x] Scalabilità: extension points reali, dimostrabili in 30s: SODDISFATTO (EP1-4 via data/*.json)
- [x] Stack + Piano B LLM aggiornati: SODDISFATTO (denylist clinico + unico entry point)
- [x] A11y specifici DSA discalculia (must-have con stime): SODDISFATTO (lista 12 requisiti)
- [x] Piano operativo 4h dev puro + 45 min demo separati: SODDISFATTO (tabella slot + checkpoint)
- [x] Top 5 rischi con rischio clinico in cima: SODDISFATTO
- [x] Punti Aperti residui: SODDISFATTO (nessun PA aperto)

## Storie collegate

- [EP-001](management/kanban/EP-001-core-adattivo-mcq-engine-llm/EP-001.md) — Core Adattivo — MCQ Engine e Spiegazione LLM-driven
- [EP-002](management/kanban/EP-002-viste-per-ruolo/EP-002.md) — Viste per Ruolo — Docente, Transfer Task, Genitore
- [EP-003](management/kanban/EP-003-accessibilita-confine-clinico/EP-003.md) — Accessibilità e Confine Clinico
- [EP-004](management/kanban/EP-004-demo-e-deliverable/EP-004.md) — Demo e Deliverable — Script, Rehearsal, PPT
