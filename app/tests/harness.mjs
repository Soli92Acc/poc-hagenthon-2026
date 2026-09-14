/**
 * harness.mjs — polyfill minimi per far girare i moduli browser dell'app sotto Node.
 * Serve a poter testare engine/explainer/router/report senza aspettare la UI di P-B.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const QUI = dirname(fileURLToPath(import.meta.url));
const APP = resolve(QUI, '..');

/** Le richieste di rete reali vengono contate: il flusso di remediation deve farne zero. */
export const rete = { chiamate: 0, consentita: false, ultimaUrl: null };

const MAPPA_FILE = {
  // In produzione l'engine legge il curriculum di P-B; nei test di P-A si usa il
  // riferimento CT-1, cosi' i test non dipendono da un file che non e' nostro.
  'data/curriculum-discalculia.json': resolve(QUI, 'fixtures/curriculum-sample.json'),
  'data/pdp-levels.json': resolve(APP, 'data/pdp-levels.json'),
  'data/fixtures.json': resolve(APP, 'data/fixtures.json'),
  'data/clinical-denylist.json': resolve(APP, 'data/clinical-denylist.json'),
};

/** Sovrascrive temporaneamente il contenuto servito per un path (injection test). */
export const override = new Map();

export function installaPolyfill({ consentiRete = false } = {}) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; },
  };
  globalThis.location = { search: '' };
  delete globalThis.DEMO_MODE;

  rete.chiamate = 0;
  rete.consentita = consentiRete;
  rete.ultimaUrl = null;
  override.clear();

  const fetchReale = globalThis.__fetchReale__ ?? globalThis.fetch;
  globalThis.__fetchReale__ = fetchReale;

  globalThis.fetch = async (url, opts) => {
    const s = String(url);
    if (s.startsWith('http://') || s.startsWith('https://')) {
      rete.chiamate += 1;
      rete.ultimaUrl = s;
      if (!rete.consentita) throw new Error(`rete bloccata nel test: ${s}`);
      return fetchReale(url, opts);
    }
    if (override.has(s)) {
      const body = override.get(s);
      return { ok: true, json: async () => JSON.parse(body), text: async () => body };
    }
    const file = MAPPA_FILE[s];
    if (!file) throw new Error(`path non mappato nel harness: ${s}`);
    const body = await readFile(file, 'utf8');
    return { ok: true, json: async () => JSON.parse(body), text: async () => body };
  };

  return { store };
}

/** Import con cache-busting: ogni test riparte da moduli con stato pulito. */
let seme = 0;
export async function importaModuli() {
  seme += 1;
  const q = `?t=${seme}`;
  const [engine, explainer, router, report] = await Promise.all([
    import(`../engine.js${q}`),
    import(`../explainer.js${q}`),
    import(`../router.js${q}`),
    import(`../session-report.js${q}`),
  ]);
  return { engine, explainer, router, report };
}

// --- micro test runner ------------------------------------------------------
const risultati = [];

export async function test(nome, fn) {
  try {
    await fn();
    risultati.push({ nome, ok: true });
    console.log(`  PASS  ${nome}`);
  } catch (e) {
    risultati.push({ nome, ok: false, errore: e.message });
    console.log(`  FAIL  ${nome}\n        ${e.message}`);
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'asserzione fallita');
}

export function assertEq(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${msg || 'atteso'}: ${sb}, ottenuto: ${sa}`);
}

export function riepilogo() {
  const ko = risultati.filter((r) => !r.ok);
  console.log(`\n${risultati.length - ko.length}/${risultati.length} PASS`);
  if (ko.length) {
    console.log('FALLITI:');
    for (const r of ko) console.log(`  - ${r.nome}: ${r.errore}`);
  }
  return ko.length === 0;
}
