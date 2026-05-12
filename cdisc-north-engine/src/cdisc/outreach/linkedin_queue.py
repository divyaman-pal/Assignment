"""
LinkedIn DM queue.

LinkedIn ToS forbids automated messaging. This module produces a structured CSV
of (profile_url, dm_text, subject) so a human can paste-and-send 10× faster.
"""
from __future__ import annotations
import csv
from pathlib import Path

from .. import db


def export_dm_queue(out_path: str | Path) -> int:
    msgs = db.get_queued_messages(channel="linkedin", batch=10_000)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for m in msgs:
        profile = m["lead_linkedin"] or ""
        rows.append({
            "lead_id": m["lead_id"],
            "lead_name": m["lead_name"],
            "linkedin_url": profile,
            "message_id": m["id"],
            "language": m["language"],
            "touch": m["touch_number"],
            "dm_text": m["body"],
        })
        db.mark_message(m["id"], "sent")  # We trust the user to actually send
    if rows:
        with open(out, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
    return len(rows)
