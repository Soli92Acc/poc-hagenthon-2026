---
skill: lint-checks-governance
part_of: lint-checks (modular)
family: governance
parent: lint-checks
description: "Check lint su governance, release gate, bypass SLA, versioning — check-family governance"
---

# Lint Checks — Governance

> Parte del sistema modulare lint-checks. File principale: `.claude/skills/lint-checks.md`
> Contiene: Check 4v (Complexity Budget N:1), Validation Schema Checks header, Check 4w (RUN-REPORT schema), Check 4x (CHANGELOG validation evidence), Check 4al (CHANGELOG↔GATE-REPORT), Check 4am (versioni divergenti)

Check ordinati per severità: ERROR → WARNING.

---

### 4v — Complexity Budget regola N:1 violata pre-release (Complexity Budget & Deprecations, EP-016 US-061, ADR-056 §D)

**Pattern allineato a Check 4q/4r/4s/4u (R.P3 opt-in totale)**: WARNING-only, opt-in via flag
config, nessun ERROR meccanico. Check 4v eredita la stessa shape per coerenza framework.

> **Nota di numerazione**: ADR-056 §D + PATTERN §23 prescrivono questo check come «Check 4t»; nel
> repo corrente lo slot «4t-migration» è **riservato** alla migration ADR-050 §I (pre-warning INFO
> opzionale post-upgrade, non ancora implementata) e gli slot 4u (EP-014 US-057) sono già occupati,
> quindi il check adotta il prossimo slot libero **4v** preservando l'intento dell'ADR (correzione
> meccanica di numerazione, non cambio di intento — lezione TSK-112). Il riferimento «Check 4t» in
> PATTERN §23 / ADR-056 va inteso come questo Check 4v.

**Severità: WARNING su factory derivate; ERROR sul meta-framework** (ADR-056 §A + TSK-166 2026-06-15 + PATTERN §23.5.1).
- **`required_on_release: false`** (default, R.P3, factory derivate): WARNING-only — il lint informa preventivamente, non blocca mai `/lint` né il Develop né il release.
- **`required_on_release: true`** (meta-framework, PATTERN §23.5.1): il check scala a **ERROR** su release minor/major con ratio N:1 violato e assenza del marker di esenzione `[skip-complexity-budget --reason="…"]`; la release è bloccata. Cadenza identica: solo pre-release minor/major (skip su patch `x.y.Z`). Factory derivate con flag `false` (default) non sono impattate.
Mai `heal-eligible` (giudizio semantico). Replica documentalmente il gate empirico `complexity_budget.required_on_release` di EP-016.

**Trigger (AND — tutte le condizioni devono essere vere)**:

```
factory.config.yaml.complexity_budget.required_on_release == true
AND release pre-tag minor/major (heading CHANGELOG.md `## vX.Y` con Y change/Z=0, o `## vX` major;
    skip su patch `## vX.Y.Z` con Z>0 — cadenza ADR-056 §F)
AND skill `complexity-budget-check` (5 step) verdict in {warn, fail}
    (ratio delta_added > N * delta_removed, default N=3, ADR-056 §B)
AND NOT (marker `[skip-complexity-budget --reason="<motivo>"]` presente nel CHANGELOG della versione)
```

**Gate**: `factory.config.yaml.complexity_budget.required_on_release: false` (default off, opt-in
totale, backward compat — R.P3). Se assente o `false` → 4v no-op totale (non si applica,
indipendentemente dal verdict della skill). Su release **patch** → 4v non si applica (cadenza
pre-release minor/major, ADR-056 §F).

**Esenzione**: marker `[skip-complexity-budget --reason="<motivo>"]` nell'entry CHANGELOG della
versione (ADR-056 §E) → la skill ritorna `verdict: pass` con `skipped: true` → no WARNING.
L'esenzione richiede motivazione esplicita.

**Severità del messaggio per verdict** (entrambi WARNING-only):

- `warn` (ratio 1 above N) → WARNING `"ratio 1 above N=<N>, plan removal next release"`.
- `fail` (ratio above N+1) → WARNING `"ratio significantly above N=<N>, removal required"`.

**Messaggio (template verbatim, placeholder `<version>`, `<ratio>`, `<N>`, `<verdict>`)**:

```
Complexity Budget regola N:1 violata per <version> (verdict: <verdict>, ratio <ratio> > N=<N>) quando complexity_budget.required_on_release: true. Considerare deprecazioni in PATTERN §23.2 (`/complexity-budget deprecate §X --reason="<r>"`) o aggiungere il marker [skip-complexity-budget --reason="<motivo>"] nel CHANGELOG. Vedi PATTERN §23, ADR-052, ADR-056. Disabilita Check 4v impostando complexity_budget.required_on_release: false.
```

**Output format** (sezione `## WARNING (igiene)` del report):

