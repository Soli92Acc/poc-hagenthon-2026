---
skill: lint-checks-wiki-structure
part_of: lint-checks (modular)
family: wiki-structure
parent: lint-checks
description: "Check lint su struttura pagine wiki — check-family wiki-structure"
---

# Lint Checks — Wiki Structure

> Parte del sistema modulare lint-checks. File principale: `.claude/skills/lint-checks.md`
> Contiene: Check 1 (orphan + broken-link), Check 4 base (coerenza wiki ↔ kanban), Check 4ag (staleness, always-on), Check 4af (embedding similarity, INFO/opt-in)

Check ordinati per severità: ERROR → WARNING → INFO.

---

## Check 1 — Orphan + wikilink (scan unico)

1. `Glob wiki/**/*.md` (escludi `log.md`, `index.md`, `query/`, `lint/`).
2. Read `wiki/index.md`, estrai tutti i `[[…]]` e i path linkati.
3. Per ogni file: se non è linkato dall'index → **WARNING orphan**.
4. Read ogni pagina wiki: estrai `\[\[([^\]]+)\]\]`. Per ogni wikilink: verifica
   esista un file con slug corrispondente.
   - Wikilink che non risolve → **ERROR broken-link**.

## Check 4 — Coerenza wiki ↔ kanban

- Ogni US referenzia una pagina wiki: la pagina esiste?
- Ogni `## Storie collegate` in wiki ha solo storie esistenti?

## Check 4ag — Staleness Threshold Wiki Pages (WARNING, always-on — EP-031 segnale economico)

**Trigger**: sempre attivo — nessun flag richiesto. Segnale economico complementare a Check 4af.
**Severità**: WARNING — blocca lint se sopra threshold critico (> 365 gg), altrimenti INFO.
**Audience**: maintainer che monitorano l'aggiornamento del corpus wiki.

### Razionale (ADR-EP031-001)

Implementa il segnale economico della piramide BM25→dense→LLM-judge: staleness è
gratuito, deterministico, zero falsi positivi del tipo "mapping errato", e scala a corpus
infinito senza costo API. Complementa Check 4af (embedding/LLM-judge) che rileva drift
semantico ma ha costo variabile.

### Algoritmo

1. **Scansiona** `wiki/**/*.md` (escludi `log.md`, `lint/`, `sources/`, `index.md`).
2. **Leggi** il campo `updated:` (o `created:` se `updated:` assente) dal frontmatter YAML.
3. **Calcola** `age_days = today − updated`.
4. **Emetti** in base all'età:
   - `age_days > 365` → **WARNING** `[Check 4ag] STALE: <path> — ultimo aggiornamento <N> giorni fa (soglia: 365)`
   - `age_days > 180` → **INFO** `[Check 4ag] INFO: <path> — non aggiornata da <N> giorni (soglia: 180)`
   - `age_days ≤ 180` → skip silenzioso.
5. **Pagine senza `updated:` e senza `created:`** → **WARNING** `[Check 4ag] MISSING-DATE: <path>`.

### Invarianti

- **Zero API call**: staleness è puro confronto di date — nessuna dipendenza esterna.
- **Deterministico**: stessa wiki + stessa data → stesso output (diversamente da LLM-judge).
- **Non blocca il lint totale**: le WARNING 4ag non impediscono il completamento degli altri check.
- **Esclusione lint/ e sources/**: i report di lint e i sorgenti raw non sono soggetti a staleness check.

### Relazione con Check 4af

Check 4ag e 4af sono complementari, non alternativi:
- **4ag** (staleness) → segnale economico, always-on, rileva pagine non toccate → suggerisce revisione.
- **4af** (embedding/LLM-judge) → segnale semantico, opt-in, rileva contenuto obsoleto anche se recentemente modificato.

## Check 4af — Embedding Similarity Wiki vs PATTERN (INFO only, sperimentale — EP-031 research)

**Trigger**: `wiki_lint.semantic_check.enabled: true` (default: false → skip totale)
**Severità**: INFO — mai WARNING, mai ERROR. Non blocca pipeline. Non è criterio di gate.
**Audience**: maintainer e operatori che vogliono monitorare la deriva semantica della wiki.

### Algoritmo

1. **Scopri pagine candidate**: scansiona `wiki/**/*.md` con frontmatter `pattern_section: "§N"`.
   Pagine senza questo campo → skip silenzioso per quella pagina.
2. **Calcola embedding**: per ogni pagina candidata:
   - Embedding A = embedding del testo completo della pagina wiki.
   - Embedding B = embedding del testo della sezione `§N` estratta da `PATTERN.md`.
3. **Confronta similarità coseno**: `score = cosine_similarity(A, B)`.
4. **Emetti INFO se score < threshold** (default 0.75):
   ```
   INFO [Check 4af] wiki/concepts/compression-layer.md — §20 — score: 0.61 (< 0.75)
   ```
5. **Stima costo**: prima del scan, stima N_pagine × costo_per_embedding e confronta
   con `wiki_lint.semantic_check.cost_warn_usd`. Se costo_stimato > soglia → chiedi
   conferma esplicita (WARNING separato, non bloccante).
6. **Scrivi report** (se `output_report: true`):
   `<output_report_path>/wiki-lint-semantic-<YYYY-MM-DD>.md` — tabella con tutte le
   pagine sotto soglia ordinate per score crescente.

### Invarianti

- **No API call a flag spento**: `enabled: false` → zero chiamate embedding, zero side effect.
- **No ERROR mai**: questo check non cambia severità da INFO a WARNING/ERROR anche in futuro,
  finché EP-031 US-109 ADR non verte a GO con calibrazione validata.
- **Idempotente**: due run sulla stessa wiki e PATTERN.md producono lo stesso report.
- **Skip silenzioso su pagine senza `pattern_section:`**: non è un error, è una scelta del maintainer.

### Dipendenza esterna

Embedding API (Voyage-3 via Anthropic o configurabile via `embedding_model`). Se l'API
non è raggiungibile → WARNING separato + skip del check (graceful degradation, non fail-loud).
