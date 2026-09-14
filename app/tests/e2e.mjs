/**
 * e2e.mjs — suite E2E headless dei moduli di P-A (TSK-010 + TSK-021, parte automatizzabile).
 * Esegue: node app/tests/e2e.mjs
 *
 * Copre i flussi che non richiedono la UI di P-B. Le verifiche visive (footer su
 * tutte le view, focus, contrasto) restano manuali e stanno in TSK-021.
 */
import { installaPolyfill, importaModuli, override, rete, test, assert, assertEq, riepilogo } from './harness.mjs';

const SLUG_DEN = 'denominator_magnitude';

async function sessione(livello, { consentiRete = false } = {}) {
  installaPolyfill({ consentiRete });
  const m = await importaModuli();
  m.router.setPdpLevel(livello);
  await m.engine.QuizEngine.startSession();
  return m;
}

/** Gli step del livello, nell'ordine in cui vengono affrontati. */
const idsDi = (m) => m.engine.QuizEngine.steps.map((s) => s.step_id);

/**
 * Porta l'engine sullo step di transfer rispondendo correttamente ai precedenti.
 * Derivato dal curriculum e non dal numero di step: aggiungere un esercizio al
 * JSON non deve rompere i test, altrimenti l'extension point EP-1 e' una favola.
 */
function vaiAlTransfer(m) {
  const E = m.engine.QuizEngine;
  let guardia = 0;
  while (!E.isTransferStep()) {
    E.submit('d1');
    if (E.nextStep() === 'COMPLETION') throw new Error('nessuno step di transfer nel curriculum');
    if ((guardia += 1) > 50) throw new Error('avanzamento senza fine');
  }
  return E;
}

console.log('\n=== TSK-004 — gate pdpLevel ===');

await test('startSession fallisce forte se pdpLevel non e configurato', async () => {
  installaPolyfill();
  const { engine } = await importaModuli();
  let lanciato = null;
  try { await engine.QuizEngine.startSession(); } catch (e) { lanciato = e; }
  assert(lanciato, 'doveva lanciare');
  assert(/pdpLevel non configurato/.test(lanciato.message), `messaggio inatteso: ${lanciato?.message}`);
});

await test('con pdpLevel impostato la sessione parte', async () => {
  const { engine } = await sessione('L1');
  assertEq(engine.QuizEngine.getState(), 'STEP', 'stato iniziale');
  assert(engine.QuizEngine.getCurrentStep(), 'nessuno step caricato');
});

await test('L1 e contenuto in L2, e il transfer chiude entrambi i percorsi', async () => {
  const a = await sessione('L1');
  const b = await sessione('L2');
  const l1 = idsDi(a);
  const l2 = idsDi(b);
  assert(l1.length >= 2, `L1 deve avere almeno un training e il transfer, ha ${l1.length}`);
  assert(l1.every((id) => l2.includes(id)), `L1 non e contenuto in L2: ${l1} contro ${l2}`);
  assert(l2.length > l1.length, 'L2 deve vedere piu step di L1');
  // L3 vede anche gli item propri del livello: la verifica deve restare in fondo
  // anche li', altrimenti la sessione non si chiude sul transfer.
  const c = await sessione('L3');
  for (const [nome, m] of [['L1', a], ['L2', b], ['L3', c]]) {
    const steps = m.engine.QuizEngine.steps;
    const transfer = steps.filter((s) => s.scaffold === false);
    assertEq(transfer.length, 1, `${nome}: un solo step di transfer`);
    assertEq(steps[steps.length - 1].step_id, transfer[0].step_id, `${nome}: il transfer e l ultimo step`);
  }
});

await test('getScaffoldPolicy espone la soglia per livello', async () => {
  const a = await sessione('L1');
  assertEq(a.engine.QuizEngine.getScaffoldPolicy().show_number_line_after_errors, 1, 'soglia L1');
  const b = await sessione('L2');
  assertEq(b.engine.QuizEngine.getScaffoldPolicy().show_number_line_after_errors, 2, 'soglia L2');
});

console.log('\n=== TSK-003 — state machine ===');

await test('risposta corretta porta a NEXT senza remediation', async () => {
  const { engine } = await sessione('L2');
  const r = engine.QuizEngine.submit('d1');
  assertEq(r.correct, true, 'correttezza');
  assertEq(r.state, 'NEXT', 'stato');
  assertEq(r.misconcepto_slug, null, 'nessun misconcetto su risposta giusta');
});

