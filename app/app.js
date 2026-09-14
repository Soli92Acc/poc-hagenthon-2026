import {
  MOCK,
  mockEngine,
  mockRemediationFn,
  mockGetSessionReportFn,
  mockInitRouter,
  mockGetRole,
  mockGetPdpLevel,
  mockSetPdpLevel
} from './mock-data.js';

// ── Module-level singletons (populated by init) ──────────────────────────────
let engine, getSafeRemediation, initRouter, getRole, getPdpLevel, setPdpLevel, getSessionReport;
let hasSessionData, clearSessionData;

// ── Local state ───────────────────────────────────────────────────────────────
let selectedDistractorId = null;

// ── Module loading ────────────────────────────────────────────────────────────
async function loadModules() {
  if (MOCK) {
    return {
      engine: mockEngine,
      getSafeRemediation: mockRemediationFn,
      initRouter: mockInitRouter,
      getRole: mockGetRole,
      getPdpLevel: mockGetPdpLevel,
      setPdpLevel: mockSetPdpLevel,
      getSessionReport: mockGetSessionReportFn,
      hasSessionData: () => true,
      clearSessionData: () => {}
    };
  }
  const [
    { QuizEngine },
    { getSafeRemediation: _gsr },
    { initRouter: _ir, getRole: _gr, getPdpLevel: _gpl, setPdpLevel: _spl },
    { getSessionReport: _gsr2, hasSessionData: _hsd, clearSessionData: _csd }
  ] = await Promise.all([
    import('./engine.js'),
    import('./explainer.js'),
    import('./router.js'),
    import('./session-report.js')
  ]);
  return {
    engine: QuizEngine,
    getSafeRemediation: _gsr,
    initRouter: _ir,
    getRole: _gr,
    getPdpLevel: _gpl,
    setPdpLevel: _spl,
    getSessionReport: _gsr2,
    hasSessionData: _hsd,
    clearSessionData: _csd
  };
}

// ── View switching ────────────────────────────────────────────────────────────
// Ogni view porta con se' la propria intestazione e il proprio ruolo sul body:
// il fondo, la scala tipografica e la shell cambiano insieme alla schermata,
// senza che nessun render debba ricordarsene.
const SHELL = {
  'view-home':    { header: 'header-home',    role: 'home' },
  'view-student': { header: 'header-student', role: 'student' },
  'view-teacher': { header: 'header-teacher', role: 'teacher' },
  // La vista famiglie riusa la shell studente: stesso fondo caldo, stessa misura.
  'view-parent':  { header: 'header-student', role: 'parent' }
};

function showView(viewId) {
  document.getElementById('loading-message').hidden = true;
  Object.keys(SHELL).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = id !== viewId;
  });

  const shell = SHELL[viewId] ?? SHELL['view-home'];
  ['header-home', 'header-student', 'header-teacher'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = id !== shell.header;
  });
  // data-role sul body e' cio' che accende i due layout: fondo e scala
  // tipografica dello studente, densita' da cruscotto del docente.
  document.body.dataset.role = shell.role;
}

// ── Number line builder ───────────────────────────────────────────────────────
function buildNumberLine(markers) {
  const wrapper = document.createElement('div');
  wrapper.className = 'number-line-wrapper';
  wrapper.setAttribute('aria-hidden', 'true'); // decorative; fractions spoken via button labels

  const label0 = document.createElement('span');
  label0.className = 'nl-label';
  label0.textContent = '0';
  wrapper.appendChild(label0);

  const track = document.createElement('div');
  track.className = 'number-line';

  markers.forEach(({ label, position_pct, highlighted }) => {
    const marker = document.createElement('div');
    marker.className = 'fraction-marker' + (highlighted ? ' highlighted' : '');
    marker.style.left = `${position_pct * 100}%`;
    marker.setAttribute('aria-label', fractionAriaLabel(label));
    marker.textContent = label;
    track.appendChild(marker);
  });

  wrapper.appendChild(track);

  const label1 = document.createElement('span');
  label1.className = 'nl-label';
  label1.textContent = '1';
  wrapper.appendChild(label1);

  return wrapper;
}

