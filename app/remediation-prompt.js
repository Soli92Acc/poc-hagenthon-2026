/**
 * remediation-prompt.js — costruzione del prompt di remediation.
 *
 * Condiviso fra la generazione batch delle fixture (tools/gen-fixtures.mjs) e il
 * live slot (explainer.js) di proposito: se i due divergessero, durante la demo il
 * testo generato dal vivo stonerebbe rispetto a quelli pre-validati, ed e' esattamente
 * il confronto che il pubblico fa.
 */

/** L1 lavora su una quantita' discreta, L2 su una lineare: e' la differenza fra i livelli. */
const ANALOGIA = {
  L1: 'una pizza divisa in fette uguali',
  L2: 'un metro o una striscia divisa in parti uguali',
  L3: 'un metro o una striscia divisa in parti uguali',
};

const ERRORE = {
  denominator_magnitude:
    "il bambino ha guardato solo il numero in basso: pensa che se quel numero e' piu' grande, anche la parte sia piu' grande",
  numerator_focus:
    "il bambino ha risposto che le due parti sono uguali perche' sopra c'e' lo stesso numero, senza guardare in quante parti e' diviso l'intero",
  round_number_bias:
    "il bambino ha scelto il numero che gli suona piu' familiare (un numero tondo) invece di ragionare su quanto diventa grande ogni parte",
};

const ERRORE_GENERICO =
  "il bambino ha confrontato due parti di uno stesso intero e ha scelto quella sbagliata";

export const SYSTEM_PROMPT =
  'Sei un tutor di matematica che parla a un bambino di 9 anni. Scrivi in italiano semplice. ' +
  'Ogni frase ha al massimo 15 parole. Parli sempre dell\'esercizio, mai del bambino. ' +
  'Non usare mai parole mediche o che descrivano una difficolta\' della persona. ' +
  'Non usare le parole "numeratore", "denominatore" o "frazione": di\' "il numero sopra", ' +
  '"il numero sotto", "le parti".';

/**
 * @param {{fraction_a?: string, fraction_b?: string, level: string,
 *          slug?: string|null, transfer?: boolean}} ctx
 */
export function buildRemediationMessages(ctx) {
  const { fraction_a, fraction_b, level, slug, transfer } = ctx;
  const confronto =
    fraction_a && fraction_b
      ? `Esercizio: confronto fra ${fraction_a} e ${fraction_b}. La risposta giusta e' ${fraction_a}. `
      : 'Esercizio: confronto fra due parti di uno stesso intero. ';

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        confronto +
        `Errore commesso: ${ERRORE[slug] ?? ERRORE_GENERICO}. ` +
        `Usa come immagine ${ANALOGIA[level] ?? ANALOGIA.L1}. ` +
        (transfer
          ? 'Questo esercizio si affronta senza aiuti visivi: incoraggia a immaginare le parti con la mente. '
          : '') +
        'Scrivi un oggetto JSON con esattamente tre chiavi: ' +
        '"headline" (massimo 8 parole, senza punto finale), ' +
        '"spiegazione" (fra 40 e 50 parole, spiega perche\' la risposta giusta e\' quella), ' +
        '"analogia" (massimo 30 parole, una sola immagine concreta). ' +
        'Rispondi SOLO con il JSON.',
    },
  ];
}
