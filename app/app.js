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
function showView(viewId) {
  document.getElementById('loading-message').hidden = true;
  ['view-student', 'view-teacher', 'view-parent'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = id !== viewId;
  });
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
function renderFeedback(text, isCorrect) {
  const region = document.getElementById('feedback-region');
  if (!region) return;
  region.className = [
    'mt-6 p-4 rounded border',
    isCorrect
      ? 'bg-green-50 text-green-900 border-green-300'
      : 'bg-red-50 text-red-900 border-red-300'
  ].join(' ');
  // Non-color indicator (WCAG 1.4.1 — not conveyed by colour alone)
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.className = 'font-bold mr-2';
  icon.textContent = isCorrect ? '✓' : '✗';
  region.innerHTML = '';
  region.appendChild(icon);
  region.appendChild(document.createTextNode(text));
}

function renderStop(message) {
  const stopRegion = document.getElementById('stop-region');
  if (!stopRegion) return;
  stopRegion.removeAttribute('hidden');
  stopRegion.textContent = message;
  const feedbackRegion = document.getElementById('feedback-region');
  if (feedbackRegion) feedbackRegion.className = 'hidden';
  const submitBtn = document.getElementById('btn-submit');
  if (submitBtn) submitBtn.remove(); // removed from DOM per spec
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
  btn.className = 'mt-4 w-full py-3 px-6 bg-[#1a1a1a] text-white rounded font-semibold focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2';
  btn.textContent = label;
  btn.addEventListener('click', handler);
  document.getElementById('feedback-region')?.appendChild(btn);
}

// ── MCQ render (TSK-005, TSK-015, TSK-020) ───────────────────────────────────
function renderStep(step) {
  const item = step.items[0];
  const view = document.getElementById('view-student');
  view.innerHTML = '';
  selectedDistractorId = null;

  // Heading
  const h2 = document.createElement('h2');
  h2.id = 'question-text';
  h2.className = 'text-xl font-bold mb-4 leading-snug';
  h2.textContent = step.transfer ? 'Prova questa!' : step.question;
  view.appendChild(h2);

  if (step.transfer) {
    const subq = document.createElement('p');
    subq.className = 'mb-4 numeric';
    subq.textContent = step.question;
    view.appendChild(subq);
  }

  // Number line:
  //   training + scaffold=true  → visible
  //   training + scaffold=false → visibility:hidden (layout preserved, TSK-020)
  //   transfer                  → NOT in DOM before answer (TSK-015)
  if (!step.transfer) {
    const correctD = item.distractors.find(d => d.correct);
    const denomD = item.distractors.find(d => d.misconcepto_slug === 'denominator_magnitude');
    const nlWrapper = buildNumberLine([
      { label: item.fraction_a, position_pct: correctD.position_pct, highlighted: false },
      { label: item.fraction_b, position_pct: denomD.position_pct, highlighted: false }
    ]);
    nlWrapper.id = 'nl-container';
    if (!step.scaffold) {
      // visibility:hidden preserves box model during scaffold fading
      nlWrapper.style.visibility = 'hidden';
    }
    view.appendChild(nlWrapper);
  }

  // Stacked fractions display (TSK-020)
  if (!step.transfer) {
    const fracRow = document.createElement('p');
    fracRow.className = 'mb-4 text-center';
    fracRow.setAttribute('aria-hidden', 'true'); // spoken via aria-labels on number line
    fracRow.appendChild(buildStackedFraction(item.fraction_a));
    const vs = document.createElement('span');
    vs.className = 'mx-4 text-gray-500';
    vs.textContent = 'o';
    fracRow.appendChild(vs);
    fracRow.appendChild(buildStackedFraction(item.fraction_b));
    view.appendChild(fracRow);
  }

  // Options — single column, gap ≥1.5rem (space-y-6 = 24px)
  const ol = document.createElement('ol');
  ol.setAttribute('role', 'list');
  ol.className = 'space-y-6 mb-8';

  item.distractors.forEach(d => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn w-full text-left px-4 py-3 border-2 border-[#1a1a1a] rounded numeric';
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.distractorId = d.id;
    btn.textContent = d.label;
    btn.addEventListener('click', () => selectOption(d.id));
    li.appendChild(btn);
    ol.appendChild(li);
  });
  view.appendChild(ol);

  // Submit button — disabled until option selected
  const submitBtn = document.createElement('button');
  submitBtn.id = 'btn-submit';
  submitBtn.type = 'button';
  submitBtn.className = 'w-full py-3 px-6 bg-[#1a1a1a] text-white rounded font-semibold disabled:opacity-40';
  submitBtn.textContent = 'Rispondo';
  submitBtn.disabled = true;
  submitBtn.addEventListener('click', handleSubmit);
  view.appendChild(submitBtn);

  // Feedback region — aria-live for screen readers, tabindex=-1 for programmatic focus
  const feedbackRegion = document.createElement('div');
  feedbackRegion.id = 'feedback-region';
  feedbackRegion.setAttribute('aria-live', 'polite');
  feedbackRegion.setAttribute('aria-atomic', 'true');
  feedbackRegion.setAttribute('tabindex', '-1');
  feedbackRegion.className = 'hidden';
  view.appendChild(feedbackRegion);

  // Stop region — shown verbatim after 3 consecutive errors
  const stopRegion = document.createElement('div');
  stopRegion.id = 'stop-region';
  stopRegion.setAttribute('hidden', '');
  stopRegion.className = 'mt-6 p-4 rounded bg-gray-100 text-[#1a1a1a]';
  view.appendChild(stopRegion);
}