// ── Modello di quantita' ──────────────────────────────────────────────────────
// Un numero e una linea sono due rappresentazioni simboliche. Il salto costoso e'
// simbolo -> quantita', ed e' esattamente quello che qui va mostrato. Il modello
// segue il livello (dato `quantity_model` in pdp-levels.json) e coincide con
// l'immagine usata dai testi di aiuto: fette a L1, striscia a L2/L3.
function buildQuantityModel(fractions, model) {
  const wrap = document.createElement('div');
  wrap.className = 'qty';
  wrap.setAttribute('aria-hidden', 'true'); // decorativo: la quantita' e' gia' detta a parole
  fractions.forEach(f => {
    const parti = Number(String(f).split('/')[1]) || 1;
    const item = document.createElement('div');
    item.className = 'qty__item';

    if (model === 'slices') {
      const pie = document.createElement('div');
      pie.className = 'qty-pie';
      pie.style.setProperty('--parts', String(parti));
      item.appendChild(pie);
    } else {
      const strip = document.createElement('div');
      strip.className = 'qty-strip';
      for (let i = 0; i < parti; i += 1) {
        const seg = document.createElement('span');
        seg.className = 'qty-strip__seg' + (i === 0 ? ' qty-strip__seg--on' : '');
        strip.appendChild(seg);
      }
      item.appendChild(strip);
    }

    const nome = document.createElement('span');
    nome.className = 'qty__name';
    nome.textContent = f;
    item.appendChild(nome);
    wrap.appendChild(item);
  });
  return wrap;
}

// ── Avanzamento ───────────────────────────────────────────────────────────────
// Pallini piu' etichetta: la posizione si legge dalla forma, senza dover contare.
function renderProgress() {
  const slot = document.getElementById('progress-slot');
  if (!slot) return;
  const totale = Array.isArray(engine.steps) ? engine.steps.length : 0;
  const idx = engine.currentStepIdx ?? 0;
  slot.innerHTML = '';
  if (!totale) return;

  const label = document.createElement('span');
  label.className = 'progress__label';
  label.textContent = `Esercizio ${Math.min(idx + 1, totale)} di ${totale}`;
  slot.appendChild(label);

  const dots = document.createElement('span');
  dots.className = 'progress__dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < totale; i += 1) {
    const d = document.createElement('span');
    d.className = 'progress__dot' + (i < idx ? ' progress__dot--done' : i === idx ? ' progress__dot--now' : '');
    dots.appendChild(d);
  }
  slot.appendChild(dots);
}

// ── Stacked fraction ──────────────────────────────────────────────────────────
function buildStackedFraction(fractionStr) {
  const [num, den] = fractionStr.split('/');
  const span = document.createElement('span');
  span.className = 'stacked-fraction';
  span.setAttribute('aria-label', fractionAriaLabel(fractionStr));
  span.innerHTML = `<span class="num">${num}</span><span class="den">${den}</span>`;
  return span;
}

let fractionLabels = {};
async function loadFractionLabels() {
  try {
    fractionLabels = (await (await fetch('data/fraction-labels.json')).json()).labels ?? {};
  } catch {
    fractionLabels = {}; // senza etichette si legge "1/3": degrado accettabile, non un blocco
  }
}

function fractionAriaLabel(fractionStr) {
  return fractionLabels[fractionStr] || fractionStr;
}

// ── Option selection ──────────────────────────────────────────────────────────
function selectOption(distId) {
  selectedDistractorId = distId;
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.distractorId === distId ? 'true' : 'false');
  });
  const submitBtn = document.getElementById('btn-submit');
  if (submitBtn) submitBtn.disabled = false;
}

// ── Feedback rendering ────────────────────────────────────────────────────────
// Single call site for getSafeRemediation (US-011 security boundary)

/** Il testo di aiuto arriva come stringa unica. Spezzarlo da' righe corte invece
 *  di un blocco di prosa.
 *
 *  Il titolo e' l'headline della fixture, che finisce col punto fermo e al suo
 *  interno puo' contenere un "?" ("Quarto o terzo? Dipende dai pezzi."): tagliare
 *  alla prima punteggiatura la spezzerebbe a meta'. Si taglia al primo punto
 *  fermo, con un tetto di lunghezza per il testo generato dal vivo, che potrebbe
 *  non seguire la stessa convenzione. */
function spezzaAiuto(text) {
  const t = String(text).trim();
  const p = t.indexOf('. ');
  const taglio = p > -1 && p < 90 ? p + 1 : -1;
  const titolo = taglio > -1 ? t.slice(0, taglio) : (t.split(/(?<=[.!?])\s+/)[0] ?? t);
  const resto = t.slice(titolo.length).trim();
  const righe = resto ? resto.split(/(?<=[.!?])\s+/).map(f => f.trim()).filter(Boolean) : [];
  return { titolo, righe };
}

