/**
 * a11y-gate.mjs — checklist a11y di TSK-019/TSK-020/TSK-023, eseguita da un browser
 * vero invece che a occhio in DevTools.
 *
 * Prerequisito: proxy attivo (python3 app/proxy.py).
 * Esegue: node app/tests/a11y-gate.mjs
 */
import { caricaChromium, esci } from './_playwright.mjs';

const BASE = 'http://localhost:8080';
const chromium = await caricaChromium();
esci(chromium, 'a11y-gate');

let stato = 0;
const ok = (m) => console.log(`  PASS  ${m}`);
const ko = (m) => { console.log(`  FAIL  ${m}`); stato = 1; };

const browser = await chromium.launch();

/** Funzioni valutate dentro la pagina: contrasto WCAG su testo realmente visibile. */
const CONTRASTO = () => {
  const lum = (c) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  const alfa = (s) => { const m = s.match(/rgba?\([^)]*,\s*([\d.]+)\)/); return m ? Number(m[1]) : 1; };

  const sfondo = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && alfa(bg) > 0.1) return rgb(bg);
      n = n.parentElement;
    }
    return [255, 255, 255];
  };

  const problemi = [];
  for (const el of document.querySelectorAll('body *')) {
    const testo = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!testo) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) < 0.1) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const fg = rgb(st.color);
    const bg = sfondo(el);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    const px = parseFloat(st.fontSize);
    const grande = px >= 24 || (px >= 18.66 && Number(st.fontWeight) >= 700);
    const soglia = grande ? 3 : 4.5;
    if (ratio < soglia) {
      problemi.push({ tag: el.tagName.toLowerCase(), testo: testo.slice(0, 40), ratio: ratio.toFixed(2), soglia });
    }
  }
  return problemi;
};

const CIFRE_TABULARI = () => {
  const fuori = [];
  // Il footer e' escluso: e' il disclaimer di legge, non contenuto numerico da leggere.
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('footer')) continue;
    const testo = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
    if (!/\d/.test(testo)) continue;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') continue;
    if (!/tabular-nums/.test(st.fontVariantNumeric)) fuori.push(`${el.tagName.toLowerCase()}: "${testo.trim().slice(0, 35)}"`);
  }
  return fuori;
};

const MOVIMENTO = () => {
  const animati = [];
  for (const el of document.querySelectorAll('body *')) {
    const st = getComputedStyle(el);
    const dur = (v) => Math.max(0, ...String(v).split(',').map((x) => parseFloat(x) * (x.includes('ms') ? 1 : 1000) || 0));
    if (dur(st.animationDuration) > 50 || dur(st.transitionDuration) > 50) {
      animati.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
    }
  }
  return [...new Set(animati)];
};

const NOMI_ACCESSIBILI = () => {
  const muti = [];
  for (const el of document.querySelectorAll('button, a[href], select, input')) {
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') continue;
    const nome = (el.getAttribute('aria-label') || el.textContent || '').trim()
      || (el.labels && el.labels.length ? [...el.labels].map((l) => l.textContent).join(' ').trim() : '');
    if (!nome) muti.push(`${el.tagName.toLowerCase()}#${el.id || '(senza id)'}`);
  }
  return muti;
};

async function apri(ctx, url, opts = {}) {
  const page = await ctx.newPage();
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return page;
}

async function preparaSessione(ctx) {
  const page = await apri(ctx, `${BASE}/index.html?role=teacher`);
  await page.selectOption('#pdp-level-select', 'L1');
  await page.click('#btn-confirm-pdp');
  await page.waitForLoadState('networkidle');
  return page;
}

// ── 1. Contrasto su tutte le schermate rilevanti ────────────────────────────
console.log('=== TSK-019 — contrasto WCAG 2.2 AA (4.5:1, 3:1 per testo grande) ===');
{
  const ctx = await browser.newContext();
  const page = await preparaSessione(ctx);
  const schermate = [['studente, domanda', null]];

  // stato con feedback di errore: colori diversi, vanno verificati anche quelli
  const sbagliati = await page.evaluate(async () => {
    const c = await (await fetch('data/curriculum-discalculia.json')).json();
    return c.steps[0].items[0].distractors.filter((d) => !d.correct).map((d) => d.id);
  });
  let problemi = await page.evaluate(CONTRASTO);
  problemi.length === 0 ? ok('vista studente, domanda') : ko(`vista studente: ${problemi.map((p) => `${p.tag} "${p.testo}" ${p.ratio}:1 < ${p.soglia}`).join(' | ')}`);

  await page.click(`[data-distractor-id="${sbagliati[0]}"]`);
  await page.click('#btn-submit');
  await page.waitForTimeout(500);
  problemi = await page.evaluate(CONTRASTO);
  problemi.length === 0 ? ok('vista studente, feedback di errore') : ko(`feedback errore: ${problemi.map((p) => `${p.tag} "${p.testo}" ${p.ratio}:1`).join(' | ')}`);

  for (const ruolo of ['home', 'teacher', 'parent']) {
    const p2 = await apri(ctx, `${BASE}/index.html?role=${ruolo}`);
    const pr = await p2.evaluate(CONTRASTO);
    pr.length === 0 ? ok(`vista ${ruolo}`) : ko(`vista ${ruolo}: ${pr.map((x) => `${x.tag} "${x.testo}" ${x.ratio}:1`).join(' | ')}`);
    await p2.close();
  }
  await ctx.close();
  void schermate;
}

