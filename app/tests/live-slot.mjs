/**
 * live-slot.mjs — verifica del tier 2 della catena di fallback (TSK-010, test 3).
 *
 * COSTA UNA RICHIESTA OPENROUTER. Non va in nessuna suite automatica: si esegue
 * a mano, si annota nel contatore, e si torna subito in DEMO_MODE.
 * Richiede il proxy attivo: python3 app/proxy.py
 *
 * Esegue: node app/tests/live-slot.mjs
 */
import { installaPolyfill, importaModuli, override, rete } from './harness.mjs';

installaPolyfill({ consentiRete: true });
globalThis.DEMO_MODE = false; // <- esattamente quello che si fa dalla console del browser
override.set('data/fixtures.json', JSON.stringify({})); // nessuna fixture: si forza il tier 2

const { explainer } = await importaModuli();
const t0 = Date.now();
const out = await explainer.getSafeRemediation('step1', 'L1', 'denominator_magnitude');
const ms = Date.now() - t0;

const fallback = explainer.__test__.FALLBACK_TEXT;
const vivo = out.text !== fallback;

console.log(`richieste di rete: ${rete.chiamate} (attesa: 1)`);
console.log(`latenza: ${ms} ms`);
console.log(`origine: ${out.source} | scartato dalla denylist: ${out.wasCleaned}`);
console.log(`testo LLM distinto dal fallback: ${vivo ? 'SI' : 'NO'}`);
console.log(`\n--- testo ricevuto ---\n${out.text}\n`);

const esito = rete.chiamate === 1 && vivo && !out.wasCleaned;
console.log(`TSK-010 test 3 (live slot): ${esito ? 'PASS' : 'FAIL'}`);
console.log('ricorda: rimettere DEMO_MODE = true e aggiornare il contatore budget.');
process.exit(esito ? 0 : 1);