function renderFeedback(text, isCorrect) {
  const region = document.getElementById('feedback-region');
  if (!region) return;
  region.hidden = false;
  region.className = 'feedback ' + (isCorrect ? 'feedback--ok' : 'feedback--retry');
  region.innerHTML = '';

  const head = document.createElement('p');
  head.className = 'feedback__head';

  // Indicatore non cromatico (WCAG 1.4.1). Sull'errore non usiamo una croce:
  // il segnale utile e' "riprova", non "sbagliato", e l'informazione resta
  // portata dal glifo e dalla parola, non dal colore.
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.className = 'feedback__icon';
  icon.textContent = isCorrect ? '✓' : '↻';
  head.appendChild(icon);

  const aiuto = isCorrect ? { titolo: '', righe: [] } : spezzaAiuto(text);
  const titolo = document.createElement('span');
  titolo.textContent = isCorrect ? 'Risposta corretta' : (aiuto.titolo || 'Riprova');
  head.appendChild(titolo);
  region.appendChild(head);

  for (const f of aiuto.righe) {
    const riga = document.createElement('p');
    riga.textContent = f;
    region.appendChild(riga);
  }
}

function renderStop(message) {
  const stopRegion = document.getElementById('stop-region');
  if (!stopRegion) return;
  stopRegion.removeAttribute('hidden');
  stopRegion.className = 'feedback feedback--stop';
  stopRegion.textContent = message;
  const feedbackRegion = document.getElementById('feedback-region');
  if (feedbackRegion) feedbackRegion.hidden = true;
  const submitBtn = document.getElementById('btn-submit');
  if (submitBtn) submitBtn.remove(); // removed from DOM per spec
}

/** Il supporto visivo non e' una proprieta' dello step: e' una decisione che
 *  l'engine prende combinando livello PDP ed errori consecutivi. Qui si legge,
 *  non si ricalcola. */
function aggiornaScaffold() {
  const box = document.getElementById('scaffold-container');
  if (!box) return;
  box.classList.toggle('scaffold--chiuso', !engine.getScaffoldVisible());
}

// ── Submit handler ────────────────────────────────────────────────────────────
async function handleSubmit() {
  if (!selectedDistractorId) return;
  const submitBtn = document.getElementById('btn-submit');
  if (submitBtn) submitBtn.disabled = true; // prevent double-click

  const step = engine.getCurrentStep();
  const result = engine.submit(selectedDistractorId);

  if (result.correct) {
    renderFeedback('Risposta corretta!', true);
    // Un'azione sola alla volta: il pulsante di avanzamento vive nella regione
    // di feedback, quindi "Rispondo" esce di scena invece di restare li' spento.
    if (submitBtn) submitBtn.hidden = true;

    // Transfer correct: reveal number line post-response
    if (step.transfer) {
      const item = step.items[0];
      const correctD = item.distractors.find(d => d.correct);
      const denomD = item.distractors.find(d => d.misconcepto_slug === 'denominator_magnitude');
      const nl = buildNumberLine([
        { label: item.fraction_a, position_pct: correctD.position_pct, highlighted: true },
        { label: item.fraction_b, position_pct: denomD.position_pct, highlighted: false }
      ]);
      document.getElementById('feedback-region').appendChild(nl);
    }

    // submit() restituisce NEXT, mai COMPLETION: la fine sessione la dichiara nextStep().
    const ultimo = Array.isArray(engine.steps) && engine.currentStepIdx >= engine.steps.length - 1;
    addActionButton(ultimo ? 'Fine sessione ✓' : 'Prossimo esercizio →', () => {
      if (engine.nextStep() === 'COMPLETION') showCompletion();
      else renderStep(engine.getCurrentStep());
    });
  } else {
    if (result.state === 'STOPPED') {
      renderStop(engine.getStopMessage());
    } else {
      // Single call site for getSafeRemediation — do NOT move elsewhere (US-011)
      // La chiave la costruisce l'engine: step.level vale "L1|L2" sul transfer e
      // non risolverebbe nessuna fixture, facendo cadere sempre sul fallback generico.
      const { step_id, level, slug } = engine.getRemediationKeyParts();
      const { text } = await getSafeRemediation(step_id, level, slug);
      renderFeedback(text, false);
      // Scaffold-fading: e' qui che il supporto compare, secondo la policy del
      // livello. Prima era sempre a schermo e L1/L2/L3 rendevano identico.
      aggiornaScaffold();
      // Reset selection for retry
      selectedDistractorId = null;
      document.querySelectorAll('.option-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
      if (submitBtn) {
        submitBtn.textContent = 'Riprovo';
        submitBtn.disabled = true; // re-enabled when user selects new option
      }
    }
  }

  // Move focus to feedback region (WCAG 2.4.3 focus order)
  document.getElementById('feedback-region')?.focus();
}

function addActionButton(label, handler) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--wide';
  btn.style.marginTop = '16px';
  btn.textContent = label;
  btn.addEventListener('click', handler);
  document.getElementById('feedback-region')?.appendChild(btn);
}

