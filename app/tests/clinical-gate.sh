#!/usr/bin/env bash
# clinical-gate.sh — verifiche meccaniche del confine clinico e degli invarianti
# di scalabilita' (TSK-021 verifiche 1-3, TSK-010 grep gate).
#
# I comandi grep scritti nelle spec dei TSK sono stati corretti: erano pensati per
# script globali, non per moduli ES. Ogni check qui sotto riporta il comando
# originale e la forma corretta, cosi' la sostituzione resta tracciabile.
#
# Esegue: bash app/tests/clinical-gate.sh   (dalla root del repo)

cd "$(dirname "$0")/.." || exit 1
JS=$(ls ./*.js 2>/dev/null)
esito=0

ok()   { printf '  PASS  %s\n' "$1"; }
ko()   { printf '  FAIL  %s\n' "$1"; esito=1; }
skip() { printf '  SKIP  %s\n' "$1"; }

echo "=== Check 1 — unico entry point verso il DOM per la remediation ==="
# Originale: grep -c renderRemediation explainer.js app.js engine.js  -> 1
# Corretto: il presidio si chiama getSafeRemediation ed e' l'unico export pubblico
# di explainer.js; si conta quante volte viene INVOCATO fuori da explainer.js.
definizioni=$(grep -l 'export async function getSafeRemediation' ./*.js 2>/dev/null | wc -l | tr -d ' ')
[ "$definizioni" = "1" ] && ok "getSafeRemediation definito una volta sola (explainer.js)" \
                         || ko "getSafeRemediation definito $definizioni volte"

if [ -f app.js ]; then
  chiamate=$(grep -c 'getSafeRemediation(' app.js)
  [ "$chiamate" = "1" ] && ok "un solo call site in app.js" || ko "$chiamate call site in app.js (atteso 1)"
else
  skip "app.js non ancora presente (file di P-B) — ricontrollare dopo TSK-005"
fi

# Nessun'altra strada verso il DOM: solo explainer.js puo' restituire testo di remediation.
altre=$(grep -ln 'resolveRemediation(' ./*.js 2>/dev/null | grep -v explainer.js)
[ -z "$altre" ] && ok "resolveRemediation (grezza) non usata fuori da explainer.js" \
                || ko "resolveRemediation usata in: $altre"

echo
echo "=== Check 2 — single writer di pdpLevel ==="
# Originale: grep -n "setItem.*pdpLevel" app.js engine.js explainer.js index.html -> 1
# Corretto: il writer vive in router.js (modulo estratto da app.js per separare la
# proprieta' dei file fra P-A e P-B); si cerca su tutti i .js e su index.html.
writers=$(grep -n "setItem('pdpLevel'\|setItem(\"pdpLevel\"\|setItem(LS_PDP" ./*.js index.html 2>/dev/null | wc -l | tr -d ' ')
[ "$writers" = "1" ] && ok "un solo writer di pdpLevel (router.js)" || ko "$writers writer di pdpLevel (atteso 1)"

lettori_engine=$(grep -c "setItem.*pdpLevel" engine.js)
[ "$lettori_engine" = "0" ] && ok "engine.js non scrive mai pdpLevel (solo lettura)" \
                             || ko "engine.js scrive pdpLevel"

storage=$(grep -n "addEventListener('storage'\|addEventListener(\"storage\"" ./*.js 2>/dev/null | wc -l | tr -d ' ')
[ "$storage" = "0" ] && ok "nessun listener 'storage' (no cross-tab sync by design)" \
                     || ko "trovato un listener 'storage'"

echo
echo "=== Check 3 — nessun contenuto didattico dentro il codice ==="
# Originale: grep -nE 'misconcepto|frazione|denominatore' *.js -> 0
# Corretto: 'misconcepto_slug' e' il NOME DI CAMPO del contratto CT-1 e per forza
# compare nel codice che legge il JSON. Si escludono le occorrenze del campo e si
# pretende zero su tutto il resto: prose didattica, numeri di esercizio, analogie.
# Esclusi: il campo di contratto, le righe di commento, e remediation-prompt.js
# (contiene le istruzioni che VIETANO quei termini al modello, non contenuto didattico).
residuo=$(grep -nE 'misconcepto|frazione|denominatore' $JS 2>/dev/null \
  | grep -v 'misconcepto_slug' \
  | grep -v 'remediation-prompt.js' \
  | grep -vE ':[0-9]+:[[:space:]]*(\*|//)')
[ -z "$residuo" ] && ok "zero contenuto didattico nei .js (escluso il campo misconcepto_slug)" \
                  || { ko "contenuto didattico nei .js:"; echo "$residuo" | sed 's/^/        /'; }

# I numeri degli esercizi devono stare solo nei dati, mai nel codice.
# remediation-prompt.js e' escluso: contiene i template di prompt, non esercizi.
numeri=$(grep -nE '[0-9]\s*/\s*[0-9]' $JS 2>/dev/null | grep -v remediation-prompt.js | grep -v '^\S*:\s*[0-9]*:\s*\*' | grep -vE '//|/\*')
[ -z "$numeri" ] && ok "nessuna frazione letterale nel codice" \
                 || { ko "frazioni letterali nel codice:"; echo "$numeri" | sed 's/^/        /'; }

echo
echo "=== Check 4 — il messaggio di stop non puo' arrivare da un LLM ==="
inline=$(grep -c 'insegnante o il tuo tutor' engine.js)
[ "$inline" = "1" ] && ok "STOP_MESSAGE hardcoded in engine.js" || ko "STOP_MESSAGE non trovato in engine.js"
nelle_fixture=$(grep -c 'insegnante o il tuo tutor' data/fixtures.json)
[ "$nelle_fixture" = "0" ] && ok "STOP_MESSAGE assente dalle fixture generate" || ko "STOP_MESSAGE presente nelle fixture"

echo
echo "=== Check 5 — footer Legge 170/2010 su tutte le view ==="
if [ -f index.html ]; then
  grep -q '170/2010' index.html && ok "footer presente in index.html" || ko "footer Legge 170/2010 assente"
else
  skip "index.html non ancora presente (file di P-B) — verifica manuale in TSK-021 dopo TSK-002"
fi

echo
[ "$esito" = "0" ] && echo "GATE CONFINE CLINICO: PASS" || echo "GATE CONFINE CLINICO: FAIL"
exit $esito
