/**
 * browser-e2e.mjs — verifiche di TSK-010 e TSK-021 che richiedono un browser vero.
 *
 * Prerequisito: proxy attivo (python3 app/proxy.py).
 * Esegue: npx playwright test non serve — basta  node app/tests/browser-e2e.mjs
 */
// Playwright non e' una dipendenza del progetto (niente package.json in un PoC da 4h):
// si risolve dove si trova. Con PLAYWRIGHT=<path> si forza una copia specifica.
async function caricaChromium() {
  const candidati = [process.env.PLAYWRIGHT, 'playwright'].filter(Boolean);
  const { execSync } = await import('node:child_process');
  try {
    const trovati = execSync(
      "find \"$HOME/.npm/_npx\" \"$HOME/Documents\" -maxdepth 6 -type d -name playwright -path '*/node_modules/*' 2>/dev/null | head -5",
      { shell: '/bin/bash', encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean);
    candidati.push(...trovati.map((d) => `${d}/index.js`));
  } catch { /* la ricerca e' opzionale */ }

  for (const c of candidati) {
    try {
      const m = await import(c.startsWith('/') ? `file://${c}` : c);
      return m.chromium ?? m.default?.chromium;
    } catch { /* prossimo candidato */ }
  }
  console.log('  SKIP  playwright non disponibile: verifiche browser da eseguire a mano');
  process.exit(0);
}

const chromium = await caricaChromium();

const BASE = 'http://localhost:8080';
let esito = 0;
const ok = (m) => console.log(`  PASS  ${m}`);
const ko = (m) => { console.log(`  FAIL  ${m}`); esito = 1; };

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const erroriJS = [];
page.on('pageerror', (e) => erroriJS.push(e.message));

/** Conta le richieste verso l'esterno (tutto cio' che non e' un file statico locale). */
let reqRete = 0;
page.on('request', (r) => {
  const u = r.url();
  if (u.includes('/complete') || (!u.startsWith(BASE) && !u.startsWith('data:'))) reqRete += 1;
});

const vaiA = async (ruolo) => {
  await page.goto(`${BASE}/index.html?role=${ruolo}`);
  await page.waitForLoadState('networkidle');
};

const impostaLivello = async (livello) => {
  await vaiA('teacher');
  await page.selectOption('#pdp-level-select', livello);
  await page.click('#btn-confirm-pdp');
  await page.waitForLoadState('networkidle');
};

console.log('=== TSK-013/TSK-012 — configurazione PDP e routing ===');
await impostaLivello('L1');
const url = page.url();
url.includes('role=student') ? ok('dopo la conferma del PDP si arriva alla view studente')
                             : ko(`redirect inatteso: ${url}`);
const domanda = await page.textContent('#question-text').catch(() => null);
domanda ? ok(`primo esercizio renderizzato: "${domanda.trim().slice(0, 40)}..."`)
        : ko('nessuna domanda renderizzata');

console.log('\n=== TSK-010 test 1 — flusso L1 errore, zero rete durante la remediation ===');
reqRete = 0;
const distrattori = await page.$$eval('.option-btn', (bs) => bs.map((b) => ({ id: b.dataset.distractorId, t: b.textContent.trim() })));
const sbagliato = distrattori.find((d) => /4/.test(d.t) && !/^1\/3/.test(d.t)) ?? distrattori[1];
const t0 = Date.now();
await page.click(`[data-distractor-id="${sbagliato.id}"]`);
await page.click('#btn-submit');
await page.waitForFunction(() => document.getElementById('feedback-region')?.textContent.trim().length > 30, null, { timeout: 3000 }).catch(() => {});
const ms = Date.now() - t0;
const feedback = (await page.textContent('#feedback-region')).trim();
feedback.length > 30 && ms < 2000 ? ok(`feedback in ${ms} ms (soglia 2000)`) : ko(`feedback lento o assente (${ms} ms)`);
reqRete === 0 ? ok('zero richieste di rete durante la remediation') : ko(`${reqRete} richieste di rete`);
/pizza|fett/i.test(feedback) ? ok('testo dalla fixture L1 (immagine discreta), non il fallback generico')
                             : ko(`testo inatteso: "${feedback.slice(0, 70)}"`);

console.log('\n=== TSK-020/TSK-014 — scaffold dopo il primo errore (policy L1) ===');
const nl = await page.$('.number-line, #number-line, [data-number-line]');
const nlVisibile = nl ? await nl.isVisible() : false;
nlVisibile ? ok('number line comparsa dopo 1 errore') : ko('number line assente dopo 1 errore (policy L1 = 1)');

console.log('\n=== TSK-021 verifica 4 — stop a 3 tentativi ===');
// Servono tre errori CONSECUTIVI: una risposta giusta azzera il contatore,
// quindi si scelgono solo distrattori errati (letti dal curriculum, non indovinati).
const sbagliatiIds = await page.evaluate(async () => {
  const c = await (await fetch('data/curriculum-discalculia.json')).json();
  return c.steps[0].items[0].distractors.filter((d) => !d.correct).map((d) => d.id);
});
for (let i = 0; i < 2; i += 1) {
  const scelto = sbagliatiIds[(i + 1) % sbagliatiIds.length];
  await page.click(`[data-distractor-id="${scelto}"]`);
  await page.click('#btn-submit');
  await page.waitForTimeout(500);
}
const stop = await page.textContent('body');
/insegnante o il tuo tutor/.test(stop) ? ok('messaggio di stop mostrato dopo 3 errori') : ko('messaggio di stop assente');
const submitPresente = await page.$('#btn-submit');
const submitVisibile = submitPresente ? await submitPresente.isVisible() : false;
!submitVisibile ? ok('pulsante submit rimosso o nascosto dopo lo stop') : ko('il pulsante submit e ancora cliccabile dopo lo stop');

console.log('\n=== TSK-010 test 2 — flusso L2 nominale fino al report ===');
await ctx.clearCookies();
await page.evaluate(() => localStorage.clear());
await impostaLivello('L2');
let passi = 0;
for (let i = 0; i < 6; i += 1) {
  const corretto = await page.evaluate(() => {
    const e = window.__engine;
    const item = e?.getCurrentItem?.();
    return item?.distractors.find((d) => d.correct)?.id ?? null;
  });
  const id = corretto ?? (await page.$$eval('.option-btn', (bs) => bs[0]?.dataset.distractorId));
  if (!id) break;
  await page.click(`[data-distractor-id="${id}"]`).catch(() => {});
  await page.click('#btn-submit').catch(() => {});
  await page.waitForTimeout(350);
  passi += 1;
  const avanti = await page.$('#feedback-region button');
  if (avanti) { await avanti.click(); await page.waitForTimeout(350); }
  if (/Sessione completata/.test(await page.textContent('body'))) break;
}
/Sessione completata/.test(await page.textContent('body'))
  ? ok(`sessione L2 completata in ${passi} risposte, nessun vicolo cieco`)
  : ko('la sessione L2 non raggiunge la schermata di completamento');

console.log('\n=== TSK-017/TSK-016 — report docente popolato ===');
await vaiA('teacher');
const report = await page.textContent('body');
/Esercizio 1|Esercizio 2|Esercizio di verifica/.test(report)
  ? ok('il report elenca gli esercizi affrontati') : ko('report privo di dati per esercizio');
/[Tt]ransfer/.test(report) ? ok('esito del transfer presente nel report') : ko('esito del transfer assente');
!/\d+\s*%/.test(report) ? ok('nessun punteggio percentuale nel report') : ko('il report mostra una percentuale');

console.log('\n=== TSK-021 verifica 5 — footer Legge 170/2010 su tutte le view ===');
for (const ruolo of ['student', 'teacher', 'parent']) {
  await vaiA(ruolo);
  const f = await page.$('text=/170\\/2010/');
  const visibile = f ? await f.isVisible() : false;
  visibile ? ok(`footer visibile su ?role=${ruolo}`) : ko(`footer assente o nascosto su ?role=${ruolo}`);
}

console.log('\n=== Errori JavaScript durante tutto il percorso ===');
erroriJS.length === 0 ? ok('nessuna eccezione JS in console') : ko(`${erroriJS.length} eccezioni: ${erroriJS.slice(0, 3).join(' | ')}`);

await browser.close();
console.log(`\nBROWSER E2E: ${esito ? 'FAIL' : 'PASS'}`);
process.exit(esito);
