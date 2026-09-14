# Foglia .claude/-Ancorata — TSK-552 Testbed

> SUNSET-EXEMPT (test-only) — TSK-552 EP-060 US-236
>
> Questo file è la foglia dummy nella forma POST-FIX citata da
> `pattern-b-testbed.md` con path `.claude/`-ancorato.
>
> Il path citato nel corpo dell'agente iniettato è:
> `.claude/agents/references/pattern-b-testbed/foglia-claude-ancorato.md`
>
> Essendo `.claude/`-ancorato, il subagent può raggiungerlo da cwd=root.
> G11 → PASS su questo target.
>
> Per rieseguire il ciclo completo FAIL→PASS del testbed:
> 1. Rinomina questo file in `foglia-agent-relative.md`
> 2. Aggiorna la citazione nel body di `pattern-b-testbed.md`
> 3. Esegui `python3 tools/refactor/mappa_riferimenti.py .claude/ --gate` → FAIL
> 4. Ripristina il fix → PASS