// ── MCQ render (TSK-005, TSK-015, TSK-020) ───────────────────────────────────
// Ordine deliberato: domanda, i due numeri in grande, il supporto (se spetta),
// le opzioni, il feedback, e SOLO ALLA FINE il pulsante. Prima il feedback
// stava sotto il pulsante: si incontrava l'azione prima della spiegazione.
function renderStep(step) {
  const item = step.items[0];
  const view = document.getElementById('view-student');
  view.innerHTML = '';
  selectedDistractorId = null;
  renderProgress();

  const card = document.createElement('div');
  card.className = 'card';
  view.appendChild(card);

  const h2 = document.createElement('h2');
  h2.id = 'question-text';
  h2.className = 'h-question';
  h2.textContent = step.transfer ? 'Prova questa!' : step.question;
  card.appendChild(h2);

  if (step.transfer) {
    const subq = document.createElement('p');
    subq.className = 'muted';
    subq.style.margin = '0 0 8px';
    subq.textContent = step.question;
    card.appendChild(subq);
  }

  // I due numeri in grande. Notazione, non quantita': non e' scaffold, ed e'
  // l'unico modo di leggere "1/5 o 1/6" senza decifrarlo dentro una frase.
  const duel = document.createElement('p');
  duel.className = 'fraction-duel';
  duel.setAttribute('aria-hidden', 'true'); // gia' detto a parole dalla domanda
  duel.appendChild(buildStackedFraction(item.fraction_a));
  const vs = document.createElement('span');
  vs.className = 'fraction-duel__vs';
  vs.textContent = 'oppure';
  duel.appendChild(vs);
  duel.appendChild(buildStackedFraction(item.fraction_b));
  card.appendChild(duel);

  // Supporto visivo:
  //   training → nel DOM, visibilita' decisa dalla policy di livello (TSK-020:
  //              visibility:hidden, non display:none, cosi' la pagina non salta
  //              sotto le dita quando compare)
  //   transfer → non entra affatto nel DOM (TSK-015)
  // A un livello che non prevede mai il supporto (soglia oltre il numero massimo
  // di tentativi) il riquadro non si costruisce affatto: prometterlo e non darlo
  // mai sarebbe peggio che non averlo.
  const policy = engine.getScaffoldPolicy?.() ?? {};
  const supportoPrevisto = (policy.show_number_line_after_errors ?? 1) < 3;

  if (!step.transfer && supportoPrevisto) {
    const correctD = item.distractors.find(d => d.correct);
    const denomD = item.distractors.find(d => d.misconcepto_slug === 'denominator_magnitude');

    const box = document.createElement('div');
    box.id = 'scaffold-container';
    box.className = 'scaffold';

    const hint = document.createElement('p');
    hint.className = 'scaffold__hint';
    hint.textContent = 'Se ti serve, qui compare un aiuto per vedere le parti.';
    box.appendChild(hint);

    const titolo = document.createElement('p');
    titolo.className = 'scaffold__title';
    titolo.textContent = 'Guarda le parti';
    box.appendChild(titolo);

    const modello = policy.quantity_model ?? 'strip';
    box.appendChild(buildQuantityModel([item.fraction_a, item.fraction_b], modello));

    box.appendChild(buildNumberLine([
      { label: item.fraction_a, position_pct: correctD.position_pct, highlighted: false },
      { label: item.fraction_b, position_pct: denomD?.position_pct ?? 0, highlighted: false }
    ]));

    card.appendChild(box);
  }

  const ol = document.createElement('ol');
  ol.setAttribute('role', 'list');
  ol.className = 'options';

  item.distractors.forEach(d => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.distractorId = d.id;
    btn.textContent = d.label;
    btn.addEventListener('click', () => selectOption(d.id));
    li.appendChild(btn);
    ol.appendChild(li);
  });
  card.appendChild(ol);

  // Feedback PRIMA dell'azione: si legge la ragione, poi si decide che fare.
  const feedbackRegion = document.createElement('div');
  feedbackRegion.id = 'feedback-region';
  feedbackRegion.setAttribute('aria-live', 'polite');
  feedbackRegion.setAttribute('aria-atomic', 'true');
  feedbackRegion.setAttribute('tabindex', '-1');
  feedbackRegion.className = 'feedback';
  feedbackRegion.hidden = true;
  card.appendChild(feedbackRegion);

  const submitBtn = document.createElement('button');
  submitBtn.id = 'btn-submit';
  submitBtn.type = 'button';
  submitBtn.className = 'btn btn--wide';
  submitBtn.textContent = 'Rispondo';
  submitBtn.disabled = true;
  submitBtn.addEventListener('click', handleSubmit);
  card.appendChild(submitBtn);

  // Messaggio di stop dopo 3 errori consecutivi, mostrato verbatim.
  const stopRegion = document.createElement('div');
  stopRegion.id = 'stop-region';
  stopRegion.setAttribute('hidden', '');
  stopRegion.className = 'feedback feedback--stop';
  card.appendChild(stopRegion);

  // Lo stato di partenza dello scaffold lo decide la policy, non lo step.
  aggiornaScaffold();
}