```
- [WARNING][complexity-budget][4v] v2.20: regola N:1 violata (verdict: warn, ratio 4 > N=3). Considerare deprecazioni in PATTERN §23.2 o aggiungere [skip-complexity-budget --reason] nel CHANGELOG. Vedi PATTERN §23, ADR-056.
```

**Scenari di verifica**:

| # | `required_on_release` | release_kind | skill verdict | skip marker | esito atteso |
|---|---|---|---|---|---|
| 1 | `false` (default) | minor | warn | — | no warning (gate off, R.P3) |
| 2 | `true` | minor | pass | — | no warning (regola rispettata) |
| 3 | `true` | minor | warn | assente | **WARNING 4v** (ratio 1 above N) |
| 4 | `true` | minor | fail | assente | **WARNING 4v** (ratio above N+1) |
| 5 | `true` | minor | warn | presente | no warning (esenzione motivata, `skipped: true`) |
| 6 | `true` | patch | warn | — | no warning (cadenza: patch skip, ADR-056 §F) |

**Cross-link**: 4v → skill `complexity-budget-check.md` (5 step, ADR-056 §B) + comando
`/complexity-budget` + PATTERN §23 (§23.1 regola N:1, §23.2 Sezione Deprecate) + §3 entry
«Complexity Budget & Deprecations» + ADR-052 (regola N:1) / ADR-053 (`/pattern-view`) /
ADR-056 §D (questo check) + runbook `wiki/runbooks/complexity-budget-runbook.md`.

---

## Validation Schema Checks (opt-in v2.19+)

**Gate**: `factory.config.yaml.release_governance.battle_test_gate.enabled: true` (R.P3 opt-in).
A gate `false` (default factory derivate), questa intera sezione è skip — **0 check aggiuntivi
vs v2.18**, nessun ERROR/WARNING introdotto, comportamento identico (backward compat ADR-032
§Backward compat). Eseguito **solo** se il gate master è abilitato.

### Check 4w — RUN-REPORT schema validation (ERROR su schema malformato, EP-012 US-049, ADR-032 §C §J)

> **Nota di numerazione**: TSK-096, ADR-032 §J e US-049 prescrivono questo check come «Check 4s»;
> nel repo corrente lo slot **4s** è già occupato (EP-015 US-060 — Consistency / compression
> output, due sotto-check 4s.1/4s.2), lo slot **«4t-migration»** è **riservato** alla migration
> ADR-050 §I (pre-warning INFO opzionale post-upgrade, non ancora implementata), e gli slot **4u**
> (EP-014 US-057) e **4v** (EP-016 US-061) sono già occupati. Il check adotta quindi il prossimo
> slot libero **4w** preservando l'intento dell'ADR (correzione meccanica di numerazione, non
> cambio di intento — lezione TSK-112/118/122). I riferimenti «Check 4s» in TSK-096 / ADR-032 §J /
> US-049 vanno intesi come questo **Check 4w**.

