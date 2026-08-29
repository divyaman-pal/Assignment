"""Generate VAYU-NET_Test_Plan.pdf — validation plan, UI/UX and backend.

Shares the design system and diagram helpers with generate_design_doc.py so the
two handover documents stay visually and structurally consistent.

    python docs/generate_test_plan.py
"""
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, Frame, NextPageTemplate,
                                PageBreak, PageTemplate, Paragraph, Spacer)

from generate_design_doc import (ACCENT, AMBER, BODY, CODE, CTITLE, CSUB, CW, DANGER,
                                 Diagram, H1, H2, H3, INK, MARGIN, MUTED, NOTE, OKGREEN,
                                 PAGE_H, PAGE_W, P, RULE, SMALL, TEAL, TINT, TINT2,
                                 WARN, WHITE, arrow, box, caption, tbl)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "VAYU-NET_Test_Plan.pdf"


def _footer(canv, doc):
    canv.saveState()
    canv.setStrokeColor(RULE); canv.setLineWidth(0.5)
    canv.line(MARGIN, 34, PAGE_W - MARGIN, 34)
    canv.setFont("Helvetica", 7.2); canv.setFillColor(MUTED)
    canv.drawString(MARGIN, 24, "VAYU-NET — Test Plan & Validation Procedures")
    canv.drawRightString(PAGE_W - MARGIN, 24, f"page {canv.getPageNumber()}")
    canv.restoreState()


def _cover_bg(canv, doc):
    canv.saveState()
    canv.setFillColor(colors.HexColor("#1d5c52"))
    canv.rect(0, PAGE_H - 250, PAGE_W, 250, stroke=0, fill=1)
    canv.setFillColor(colors.HexColor("#2c8375"))
    canv.rect(0, PAGE_H - 256, PAGE_W, 6, stroke=0, fill=1)
    canv.restoreState()


# ------------------------------------------------------------------ tables --
def cases(rows, wid=None):
    """Test-case table: ID, what it proves, how to run it, expected result."""
    data = [["id", "validates", "procedure", "expected result", "auto"]]
    for r in rows:
        data.append([P(f"<b>{r[0]}</b>", ParagraphStyle("i", parent=SMALL, fontSize=6.6,
                                                        leading=8.6, textColor=ACCENT)),
                     P(r[1], ParagraphStyle("a", parent=SMALL, fontSize=6.6, leading=8.6)),
                     P(r[2], ParagraphStyle("b", parent=SMALL, fontSize=6.6, leading=8.6)),
                     P(r[3], ParagraphStyle("c", parent=SMALL, fontSize=6.6, leading=8.6)),
                     P(r[4], ParagraphStyle("d", parent=SMALL, fontSize=6.6, leading=8.6,
                                            textColor=OKGREEN if r[4].startswith("yes") else MUTED))])
    return tbl(data, [58, 96, 142, 142, wid or (CW - 438)], fs=6.6)


# ---------------------------------------------------------------- diagrams --
def d_levels(c, w, h):
    band = [("L5  Exploratory / UAT", "manual, per release", MUTED, 0.32),
            ("L4  End-to-end UI journeys", "browser, live API", ACCENT, 0.46),
            ("L3  API contract", "verify_live.py — local app, live DB", AMBER, 0.62),
            ("L2  Component / logic", "verify_ward_estimate.mjs  ·  agent unit tests", TEAL, 0.80),
            ("L1  Data invariants", "SQL assertions over the live store", TEAL, 1.00)]
    y = h - 34
    for name, how, col, frac in band:
        bw = w * frac
        x = (w - bw) / 2
        box(c, x, y - 32, bw, 32, name, (how,), stroke=col,
            fill=TINT if col != AMBER else TINT2, tsize=7.2, lsize=6.2)
        y -= 38
    c.saveState()
    c.setStrokeColor(DANGER); c.setLineWidth(1.0); c.setDash(3, 2)
    c.rect(0, y - 34, w, 28, stroke=1, fill=0); c.setDash()
    c.setFont("Helvetica-Bold", 7); c.setFillColor(DANGER)
    c.drawString(6, y - 16, "GAP  —  nothing above exercises the DEPLOYED function.")
    c.setFont("Helvetica", 6.4); c.setFillColor(INK)
    c.drawString(250, y - 16, "L3 runs a local TestClient against the live database. Production is verified only at L4.")
    c.restoreState()
    caption(c, w, "Figure 1 — Test levels. The dashed band is the coverage gap this plan exists to close.", y=y - 48)


def d_states(c, w, h):
    specs = [("MEASURED", ["blue chip", "solid border", "sensor named", "advisory: basis=current"], ACCENT, TINT, False),
             ("ESTIMATED", ["amber chip", "DASHED border", "contributors + km listed", "advisory: basis=estimated"], AMBER, TINT2, True),
             ("UNAVAILABLE", ["no number at all", "'No coverage'", "advisory button DISABLED", "no request sent"], DANGER, WHITE, True)]
    bw = (w - 2 * 18) / 3
    for i, (t, l, col, fill, dash) in enumerate(specs):
        box(c, i * (bw + 18), h - 78, bw, 72, t, l, stroke=col, fill=fill, dashed=dash, tsize=8)
    c.saveState(); c.setFont("Helvetica-Bold", 6.8); c.setFillColor(DANGER)
    c.drawString(0, h - 96, "FAIL CONDITION:")
    c.setFont("Helvetica", 6.8); c.setFillColor(INK)
    c.drawString(74, h - 96, "any two of these three are visually indistinguishable at a glance, or a number appears under UNAVAILABLE.")
    c.restoreState()
    caption(c, w, "Figure 2 — Acceptance criteria for the ward reading panel. Visual distinctness is a requirement, not styling.", y=h - 112)


