"""
C-DISC North India Engine — Command-line interface.

Run:  python -m cdisc <command> [options]
"""
from __future__ import annotations
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from . import config, db
from .sources import google_places, csv_loader
from .scoring import scorer
from .messaging import generator
from .outreach import email_sender, whatsapp, linkedin_queue

app = typer.Typer(help="C-DISC North India outreach automation")
console = Console()


# ──────────────────────────────────────────────────────────────────
# discover
# ──────────────────────────────────────────────────────────────────
@app.command()
def discover(
    district: str = typer.Option(..., help="Comma-separated districts, e.g. 'Bareilly,Sitapur'"),
    segment: str = typer.Option("industrial_shed", help="Segment key (see config.yaml)"),
    limit: int = typer.Option(100, help="Max leads per district"),
    source: str = typer.Option("google_places", help="google_places | csv"),
    csv_path: Optional[str] = typer.Option(None, help="Path to CSV if source=csv"),
):
    """Pull leads from a source and insert them into the pipeline DB."""
    inserted = 0
    skipped = 0

    if source == "csv":
        if not csv_path:
            console.print("[red]--csv-path is required when source=csv[/red]")
            raise typer.Exit(1)
        leads = csv_loader.load_csv(csv_path, segment_hint=segment, district_default=district.split(",")[0])
        for ld in leads:
            new_id = db.insert_lead(ld)
            if new_id: inserted += 1
            else: skipped += 1
    else:
        for d in [x.strip() for x in district.split(",") if x.strip()]:
            console.print(f"\n[bold cyan]Discovering '{segment}' leads in {d}…[/bold cyan]")
            leads = google_places.discover_for_segment(d, segment, limit=limit)
            for ld in leads:
                new_id = db.insert_lead(ld)
                if new_id: inserted += 1
                else: skipped += 1
            console.print(f"  Found {len(leads)} (inserted={inserted}, skipped duplicates={skipped})")

    console.print(f"\n[green]Done. Inserted {inserted} leads, skipped {skipped} duplicates.[/green]")


# ──────────────────────────────────────────────────────────────────
# score
# ──────────────────────────────────────────────────────────────────
@app.command()
def score(
    min_score: float = typer.Option(0.0, help="(unused for scoring, only for filter display)"),
):
    """Score every unscored lead. Auto-rejects multi-storey signals."""
    with db.conn() as c:
        rows = list(c.execute("SELECT * FROM leads WHERE status='new'"))

    if not rows:
        console.print("[yellow]No new leads to score.[/yellow]")
        return

    rejected = scored = 0
    for r in rows:
        lead = dict(r)
        res = scorer.score_lead(lead)
        db.update_lead_scores(r["id"], res.fit_score, res.geo_score,
                              res.segment_score, res.final_score,
                              rejected=res.rejected, reason=res.reject_reason)
        if res.rejected: rejected += 1
        else: scored += 1
        # Also persist refined segment
        if res.segment:
            with db.conn() as c:
                c.execute("UPDATE leads SET segment=? WHERE id=?", (res.segment, r["id"]))
    console.print(f"\n[green]Scored {scored} leads. Auto-rejected {rejected} multi-storey leads.[/green]")
    console.print(f"  Filter for next step: leads with final_score >= {min_score}")


# ──────────────────────────────────────────────────────────────────
# generate
# ──────────────────────────────────────────────────────────────────
@app.command()
def generate(
    channel: str = typer.Option("email", help="email | whatsapp | linkedin"),
    language: str = typer.Option("both", help="en | hi | both"),
    min_score: float = typer.Option(60.0, help="Only generate for leads above this score"),
    segment: Optional[str] = typer.Option(None, help="Restrict to one segment"),
    limit: int = typer.Option(500, help="Max messages to generate"),
    use_llm: bool = typer.Option(True, help="Use OpenAI for personalisation if key present"),
    schedule_followups: bool = typer.Option(True, help="Also queue Day-5 and Day-14 follow-ups"),
):
    """Generate outreach messages for scored leads and queue them."""
    languages = ["en", "hi"] if language == "both" else [language]
    leads = db.get_leads(status="scored", min_score=min_score, segment=segment, limit=limit)
    if not leads:
        console.print("[yellow]No scored leads matching the filter. Run `score` first.[/yellow]")
        return

    queued = 0
    for r in leads:
        lead = dict(r)
        seg = lead.get("segment") or "industrial_shed"
        for lang in languages:
            msg = generator.generate(channel, lang, seg, lead, use_llm=use_llm)
            db.queue_message(r["id"], channel, lang, msg.subject, msg.body, touch_number=1)
            queued += 1
            if schedule_followups:
                d5, d14 = generator.generate_followups(channel, lang, lead)
                from datetime import datetime, timedelta
                now = datetime.utcnow()
                db.queue_message(r["id"], channel, lang, f"Re: {msg.subject}" if msg.subject else "",
                                 d5, touch_number=2,
                                 scheduled_for=(now + timedelta(days=5)).isoformat())
                db.queue_message(r["id"], channel, lang, f"Re: {msg.subject}" if msg.subject else "",
                                 d14, touch_number=3,
                                 scheduled_for=(now + timedelta(days=14)).isoformat())
    console.print(f"\n[green]Queued {queued} primary messages (+ follow-ups if enabled).[/green]")