function showCompletion() {
  renderProgress();
  const view = document.getElementById('view-student');
  view.innerHTML = `
    <div class="card" style="text-align:center">
      <p style="font-size:44px;line-height:1" aria-hidden="true">✓</p>
      <h2 class="h-question">Sessione completata</h2>
      <p class="muted" style="margin:8px 0 0">Ottimo lavoro. Il tuo insegnante vedrà com'è andata.</p>
    </div>
  `;
}

// ── Home: chi sta entrando (selezione profilo) ───────────────────────────────
// I profili sono dati, non rami di codice: aggiungerne uno significa aggiungere
// una riga qui e una view nel router, non toccare il rendering.
const PROFILI = [
  { role: 'student', label: 'Studente', desc: 'Faccio gli esercizi e vedo subito dove ho sbagliato.' },
  { role: 'teacher', label: 'Docente',  desc: 'Imposto il livello della sessione e leggo il report finale.' },
  { role: 'parent',  label: 'Genitore', desc: 'Capisco cosa sta facendo mio figlio, in parole semplici.' }
];

function renderHomeView() {
  showView('view-home');
  const view = document.getElementById('view-home');
  const pdpLevel = getPdpLevel();
  view.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.className = 'h-question';
  h2.textContent = 'Chi sta entrando?';
  view.appendChild(h2);

  const intro = document.createElement('p');
  intro.className = 'muted';
  intro.style.margin = '4px 0 24px';
  intro.textContent = 'Scegli il profilo: NumeriMiei apre la schermata giusta.';
  view.appendChild(intro);

  // Link, non bottoni: sono navigazioni verso un URL reale (?role=...), quindi
  // restano apribili in una nuova scheda e condivisibili durante la demo.
  const ol = document.createElement('ol');
  ol.setAttribute('role', 'list');
  ol.className = 'options';

  PROFILI.forEach(p => {
    const li = document.createElement('li');
    const card = document.createElement('a');
    card.href = `?role=${p.role}`;
    card.dataset.role = p.role;
    card.className = 'profile-card card';

    const riga = document.createElement('span');
    riga.className = 'profile-card__row';
    const label = document.createElement('span');
    label.className = 'profile-card__name';
    label.textContent = p.label;
    const freccia = document.createElement('span');
    freccia.className = 'profile-card__go';
    freccia.setAttribute('aria-hidden', 'true');
    freccia.textContent = '→';
    riga.appendChild(label);
    riga.appendChild(freccia);
    card.appendChild(riga);

    const desc = document.createElement('span');
    desc.className = 'profile-card__desc muted';
    desc.textContent = p.desc;
    card.appendChild(desc);

    // Avviso, non blocco: la view studente gestisce gia' il caso senza livello,
    // ma dirlo qui evita che in demo si entri in un vicolo cieco per distrazione.
    if (p.role === 'student' && !pdpLevel) {
      const nota = document.createElement('span');
      nota.className = 'profile-card__desc small';
      nota.style.fontWeight = '700';
      nota.textContent = 'Prima il docente deve impostare il livello.';
      card.appendChild(nota);
    }

    li.appendChild(card);
    ol.appendChild(li);
  });
  view.appendChild(ol);

  const stato = document.createElement('p');
  stato.id = 'home-session-state';
  stato.className = 'callout';
  stato.style.margin = '0';
  stato.textContent = pdpLevel
    ? `Sessione pronta al livello ${pdpLevel}.`
    : 'Nessuna sessione impostata: il livello lo sceglie il docente.';
  view.appendChild(stato);
}

