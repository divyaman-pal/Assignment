"""Configuration loader. Reads config.yaml + .env into a single object."""
from __future__ import annotations
import os
from pathlib import Path
from typing import Any
import yaml
from dotenv import load_dotenv

# Find project root (the directory containing config.yaml)
_HERE = Path(__file__).resolve()
for candidate in [_HERE.parent.parent.parent, _HERE.parent.parent, _HERE.parent]:
    if (candidate / "config.yaml").exists():
        PROJECT_ROOT = candidate
        break
else:
    PROJECT_ROOT = _HERE.parent.parent.parent

load_dotenv(PROJECT_ROOT / ".env", override=False)


def _load_yaml() -> dict[str, Any]:
    with open(PROJECT_ROOT / "config.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


CONFIG: dict[str, Any] = _load_yaml()


def env(key: str, default: str | None = None) -> str | None:
    """Read an environment variable."""
    return os.environ.get(key, default)


def get(path: str, default: Any = None) -> Any:
    """Dotted-path config getter. e.g. cfg.get('scoring.weights.fit') -> 0.45"""
    node: Any = CONFIG
    for part in path.split("."):
        if not isinstance(node, dict) or part not in node:
            return default
        node = node[part]
    return node


def all_districts() -> dict[str, dict]:
    """Return {district_name -> {zone_key, score, label}} from the geo_zones config."""
    out: dict[str, dict] = {}
    for zone_key, zone in CONFIG.get("geo_zones", {}).items():
        if "districts" not in zone:
            continue
        for d in zone["districts"]:
            out[d.lower()] = {"zone": zone_key, "score": zone["score"], "label": zone["label"]}
    return out


def reject_keywords() -> list[str]:
    return [k.lower() for k in CONFIG.get("reject_keywords", [])]


def segments() -> dict[str, dict]:
    return CONFIG.get("segments", {})


def segment(name: str) -> dict:
    return segments().get(name, {})
