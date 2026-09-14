/**
 * static-copy-gate.mjs — la denylist clinica applicata ai testi statici.
 *
 * Il presidio di US-011 copre la catena getSafeRemediation, cioe' il testo adattivo.
 * Ma il lettore vede anche la copy della UI, la scheda per i genitori e le etichette
 * dei misconcetti, che quella catena non attraversano mai.
 *
 * ECCEZIONE DELIBERATA: il footer Legge 170/2010. Quel paragrafo *deve* nominare
 * diagnosi, discalculia e valutazione clinica — e' l'enunciato che traccia il confine,
 * non una sua violazione. Viene escluso dalla scansione, e il check verifica invece
 * che esista e che sia completo.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let esito = 0;
const ok = (m) => console.log(`  PASS  ${m}`);
const ko = (m) => { console.log(`  FAIL  ${m}`); esito = 1; };

const denylistRaw = JSON.parse(await readFile(resolve(APP, 'data/clinical-denylist.json'), 'utf8'));
const termini = (denylistRaw.terms ?? denylistRaw).map((t) => ({ t, re: new RegExp(`\\b${t}`, 'i') }));

const sorgenti = ['index.html', 'data/parent-language.json', 'data/misconceptions.json'];

for (const nome of sorgenti) {
  const p = resolve(APP, nome);
  if (!existsSync(p)) { console.log(`  SKIP  ${nome} assente`); continue; }
  let testo = await readFile(p, 'utf8');
  if (nome === 'index.html') testo = testo.replace(/<footer[\s\S]*?<\/footer>/gi, '');

  const colpiti = termini.filter((d) => d.re.test(testo)).map((d) => d.t);
  colpiti.length === 0
    ? ok(`${nome}: nessun termine clinico`)
    : ko(`${nome}: termini clinici fuori dal footer — ${colpiti.join(', ')}`);
}

// Il footer non va solo "presente": va completo. E' il presidio legale della demo.
const html = await readFile(resolve(APP, 'index.html'), 'utf8');
const footer = html.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? '';
const attesi = ['170/2010', 'compensativo', 'Non sostituisce'];
const mancanti = attesi.filter((a) => !footer.includes(a));
mancanti.length === 0
  ? ok('footer Legge 170/2010 completo (strumento compensativo + non sostituisce)')
  : ko(`footer incompleto, mancano: ${mancanti.join(', ')}`);

console.log(`\nGATE COPY STATICA: ${esito ? 'FAIL' : 'PASS'}`);
process.exit(esito);