**Severità: ERROR — non WARNING** (deroga motivata a R.P3). Lo schema del RUN-REPORT è un
**contratto binario** (o è rispettato integralmente o no): uno schema malformato è un bug
strutturale, non un soft warning di igiene. Pattern parallelo a Check 4i (frontmatter EP/US/TSK)
e distinto da Check 4o/4p/4q/4r/4s/4u/4v (WARNING-only per status/marker mancanti). La deroga è
**legittima** perché l'ERROR esiste solo dietro un gate **interamente opt-in**: l'utente sceglie
se accendere `battle_test_gate.enabled`; se lo accende, lo schema **deve** essere rispettato
(decisione ADR-032 §J + Alternative «Lint Check WARNING-only scartato»). Non `heal-eligible`
(la compilazione di una sezione mancante richiede giudizio semantico sul contenuto del run).

**Trigger (AND — tutte le condizioni devono essere vere)**:

```
factory.config.yaml.release_governance.battle_test_gate.enabled == true
AND esiste un file matching `validation/runs/<slug>/RUN-REPORT.md`
AND il file ha frontmatter valido (campo `pre_check_status:` presente, valore ∈ {pending, pass, fail})
AND il file NON è esente (vedi §Esenzione / File esclusi)
AND almeno una delle 9 sezioni obbligatorie (§1..§9, schema ADR-032 §C) è MANCANTE
    oppure il frontmatter è incoerente (vedi §Sotto-check)
```

**Le 9 sezioni obbligatorie** (heading verbatim, schema ADR-032 §C, ordine atteso ma non stretto —
tutte devono essere presenti):

1. `## §1 Pre-check meccanico`
2. `## §2 Capability attivate`
3. `## §3 Backlog esercitato`
4. `## §4 Cosa ha funzionato`
5. `## §5 Cosa si è rotto`
6. `## §6 Capability NON esercitate`
7. `## §7 Lezioni`
8. `## §8 Indipendenza del campione`
9. `## §9 Firma`

**Sotto-check (tutti ERROR, gate-coperti)**:

- **4w.a — frontmatter mancante/invalido**: nessun frontmatter YAML, oppure campo
  `pre_check_status:` assente, oppure valore ∉ {pending, pass, fail}. → ERROR `run-report-frontmatter-invalid`.
- **4w.b — sezioni §1..§9 incomplete**: ≥1 dei 9 heading obbligatori sopra è assente. → ERROR
  `run-report-section-missing` (un ERROR per ogni sezione mancante, messaggio canonico sotto).
- **4w.c — pre_check/review incoerenti**: `review_status: pass` con `pre_check_status` ∈
  {pending, fail} (la review umana non può passare se il pre-check non è `pass` — CRITERIA.md
  §Principio: review parte SOLO se pre-check `pass`). → ERROR `run-report-verdict-incoherent`.

**Gate**: `factory.config.yaml.release_governance.battle_test_gate.enabled: false` (default off,
opt-in totale R.P3). Se assente o `false` → 4w no-op totale (la sezione `validation/runs/**` non
viene nemmeno letta, comportamento identico a v2.18).

**Esenzione / File esclusi** (nessun ERROR su questi):

- `validation/runs/TEMPLATE/RUN-REPORT.md` — il template scaffoldato stesso (marker `<<...>>`,
  non un run reale).
- Qualsiasi file con nota `[REFERENCE-ONLY]` nel frontmatter o nel corpo (es.
  `validation/runs/fsc-trasf-demo-2026-05-19/RUN-REPORT.md`, run di reference ex-post non
  gate-eligible — ADR-032 §G).

Salvo questi due casi, **nessun'altra esenzione**: lo schema canonico deve essere rispettato
integralmente quando il gate è on (ADR-032 §J «Esenzione: nessuna»).

**Pattern di rilevamento (regex)**:

