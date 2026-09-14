#!/usr/bin/env python3
"""Incremental factory upgrade from local meta-framework clone (non-destructive ADD + PATTERN replace)."""
from __future__ import annotations

import argparse
import filecmp
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

SYNC_PATHS = [
    ".claude/agents",
    ".claude/skills",
    ".claude/commands",
    ".claude/tools",
    ".claude/schemas",
    "tools",
    "voice",
    "schemas",
    "adapters/cursor/templates",
]

REPLACE_FILES = ["PATTERN.md"]

EXCLUDE_COMMANDS = {"factory-bootstrap.md", "factory-upgrade.md", "release.md"}

LOCAL_PATH_SUFFIXES = (
    "show-session-tokens.py",
    "token-ledger.md",
    "settings.json",
)


def _parse_pattern_version(text: str) -> str | None:
    m = re.search(r'^pattern_version:\s*["\']?([0-9.]+)', text, re.M)
    return m.group(1) if m else None


def _files_identical(a: Path, b: Path) -> bool:
    return a.is_file() and b.is_file() and filecmp.cmp(a, b, shallow=False)


def _should_skip_conflict(rel: str) -> bool:
    return any(rel.endswith(s) or s in rel for s in LOCAL_PATH_SUFFIXES)


def _copy_tree_add_only(src_dir: Path, dst_root: Path, rel_dir: str, stats: dict) -> None:
    if not src_dir.exists():
        return
    for item in sorted(src_dir.rglob("*")):
        if item.is_dir():
            continue
        rel = f"{rel_dir}/{item.relative_to(src_dir)}".replace("\\", "/").lstrip("/")
        if rel.startswith(".claude/commands/") and item.name in EXCLUDE_COMMANDS:
            stats["skip_meta_cmd"] += 1
            continue
        dest = dst_root / rel
        if dest.exists():
            if _files_identical(item, dest):
                stats["skip_identical"] += 1
            elif _should_skip_conflict(rel):
                stats["skip_local_path"] += 1
            else:
                stats["conflict"] += 1
                stats["conflict_paths"].append(rel)
            continue
        if stats["_dry_run"]:
            stats["copy"] += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dest)
        stats["copy"] += 1


def _merge_config(meta_cfg: dict, target_cfg: dict) -> tuple[dict, list[str]]:
    merged_keys: list[str] = []
    out = dict(target_cfg)
    skip = {"pattern_version", "topology", "code_path", "code_paths", "routing", "stack", "stack_mode", "vcs"}
    for key, value in meta_cfg.items():
        if key in skip or key in out:
            continue
        out[key] = value
        merged_keys.append(key)
    return out, merged_keys


def upgrade_factory(factory_path: Path, meta_source: Path, dry_run: bool) -> dict:
    cfg_path = factory_path / "factory.config.yaml"
    if not cfg_path.is_file():
        raise SystemExit(f"Not a factory: {factory_path}")
    if not (meta_source / "PATTERN.md").is_file():
        raise SystemExit(f"Invalid meta source: {meta_source}")

    target_pv = _parse_pattern_version(cfg_path.read_text(encoding="utf-8"))
    meta_pv = _parse_pattern_version((meta_source / "factory.config.yaml").read_text(encoding="utf-8"))
    if not meta_pv:
        raise SystemExit("pattern_version missing in meta factory.config.yaml")

    stats = {
        "copy": 0,
        "replace": 0,
        "skip_identical": 0,
        "skip_local_path": 0,
        "skip_meta_cmd": 0,
        "conflict": 0,
        "conflict_paths": [],
        "merged_config_keys": [],
        "v_from": target_pv,
        "v_to": meta_pv,
        "_dry_run": dry_run,
    }

    backup_dir = None
    if not dry_run:
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
        backup_dir = factory_path / ".factory-upgrade-backup" / f"{target_pv or 'unknown'}-to-{meta_pv}-{ts}"
        backup_dir.mkdir(parents=True, exist_ok=True)

    for rel in SYNC_PATHS:
        src = meta_source / rel
        if not src.exists():
            continue
        if src.is_dir():
            _copy_tree_add_only(src, factory_path, rel, stats)
        elif src.is_file():
            dest = factory_path / rel
            if dest.exists() and not _files_identical(src, dest):
                stats["conflict"] += 1
                stats["conflict_paths"].append(rel)
                continue
            if not dry_run:
                dest.parent.mkdir(parents=True, exist_ok=True)
                if dest.exists() and backup_dir:
                    shutil.copy2(dest, backup_dir / rel.replace("/", "__"))
                shutil.copy2(src, dest)
            stats["copy"] += 1

    for rel in REPLACE_FILES:
        src = meta_source / rel
        if not src.is_file():
            continue
        dest = factory_path / rel
        if not dry_run:
            if dest.exists() and backup_dir:
                shutil.copy2(dest, backup_dir / rel.replace("/", "__"))
            shutil.copy2(src, dest)
        stats["replace"] += 1

    meta_cfg = yaml.safe_load((meta_source / "factory.config.yaml").read_text(encoding="utf-8")) or {}
    target_cfg = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    merged, merged_keys = _merge_config(meta_cfg, target_cfg)
    merged["pattern_version"] = meta_pv
    stats["merged_config_keys"] = merged_keys

    if not dry_run:
        header = f"# Upgraded via tools/factory-upgrade-apply.py → pattern_version {meta_pv}\n"
        cfg_path.write_text(header + yaml.dump(merged, default_flow_style=False, sort_keys=False), encoding="utf-8")

    stats["backup_path"] = str(backup_dir) if backup_dir else None
    return stats


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("factory_path", type=Path)
    p.add_argument("--meta-source", type=Path, default=Path(__file__).resolve().parent.parent)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    stats = upgrade_factory(args.factory_path.resolve(), args.meta_source.resolve(), args.dry_run)
    print("=" * 60)
    print(f"{'DRY-RUN' if args.dry_run else 'APPLIED'}  {stats['v_from']} → {stats['v_to']}")
    print(f"COPY {stats['copy']}  REPLACE {stats['replace']}  CONFLICT {stats['conflict']}")
    if stats["merged_config_keys"]:
        print("config merged:", ", ".join(stats["merged_config_keys"]))
    if stats["conflict_paths"]:
        print("CONFLICT sample:", *stats["conflict_paths"][:15], sep="\n  ")
    if stats.get("backup_path"):
        print("backup:", stats["backup_path"])
    print("=" * 60)


if __name__ == "__main__":
    main()