# -------------------------------------------------------------------- doc ---
def build():
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=MARGIN, bottomMargin=48,
                          title="VAYU-NET — Test Plan and Validation Procedures",
                          author="VAYU-NET", subject="UI/UX and backend validation")
    frame = Frame(MARGIN, 48, CW, PAGE_H - MARGIN - 48, id="main")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 60, CW, PAGE_H - 120, id="c")], onPage=_cover_bg),
        PageTemplate(id="body", frames=[frame], onPage=_footer)])
    s = []
    A = s.append

    # ------------------------------------------------------------- cover ---
    A(Spacer(1, 74))
    A(P("VAYU-NET", CTITLE))
    A(P("Test Plan &amp; Validation Procedures", ParagraphStyle(
        "cs", parent=CTITLE, fontSize=14, leading=18, textColor=colors.HexColor("#bfe0d9"))))
    A(Spacer(1, 14))
    A(P("Backend, data and UI/UX validation for the multi-agent urban air quality platform<br/>"
        "Delhi · Mumbai · Bengaluru", CSUB))
    A(Spacer(1, 120))
    A(P("This plan defines what must be true before VAYU-NET is handed to an operating agency, and the "
        "exact procedure for proving each of those things. It covers five test levels, 126 numbered "
        "cases, and a regression suite built from defects that reached production once.", BODY))
    A(Spacer(1, 8))
    A(tbl([["field", "value"],
           ["Generated", date.today().isoformat()],
           ["Companion document", "VAYU-NET_System_Design.pdf — architecture, schema, API reference"],
           ["Automated backend suite", "deploy/verify_live.py — 17 checks"],
           ["Automated estimator suite", "deploy/verify_ward_estimate.mjs — 12 assertions"],
           ["Frontend", "https://vayu-net-ten.vercel.app"],
           ["API", "https://vayu-net-api-ver-tex.vercel.app"]], [116, CW - 116], fs=7.6))
    A(Spacer(1, 12))
    A(P("<b>The governing principle of this plan.</b> VAYU-NET makes two kinds of claim that ordinary "
        "software does not: it tells a citizen whether the air they are about to breathe is dangerous, "
        "and it tells an officer which statute to cite. A defect in either is not a bug report — it is "
        "wrong health advice or an unsound legal claim. Test priority follows that, not code coverage.", NOTE))
    A(NextPageTemplate("body")); A(PageBreak())

    # ---------------------------------------------------------- contents ---
    A(P("Contents", H1))
    A(tbl([["§", "section", "cases"],
           ["1", "Scope, objectives and what 'correct' means here", "—"],
           ["2", "Test environments and the production-testing gap", "—"],
           ["3", "Risk model and defect severity", "—"],
           ["4", "Backend — data layer invariants", "DATA-01 … 16"],
           ["5", "Backend — agent chain correctness", "CHAIN-01 … 14"],
           ["6", "Backend — API contract", "API-01 … 22"],
           ["7", "UI/UX — Commissioner journey", "UIC-01 … 14"],
           ["8", "UI/UX — Resident journey", "UIR-01 … 16"],
           ["9", "UI/UX — cross-cutting: accessibility, responsive, states, i18n", "UX-01 … 18"],
           ["10", "Regression suite — defects that shipped once", "REG-01 … 14"],
           ["11", "Non-functional — performance, resilience, security", "NFR-01 … 09, SEC-01 … 03"],
           ["12", "Entry and exit criteria, sign-off", "—"],
           ["13", "Gaps in testability — what this plan cannot prove", "—"]],
          [26, CW - 106, 80], fs=8.2))

    # ---------------------------------------------------------------- §1 ---
    A(PageBreak())
    A(P("1 · Scope, objectives and what 'correct' means here", H1))
    A(P("In scope", H3))
    A(P("The deployed platform end to end: hourly ingestion, the five-stage agent chain, the Postgres "
        "store, all fourteen API endpoints, both user interfaces (war-room and citizen), the evidence-pack "
        "PDF generator, and the multilingual advisory path.", BODY))
    A(P("Out of scope", H3))
    A(P("Third-party availability (data.gov.in, Open-Meteo, NASA FIRMS, Anthropic, Vercel, Supabase) is "
        "not under test — but the platform's <i>behaviour when they fail</i> is, and is covered in §11. "
        "Load testing beyond a single concurrent officer is deferred: there is no multi-tenancy yet, so "
        "there is no realistic concurrency model to test against.", BODY))
    A(P("Four definitions of correct, in priority order", H3))
    A(tbl([["#", "the platform must never…", "why this ranks here"],
           ["1", P("…state a measured value it did not measure, or attach a health instruction to a number whose provenance it cannot support.", SMALL),
            P("This is the only output a member of the public acts on directly, without an expert in the loop.", SMALL)],
           ["2", P("…print a statutory citation over air that does not warrant enforcement, or rank a ward it cannot justify.", SMALL),
            P("An unsound legal claim damages the agency that issued it, and the platform's credibility is its entire value.", SMALL)],
           ["3", P("…present stale data as current, or a build artefact as a live reading.", SMALL),
            P("Both have happened. A freshness claim is load-bearing for every other claim on the screen.", SMALL)],
           ["4", P("…lose an hour of ingestion silently.", SMALL),
            P("data.gov.in serves only the current hour and there is no backfill, so a gap is permanent and degrades detection for days.", SMALL)]],
          [16, 190, CW - 206]))
    A(P("Everything else — layout, latency, polish — is subordinate. A test failure in category 1 or 2 "
        "blocks release regardless of how minor it looks.", NOTE))

    # ---------------------------------------------------------------- §2 ---
    A(PageBreak())
    A(P("2 · Test environments and the production-testing gap", H1))
    A(Diagram(CW, 302, d_levels))
    A(Spacer(1, 4))
    A(P("<b>The single most important thing a tester must know about this platform:</b> "
        "<font face='Courier'>deploy/verify_live.py</font> builds a "
        "<font face='Courier'>TestClient(app)</font> from the <i>local</i> "
        "<font face='Courier'>service/live_api.py</font> and points it at the <i>live</i> database. It "
        "therefore validates local code against production data and never calls the deployed Vercel "
        "function. It has already reported ALL PASSED while the deployed API was serving materially "
        "different behaviour.", WARN))
    A(P("Consequence for this plan: <b>every API case in §6 must be run twice</b> — once via the suite "
        "(fast, catches logic regressions) and once with <font face='Courier'>curl</font> against the "
        "deployed URL before sign-off. Only the second run is evidence about production.", BODY))
    A(Spacer(1, 4))
    A(P("Environments", H2))
    A(tbl([["environment", "frontend", "API", "database", "used for"],
           ["Local dev", "vite dev server, VITE_API_URL set", "deployed API", "live Supabase", "UI development, L4 rehearsal"],
           ["Local backend", "n/a", "TestClient(app)", "live Supabase", "L1–L3 automated suites"],
           ["Production", "vayu-net-ten.vercel.app", "vayu-net-api-ver-tex.vercel.app", "live Supabase", "L4 sign-off, smoke tests"]],
          [72, 132, 118, 66, CW - 388]))
    A(P("<b>There is one database.</b> No staging instance exists, so every test above runs against "
        "production data. Two rules follow, and they are not optional:", BODY))
    A(P("<b>1 · Never run write-path tests casually.</b> <font face='Courier'>POST /ingest</font> and "
        "<font face='Courier'>POST /replay/run</font> both rewrite <font face='Courier'>attributions</font> "
        "and truncate/rebuild <font face='Courier'>actions</font>. They are safe to run (the chain is "
        "designed to be re-runnable) but they change what every other tester sees mid-session. Coordinate, "
        "and record the run_id.<br/>"
        "<b>2 · Take a backup before any destructive test.</b> A full parquet dump of all nine tables "
        "already exists at <font face='Courier'>_backup/*.parquet</font>; refresh it first.", WARN))

    # ---------------------------------------------------------------- §3 ---
    A(PageBreak())
    A(P("3 · Risk model and defect severity", H1))
    A(P("Severity is assigned by what the defect causes a person to believe, not by how much code is "
        "involved. A one-character CSS change that makes an estimate look measured is Sev-1.", BODY))
    A(tbl([["sev", "definition", "example from this platform's history", "release"],
           [P("<b><font color='#9b2c2c'>1</font></b>", SMALL),
            P("The platform asserts something false about air quality or law, to a user who will act on it.", SMALL),
            P("Every sensor-less ward displayed the city mean of 130 as if measured, while the sensor 1.3 km away read 448 Severe.", SMALL),
            P("<b>Blocks</b>", SMALL)],
           [P("<b><font color='#8a5a12'>2</font></b>", SMALL),
            P("A core function is unavailable or silently wrong, but the error is visible or bounded.", SMALL),
            P("The Events tab rendered the oldest 80 events instead of the newest, so recent activity was invisible.", SMALL),
            P("<b>Blocks</b>", SMALL)],
           [P("<b>3</b>", SMALL),
            P("Degraded behaviour with a correct fallback, or a defect confined to a non-critical view.", SMALL),
            P("Metrics tab showed blank 48h/72h rows because the inventory table was excluded from the bundle.", SMALL),
            P("Fix before pilot", SMALL)],
           [P("<b>4</b>", SMALL),
            P("Cosmetic, or an inconvenience with an obvious workaround.", SMALL),
            P("Map goes blank after repeated reloads in one tab — a WebGL context limit, not a platform fault.", SMALL),
            P("Backlog", SMALL)]],
          [22, 132, CW - 226, 72]))
    A(Spacer(1, 6))
    A(P("Risk-ranked areas", H2))
    A(tbl([["area", "risk", "why", "depth"],
           ["Ward AQI provenance", P("<b><font color='#9b2c2c'>Critical</font></b>", SMALL), "Directly drives public health advice; 87% of ward values are interpolated", "Exhaustive — §8, §10"],
           ["Enforcement floor and ranking", P("<b><font color='#9b2c2c'>Critical</font></b>", SMALL), "Produces statutory citations", "Exhaustive — §5"],
           ["Freshness reporting", P("<b><font color='#8a5a12'>High</font></b>", SMALL), "Every other claim depends on it; has failed before", "Full — §4, §6"],
           ["Ingest continuity", P("<b><font color='#8a5a12'>High</font></b>", SMALL), "Gaps are permanent and degrade detection for days", "Full — §5, §11"],
           ["Attribution confidence", P("<b><font color='#8a5a12'>High</font></b>", SMALL), "Shown as a percentage; users will read it as precision", "Full — §5"],
           ["Translation fidelity", P("Medium", SMALL), "Validated with fallback, but a mistranslated band is a health error", "Sampled — §9"],
           ["Map rendering", P("Low", SMALL), "Read-only visualisation with a table equivalent", "Smoke — §7"]],
          [116, 52, CW - 288, 120]))

    # ---------------------------------------------------------------- §4 ---
    A(PageBreak())
    A(P("4 · Backend — data layer invariants", H1))
    A(P("Run against the live store. These hold at all times, not merely after a pipeline run. "
        "<b>No FOREIGN KEY constraints are declared anywhere in this schema</b>, so referential integrity "
        "is not enforced by the database and must be asserted here — that is precisely how the "
        "duplicate-station-identity defect stayed invisible.", BODY))
    A(cases([
        ("DATA-01", "readings_hourly idempotency", "Run POST /ingest twice for the same hour. Compare count(*) before and after the second run.",
         "Row count unchanged. The (station_id, h) primary key makes the repeat an update.", "yes"),
        ("DATA-02", "No band on a null AQI", "GET /cities/delhi/stations; filter rows where aqi is null.",
         "Every such row has band = null. A NaN must never fall through to 'Severe'.", "yes"),
        ("DATA-03", "No duplicate sensor identity", "Group stations by lower(trim(station_name)); look for names mapping to >1 station_id.",
         "Zero duplicates. Two id schemes for one sensor halve the ward mapping.", "yes"),
        ("DATA-04", "Ward mapping coverage", "GET /cities; compare stations vs mapped per city.",
         "Delhi 46/46. Any unmapped sensor is reported, never silently dropped.", "yes"),
        ("DATA-05", "No orphan ward references", "SQL: stations left join wards on ward_id where ward_id is not null and wards.ward_id is null.",
         "Zero rows. No FK exists, so this must be asserted.", "no — add"),
        ("DATA-06", "No orphan attributions", "SQL: attributions left join stations using (station_id) where stations.station_id is null.",
         "Zero rows.", "no — add"),
        ("DATA-07", "Confidence bounds", "SQL: select min(confidence), max(confidence) from attributions.",
         "Within [0, 100]. A softmax output outside this indicates a scoring defect.", "no — add"),
        ("DATA-08", "Category domain", "SQL: select distinct category from attributions.",
         "Subset of the five allowed categories. No nulls, no unexpected values.", "no — add"),
        ("DATA-09", "No zero-priority action", "GET /cities/{c}/actions for all three cities.",
         "Every priority > 0. Sub-floor wards are dropped, never ranked at 0.00.", "yes"),
        ("DATA-10", "Era domain and split", "SQL: select distinct era from actions; check both pools ranked independently.",
         "Only 'live' and 'episode'. Each capped at 10 per city.", "yes"),
        ("DATA-11", "actions is a projection, not a log", "Record max(action_id); run the chain; re-read.",
         "action_id restarts from 1. The table is DELETEd and rebuilt — it must not grow unbounded.", "no — add"),
        ("DATA-12", "fires idempotency", "Re-run etl/fetch_fires_live.py; compare row count.",
         "No duplicate detections; (h, latitude, longitude) is the key.", "no"),
        ("DATA-13", "llm_spend is a singleton", "SQL: select count(*) from llm_spend.",
         "Exactly 1 row, id = 1. More than one means the cap can be bypassed.", "no — add"),
        ("DATA-14", "ops_config is locked", "Check RLS enabled and anon/authenticated grants revoked.",
         "RLS on, no policy, no grants. This table holds the ingest token.", "yes"),
        ("DATA-15", "Timezone sanity", "SQL: select max(h) from readings_hourly; compare with (now() at time zone 'Asia/Kolkata').",
         "max(h) is in the past. A future timestamp means the 5h30m skew has returned.", "no — add"),
        ("DATA-16", "RLS parity across tables", "Query pg_class.relrowsecurity for all nine tables.",
         "All nine enabled. <b>Currently warns: fires and llm_spend are RLS-off</b> — reported, not "
         "failed, while the item is deferred; see §11 SEC-03.", "yes — warn"),
    ]))
    A(P("<b>Seven of these sixteen are not yet automated.</b> They are the highest-value additions to "
        "<font face='Courier'>verify_live.py</font>, because each asserts an invariant the database "
        "itself does not enforce.", NOTE))

    # ---------------------------------------------------------------- §5 ---
    A(PageBreak())
    A(P("5 · Backend — agent chain correctness", H1))
    A(P("These are the tests that decide whether an enforcement recommendation is defensible. Several "
        "require synthetic input: build a small fixture DataFrame rather than waiting for the weather to "
        "cooperate.", BODY))
    A(cases([
        ("CHAIN-01", "Relative-spike detection", "Fixture: flat 40 µg/m³ series, then one hour at 200. Call detect_events().",
         "Exactly one relative_spike event, z-score > 2.5.", "no"),
        ("CHAIN-02", "Median/MAD robustness", "Fixture with a single 600 µg/m³ outlier inside the 48h window, then a genuine spike.",
         "The outlier does not inflate the baseline enough to mask the later spike. Mean/σ would fail this.", "no"),
        ("CHAIN-03", "Severe crossing is edge-triggered", "Fixture: PM2.5 rises 240 → 260 → 280 → 300.",
         "One severe_crossing at the 240→260 transition only. Not one per hour above 250.", "no"),
        ("CHAIN-04", "Baseline lag", "Fixture where the current hour is the largest value seen.",
         "The current reading is excluded from its own baseline (shift(1)), so it can still trip.", "no"),
        ("CHAIN-05", "Log-odds cap enforced", "Construct an event where one signal is overwhelmingly strong.",
         "That signal's contribution clips at 1.5; it cannot alone drive confidence to ~100%.", "no"),
        ("CHAIN-06", "Confidence is a distribution", "Attribute any event; sum the per-category scores.",
         "Sums to 100 across the five categories. Reported confidence is the argmax share.", "no"),
        ("CHAIN-07", "No model call in the hot path", "Record llm_spend.calls; run the full chain; re-read.",
         "calls unchanged. The automated cycle is template-only and must spend nothing.", "no — add"),
        ("CHAIN-08", "Enforcement floor — below", "Fixture ward with mean_pm25 = 59.",
         "No action produced. Not an action at priority 0.", "no"),
        ("CHAIN-09", "Enforcement floor — above", "Same fixture at mean_pm25 = 61.",
         "Exactly one action, priority > 0, with a statute attached.", "no"),
        ("CHAIN-10", "Era isolation", "Inspect live-pool actions after a run.",
         "No action in the live pool has last_seen older than the 3-day live cutoff. December cannot outrank the present.", "yes"),
        ("CHAIN-11", "Vulnerability bounds", "SQL: select min(vulnerability), max(vulnerability) from actions.",
         "Within [1.0, 1.5]. Outside that, the normalisation has broken.", "no"),
        ("CHAIN-12", "Persistence monotonicity", "Two fixture wards, identical but for event duration (2h vs 20h).",
         "The longer-lived ward ranks higher, all else equal.", "no"),
        ("CHAIN-13", "Re-run does not duplicate", "Run the chain twice; count attributions in the live window.",
         "Count is stable. The live window is deleted then reinserted.", "no — add"),
        ("CHAIN-14", "Empty input is survivable", "Run the chain against a window with zero detected events.",
         "Returns cleanly with events: 0. No exception, no partial write, actions left empty rather than stale.", "no"),
    ]))
    A(P("<b>Audit-trail check (manual, every release).</b> Pick any action shown in the UI. Using its "
        "<font face='Courier'>run_id</font> from <font face='Courier'>/agent_log</font>, walk back: "
        "action → the attributions it aggregated → the readings those events came from. Every number on "
        "screen must reconcile to a stored row. If any step cannot be traced, that is Sev-1 — the audit "
        "trail is the platform's core claim.", NOTE))

    # ---------------------------------------------------------------- §6 ---
    A(PageBreak())
    A(P("6 · Backend — API contract", H1))
    A(P("Run each case twice: against <font face='Courier'>TestClient</font> via the suite, and with "
        "<font face='Courier'>curl</font> against the deployed URL. Divergence between the two is itself "
        "a Sev-2 finding — it means production is running different code.", BODY))
    A(cases([
        ("API-01", "Health reports true store state", "GET /health.", "ok:true, store:'supabase', a readings count, newest_reading, age_hours from the DB clock.", "yes"),
        ("API-02", "Freshness is not a build artefact", "Compare /health.newest_reading with SQL max(h).", "Identical. The banner once showed build time, 12 days stale.", "yes"),
        ("API-03", "Ingest configuration is observable", "GET /health; read ingest_configured and ingest_token_source.", "Source is one of env | ops_config | unset | unavailable — distinguishes 'saved' from 'visible to the code'.", "yes"),
        ("API-04", "Station payload shape", "GET /cities/delhi/stations.", "Each row carries station_id, station_name, lat, lon, ward_id, pm25, pm10, as_of, aqi, band.", "yes"),
        ("API-05", "Events are newest-first", "GET /cities/delhi/events; inspect the first and last h.", "Descending by h. The UI slices the head, so ordering is load-bearing.", "yes"),
        ("API-06", "Event limit honoured", "GET /cities/delhi/events?limit=10.", "Exactly 10 rows.", "no"),
        ("API-07", "Actions ordered by priority", "GET /cities/delhi/actions.", "Descending priority, all > 0.", "yes"),
        ("API-08", "Era filter", "GET /cities/delhi/actions?era=live and ?era=episode.", "Disjoint sets; each ≤10 per city.", "yes"),
        ("API-09", "Compare computed in SQL", "GET /compare; check Delhi's event count.", "Not exactly 300. Client-side derivation once hit the page cap and always reported 300.", "yes"),
        ("API-10", "Metrics completeness", "GET /metrics.", "live_store block populated; no blank 48h/72h rows; fires status present.", "yes"),
        ("API-11", "Evidence pack renders", "GET /actions/{id}/pack.pdf for a valid id.", "A non-trivial PDF (>10 KB), content-type application/pdf.", "yes"),
        ("API-12", "Evidence pack — bad id", "GET /actions/999999/pack.pdf.", "A clean error, not a stack trace or a zero-byte PDF.", "no"),
        ("API-13", "Ingest rejects no token", "POST /ingest with no header.", "401. Never 200.", "yes"),
        ("API-14", "Ingest rejects wrong token", "POST /ingest with a wrong bearer token.", "401, constant-time comparison.", "yes"),
        ("API-15", "Ingest disabled without config", "Unset both token sources in a scratch environment; POST /ingest.", "503 with an explanatory error — it must not run unauthenticated.", "no"),
        ("API-16", "Token never in the query string", "Review access patterns and docs.", "Header-only. A query-string token is logged by every proxy in the path.", "manual"),
        ("API-17", "Advisory — measured basis", "GET /advisory?...&basis=current.", "Text contains 'measured now'; response echoes basis:'current'.", "yes"),
        ("API-18", "Advisory — estimated basis", "GET /advisory?...&basis=estimated.", "Text says 'an estimated AQI …, interpolated'; never the word 'measured'; echoes basis.", "yes"),
        ("API-19", "Advisory — unknown basis degrades safely", "GET /advisory?...&basis=nonsense.", "Degrades to 'estimated', never to 'current'. Overstating certainty is the harmful direction.", "yes"),
        ("API-20", "Advisory — AQI survives every basis", "Render the template for all three bases.", "The AQI digits appear in all three. The validator drops any translation that loses them.", "yes"),
        ("API-21", "Translation validation", "Request lang=hi with a correct Devanagari sample; then one with a wrong number.", "Correct one passes even with ३४० numerals; wrong number rejected.", "yes"),
        ("API-22", "CORS posture", "Inspect Access-Control-Allow-Origin.", "Currently '*'. Documented as an open gap — see SEC-01.", "manual"),
    ]))

    # ---------------------------------------------------------------- §7 ---
    A(PageBreak())
    A(P("7 · UI/UX — Commissioner journey", H1))
    A(P("Persona: a pollution control board officer deciding where to send an inspection team today. "
        "Test on the deployed site, in a fresh tab. Repeated reloads in one tab exhaust WebGL contexts "
        "and the map goes blank — a browser artefact, not a defect.", BODY))
    A(cases([
        ("UIC-01", "Freshness banner truthfulness", "Load the site; compare the banner against /health.age_hours.", "Age matches the API, stated as a real age ('under an hour old'), never as a promised cadence.", "no"),
        ("UIC-02", "City switch refetches", "Switch Delhi → Mumbai → Bengaluru.", "Map recentres; all tabs repopulate; no stale rows from the previous city.", "no"),
        ("UIC-03", "Era toggle changes the pool", "Toggle Live ↔ Crisis episode on Actions.", "Content changes; live shows recent wards, episode shows the December set.", "no"),
        ("UIC-04", "Action card completeness", "Open Actions for Delhi, live era.", "Each card shows priority, ward, category badge, confidence %, event count, mean/max PM2.5, the intervention and the statute.", "no"),
        ("UIC-05", "Priority ordering is visible", "Read the priority values top to bottom.", "Monotonically decreasing. An officer must be able to trust the first card is the top priority.", "no"),
        ("UIC-06", "Evidence pack opens and reconciles", "Click Evidence pack on the top action.", "PDF opens; ward, category, PM2.5 figures and statute match the card exactly.", "no"),
        ("UIC-07", "Empty state reads as an answer", "Open Actions for Bengaluru, live era.", "An explicit 'no enforcement action in the last 72 hours' message with the reason — not a blank panel that looks broken.", "no"),
        ("UIC-08", "Events newest-first", "Open Events; read the timestamps.", "Most recent at the top. This regressed once to oldest-first.", "no"),
        ("UIC-09", "Live hotspots appear above events", "Events tab, live era, Delhi.", "Stations ≥ AQI 201 listed above the event cards, labelled as needing no history.", "no"),
        ("UIC-10", "Evidence bullets render", "Expand any event card.", "Up to three evidence bullets from evidence_json; no raw JSON leaking into the UI.", "no"),
        ("UIC-11", "Compare is genuinely comparable", "Open Compare.", "All three cities scored on one formula; the note explaining identical terms is present.", "no"),
        ("UIC-12", "Replay reports latency", "Run Replay.", "Returns a timed log ending with signal_to_action_seconds; UI shows it ran live, not precomputed.", "no"),
        ("UIC-13", "Stale sensors are visually distinct", "Inspect map dots in live era.", "Archive-only stations render smaller and greyed, never as a live coloured reading.", "no"),
        ("UIC-14", "Attribution disclaimer present", "Check the footer and any category badge.", "'Evidence-weighted likelihood with confidence, not legal proof' visible. This must never be removed.", "no"),
    ]))

    # ---------------------------------------------------------------- §8 ---
    A(PageBreak())
    A(P("8 · UI/UX — Resident journey", H1))
    A(P("Persona: a resident checking whether it is safe to send a child outside. This is the highest-risk "
        "surface in the platform: the advice is acted on immediately, by someone with no way to audit it.", BODY))
    A(Diagram(CW, 132, d_states))
    A(Spacer(1, 6))
    A(cases([
        ("UIR-01", "Measured ward", "Select 'I.P EXTENTION — Anand Vihar'.", "MEASURED chip, solid border, value matches the map dot and /stations exactly, sensor named.", "no"),
        ("UIR-02", "Estimated ward", "Select 'ANAND VIHAR' (the ward, which holds no sensor).", "ESTIMATED chip, dashed amber border, 'No sensor in this ward', contributor list with distances, confidence stated.", "no"),
        ("UIR-03", "Estimate is not the city mean", "Compare several sensor-less wards.", "Values differ across wards. One number repeated everywhere is the regression this replaced.", "yes"),
        ("UIR-04", "Worse neighbour is surfaced", "Select a ward adjacent to a Severe sensor.", "Red panel naming that sensor, its AQI, band and distance, advising the worse guidance.", "no"),
        ("UIR-05", "No-coverage refusal", "Select a ward with no sensor within 8 km.", "No number at all. 'No coverage'. Advisory button disabled.", "yes"),
        ("UIR-06", "Disabled button explains itself", "On a no-coverage ward, look for the reason.", "The panel states why no advisory can be issued; the disabled control is not unexplained.", "no"),
        ("UIR-07", "Landmark in the ward list", "Open the ward dropdown.", "Wards holding a sensor show 'WARD NAME — Sensor'. Municipal charge names alone are unsearchable.", "no"),
        ("UIR-08", "Advisory matches provenance", "Get an advisory on an estimated ward.", "Text says 'an estimated AQI …, interpolated'. The word 'measured' must not appear.", "no"),
        ("UIR-09", "Version-skew guard", "Point the client at an API predating the basis field.", "Client falls back to the local CPCB template; source reads 'API did not confirm basis'.", "no"),
        ("UIR-10", "Audience group changes guidance", "Cycle schools / outdoor workers / elderly / general at the same AQI.", "Guidance text changes appropriately; band-specific wording is CPCB's, not generated.", "no"),
        ("UIR-11", "Hindi advisory", "Request lang=hi.", "Devanagari renders; the AQI number is present and correct in any numeral system; source is llm_translated.", "no"),
        ("UIR-12", "Marathi and Kannada", "Repeat for mr and kn.", "Correct script, correct number, no fallback to English unless the model failed.", "no"),
        ("UIR-13", "Translation failure falls back safely", "Simulate a model error or exhausted budget.", "English CPCB template shown, clearly sourced. Never a blank advisory or a partial translation.", "no"),
        ("UIR-14", "Text-to-speech", "Press Listen for each language.", "Speech uses the matching locale (hi-IN, mr-IN, kn-IN). Wrong locale renders the text unintelligible.", "no"),
        ("UIR-15", "Stale sensors excluded", "Check a ward whose only sensor is archive-only.", "That sensor does not contribute. Winter values once appeared behind a monsoon-season advisory.", "no"),
        ("UIR-16", "Ward POI context", "Read the line under the ward selector.", "School and hospital counts shown with OpenStreetMap attribution.", "no"),
    ]))

    # ---------------------------------------------------------------- §9 ---
    A(PageBreak())
    A(P("9 · UI/UX — cross-cutting validation", H1))
    A(P("Accessibility", H2))
    A(P("This platform will be used by a public body and must be usable by the public. The current design "
        "encodes AQI severity <b>primarily in colour</b>, which is the most common accessibility failure in "
        "air-quality interfaces and is a genuine finding here, not a hypothetical.", BODY))
    A(cases([
        ("UX-01", "Severity is not colour-only", "View the citizen panel and map in a deuteranopia simulator.", "Band is still identifiable — the band name is always shown as text beside the value. <b>Map dots currently rely on colour alone.</b>", "no"),
        ("UX-02", "Contrast ratios", "Run an automated contrast audit on both views.", "Body text ≥ 4.5:1, large text ≥ 3:1 against the dark ground.", "no"),
        ("UX-03", "Keyboard navigation", "Traverse the citizen flow with Tab and Enter only.", "Ward select, group buttons, language buttons and Get my advisory are all reachable and operable.", "no"),
        ("UX-04", "Focus visibility", "Tab through both views.", "A visible focus ring at every stop.", "no"),
        ("UX-05", "Screen-reader labelling", "Traverse with a screen reader.", "The AQI figure is announced with its band and provenance, not as a bare number.", "no"),
        ("UX-06", "Provenance survives magnification", "Zoom to 200%.", "The ESTIMATED chip and dashed border remain visible; provenance must not be the first thing lost.", "no"),
    ], wid=CW - 438))
    A(P("Responsive and device behaviour", H2))
    A(cases([
        ("UX-07", "Citizen mode on a phone", "Load at 360×640.", "Ward selector, value, guidance and Listen all usable without horizontal scrolling. Residents are on phones.", "no"),
        ("UX-08", "War-room on a laptop", "Load at 1366×768.", "Map and rail both usable; action cards not truncated.", "no"),
        ("UX-09", "Tap targets", "Measure the language and group buttons on mobile.", "≥ 44×44 px.", "no"),
        ("UX-10", "Map absence is survivable", "Disable WebGL.", "Tabular data still renders. The map is an enhancement, not the only path to the information.", "no"),
    ], wid=CW - 438))
    A(P("States, errors and internationalisation", H2))
    A(cases([
        ("UX-11", "Loading states", "Throttle the network to slow 3G; load both views.", "Explicit loading indication; no flash of an empty or zeroed reading that could be misread as data.", "no"),
        ("UX-12", "API unreachable", "Block the API host; reload.", "The static demo fallback engages and the footer says 'static deployment', so no one mistakes a snapshot for live data.", "no"),
        ("UX-13", "Partial data", "Point at a city with sensors reporting nulls.", "Null sensors are excluded, not rendered as 0 or as a band.", "no"),
        ("UX-14", "Empty is not error", "View a city with no live actions.", "Reads as a deliberate answer with a reason, visually distinct from a failure.", "no"),
        ("UX-15", "Indic script rendering", "View Hindi, Marathi, Kannada advisories on Windows, macOS, Android.", "No tofu boxes, no clipped conjuncts, correct line breaking.", "no"),
        ("UX-16", "Numerals in translation", "Inspect a Marathi advisory.", "Whichever numeral system is used, the value equals the English one. ३८० and 380 are both acceptable; a different number is Sev-1.", "no"),
        ("UX-17", "Long ward names", "Select the longest ward name in each city.", "No overflow, no truncation that hides the landmark suffix.", "no"),
        ("UX-18", "Copy accuracy", "Read every user-facing claim on both views.", "No text asserts a refresh cadence, a measurement, or a legal conclusion the system cannot support.", "no"),
    ], wid=CW - 438))

    # --------------------------------------------------------------- §10 ---
    A(PageBreak())
    A(P("10 · Regression suite — defects that shipped once", H1))
    A(P("Every case here corresponds to a defect that reached production. They are the highest-yield tests "
        "in this plan: each represents a failure mode this codebase has actually demonstrated. Most already "
        "have an automated assertion; the rest should get one.", BODY))
    A(cases([
        ("REG-01", "band(NaN) returned 'Severe'", "Feed a null AQI through the band function and the stations endpoint.", "Returns null. No-data sensors were painted blood red.", "yes"),
        ("REG-02", "Duplicate station identity", "Assert no station_name maps to two station_ids.", "163 rows collapsed to 90 real sensors; every live row had lost its ward.", "yes"),
        ("REG-03", "Single enforcement pool", "Confirm live and episode ranked separately.", "December's crisis outranked every current event permanently.", "yes"),
        ("REG-04", "Zero-priority actions", "Assert every action has priority > 0.", "Whole cities of actions tied at 0.00, each citing a statute over Good air.", "yes"),
        ("REG-05", "Freshness from a build artefact", "Compare the banner with the DB clock.", "Banner showed the last successful build — 12 days stale — while the store was 2h old.", "yes"),
        ("REG-06", "Timezone skew", "Assert max(h) is not in the future.", "IST wall-clock compared against a UTC now() skewed every window by 5h30m.", "no — add"),
        ("REG-07", "Events tab showed the oldest 80", "Check the first card is the newest event.", "Tail-and-reverse dropped every recent event.", "no — add"),
        ("REG-08", "Metrics blank rows", "Assert 48h/72h rows and the inventory table are populated.", "The inventory table was excluded from the serverless bundle by .vercelignore.", "yes"),
        ("REG-09", "Compare hit the page cap", "Assert Delhi's event count is not exactly 300.", "Client-side derivation always reported the 300-row cap as the true count.", "yes"),
        ("REG-10", "Spend tracker raised after billing", "Call budget.record with a stub usage object.", "Persists and never raises. It previously discarded paid translations by writing to a read-only path.", "yes"),
        ("REG-11", "Validator rejected Devanagari numerals", "Validate a correct Hindi translation using ३४०.", "Accepted. Rejection silently served English instead.", "yes"),
        ("REG-12", "City mean shown as a ward reading", "Assert no single value dominates the ward set.", "251 of 290 Delhi wards showed 130 while Anand Vihar measured 448.", "yes"),
        ("REG-13", "Estimate described as measured", "Assert basis=estimated text omits 'measured'.", "The deployed API answered 'measured now' over interpolated values.", "yes"),
        ("REG-14", "Ingest workflow installed the wrong requirements", "Confirm the pipeline job uses requirements-pipeline.txt.", "main.yml failed 19 consecutive runs on missing duckdb/lightgbm/shapely.", "no — add"),
    ]))

    # --------------------------------------------------------------- §11 ---
    A(PageBreak())
    A(P("11 · Non-functional — performance, resilience, security", H1))
    A(cases([
        ("NFR-01", "Ingest inside the function limit", "Time POST /ingest.", "Completes well inside Vercel's 60 s ceiling; ~15 s is the observed norm.", "no"),
        ("NFR-02", "Cold-start latency", "Call /health after idle.", "Responds within a few seconds; the connection helper reconnects rather than hanging.", "no"),
        ("NFR-03", "Connection reuse", "Issue repeated requests to a warm instance.", "One connection per warm instance, revalidated with select 1; no per-request reconnect cost.", "no"),
        ("NFR-04", "IPv6 fallback", "Force the direct Supabase host.", "Falls back to the IPv4 pooler. Direct resolves IPv6-only and hangs on IPv4-only runners.", "no"),
        ("NFR-05", "Evidence pack generation time", "Request a pack cold.", "Returns inside the function limit; matplotlib rendering is the slowest path.", "no"),
        ("NFR-06", "Ingest gap detection", "Query hours captured over the last 24.", "Gaps are visible and alertable. Currently a person must look — see §13.", "no"),
        ("NFR-07", "Upstream outage — data.gov.in", "Simulate a failed fetch.", "Retries with backoff, then fails cleanly. No partial or corrupt write.", "no"),
        ("NFR-08", "Upstream outage — FIRMS", "Simulate a fire-fetch failure.", "Pipeline continues; the fire layer reports 'archive-only' rather than degrading silently behind a green check.", "no"),
        ("NFR-09", "Budget cap enforced", "Set llm_spend.usd near the cap; request a translation.", "Refused before the call is billed; English template served.", "no"),
        ("SEC-01", "No authentication", "Request every endpoint with no credentials.", "All succeed. <b>Documented open gap — blocks agency pilot.</b> CORS is '*'.", "manual"),
        ("SEC-02", "Ingest token strength", "Attempt a near-miss token.", "401, constant-time comparison, no timing signal.", "yes"),
        ("SEC-03", "RLS parity", "Check relrowsecurity on all nine tables.", "<b>Currently warns.</b> fires and llm_spend are RLS-off with full anon grants — latent, since the anon key is not published, but it makes both world-writable the moment it is. Reported as a warning, not a failure, while the fix is deferred.", "yes — warn"),
    ]))
    A(P("<b>SEC-03 detail.</b> The other seven tables have RLS enabled, which renders their identical "
        "<font face='Courier'>anon</font> grants inert. On <font face='Courier'>fires</font> and "
        "<font face='Courier'>llm_spend</font> the grants are live: SELECT through TRUNCATE. Resetting "
        "<font face='Courier'>llm_spend.usd</font> would defeat the spend cap; truncating "
        "<font face='Courier'>fires</font> would silently empty a 17,000-row evidence layer. Verified not "
        "currently exploitable — the anon key appears in neither the deployed bundle nor the frontend "
        "source, and PostgREST returns 401 without it. Enabling RLS on both is the fix and breaks nothing, "
        "since neither is read through PostgREST.", WARN))

    # --------------------------------------------------------------- §12 ---
    A(PageBreak())
    A(P("12 · Entry and exit criteria", H1))
    A(P("Entry criteria — testing may begin when", H3))
    A(P("Both automated suites run clean on the candidate build; a fresh parquet backup of all nine tables "
        "exists; the deployed API and frontend commit SHAs are recorded and known to each other; and the "
        "feed is under two hours old, so freshness-dependent cases are meaningful.", BODY))
    A(P("Exit criteria — the build may ship when", H3))
    A(tbl([["#", "criterion"],
           ["1", P("Zero open Sev-1 or Sev-2 defects. No exceptions, no deferrals.", SMALL)],
           ["2", P("All §4 data invariants pass against the live store, including the seven not yet automated.", SMALL)],
           ["3", P("All §10 regression cases pass. A regression failure means a fixed defect has returned.", SMALL)],
           ["4", P("Every §6 API case has been run <b>against the deployed URL</b>, not only via the suite.", SMALL)],
           ["5", P("The three ward states (§8) verified visually distinct on the deployed site by a second person.", SMALL)],
           ["6", P("An end-to-end audit walk (§5) completed: one action traced to attributions to readings.", SMALL)],
           ["7", P("Open security gaps re-confirmed as documented and accepted in writing by the receiving agency.", SMALL)]],
          [16, CW - 16]))
    A(P("Sign-off", H2))
    A(tbl([["role", "confirms", "signature", "date"],
           ["Backend engineer", "§4, §5, §6, §11 executed and recorded", "", ""],
           ["Frontend engineer", "§7, §8, §9 executed on the deployed site", "", ""],
           ["Reviewer (second pair of eyes)", "§8 ward-state distinctness, §5 audit walk", "", ""],
           ["Receiving agency", "§13 limits and open security gaps accepted", "", ""]],
          [130, CW - 310, 100, 80]))

    # --------------------------------------------------------------- §13 ---
    A(PageBreak())
    A(P("13 · Gaps in testability", H1))
    A(P("Stated plainly. A test plan that does not say what it cannot prove is misleading, and this is the "
        "section a receiving agency should read first.", BODY))
    A(tbl([["gap", "consequence for validation"],
           [P("<b>No staging environment</b>", SMALL),
            P("Every test runs against production data. Destructive and write-path cases must be coordinated and backed up first. A genuine pre-production environment is the single largest improvement available to this plan.", SMALL)],
           [P("<b>No test fixtures for the agent chain</b>", SMALL),
            P("Most §5 cases are written as fixture-based but no fixture harness exists yet. Until it does, chain correctness is verified against whatever the weather happens to produce — which cannot exercise the enforcement-floor boundary on demand.", SMALL)],
           [P("<b>Forecast accuracy is unmeasurable at long horizons</b>", SMALL),
            P("A one-week feature window leaves fewer than 50 honest test rows at 48h and 72h, so the code correctly declines to print an accuracy figure. No test can validate what has not been measured. Resolves with accumulated history, not with code.", SMALL)],
           [P("<b>Ward estimates cannot be ground-truthed</b>", SMALL),
            P("Interpolated ward AQI has no reference value to compare against — that is why the ward has no sensor. Testing can prove the estimator is internally consistent, honestly labelled and correctly masked; it cannot prove the estimate is right. Treat the label, not the number, as the tested property.", SMALL)],
           [P("<b>No alerting</b>", SMALL),
            P("A failed cron or a stalled feed is currently noticed by a person looking at the banner. Continuous validation between releases does not exist.", SMALL)],
           [P("<b>No multi-user testing</b>", SMALL),
            P("Without authentication or multi-tenancy there is no permission model to test, and no realistic concurrency scenario. Both become testable only after those are built.", SMALL)]],
          [140, CW - 140]))
    A(Spacer(1, 8))
    A(P("Recommended first three investments", H2))
    A(P("<b>1 · Automate the seven missing §4 invariants</b> into <font face='Courier'>verify_live.py</font>. "
        "They assert referential integrity the database does not enforce, and they are cheap.<br/>"
        "<b>2 · Build the agent-chain fixture harness</b> so §5 boundary cases (enforcement floor, era "
        "isolation, log-odds cap) can run deterministically rather than waiting on weather.<br/>"
        "<b>3 · Add a deployed-endpoint smoke suite</b> that curls the production API and compares against "
        "the TestClient result. That closes the gap in Figure 1 — the one place where a green suite has "
        "already told a false story.", BODY))

    doc.build(s)
    print(f"Wrote {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    build()
