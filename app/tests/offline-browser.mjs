/**
 * offline-browser.mjs — TSK-011 eseguito da un browser vero.
 *
 * Riproduce i tre scenari del dry run in tre gradi di severita' crescente, cosi'
 * non si scopre alle 4:30 quale dei tre rompe:
 *
 *   Fase 1 — wifi staccato, proxy locale ancora vivo (lo scenario reale: il
 *            loopback non passa dal wifi). Le richieste esterne vengono abortite.
 *   Fase 2 — stesso scenario con DEMO_MODE=false: il live slot deve degradare al
 *            Tier 3 entro 3 secondi, senza spinner bloccato.
 *   Fase 3 — offline totale a sessione avviata, proxy compreso: anche il caso in
 *            cui qualcuno chiude il terminale non deve produrre crash.
 *
 * Prerequisito: proxy attivo (python3 app/proxy.py).
 * Esegue: node app/tests/offline-browser.mjs
 */
import { caricaChromium, esci } from './_playwright.mjs';

const BASE = 'http://localhost:8080';
const chromium = await caricaChromium();
esci(chromium, 'offline-browser');

let stato = 0;
const ok = (m) => console.log(`  PASS  ${m}`);
const ko = (m) => { console.log(`  FAIL  ${m}`); stato = 1; };

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const erroriJS = [];
page.on('pageerror', (e) => erroriJS.push(e.message));
const erroriConsole = [];
page.on('console', (m) => { if (m.type() === 'error') erroriConsole.push(m.text()); });

/** Aborta tutto cio' che non e' il proxy locale: e' il wifi staccato. */
let esterneBloccate = 0;
await ctx.route('**/*', (route) => {
  const u = route.request().url();
  if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  esterneBloccate += 1;
  return route.abort('internetdisconnected');
});

const sbagliatiDi = (page, idx) => page.evaluate(async (i) => {
  const c = await (await fetch('data/curriculum-discalculia.json')).json();
  return c.steps[i].items[0].distractors.filter((d) => !d.correct).map((d) => d.id);
}, idx);

console.log('=== Fase 1 — wifi staccato, flusso L1 completo fino al report ===');

await page.goto(`${BASE}/index.html?role=teacher`);
await page.waitForLoadState('networkidle');
await page.selectOption('#pdp-level-select', 'L1');
await page.click('#btn-confirm-pdp');
await page.waitForLoadState('networkidle');
ok('sessione configurata con la rete esterna irraggiungibile');

const sbagliati = await sbagliatiDi(page, 0);
const t0 = Date.now();
await page.click(`[data-distractor-id="${sbagliati[0]}"]`);
await page.click('#btn-submit');
await page.waitForFunction(() => document.getElementById('feedback-region')?.textContent.trim().length > 30, null, { timeout: 3000 }).catch(() => {});
const msRem = Date.now() - t0;
const feedback = (await page.textContent('#feedback-region')).trim();
feedback.length > 30 && msRem < 2000 ? ok(`remediation dalle fixture in ${msRem} ms`) : ko(`remediation assente o lenta (${msRem} ms)`);
/pizza|fett/i.test(feedback) ? ok('e la fixture L1, non il fallback generico') : ko(`testo inatteso: "${feedback.slice(0, 60)}"`);

// riprova, avanza, transfer, report
const item0 = await page.evaluate(async () => {
  const c = await (await fetch('data/curriculum-discalculia.json')).json();
  return c.steps[0].items[0].distractors.find((d) => d.correct).id;
});
await page.click(`[data-distractor-id="${item0}"]`);
await page.click('#btn-submit');
await page.waitForTimeout(400);
const avanti = await page.$('#feedback-region button');
if (avanti) { await avanti.click(); await page.waitForTimeout(400); }
const titolo = await page.textContent('#question-text').catch(() => '');
/Prova questa/.test(titolo) ? ok('si arriva al transfer item ("Prova questa!")') : ko(`step inatteso dopo l avanzamento: "${titolo}"`);

const nlPresente = await page.$('.number-line');
const nlVisibile = nlPresente ? await nlPresente.isVisible() : false;
!nlVisibile ? ok('sul transfer la number line non compare') : ko('la number line e visibile sul transfer');