// ── Student view ──────────────────────────────────────────────────────────────
async function renderStudentView() {
  showView('view-student');
  const pdpLevel = getPdpLevel();
  if (!pdpLevel) {
    // Senza livello non si entra, ma si esce: prima era una schermata cieca.
    document.getElementById('view-student').innerHTML = `
      <div class="card">
        <h2 class="h-question">Sessione non ancora pronta</h2>
        <p class="muted" style="margin:8px 0 20px">
          Il tuo insegnante deve scegliere il livello prima di cominciare.
        </p>
        <a class="btn btn--ghost btn--wide" href="?role=teacher">Apri la vista docente</a>
      </div>
    `;
    return;
  }
  await engine.loadCurriculum(pdpLevel);
  renderStep(engine.getCurrentStep());
}

// ── Teacher view: PDP form (TSK-013) + report (TSK-017) ──────────────────────
async function renderTeacherView() {
  showView('view-teacher');
  const view = document.getElementById('view-teacher');
  // Discriminante: esistono step affrontati. Prima si guardava `session_errors`,
  // che l'engine scrive solo quando lo studente sbaglia: una sessione senza errori
  // non mostrava mai il report.
  if (hasSessionData()) {
    await renderTeacherReport(view);
  } else {
    await renderPdpForm(view);
  }
}

async function renderPdpForm(view) {
  // Le etichette dei livelli esistevano gia' nei dati e non arrivavano a schermo:
  // il docente sceglieva fra "L1", "L2" e "L3" nudi la variabile piu' importante
  // della sessione. Ora il significato lo dicono i dati, non una leggenda a parte.
  let livelli = {};
  let curriculum = { steps: [] };
  try {
    [livelli, curriculum] = await Promise.all([
      fetch('./data/pdp-levels.json').then(r => r.json()),
      fetch('./data/curriculum-discalculia.json').then(r => r.json())
    ]);
  } catch { /* si degrada alle sigle nude: meglio della schermata vuota */ }

  const opzioni = ['L1', 'L2', 'L3']
    .map(id => `<option value="${id}">${livelli[id]?.label ?? id}</option>`)
    .join('');

  view.innerHTML = `
    <div style="max-width:40rem;margin:0 auto">
      <div class="card stack">
        <div>
          <h2 class="h-section" style="font-size:20px">Impostazione sessione</h2>
          <p class="muted small" style="margin:4px 0 0">
            Scegli il livello indicato nel PDP del tuo studente. Cambia quanto
            supporto visivo riceve e quali esercizi incontra.
          </p>
        </div>

        <div>
          <label class="field-label" for="pdp-level-select">Livello PDP</label>
          <select id="pdp-level-select" class="select">
            <option value="" disabled selected>Scegli un livello</option>
            ${opzioni}
          </select>
        </div>

        <div id="pdp-level-detail" class="callout" hidden></div>

        <button id="btn-confirm-pdp" type="button" class="btn btn--wide" disabled>
          Conferma e passa allo studente
        </button>
      </div>
    </div>
  `;

  const select = document.getElementById('pdp-level-select');
  const btn = document.getElementById('btn-confirm-pdp');
  const detail = document.getElementById('pdp-level-detail');

  const descrivi = (id) => {
    const p = livelli[id];
    if (!p) { detail.hidden = true; return; }
    const suoi = (curriculum.steps || []).filter(st => p.includes_levels?.includes(st.level));
    const verifica = suoi.filter(st => st.scaffold === false).length;
    const training = suoi.length - verifica;
    detail.hidden = false;
    detail.innerHTML = `
      <p style="margin:0 0 6px"><strong>${p.effetto ?? ''}</strong></p>
      <p class="small" style="margin:0">
        ${training} esercizi di allenamento${verifica ? ' e una verifica finale senza supporto' : ''}.
      </p>
    `;
  };

  select.addEventListener('change', () => {
    btn.disabled = !select.value;
    descrivi(select.value);
  });

  btn.addEventListener('click', () => {
    if (!select.value) return;
    // SINGLE-WRITER: solo questa funzione scrive pdpLevel [gate clinico]
    setPdpLevel(select.value);
    window.location.href = '?role=student';
  });
}

