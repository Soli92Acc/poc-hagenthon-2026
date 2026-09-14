/**
 * explainer.js — risoluzione della spiegazione adattiva + presidio del confine clinico
 * (TSK-008, US-004 + US-011).
 *
 * `getSafeRemediation()` e' l'UNICO punto da cui un testo di remediation puo' uscire
 * verso la UI. Qualunque altra strada e' un bug di sicurezza, non uno stile: la
 * denylist clinica e' ineffettiva se esiste un secondo percorso verso il DOM.
 *
 * Catena di risoluzione (fallback chain):
 *   1. fixtures.json  — testo pre-validato, zero rete, e' il percorso della demo
 *   2. live slot      — solo se DEMO_MODE=false, timeout 3s, una sola chiamata
 *   3. fallback fisso — sempre disponibile, offline, denylist-clean per costruzione
 */

/** Configurazione di default: durante sviluppo, test e demo si sta in DEMO_MODE.
 *  Zero richieste OpenRouter per il debug ordinario (disciplina di budget). */
export const DEMO_MODE = true;

// Toggle runtime per il live slot test (TSK-010): dalla console del browser si scrive
// `DEMO_MODE = false`. Una const di modulo non sarebbe riassegnabile da li'.
if (globalThis.DEMO_MODE === undefined) globalThis.DEMO_MODE = DEMO_MODE;

import { buildRemediationMessages } from './remediation-prompt.js';

const PATH_FIXTURES = 'data/fixtures.json';
const PATH_CURRICULUM = 'data/curriculum-discalculia.json';
const PATH_DENYLIST = 'data/clinical-denylist.json';
const LIVE_SLOT_URL = 'http://localhost:8080/complete';
const LIVE_SLOT_TIMEOUT_MS = 3000;
// Stesso modello delle fixture: la voce narrativa del live slot non deve stonare.
const LIVE_SLOT_MODEL = 'nex-agi/nex-n2.5-mini:free';

/** Tier 3. Non nomina l'errore specifico perche' deve valere per qualunque chiave
 *  mancante, e non contiene nulla che somigli a un giudizio sulla persona. */
const FALLBACK_TEXT =
  'Guarda bene i pezzi. Più il numero in basso è grande, più ogni pezzo diventa piccolo. ' +
  'Prova a immaginare la stessa torta divisa in modi diversi, poi riprova con calma.';

let fixturesCache = null;
let denylistCache = null;

function isDemoMode() {
  return globalThis.DEMO_MODE !== false;
}

export async function loadFixtures() {
  if (fixturesCache) return fixturesCache;
  try {
    fixturesCache = await fetch(PATH_FIXTURES).then((r) => r.json());
  } catch {
    fixturesCache = {};
  }
  globalThis.fixtures = fixturesCache; // ispezionabile da DevTools durante la demo
  return fixturesCache;
}

async function loadDenylist() {
  if (denylistCache) return denylistCache;
  try {
    const raw = await fetch(PATH_DENYLIST).then((r) => r.json());
    const terms = Array.isArray(raw) ? raw : raw.terms;
    // Ancoraggio a inizio parola: "cura" non deve scattare dentro "sicura",
    // ma "riabilit" deve coprire "riabilitazione".
    denylistCache = terms.map((t) => ({
      term: t,
      re: new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
    }));
  } catch {
    denylistCache = [];
  }
  return denylistCache;
}

export function buildKey(step_id, level, misconcepto_slug) {
  return `${step_id}-${level}-${misconcepto_slug}`;
}

function fixtureToText(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  return [entry.headline, entry.spiegazione, entry.analogia].filter(Boolean).join(' ');
}

let curriculumCache = null;

/** Caricato solo sul percorso live slot: in DEMO_MODE non si paga questo fetch. */
async function contestoStep(step_id) {
  if (!curriculumCache) {
    try {
      curriculumCache = await fetch(PATH_CURRICULUM).then((r) => r.json());
    } catch {
      curriculumCache = { steps: [] };
    }
  }
  const step = (curriculumCache.steps || []).find((s) => s.step_id === step_id);
  const item = step?.items?.[0];
  return {
    fraction_a: item?.fraction_a,
    fraction_b: item?.fraction_b,
    transfer: step?.scaffold === false,
  };
}

async function callLiveSlot(step_id, level, misconcepto_slug) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVE_SLOT_TIMEOUT_MS);
  try {
    // Senza il contesto dell'esercizio il modello produce testo corretto ma
    // fuori tema: e' il difetto che rende inutile una demo "dal vivo".
    const ctx = await contestoStep(step_id);
    const res = await fetch(LIVE_SLOT_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LIVE_SLOT_MODEL,
        reasoning: { enabled: false },
        max_tokens: 500,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: buildRemediationMessages({ ...ctx, level, slug: misconcepto_slug }),
      }),
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    try {
      return fixtureToText(JSON.parse(content));
    } catch {
      const m = content.match(/\{[\s\S]*\}/); // json_object non rispettato: estrazione manuale
      if (m) { try { return fixtureToText(JSON.parse(m[0])); } catch { /* cade sotto */ } }
      return content.trim() || null;
    }
  } catch {
    return null; // timeout, rete giu', proxy spento: si scende al tier 3
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Risoluzione grezza, SENZA presidio clinico. Non usarla dalla UI:
 * esiste per l'integration test D2 e per i test della catena di fallback.
 * Il punto d'ingresso della UI e' `getSafeRemediation()`.
 */
export async function resolveRemediation(step_id, level, misconcepto_slug) {
  const fixtures = await loadFixtures();
  const diretta = fixtureToText(fixtures[buildKey(step_id, level, misconcepto_slug)]);
  if (diretta) return diretta;

  // Degrado per livello: una spiegazione dell'altro livello e' preferibile al fallback.
  for (const altro of ['L1', 'L2']) {
    if (altro === level) continue;
    const vicina = fixtureToText(fixtures[buildKey(step_id, altro, misconcepto_slug)]);
    if (vicina) return vicina;
  }

  if (!isDemoMode()) {
    const live = await callLiveSlot(step_id, level, misconcepto_slug);
    if (live) return live;
  }
  return FALLBACK_TEXT;
}

/**
 * UNICO entry point verso il DOM per i testi di remediation.
 * Se il testo contiene un termine della denylist non viene filtrato parzialmente:
 * viene scartato per intero e sostituito dal fallback. Sanificare a pezzi
 * lascerebbe passare la frase attorno al termine, che e' il vero problema.
 *
 * @returns {Promise<{text: string, wasCleaned: boolean, source: string}>}
 */
export async function getSafeRemediation(step_id, level, misconcepto_slug) {
  const [testo, denylist] = await Promise.all([
    resolveRemediation(step_id, level, misconcepto_slug),
    loadDenylist(),
  ]);

  const colpito = denylist.find((d) => d.re.test(testo));
  if (colpito) {
    console.warn(`[confine clinico] testo scartato, termine bloccato: "${colpito.term}"`);
    return { text: FALLBACK_TEXT, wasCleaned: true, source: 'fallback' };
  }
  return {
    text: testo,
    wasCleaned: false,
    source: testo === FALLBACK_TEXT ? 'fallback' : 'fixture',
  };
}

export const __test__ = { FALLBACK_TEXT, resetCache: () => { fixturesCache = null; denylistCache = null; } };
