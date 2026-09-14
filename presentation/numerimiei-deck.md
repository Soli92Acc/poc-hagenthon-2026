# NumeriMiei — Hagenthon 2026 — Tema 03

---

## Slide 1 — Copertina

### NumeriMiei

**Coach di calcolo che spiega l'errore giusto allo studente con discalculia**

Hagenthon 2026 — Tema 03

---

## Slide 2 — LPS Luca (Learner Profile Sheet)

**Luca, 11 anni, classe 1ª media**

- Diagnosi: discalculia certificata (ASL, PDP 2025)
- Difficoltà specifica: confronto di frazioni con denominatori diversi
- Misconcepto attivo: *denominator magnitude error*

> "La 1/4 è più grande perché 4 è più grande di 3"

**Scenario concreto (30 secondi):**
Luca risponde guardando il denominatore più grande.
NumeriMiei rileva il misconcepto e propone la spiegazione giusta per quel tipo di errore — non una spiegazione generica.

---

## Slide 3 — Adaptive Evidence (Deliverable 02)

**Stesso step, stesso errore → spiegazione diversa per livello**

| L1 — denominator_magnitude | L2 — denominator_magnitude |
|---|---|
| "Attenzione: un denominatore più grande significa pezzi più piccoli! Guarda la linea." | "Guarda i pezzi, non solo il numero in basso. Più pezzi uguali = pezzi più piccoli." |

La chiave fixture è `step1-L1-denominator_magnitude` vs `step1-L2-denominator_magnitude`.
Due risposte diverse dallo stesso misconcepto slug, in base al livello PDP.

---

## Slide 4 — Learning Outcome Note (Deliverable 03)

**Prima:** Luca risponde guardando il denominatore più grande.

**Dopo:** Usa la linea delle frazioni autonomamente su un item non visto (1/5 vs 1/6).

**Transfer task:** 30 secondi per verificare il transfer senza scaffolding.

**Cosa è cambiato:** ha imparato a usare uno strumento già previsto dal PDP (linea delle frazioni), non gli abbiamo insegnato un nuovo contenuto.

**Caveat:** NumeriMiei potenzia l'uso di uno strumento già previsto dal PDP. Non è riabilitazione clinica.

---

## Slide 5 — Extension Points + Confine Clinico

**Extension Points:**

- EP-1: Aggiungi un tipo di errore → nuovo `misconcepto_slug` nel curriculum JSON
- EP-2: Aggiungi un distractor → modifica JSON → reload → appare (30 secondi)
- EP-3: Nuova area matematica → nuovo `curriculum-*.json`
- EP-4: Nuova lingua → nuovi label nei distractors

**Confine clinico verificabile:**

```
grep -c "getSafeRemediation" app.js   # → 1 (unico call site)
grep -rn "setItem.*pdpLevel" app.js   # → 1 (unico writer)
```

Denylist deterministico. Nessun testo clinico raggiunge il DOM per strade diverse da `getSafeRemediation()`.
Verificabile senza eseguire nulla di LLM.
