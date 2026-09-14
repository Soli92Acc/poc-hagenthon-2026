/**
 * offline-check.mjs — parte automatizzabile di TSK-011.
 *
 * Il dry run a rete staccata resta un'attivita' umana (TSK-011/TSK-024). Questo
 * script anticipa il 90% dei modi in cui quel dry run puo' fallire, cosi' non si
 * scoprono alle 4:30 di sera davanti alla giuria.
 *
 * Esegue: node app/tests/offline-check.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installaPolyfill, importaModuli, rete } from './harness.mjs';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let esito = 0;
const ok = (m) => console.log(`  PASS  ${m}`);
const ko = (m) => { console.log(`  FAIL  ${m}`); esito = 1; };
const skip = (m) => console.log(`  SKIP  ${m}`);

console.log('=== Dipendenze esterne dichiarate nel codice ===');

const file = [];
for (const f of await readdir(APP)) if (f.endsWith('.js') || f.endsWith('.html')) file.push(join(APP, f));

const esterne = [];
for (const f of file) {
  const testo = await readFile(f, 'utf8');
  for (const [i, riga] of testo.split('\n').entries()) {
    const m = riga.match(/https?:\/\/[^\s"'`)]+/g);
    if (!m) continue;
    for (const url of m) {
      if (/localhost|127\.0\.0\.1/.test(url)) continue;
      const commento = /^\s*(\*|\/\/)/.test(riga);
      // openrouter.ai compare solo dentro proxy.py (non scansionato) e nei commenti:
      // una URL esterna in un tag <script> o <link> e' invece fatale offline.
      const fatale = /<script|<link|@import/.test(riga);
      esterne.push({ f: f.replace(APP + '/', ''), i: i + 1, url, commento, fatale });
    }
  }
}

const bloccanti = esterne.filter((e) => e.fatale);
if (bloccanti.length === 0) ok('nessuna risorsa esterna caricata da <script>/<link> (niente CDN)');
else {
  ko('risorse esterne che NON caricheranno a rete staccata:');
  for (const e of bloccanti) console.log(`        ${e.f}:${e.i}  ${e.url}`);
}

const altre = esterne.filter((e) => !e.fatale && !e.commento);
if (altre.length) {
  console.log('  nota  URL esterne fuori dai tag di caricamento (verificare che siano solo del live slot):');
  for (const e of altre) console.log(`        ${e.f}:${e.i}  ${e.url}`);
}

if (!existsSync(resolve(APP, 'index.html'))) {
  skip('index.html non ancora presente (file di P-B): il rischio Tailwind da CDN va richiuso li\'');
}

console.log('\n=== Flusso completo con la rete irraggiungibile ===');

installaPolyfill({ consentiRete: false }); // qualunque fetch http:// lancia
const { engine, explainer, router, report } = await importaModuli();
router.setPdpLevel('L1');

try {
  await engine.QuizEngine.startSession();
  ok('sessione avviata senza rete');

  const r = engine.QuizEngine.submit('d2');
  const { step_id, level, slug } = engine.QuizEngine.getRemediationKeyParts();
  const rem = await explainer.getSafeRemediation(step_id, level, slug);
  if (r.state === 'REMEDIATION' && rem.text.length > 20) ok(`remediation servita offline (origine: ${rem.source})`);
  else ko('remediation non servita offline');

  engine.QuizEngine.submit('d1');
  engine.QuizEngine.nextStep();
  engine.QuizEngine.submit('d1');
  const rep = report.getSessionReport();
  if (rep.transferOutcome === 'Transfer completato autonomamente') ok('transfer e report completati offline');
  else ko(`report offline inatteso: ${rep.transferOutcome}`);

  if (rete.chiamate === 0) ok('zero tentativi di rete durante tutto il flusso');
  else ko(`${rete.chiamate} tentativi di rete (offline il flusso si bloccherebbe)`);
} catch (e) {
  ko(`il flusso si e interrotto offline: ${e.message}`);
}

console.log('\n=== Il live slot degrada, non si pianta ===');
globalThis.DEMO_MODE = false;
const t0 = Date.now();
const out = await explainer.getSafeRemediation('step1', 'L1', 'chiave_assente');
const ms = Date.now() - t0;
if (out.text && ms < 4000) ok(`con DEMO_MODE=false e rete giu': fallback in ${ms} ms, nessuno spinner infinito`);
else ko(`degrado lento o assente (${ms} ms)`);

console.log(`\nOFFLINE CHECK: ${esito ? 'FAIL' : 'PASS'}`);
process.exit(esito);