function showCompletion() {
  const view = document.getElementById('view-student');
  view.innerHTML = `
    <div class="text-center py-12">
      <h2 class="text-2xl font-bold mb-4">Sessione completata!</h2>
      <p class="mb-6">Ottimo lavoro. Il tuo insegnante vedrà i risultati.</p>
    </div>
  `;
}

// ── Student view ──────────────────────────────────────────────────────────────
async function renderStudentView() {
  showView('view-student');
  const pdpLevel = getPdpLevel();
  if (!pdpLevel) {
    document.getElementById('view-student').innerHTML = `
      <div class="text-center py-12">
        <h2 class="text-xl font-bold mb-4">Sessione non configurata</h2>
        <p>Il tuo insegnante deve impostare il livello PDP prima di iniziare.</p>
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
    renderPdpForm(view);
  }
}

function renderPdpForm(view) {
  view.innerHTML = `
    <div class="max-w-lg mx-auto py-8">
      <h2 class="text-xl font-bold mb-6">Impostazione sessione</h2>
      <p class="mb-4">Seleziona il livello indicato nel PDP del tuo studente.</p>
      <div class="mb-6">
        <label for="pdp-level-select" class="block mb-2 font-semibold">Livello PDP</label>
        <select id="pdp-level-select"
          class="w-full border-2 border-[#1a1a1a] rounded px-3 py-2 text-[18px] bg-white">
          <option value="" disabled selected hidden></option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
        </select>
      </div>
      <button id="btn-confirm-pdp" disabled
        class="w-full py-3 px-6 bg-[#1a1a1a] text-white rounded font-semibold disabled:opacity-40">
        Conferma e inizia sessione
      </button>
    </div>
  `;

  const select = document.getElementById('pdp-level-select');
  const btn = document.getElementById('btn-confirm-pdp');

  select.addEventListener('change', () => { btn.disabled = !select.value; });

  btn.addEventListener('click', () => {
    if (!select.value) return;
    // SINGLE-WRITER: solo questa funzione scrive pdpLevel [gate clinico]
    setPdpLevel(select.value);
    window.location.href = '?role=student';
  });
}

async function renderTeacherReport(view) {
  const reportData = getSessionReport();

  let misconceptions = {};
  try {
    const resp = await fetch('./data/misconceptions.json');
    misconceptions = await resp.json();
  } catch { /* fallback: slug used as label */ }

  const pdpLevel = getPdpLevel() || '–';

  const stepLabels = { step1: 'Esercizio 1', step2: 'Esercizio 2', step3: 'Esercizio di verifica' };

  const rows = reportData.stepsData.flatMap(s => {
    const label = stepLabels[s.step_id] || s.step_id;
    if (!s.misconceptErrors.length) return [`<li class="py-2 px-4">${label}: nessun errore rilevato</li>`];
    return s.misconceptErrors.map(e => {
      const name = misconceptions[e.slug] || e.slug;
      const times = e.count === 1 ? 'una volta' : `${e.count} volte`;
      return `<li class="py-2 px-4">${label}: <strong>${name}</strong> — rilevato ${times}</li>`;
    });
  }).join('');

  view.innerHTML = `
    <div class="max-w-lg mx-auto py-8">
      <h2 class="text-xl font-bold mb-2">Sessione di ${pdpLevel}</h2>
      <p class="text-sm text-gray-500 mb-6">Report al termine della sessione</p>

      <h3 class="font-semibold mb-3">Errori rilevati per esercizio</h3>
      <ul id="report-steps-list" class="mb-6 divide-y border rounded bg-gray-50">
        ${rows}
      </ul>

      <p id="report-transfer-outcome" class="mb-6 p-4 bg-gray-50 rounded border font-medium">
        ${reportData.transferOutcome}
      </p>

      <button id="btn-new-session" type="button"
        class="underline text-[#1a1a1a] text-sm focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2">
        Nuova sessione
      </button>
    </div>
  `;

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
      <div class="max-w-lg mx-auto py-8">
        <h2 class="text-xl font-bold mb-4">${data.title}</h2>
        <p class="mb-4">${data.intro}</p>
        <ul class="space-y-3 list-disc pl-6">
          ${(data.points || []).map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    `;
  } catch {
    view.innerHTML = `
      <div class="text-center py-12">
        <h2 class="text-xl font-bold mb-4">Vista genitore</h2>
        <p>Disponibile nella prossima versione.</p>
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

  initRouter({
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
