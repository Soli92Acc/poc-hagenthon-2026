"""
Test suite automatizzata per il meta-framework soli-multi-agents-factory.

Verifica le invarianti core (INV-RM-1..5, ADR-EP047-001) e la struttura
minimale richiesta dal PATTERN v2.32:

  - factory.config.yaml: YAML valido, campi obbligatori, coerenza interna
  - Invarianti reflexive-mode (INV-RM-2, INV-RM-4)
  - Struttura wiki/ e management/kanban/
  - Agenti .claude/agents/ obbligatori e formato frontmatter

Eseguire dalla root del repo:
    pytest tools/tests/test_meta_framework.py

Dipendenze: stdlib + pytest + pyyaml (gia' in tools/requirements.txt).
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest
import yaml

# ---------------------------------------------------------------------------
# Root del repo: ancorata al file test, funziona da qualsiasi clone
# tools/tests/test_meta_framework.py -> tools/tests/ -> tools/ -> repo-root
# ---------------------------------------------------------------------------
REPO_ROOT: Path = Path(__file__).parent.parent.parent


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _load_config() -> dict[str, Any]:
    """Carica factory.config.yaml e restituisce il dict parsato."""
    config_path = REPO_ROOT / "factory.config.yaml"
    with config_path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    assert isinstance(data, dict), "factory.config.yaml deve essere un mapping YAML"
    return data


def _has_frontmatter_field(content: str, field: str) -> bool:
    """Ritorna True se il file ha frontmatter YAML con il campo specificato."""
    if not content.startswith("---"):
        return False
    end = content.find("---", 3)
    if end == -1:
        return False
    frontmatter_block = content[3:end]
    try:
        fm = yaml.safe_load(frontmatter_block)
        return isinstance(fm, dict) and field in fm
    except yaml.YAMLError:
        return False


# ---------------------------------------------------------------------------
# Classe 1 — factory.config.yaml: struttura e coerenza (INV-RM-1..5)
# ---------------------------------------------------------------------------


class TestFactoryConfigStructure:
    """Struttura e coerenza di factory.config.yaml (INV-RM-1..5, PATTERN §13)."""

    def test_config_file_exists(self) -> None:
        """La factory.config.yaml esiste alla root del repo (INV-RM-1)."""
        assert (REPO_ROOT / "factory.config.yaml").is_file(), (
            "factory.config.yaml non trovata in " + str(REPO_ROOT)
        )

    def test_config_is_valid_yaml(self) -> None:
        """factory.config.yaml e' YAML valido e leggibile senza errori di parsing."""
        config = _load_config()
        assert isinstance(config, dict)

    def test_required_top_level_fields(self) -> None:
        """I campi obbligatori esistono: topology, stack_mode, routing, scheduler."""
        config = _load_config()
        required = ("topology", "stack_mode", "routing", "scheduler")
        missing = [f for f in required if f not in config]
        assert not missing, f"Campi obbligatori mancanti in factory.config.yaml: {missing}"

    def test_code_paths_is_list(self) -> None:
        """code_paths e' una lista (non null, non scalare)."""
        config = _load_config()
        assert "code_paths" in config, "Campo 'code_paths' assente in factory.config.yaml"
        assert isinstance(config["code_paths"], list), (
            f"code_paths deve essere una lista, trovato: {type(config['code_paths']).__name__}"
        )

    def test_code_paths_entries_schema(self) -> None:
        """Ogni entry in code_paths ha i campi obbligatori: name, path, layers."""
        config = _load_config()
        for i, entry in enumerate(config.get("code_paths", [])):
            for field in ("name", "path", "layers"):
                assert field in entry, (
                    f"code_paths[{i}] (name={entry.get('name', '?')!r}) manca del campo '{field}'"
                )
            assert isinstance(entry["layers"], list), (
                f"code_paths[{i}].layers deve essere una lista, "
                f"trovato: {type(entry['layers']).__name__}"
            )

    def test_stack_frontend_valorizzato_when_fe_entry_present(self) -> None:
        """stack.frontend e' valorizzato se esiste almeno un'entry con layer 'fe'."""
        config = _load_config()
        code_paths = config.get("code_paths", [])
        has_fe_entry = any("fe" in (e.get("layers") or []) for e in code_paths)
        if has_fe_entry:
            frontend = config.get("stack", {}).get("frontend", "")
            assert frontend, (
                "stack.frontend deve essere valorizzato (non stringa vuota) quando "
                "esiste almeno un'entry con layer 'fe' in code_paths"
            )

    def test_code_quality_enabled_iff_dev_layer_in_code_paths(self) -> None:
        """code_quality.enabled e' true sse esiste almeno un'entry con layer be/fe/db."""
        config = _load_config()
        cq_enabled = bool(config.get("code_quality", {}).get("enabled", False))
        dev_layers = {"be", "fe", "db"}
        has_dev_entry = any(
            bool(set(e.get("layers") or []) & dev_layers)
            for e in config.get("code_paths", [])
        )
        assert cq_enabled == has_dev_entry, (
            f"code_quality.enabled={cq_enabled} non e' coerente con la presenza di "
            f"entry be/fe/db in code_paths (atteso: {has_dev_entry}). "
            "Aggiorna code_quality.enabled dopo aver modificato code_paths."
        )


