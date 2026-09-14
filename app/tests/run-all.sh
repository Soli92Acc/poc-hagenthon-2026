#!/usr/bin/env bash
# run-all.sh — esegue l'intera verifica di NumeriMiei con un comando.
#
#   bash app/tests/run-all.sh            tutte le suite (nessun costo API)
#   bash app/tests/run-all.sh --quick    salta le suite che aprono un browser
#   bash app/tests/run-all.sh --live     aggiunge il live slot reale (COSTA 1 RICHIESTA)
#
# Il proxy viene avviato se non e' gia' in ascolto, e fermato a fine corsa solo
# se e' stato questo script ad avviarlo.

cd "$(dirname "$0")/.." || exit 1
APP="$PWD"
QUICK=0; LIVE=0
for a in "$@"; do
  [ "$a" = "--quick" ] && QUICK=1
  [ "$a" = "--live" ] && LIVE=1
done

# ── proxy ────────────────────────────────────────────────────────────────────
PROXY_AVVIATO=0
if ! curl -s -o /dev/null --max-time 2 http://localhost:8080/index.html; then
  echo "avvio del proxy su :8080..."
  python3 "$APP/proxy.py" > /tmp/numerimiei-proxy.log 2>&1 &
  PROXY_PID=$!
  PROXY_AVVIATO=1
  for _ in $(seq 1 20); do
    curl -s -o /dev/null --max-time 1 http://localhost:8080/index.html && break
    sleep 0.3
  done
fi
pulisci() { [ "$PROXY_AVVIATO" = "1" ] && kill "$PROXY_PID" 2>/dev/null; }
trap pulisci EXIT

# ── esecuzione ───────────────────────────────────────────────────────────────
NOMI=(); ESITI=(); FALLITE=0

esegui() {
  local nome="$1"; shift
  printf '\n\033[1m── %s\033[0m\n' "$nome"
  if "$@"; then ESITI+=("PASS"); else ESITI+=("FAIL"); FALLITE=$((FALLITE + 1)); fi
  NOMI+=("$nome")
}

esegui "Moduli, curriculum di riferimento"  env -u CURRICULUM node tests/e2e.mjs
esegui "Moduli, curriculum di produzione"   env CURRICULUM=prod node tests/e2e.mjs
esegui "Qualita del contenuto"              node tests/content-gate.mjs
esegui "Confine clinico e scalabilita"      bash tests/clinical-gate.sh
esegui "Prontezza offline (statica)"        env CURRICULUM=prod node tests/offline-check.mjs

if [ "$QUICK" = "0" ]; then
  esegui "Browser E2E"                      node tests/browser-e2e.mjs
  esegui "Accessibilita WCAG 2.2 AA"        node tests/a11y-gate.mjs
  esegui "Offline in browser (TSK-011)"     node tests/offline-browser.mjs
fi

if [ "$LIVE" = "1" ]; then
  esegui "Live slot reale (1 richiesta)"    node tests/live-slot.mjs
fi

# ── riepilogo ────────────────────────────────────────────────────────────────
printf '\n\033[1m═══ riepilogo ═══\033[0m\n'
for i in "${!NOMI[@]}"; do
  if [ "${ESITI[$i]}" = "PASS" ]; then printf '  \033[32mPASS\033[0m  %s\n' "${NOMI[$i]}"
  else printf '  \033[31mFAIL\033[0m  %s\n' "${NOMI[$i]}"; fi
done

TOT=${#NOMI[@]}
printf '\n%d/%d suite verdi' "$((TOT - FALLITE))" "$TOT"
[ "$QUICK" = "1" ] && printf '  (modalita --quick: suite browser saltate)'
[ "$LIVE" = "0" ] && printf '  (live slot escluso: usa --live, costa 1 richiesta)'
printf '\n'
exit $((FALLITE > 0))