await test('L2 nominale: risposta giusta sul primo step e si avanza al secondo (test 2 di TSK-010)', async () => {
  const m = await sessione('L2');
  const [primo, secondo] = idsDi(m);
  const E = m.engine.QuizEngine;
  assertEq(E.getCurrentStep().step_id, primo, 'step di partenza');
  E.submit('d1');
  assertEq(E.nextStep(), 'STEP', 'stato dopo nextStep');
  assertEq(E.getCurrentStep().step_id, secondo, 'step raggiunto');
});

await test('risposta errata porta a REMEDIATION e riporta il misconcetto', async () => {
  const { engine } = await sessione('L1');
  const r = engine.QuizEngine.submit('d2');
  assertEq(r.correct, false, 'correttezza');
  assertEq(r.state, 'REMEDIATION', 'stato');
  assertEq(r.misconcepto_slug, SLUG_DEN, 'slug');
});

await test('3 errori consecutivi portano a STOPPED, non a REMEDIATION', async () => {
  const { engine } = await sessione('L1');
  assertEq(engine.QuizEngine.submit('d2').state, 'REMEDIATION', 'primo errore');
  assertEq(engine.QuizEngine.submit('d3').state, 'REMEDIATION', 'secondo errore');
  assertEq(engine.QuizEngine.submit('d2').state, 'STOPPED', 'terzo errore');
  assert(/insegnante o il tuo tutor/.test(engine.QuizEngine.getStopMessage()), 'messaggio di stop');
});

await test('da STOPPED non si avanza', async () => {
  const { engine } = await sessione('L1');
  engine.QuizEngine.submit('d2'); engine.QuizEngine.submit('d2'); engine.QuizEngine.submit('d2');
  assertEq(engine.QuizEngine.nextStep(), 'STOPPED', 'nextStep bloccato');
});

await test('una risposta giusta azzera il contatore errori', async () => {
  const { engine } = await sessione('L1');
  engine.QuizEngine.submit('d2');
  engine.QuizEngine.submit('d3');
  assertEq(engine.QuizEngine.submit('d1').state, 'NEXT', 'recupero');
  assertEq(engine.QuizEngine.consecutiveErrors, 0, 'contatore azzerato');
});

await test('esaurendo gli step si arriva a COMPLETION', async () => {
  const { engine } = await sessione('L1');
  const n = engine.QuizEngine.steps.length;
  for (let i = 0; i < n - 1; i += 1) {
    engine.QuizEngine.submit('d1');
    assertEq(engine.QuizEngine.nextStep(), 'STEP', `avanzamento allo step ${i + 2} di ${n}`);
  }
  engine.QuizEngine.submit('d1');
  assertEq(engine.QuizEngine.nextStep(), 'COMPLETION', `fine sessione dopo ${n} step`);
});

console.log('\n=== TSK-014 — scaffold-fading e transfer ===');

await test('L1: lo scaffold compare dal primo errore', async () => {
  const { engine } = await sessione('L1');
  assertEq(engine.QuizEngine.getScaffoldVisible(), false, 'prima di sbagliare');
  engine.QuizEngine.submit('d2');
  assertEq(engine.QuizEngine.getScaffoldVisible(), true, 'dopo 1 errore');
});

await test('L2: lo scaffold compare solo dal secondo errore', async () => {
  const { engine } = await sessione('L2');
  assertEq(engine.QuizEngine.getScaffoldVisible(), false, 'con 0 errori');
  engine.QuizEngine.submit('d2');
  assertEq(engine.QuizEngine.getScaffoldVisible(), false, 'con 1 errore');
  engine.QuizEngine.submit('d3');
  assertEq(engine.QuizEngine.getScaffoldVisible(), true, 'con 2 errori');
});

await test('sul transfer lo scaffold non compare mai', async () => {
  const E = vaiAlTransfer(await sessione('L1'));
  assertEq(E.isTransferStep(), true, 'step di transfer');
  E.submit('d2');
  assertEq(E.getScaffoldVisible(), false, 'anche dopo un errore');
});

await test('transfer risolto: solvedWithoutScaffold = true', async () => {
  vaiAlTransfer(await sessione('L1')).submit('d1');
  assertEq(globalThis.localStorage.getItem('solvedWithoutScaffold'), 'true', 'esito');
});

await test('transfer sbagliato: solvedWithoutScaffold = false', async () => {
  vaiAlTransfer(await sessione('L1')).submit('d2');
  assertEq(globalThis.localStorage.getItem('solvedWithoutScaffold'), 'false', 'esito');
});

console.log('\n=== TSK-008 — explainer, fallback chain, confine clinico ===');

