"""
End-to-end demo workflow — runs the engine on bundled sample data.

This shows the full pipeline from CSV → score → generate → export,
without needing any API keys. Run with:

    python workflows/run_demo.py

Output: data/exports/demo_wa_links.csv  (clickable WhatsApp links)
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from cdisc import db
from cdisc.sources import csv_loader
from cdisc.scoring import scorer
from cdisc.messaging import generator
from cdisc.outreach import whatsapp, linkedin_queue


def main():
    print("=" * 70)
    print(" C-DISC North India Engine — End-to-End Demo")
    print("=" * 70)

    # ── 1. Load seed leads ────────────────────────────────────────
    seed_path = Path(__file__).parent.parent / "data" / "seeds" / "sample_north_india_leads.csv"
    print(f"\n[1/4] Loading seed CSV: {seed_path.name}")
    leads = csv_loader.load_csv(seed_path)
    inserted = 0
    for ld in leads:
        if db.insert_lead(ld) is not None:
            inserted += 1
    print(f"      Inserted {inserted} / {len(leads)} leads (duplicates skipped)")

    # ── 2. Score & auto-reject ────────────────────────────────────
    print("\n[2/4] Scoring leads + auto-rejecting multi-storey…")
    with db.conn() as c:
        rows = list(c.execute("SELECT * FROM leads WHERE status='new'"))
    rejected = scored = 0
    for r in rows:
        lead = dict(r)
        res = scorer.score_lead(lead)
        db.update_lead_scores(r["id"], res.fit_score, res.geo_score,
                              res.segment_score, res.final_score,
                              rejected=res.rejected, reason=res.reject_reason)
        if res.segment:
            with db.conn() as c2:
                c2.execute("UPDATE leads SET segment=? WHERE id=?", (res.segment, r["id"]))
        if res.rejected:
            rejected += 1
            print(f"      ✗ {lead['name'][:45]:45} → REJECTED ({res.reject_reason})")
        else:
            scored += 1
            print(f"      ✓ {lead['name'][:45]:45} → {res.final_score:5.1f}  ({res.segment})")
    print(f"\n      Total scored: {scored}   Auto-rejected: {rejected}")

    # ── 3. Generate messages (template mode — no LLM key needed) ──
    print("\n[3/4] Generating bilingual messages…")
    good_leads = db.get_leads(status="scored", min_score=60.0)
    generated = 0
    for r in good_leads:
        lead = dict(r)
        seg = lead.get("segment") or "industrial_shed"
        # Email in English
        msg_en = generator.generate("email", "en", seg, lead, use_llm=False)
        db.queue_message(r["id"], "email", "en", msg_en.subject, msg_en.body, touch_number=1)
        # WhatsApp in Hindi (for farm/self-build/wall)
        if seg in ("farm_infra", "self_build_g1", "compound_wall"):
            msg_hi = generator.generate("whatsapp", "hi", seg, lead, use_llm=False)
            db.queue_message(r["id"], "whatsapp", "hi", "", msg_hi.body, touch_number=1)
        # LinkedIn for industrial/resort
        if seg in ("industrial_shed", "resort"):
            msg_li = generator.generate("linkedin", "en", seg, lead, use_llm=False)
            db.queue_message(r["id"], "linkedin", "en", "", msg_li.body, touch_number=1)
        generated += 1
    print(f"      Generated outreach for {generated} leads")

    # ── 4. Export non-email queues ────────────────────────────────
    print("\n[4/4] Exporting outreach queues…")
    wa_out = Path(__file__).parent.parent / "data" / "exports" / "demo_wa_links.csv"
    li_out = Path(__file__).parent.parent / "data" / "exports" / "demo_linkedin_dm.csv"
    n_wa = whatsapp.export_wa_links(wa_out)
    n_li = linkedin_queue.export_dm_queue(li_out)
    print(f"      WhatsApp wa.me links: {n_wa} → {wa_out}")
    print(f"      LinkedIn DM queue:    {n_li} → {li_out}")

    # ── Summary ───────────────────────────────────────────────────
    summary = db.pipeline_summary()
    print("\n" + "=" * 70)
    print(" PIPELINE SUMMARY")
    print("=" * 70)
    print(f"  Total leads:        {summary['total_leads']}")
    print(f"  Auto-rejected:      {summary['rejected']}")
    print(f"  By status:          {summary['by_status']}")
    print(f"  By segment:         {summary['by_segment']}")
    print(f"  Messages by status: {summary['messages_by_status']}")
    print()
    print("  Next step:")
    print("    • Inspect data/exports/demo_wa_links.csv — click any wa.me link from your phone")
    print("    • Run `python -m cdisc dashboard` for a live view")
    print("    • Run `python -m cdisc send --dry-run` to preview email batch")


if __name__ == "__main__":
    main()