# ──────────────────────────────────────────────────────────────────
# send / export
# ──────────────────────────────────────────────────────────────────
@app.command()
def send(
    batch: int = typer.Option(25, help="How many emails to send this batch"),
    throttle_sec: int = typer.Option(8, help="Seconds between sends"),
    dry_run: bool = typer.Option(True, help="Print without actually sending"),
):
    """Send a batch of queued EMAIL messages over SMTP."""
    s = email_sender.EmailSender(dry_run=dry_run)
    s.throttle = throttle_sec
    result = s.send_batch(batch_size=batch)
    console.print(f"\n[green]Email batch: {result}[/green]")


@app.command()
def export(
    format: str = typer.Option("whatsapp_links", help="whatsapp_links | linkedin_dm"),
    out: str = typer.Option("data/exports/output.csv"),
):
    """Export queued non-email messages (WhatsApp links / LinkedIn DM queue)."""
    if format == "whatsapp_links":
        n = whatsapp.export_wa_links(out)
        console.print(f"[green]Exported {n} WhatsApp wa.me links to {out}[/green]")
    elif format == "linkedin_dm":
        n = linkedin_queue.export_dm_queue(out)
        console.print(f"[green]Exported {n} LinkedIn DM rows to {out}[/green]")
    else:
        console.print(f"[red]Unknown format: {format}[/red]")


# ──────────────────────────────────────────────────────────────────
# pipeline (one-shot)
# ──────────────────────────────────────────────────────────────────
@app.command()
def pipeline(
    district: str = typer.Option(..., help="Comma-separated districts"),
    segment: str = typer.Option("industrial_shed"),
    limit: int = typer.Option(100),
    min_score: float = typer.Option(60.0),
    channel: str = typer.Option("email"),
    language: str = typer.Option("both"),
    send_now: bool = typer.Option(False, help="Actually send emails (off by default — safer)"),
):
    """Run the full pipeline: discover → score → generate → (optionally) send."""
    console.rule("[bold]1/4 Discovering leads")
    discover(district=district, segment=segment, limit=limit)
    console.rule("[bold]2/4 Scoring leads")
    score(min_score=min_score)
    console.rule("[bold]3/4 Generating messages")
    generate(channel=channel, language=language, min_score=min_score, segment=segment)
    if send_now and channel == "email":
        console.rule("[bold]4/4 Sending email batch")
        send(batch=25, throttle_sec=8, dry_run=False)
    else:
        console.rule("[yellow]4/4 Send skipped — run `cdisc send --no-dry-run` or `cdisc export` manually")
    summary()


# ──────────────────────────────────────────────────────────────────
# summary / dashboard
# ──────────────────────────────────────────────────────────────────
@app.command()
def summary():
    """Print pipeline state in the terminal."""
    s = db.pipeline_summary()
    t = Table(title="C-DISC Pipeline Summary", show_header=True, header_style="bold cyan")
    t.add_column("Metric"); t.add_column("Count")
    t.add_row("Total leads", str(s["total_leads"]))
    t.add_row("[red]Auto-rejected (multi-storey)[/red]", str(s["rejected"]))
    for k, v in s["by_status"].items():
        t.add_row(f"  status: {k}", str(v))
    for k, v in s["by_segment"].items():
        t.add_row(f"  segment: {k}", str(v))
    for k, v in s["messages_by_status"].items():
        t.add_row(f"  msg/{k}", str(v))
    console.print(t)


@app.command()
def dashboard():
    """Launch the Streamlit dashboard."""
    import subprocess, sys
    here = Path(__file__).parent / "dashboard" / "app.py"
    subprocess.run([sys.executable, "-m", "streamlit", "run", str(here)])


if __name__ == "__main__":
    app()
