# presentation/ — Deliverable e documentazione di progetto

Cartella dei materiali di presentazione del PoC **NumeriMiei** (Hagenthon 2026, Tema 03).
Registrata in `factory.config.yaml` come code_path `presentation` (layer `docs`).

## Contenuto atteso

| File | TSK | Quando |
|---|---|---|
| `numerimiei-deck.html` — deck proiettabile, 6 slide | TSK-025 (slide 1-2), TSK-026 (slide 3-6) | slide 1-2 a 0:10-0:15; slide 3-6 nel buffer 3:30-4:00 |
| `numerimiei-deck.md` — controparte testuale, sorgente per l'export PPT | come sopra | va tenuta allineata all'HTML |
| `demo-script.html` | TSK-022 | blocco demo prep, 4:00-4:15 |

Qui va anche il resto della documentazione di progetto prodotta durante l'hackathon.

## Vincoli

- Il contenuto del deck è **assemblaggio** di materiale gia' scritto nel registro
  decisioni Round 2 (`wiki/decisions/tavola-rotonda-e3f2a1b4-*.md`), non stesura ex novo.
- Tetto 5 slide (6-7 solo se avanza tempo).
- **Il dry run offline (TSK-024) non si sacrifica per il deck.** Se il deck non e'
  pronto, si presenta senza deck.
- Nessun termine clinico nei materiali: vale la stessa denylist del prodotto.
  NumeriMiei e' uno strumento didattico compensativo, mai diagnostico.
  (Nota: nessun gate automatico scandisce `presentation/` — il vincolo e' redazionale.
  Le occorrenze di «diagnosi» / «riabilitazione clinica» nel deck sono ammesse solo
  dove *dichiarano il confine*, mai dove descrivono il prodotto.)

## Brand

Deck brandizzato Accenture: viola core `#A100FF` come accento, marchio in basso a
destra su ogni slide interna e in alto a sinistra sulla copertina.

Il marchio e' una **ricostruzione tipografica** (`accenture` in sans di sistema +
chevron viola sopra la «t»), non l'asset ufficiale: il repo non contiene file di brand.
Per sostituirlo, in `numerimiei-deck.html` cerca il commento `NOTA:` sopra la regola
`.acn-mark` — indica il punto esatto in cui innestare l'SVG ufficiale.
