/**
 * engine.js — state machine MCQ di NumeriMiei (TSK-003, TSK-004, TSK-014).
 *
 * Logica pura: NON tocca mai il DOM. Il rendering e' interamente di app.js (P-B),
 * che guida l'engine tramite l'API esposta in fondo al file (contratto CT-2).
 *
 * Nessun contenuto didattico e' inline qui dentro: esercizi, distrattori e policy
 * di livello vivono in data/curriculum-discalculia.json e data/pdp-levels.json.
 * L'unica stringa di prodotto hardcoded e' STOP_MESSAGE, e lo e' per obbligo:
 * non deve mai poter arrivare da un LLM.
 */

export const STATES = Object.freeze({
  STEP: 'STEP',
  REMEDIATION: 'REMEDIATION',
  NEXT: 'NEXT',
  STOPPED: 'STOPPED',
  COMPLETION: 'COMPLETION',
});

/** Messaggio di stop dopo 3 errori consecutivi. Hardcoded per design: mai da LLM,
 *  mai riscritto, mai parafrasato. E' il confine tra didattica e presa in carico. */
const STOP_MESSAGE =
  'Questo esercizio è meglio affrontarlo con il tuo insegnante o il tuo tutor di riferimento.';

const MAX_CONSECUTIVE_ERRORS = 3;

const PATH_CURRICULUM = 'data/curriculum-discalculia.json';
const PATH_LEVELS = 'data/pdp-levels.json';

// Chiavi localStorage scritte dall'engine. `pdpLevel` NON e' fra queste:
// l'engine lo legge soltanto, il solo writer e' la form docente in app.js.
const LS_ERRORS = 'session_errors';
const LS_STEPS = 'session_steps';
const LS_TRANSFER = 'solvedWithoutScaffold';

function readJSON(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* quota piena o storage disabilitato: la sessione prosegue, il report degrada */
  }
}

/**
 * Traccia l'esito del transfer item. Separato dall'engine perche' e' l'unico
 * dato che sopravvive alla sessione ed e' il claim didattico della demo.
 */
export const OutcomeTracker = {
  recordTransferOutcome(isCorrect) {
    try {
      globalThis.localStorage?.setItem(LS_TRANSFER, isCorrect ? 'true' : 'false');
    } catch {
      /* vedi writeJSON */
    }
  },
  reset() {
    try {
      globalThis.localStorage?.removeItem(LS_TRANSFER);
    } catch {
      /* idem */
    }
  },
};