```
1. Glob `validation/runs/*/RUN-REPORT.md`.
2. Scarta i file esclusi: path contiene `TEMPLATE`, oppure il contenuto matcha `\[REFERENCE-ONLY`.
3. Per ogni file rimanente:
   a. Estrai il frontmatter YAML (blocco fra i primi due `---`). Se assente o senza
      `pre_check_status:` ∈ {pending|pass|fail} → ERROR 4w.a; salta gli altri sotto-check del file.
   b. Per ciascuno dei 9 heading obbligatori (`^## §<N> <nome>$`, regex case-sensitive sull'icona §N):
      se assente → ERROR 4w.b (uno per sezione mancante).
   c. Se `review_status: pass` AND `pre_check_status:` ∈ {pending, fail} → ERROR 4w.c.
```

**Messaggio (template verbatim, placeholder `<slug>`, `<N>`, `<nome>`)**:

- 4w.a — `"RUN-REPORT <slug>: frontmatter mancante o pre_check_status invalido (atteso pending|pass|fail). Schema obbligatorio quando battle_test_gate.enabled: true. (ADR-032 §C)"`
- 4w.b — `"RUN-REPORT <slug>: sezione §<N> (<nome>) mancante. Vedi validation/CRITERIA.md §5 per il template fields e validation/runs/TEMPLATE/RUN-REPORT.md per lo schema. (ADR-032 §C)"`
- 4w.c — `"RUN-REPORT <slug>: review_status: pass incoerente con pre_check_status: <valore> (la review umana parte solo se pre-check pass). Vedi validation/CRITERIA.md §Principio. (ADR-032 §A)"`

**Output format** (sezione `## ERROR non meccanici (manuali)` del report — non `heal-eligible`):

```
- [ERROR][run-report-section-missing][4w] validation/runs/v2.19-tag-run-1/RUN-REPORT.md: sezione §5 (Cosa si è rotto) mancante. Vedi validation/CRITERIA.md §5 + template. (ADR-032 §C)
- [ERROR][run-report-frontmatter-invalid][4w] validation/runs/foo/RUN-REPORT.md: pre_check_status assente. (ADR-032 §C)
- [ERROR][run-report-verdict-incoherent][4w] validation/runs/bar/RUN-REPORT.md: review_status: pass con pre_check_status: pending. (ADR-032 §A)
```

**Scenari di verifica**:

| # | `battle_test_gate.enabled` | file | sezioni | frontmatter | esito atteso |
|---|---|---|---|---|---|
| 1 | `false` (default) | run reale | §3 mancante | ok | no ERROR (gate off, R.P3 — 0 check vs v2.18) |
| 2 | `true` | run reale | tutte §1..§9 | ok + coerente | no ERROR (schema valido) |
| 3 | `true` | run reale | §3 mancante | ok | **ERROR 4w.b** (`run-report-section-missing`) |
| 4 | `true` | run reale | tutte | `pre_check_status` assente | **ERROR 4w.a** (`run-report-frontmatter-invalid`) |
| 5 | `true` | run reale | tutte | `review_status: pass` + `pre_check_status: pending` | **ERROR 4w.c** (`run-report-verdict-incoherent`) |
| 6 | `true` | `TEMPLATE` | con marker `<<...>>` | template | no ERROR (file escluso) |
| 7 | `true` | reference `[REFERENCE-ONLY]` | qualsiasi | ex-post | no ERROR (file escluso, ADR-032 §G) |

**Non duplica** la validazione dello Step 2 della skill `release-validation-gate` (ADR-033 §D):
il `/release` gate è l'**enforcement point primario** (fail-loud a tag-time), il Check 4w è il
**safety net** nel workflow di sviluppo ordinario (segnala lo schema malformato prima che il
maintainer invochi `/release`). La severity è ERROR — non WARNING come il companion Check 4t di
ADR-033 §I sul CHANGELOG — perché schema RUN-REPORT malformato è un bug strutturale, mentre
l'assenza della sezione CHANGELOG è un reminder pre-tag.

**Cross-link**: 4w → schema canonico RUN-REPORT (`validation/runs/TEMPLATE/RUN-REPORT.md`) +
criteri (`validation/CRITERIA.md` §1 §2 §5) + ADR-032 §C (schema 9 sezioni) / §J (questo check) +
ADR-033 (skill `release-validation-gate`, enforcement primario) + ADR-034 (schema sezione
CHANGELOG, Check 4x companion) + US-049 (origine) / US-050 (gate).

### Check 4x — CHANGELOG Validation evidence mancante (WARNING, EP-012 US-050, ADR-033 §I + ADR-034 §A)

> **Nota di numerazione**: TSK-099, ADR-033 §I e US-050 prescrivono questo check come «Check 4t»;
> nel repo corrente lo slot **«4t»** è **riservato** alla migration ADR-050 §I (pre-warning INFO
> opzionale post-upgrade, `compression.migration.audit_after_upgrade`, non ancora implementata),
> mentre gli slot **4q/4r/4s/4u/4v/4w** sono già occupati. Il check adotta quindi il prossimo
> slot libero **4x** preservando l'intento dell'ADR (correzione meccanica di numerazione, non
> cambio di intento — lezione TSK-112/118/122/096). I riferimenti «Check 4t» in TSK-099 / ADR-033 §I /
> US-050, e il riferimento «Check 4t companion» nel Check 4w sopra, vanno intesi come questo **Check 4x**.

**Severità: WARNING — non ERROR** (coerente con R.P3, opt-in totale). Il `/release` gate fa già
fail-loud al momento dell'invocazione (skill `release-validation-gate` Step 5, ADR-033 §D); il lint
è solo un **reminder pre-tag** per il maintainer (companion del Check 4w, che è invece ERROR sullo
schema RUN-REPORT). Mai `heal-eligible` (la compilazione della sezione richiede giudizio semantico
sull'evidenza del run). Distinto da Check 4w: 4w enforce lo schema RUN-REPORT (`validation/runs/**`),
4x enforce la presenza dell'evidenza nel CHANGELOG. [^src: design_&_architecture/decisions/ADR-033.md §I]

**Pattern allineato a Check 4m/4n/4o/4p/4q/4r/4s/4u/4v (R.P3 opt-in totale)**: WARNING-only, opt-in
via flag config, nessun ERROR meccanico. Check 4x eredita la stessa shape per coerenza framework.

**Trigger (AND — tutte le condizioni devono essere vere)**:

```
factory.config.yaml.release_governance.battle_test_gate.enabled == true
AND CHANGELOG.md contiene un heading versione `## v<version>` (es. `## v2.19` o `## v2.19.0`)
AND NON esiste la sub-sezione `## Validation evidence (v<version>)` nel CHANGELOG.md
AND NON esiste il file `validation/release-gates/v<version>/GATE-REPORT.md`
    (ricerca side-by-side: assenza di ENTRAMBI gli artefatti)
AND il blocco release di quella versione NON è esente (vedi §Esenzione)
```

**Gate**: `factory.config.yaml.release_governance.battle_test_gate.enabled: true` (R.P3 opt-in).
A gate `false` (default factory derivate) o assente → 4x no-op totale: nessun WARNING aggiuntivo
vs v2.18 (backward compat ADR-033 §J, R.P3).

**Esenzione**: frontmatter `validation_evidence_skip: true` nel blocco release di `CHANGELOG.md`
(raramente usato, richiede audit reason esplicita). La presenza del marker `[gate-bypassed]` nella
sezione `## Validation evidence (v<version>)` (bypass tracciato, ADR-033 §E) **soddisfa** il check
(la sezione esiste, il bypass è auditato): nessun WARNING.

**Messaggio (template verbatim, placeholder `<version>`)**:

```
CHANGELOG.md v<version>: sezione '## Validation evidence (v<version>)' assente e GATE-REPORT.md non trovato (validation/release-gates/v<version>/). Invocare `/release v<version> --dry-run` prima del tag per produrre l'evidenza. Disabilita Check 4x impostando release_governance.battle_test_gate.enabled: false; esenta la singola release con validation_evidence_skip: true + reason nel blocco CHANGELOG. (ADR-034 §A, ADR-033 §I)
```

**Output format** (sezione `## WARNING (igiene, mai heal-eligible)` del report):

```
- [WARNING][changelog-validation-evidence-missing][4x] CHANGELOG.md v2.20: sezione '## Validation evidence (v2.20)' assente e GATE-REPORT.md non trovato. Invocare `/release v2.20 --dry-run` prima del tag. (ADR-034 §A, ADR-033 §I)
```

**Scenari di verifica**:

| # | `battle_test_gate.enabled` | versione CHANGELOG | sezione `## Validation evidence` | GATE-REPORT.md | esito atteso |
|---|---|---|---|---|---|
| 1 | `false` (default) | `## v2.20` | assente | assente | no WARNING (gate off, R.P3 — 0 check vs v2.18) |
| 2 | `true` | `## v2.20` | presente | (qualsiasi) | no WARNING (evidenza nel CHANGELOG) |
| 3 | `true` | `## v2.20` | assente | presente | no WARNING (evidenza side-by-side in validation/release-gates/) |
| 4 | `true` | `## v2.20` | assente | assente | **WARNING 4x** (`changelog-validation-evidence-missing`) |
| 5 | `true` | `## v2.20` | con marker `[gate-bypassed]` | (qualsiasi) | no WARNING (bypass tracciato, ADR-033 §E) |
| 6 | `true` | `## v2.20` | assente + `validation_evidence_skip: true` | assente | no WARNING (esente, audit reason) |

**Non blocca** il workflow (WARNING-only). L'enforcement è nel comando `/release` (ADR-033, fail-loud
a tag-time). Il Check 4x è il safety net pre-tag nel workflow ordinario, companion del Check 4w
(ERROR sullo schema RUN-REPORT).

**Cross-link**: 4x → ADR-033 §I (questo check candidato) / §D Step 5 (enforcement primario nella skill
`release-validation-gate`) / §E (bypass tracciato) + ADR-034 §A (schema sezione CHANGELOG `## Validation
evidence`) + ADR-036 §B (PATTERN §22 Release Governance) + Check 4w (companion ERROR, RUN-REPORT schema) +
US-050 (origine).

---

## Check 4al — CHANGELOG ↔ GATE-REPORT coerenza (ERROR se GATE mancante, WARNING se bypass — EP-049 US-179)

**Trigger**: sempre attivo — nessun flag richiesto. L'invariante di gate è un contratto di
governance non configurabile: ogni dichiarazione "Gate vX PASS" nel CHANGELOG deve avere
un artefatto GATE-REPORT corrispondente.
**Severità**: ERROR (GATE-REPORT mancante) / WARNING (GATE-REPORT con `verdict: bypass`).
**Esenzione**: versioni v2.18 e precedenti — nessun check (il GATE-REPORT formale non esisteva).
**Audience**: maintainer che producono release dichiarando "Gate vX PASS" nel CHANGELOG.

### Algoritmo

1. **Leggi** `CHANGELOG.md` (se assente → skip silenzioso, 0 ERROR/WARNING).
2. **Scansiona** per pattern `Gate v([0-9]+\.[0-9]+) PASS` (regex, case-sensitive).
3. Per ogni versione `vX` trovata:
   - **Esenzione**: se la parte minor è ≤ 18 con major 2 (es. v2.18, v2.17 ...) → skip silenzioso (nessun check).
   - Verifica esistenza di `validation/release-gates/vX/GATE-REPORT.md`.
   - File **assente** → **ERROR** `changelog-gate-report-missing`:
     `"CHANGELOG dichiara Gate vX PASS ma validation/release-gates/vX/GATE-REPORT.md mancante"`
   - File **presente** ma contiene la stringa `verdict: bypass` → **WARNING** `changelog-gate-report-bypass`:
     `"GATE-REPORT vX ha verdict: bypass (non pass)"`
   - File presente con qualsiasi altro `verdict:` (tipicamente `verdict: pass`) → OK, skip.

### Invarianti

- **Always-on**: nessun gate config — il check rispecchia un'invariante di governance non configurabile
  (distinto da 4w/4x che sono gated da `battle_test_gate.enabled`).
- **Esenzione v2.18-**: le versioni v2.18 e precedenti (minor ≤ 18, major 2) sono esenti; non
  avevano il GATE-REPORT formale. Versioni con major diverso da 2 seguono la stessa logica:
  solo versioni ≥ v2.19 (nel ramo v2.*) sono soggette al check.
- **Mai heal-eligible**: la creazione del GATE-REPORT richiede giudizio semantico (contenuto del run).
- **Read-only**: legge solo `CHANGELOG.md` e `validation/release-gates/*/GATE-REPORT.md`.
- **Graceful degradation**: `CHANGELOG.md` assente → skip silenzioso (0 check, 0 ERROR/WARNING).

### Rilevamento pattern (pseudocodice)

```
if not exists("CHANGELOG.md"):
    return  # graceful degradation

