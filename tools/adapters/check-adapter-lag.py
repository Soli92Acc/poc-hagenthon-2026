#!/usr/bin/env python3
"""
check-adapter-lag.py — adapter registry health vs capability matrix (Sprint 1).

Reads:
  - factory.config.yaml → pattern_version
  - adapters/capability-matrix.yaml
  - adapters/*/manifest.yaml

Exit codes:
  0 — OK (warnings allowed)
  1 — errors (missing required fields / unknown maturity / broken registry)
  2 — usage / IO failure

Run from repo root:
  python3 tools/adapters/check-adapter-lag.py
  python3 tools/adapters/check-adapter-lag.py --strict   # warnings → exit 1
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required (pip install -r tools/requirements.txt)", file=sys.stderr)
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parents[2]
ADAPTERS_DIR = REPO_ROOT / "adapters"
MATRIX_PATH = ADAPTERS_DIR / "capability-matrix.yaml"
CONFIG_PATH = REPO_ROOT / "factory.config.yaml"

VALID_MATURITY = {"full", "core", "partial", "manifest-only"}
VALID_PROFILES = {"native", "sequential", "external", "viewer"}
REQUIRED_FEATURES = (
    "local_fs_read",
    "local_fs_write",
    "subagent_fanout",
    "parallel_dispatch",
    "hooks",
    "mcp",
    "shell",
)


def _load_yaml(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: expected mapping at root")
    return data


def _parse_version(v: Any) -> tuple[int, ...]:
    s = str(v).strip().lstrip("v")
    parts: list[int] = []
    for p in s.split("."):
        digits = "".join(c for c in p if c.isdigit())
        parts.append(int(digits) if digits else 0)
    return tuple(parts) if parts else (0,)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as errors (exit 1)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print machine-readable summary on stdout",
    )
    args = parser.parse_args()

    errors: list[str] = []
    warnings: list[str] = []

    if not MATRIX_PATH.is_file():
        print(f"ERROR: missing {MATRIX_PATH}", file=sys.stderr)
        return 2
    if not CONFIG_PATH.is_file():
        print(f"ERROR: missing {CONFIG_PATH}", file=sys.stderr)
        return 2

    try:
        matrix = _load_yaml(MATRIX_PATH)
        config = _load_yaml(CONFIG_PATH)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: failed to parse YAML: {exc}", file=sys.stderr)
        return 2

    pattern_version = str(config.get("pattern_version", "0"))
    matrix_ref = str(matrix.get("pattern_version_ref", "0"))
    if _parse_version(pattern_version) != _parse_version(matrix_ref):
        warnings.append(
            f"capability-matrix pattern_version_ref={matrix_ref} "
            f"!= factory.config.yaml pattern_version={pattern_version}"
        )

    defaults: dict[str, Any] = matrix.get("adapter_defaults") or {}
    expected_names = set(defaults.keys())

    manifests: dict[str, dict[str, Any]] = {}
    for manifest_path in sorted(ADAPTERS_DIR.glob("*/manifest.yaml")):
        name = manifest_path.parent.name
        try:
            manifests[name] = _load_yaml(manifest_path)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{name}: cannot parse manifest ({exc})")

    for name in expected_names - set(manifests):
        errors.append(f"missing adapters/{name}/manifest.yaml (listed in capability-matrix)")

    for name, extra in manifests.items():
        if name not in expected_names:
            warnings.append(f"{name}: manifest present but not in capability-matrix.adapter_defaults")

        maturity = str(extra.get("maturity", ""))
        if maturity not in VALID_MATURITY:
            errors.append(f"{name}: invalid maturity={maturity!r} (want {sorted(VALID_MATURITY)})")

        orch = extra.get("orchestration") or {}
        if not isinstance(orch, dict) or "profile" not in orch:
            errors.append(f"{name}: missing orchestration.profile (native|sequential|external|viewer)")
        else:
            profile = str(orch.get("profile"))
            if profile not in VALID_PROFILES:
                errors.append(f"{name}: invalid orchestration.profile={profile!r}")
            features = orch.get("features") or {}
            if not isinstance(features, dict):
                errors.append(f"{name}: orchestration.features must be a mapping")
            else:
                for feat in REQUIRED_FEATURES:
                    if feat not in features:
                        warnings.append(f"{name}: orchestration.features.{feat} not declared")

        cv = extra.get("contract_version")
        if cv is None:
            errors.append(f"{name}: missing contract_version")
        else:
            target = (defaults.get(name) or {}).get("contract_version_target")
            if target and _parse_version(cv) < _parse_version(target):
                # intentional lag for core/partial is OK if maturity matches defaults
                expected_maturity = (defaults.get(name) or {}).get("maturity")
                if maturity == "full" and expected_maturity == "full":
                    warnings.append(
                        f"{name}: contract_version {cv} behind target {target} "
                        f"(pattern {pattern_version})"
                    )
                elif maturity == "full" and _parse_version(cv) < _parse_version(pattern_version):
                    warnings.append(
                        f"{name}: maturity=full but contract_version {cv} < pattern {pattern_version}"
                    )

            # False signal: full + large lag
            if maturity == "full" and _parse_version(cv) + (0,) < _parse_version(pattern_version):
                major_lag = _parse_version(pattern_version)[0:2] > _parse_version(cv)[0:2]
                if major_lag:
                    errors.append(
                        f"{name}: maturity=full with contract_version {cv} while pattern is "
                        f"{pattern_version} — use maturity=core or catch up templates"
                    )

        role = extra.get("role_profile")
        if role is not None and role not in {"writer", "viewer", "hybrid"}:
            errors.append(f"{name}: invalid role_profile={role!r}")

        # Align with matrix defaults when present
        if name in defaults:
            exp_mat = defaults[name].get("maturity")
            exp_prof = defaults[name].get("profile")
            if exp_mat and maturity and maturity != exp_mat:
                warnings.append(
                    f"{name}: manifest maturity={maturity} != matrix default {exp_mat}"
                )
            if exp_prof and isinstance(orch, dict) and orch.get("profile") != exp_prof:
                warnings.append(
                    f"{name}: orchestration.profile={orch.get('profile')} "
                    f"!= matrix default {exp_prof}"
                )

    # Canonical tools check + shim policy (.claude/tools must stay thin)
    tools_dir = REPO_ROOT / "tools"
    claude_tools = REPO_ROOT / ".claude" / "tools"
    if not tools_dir.is_dir():
        errors.append("missing canonical tools/ directory at repo root")
    if not (tools_dir / "runtime" / "suggest-next.py").is_file():
        errors.append("missing tools/runtime/suggest-next.py (canonical EP-033 hook)")
    if not (tools_dir / "analytics" / "show-session-tokens.py").is_file():
        errors.append("missing tools/analytics/show-session-tokens.py (canonical Token Ledger)")

    if claude_tools.is_dir():
        if not (claude_tools / "README.md").is_file():
            errors.append(
                ".claude/tools/ exists without README.md — required shim policy note"
            )
        fat: list[str] = []
        for path in sorted(claude_tools.rglob("*")):
            if not path.is_file():
                continue
            if path.name == "README.md" or "__pycache__" in path.parts:
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            lines = text.splitlines()
            is_shim = "Shim:" in text or "backward-compat wrapper" in text
            if not is_shim or len(lines) > 20:
                fat.append(f"{path.relative_to(REPO_ROOT)} ({len(lines)} lines, shim={is_shim})")
        if fat:
            errors.append(
                ".claude/tools/ must contain only thin shims (≤20 lines, marker 'Shim:'): "
                + "; ".join(fat[:8])
                + ("…" if len(fat) > 8 else "")
            )

    summary = {
        "pattern_version": pattern_version,
        "adapters": sorted(manifests.keys()),
        "errors": errors,
        "warnings": warnings,
    }

    if args.json:
        import json

        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print(f"pattern_version={pattern_version}  adapters={len(manifests)}")
        for w in warnings:
            print(f"WARN  {w}")
        for e in errors:
            print(f"ERROR {e}")
        if not errors and not warnings:
            print("OK — adapter registry aligned with capability matrix")
        elif not errors:
            print(f"OK with {len(warnings)} warning(s)")

    if errors:
        return 1
    if args.strict and warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
