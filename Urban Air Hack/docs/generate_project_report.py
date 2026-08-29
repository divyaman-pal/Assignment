"""Generate VAYU-NET_Project_Report.pdf — what was built, what it does, what is proven.

The third document in the handover pack. The System Design describes how the
platform is built; the Test Plan describes what must be proven before it is
handed over; this report states what the platform actually is, what the current
evidence says, and what is honestly not yet true.

Shares the design system with generate_design_doc.py so the pack stays
visually consistent.

    python docs/generate_project_report.py
"""
import json
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
OUT = ROOT / "VAYU-NET_Project_Report.pdf"

FRONTEND = "https://vayu-net-ten.vercel.app"
APIURL = "https://vayu-net-api-ver-tex.vercel.app"


def metrics():
    """Read the real forecast metrics rather than restating remembered ones."""
    try:
        return json.loads((ROOT / "data" / "forecast_metrics.json").read_text(encoding="utf-8"))
    except Exception:
        return {}


def _footer(canv, doc):
    canv.saveState()
    canv.setStrokeColor(RULE); canv.setLineWidth(0.5)
    canv.line(MARGIN, 34, PAGE_W - MARGIN, 34)
    canv.setFont("Helvetica", 7.2); canv.setFillColor(MUTED)
    canv.drawString(MARGIN, 24, "VAYU-NET — Project Report")
    canv.drawRightString(PAGE_W - MARGIN, 24, f"page {canv.getPageNumber()}")
    canv.restoreState()


def _cover_bg(canv, doc):
    canv.saveState()
    canv.setFillColor(colors.HexColor("#1f3a5c"))
    canv.rect(0, PAGE_H - 250, PAGE_W, 250, stroke=0, fill=1)
    canv.setFillColor(colors.HexColor("#2c8375"))
    canv.rect(0, PAGE_H - 256, PAGE_W, 6, stroke=0, fill=1)
    canv.restoreState()


# ---------------------------------------------------------------- diagrams --
def d_chain(c, w, h):
    """The five-agent chain, with the store each stage reads and writes."""
    y = h - 46
    bw, gap = (w - 4 * 12) / 5.0, 12
    stages = [("SIGNAL", ["z-score vs", "station baseline"]),
              ("ATTRIBUTION", ["source class +", "confidence"]),
              ("FORECAST", ["LightGBM,", "5 horizons"]),
              ("ENFORCEMENT", ["ward ranking,", "statute + pack"]),
              ("ADVISORY", ["health text,", "5 languages"])]
    for i, (t, lines) in enumerate(stages):
        x = i * (bw + gap)
        box(c, x, y - 44, bw, 44, t, lines, fill=WHITE,
            stroke=ACCENT if i != 2 else AMBER)
        if i < 4:
            arrow(c, x + bw, y - 22, x + bw + gap, y - 22)
    box(c, 0, y - 96, w, 30, "Supabase readings_hourly · stations · wards · fires",
        ["every stage reads and writes here; the deployed API serves only from this store"],
        fill=TINT, stroke=TEAL)
    for i in range(5):
        arrow(c, i * (bw + gap) + bw / 2, y - 44, i * (bw + gap) + bw / 2, y - 66,
              dashed=True, color=TEAL)
    caption(c, w, "Figure 1 — the agent chain. The forecast stage is amber: it is the one "
                  "stage whose output is not currently better than a trivial baseline.")


def d_wardstates(c, w, h):
    """The three ward outcomes — the distinction that fixed the worst defect."""
    y = h - 40
    bw = (w - 2 * 16) / 3.0
    for i, (t, lines, col) in enumerate([
            ("MEASURED", ["sensor inside the ward", "worst sensor wins", "Delhi: 40 wards"], OKGREEN),
            ("ESTIMATED", ["no sensor, one within 8 km", "inverse-distance weighted", "Delhi: 247 wards"], AMBER),
            ("UNAVAILABLE", ["nearest sensor > 8 km", "NO number is shown", "Delhi: 3 wards"], DANGER)]):
        box(c, i * (bw + 16), y - 56, bw, 56, t, lines, fill=WHITE, stroke=col)
    caption(c, w, "Figure 2 — three outcomes, never blended. Before this, 251 of Delhi's 289 wards "
                  "showed the city arithmetic mean in 46px type, styled exactly like a real reading.")