const corrTransfer = await page.evaluate(async () => {
  const c = await (await fetch('data/curriculum-discalculia.json')).json();
  const s = c.steps.find((x) => x.scaffold === false);
  return s.items[0].distractors.find((d) => d.correct).id;
});
await page.click(`[data-distractor-id="${corrTransfer}"]`);
await page.click('#btn-submit');
await page.waitForTimeout(400);
const fine = await page.$('#feedback-region button');
if (fine) { await fine.click(); await page.waitForTimeout(400); }
/Sessione completata/.test(await page.textContent('body')) ? ok('sessione conclusa senza rete') : ko('la sessione non si chiude');

await page.goto(`${BASE}/index.html?role=teacher`);
await page.waitForLoadState('networkidle');
const report = await page.textContent('body');
/Esercizio 1|Esercizio di verifica/.test(report) ? ok('report docente popolato senza rete') : ko('report vuoto');
/Transfer completato autonomamente/.test(report) ? ok('esito transfer registrato correttamente') : ko('esito transfer errato o assente');

console.log('\n=== Fase 2 — DEMO_MODE=false con la rete giu: degrado al Tier 3 ===');
{
  // Il proxy gira FUORI dal browser e la sua internet e' viva: se lasciassimo
  // passare /complete faremmo una chiamata vera a OpenRouter e bruceremmo budget.
  // Abortirla e' anche cio' che accade davvero a wifi staccato: il proxy c'e',
  // ma il suo upstream no.
  let tentativiLiveSlot = 0;
  await ctx.route('**/complete', (route) => { tentativiLiveSlot += 1; return route.abort('internetdisconnected'); });

  await page.goto(`${BASE}/index.html?role=student`);
  await page.waitForLoadState('networkidle');

  // Si interroga l'explainer con una chiave che NON esiste nelle fixture: e' l'unico
  // modo di raggiungere il tier 2. Svuotare window.fixtures non basta, e' solo uno
  // specchio per DevTools: la cache vera e' interna al modulo.
  const esito = await page.evaluate(async () => {
    const m = await import('./explainer.js');
    window.DEMO_MODE = false;
    const t = performance.now();
    const out = await m.getSafeRemediation('step_inesistente', 'L1', 'chiave_inesistente');
    return { ms: Math.round(performance.now() - t), text: out.text, source: out.source };
  });

  tentativiLiveSlot > 0
    ? ok(`il live slot e stato davvero tentato (${tentativiLiveSlot} richiesta a /complete, abortita)`)
    : ko('il live slot non e stato tentato: il test non ha esercitato il tier 2');
  esito.ms < 3500 ? ok(`fallback Tier 3 in ${esito.ms} ms (soglia 3000 + margine)`) : ko(`degrado troppo lento: ${esito.ms} ms`);
  esito.source === 'fallback' ? ok('origine dichiarata: fallback, come atteso') : ko(`origine inattesa: ${esito.source}`);
  esito.text.length > 30 ? ok('un testo c e sempre: l utente non resta davanti al vuoto') : ko('nessun testo mostrato');

  await ctx.unroute('**/complete');
}

console.log('\n=== Fase 3 — offline totale a sessione avviata, proxy compreso ===');
{
  await ctx.setOffline(true);
  const t = Date.now();
  const sb = await sbagliatiDi(page, 0).catch(() => null);
  // il curriculum non e' piu' leggibile: si verifica solo che la UI non si pianti
  const cliccabile = await page.$('.option-btn');
  if (cliccabile) {
    await cliccabile.click().catch(() => {});
    await page.click('#btn-submit').catch(() => {});
    await page.waitForTimeout(1200);
  }
  const ms = Date.now() - t;
  const vivo = await page.evaluate(() => document.body.textContent.trim().length > 50);
  vivo ? ok(`la pagina resta usabile con tutto offline (${ms} ms, nessun blocco)`) : ko('pagina vuota o bloccata');
  void sb;
  await ctx.setOffline(false);
}

console.log('\n=== Errori JavaScript durante i tre scenari ===');
erroriJS.length === 0 ? ok('nessuna eccezione non gestita') : ko(`${erroriJS.length} eccezioni: ${erroriJS.slice(0, 3).join(' | ')}`);
// gli errori di rete in console sono attesi e non visibili all'utente: si riportano soltanto
const netErr = erroriConsole.filter((e) => /Failed to fetch|ERR_INTERNET|net::/i.test(e)).length;
console.log(`  nota  ${netErr} errori di rete in console (attesi offline, non visibili all utente)`);

await browser.close();
console.log(`\nOFFLINE BROWSER (TSK-011): ${stato ? 'FAIL' : 'PASS'}`);
process.exit(stato);