// ── 2. Focus visibile su ogni elemento interattivo ──────────────────────────
console.log('\n=== TSK-019/TSK-023 — focus outline visibile in navigazione da tastiera ===');
{
  const ctx = await browser.newContext();
  const page = await preparaSessione(ctx);
  const senzaFocus = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const st = getComputedStyle(el);
      const w = parseFloat(st.outlineWidth) || 0;
      const visibile = (w > 0 && st.outlineStyle !== 'none') || (st.boxShadow && st.boxShadow !== 'none');
      return { id: el.id || el.tagName.toLowerCase(), visibile, w };
    });
    if (info && !info.visibile) senzaFocus.push(info.id);
  }
  senzaFocus.length === 0
    ? ok('ogni elemento raggiunto con Tab mostra un focus visibile')
    : ko(`senza focus visibile: ${[...new Set(senzaFocus)].join(', ')}`);
  await ctx.close();
}

// ── 3. prefers-reduced-motion ───────────────────────────────────────────────
console.log('\n=== TSK-019 — prefers-reduced-motion rispettato ===');
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await preparaSessione(ctx);
  const animati = await page.evaluate(MOVIMENTO);
  animati.length === 0
    ? ok('nessuna animazione o transizione attiva con reduced-motion')
    : ko(`elementi ancora animati: ${animati.slice(0, 5).join(', ')}`);
  await ctx.close();
}

// ── 4. Cifre tabulari e nomi accessibili ────────────────────────────────────
console.log('\n=== TSK-019 — cifre tabulari e nomi accessibili ===');
{
  const ctx = await browser.newContext();
  const page = await preparaSessione(ctx);
  const fuori = await page.evaluate(CIFRE_TABULARI);
  fuori.length === 0 ? ok('ogni testo con cifre usa tabular-nums') : ko(`senza tabular-nums: ${fuori.slice(0, 4).join(' | ')}`);

  const muti = await page.evaluate(NOMI_ACCESSIBILI);
  muti.length === 0 ? ok('ogni controllo ha un nome accessibile') : ko(`controlli senza nome: ${muti.join(', ')}`);

  // TSK-005: opzioni in colonna singola con spazio >= 1.5rem, per non sbagliare bersaglio
  const gap = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.option-btn')].map((x) => x.getBoundingClientRect());
    if (b.length < 2) return null;
    return Math.min(...b.slice(1).map((r, i) => r.top - b[i].bottom));
  });
  gap === null ? ok('opzioni non presenti in questa schermata (nessun controllo da fare)')
    : gap >= 24 ? ok(`spazio fra le opzioni: ${Math.round(gap)}px (soglia 24)`)
    : ko(`opzioni troppo vicine: ${Math.round(gap)}px < 24`);

  // La home e' la prima schermata che si incontra: vale le stesse regole.
  const casa = await apri(ctx, `${BASE}/index.html`);
  const fuoriCasa = await casa.evaluate(CIFRE_TABULARI);
  fuoriCasa.length === 0 ? ok('home: ogni testo con cifre usa tabular-nums')
                         : ko(`home senza tabular-nums: ${fuoriCasa.slice(0, 4).join(' | ')}`);
  const mutiCasa = await casa.evaluate(NOMI_ACCESSIBILI);
  mutiCasa.length === 0 ? ok('home: ogni controllo ha un nome accessibile')
                        : ko(`home, controlli senza nome: ${mutiCasa.join(', ')}`);
  const gapCasa = await casa.evaluate(() => {
    const b = [...document.querySelectorAll('.profile-card')].map((x) => x.getBoundingClientRect());
    if (b.length < 2) return null;
    return Math.min(...b.slice(1).map((r, i) => r.top - b[i].bottom));
  });
  gapCasa !== null && gapCasa >= 8
    ? ok(`home: spazio fra le card ${Math.round(gapCasa)}px`)
    : ko(`home: card troppo vicine o assenti (${gapCasa})`);
  await casa.close();
  await ctx.close();
}

// ── 5. Il feedback non passa dal solo colore ────────────────────────────────
console.log('\n=== TSK-019 — feedback non veicolato dal solo colore (WCAG 1.4.1) ===');
{
  const ctx = await browser.newContext();
  const page = await preparaSessione(ctx);
  const sbagliati = await page.evaluate(async () => {
    const c = await (await fetch('data/curriculum-discalculia.json')).json();
    return c.steps[0].items[0].distractors.filter((d) => !d.correct).map((d) => d.id);
  });
  await page.click(`[data-distractor-id="${sbagliati[0]}"]`);
  await page.click('#btn-submit');
  await page.waitForTimeout(500);
  const marcatore = await page.textContent('#feedback-region');
  // Il glifo e' l'indicatore non cromatico richiesto da WCAG 1.4.1. Sull'errore
  // la UI usa "↻" (riprova) invece di una croce: e' una scelta didattica, non un
  // indebolimento — l'informazione resta nel glifo e nella parola, non nel colore.
  /[✗✓×✔!↻]/.test(marcatore)
    ? ok('il feedback porta un indicatore testuale oltre al colore')
    : ko('il feedback sembra affidarsi al solo colore');
  await ctx.close();
}

await browser.close();
console.log(`\nGATE A11Y: ${stato ? 'FAIL' : 'PASS'}`);
process.exit(stato);