async function renderTeacherReport(view) {
  const reportData = getSessionReport();
  const pdpLevel = getPdpLevel() || '–';

  let misconceptions = {};
  let curriculum = { steps: [] };
  let livelli = {};
  try {
    [misconceptions, curriculum, livelli] = await Promise.all([
      fetch('./data/misconceptions.json').then(r => r.json()),
      fetch('./data/curriculum-discalculia.json').then(r => r.json()),
      fetch('./data/pdp-levels.json').then(r => r.json())
    ]);
  } catch { /* si degrada agli slug grezzi */ }

  // Le voci di misconceptions.json possono essere stringa (formato vecchio) o
  // oggetto con nota per il docente: si accettano entrambe.
  const vocePer = (slug) => {
    const v = misconceptions[slug];
    if (!v) return { label: slug, nota_docente: '' };
    return typeof v === 'string' ? { label: v, nota_docente: '' } : v;
  };

  // L'etichetta dell'esercizio sta nel curriculum, non in una mappa nel codice:
  // aggiungere un esercizio non deve richiedere di toccare questo file.
  const stepDi = Object.fromEntries((curriculum.steps || []).map(st => [st.step_id, st]));
  const soglia = livelli[pdpLevel]?.show_number_line_after_errors ?? 1;

  const righe = reportData.stepsData.map(s => {
    const st = stepDi[s.step_id] ?? {};
    const errori = s.misconceptErrors.reduce((t, e) => t + e.count, 0);
    return {
      label: st.label ?? s.step_id,
      transfer: st.transfer === true,
      attempts: s.attempts,
      errori,
      primoColpo: errori === 0,
      // Non e' registrato: si deriva dalla stessa regola che lo ha mostrato.
      supporto: st.transfer !== true && errori >= soglia,
      misconcetti: s.misconceptErrors.map(e => ({ ...vocePer(e.slug), count: e.count }))
    };
  });

  const blocchi = (r) => {
    const b = [];
    for (let i = 0; i < Math.max(r.attempts, 1); i += 1) {
      b.push(`<span class="tries__b ${i < r.errori ? 'tries__b--err' : 'tries__b--ok'}"></span>`);
    }
    return `<span class="tries" aria-hidden="true">${b.join('')}</span>`;
  };

  const corpo = righe.map(r => `
    <tr>
      <th scope="row">${r.label}</th>
      <td class="num">${blocchi(r)}${r.attempts}</td>
      <td>${r.primoColpo ? '<span class="chip chip--ok">sì</span>' : '<span class="chip chip--no">no</span>'}</td>
      <td>${r.transfer ? '<span class="chip chip--off">non previsto</span>'
                       : r.supporto ? '<span class="chip chip--no">servito</span>'
                                    : '<span class="chip chip--ok">non servito</span>'}</td>
      <td>${r.misconcetti.length
              ? r.misconcetti.map(m => `${m.label} <span class="muted">(${m.count === 1 ? 'una volta' : m.count + ' volte'})</span>`).join('<br>')
              : '<span class="muted">nessun errore</span>'}</td>
    </tr>`).join('');

  // Andamento: confronto fra prima e seconda meta' della sessione. Sono tentativi
  // osservati, non un punteggio: "73% corretto" direbbe meno e inviterebbe al
  // confronto fra bambini (vedi session-report.js).
  const meta = Math.floor(righe.length / 2);
  const somma = (arr) => arr.reduce((t, r) => t + r.attempts, 0);
  const andamento = righe.length >= 4
    ? `<p style="margin:0">Prima metà della sessione: <strong>${somma(righe.slice(0, meta))} tentativi</strong> su ${meta} esercizi. Seconda metà: <strong>${somma(righe.slice(meta))} tentativi</strong> su ${righe.length - meta}.</p>`
    : '';

  // Nota operativa: quella del misconcetto piu' frequente, se ce n'e' uno.
  const conteggi = new Map();
  for (const r of righe) for (const m of r.misconcetti) conteggi.set(m.label, { ...m, tot: (conteggi.get(m.label)?.tot ?? 0) + m.count });
  const dominante = [...conteggi.values()].sort((a, b) => b.tot - a.tot)[0];

  const transferOk = /completato/i.test(reportData.transferOutcome);

  view.innerHTML = `
    <div class="grid-teacher">
      <div class="stack">
        <div class="card">
          <h2 class="h-section" style="font-size:20px;margin-bottom:2px">Andamento della sessione</h2>
          <p class="muted small" style="margin:0 0 16px">Un esercizio per riga, nell'ordine in cui è stato affrontato.</p>
          <table class="tbl">
            <thead>
              <tr>
                <th scope="col">Esercizio</th>
                <th scope="col">Tentativi</th>
                <th scope="col">Primo colpo</th>
                <th scope="col">Supporto</th>
                <th scope="col">Che cosa ha confuso</th>
              </tr>
            </thead>
            <tbody id="report-steps-list">${corpo}</tbody>
          </table>
        </div>

        <div id="report-transfer-outcome" class="callout ${transferOk ? 'callout--good' : ''}">
          <p style="margin:0"><strong>${reportData.transferOutcome}</strong></p>
          <p class="small" style="margin:6px 0 0">Verifica finale, affrontata senza alcun supporto visivo.</p>
          ${andamento}
        </div>
      </div>

      <aside class="stack">
        <div class="card stack-sm">
          <h3 class="h-section" style="margin:0">Sessione</h3>
          <p class="small" style="margin:0"><strong>${livelli[pdpLevel]?.label ?? `Livello ${pdpLevel}`}</strong></p>
          <p class="small muted" style="margin:0">${livelli[pdpLevel]?.effetto ?? ''}</p>
          <p class="small" style="margin:0">Esercizi affrontati: <strong>${righe.length}</strong></p>
        </div>

        <div class="card stack-sm">
          <h3 class="h-section" style="margin:0">Che cosa osservare</h3>
          ${dominante && dominante.nota_docente
            ? `<p class="small" style="margin:0">Errore più frequente: <strong>${dominante.label}</strong>.</p>
               <p class="small" style="margin:0">${dominante.nota_docente}</p>`
            : '<p class="small" style="margin:0">Nessun errore ricorrente in questa sessione.</p>'}
        </div>

        <div class="stack-sm no-print">
          <button id="btn-print-report" type="button" class="btn btn--ghost btn--wide">Stampa il report</button>
          <button id="btn-new-session" type="button" class="btn--link">Nuova sessione</button>
        </div>
      </aside>
    </div>
  `;

  document.getElementById('btn-print-report')?.addEventListener('click', () => window.print());

  // Handler vero invece di onclick inline: azzera solo i dati di sessione
  // tramite il modulo che possiede quelle chiavi, non localStorage.clear().
  document.getElementById('btn-new-session')?.addEventListener('click', () => {
    clearSessionData();
    localStorage.removeItem('pdpLevel');
    window.location.href = '?role=teacher';
  });
}