def build():
    m = metrics()
    meta = m.get("_meta", {})
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                          topMargin=MARGIN, bottomMargin=48,
                          title="VAYU-NET — Project Report",
                          author="VAYU-NET", subject="Multi-agent urban air quality intelligence")
    frame = Frame(MARGIN, 48, CW, PAGE_H - MARGIN - 48, id="main")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[Frame(MARGIN, 60, CW, PAGE_H - 120, id="c")], onPage=_cover_bg),
        PageTemplate(id="body", frames=[frame], onPage=_footer)])
    s = []
    A = s.append

    # ------------------------------------------------------------- cover ---
    A(Spacer(1, 74))
    A(P("VAYU-NET", CTITLE))
    A(P("Project Report", ParagraphStyle(
        "cs", parent=CTITLE, fontSize=14, leading=18, textColor=colors.HexColor("#bfe0d9"))))
    A(Spacer(1, 14))
    A(P("Multi-agent urban air quality intelligence over India's CPCB CAAQMS network<br/>"
        "Delhi · Mumbai · Bengaluru", CSUB))
    A(Spacer(1, 116))
    A(P("This report states what VAYU-NET is, what it currently does on live government data, "
        "what has been proven about it, and what is not yet true. It is written to be read by "
        "someone deciding whether to pilot the platform — so the limitations are stated as "
        "plainly as the capabilities.", BODY))
    A(Spacer(1, 8))
    A(tbl([["field", "value"],
           ["Generated", date.today().isoformat()],
           ["Status", "Pilot-ready. Verified on live data. Not yet handover-complete — see §8"],
           ["Companion documents", "VAYU-NET_System_Design.pdf · VAYU-NET_Test_Plan.pdf"],
           ["Frontend", FRONTEND],
           ["API", APIURL],
           ["Data store", "Supabase Postgres (ap-south-1)"],
           ["Training data", meta.get("source", "—")],
           ["Data window", meta.get("window", "—")]], [116, CW - 116], fs=7.6))
    A(Spacer(1, 12))
    A(P("<b>What makes this different from an AQI dashboard.</b> VAYU-NET does not stop at "
        "showing a number. It attributes an episode to a likely source class with a confidence "
        "score, ranks which ward an officer should act on first, cites the statute that applies, "
        "and generates the evidence pack to support it. The product is prioritisation and "
        "evidence assembly — never proof of liability, and the interface says so.", NOTE))
    A(NextPageTemplate("body")); A(PageBreak())

    # ---------------------------------------------------------- contents ---
    A(P("Contents", H1))
    A(tbl([["§", "section"],
           ["1", "What the platform does"],
           ["2", "Architecture and the agent chain"],
           ["3", "The data: coverage, freshness, and one honest caveat"],
           ["4", "What is proven — verification results"],
           ["5", "The ward estimator: the defect that mattered most"],
           ["6", "Forecasting: measured honestly, and currently negative"],
           ["7", "Security posture"],
           ["8", "What is not yet true — gaps before agency handover"],
           ["9", "Engineering history: defects that shipped once"],
           ["10", "Recommended next investments"]],
          [26, CW - 26], fs=8.4))
    A(Spacer(1, 10))

    # ----------------------------------------------------------- 1 scope ---
    A(P("1 · What the platform does", H1))
    A(P("VAYU-NET ingests hourly readings from India's CPCB CAAQMS network for three cities, "
        "detects pollution episodes against each station's own baseline, attributes each episode "
        "to a likely source class, ranks wards for enforcement attention, and issues public "
        "health advisories in five languages. It runs unattended on an hourly schedule.", BODY))
    A(Spacer(1, 4))
    A(tbl([["capability", "what it produces", "state"],
           [P("<b>Live measurement</b>", SMALL),
            P("Hourly PM2.5/PM10 per sensor, CPCB National AQI, band and health "
              "guidance. Freshness read from the database clock, not a build artefact.", SMALL),
            P("<b>verified live</b>", ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))],
           [P("<b>Ward-level view</b>", SMALL),
            P("Every ward resolves to measured, estimated or unavailable — a ward with no "
              "sensor within 8 km is shown no number at all.", SMALL),
            P("<b>verified live</b>", ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))],
           [P("<b>Episode detection</b>", SMALL),
            P("Per-station z-score against a rolling baseline, plus severe-threshold "
              "crossings. 1,588 attributed events in the store.", SMALL),
            P("<b>verified live</b>", ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))],
           [P("<b>Source attribution</b>", SMALL),
            P("Evidence-weighted likelihood across traffic, biomass/fireworks, construction "
              "dust, industrial and secondary regional, with a confidence score and the "
              "signals behind it.", SMALL),
            P("<b>verified live</b>", ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))],
           [P("<b>Enforcement ranking</b>", SMALL),
            P("Wards ranked by severity x confidence x persistence x vulnerability, with a "
              "statutory citation and a one-page evidence-pack PDF.", SMALL),
            P("<b>verified live</b>", ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))],
           [P("<b>Advisories</b>", SMALL),
            P("Health text per ward, per risk group, in English, Hindi, Marathi, Kannada and "
              "Tamil. Provenance (measured / estimated / forecast) is always stated.", SMALL),
            P("<b>verified live</b>", ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))],
           [P("<b>Forecasting</b>", SMALL),
            P("LightGBM, five horizons from 6h to 72h, per station. Now trains on the live "
              "store. Currently does not beat a persistence baseline — see §6.", SMALL),
            P("<b>not yet useful</b>", ParagraphStyle("k", parent=SMALL, textColor=DANGER))]],
          [86, CW - 168, 82]))
    A(Spacer(1, 10))

    # ---------------------------------------------------- 2 architecture ---
    A(P("2 · Architecture and the agent chain", H1))
    A(P("Five agents run in sequence, each reading and writing the same Postgres store. The "
        "deployed API serves exclusively from that store — there is no bundled snapshot behind "
        "the live view, which is what makes the freshness banner trustworthy.", BODY))
    A(Diagram(CW, 150, d_chain))
    A(Spacer(1, 6))
    A(tbl([["layer", "technology", "note"],
           ["Ingest", "data.gov.in CPCB feed, hourly", "Serves only the current hour — a missed hour is gone permanently"],
           ["Schedule", "Supabase pg_cron, 5 * * * *", "GitHub Actions is the backup path, not the primary"],
           ["Store", "Supabase Postgres, ap-south-1", "9 tables; secrets resolve env-first then from ops_config"],
           ["Agents", "Python, LightGBM, pandas", "Chain: signal, attribution, forecast, enforcement, advisory"],
           ["API", "FastAPI on Vercel", "60s function budget; all row counts are capped"],
           ["Frontend", "React + Vite + MapLibre", "Separate Vercel project, same repo"],
           ["Satellite", "NASA FIRMS", "17,063 fire detections; fails soft by design"],
           ["Language", "Claude, budget-capped", "Falls back to a CPCB template if the model is unavailable"]],
          [64, 118, CW - 182]))
    A(PageBreak())

    # ------------------------------------------------------------ 3 data ---
    A(P("3 · The data: coverage, freshness, and one honest caveat", H1))
    A(tbl([["city", "sensors", "ward-mapped", "live enforcement actions"],
           ["Delhi", "46", "46", "1 (plus 10 from the archived episode)"],
           ["Mumbai", "29", "28", "0 — air is 21-34 ug/m3, correctly no action"],
           ["Bengaluru", "14", "13", "0 — air is 21-34 ug/m3, correctly no action"]],
          [86, 60, 76, CW - 222]))
    A(Spacer(1, 6))
    A(P("29,193 hourly readings across 90 sensors span 2025-12-25 to the current hour, of which "
        "roughly 15,200 are from the live era. The store carries both a severe December episode "
        "and the current monsoon period — a range that matters for §6.", BODY))
    A(Spacer(1, 4))
    A(P("<b>Data integrity, checked directly against the store:</b> no negative concentrations, "
        "no readings dated in the future, no duplicate station identities, station/hour keys "
        "unique across all 29,193 rows, and all attribution confidences within range. 2,093 rows "
        "carry no PM value at all — sensor downtime, correctly rendered as no-data rather than "
        "as zero.", BODY))
    A(Spacer(1, 4))
    A(P("<b>Upstream caveat, disclosed rather than hidden.</b> 475 readings (1.6%, across 34 "
        "stations) report PM2.5 greater than PM10, which is physically impossible since PM2.5 is "
        "a subset of PM10. This is instrument disagreement in the CPCB source data, not an ingest "
        "defect. It does not change any reported AQI band, because the CPCB index takes the "
        "maximum of the pollutant sub-indices rather than combining them. It is stated here so an "
        "agency reviewer meets it in the documentation rather than discovering it in the data.",
        NOTE))
    A(Spacer(1, 6))
    A(P("<b>Cadence is the binding constraint on data quality.</b> data.gov.in serves only the "
        "current hour and there is no backfill, so every missed hour is permanently lost. Under "
        "the GitHub free scheduler, capture degraded to 1-3 hours per day. Moving the schedule to "
        "Supabase pg_cron restored it to 15-20. Uptime of that job is, directly, the rate at which "
        "the platform's historical asset accumulates.", BODY))
    A(Spacer(1, 10))

    # --------------------------------------------------------- 4 proven ---
    A(P("4 · What is proven — verification results", H1))
    A(P("Three suites run against the platform. The distinction between them is not cosmetic: one "
        "of them proves things about production, and two do not.", BODY))
    A(Spacer(1, 4))
    A(tbl([["suite", "what it actually tests", "result"],
           [P("<font face='Courier'>verify_live.py</font>", SMALL),
            P("18 assertions. Drives a <b>local</b> TestClient against the remote database — so it "
              "validates this working tree, not the deployed function.", SMALL),
            P("<b>17 pass, 1 warns</b><br/>(RLS parity, open by choice)",
              ParagraphStyle("k", parent=SMALL, textColor=AMBER))],
           [P("<font face='Courier'>verify_edge_cases.py</font>", SMALL),
            P("18 input-validation and abuse cases. Runs against <b>either</b> the local app or a "
              "deployed URL, with identical assertions — so local/production drift is visible "
              "rather than inferred.", SMALL),
            P("<b>18/18 local</b><br/><b>18/18 production</b>",
              ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))],
           [P("<font face='Courier'>verify_ward_estimate.mjs</font>", SMALL),
            P("12 estimator assertions against live station data, including the measured / "
              "estimated / unavailable boundaries.", SMALL),
            P("<b>12/12</b>", ParagraphStyle("k", parent=SMALL, textColor=OKGREEN))]],
          [104, CW - 208, 104]))
    A(Spacer(1, 6))
    A(P("<b>A green suite is not a statement about production.</b> On 2026-08-29 "
        "<font face='Courier'>verify_live.py</font> reported ALL PASSED while the deployed API "
        "answered <font face='Courier'>\"AQI -50 (Severe) measured now\"</font> to any caller who "
        "set that query parameter. It drives a local TestClient, so it was describing the working "
        "tree. That is precisely why the edge-case suite takes a target URL, and why the accuracy "
        "claims below were re-checked against the deployed endpoint rather than the local one.", WARN))
    A(Spacer(1, 6))
    A(P("<b>Measurement accuracy, verified against production.</b> All 46 Delhi station values "
        "served by the deployed API match the database exactly — zero drift — and every AQI and "
        "band matches an independent recomputation from the published CPCB breakpoint tables. "
        "Zero mismatches.", BODY))
    A(PageBreak())

    # ----------------------------------------------------------- 5 wards ---
    A(P("5 · The ward estimator: the defect that mattered most", H1))
    A(P("Most Delhi wards have no sensor of their own. The citizen view filled that gap with the "
        "city arithmetic mean — for 251 of 289 wards — and rendered it in 46px type under the "
        "ward's own name, styled exactly like a measured reading. On the morning this was found, "
        "those wards displayed \"AQI 130 · Moderate · reduce prolonged outdoor exertion\" while the "
        "sensor at Anand Vihar measured 448, Severe. The map was right and the advisory was wrong, "
        "from the same store, at the same moment.", BODY))
    A(Diagram(CW, 108, d_wardstates))
    A(Spacer(1, 4))
    A(P("The replacement is inverse-distance weighting over sensors within 8 km, with three "
        "explicit outcomes and no blending between them. A ward containing several sensors reports "
        "the <b>worst</b>, not the average — an advisory is a health instruction for everyone in "
        "the ward, and averaging away the dangerous corner of it is the same error in miniature. "
        "Where a nearby sensor sits in a worse band than the estimate, that sensor is named in red "
        "rather than smoothed away; 76 Delhi wards currently carry such a warning.", BODY))
    A(Spacer(1, 4))
    A(P("Delhi now resolves 40 measured, 247 estimated and 3 refused, with <b>117 distinct values</b> "
        "in place of one repeated number. The API and the advisory agent both carry a "
        "<font face='Courier'>basis</font> field, and the client refuses any server advisory that "
        "does not echo it — so an API predating the field cannot describe an interpolated number as "
        "\"measured now\".", BODY))
    A(Spacer(1, 6))
    A(P("<b>What testing cannot establish here.</b> An interpolated ward AQI has no reference value "
        "to compare against — that is precisely why the ward has no sensor. The tested property is "
        "the <i>label</i>, not the number: that the outcome is correctly classified, correctly "
        "masked beyond 8 km, and never described as measured.", NOTE))
    A(Spacer(1, 10))

    # -------------------------------------------------------- 6 forecast ---
    A(P("6 · Forecasting: measured honestly, and currently negative", H1))
    A(P("Until 2026-08-29 the forecast model trained on a bundled snapshot frozen at "
        "2025-12-25 to 2026-01-01. The nightly retrain re-fit the same seven days of December "
        "every night and never saw a single row the platform had collected. Nothing failed and the "
        "job stayed green — the model was simply predicting monsoon air from a severe winter "
        "episode. It now trains on the live store, which already contained that December window "
        "and everything since.", BODY))
    A(Spacer(1, 4))
    A(P("Two further defects surfaced with it. Lag features were <b>positional rather than "
        "temporal</b>: 11% of consecutive readings are not an hour apart, so a plain shift "
        "presented a reading up to 5,438 hours old as \"one hour ago\". Features are now built on a "
        "complete hourly grid. And the 36-hour test window was <b>narrower than the 48h and 72h "
        "horizons</b>, so both were fit, shipped and reported zero test rows beside validated "
        "horizons. The window is now seven days and all five horizons are backtested.", BODY))
    A(Spacer(1, 6))
    rows = [["horizon", "test rows", "persistence RMSE", "model RMSE", "verdict"]]
    verdicts = {"h6": "persistence much better", "h12": "persistence better",
                "h24": "tie", "h48": "persistence better", "h72": "tie"}
    for k in ("h6", "h12", "h24", "h48", "h72"):
        v = m.get(k, {})
        if not v.get("validated"):
            continue
        better = v["rmse_model"] < v["rmse_persistence"]
        rows.append([k[1:] + "h", str(v["n_test"]), f"{v['rmse_persistence']:.2f}",
                     P(f"<b>{v['rmse_model']:.2f}</b>", ParagraphStyle(
                         "v", parent=SMALL, textColor=OKGREEN if better else DANGER)),
                     verdicts.get(k, "")])
    A(tbl(rows, [56, 56, 96, 72, CW - 280]))
    A(Spacer(1, 6))
    A(P("<b>The previously published figure of +35.7% versus persistence was not wrong — it was "
        "measured on the wrong regime.</b> During December's episode PM2.5 swings violently and a "
        "persistence baseline scores an RMSE near 100, so a model beats it easily. On calm monsoon "
        "air persistence scores 7.49 and is very hard to beat. Four training strategies were "
        "compared — full history, live-era only, and recency half-lives of 30 and 7 days — and "
        "persistence won three of five horizons under every one of them. This is a property of the "
        "conditions, not an artefact of the training set.", WARN))
    A(Spacer(1, 4))
    A(P("Full history is retained as the training default regardless, because December is the only "
        "severe-episode data that exists and severe episodes are what the platform is for. The "
        "verification suite asserts the training provenance — so a silent fall back to the stale "
        "snapshot now fails the build — but it deliberately does <b>not</b> assert that the model "
        "beats persistence, because an assertion like that only encourages quoting a number that is "
        "not currently true.", BODY))
    A(Spacer(1, 4))
    A(P("<b>Recommendation.</b> Do not present the forecast as an accuracy claim in a pilot "
        "evaluation. Present the measurement, attribution and enforcement layers, which are "
        "verified. Re-measure the forecast during stubble-burning or winter season — the regime in "
        "which persistence fails and a model can earn its place.", NOTE))
    A(PageBreak())

    # -------------------------------------------------------- 7 security ---
    A(P("7 · Security posture", H1))
    A(tbl([["control", "state"],
           [P("<b>Input validation</b>", SMALL),
            P("All public query parameters are validated and bounded. Eight defects reachable by "
              "any caller — including an out-of-range AQI returned as measured health guidance, "
              "and three paths that answered HTTP 500 — were fixed and verified on production.", SMALL)],
           [P("<b>SQL injection</b>", SMALL),
            P("Every user-supplied string reaches Postgres as a bound parameter. Probed with "
              "three payload classes; all inert, tables intact.", SMALL)],
           [P("<b>Row-count limits</b>", SMALL),
            P("Capped at 5,000. An unbounded LIMIT was the cheapest way to exhaust the 60-second "
              "serverless budget on an unauthenticated endpoint.", SMALL)],
           [P("<b>Ingest authentication</b>", SMALL),
            P("Token-protected; rejects an absent, wrong or empty token with 401. The token "
              "resolves environment-first then from ops_config, so both ends of the scheduled "
              "call agree by construction.", SMALL)],
           [P("<b>Secret storage</b>", SMALL),
            P("ops_config has RLS enabled with no policy and no public grants; the suite asserts "
              "it. Supabase serves every public-schema table over PostgREST, so this matters.", SMALL)],
           [P("<b>RLS parity</b>", SMALL),
            P("<b>OPEN.</b> fires and llm_spend have RLS disabled while the anon role holds "
              "INSERT, UPDATE, DELETE and TRUNCATE. The other seven tables have RLS on, which is "
              "the only thing neutralising identical grants. fires feeds the attribution agent, so "
              "this is a write path into evidence inputs. Latent only because the anon key is not "
              "published — the frontend talks to the API and never to Supabase. Two SQL statements "
              "close it. Until they run the suite reports this as a warning rather than a "
              "failure, so a deliberately deferred item does not take the hourly ingest down "
              "with it.",
              ParagraphStyle("d", parent=SMALL, textColor=DANGER))],
           [P("<b>Authentication</b>", SMALL),
            P("<b>NONE.</b> Every endpoint answers unauthenticated, CORS is '*', and POST "
              "/replay/run both mutates the store and bills the language-model budget without a "
              "credential. This is the single largest gap before agency handover.",
              ParagraphStyle("d", parent=SMALL, textColor=DANGER))]],
          [92, CW - 92]))
    A(Spacer(1, 10))

    # ------------------------------------------------------------ 8 gaps ---
    A(P("8 · What is not yet true — gaps before agency handover", H1))
    A(P("In build order. None of these are defects; they are unbuilt capability, and each one "
        "blocks a specific operational reality.", BODY))
    A(Spacer(1, 4))
    A(tbl([["#", "gap", "what it blocks"],
           ["1", P("<b>No authentication</b>", SMALL),
            P("No agency can use a system where any URL holder reads everything and can trigger "
              "a billed, state-mutating run. Everything below depends on this.", SMALL)],
           ["2", P("<b>No multi-tenancy</b>", SMALL),
            P("One board cannot be prevented from seeing another's wards, so the platform cannot "
              "be sold to two customers at once.", SMALL)],
           ["3", P("<b>No alerting</b>", SMALL),
            P("A stalled feed or failed cron is noticed by a person looking at the banner. There "
              "is no notification path to an officer when a ward crosses a threshold.", SMALL)],
           ["4", P("<b>No action workflow</b>", SMALL),
            P("An action can be ranked and evidenced but not assigned, tracked or closed — so the "
              "platform informs enforcement without participating in it.", SMALL)],
           ["5", P("<b>Forecast unproven in-regime</b>", SMALL),
            P("See §6. Validated, and currently negative on calm air. Needs re-measurement across "
              "a high-variance season before it can be quoted.", SMALL)],
           ["6", P("<b>Free-tier infrastructure</b>", SMALL),
            P("No SLA, no redundancy, no support path. Acceptable for a pilot, not for a service "
              "an agency depends on.", SMALL)],
           ["7", P("<b>RLS parity</b>", SMALL),
            P("Two SQL statements, deliberately left open. See §7.", SMALL)]],
          [16, 122, CW - 138]))
    A(Spacer(1, 8))

    # --------------------------------------------------------- 9 history ---
    A(P("9 · Engineering history: defects that shipped once", H1))
    A(P("Each of these reached a running system and each now has an assertion guarding it. They "
        "are listed because the pattern is more useful than the individual fixes: in almost every "
        "case the system stayed green while telling a false story.", BODY))
    A(Spacer(1, 4))
    A(tbl([["defect", "why it was invisible"],
           [P("<b>Duplicate station identity</b>", SMALL),
            P("The archive keyed sensors site_NNN, the live feed by name. Every sensor existed "
              "twice and the two sets were exactly disjoint — every ward-mapped row frozen, every "
              "live row unmapped. Enforcement joins on ward, so 300/300 recent Delhi events were "
              "structurally unreachable by it. 163 rows merged to 90 real sensors.", SMALL)],
           [P("<b>City mean shown as a ward reading</b>", SMALL),
            P("Correct data, correct map, wrong number in the one place a citizen reads. See §5.", SMALL)],
           [P("<b>Forecast trained on a frozen archive</b>", SMALL),
            P("The nightly retrain succeeded every night and never saw live data. See §6.", SMALL)],
           [P("<b>Negative and out-of-range AQI banded Severe</b>", SMALL),
            P("aqi=-50 returned \"AQI -50 (Severe) measured now\" — health guidance over an "
              "impossible number, from a query parameter any caller could set.", SMALL)],
           [P("<b>band() returned Severe for NaN</b>", SMALL),
            P("Every comparison against NaN is false, so no-data sensors fell through the band "
              "loop to the default and were painted blood red.", SMALL)],
           [P("<b>Timezone skew</b>", SMALL),
            P("Readings are IST wall-clock, the database clock is UTC. Every window comparison was "
              "skewed 5h30m, putting the newest reading three hours in the future.", SMALL)],
           [P("<b>Freshness from a build artefact</b>", SMALL),
            P("The banner read a bundled file 12 days stale while the store was 2 hours old.", SMALL)],
           [P("<b>Enforcement windowing and floor</b>", SMALL),
            P("One shared pool let December's crisis permanently outrank every current event, so "
              "live could never show an action. Separately, severity clipped at 60 ug/m3, so whole "
              "cities of actions tied at priority 0.00, each citing a statute over officially-good "
              "air.", SMALL)],
           [P("<b>Secrets lost in the dashboard</b>", SMALL),
            P("A Vercel environment variable applies only at build time and only to the owning "
              "project. A value saved against the wrong project is indistinguishable, from inside "
              "the function, from one never set. Secrets now resolve from ops_config, which is "
              "verifiable from SQL.", SMALL)]],
          [136, CW - 136]))
    A(PageBreak())

    # ------------------------------------------------------------ 10 next --
    A(P("10 · Recommended next investments", H1))
    A(tbl([["#", "investment", "why now"],
           ["1", P("<b>Close RLS parity</b> — two SQL statements", SMALL),
            P("Cheapest item on this list by a wide margin, and it is a write path into "
              "enforcement evidence. There is no reason to carry it into a pilot.", SMALL)],
           ["2", P("<b>Authentication and multi-tenancy</b>", SMALL),
            P("The gate on every commercial conversation. Until it exists the platform "
              "demonstrates well and cannot be deployed.", SMALL)],
           ["3", P("<b>Protect the ingest cadence</b>", SMALL),
            P("A missed hour is unrecoverable. The historical asset — and therefore any future "
              "forecast claim — accrues at exactly the rate this job stays up. It deserves "
              "monitoring before anything else is built on top of it.", SMALL)],
           ["4", P("<b>Alerting</b>", SMALL),
            P("Turns a dashboard into an operational tool, and is the first feature an officer "
              "will ask for after seeing the ranking.", SMALL)],
           ["5", P("<b>Re-measure the forecast in season</b>", SMALL),
            P("Stubble-burning and winter are the regimes the model was built for and the ones "
              "where persistence fails. Either it earns its place there or it should be "
              "presented as an experiment.", SMALL)],
           ["6", P("<b>Action workflow — assign, track, close</b>", SMALL),
            P("Converts evidence assembly into a system of record, which is what makes the "
              "platform difficult to displace.", SMALL)]],
          [16, 148, CW - 164]))
    A(Spacer(1, 10))
    A(P("Closing note", H2))
    A(P("VAYU-NET's measurement, attribution and enforcement layers are verified against live "
        "government data and behave correctly under adversarial input. Its forecasting layer is now "
        "measured honestly and does not currently beat a trivial baseline, which is worth stating "
        "plainly rather than discovering during an evaluation. The distance between this and a "
        "deployable agency system is authentication, tenancy and operational monitoring — none of "
        "it research, all of it build. The differentiator holds: answering which ward, why, and "
        "under what statute, with the evidence pack attached.", BODY))

    doc.build(s)
    print(f"Wrote {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    build()