export const QuizEngine = {
  steps: [],
  policy: null,
  pdpLevel: null,
  currentStepIdx: 0,
  currentState: STATES.STEP,
  consecutiveErrors: 0,
  lastSlug: null,

  /**
   * Carica curriculum + policy di livello e seleziona il sottoinsieme di step
   * previsto per il livello PDP. La selezione e' guidata dai dati
   * (`includes_levels` in pdp-levels.json), non da logica hardcoded qui:
   * cambiare la progressione non richiede toccare questo file.
   */
  async loadCurriculum(pdpLevel) {
    const [curriculum, levels] = await Promise.all([
      fetch(PATH_CURRICULUM).then((r) => r.json()),
      fetch(PATH_LEVELS).then((r) => r.json()),
    ]);

    const policy = levels[pdpLevel];
    if (!policy) throw new Error(`Livello PDP sconosciuto: ${pdpLevel}`);

    this.pdpLevel = pdpLevel;
    this.policy = policy;
    this.steps = (curriculum.steps || []).filter((s) =>
      policy.includes_levels.includes(s.level),
    );
    if (this.steps.length === 0) {
      throw new Error(`Nessuno step disponibile per il livello ${pdpLevel}`);
    }

    this.currentStepIdx = 0;
    this.currentState = STATES.STEP;
    this.consecutiveErrors = 0;
    this.lastSlug = null;
    return this.steps.length;
  },

  /**
   * Avvio di sessione lato studente. Fail-loud se il PDP non e' configurato:
   * meglio un errore esplicito che una sessione con un livello implicito sbagliato.
   * NO cross-tab sync by design. Role round-trip via URL param + reload. [PA-R2-1]
   */
  async startSession() {
    const pdpLevel = globalThis.localStorage?.getItem('pdpLevel');
    if (!pdpLevel) {
      throw new Error('pdpLevel non configurato. Vai alla view docente.');
    }
    this.resetSessionData();
    return this.loadCurriculum(pdpLevel);
  },

  resetSessionData() {
    writeJSON(LS_ERRORS, []);
    writeJSON(LS_STEPS, []);
    OutcomeTracker.reset();
  },

  getState() {
    return this.currentState;
  },

  getCurrentStep() {
    return this.steps[this.currentStepIdx] ?? null;
  },

  /** Scorciatoia per la UI: il primo item dello step corrente (quello renderizzato). */
  getCurrentItem() {
    return this.getCurrentStep()?.items?.[0] ?? null;
  },

  getStopMessage() {
    return STOP_MESSAGE;
  },

  getScaffoldPolicy() {
    return this.policy;
  },

  /** Transfer item: lo step che misura il trasferimento, senza alcun supporto visivo. */
  isTransferStep() {
    return this.getCurrentStep()?.scaffold === false;
  },

  /**
   * Scaffold-fading: sul transfer il supporto non compare mai; sugli step di
   * training compare dopo N errori, con N letto dalla policy di livello
   * (L1: dal primo errore, L2: dal secondo).
   */
  getScaffoldVisible() {
    if (this.isTransferStep()) return false;
    const soglia = this.policy?.show_number_line_after_errors ?? 1;
    return this.consecutiveErrors >= soglia;
  },

  /**
   * Valuta la risposta e fa avanzare la state machine.
   * @returns {{correct: boolean, state: string, misconcepto_slug: string|null, attempts: number}}
   */
  submit(distractorId) {
    const step = this.getCurrentStep();
    const item = this.getCurrentItem();
    if (!step || !item) throw new Error('Nessuno step attivo: chiamare startSession() prima.');

    const scelta = (item.distractors || []).find((d) => d.id === distractorId);
    if (!scelta) throw new Error(`Opzione sconosciuta: ${distractorId}`);

    const corretta = scelta.correct === true;
    const slug = scelta.misconcepto_slug ?? null;
    const transfer = this.isTransferStep();

    this.recordAttempt(step.step_id);

    if (corretta) {
      this.consecutiveErrors = 0;
      this.lastSlug = null;
      this.currentState = STATES.NEXT;
    } else {
      this.consecutiveErrors += 1;
      this.lastSlug = slug;
      this.recordError(step.step_id, slug);
      this.currentState =
        this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS ? STATES.STOPPED : STATES.REMEDIATION;
    }

    if (transfer) OutcomeTracker.recordTransferOutcome(corretta);

    return {
      correct: corretta,
      state: this.currentState,
      misconcepto_slug: corretta ? null : slug,
      attempts: this.consecutiveErrors,
    };
  },

  /** Avanza allo step successivo, o chiude la sessione se non ce ne sono altri. */
  nextStep() {
    if (this.currentState === STATES.STOPPED) return this.currentState;
    this.currentStepIdx += 1;
    this.consecutiveErrors = 0;
    this.lastSlug = null;
    this.currentState =
      this.currentStepIdx >= this.steps.length ? STATES.COMPLETION : STATES.STEP;
    return this.currentState;
  },

  /** Chiave composta per la remediation: la costruisce chi conosce lo stato. */
  getRemediationKeyParts() {
    return {
      step_id: this.getCurrentStep()?.step_id ?? null,
      level: this.pdpLevel,
      slug: this.lastSlug,
    };
  },

  recordAttempt(stepId) {
    const steps = readJSON(LS_STEPS, []);
    const riga = steps.find((s) => s.step_id === stepId);
    if (riga) riga.totalAttempts += 1;
    else steps.push({ step_id: stepId, totalAttempts: 1 });
    writeJSON(LS_STEPS, steps);
  },

  recordError(stepId, slug) {
    const errori = readJSON(LS_ERRORS, []);
    errori.push({ step_id: stepId, misconcepto_slug: slug, timestamp: Date.now() });
    writeJSON(LS_ERRORS, errori);
  },
};

export default QuizEngine;
