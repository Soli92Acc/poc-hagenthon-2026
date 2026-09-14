/**
 * content-gate.mjs — gate di qualita' sul contenuto che arriva davanti allo studente
 * (e alla giuria). Complementa TSK-009: la generazione LLM produce testo plausibile,
 * questo verifica che sia anche leggibile, non tecnico e clinicamente pulito.
 *
 * Esegue: node app/tests/content-gate.mjs
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leggi = async (p) => JSON.parse(await readFile(p, 'utf8'));

const MAX_PAROLE_FRASE = 15;
const RANGE_SPIEGAZIONE = [35, 55];
const MAX_HEADLINE = 8;
const MAX_ANALOGIA = 30;

/** Termini tecnici corretti ma fuori registro per un bambino di 9 anni.
 *  Non sono clinici: sono semplicemente il vocabolario sbagliato per questo utente. */
const TERMINI_TECNICI = ['numeratore', 'denominatore', 'frazion', 'equivalent', 'razionale'];

const parole = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const frasi = (s) => s.split(/[.!?:]+/).map((f) => f.trim()).filter(Boolean);

const esiti = [];
const check = (ok, chiave, msg) => esiti.push({ ok, chiave, msg });

const main = async () => {
  const fixtures = await leggi(resolve(APP, 'data/fixtures.json'));
  const denylistRaw = await leggi(resolve(APP, 'data/clinical-denylist.json'));
  const livelli = await leggi(resolve(APP, 'data/pdp-levels.json'));
  const curriculumPath = existsSync(resolve(APP, 'data/curriculum-discalculia.json'))
    ? resolve(APP, 'data/curriculum-discalculia.json')
    : resolve(APP, 'tests/fixtures/curriculum-sample.json');
  const curriculum = await leggi(curriculumPath);

  const denylist = (denylistRaw.terms ?? denylistRaw).map((t) => ({ t, re: new RegExp(`\\b${t}`, 'i') }));

  for (const [chiave, v] of Object.entries(fixtures)) {
    const testo = [v.headline, v.spiegazione, v.analogia].filter(Boolean).join(' ');
    const livello = chiave.split('-')[1];

    const clinico = denylist.find((d) => d.re.test(testo));
    check(!clinico, chiave, clinico ? `termine clinico: "${clinico.t}"` : 'denylist pulita');

    const tecnico = TERMINI_TECNICI.find((t) => new RegExp(t, 'i').test(testo));
    check(!tecnico, chiave, tecnico ? `termine tecnico fuori registro: "${tecnico}"` : 'registro adatto');

    const n = parole(v.spiegazione);
    check(n >= RANGE_SPIEGAZIONE[0] && n <= RANGE_SPIEGAZIONE[1], chiave, `spiegazione ${n} parole`);

    const lunga = frasi(v.spiegazione).find((f) => parole(f) > MAX_PAROLE_FRASE);
    check(!lunga, chiave, lunga ? `frase da ${parole(lunga)} parole: "${lunga.slice(0, 45)}..."` : 'frasi brevi');

    check(parole(v.headline) <= MAX_HEADLINE, chiave, `headline ${parole(v.headline)} parole`);
    check(!v.analogia || parole(v.analogia) <= MAX_ANALOGIA, chiave, `analogia ${parole(v.analogia || '')} parole`);

    // L1 lavora su una quantita' discreta (fette), L2 su una lineare (metro/striscia):
    // e' la differenza pedagogica fra i due livelli, deve vedersi nel testo.
    if (livello === 'L1') check(/pizza|fett/i.test(testo), chiave, 'immagine discreta (pizza/fette)');
    if (livello === 'L2') check(/metro|striscia|pezz/i.test(testo), chiave, 'immagine lineare (metro/striscia)');
  }

  // Copertura: nessuna chiave raggiungibile a runtime deve mancare.
  const mancanti = [];
  for (const [level, policy] of Object.entries(livelli)) {
    if (level === 'L3') continue;
    for (const step of curriculum.steps.filter((s) => policy.includes_levels.includes(s.level))) {
      for (const slug of new Set(step.items[0].distractors.map((d) => d.misconcepto_slug).filter(Boolean))) {
        const k = `${step.step_id}-${level}-${slug}`;
        if (!fixtures[k]) mancanti.push(k);
      }
    }
  }
  check(mancanti.length === 0, 'COPERTURA', mancanti.length ? `mancano: ${mancanti.join(', ')}` : 'tutte le chiavi raggiungibili sono coperte');
  check(Object.keys(fixtures).length >= 6, 'GATE D3', `${Object.keys(fixtures).length} chiavi (soglia 6)`);

  const ko = esiti.filter((e) => !e.ok);
  for (const e of ko) console.log(`  FAIL  ${e.chiave} — ${e.msg}`);
  console.log(`\n${esiti.length - ko.length}/${esiti.length} check PASS su ${Object.keys(fixtures).length} fixture`);
  process.exit(ko.length ? 1 : 0);
};

main();