// ── Parent view (TSK-018, P2) ─────────────────────────────────────────────────
async function renderParentView() {
  showView('view-parent');
  const view = document.getElementById('view-parent');
  try {
    const resp = await fetch('./data/parent-language.json');
    const data = await resp.json();
    view.innerHTML = `
      <div class="card stack">
        <div>
          <h2 class="h-question">${data.title}</h2>
          <p class="muted" style="margin:8px 0 0">${data.intro}</p>
        </div>
        <ul style="margin:0;padding-left:22px">
          ${(data.points || []).map(p => `<li style="margin-bottom:10px">${p}</li>`).join('')}
        </ul>
      </div>
    `;
  } catch {
    view.innerHTML = `
      <div class="card">
        <h2 class="h-question">Vista famiglie</h2>
        <p class="muted" style="margin:8px 0 0">Disponibile nella prossima versione.</p>
      </div>
    `;
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function init() {
  const [mods] = await Promise.all([loadModules(), loadFractionLabels()]);
  engine = mods.engine;
  getSafeRemediation = mods.getSafeRemediation;
  initRouter = mods.initRouter;
  getRole = mods.getRole;
  getPdpLevel = mods.getPdpLevel;
  setPdpLevel = mods.setPdpLevel;
  getSessionReport = mods.getSessionReport;
  hasSessionData = mods.hasSessionData;
  clearSessionData = mods.clearSessionData;

  // Come `window.fixtures` in explainer.js: uno specchio per DevTools e per i
  // test browser, che devono sapere qual e' la risposta giusta senza indovinarla.
  globalThis.__engine = engine;

  initRouter({
    home: renderHomeView,
    student: renderStudentView,
    teacher: renderTeacherView,
    parent: renderParentView
  });
}

init().catch(err => {
  const msg = document.getElementById('loading-message');
  if (msg) msg.textContent = 'Errore: ' + err.message;
  console.error(err);
});
