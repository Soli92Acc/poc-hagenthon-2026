/**
 * gen-fixtures.mjs — generazione batch delle fixture di remediation (TSK-009).
 *
 * Disciplina di budget: un solo passaggio sequenziale, NESSUN retry automatico,
 * nessuna rigenerazione di chiavi gia' presenti. Ogni chiave costa esattamente
 * una richiesta e il totale viene stampato a fine corsa.
 *
 * Le chiavi non sono una lista scritta a mano: si derivano dal curriculum e dalle
 * policy di livello, cosi' si generano tutte e sole le chiavi raggiungibili a runtime.
 *
 * Uso:  node app/tools/gen-fixtures.mjs [--dry-run] [--force]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRemediationMessages } from '../remediation-prompt.js';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PATH_FIXTURES = resolve(APP, 'data/fixtures.json');
const PATH_LEVELS = resolve(APP, 'data/pdp-levels.json');
const PATH_DENYLIST = resolve(APP, 'data/clinical-denylist.json');
const PATH_CURRICULUM_PROD = resolve(APP, 'data/curriculum-discalculia.json');
const PATH_CURRICULUM_REF = resolve(APP, 'tests/fixtures/curriculum-sample.json');

const PROXY = 'http://localhost:8080/complete';
const MODELLO = 'nex-agi/nex-n2.5-mini:free';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const leggi = async (p) => JSON.parse(await readFile(p, 'utf8'));

async function chiama(messages) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELLO,
      reasoning: { enabled: false },
      max_tokens: 500,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);
  const content = data?.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(content);
  } catch {
    // json_object non rispettato: estrazione manuale, come da fallback previsto in TSK-001
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('risposta non parsabile');
    return JSON.parse(m[0]);
  }
}

const main = async () => {
  const curriculumPath = existsSync(PATH_CURRICULUM_PROD) ? PATH_CURRICULUM_PROD : PATH_CURRICULUM_REF;
  const [curriculum, livelli, denylistRaw, fixtures] = await Promise.all([
    leggi(curriculumPath), leggi(PATH_LEVELS), leggi(PATH_DENYLIST), leggi(PATH_FIXTURES),
  ]);
  console.log(`curriculum: ${curriculumPath.replace(APP + '/', '')}`);

  const denylist = (denylistRaw.terms ?? denylistRaw).map((t) => ({ t, re: new RegExp(`\\b${t}`, 'i') }));

  // Chiavi raggiungibili = per ogni livello, gli step che quel livello vede,
  // per ogni misconcetto presente in quello step.
  const chiavi = [];
  for (const [level, policy] of Object.entries(livelli)) {
    if (level === 'L3') continue; // L3 non ha scaffold ne' remediation visiva: fuori MVP
    for (const step of curriculum.steps.filter((s) => policy.includes_levels.includes(s.level))) {
      const slugs = [...new Set((step.items[0].distractors || [])
        .map((d) => d.misconcepto_slug).filter(Boolean))];
      for (const slug of slugs) chiavi.push({ key: `${step.step_id}-${level}-${slug}`, step, level, slug });
    }
  }

  const daFare = chiavi.filter((c) => force || !fixtures[c.key]);
  console.log(`chiavi raggiungibili: ${chiavi.length} | gia' presenti: ${chiavi.length - daFare.length} | da generare: ${daFare.length}\n`);
  if (dryRun) { daFare.forEach((c) => console.log('  -', c.key)); return; }

  let req = 0, ok = 0;
  for (const c of daFare) {
    req += 1;
    process.stdout.write(`[req ${req}] ${c.key} ... `);
    try {
      const item = c.step.items[0];
      const out = await chiama(buildRemediationMessages({
        fraction_a: item.fraction_a, fraction_b: item.fraction_b,
        level: c.level, slug: c.slug, transfer: c.step.scaffold === false,
      }));
      const testo = [out.headline, out.spiegazione, out.analogia].filter(Boolean).join(' ');
      const colpito = denylist.find((d) => d.re.test(testo));
      if (colpito) { console.log(`SCARTATA (termine bloccato: "${colpito.t}")`); continue; }
      if (!out.headline || !out.spiegazione) { console.log('SCARTATA (campi mancanti)'); continue; }
      fixtures[c.key] = { headline: out.headline, spiegazione: out.spiegazione, analogia: out.analogia ?? '' };
      ok += 1;
      console.log(`ok (${out.spiegazione.split(/\s+/).length} parole)`);
    } catch (e) {
      console.log(`FALLITA (${e.message}) — nessun retry, come da disciplina di budget`);
    }
  }

  await writeFile(PATH_FIXTURES, JSON.stringify(fixtures, null, 2) + '\n', 'utf8');
  const totali = Object.keys(fixtures).length;
  console.log(`\nrichieste consumate: ${req} | fixture scritte: ${ok} | chiavi totali nel file: ${totali}`);
  console.log(`gate D3 (>= 6 chiavi): ${totali >= 6 ? 'PASS' : 'FAIL'}`);
  const copertura = chiavi.filter((c) => fixtures[c.key]).length;
  console.log(`copertura chiavi raggiungibili: ${copertura}/${chiavi.length}`);
};

main().catch((e) => { console.error('errore:', e.message); process.exit(1); });
