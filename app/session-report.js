/**
 * session-report.js — aggregazione dei dati di sessione per il report docente (TSK-016).
 *
 * Legge cio' che l'engine ha depositato in localStorage e lo trasforma in fatti
 * osservabili. Deliberatamente NON calcola un punteggio: "73% corretto" direbbe al
 * docente meno di "ha confuso due volte la grandezza del denominatore sullo step 1",
 * e lo direbbe in una forma che invita al confronto fra bambini.
 */

const LS_ERRORS = 'session_errors';
const LS_STEPS = 'session_steps';
const LS_TRANSFER = 'solvedWithoutScaffold';

const TRANSFER_OK = 'Transfer completato autonomamente';
const TRANSFER_KO = 'Transfer non completato autonomamente';
const TRANSFER_NA = 'Transfer non affrontato';

function readJSON(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @returns {{stepsData: Array<{step_id: string, attempts: number,
 *            misconceptErrors: Array<{slug: string, count: number}>}>,
 *            transferOutcome: string}}
 */
export function getSessionReport() {
  const errori = readJSON(LS_ERRORS, []);
  const tentativi = readJSON(LS_STEPS, []);

  // Ordine: quello in cui gli step sono stati affrontati, non alfabetico.
  const ordine = [];
  const perStep = new Map();
  const registra = (stepId) => {
    if (!perStep.has(stepId)) {
      perStep.set(stepId, { step_id: stepId, attempts: 0, conteggi: new Map() });
      ordine.push(stepId);
    }
    return perStep.get(stepId);
  };

  for (const t of tentativi) registra(t.step_id).attempts = t.totalAttempts ?? 0;
  for (const e of errori) {
    const riga = registra(e.step_id);
    const slug = e.misconcepto_slug ?? 'non_classificato';
    riga.conteggi.set(slug, (riga.conteggi.get(slug) ?? 0) + 1);
  }

  const stepsData = ordine.map((id) => {
    const riga = perStep.get(id);
    return {
      step_id: riga.step_id,
      attempts: riga.attempts,
      misconceptErrors: [...riga.conteggi.entries()]
        .map(([slug, count]) => ({ slug, count }))
        .sort((a, b) => b.count - a.count),
    };
  });

  const transfer = globalThis.localStorage?.getItem(LS_TRANSFER) ?? null;
  const transferOutcome =
    transfer === 'true' ? TRANSFER_OK : transfer === 'false' ? TRANSFER_KO : TRANSFER_NA;

  return { stepsData, transferOutcome };
}

export default { getSessionReport };
