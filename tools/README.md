# tools/

Executable factory tools, **provider-agnostic** (single canonical location).
Accessible from any adapter and runnable manually.

> **R.A6 / Sprint 1:** do not add new scripts under `.claude/tools/`. That
> folder is compatibility shim only — see `.claude/tools/README.md`.
> Adapter registry health check: `python3 tools/adapters/check-adapter-lag.py`.

## Structure

| Folder | Contents |
|---|---|
| `a11y/` | WCAG 2.2 AA accessibility scan via axe-core + Playwright |
| `adapters/` | Registry check (`check-adapter-lag.py`) vs `adapters/capability-matrix.yaml` |
| `analytics/` | Session analytics, cost estimation, Monte Carlo, PERT, token ledger |
| `lint/` | Config/notes consistency checks |
| `runtime/` | Portable hooks (e.g. `suggest-next.py` EP-033) — primary path for Stop hooks |
| `temporal/` | Temporal context: UTC now, rebuild state from events, build temporal context |
| `tutor/` | Formative capability (EP-045) |
| `visual/` | Screenshot, design token extraction, design system conformance, LLM generator |
| `wiki-search/` | Hybrid wiki search (EP-042) |

## Dependency setup

**Prerequisites:**
- Python 3.10+
- Node 18+
- Playwright (`npx playwright install --with-deps chromium`)
- axe-core (via `npm install` in this folder)

```bash
# Python deps
pip install -r tools/requirements.txt

# Node deps
cd tools && npm install && npx playwright install --with-deps chromium
```

## Variables

Tools assume `FACTORY_ROOT` = repo root. Resolved automatically via:
- `$CLAUDE_PROJECT_DIR` (Claude Code)
- Relative path `./tools/` from CWD (manual launch from repo root)
- Adapter-specific binding (Cursor, Aider)

## Manual launch

```bash
# A11y scan on localhost
bash tools/a11y/a11y-scan.sh --target http://localhost:3000

# Token ledger with full display
python3 tools/analytics/show-session-tokens.py --full

# UTC now
bash tools/temporal/utc-now.sh
```
