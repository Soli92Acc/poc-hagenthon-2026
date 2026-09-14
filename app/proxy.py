#!/usr/bin/env python3
"""Mini-proxy CORS per OpenRouter + server statico dell'app NumeriMiei (TSK-001).

Serve due scopi in un solo processo, cosi' l'app gira su una porta sola:
  - GET  /*          -> file statici di app/ (index.html, *.js, data/*.json)
  - POST /complete    -> forward a OpenRouter /chat/completions con la API key
  - GET  /key-info    -> forward a OpenRouter /key (verifica credito e rate limit)

La chiave non e' mai nel codice: si legge da env (OPENROUTER_API_KEY oppure
OPEN_ROUTER_KEY) o dal file .env alla root del repo.

Avvio:  python3 app/proxy.py        # http://localhost:8080
"""

import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
REPO_ROOT = APP_DIR.parent
PORT = int(os.environ.get("PROXY_PORT", "8080"))
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
UPSTREAM_TIMEOUT_S = 30


def load_api_key():
    """Env prima, poi .env alla root. Nomi accettati: OPENROUTER_API_KEY, OPEN_ROUTER_KEY."""
    for name in ("OPENROUTER_API_KEY", "OPEN_ROUTER_KEY"):
        if os.environ.get(name):
            return os.environ[name].strip()
    dotenv = REPO_ROOT / ".env"
    if dotenv.exists():
        for line in dotenv.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            name, _, value = line.partition("=")
            if name.strip() in ("OPENROUTER_API_KEY", "OPEN_ROUTER_KEY"):
                return value.strip().strip("'\"")
    return None


def build_ssl_context():
    """macOS + python.org: il trust store di sistema non e' visibile a Python.
    Si usa certifi quando presente, altrimenti il default."""
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


API_KEY = load_api_key()
SSL_CTX = build_ssl_context()


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/key-info"):
            return self._forward("GET", f"{OPENROUTER_BASE}/key", None)
        return super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/complete"):
            return self._json(404, {"error": "endpoint sconosciuto"})
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        return self._forward("POST", f"{OPENROUTER_BASE}/chat/completions", raw)

    def _forward(self, method, url, body):
        if not API_KEY:
            return self._json(500, {"error": "API key assente (OPENROUTER_API_KEY o .env)"})
        req = urllib.request.Request(url, data=body, method=method)
        req.add_header("Authorization", f"Bearer {API_KEY}")
        req.add_header("Content-Type", "application/json")
        req.add_header("HTTP-Referer", "http://localhost:8080")
        req.add_header("X-Title", "NumeriMiei")
        try:
            with urllib.request.urlopen(req, timeout=UPSTREAM_TIMEOUT_S, context=SSL_CTX) as resp:
                payload = resp.read()
                sys.stderr.write(f"[proxy] {method} {url} -> {resp.status}\n")
                return self._raw(resp.status, payload)
        except urllib.error.HTTPError as exc:
            payload = exc.read()
            sys.stderr.write(f"[proxy] {method} {url} -> HTTP {exc.code}\n")
            return self._raw(exc.code, payload)
        except Exception as exc:  # rete giu', DNS, timeout
            sys.stderr.write(f"[proxy] {method} {url} -> errore {exc}\n")
            return self._json(502, {"error": f"upstream irraggiungibile: {exc}"})

    def _raw(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _json(self, status, obj):
        return self._raw(status, json.dumps(obj).encode("utf-8"))

    def log_message(self, fmt, *args):  # meno rumore: gli statici non interessano
        pass


def main():
    if not API_KEY:
        sys.stderr.write("[proxy] ATTENZIONE: nessuna API key trovata. Gli statici funzionano, /complete no.\n")
    else:
        sys.stderr.write(f"[proxy] API key caricata (...{API_KEY[-6:]})\n")
    handler = partial(Handler, directory=str(APP_DIR))
    sys.stderr.write(f"[proxy] http://localhost:{PORT} (statici da {APP_DIR})\n")
    ThreadingHTTPServer(("127.0.0.1", PORT), handler).serve_forever()


if __name__ == "__main__":
    main()
