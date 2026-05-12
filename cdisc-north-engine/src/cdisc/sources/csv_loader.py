"""
CSV seed-list loader.

Use this for: YEIDA allottee lists, UPSIDA tenant directories, NABARD vendor lists,
CREDAI member exports, Sales Navigator exports, manual lead lists.

Expected CSV columns (flexible — missing cols are OK):
  name, description, segment, district, state, address, phone, email,
  website, linkedin_url

Source is tagged as `csv:<filename>` so you can audit where each lead came from.
"""
from __future__ import annotations
import csv
import hashlib
from pathlib import Path

from .. import config


def load_csv(path: str | Path, segment_hint: str | None = None,
             district_default: str | None = None) -> list[dict]:
    """Read a CSV file and return normalised lead dicts."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(p)
    out: list[dict] = []
    source_tag = f"csv:{p.name}"
    with open(p, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            name = (row.get("name") or row.get("Name") or "").strip()
            if not name:
                continue
            key_blob = f"{source_tag}|{name}|{row.get('phone','')}|{row.get('email','')}"
            source_id = hashlib.sha1(key_blob.encode()).hexdigest()[:16]
            out.append({
                "name": name,
                "description": (row.get("description") or row.get("Description") or "").strip(),
                "segment": (row.get("segment") or segment_hint or "").strip(),
                "segment_hint": (row.get("segment") or segment_hint or "").strip() or None,
                "district": (row.get("district") or district_default or "").strip(),
                "state": (row.get("state") or "").strip(),
                "address": (row.get("address") or "").strip(),
                "phone": (row.get("phone") or "").strip(),
                "email": (row.get("email") or "").strip(),
                "website": (row.get("website") or "").strip(),
                "linkedin_url": (row.get("linkedin_url") or "").strip(),
                "source": source_tag,
                "source_id": f"{source_tag}:{source_id}",
                "metadata": "",
            })
    return out
