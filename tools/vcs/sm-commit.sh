#!/usr/bin/env bash
# Commit senza footer AI — per code_path con ai_attribution_policy.suppress_ai_traces: true
# Uso: ./tools/vcs/sm-commit.sh "messaggio commit" [path]
#
# Esegue un commit git con il messaggio fornito, senza aggiungere Co-Authored-By
# o altri marker AI. Il messaggio deve essere in stile umano.
#
# Se <path> è specificato, il commit viene eseguito nella directory indicata;
# altrimenti viene eseguito nella directory corrente.

set -euo pipefail

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "Errore: messaggio commit obbligatorio." >&2
  echo "Uso: $0 \"messaggio commit\" [path]" >&2
  exit 1
fi

REPO_PATH="${2:-.}"

git -C "$REPO_PATH" commit -m "$MSG"
