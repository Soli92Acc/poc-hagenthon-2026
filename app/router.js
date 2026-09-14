/**
 * router.js — routing per ruolo e accesso al livello PDP (TSK-012).
 *
 * Il ruolo viaggia nell'URL (`?role=`), il livello PDP in localStorage.
 * Nessuna sincronizzazione fra tab: e' una scelta, non una dimenticanza.
 *
 * NO cross-tab sync by design. Role round-trip via URL param + reload. [PA-R2-1]
 * Nessun listener `storage` in tutta la codebase: due tab aperte su ruoli diversi
 * devono restare indipendenti, altrimenti la view docente riscriverebbe sotto i
 * piedi della sessione studente in corso.
 */

const RUOLI_VALIDI = ['student', 'teacher', 'parent'];
const RUOLO_DEFAULT = 'student';
const LS_PDP = 'pdpLevel';

export function getRole() {
  const richiesto = new URLSearchParams(globalThis.location?.search ?? '').get('role');
  return RUOLI_VALIDI.includes(richiesto) ? richiesto : RUOLO_DEFAULT;
}

export function getPdpLevel() {
  return globalThis.localStorage?.getItem(LS_PDP) ?? null;
}

/**
 * SINGLE-WRITER: solo questa funzione assegna pdpLevel. Non aggiungere altri writer.
 * [gate clinico] — il livello PDP e' una decisione del docente, e deve esistere un
 * solo punto nel codice in cui quella decisione viene registrata.
 */
export function setPdpLevel(level) {
  if (!level) throw new Error('Livello PDP mancante.');
  globalThis.localStorage?.setItem(LS_PDP, level);
}

/**
 * Sceglie la view in base al ruolo e la invoca.
 * Le funzioni di render sono fornite da app.js (P-B): questo modulo non conosce
 * il DOM e non chiama nulla per nome.
 *
 * @param {{student: Function, teacher: Function, parent?: Function}} views
 */
export function initRouter(views = {}) {
  const role = getRole();
  const render = views[role] ?? views[RUOLO_DEFAULT];
  if (typeof render !== 'function') {
    throw new Error(`Nessuna view registrata per il ruolo "${role}".`);
  }
  render({ role, pdpLevel: getPdpLevel() });
  return role;
}

export default { initRouter, getRole, getPdpLevel, setPdpLevel };