await test('D2: resolveRemediation risolve la chiave composta dalle fixtures', async () => {
  const { explainer } = await sessione('L1');
  const t = await explainer.resolveRemediation('step1', 'L1', SLUG_DEN);
  assert(t && t.length > 20, 'testo vuoto o troppo corto');
  assert(/pizza/i.test(t), `non sembra la fixture attesa: ${t.slice(0, 60)}`);
});

await test('flusso L1 errore: remediation dalle fixtures con ZERO richieste di rete', async () => {
  const { engine, explainer } = await sessione('L1');
  const r = engine.QuizEngine.submit('d2');
  const { step_id, level, slug } = engine.QuizEngine.getRemediationKeyParts();
  assertEq([step_id, level, slug], ['step1', 'L1', SLUG_DEN], 'parti della chiave');
  const out = await explainer.getSafeRemediation(step_id, level, slug);
  assertEq(out.source, 'fixture', 'origine del testo');
  assertEq(out.wasCleaned, false, 'non doveva essere scartato');
  assertEq(rete.chiamate, 0, 'richieste di rete durante la remediation');
  assertEq(r.state, 'REMEDIATION', 'stato');
});

await test('chiave assente in DEMO_MODE: fallback immediato, zero rete', async () => {
  const { explainer } = await sessione('L1');
  const out = await explainer.getSafeRemediation('step9', 'L1', 'chiave_inesistente');
  assertEq(out.source, 'fallback', 'origine');
  assertEq(rete.chiamate, 0, 'nessuna chiamata in DEMO_MODE');
});

await test('degrado di livello: se manca la chiave L2 si riusa quella L1 dello stesso misconcetto', async () => {
  installaPolyfill();
  // Solo la chiave L1 e' presente: la richiesta L2 deve ricadere su di essa
  // invece di scendere al fallback generico, che direbbe molto meno.
  override.set('data/fixtures.json', JSON.stringify({
    [`step1-L1-${SLUG_DEN}`]: { headline: 'H', spiegazione: 'Testo della fixture L1.', analogia: '' },
  }));
  const { explainer } = await importaModuli();
  const out = await explainer.getSafeRemediation('step1', 'L2', SLUG_DEN);
  assertEq(out.wasCleaned, false, 'non scartato');
  assertEq(out.source, 'fixture', 'doveva restare su una fixture, non sul fallback');
  assert(/fixture L1/.test(out.text), `doveva riusare la fixture L1, ottenuto: ${out.text.slice(0, 40)}`);
  assertEq(rete.chiamate, 0, 'nessuna rete');
});

await test('ogni chiave raggiungibile risolve dalla propria fixture, senza degrado', async () => {
  const { engine, explainer } = await sessione('L2');
  const out = await explainer.getSafeRemediation('step1', 'L2', SLUG_DEN);
  assertEq(out.source, 'fixture', 'origine');
  assert(/metro|striscia|pezz/i.test(out.text), 'L2 deve usare l immagine lineare, non la pizza');
  const outL1 = await explainer.getSafeRemediation('step1', 'L1', SLUG_DEN);
  assert(/pizza|fett/i.test(outL1.text), 'L1 deve usare l immagine discreta');
  assert(out.text !== outL1.text, 'L1 e L2 devono avere testi diversi');
  assert(engine.QuizEngine.getState(), 'engine vivo');
});

await test('INJECTION: un termine clinico nelle fixtures non raggiunge mai il DOM', async () => {
  installaPolyfill();
  override.set('data/fixtures.json', JSON.stringify({
    [`step1-L1-${SLUG_DEN}`]: {
      headline: 'Attenzione',
      spiegazione: 'Questa è una diagnosi di difficoltà nel calcolo.',
      analogia: 'Come una pizza.',
    },
  }));
  const { explainer } = await importaModuli();
  const out = await explainer.getSafeRemediation('step1', 'L1', SLUG_DEN);
  assertEq(out.wasCleaned, true, 'il testo doveva essere scartato');
  assert(!/diagnosi/i.test(out.text), 'il termine bloccato e arrivato in output');
  assertEq(out.source, 'fallback', 'origine');
});

await test('lo scarto e integrale, non parziale: nessun frammento del testo iniettato sopravvive', async () => {
  installaPolyfill();
  override.set('data/fixtures.json', JSON.stringify({
    [`step1-L1-${SLUG_DEN}`]: { headline: 'Frase innocua da conservare', spiegazione: 'Contiene un disturbo.', analogia: '' },
  }));
  const { explainer } = await importaModuli();
  const out = await explainer.getSafeRemediation('step1', 'L1', SLUG_DEN);
  assert(!/innocua/i.test(out.text), 'e sopravvissuto un frammento del testo scartato');
});

