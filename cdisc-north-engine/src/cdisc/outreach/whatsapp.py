"""
WhatsApp queue generator.

Two outputs:
  1) A CSV with `wa.me` links you click from your authorised phone
  2) Payload-ready dicts for WhatsApp Business API (if you add a BSP)

We deliberately do NOT scrape or automate without an API — that violates WhatsApp ToS.
"""
from __future__ import annotations
import csv
import urllib.parse
from pathlib import Path

from .. import db


def _normalize_phone(phone: str) -> str:
    """Strip non-digits; add 91 country code if it's a 10-digit Indian number."""
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if not digits:
        return ""
    if len(digits) == 10:
        return "91" + digits
    if digits.startswith("0") and len(digits) == 11:
        return "91" + digits[1:]
    return digits


def export_wa_links(out_path: str | Path) -> int:
    """
    Export queued WhatsApp messages as a CSV of clickable wa.me links.
    Returns the number of rows exported. Marks each as 'sent' after export.
    """
    msgs = db.get_queued_messages(channel="whatsapp", batch=10_000)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    rows: list[dict] = []
    for m in msgs:
        phone = _normalize_phone(m["lead_phone"])
        if not phone:
            db.mark_message(m["id"], "failed", error="No phone on lead")
            continue
        encoded = urllib.parse.quote(m["body"])
        link = f"https://wa.me/{phone}?text={encoded}"
        rows.append({
            "lead_id": m["lead_id"],
            "lead_name": m["lead_name"],
            "phone": phone,
            "message_id": m["id"],
            "language": m["language"],
            "touch": m["touch_number"],
            "wa_link": link,
            "preview": m["body"][:80] + ("…" if len(m["body"]) > 80 else ""),
        })
        # Mark as sent now since user will click manually
        db.mark_message(m["id"], "sent")

    if rows:
        with open(out, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
    return len(rows)
