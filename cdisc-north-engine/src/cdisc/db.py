"""SQLite-backed lead + outreach pipeline storage."""
from __future__ import annotations
import sqlite3
from pathlib import Path
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Iterable, Optional

from . import config

DB_PATH = Path(config.env("CDISC_DB_PATH", "data/cdisc_pipeline.db"))


SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    segment TEXT,
    district TEXT,
    state TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    linkedin_url TEXT,
    source TEXT,
    source_id TEXT UNIQUE,
    fit_score REAL,
    geo_score REAL,
    segment_score REAL,
    final_score REAL,
    rejected INTEGER DEFAULT 0,
    reject_reason TEXT,
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    channel TEXT NOT NULL,           -- 'email' | 'whatsapp' | 'linkedin'
    language TEXT NOT NULL,          -- 'en' | 'hi'
    subject TEXT,
    body TEXT NOT NULL,
    touch_number INTEGER DEFAULT 1,  -- 1, 2 (day-5), 3 (day-14)
    status TEXT DEFAULT 'queued',    -- 'queued' | 'sent' | 'failed' | 'replied'
    scheduled_for TEXT,
    sent_at TEXT,
    error TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(final_score);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id);
"""


@contextmanager
def conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    try:
        c.executescript(SCHEMA)
        yield c
        c.commit()
    finally:
        c.close()


def insert_lead(lead: dict) -> Optional[int]:
    """Insert a lead. Returns the new lead id, or None if duplicate source_id."""
    cols = ["name", "description", "segment", "district", "state", "address",
            "phone", "email", "website", "linkedin_url", "source", "source_id", "metadata"]
    values = [lead.get(c) for c in cols]
    placeholders = ",".join(["?"] * len(cols))
    sql = f"INSERT OR IGNORE INTO leads ({','.join(cols)}) VALUES ({placeholders})"
    with conn() as c:
        cur = c.execute(sql, values)
        return cur.lastrowid if cur.rowcount > 0 else None


def update_lead_scores(lead_id: int, fit: float, geo: float, seg: float, final: float,
                      rejected: bool = False, reason: str = "") -> None:
    with conn() as c:
        c.execute("""
            UPDATE leads
            SET fit_score=?, geo_score=?, segment_score=?, final_score=?,
                rejected=?, reject_reason=?, status=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        """, (fit, geo, seg, final, 1 if rejected else 0, reason,
              "rejected" if rejected else "scored", lead_id))


def get_leads(status: str | None = None, min_score: float = 0.0,
              segment: str | None = None, limit: int = 1000) -> list[sqlite3.Row]:
    sql = "SELECT * FROM leads WHERE final_score >= ? AND rejected = 0"
    params: list = [min_score]
    if status:
        sql += " AND status = ?"
        params.append(status)
    if segment:
        sql += " AND segment = ?"
        params.append(segment)
    sql += " ORDER BY final_score DESC LIMIT ?"
    params.append(limit)
    with conn() as c:
        return list(c.execute(sql, params))


def queue_message(lead_id: int, channel: str, language: str, subject: str,
                  body: str, touch_number: int = 1, scheduled_for: str | None = None) -> int:
    with conn() as c:
        cur = c.execute("""
            INSERT INTO messages (lead_id, channel, language, subject, body, touch_number, scheduled_for, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'queued')
        """, (lead_id, channel, language, subject, body, touch_number, scheduled_for))
        return cur.lastrowid


def get_queued_messages(channel: str | None = None, batch: int = 25) -> list[sqlite3.Row]:
    sql = """SELECT m.*, l.name AS lead_name, l.email AS lead_email, l.phone AS lead_phone,
                    l.linkedin_url AS lead_linkedin
             FROM messages m JOIN leads l ON l.id = m.lead_id
             WHERE m.status = 'queued'"""
    params: list = []
    if channel:
        sql += " AND m.channel = ?"
        params.append(channel)
    sql += " ORDER BY m.touch_number, l.final_score DESC LIMIT ?"
    params.append(batch)
    with conn() as c:
        return list(c.execute(sql, params))


def mark_message(message_id: int, status: str, error: str = "") -> None:
    sent_at = datetime.utcnow().isoformat() if status == "sent" else None
    with conn() as c:
        c.execute("UPDATE messages SET status=?, sent_at=?, error=? WHERE id=?",
                  (status, sent_at, error, message_id))
        if status == "sent":
            c.execute("UPDATE leads SET status='messaged', updated_at=CURRENT_TIMESTAMP WHERE id=(SELECT lead_id FROM messages WHERE id=?)", (message_id,))


def schedule_followups(lead_id: int, channel: str, language: str,
                       body_d5: str, body_d14: str, subject_d5: str = "", subject_d14: str = "") -> None:
    """Queue Day-5 and Day-14 follow-ups for a lead."""
    now = datetime.utcnow()
    d5 = (now + timedelta(days=5)).isoformat()
    d14 = (now + timedelta(days=14)).isoformat()
    queue_message(lead_id, channel, language, subject_d5, body_d5, touch_number=2, scheduled_for=d5)
    queue_message(lead_id, channel, language, subject_d14, body_d14, touch_number=3, scheduled_for=d14)


def pipeline_summary() -> dict:
    """Return aggregated counts by status / segment / zone for the dashboard."""
    with conn() as c:
        by_status = {r["status"]: r["n"] for r in
                     c.execute("SELECT status, COUNT(*) AS n FROM leads GROUP BY status")}
        by_segment = {r["segment"]: r["n"] for r in
                      c.execute("SELECT segment, COUNT(*) AS n FROM leads WHERE rejected=0 GROUP BY segment")}
        msgs_by_status = {r["status"]: r["n"] for r in
                          c.execute("SELECT status, COUNT(*) AS n FROM messages GROUP BY status")}
        total_leads = c.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
        rejected = c.execute("SELECT COUNT(*) FROM leads WHERE rejected=1").fetchone()[0]
    return {
        "total_leads": total_leads,
        "rejected": rejected,
        "by_status": by_status,
        "by_segment": by_segment,
        "messages_by_status": msgs_by_status,
    }