# ---------------------------------------------------------------------------
# Classe 2 — Invarianti reflexive-mode (ADR-EP047-001)
# ---------------------------------------------------------------------------


class TestReflexiveModeInvariants:
    """Invarianti del reflexive-mode: sentinel code_path '.' + code_paths (ADR-EP047-001)."""

    def test_inv_rm2_no_dot_entry_in_code_paths_when_legacy_dot(self) -> None:
        """INV-RM-2: se code_path == '.' e code_paths non-vuoto, nessuna entry ha path '.'."""
        config = _load_config()
        legacy_path = config.get("code_path", "")
        code_paths = config.get("code_paths", [])
        if legacy_path == "." and code_paths:
            dot_entries = [e for e in code_paths if e.get("path") == "."]
            assert not dot_entries, (
                "INV-RM-2 violata: con code_path='.' e code_paths non-vuoto, "
                "nessuna entry di code_paths puo' avere path='.'. "
                "Entries in violazione: " + str([e.get("name") for e in dot_entries])
            )

    def test_inv_rm4_prototyping_enabled_requires_fe_react_stack(self) -> None:
        """INV-RM-4: prototyping.enabled=true richiede entry FE in code_paths con stack react."""
        config = _load_config()
        prototyping_enabled = bool(config.get("prototyping", {}).get("enabled", False))
        if not prototyping_enabled:
            pytest.skip("prototyping.enabled=false: INV-RM-4 trivialmente soddisfatta")
        code_paths = config.get("code_paths", [])
        has_fe_entry = any("fe" in (e.get("layers") or []) for e in code_paths)
        frontend_stack = config.get("stack", {}).get("frontend", "")
        has_react = "react" in frontend_stack.lower()
        assert has_fe_entry and has_react, (
            "INV-RM-4 violata: prototyping.enabled=true richiede un'entry FE in "
            f"code_paths E stack.frontend contenente 'react'. "
            f"has_fe_entry={has_fe_entry}, has_react={has_react} "
            f"(stack.frontend={frontend_stack!r})"
        )

    def test_routing_agent_layers_have_agent_files(self) -> None:
        """Se routing.<layer> == 'agent', il file agente <layer>-dev.md deve esistere."""
        config = _load_config()
        routing = config.get("routing", {})
        agents_dir = REPO_ROOT / ".claude" / "agents"
        dev_layers = ("be", "fe", "db", "qa")
        for layer in dev_layers:
            if routing.get(layer) == "agent":
                agent_file = agents_dir / f"{layer}-dev.md"
                assert agent_file.is_file(), (
                    f"routing.{layer}='agent' ma {agent_file.name} non trovato in "
                    f".claude/agents/ (PATTERN §7 r.1)"
                )


# ---------------------------------------------------------------------------
# Classe 3 — Struttura wiki/ e management/kanban/
# ---------------------------------------------------------------------------


class TestWikiAndKanbanStructure:
    """Struttura minima di wiki/ e management/kanban/ (PATTERN §8)."""

    def test_wiki_log_exists(self) -> None:
        """wiki/log.md esiste (log append-only, PATTERN §8)."""
        assert (REPO_ROOT / "wiki" / "log.md").is_file(), (
            "wiki/log.md non trovato — il log append-only e' obbligatorio"
        )

    def test_wiki_index_exists(self) -> None:
        """wiki/index.md esiste (entry point del wiki, PATTERN §8)."""
        assert (REPO_ROOT / "wiki" / "index.md").is_file(), (
            "wiki/index.md non trovato — l'indice wiki e' obbligatorio"
        )

    def test_kanban_has_ep_directories(self) -> None:
        """management/kanban/ contiene almeno una directory EP-* (kanban PATTERN §5)."""
        kanban_dir = REPO_ROOT / "management" / "kanban"
        assert kanban_dir.is_dir(), (
            "management/kanban/ non trovata — la struttura kanban e' obbligatoria"
        )
        ep_dirs = [d for d in kanban_dir.iterdir() if d.is_dir() and d.name.startswith("EP-")]
        assert ep_dirs, (
            "management/kanban/ non contiene directory EP-* — "
            "serve almeno un'epica per avere un kanban valido"
        )


# ---------------------------------------------------------------------------
# Classe 4 — Agenti .claude/agents/
# ---------------------------------------------------------------------------


