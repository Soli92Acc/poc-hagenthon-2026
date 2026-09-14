---
skill: lint-checks-agent-fleet
part_of: lint-checks (modular)
family: agent-fleet
parent: lint-checks
description: "Check lint sulla flotta agentica — dimensione unità di contesto, igiene skill/agenti — check-family agent-fleet"
---

# Lint Checks — Agent Fleet

> Parte del sistema modulare lint-checks. File principale: `.claude/skills/lint-checks.md`
> Contiene: Check 4ap (unità di contesto agentica sopra soglia, WARNING-only, EP-060 opt-in)

Check ordinati per severità: WARNING → INFO.

---

## Check 4ap — Unità di contesto agentica sopra soglia (WARNING-only)

**Severità**: `warning` (mai bloccante — R.FH2 opt-in).
**Trigger**: `refactor_agent_skills.enabled: true` in `factory.config.yaml`.
Se `enabled: false` (default), il check è **skip silente** (fail-open, R.FH3).

[^src: EP-060 US-231 AC3]
[^src: factory.config.yaml — refactor_agent_skills.thresholds]
[^src: tools/refactor/analizza_target.py]

### Algoritmo

1. Leggi `factory.config.yaml`: se il blocco `refactor_agent_skills:` è assente O
   `refactor_agent_skills.enabled != true` → **skip silenzioso** (no-op totale, 0 WARNING).
2. Verifica esistenza di `tools/refactor/analizza_target.py`:
   - Se mancante → **skip silenzioso** con log INFO `[Check 4ap] tools/refactor/analizza_target.py
     assente — check saltato (R.FH3 fail-open)`. Non blocca la lint pipeline.
3. Leggi soglie da config (default se assenti): `error: 500`, `warning: 300`.
4. Per ogni file `.md` in `.claude/agents/` e `.claude/skills/` (escluse sottodirectory
   `evals/`, `references/refactor/` — le foglie non sono unità autonome ai fini di questo check):

   ```bash
   python3 tools/refactor/analizza_target.py <file>
   ```

   Estrarre il verdetto dal campo `verdict` dell'output:
   - `REFACTOR (>500)` → emette **WARNING** «Unità sopra soglia critica»
   - `VALUTARE` (300-500) → emette **WARNING** «Unità sopra soglia raccomandazione»
   - `ok` → nessun output

5. Aggrega i WARNING e presenta un riepilogo:
   ```
   [WARNING][agent-fleet-oversize][4ap] <N> unità sopra soglia: <lista-file>
   Azione: invocare /refactor <file> per avviare il protocollo di refactor conservativo
   tramite l'agente fleet-doctor. Nessuna azione automatica applicata.
   ```

### Azione suggerita

Invocare `/refactor <file>` per avviare il protocollo di refactor conservativo tramite
l'agente `fleet-doctor` (`.claude/agents/fleet-doctor.md`). Nessuna azione automatica
viene applicata: il check è puramente informativo.

### Anti-fabbricazione

Il check non stima costi, non promette risparmi, non applica modifiche. Segnala
solo l'evidenza numerica (`corpo N righe > threshold`).

### Invarianti

- **Warning-only**: mai ERROR — la capability è opt-in, una unità fuori soglia è
  recuperabile (R.FH2).
- **Fail-open**: se `tools/refactor/analizza_target.py` manca, skip silenzioso con
  log INFO — non blocca la lint pipeline (R.FH3).
- **No-op a flag spento**: factory con `refactor_agent_skills.enabled: false` (default)
  non vedono mai questo check (R.FH1, backward compat totale).
- **Read-only**: il check non modifica alcun file.
- **Never heal-eligible**: il refactor richiede approvazione umana (gate Fase 1).

### Output format

```
## WARNING (igiene, mai heal-eligible)
- [WARNING][agent-fleet-oversize][4ap] <N> unità sopra soglia.
  REFACTOR: [lista file >500 righe]
  VALUTARE: [lista file 300-500 righe]
  Azione: /refactor <file> per avviare il protocollo conservativo via fleet-doctor.
  Vedi wiki/runbooks/skill-hygiene.md
```

### Scenari di verifica

| # | `refactor_agent_skills.enabled` | script presente | esito atteso |
|---|---|---|---|
| 1 | assente / `false` (default) | — | no warning (gate off, R.FH1 — backward compat) |
| 2 | `true` | assente | log INFO skip (R.FH3 fail-open), lint pipeline prosegue |
| 3 | `true` | presente | nessuna unità fuori soglia → no warning |
| 4 | `true` | presente | unità 300-500 righe → WARNING «VALUTARE» |
| 5 | `true` | presente | unità >500 righe → WARNING «REFACTOR» |
| 6 | `true` | presente | più unità fuori soglia → un WARNING aggregato con lista |

### Cross-link

4ap → `factory.config.yaml.refactor_agent_skills` + EP-060 (Fleet Health) +
`wiki/runbooks/skill-hygiene.md` + PATTERN §36 (Refactor Skill Layer) +
skill `refactor-agent-skills.md` + agente `fleet-doctor.md` +
`tools/refactor/analizza_target.py`.
