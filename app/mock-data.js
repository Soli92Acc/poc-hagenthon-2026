// Mock layer — conforming to CT-1..CT-5. Set MOCK=false at integration (sync S2).
export const MOCK = true;

// Steps matching curriculum-discalculia.json exactly (CT-1)
const STEPS = {
  L1: [
    {
      step_id: 'step1',
      level: 'L1',
      scaffold: true,
      transfer: false,
      question: 'Quale è più grande: 1/3 o 1/4?',
      items: [{
        fraction_a: '1/3',
        fraction_b: '1/4',
        correct: 'd1',
        distractors: [
          { id: 'd1', label: '1/3', misconcepto_slug: null, position_pct: 0.333, correct: true },
          { id: 'd2', label: '1/4, perché 4 è più grande di 3', misconcepto_slug: 'denominator_magnitude', position_pct: 0.25, correct: false },
          { id: 'd3', label: 'Sono uguali, il numeratore è 1 in tutte e due', misconcepto_slug: 'numerator_focus', position_pct: 0.25, correct: false }
        ]
      }]
    },
    {
      step_id: 'step3',
      level: 'L1|L2',
      scaffold: false,
      transfer: true,
      question: 'Quale è più grande: 1/5 o 1/6?',
      items: [{
        fraction_a: '1/5',
        fraction_b: '1/6',
        correct: 'd1',
        distractors: [
          { id: 'd1', label: '1/5', misconcepto_slug: null, position_pct: 0.2, correct: true },
          { id: 'd2', label: '1/6, perché 6 è più grande di 5', misconcepto_slug: 'denominator_magnitude', position_pct: 0.167, correct: false },
          { id: 'd3', label: 'Sono uguali, il numeratore è lo stesso', misconcepto_slug: 'numerator_focus', position_pct: 0.167, correct: false }
        ]
      }]
    }
  ],
  L2: [
    {
      step_id: 'step2',
      level: 'L2',
      scaffold: true,
      transfer: false,
      question: 'Quale è più grande: 1/4 o 1/7?',
      items: [{
        fraction_a: '1/4',
        fraction_b: '1/7',
        correct: 'd1',
        distractors: [
          { id: 'd1', label: '1/4', misconcepto_slug: null, position_pct: 0.25, correct: true },
          { id: 'd2', label: '1/7, perché 7 è più grande di 4', misconcepto_slug: 'denominator_magnitude', position_pct: 0.143, correct: false },
          { id: 'd3', label: 'Sono uguali, il numeratore è lo stesso', misconcepto_slug: 'numerator_focus', position_pct: 0.143, correct: false }
        ]
      }]
    },
    {
      step_id: 'step3',
      level: 'L1|L2',
      scaffold: false,
      transfer: true,
      question: 'Quale è più grande: 1/5 o 1/6?',
      items: [{
        fraction_a: '1/5',
        fraction_b: '1/6',
        correct: 'd1',
        distractors: [
          { id: 'd1', label: '1/5', misconcepto_slug: null, position_pct: 0.2, correct: true },
          { id: 'd2', label: '1/6, perché 6 è più grande di 5', misconcepto_slug: 'denominator_magnitude', position_pct: 0.167, correct: false },
          { id: 'd3', label: 'Sono uguali, il numeratore è lo stesso', misconcepto_slug: 'numerator_focus', position_pct: 0.167, correct: false }
        ]
      }]
    }
  ]
};

// Stateful mock engine (CT-2 interface)
let _steps = [];
let _idx = 0;
let _consecutiveErrors = 0;
let _state = 'STEP';
const _errors = [];

export const mockEngine = {
  async loadCurriculum(pdpLevel) {
    _steps = (pdpLevel === 'L2' ? STEPS.L2 : STEPS.L1);
    _idx = 0;
    _consecutiveErrors = 0;
    _state = 'STEP';
    _errors.length = 0;
  },
  getState() { return _state; },
  getCurrentStep() { return _steps[_idx] || _steps[0]; },
  submit(distractorId) {
    const step = _steps[_idx];
    const item = step.items[0];
    const distractor = item.distractors.find(d => d.id === distractorId);
    const correct = distractor.correct;
    if (correct) {
      _consecutiveErrors = 0;
      _state = _idx >= _steps.length - 1 ? 'COMPLETION' : 'NEXT';
    } else {
      _consecutiveErrors++;
      _errors.push({ step_id: step.step_id, slug: distractor.misconcepto_slug });
      _state = _consecutiveErrors >= 3 ? 'STOPPED' : 'REMEDIATION';
    }
    return { correct, state: _state, misconcepto_slug: correct ? null : distractor.misconcepto_slug };
  },
  nextStep() {
    _idx++;
    _consecutiveErrors = 0;
    _state = _idx >= _steps.length ? 'COMPLETION' : 'STEP';
    return _state;
  },
  getStopMessage() {
    return 'Facciamo una pausa. Chiedi aiuto al tuo insegnante.';
  }
};

// Mock remediation (CT-3 interface)
export async function mockRemediationFn(step_id, level, misconcepto_slug) {
  const messages = {
    denominator_magnitude: 'Attenzione: un denominatore più grande significa pezzi più piccoli! Guarda la linea.',
    numerator_focus: 'Guarda i pezzi, non solo il numero in basso. Più pezzi significa pezzi più piccoli.'
  };
  return {
    text: messages[misconcepto_slug] || 'Riprova guardando la linea delle frazioni.',
    wasCleaned: false
  };
}

// Mock session report (CT-5 interface)
export function mockGetSessionReportFn() {
  const errorsByStep = {};
  _errors.forEach(({ step_id, slug }) => {
    if (!errorsByStep[step_id]) errorsByStep[step_id] = {};
    errorsByStep[step_id][slug] = (errorsByStep[step_id][slug] || 0) + 1;
  });
  const stepsData = _steps.map(s => ({
    step_id: s.step_id,
    attempts: 0,
    misconceptErrors: Object.entries(errorsByStep[s.step_id] || {}).map(([slug, count]) => ({ slug, count }))
  }));
  const solvedWithout = localStorage.getItem('solvedWithoutScaffold');
  const transferOutcome = solvedWithout === 'true'
    ? 'Transfer completato autonomamente'
    : 'Transfer non completato autonomamente';
  return { stepsData, transferOutcome };
}

// Mock router (CT-4 interface)
export function mockInitRouter({ student, teacher, parent }) {
  const role = new URLSearchParams(window.location.search).get('role') || 'student';
  if (role === 'teacher') teacher();
  else if (role === 'parent') parent();
  else student();
}
export const mockGetRole = () => new URLSearchParams(window.location.search).get('role') || 'student';
export const mockGetPdpLevel = () => localStorage.getItem('pdpLevel');
export const mockSetPdpLevel = (level) => localStorage.setItem('pdpLevel', level);