content = read("CHANGELOG.md")
matches = findall(r"Gate v([0-9]+\.[0-9]+) PASS", content)

for version_str in matches:
    major, minor = version_str.split(".")
    if int(major) == 2 and int(minor) <= 18:
        continue  # esenzione v2.18-

    gate_report_path = f"validation/release-gates/v{version_str}/GATE-REPORT.md"

    if not exists(gate_report_path):
        emit ERROR changelog-gate-report-missing
    elif "verdict: bypass" in read(gate_report_path):
        emit WARNING changelog-gate-report-bypass
    # else: verdict: pass o altro valore valido → OK
```

### Output format

```
## ERROR non meccanici (manuali)
- [ERROR][changelog-gate-report-missing][4al] CHANGELOG dichiara Gate v2.20 PASS ma validation/release-gates/v2.20/GATE-REPORT.md mancante.

## WARNING (igiene, mai heal-eligible)
- [WARNING][changelog-gate-report-bypass][4al] GATE-REPORT v2.19 ha verdict: bypass (non pass).
```

### Scenari di verifica

| # | CHANGELOG contiene | GATE-REPORT esiste | `verdict:` | versione | esito atteso |
|---|---|---|---|---|---|
| 1 | `Gate v2.19 PASS` | no | — | v2.19 | **ERROR 4al** (GATE-REPORT mancante) |
| 2 | `Gate v2.19 PASS` | si | `pass` | v2.19 | no ERROR/WARNING (GATE-REPORT presente e valido) |
| 3 | `Gate v2.19 PASS` | si | `bypass` | v2.19 | **WARNING 4al** (GATE-REPORT con bypass) |
| 4 | `Gate v2.18 PASS` | no | — | v2.18 | no check (versione esente ≤ v2.18) |
| 5 | `Gate v2.17 PASS` | no | — | v2.17 | no check (versione esente ≤ v2.18) |
| 6 | nessun pattern `Gate vX PASS` | — | — | — | no ERROR/WARNING (nessuna dichiarazione gate) |
| 7 | CHANGELOG assente | — | — | — | no ERROR/WARNING (graceful degradation) |
| 8 | `Gate v2.33 PASS` | no | — | v2.33 | **ERROR 4al** (GATE-REPORT mancante, versione ≥ v2.19) |
| 9 | `Gate v2.33 PASS` | si | `bypass` | v2.33 | **WARNING 4al** (GATE-REPORT con bypass) |
| 10 | `Gate v2.33 PASS` | si | `pass` | v2.33 | no ERROR/WARNING (GATE-REPORT valido) |

### Cross-link

4al → `CHANGELOG.md` (fonte) + `validation/release-gates/*/GATE-REPORT.md` (artefatto atteso) +
EP-049 (Governance Enforcement) + US-179 (origine) + Check 4w (companion: schema RUN-REPORT,
EP-012) + Check 4x (companion: CHANGELOG validation evidence, EP-012) +
skill `release-validation-gate.md` (enforcement primario a tag-time).

---

## Check 4am — Versioni divergenti da factory.config.yaml (WARNING, always-on — EP-052 US-187)

**Trigger**: sempre attivo — nessun flag richiesto. Fonte di verità: `factory.config.yaml.pattern_version`.
**Severità**: WARNING — non ERROR (le versioni nei commenti storici non devono bloccare la factory). Non `heal-eligible` (il bump manuale richiede giudizio).
**Esenzioni**: `CHANGELOG.md` (contiene versioni storiche per natura — non viene scansionato).
**Audience**: maintainer che producono release e bump di versione.

### Algoritmo

1. **Leggi** `factory.config.yaml` → campo `pattern_version` (es. `"2.33"`). Se assente → skip silenzioso (graceful degradation).
2. **Costruisci il pattern** di versione attesa: `vX.Y` dove `X.Y = pattern_version` (es. `v2.33`).
3. **Scansiona i file soggetti a check**:
   - `PATTERN.md` — cerca la versione nel primo heading `#` (regex `^# .*v[0-9]+\.[0-9]+`).
   - `CLAUDE.md` — cerca la versione nell'intestazione della sezione `## Meta-prompt versioning` (prima occorrenza, regex `## Meta-prompt versioning \(v([0-9]+\.[0-9]+)`).
   - `management/kanban/sprint.md` frontmatter — campo `version:` (se valorizzato).
4. Per ogni file soggetto a check:
   - Estrai la versione dichiarata (primo match del pattern `v[0-9]+\.[0-9]+` nel contesto indicato).
   - Se la versione estratta è diversa da `vX.Y` (confronto string) →
     **WARNING** con messaggio: `"<file> dichiara versione X.Y divergente da factory.config.yaml (pattern_version: Z.W)"`
5. **CHANGELOG.md è esente** — non viene scansionato (contiene versioni storiche per natura).

### Invarianti

- **Warning-only**: mai ERROR — le versioni in contesti storici non devono bloccare la factory. Non `heal-eligible` (il bump richiede giudizio sul repo completo).
- **Esenzione CHANGELOG.md**: la cronologia della release history è legittima per natura, non viene mai flaggata.
- **SSOT**: `factory.config.yaml.pattern_version` è la fonte autoritativa; gli altri file sono verificati contro di essa.
- **Skip silenzioso**: se `pattern_version` è assente in `factory.config.yaml` → 0 WARNING (graceful degradation).
- **Confronto solo major.minor**: il pattern `v[0-9]+\.[0-9]+` cattura la versione significativa (es. `v2.33`); patch opzionale non considerata.

### Output format

```
## WARNING (igiene, mai heal-eligible)
- [WARNING][version-divergent][4am] PATTERN.md: dichiara versione v2.32 divergente da factory.config.yaml (pattern_version: 2.33)
- [WARNING][version-divergent][4am] CLAUDE.md: dichiara versione v2.32 divergente da factory.config.yaml (pattern_version: 2.33)
```

### Scenari di verifica

| # | `pattern_version` | PATTERN.md header | CLAUDE.md `## Meta-prompt versioning` | `sprint.md version:` | CHANGELOG.md | esito atteso |
|---|---|---|---|---|---|---|
| 1 | `"2.33"` | `v2.33` | `v2.33` | assente | `v2.32`, `v2.31` | no WARNING (CHANGELOG esente, altri allineati) |
| 2 | `"2.33"` | `v2.32` | `v2.33` | assente | — | **WARNING 4am** (PATTERN.md divergente) |
| 3 | `"2.33"` | `v2.33` | `v2.32` | assente | — | **WARNING 4am** (CLAUDE.md divergente) |
| 4 | `"2.33"` | `v2.33` | `v2.33` | `"2.32"` | — | **WARNING 4am** (sprint.md divergente) |
| 5 | assente | qualsiasi | qualsiasi | qualsiasi | — | no WARNING (graceful degradation) |
| 6 | `"2.33"` | `v2.33` | `v2.33` | assente | qualsiasi | no WARNING (CHANGELOG esente) |

### Cross-link

4am → `factory.config.yaml.pattern_version` (SSOT versioning) + `PATTERN.md` (header versione) +
`CLAUDE.md` (sezione Meta-prompt versioning) + `management/kanban/sprint.md` (frontmatter version) +
EP-052 (Tech Debt Cleanup) + US-187 (versioning canonico) + skill `bump-version` (procedura allineamento).