class TestAgents:
    """Presenza e formato degli agenti obbligatori in .claude/agents/ (PATTERN §2)."""

    CORE_AGENTS = ("orchestrator", "wiki-keeper", "product-manager", "tpm")

    def test_core_agents_files_exist(self) -> None:
        """Gli agenti core obbligatori esistono: orchestrator, wiki-keeper, product-manager, tpm."""
        agents_dir = REPO_ROOT / ".claude" / "agents"
        for agent in self.CORE_AGENTS:
            agent_file = agents_dir / f"{agent}.md"
            assert agent_file.is_file(), (
                f"Agente core obbligatorio mancante: .claude/agents/{agent}.md"
            )

    def test_all_agent_files_have_name_or_h1(self) -> None:
        """Ogni file agente ha frontmatter YAML con 'name:' oppure un header H1 # ..."""
        agents_dir = REPO_ROOT / ".claude" / "agents"
        violations: list[str] = []
        for agent_file in sorted(agents_dir.glob("*.md")):
            content = agent_file.read_text(encoding="utf-8")
            has_name = _has_frontmatter_field(content, "name")
            has_h1 = bool(re.search(r"^# .+", content, re.MULTILINE))
            if not (has_name or has_h1):
                violations.append(agent_file.name)
        assert not violations, (
            "I seguenti file agente non hanno ne' 'name:' nel frontmatter YAML "
            "ne' un header H1: " + str(violations)
        )


# ---------------------------------------------------------------------------
# Classe 5 — Adapter registry (Sprint 1 agnosticism)
# ---------------------------------------------------------------------------


class TestAdapterRegistry:
    """Manifest + capability matrix + check-adapter-lag.py."""

    EXPECTED = ("claude", "cursor", "aider", "openai", "gemini", "chatgpt")

    def test_capability_matrix_exists(self) -> None:
        path = REPO_ROOT / "adapters" / "capability-matrix.yaml"
        assert path.is_file(), "adapters/capability-matrix.yaml mancante"

    def test_all_expected_manifests_exist(self) -> None:
        for name in self.EXPECTED:
            path = REPO_ROOT / "adapters" / name / "manifest.yaml"
            assert path.is_file(), f"manca adapters/{name}/manifest.yaml"

    def test_manifests_declare_orchestration_profile(self) -> None:
        valid = {"native", "sequential", "external", "viewer"}
        for name in self.EXPECTED:
            data = yaml.safe_load(
                (REPO_ROOT / "adapters" / name / "manifest.yaml").read_text(encoding="utf-8")
            )
            orch = data.get("orchestration") or {}
            profile = orch.get("profile")
            assert profile in valid, f"{name}: orchestration.profile={profile!r}"

    def test_aider_is_core_lts(self) -> None:
        data = yaml.safe_load(
            (REPO_ROOT / "adapters" / "aider" / "manifest.yaml").read_text(encoding="utf-8")
        )
        assert data.get("maturity") == "core"
        assert (data.get("orchestration") or {}).get("profile") == "sequential"

    def test_check_adapter_lag_exits_zero(self) -> None:
        script = REPO_ROOT / "tools" / "adapters" / "check-adapter-lag.py"
        result = subprocess.run(
            [sys.executable, str(script)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 0, (
            f"check-adapter-lag.py failed ({result.returncode}):\n"
            f"{result.stdout}\n{result.stderr}"
        )

    def test_claude_tools_are_thin_shims(self) -> None:
        claude_tools = REPO_ROOT / ".claude" / "tools"
        fat: list[str] = []
        for path in sorted(claude_tools.rglob("*")):
            if not path.is_file() or path.name == "README.md" or "__pycache__" in path.parts:
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            if "Shim:" not in text or len(text.splitlines()) > 20:
                fat.append(str(path.relative_to(REPO_ROOT)))
        assert not fat, f"Non-shim or fat files under .claude/tools/: {fat}"

    def test_canonical_runtime_and_token_ledger_exist(self) -> None:
        assert (REPO_ROOT / "tools" / "runtime" / "suggest-next.py").is_file()
        assert (REPO_ROOT / "tools" / "analytics" / "show-session-tokens.py").is_file()

    def test_config_tools_paths_are_canonical(self) -> None:
        cfg = _load_config()
        analytics = ((cfg.get("analytics") or {}).get("measurement") or {})
        tools_dir = str(analytics.get("tools_dir", ""))
        assert tools_dir.startswith("tools/"), f"tools_dir should be under tools/: {tools_dir!r}"
        temporal = ((cfg.get("temporal") or {}).get("context_injection") or {})
        helper = str(temporal.get("helper_path", ""))
        # helper may live under temporal.context_injection or temporal root — accept either
        if not helper:
            helper = str((cfg.get("temporal") or {}).get("helper_path", ""))
        if helper:
            assert helper.startswith("tools/"), f"helper_path should be under tools/: {helper!r}"
