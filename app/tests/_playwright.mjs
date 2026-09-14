/**
 * _playwright.mjs — risoluzione di Playwright senza averlo come dipendenza.
 * In un PoC da 4 ore non c'e' un package.json: si usa la copia che esiste sulla
 * macchina. Con PLAYWRIGHT=<path/to/playwright> si forza una copia specifica.
 */
import { execSync } from 'node:child_process';

export async function caricaChromium() {
  const candidati = [process.env.PLAYWRIGHT, 'playwright'].filter(Boolean);
  try {
    const trovati = execSync(
      `find "$HOME/.npm/_npx" "$HOME/Documents" -maxdepth 6 -type d -name playwright -path '*/node_modules/*' 2>/dev/null | head -5`,
      { shell: '/bin/bash', encoding: 'utf8' },
    ).trim().split('\n').filter(Boolean);
    candidati.push(...trovati.map((d) => `${d}/index.js`));
  } catch { /* la ricerca e' opzionale */ }

  for (const c of candidati) {
    try {
      const m = await import(c.startsWith('/') ? `file://${c}` : c);
      const chromium = m.chromium ?? m.default?.chromium;
      if (chromium) return chromium;
    } catch { /* prossimo candidato */ }
  }
  return null;
}

export function esci(chromium, nome) {
  if (!chromium) {
    console.log(`  SKIP  playwright non disponibile: ${nome} va eseguito a mano`);
    process.exit(0);
  }
}