await test('la denylist non scatta su falsi positivi ("sicura" non e "cura")', async () => {
  installaPolyfill();
  override.set('data/fixtures.json', JSON.stringify({
    [`step1-L1-${SLUG_DEN}`]: { headline: 'Vai sicura', spiegazione: 'Una strada sicura e accurata verso la risposta.', analogia: '' },
  }));
  const { explainer } = await importaModuli();
  const out = await explainer.getSafeRemediation('step1', 'L1', SLUG_DEN);
  assertEq(out.wasCleaned, false, 'falso positivo sulla denylist');
});

await test('il testo di fallback e esso stesso denylist-clean', async () => {
  installaPolyfill();
  const { explainer } = await importaModuli();
  const out = await explainer.getSafeRemediation('inesistente', 'L1', 'x');
  const denylist = JSON.parse(await (await globalThis.fetch('data/clinical-denylist.json')).text()).terms;
  const colpiti = denylist.filter((t) => new RegExp(`\\b${t}`, 'i').test(out.text));
  assertEq(colpiti, [], 'termini bloccati presenti nel fallback');
});

console.log('\n=== TSK-016 — report di sessione ===');

await test('il report aggrega i misconcetti per step nell ordine di esecuzione', async () => {
  const m = await sessione('L2');
  const [primo, secondo] = idsDi(m);
  const E = m.engine.QuizEngine;
  E.submit('d2');
  E.submit('d2');
  E.submit('d1');
  E.nextStep();
  E.submit('d3');
  E.submit('d1');
  const r = m.report.getSessionReport();
  assertEq(r.stepsData.map((s) => s.step_id), [primo, secondo], 'ordine degli step');
  assertEq(r.stepsData[0].attempts, 3, 'tentativi sul primo step');
  assertEq(r.stepsData[0].misconceptErrors, [{ slug: SLUG_DEN, count: 2 }], 'misconcetti primo step');
  assertEq(r.stepsData[1].misconceptErrors, [{ slug: 'numerator_focus', count: 1 }], 'misconcetti secondo step');
});

await test('il report riporta l esito del transfer a parole, non come punteggio', async () => {
  const m = await sessione('L1');
  vaiAlTransfer(m).submit('d1');
  const r = m.report.getSessionReport();
  assertEq(r.transferOutcome, 'Transfer completato autonomamente', 'esito');
  assert(!/%|\d+\s*su\s*\d+/.test(JSON.stringify(r)), 'il report contiene un punteggio numerico');
});

await test('transfer non affrontato: esito esplicito, non falso negativo', async () => {
  const { engine, report } = await sessione('L1');
  engine.QuizEngine.submit('d2');
  assertEq(report.getSessionReport().transferOutcome, 'Transfer non affrontato', 'esito');
});

await test('una nuova sessione azzera i dati della precedente', async () => {
  const { engine, report } = await sessione('L1');
  engine.QuizEngine.submit('d2');
  await engine.QuizEngine.startSession();
  assertEq(report.getSessionReport().stepsData, [], 'dati residui');
});

console.log('\n=== TSK-012 — router ===');

await test('senza ruolo si entra dalla home, i ruoli ignoti ci ricadono', async () => {
  installaPolyfill();
  const { router } = await importaModuli();
  assertEq(router.getRole(), 'home', 'default');
  globalThis.location.search = '?role=pirata';
  assertEq(router.getRole(), 'home', 'ruolo ignoto');
  globalThis.location.search = '?role=student';
  assertEq(router.getRole(), 'student', 'ruolo valido');
  globalThis.location.search = '?role=teacher';
  assertEq(router.getRole(), 'teacher', 'ruolo valido');
});

await test('initRouter invoca la view registrata da app.js, non una funzione per nome', async () => {
  installaPolyfill();
  const { router } = await importaModuli();
  globalThis.location.search = '?role=teacher';
  router.setPdpLevel('L2');
  let visto = null;
  router.initRouter({ student: () => { visto = 'student'; }, teacher: (ctx) => { visto = ctx; } });
  assertEq(visto, { role: 'teacher', pdpLevel: 'L2' }, 'contesto passato alla view');
});

await test('initRouter fallisce forte se la view non e registrata', async () => {
  installaPolyfill();
  const { router } = await importaModuli();
  globalThis.location.search = '?role=parent';
  let err = null;
  try { router.initRouter({}); } catch (e) { err = e; }
  assert(err && /Nessuna view registrata/.test(err.message), 'doveva lanciare');
});

process.exit(riepilogo() ? 0 : 1);
