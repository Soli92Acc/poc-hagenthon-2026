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

await test('L1 vede 1 training + transfer, L2 vede 2 training + transfer', async () => {
  const a = await sessione('L1');
  assertEq(a.engine.QuizEngine.steps.map((s) => s.step_id), ['step1', 'step3'], 'step L1');
  const b = await sessione('L2');
  assertEq(b.engine.QuizEngine.steps.map((s) => s.step_id), ['step1', 'step2', 'step3'], 'step L2');
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

await test('L2 nominale: step1 giusto avanza a step2 (test 2 di TSK-010)', async () => {
  const { engine } = await sessione('L2');
  engine.QuizEngine.submit('d1');
  assertEq(engine.QuizEngine.nextStep(), 'STEP', 'stato dopo nextStep');
  assertEq(engine.QuizEngine.getCurrentStep().step_id, 'step2', 'step raggiunto');
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
  engine.QuizEngine.submit('d1'); engine.QuizEngine.nextStep();
  engine.QuizEngine.submit('d1');
  assertEq(engine.QuizEngine.nextStep(), 'COMPLETION', 'fine sessione');
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
  const { engine } = await sessione('L1');
  engine.QuizEngine.submit('d1'); engine.QuizEngine.nextStep();
  assertEq(engine.QuizEngine.isTransferStep(), true, 'step di transfer');
  engine.QuizEngine.submit('d2');
  assertEq(engine.QuizEngine.getScaffoldVisible(), false, 'anche dopo un errore');
});

await test('transfer risolto: solvedWithoutScaffold = true', async () => {
  const { engine } = await sessione('L1');
  engine.QuizEngine.submit('d1'); engine.QuizEngine.nextStep();
  engine.QuizEngine.submit('d1');
  assertEq(globalThis.localStorage.getItem('solvedWithoutScaffold'), 'true', 'esito');
});

await test('transfer sbagliato: solvedWithoutScaffold = false', async () => {
  const { engine } = await sessione('L1');
  engine.QuizEngine.submit('d1'); engine.QuizEngine.nextStep();
  engine.QuizEngine.submit('d2');
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
  const { engine, report } = await sessione('L2');
  engine.QuizEngine.submit('d2');
  engine.QuizEngine.submit('d2');
  engine.QuizEngine.submit('d1');
  engine.QuizEngine.nextStep();
  engine.QuizEngine.submit('d3');
  engine.QuizEngine.submit('d1');
  const r = report.getSessionReport();
  assertEq(r.stepsData.map((s) => s.step_id), ['step1', 'step2'], 'ordine degli step');
  assertEq(r.stepsData[0].attempts, 3, 'tentativi step1');
  assertEq(r.stepsData[0].misconceptErrors, [{ slug: SLUG_DEN, count: 2 }], 'misconcetti step1');
  assertEq(r.stepsData[1].misconceptErrors, [{ slug: 'numerator_focus', count: 1 }], 'misconcetti step2');
});

await test('il report riporta l esito del transfer a parole, non come punteggio', async () => {
  const { engine, report } = await sessione('L1');
  engine.QuizEngine.submit('d1'); engine.QuizEngine.nextStep();
  engine.QuizEngine.submit('d1');
  const r = report.getSessionReport();
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

await test('ruolo di default student, ruoli ignoti ricadono su student', async () => {
  installaPolyfill();
  const { router } = await importaModuli();
  assertEq(router.getRole(), 'student', 'default');
  globalThis.location.search = '?role=pirata';
  assertEq(router.getRole(), 'student', 'ruolo ignoto');
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
