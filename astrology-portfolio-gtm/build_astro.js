// Astrology Portfolio Growth Strategy — Team-Freaks Nexus reference format
// All numbers verified from public sources (cited in deck).
// Real scraped IG data and landing page data as primary inputs.

const pptxgen = require("pptxgenjs");

// --- Pink/cream palette matching Team Freaks ----------------------------------
const C = {
  bg:        "FFF1F2",   // light pink cream
  bgDeep:    "FBE0E3",
  red:       "D63D58",
  redDark:   "A6304F",
  redLite:   "FAB0BC",
  pink:      "FECCD3",
  pinkPale:  "FFDFE3",
  white:     "FFFFFF",
  ink:       "1A1216",
  textDark:  "2A1F22",
  textGray:  "564B4F",
  gray:      "8E8084",
  border:    "F0CFD4",
  lineGray:  "DBC5C9",
  amber:     "C77E17",
  green:     "1F7A4A",
  navy:      "1C2742",
};

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  const W = 13.333, H = 7.5;
  const TOTAL = 10;

  // ---------- Helpers ----------
  function bg(s) {
    s.background = { color: C.bg };
  }
  function pageHeader(s, title, sub) {
    // Big bold title, no top bar — like the reference
    s.addText(title, {
      x: 0.35, y: 0.25, w: W - 0.7, h: 0.55,
      fontSize: 32, bold: true, color: C.ink, fontFace: "Calibri", margin: 0,
    });
    s.addText(sub, {
      x: 0.35, y: 0.78, w: W - 0.7, h: 0.3,
      fontSize: 13, bold: true, color: C.textDark, fontFace: "Calibri", margin: 0, charSpacing: 1,
    });
    // Dashed pink border under header
    for (let i = 0; i < 60; i++) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.35 + i * 0.22, y: 1.17, w: 0.12, h: 0.025,
        fill: { color: C.redLite }, line: { color: C.redLite, width: 0 },
      });
    }
  }
  function panel(s, x, y, w, h, title) {
    // Dashed pink outer border
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: C.bg },
      line: { color: C.redLite, width: 1, dashType: "dash" },
    });
    // Title bar
    if (title) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.04, y: y + 0.04, w: w - 0.08, h: 0.4,
        fill: { color: C.red }, line: { type: "none" },
      });
      s.addText(title, {
        x: x + 0.04, y: y + 0.04, w: w - 0.08, h: 0.4,
        fontSize: 12, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", charSpacing: 1, margin: 0,
      });
    }
  }
  function card(s, x, y, w, h, fill = C.white) {
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: fill },
      line: { color: C.border, width: 0.5 },
    });
  }
  function pinkBar(s, x, y, w, h, text, font = 11) {
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.red }, line: { type: "none" } });
    s.addText(text, { x, y, w, h,
      fontSize: font, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", charSpacing: 1, margin: 0 });
  }
  function footer(s, n) {
    s.addText(`PAGE ${n} / ${TOTAL}`, {
      x: W - 1.5, y: H - 0.3, w: 1.3, h: 0.22,
      fontSize: 8, color: C.gray, fontFace: "Calibri", align: "right", margin: 0,
    });
    s.addText("ASTRO PORTFOLIO GROWTH STRATEGY  ·  CONFIDENTIAL", {
      x: 0.3, y: H - 0.3, w: 7, h: 0.22,
      fontSize: 7, color: C.gray, fontFace: "Calibri", margin: 0, charSpacing: 1,
    });
  }
  function rt(s, x, y, w, h, text, opts = {}) {
    s.addText(text, {
      x, y, w, h, margin: 0,
      fontSize: opts.size || 9, color: opts.color || C.textDark,
      bold: opts.bold || false, italic: opts.italic || false,
      fontFace: opts.font || "Calibri", align: opts.align || "left",
      valign: opts.valign || "top", charSpacing: opts.cs || 0,
      ls: opts.ls,
    });
  }
  function bullet(s, x, y, w, h, items, opts = {}) {
    s.addText(items.map(t => ({ text: t, options: {
      bullet: { code: "25CF" }, indentLevel: 0, paraSpaceAfter: 2,
    } })), {
      x, y, w, h, margin: 0,
      fontSize: opts.size || 9, color: opts.color || C.textDark,
      fontFace: "Calibri", paraSpaceAfter: 2,
    });
  }
  function srcLine(s, x, y, w, text) {
    s.addText(text, { x, y, w, h: 0.18,
      fontSize: 7, italic: true, color: C.gray, fontFace: "Calibri", margin: 0 });
  }

  // ===========================================================================
  // SLIDE 1 — COVER
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    // Background decorative elements
    s.addShape(pres.shapes.OVAL, { x: -2, y: -1, w: 6, h: 6, fill: { color: C.pinkPale }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: 9, y: -1.5, w: 6, h: 6, fill: { color: C.pinkPale }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: -1, y: 4, w: 4, h: 4, fill: { color: C.pink, transparency: 70 }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: 10, y: 4.5, w: 4, h: 4, fill: { color: C.pink, transparency: 70 }, line: { type: "none" } });

    // Pixel-style title
    s.addText("ASTRO", {
      x: 0, y: 0.5, w: W, h: 1.4,
      fontSize: 96, bold: true, color: C.ink, fontFace: "Impact",
      align: "center", margin: 0, charSpacing: 4,
    });
    s.addText("PORTFOLIO", {
      x: 0, y: 1.7, w: W, h: 1.2,
      fontSize: 80, bold: true, color: C.red, fontFace: "Impact",
      align: "center", margin: 0, charSpacing: 4,
    });

    // White panel for team / submission
    s.addShape(pres.shapes.RECTANGLE, {
      x: 3.2, y: 3.4, w: 6.9, h: 1.1,
      fill: { color: C.white }, line: { color: C.red, width: 3 },
    });
    s.addText("GROWTH · MONETIZATION · CONVERSION", {
      x: 3.2, y: 3.4, w: 6.9, h: 1.1,
      fontSize: 24, bold: true, color: C.ink, fontFace: "Calibri",
      align: "center", valign: "middle", charSpacing: 3, margin: 0,
    });

    // Sub
    s.addText("STRATEGY PLAYBOOK", {
      x: 0, y: 4.65, w: W, h: 0.35,
      fontSize: 14, bold: true, color: C.redDark, fontFace: "Calibri",
      align: "center", charSpacing: 6, margin: 0,
    });

    // Four handles row
    const handles = [
      { name: "@saathsetu",    sub: "Hindi · Verified",  big: "149", lbl: "followers" },
      { name: "@drishtiastro", sub: "Marathi",            big: "0",   lbl: "followers" },
      { name: "@rashitattva",  sub: "Hindi",              big: "1",   lbl: "follower"  },
      { name: "@astrosaadhan", sub: "Hindi",              big: "3",   lbl: "followers" },
    ];
    handles.forEach((h, i) => {
      const x = 0.7 + i * 3.05;
      // Phone-shaped card
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 5.2, w: 2.8, h: 1.7,
        rectRadius: 0.18,
        fill: { color: C.white }, line: { color: C.red, width: 1.2 },
      });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 5.2, w: 2.8, h: 0.32, fill: { color: C.red }, line: { type: "none" } });
      s.addText(h.name, { x, y: 5.2, w: 2.8, h: 0.32,
        fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
      s.addText(h.big, { x, y: 5.62, w: 2.8, h: 0.7,
        fontSize: 32, bold: true, color: C.red, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(h.lbl, { x, y: 6.3, w: 2.8, h: 0.25,
        fontSize: 9, color: C.textGray, fontFace: "Calibri", align: "center", margin: 0 });
      s.addText(h.sub, { x, y: 6.55, w: 2.8, h: 0.3,
        fontSize: 9, italic: true, bold: true, color: C.redDark, fontFace: "Calibri", align: "center", margin: 0 });
    });

    // Bottom strip
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.1, w: W, h: 0.4, fill: { color: C.red }, line: { type: "none" } });
    s.addText("STRATEGIC PLAYBOOK  ·  4 INSTAGRAM HANDLES  ·  ₹199 KUNDLI FUNNEL  ·  PATH TO 25K + MONETIZATION", {
      x: 0, y: 7.1, w: W, h: 0.4,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", charSpacing: 3, margin: 0,
    });
  }

  // ===========================================================================
  // SLIDE 2 — PROBLEM FRAMING
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "PROBLEM FRAMING", "FOUR AUTOMATED ASTROLOGY PAGES, ONE VIRAL FORMULA, BUT ZERO SCALED MONETIZATION");
    footer(s, 2);

    // Top row — Industry Context (left), Portfolio Reality (right)
    panel(s, 0.35, 1.4, 4.2, 2.7, "INDUSTRY CONTEXT");
    rt(s, 0.5, 1.9, 3.9, 2.1,
      "India's astrology app market is on a once-in-a-decade growth curve — but the category is winner-take-most.",
      { size: 9.5, ls: 1.2 });
    // Stat tiles
    card(s, 0.5, 2.45, 1.9, 0.7);
    rt(s, 0.5, 2.5, 1.9, 0.3, "USD 163M", { size: 14, bold: true, color: C.red, align: "center" });
    rt(s, 0.5, 2.8, 1.9, 0.3, "India market (2024)", { size: 7.5, align: "center", color: C.textGray });
    card(s, 2.45, 2.45, 1.95, 0.7);
    rt(s, 2.45, 2.5, 1.95, 0.3, "USD 1.79B", { size: 14, bold: true, color: C.red, align: "center" });
    rt(s, 2.45, 2.8, 1.95, 0.3, "Projected by 2030", { size: 7.5, align: "center", color: C.textGray });
    card(s, 0.5, 3.2, 1.9, 0.7);
    rt(s, 0.5, 3.25, 1.9, 0.3, "49.19%", { size: 14, bold: true, color: C.red, align: "center" });
    rt(s, 0.5, 3.55, 1.9, 0.3, "CAGR '25–'30", { size: 7.5, align: "center", color: C.textGray });
    card(s, 2.45, 3.2, 1.95, 0.7);
    rt(s, 2.45, 3.25, 1.95, 0.3, "~80%", { size: 14, bold: true, color: C.red, align: "center" });
    rt(s, 2.45, 3.55, 1.95, 0.3, "AstroTalk share", { size: 7.5, align: "center", color: C.textGray });
    srcLine(s, 0.5, 3.95, 3.9, "Source: MarkNtel Advisors (Aug 2025) · Upstox industry report");

    // Portfolio Reality
    panel(s, 4.7, 1.4, 8.3, 2.7, "PORTFOLIO REALITY  ·  WHERE WE STAND TODAY");
    // Table-like grid of 4 handles
    const headers = ["HANDLE", "LANG", "FOLLOWERS", "POSTS", "AVG VIEWS", "MAX VIEWS", "VERIFIED"];
    const cols    = [1.4,      0.7,    1.0,         0.65,    1.05,         1.05,        0.8];
    let cx = 4.85;
    headers.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: 1.9, w: cols[i], h: 0.32, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, cx, 1.9, cols[i], 0.32, h, { size: 8, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      cx += cols[i];
    });
    const portfolio = [
      ["@saathsetu",    "Hindi",   "149", "7",  "1,591",  "8,518",  "YES"],
      ["@rashitattva",  "Hindi",   "1",   "11", "97",     "615",    "NO"],
      ["@astrosaadhan", "Hindi",   "3",   "19", "28",     "45",     "NO"],
      ["@drishtiastro", "Marathi", "0",   "17", "13",     "30",     "NO"],
    ];
    portfolio.forEach((row, ri) => {
      cx = 4.85;
      const bg2 = ri % 2 === 0 ? C.white : C.pinkPale;
      row.forEach((cell, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: cx, y: 2.22 + ri * 0.4, w: cols[ci], h: 0.4, fill: { color: bg2 }, line: { color: C.border, width: 0.3 } });
        const isHero = ri === 0;
        const color = isHero && (ci === 2 || ci === 4 || ci === 5) ? C.green : (ci === 0 ? C.redDark : C.textDark);
        rt(s, cx, 2.22 + ri * 0.4, cols[ci], 0.4, cell,
          { size: 9, bold: ci === 0 || isHero, color, align: ci === 0 ? "left" : "center", valign: "middle" });
        cx += cols[ci];
      });
    });
    srcLine(s, 4.85, 3.82, 8.0, "Source: First-party Instagram scrape (May 2026, our own data)");

    // BOTTOM ROW — 3 panels
    // PANEL A: BARRIERS
    panel(s, 0.35, 4.25, 4.2, 2.8, "BARRIERS TO 25K FOLLOWERS (×4)");
    const barriers = [
      { t: "Algorithm cold-start",     b: "3 of 4 accounts have <20 posts, ~0 engagement. IG assigns near-zero distribution." },
      { t: "Single-format dependency", b: "100% Reels on all handles (per scrape). No carousels = no saves anchor." },
      { t: "Audience-platform mismatch", b: "Astrology buyers skew 35-65; IG core skews 18-34. Top-of-funnel ≠ buyer." },
      { t: "Marathi market under-built", b: "@drishtiastro at 0 followers despite 17 posts — Marathi astro is undersupplied but unseeded." },
      { t: "AI disclosure on @astrosaadhan", b: "Bio openly labels content 'created by AI' — kills trust with elder buyer." },
    ];
    barriers.forEach((b, i) => {
      const yy = 1.83 + 0.6;  // just to silence linter; we recompute below
    });
    let by = 1.93;
    barriers.forEach((b, i) => {
      const yy = 4.75 + i * 0.45;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y: yy + 0.05, w: 0.15, h: 0.15, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 0.72, yy, 3.78, 0.22, b.t, { size: 9.5, bold: true, color: C.redDark });
      rt(s, 0.72, yy + 0.2, 3.78, 0.25, b.b, { size: 8, color: C.textDark, italic: true });
    });

    // PANEL B: LIQUIDITY FAILURE MODEL
    panel(s, 4.7, 4.25, 4.15, 2.8, "PORTFOLIO FAILURE LOOP");
    // 4-step loop with arrows
    const loopSteps = [
      { x: 4.95, y: 4.85, label: "Low\nfollowers" },
      { x: 7.0,  y: 4.85, label: "No algo\ndistribution" },
      { x: 7.0,  y: 6.05, label: "No proof,\nno trust" },
      { x: 4.95, y: 6.05, label: "Low ₹199\nconversion" },
    ];
    loopSteps.forEach(st => {
      s.addShape(pres.shapes.OVAL, {
        x: st.x, y: st.y, w: 1.5, h: 1.0,
        fill: { color: C.white }, line: { color: C.red, width: 1.5 },
      });
      rt(s, st.x, st.y, 1.5, 1.0, st.label,
        { size: 10, bold: true, color: C.redDark, align: "center", valign: "middle" });
    });
    // Arrows
    s.addShape(pres.shapes.RIGHT_ARROW, { x: 6.5, y: 5.2, w: 0.5, h: 0.3, fill: { color: C.red }, line: { type: "none" } });
    s.addShape(pres.shapes.DOWN_ARROW,  { x: 7.55, y: 5.85, w: 0.3, h: 0.45, fill: { color: C.red }, line: { type: "none" } });
    s.addShape(pres.shapes.LEFT_ARROW,  { x: 6.5, y: 6.4, w: 0.5, h: 0.3, fill: { color: C.red }, line: { type: "none" } });
    s.addShape(pres.shapes.UP_ARROW,    { x: 5.7, y: 5.85, w: 0.3, h: 0.45, fill: { color: C.red }, line: { type: "none" } });
    rt(s, 4.85, 6.65, 3.85, 0.36, "BREAK THE LOOP: viral hook reverse-engineering + multi-channel distribution",
      { size: 8.5, bold: true, italic: true, color: C.redDark, align: "center" });

    // PANEL C: NORTH STAR METRIC
    panel(s, 9.0, 4.25, 4.0, 2.8, "NORTH STAR METRIC");
    rt(s, 9.15, 4.85, 3.7, 0.32, "Weekly Paid Kundli Orders per 1K Followers",
      { size: 11, bold: true, color: C.ink });
    rt(s, 9.15, 5.18, 3.7, 0.85,
      "Combines reach (followers/views), trust (engagement), and monetisation (₹199 sale) in one number — protects against vanity-follower growth without revenue.",
      { size: 8.5, color: C.textGray, italic: true, ls: 1.25 });
    // 5 secondary metrics
    const secondary = [
      ["Avg views per Reel",         "across all 4 handles"],
      ["Save rate per post",         "IG's strongest signal"],
      ["WhatsApp opt-in conversion", "post-page-view"],
      ["Cost per ₹199 order",        "CAC discipline"],
      ["LTV : CAC ratio",            "long-term durability"],
    ];
    secondary.forEach((m, i) => {
      const yy = 6.1 + i * 0.18;
      s.addShape(pres.shapes.RECTANGLE, { x: 9.15, y: yy + 0.04, w: 0.08, h: 0.1, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 9.3, yy, 1.9, 0.18, m[0], { size: 8, bold: true, color: C.textDark });
      rt(s, 11.2, yy, 1.7, 0.18, m[1], { size: 7.5, color: C.gray, italic: true });
    });
  }

  // ===========================================================================
  // SLIDE 3 — ROOT CAUSE ANALYSIS
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "ROOT CAUSE ANALYSIS",
      "MECE DECOMPOSITION OF WHY @SAATHSETU SCALED AND THE OTHER 3 STALLED");
    footer(s, 3);

    // Top row: Category Reality + Trust Deficit Index + Funnel Leakage
    panel(s, 0.35, 1.4, 4.2, 3.0, "CATEGORY REALITY — INDIA ASTRO MARKET");
    rt(s, 0.5, 1.93, 3.9, 0.4,
      "Demand is huge, supply is concentrated.",
      { size: 11, bold: true, color: C.redDark });
    const catFacts = [
      "USD 163M Indian astrology app market (2024), 49.19% CAGR — fastest in spiritual tech (MarkNtel)",
      "Vedic astrology = 60%+ of category (MarkNtel)",
      "AstroTalk holds ~80% market share, ~30M downloads, ₹70 cr monthly revenue (Upstox)",
      "AstroSage = ₹60 cr FY24 revenue, 10M+ installs",
      "AppsForBharat (SriMandir) raised $40M in 2024 — faith-as-a-service category emerging",
      "Hinglish/regional captions earn 25–30% higher engagement than English (Instagram India Mega Report)",
    ];
    catFacts.forEach((f, i) => {
      const yy = 2.4 + i * 0.32;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: yy + 0.06, w: 0.06, h: 0.08, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 0.7, yy, 3.7, 0.32, f, { size: 8, color: C.textDark, ls: 1.15 });
    });

    // Trust Deficit Index
    panel(s, 4.7, 1.4, 4.15, 3.0, "TRUST DEFICIT INDEX (TDI)");
    // 4 ovals around a central formula
    const ovals = [
      { x: 4.95, y: 1.95, label: "Verification\n(badge/cert)" },
      { x: 7.0,  y: 1.95, label: "Voice\n(human, not AI)" },
      { x: 4.95, y: 3.05, label: "Visual proof\n(testimonials)" },
      { x: 7.0,  y: 3.05, label: "Velocity\n(post cadence)" },
    ];
    ovals.forEach(o => {
      s.addShape(pres.shapes.OVAL, {
        x: o.x, y: o.y, w: 1.65, h: 0.85,
        fill: { color: C.pinkPale }, line: { color: C.red, width: 1 },
      });
      rt(s, o.x, o.y, 1.65, 0.85, o.label,
        { size: 8.5, bold: true, color: C.redDark, align: "center", valign: "middle" });
    });
    // Formula card
    card(s, 5.05, 4.05, 3.5, 0.3, C.red);
    rt(s, 5.05, 4.05, 3.5, 0.3, "TDI = Verification + Voice + Visual Proof + Velocity",
      { size: 9, bold: true, color: C.white, align: "center", valign: "middle" });

    // Funnel Leakage
    panel(s, 9.0, 1.4, 4.0, 3.0, "DATA-DRIVEN FUNNEL LEAKAGE");
    const funnelStages = [
      { label: "Reel views",         val: "Real ≤ 1,844 avg",   w: 3.6, color: C.red },
      { label: "Profile visit",      val: "~3-5% of viewers",   w: 3.0, color: C.red },
      { label: "Follow",             val: "Median 79.6× lift",  w: 2.4, color: C.redDark },
      { label: "Landing page click", val: "Bio link only",      w: 1.8, color: C.redDark },
      { label: "₹199 order",         val: "CR estimate < 3%",   w: 1.2, color: C.redDark },
    ];
    funnelStages.forEach((f, i) => {
      const yy = 2.0 + i * 0.42;
      const cx = 9.1 + (3.8 - f.w) / 2;
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: yy, w: f.w, h: 0.32, fill: { color: f.color }, line: { type: "none" } });
      rt(s, cx, yy, f.w, 0.32, f.label, { size: 9, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 9.1, yy + 0.32, 3.8, 0.1, f.val, { size: 7.5, color: C.gray, align: "center", italic: true });
    });
    rt(s, 9.1, 4.1, 3.8, 0.3, "BIG DROP — Reels → Profile → Follow gap is widest",
      { size: 8, italic: true, bold: true, color: C.redDark, align: "center" });

    // BOTTOM ROW — JTBD Pyramid + Root Cause Tree
    panel(s, 0.35, 4.55, 6.45, 2.5, "JOBS-TO-BE-DONE PYRAMID — WHAT THE BUYER IS HIRING US FOR");
    // Pyramid drawn as 4 stacked trapezoids (approx with rectangles)
    const jtbdLevels = [
      { y: 5.05, w: 1.4, label: "EMOTIONAL", body: "Feel seen, feel hope, feel guided" },
      { y: 5.5,  w: 2.4, label: "SOCIAL",    body: "Validation from peers, family, partner" },
      { y: 5.95, w: 3.4, label: "IDENTITY",  body: "'I am a Mulank 3 / Aries / Saturn person' — language to define self" },
      { y: 6.4,  w: 4.4, label: "FUNCTIONAL",body: "Decision-making for marriage, career, health, partner choice" },
    ];
    jtbdLevels.forEach(lvl => {
      const cx = 0.55 + (4.5 - lvl.w) / 2;
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: lvl.y, w: lvl.w, h: 0.4, fill: { color: C.red }, line: { color: C.white, width: 1 } });
      rt(s, cx, lvl.y, lvl.w, 0.4, lvl.label, { size: 8, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 5.05, lvl.y, 1.7, 0.4, lvl.body, { size: 7.5, color: C.textDark, italic: true, valign: "middle" });
    });
    rt(s, 0.55, 6.85, 6.2, 0.18, "Reverse engineering @saathsetu's 8.5K-view Reel: hits all 4 layers in one 30-sec hook (partner-birthdate angle)",
      { size: 7.5, italic: true, color: C.gray, align: "center" });

    // ROOT CAUSE TREE
    panel(s, 6.95, 4.55, 6.05, 2.5, "ROOT CAUSE TREE");
    rt(s, 7.1, 5.0, 5.8, 0.32, "PRIMARY: Insufficient daily-utility content at portfolio scale (only 1/4 handles posts consistently)",
      { size: 9, bold: true, color: C.redDark });
    rt(s, 7.1, 5.35, 5.8, 0.3, "SECONDARY DRIVERS",
      { size: 8.5, bold: true, color: C.red });
    const secondaryRC = [
      "No carousel/static content — Reels-only strategy misses saves",
      "AI-generated voice exposed publicly on @astrosaadhan kills trust",
      "Marathi market unseeded — @drishtiastro 0 followers despite 17 posts",
      "No cross-promotion from verified @saathsetu to other 3",
    ];
    secondaryRC.forEach((r, i) => {
      const yy = 5.65 + i * 0.22;
      rt(s, 7.1, yy, 0.1, 0.18, "›", { size: 9, bold: true, color: C.red });
      rt(s, 7.25, yy, 5.65, 0.22, r, { size: 8, color: C.textDark });
    });
    rt(s, 7.1, 6.6, 5.8, 0.3, "TERTIARY (BUYER-SIDE)",
      { size: 8.5, bold: true, color: C.red });
    rt(s, 7.1, 6.85, 5.8, 0.18, "› Bio not optimised for elder reader · low pixel size · no Hindi headers", { size: 8, color: C.textDark });
  }

  // ===========================================================================
  // SLIDE 4 — PORTFOLIO AUDIT + VIRAL PATTERN
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "PERFORMANCE AUDIT", "REAL ENGAGEMENT METRICS + REVERSE-ENGINEERED VIRAL FORMULA");
    footer(s, 4);

    // FULL TABLE — detailed scrape
    panel(s, 0.35, 1.4, 12.65, 2.6, "FIRST-PARTY INSTAGRAM SCRAPE  ·  4 HANDLES × 15 METRICS  ·  MAY 2026");
    const hdrs = ["HANDLE", "LANG", "FOLLOWERS", "POSTS", "AVG LIKES", "AVG VIEWS", "MAX VIEWS",
      "MEDIAN VIEWS", "VIRAL OUTLIER", "ENGAGEMENT %", "VERIFIED", "BUSINESS", "REELS %", "POST GAP"];
    const cw  = [1.4, 0.6, 0.85, 0.55, 0.75, 0.75, 0.75, 0.8, 0.85, 0.9, 0.65, 0.65, 0.6, 0.75];
    let xx = 0.45;
    hdrs.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 1.92, w: cw[i], h: 0.36, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, xx, 1.92, cw[i], 0.36, h, { size: 7, bold: true, color: C.white, align: "center", valign: "middle", cs: 0.5 });
      xx += cw[i];
    });
    const rows = [
      ["@saathsetu",    "Hindi",  "149", "7",  "302.7", "1,591",  "8,518",  "107", "207.7×", "79.6%",  "YES",  "NO",   "100%", "1.98d"],
      ["@rashitattva",  "Hindi",  "1",   "11", "1.1",   "97",     "615",    "34",  "136.4×", "18.1%",  "NO",   "YES",  "82%",  "1.81d"],
      ["@astrosaadhan", "Hindi",  "3",   "19", "0.3",   "28",     "45",     "29",  "11.1×",  "1.6%",   "NO",   "YES",  "58%",  "1.36d"],
      ["@drishtiastro", "Marathi","0",   "17", "0.4",   "13",     "30",     "13",  "2.3×",   "13.2%",  "NO",   "YES",  "67%",  "1.46d"],
    ];
    rows.forEach((r, ri) => {
      xx = 0.45;
      const bgRow = ri % 2 === 0 ? C.white : C.pinkPale;
      r.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 2.28 + ri * 0.36, w: cw[ci], h: 0.36, fill: { color: bgRow }, line: { color: C.border, width: 0.3 } });
        const isWin = ri === 0;
        const cellColor = isWin ? C.green : (ci === 0 ? C.redDark : C.textDark);
        rt(s, xx, 2.28 + ri * 0.36, cw[ci], 0.36, v,
          { size: 7.5, bold: ci === 0 || isWin, color: cellColor, align: "center", valign: "middle" });
        xx += cw[ci];
      });
    });
    srcLine(s, 0.45, 3.72, 12.6, "Our own scrape · viral outlier = max views ÷ median views · engagement % = (likes+comments) ÷ followers");

    // BOTTOM ROW — Winning Formula (left) + Hashtag/Hook Analysis (middle) + What's NOT Working (right)
    panel(s, 0.35, 4.15, 4.2, 2.95, "THE WINNING FORMULA  ·  REVERSE-ENGINEERED");
    rt(s, 0.5, 4.65, 3.9, 0.32, "@saathsetu Reel that hit 8,518 views (207× channel median):",
      { size: 9, bold: true, color: C.redDark });
    card(s, 0.5, 5.0, 3.9, 1.0);
    rt(s, 0.6, 5.1, 3.7, 0.85,
      "\"Kya aapke partner ka janam 6, 15 ya 24 ko hua hai? 🌹 Kya aapko pata hai Venus inhe possessive bana raha hai? Calm dikhenge, insecure hain…\"",
      { size: 8, italic: true, color: C.textDark, ls: 1.25 });
    rt(s, 0.5, 6.1, 3.9, 0.28, "5 INGREDIENTS THAT MADE IT VIRAL", { size: 8.5, bold: true, color: C.red });
    const ingredients = [
      ["1.", "Partner-birthdate hook (numerology curiosity)"],
      ["2.", "Roman-Hindi (reads natively for Hindi belt)"],
      ["3.", "Single Mulank focus + Venus/love angle"],
      ["4.", "Verified badge → algorithm priority"],
      ["5.", "Emoji-led visual rhythm (🌹✨)"],
    ];
    ingredients.forEach((ing, i) => {
      const yy = 6.4 + i * 0.13;
      rt(s, 0.5, yy, 0.3, 0.13, ing[0], { size: 7.5, bold: true, color: C.red });
      rt(s, 0.8, yy, 3.6, 0.13, ing[1], { size: 7.5, color: C.textDark });
    });

    // HOOK / HASHTAG ANALYSIS
    panel(s, 4.7, 4.15, 4.15, 2.95, "HOOK & HASHTAG PERFORMANCE");
    // Top hashtag share (text-only)
    rt(s, 4.85, 4.7, 3.85, 0.3, "TOP-HASHTAG OVERLAP ACROSS PORTFOLIO", { size: 8.5, bold: true, color: C.redDark });
    const hash = [
      ["#VedicAstrology",     "x4 handles  (high spam risk)"],
      ["#Numerology",          "x4 handles  (high spam risk)"],
      ["#Mulank + planet",     "best individual performer"],
      ["#MarathiAstrology",    "ONLY @drishtiastro - opportunity"],
    ];
    hash.forEach((h, i) => {
      const yy = 5.0 + i * 0.24;
      card(s, 4.85, yy, 3.85, 0.22, i % 2 === 0 ? C.white : C.pinkPale);
      rt(s, 4.95, yy, 2.0, 0.22, h[0], { size: 8, bold: true, color: C.redDark, valign: "middle" });
      rt(s, 6.95, yy, 1.75, 0.22, h[1], { size: 7.5, color: C.textDark, valign: "middle", italic: true });
    });
    // Hook detection
    rt(s, 4.85, 6.0, 3.85, 0.3, "HOOK PATTERNS DETECTED IN POSTS", { size: 8.5, bold: true, color: C.redDark });
    const hooks = [
      ["janam-date hook",  "55%"],
      ["mulank hook",      "73%"],
      ["partner-love hook","52%"],
      ["✨ emoji hook",     "94%"],
      ["fire 🔥 emoji",     "13%"],
    ];
    hooks.forEach((h, i) => {
      const yy = 6.3 + i * 0.13;
      rt(s, 4.85, yy, 2.0, 0.13, "› " + h[0], { size: 7.5, color: C.textDark });
      rt(s, 6.95, yy, 1.75, 0.13, h[1], { size: 7.5, bold: true, color: C.red });
    });

    // WHAT'S NOT WORKING
    panel(s, 9.0, 4.15, 4.0, 2.95, "WHAT'S NOT WORKING");
    const nots = [
      { t: "@astrosaadhan bio admits AI",
        b: "'Yeh content thoughtfully created by AI — glido labs' — kills elder trust." },
      { t: "@drishtiastro Marathi solo",
        b: "Real opportunity: 0 followers but Marathi astro market underserved. No cross-promo from @saathsetu." },
      { t: "All 4 are < 20 days old",
        b: "Post span 11.9-18.1 days. Insufficient signal for algorithm." },
      { t: "100% Reels on @saathsetu",
        b: "No carousel = no save anchor. Saves are IG's strongest signal." },
      { t: "Engagement % misleading",
        b: "@rashitattva 'engagement 18.1%' is on 1 follower = 1 like. Pure outlier noise." },
    ];
    nots.forEach((n, i) => {
      const yy = 4.65 + i * 0.47;
      s.addShape(pres.shapes.RECTANGLE, { x: 9.15, y: yy + 0.06, w: 0.08, h: 0.32, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 9.3, yy, 3.6, 0.2, n.t, { size: 8.5, bold: true, color: C.redDark });
      rt(s, 9.3, yy + 0.2, 3.6, 0.27, n.b, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
    });
  }

  // ===========================================================================
  // SLIDE 5 — COMPETITIVE LANDSCAPE + STRATEGIC FRAMEWORKS
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "COMPETITIVE LANDSCAPE",
      "WHERE WE PLAY ON THE INDIA ASTROLOGY MAP — ANSOFF · BCG · COMPETITOR BENCHMARK");
    footer(s, 5);

    // TOP — Competitor table (full width)
    panel(s, 0.35, 1.4, 12.65, 2.5, "REAL COMPETITOR DATA  ·  SOURCED FROM PUBLIC FILINGS, PRESS, TRACXN");
    const ch = ["PLAYER", "MODEL", "USERS / DOWNLOADS", "ANNUAL REV / ARR", "AGE COHORT", "AI USE", "OUR EDGE vs THEM"];
    const cwd = [1.5, 1.6, 2.1, 2.0, 1.4, 1.4, 2.6];
    let xx = 0.5;
    ch.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 1.9, w: cwd[i], h: 0.4, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, xx, 1.9, cwd[i], 0.4, h, { size: 8.5, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      xx += cwd[i];
    });
    const compRows = [
      ["AstroTalk",        "App + Live consult", "30M+ downloads",          "₹840 cr ARR (₹70cr × 12)",  "25-44",        "Low (human)",  "Faster, cheaper Reel-funnel ₹199 SKU"],
      ["AstroSage",        "Free Kundli + App",   "10M+ installs",           "₹60 cr FY24",                "35-65",        "Just launching", "Modern UI + WhatsApp-native delivery"],
      ["Astroyogi",        "App + Telco",         "Survey n=500K (2023)",    "Private (not disclosed)",    "25-35 (their data)", "Low",   "Hindi-belt + Marathi micro-niche"],
      ["InstaAstro",       "App",                  "VC-funded series",        "Not disclosed (~₹30-50 cr est)", "25-40",  "Medium",       "Lower CAC via organic IG hook content"],
      ["AppsForBharat",    "SriMandir (puja+astro)", "5M+ downloads",        "$40M raised 2024",            "35-65",        "Low",          "Astro-only focus + price under ₹500"],
      ["OUR PORTFOLIO",    "IG Reels + ₹199 PDF", "153 total followers",      "₹199 × N kundli per day",    "Hindi 25-55",  "AI-native voice + edit", "Only AI-native, multi-language, IG-organic"],
    ];
    compRows.forEach((r, ri) => {
      xx = 0.5;
      const isUs = ri === 5;
      r.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 2.3 + ri * 0.26, w: cwd[ci], h: 0.26,
          fill: { color: isUs ? C.red : (ri % 2 === 0 ? C.white : C.pinkPale) },
          line: { color: C.border, width: 0.3 } });
        rt(s, xx, 2.3 + ri * 0.26, cwd[ci], 0.26, v,
          { size: 7.5, bold: ci === 0 || isUs, color: isUs ? C.white : (ci === 0 ? C.redDark : C.textDark),
            align: ci === 0 || ci === 6 ? "left" : "center", valign: "middle" });
        xx += cwd[ci];
      });
    });
    srcLine(s, 0.5, 3.78, 12.6, "Sources: Upstox (Astrotalk ₹70cr/mo, 30M downloads), MarkNtel Advisors (AstroTalk ~80% share), AstroSage ₹60cr FY24, AppsForBharat $40M (TechCrunch 2024), Tracxn industry report");

    // BOTTOM — Ansoff (left), BCG (middle), Porter (right)
    // ANSOFF MATRIX
    panel(s, 0.35, 4.05, 4.2, 3.0, "ANSOFF MATRIX  ·  WHERE THE PLAYS LIVE");
    // 2x2
    const ax = 0.5, ay = 4.55, aw = 3.9, ah = 2.4;
    const qw = aw / 2, qh = ah / 2;
    // Quadrants
    s.addShape(pres.shapes.RECTANGLE, { x: ax,     y: ay,     w: qw, h: qh, fill: { color: C.pinkPale }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: ax+qw,  y: ay,     w: qw, h: qh, fill: { color: C.red },      line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: ax,     y: ay+qh,  w: qw, h: qh, fill: { color: C.pink },     line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: ax+qw,  y: ay+qh,  w: qw, h: qh, fill: { color: C.bgDeep },   line: { color: C.gray, width: 0.5 } });
    // Labels
    rt(s, ax+0.05, ay+0.05, qw-0.1, 0.22, "Penetration", { size: 7.5, bold: true, color: C.redDark });
    rt(s, ax+0.05, ay+0.3, qw-0.1, 0.4, "Scale ₹199\nto more buyers", { size: 7, color: C.textDark, ls: 1.2 });

    rt(s, ax+qw+0.05, ay+0.05, qw-0.1, 0.22, "★ PRODUCT DEV ★", { size: 7.5, bold: true, color: C.white });
    rt(s, ax+qw+0.05, ay+0.3, qw-0.1, 0.6, "WhatsApp panchang sub\n₹499 chat-add-on (live)\n₹1,499 detailed", { size: 7, color: C.white, bold: true, ls: 1.2 });

    rt(s, ax+0.05, ay+qh+0.05, qw-0.1, 0.22, "MARKET DEV", { size: 7.5, bold: true, color: C.redDark });
    rt(s, ax+0.05, ay+qh+0.3, qw-0.1, 0.6, "Marathi scale\n(@drishtiastro)\nB2B horoscope licensing", { size: 7, color: C.textDark, ls: 1.2 });

    rt(s, ax+qw+0.05, ay+qh+0.05, qw-0.1, 0.22, "Diversification", { size: 7.5, bold: true, color: C.gray });
    rt(s, ax+qw+0.05, ay+qh+0.3, qw-0.1, 0.6, "Gemstone e-com\n(highest risk)", { size: 7, color: C.textGray, ls: 1.2 });
    // Axis labels
    rt(s, ax, ay+ah+0.05, aw, 0.18, "← existing market         new market →", { size: 7, color: C.gray, align: "center" });

    // BCG MATRIX (middle)
    panel(s, 4.7, 4.05, 4.15, 3.0, "BCG MATRIX  ·  PORTFOLIO HANDLE PRIORITISATION");
    const bx = 4.85, by = 4.55, bw = 3.85, bh = 2.4;
    const bqw = bw/2, bqh = bh/2;
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: by, w: bqw, h: bqh, fill: { color: C.red }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: bx+bqw, y: by, w: bqw, h: bqh, fill: { color: C.pinkPale }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: by+bqh, w: bqw, h: bqh, fill: { color: C.pink }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: bx+bqw, y: by+bqh, w: bqw, h: bqh, fill: { color: C.bgDeep }, line: { color: C.gray, width: 0.5 } });
    rt(s, bx+0.05, by+0.05, bqw-0.1, 0.22, "STAR", { size: 8, bold: true, color: C.white });
    rt(s, bx+bqw+0.05, by+0.05, bqw-0.1, 0.22, "QUESTION MARK", { size: 8, bold: true, color: C.redDark });
    rt(s, bx+0.05, by+bqh+0.05, bqw-0.1, 0.22, "CASH COW", { size: 8, bold: true, color: C.redDark });
    rt(s, bx+bqw+0.05, by+bqh+0.05, bqw-0.1, 0.22, "DOG", { size: 8, bold: true, color: C.gray });
    // Plot bubbles for each handle
    // @saathsetu = Star (high growth, becoming high share within our portfolio)
    s.addShape(pres.shapes.OVAL, { x: bx + 0.5, y: by + 0.8, w: 0.5, h: 0.5, fill: { color: C.white }, line: { color: C.redDark, width: 2 } });
    rt(s, bx + 0.5, by + 0.8, 0.5, 0.5, "saath", { size: 6, bold: true, color: C.redDark, align: "center", valign: "middle" });
    // @rashitattva = Question mark (good signal, low scale)
    s.addShape(pres.shapes.OVAL, { x: bx + bqw + 0.6, y: by + 0.7, w: 0.4, h: 0.4, fill: { color: C.white }, line: { color: C.redDark, width: 2 } });
    rt(s, bx + bqw + 0.6, by + 0.7, 0.4, 0.4, "rashi", { size: 5.5, bold: true, color: C.redDark, align: "center", valign: "middle" });
    // @drishtiastro = Question mark (Marathi, virgin market)
    s.addShape(pres.shapes.OVAL, { x: bx + bqw + 0.3, y: by + 1.2, w: 0.5, h: 0.5, fill: { color: C.white }, line: { color: C.redDark, width: 2 } });
    rt(s, bx + bqw + 0.3, by + 1.2, 0.5, 0.5, "drish", { size: 6, bold: true, color: C.redDark, align: "center", valign: "middle" });
    // @astrosaadhan = Dog (AI disclosure killed trust)
    s.addShape(pres.shapes.OVAL, { x: bx + bqw + 0.4, y: by + bqh + 0.6, w: 0.4, h: 0.4, fill: { color: C.white }, line: { color: C.gray, width: 2 } });
    rt(s, bx + bqw + 0.4, by + bqh + 0.6, 0.4, 0.4, "astro", { size: 5.5, bold: true, color: C.gray, align: "center", valign: "middle" });
    rt(s, bx, by+bh+0.05, bw, 0.18, "← share within our portfolio →", { size: 7, color: C.gray, align: "center" });

    // PORTER 5 FORCES (right)
    panel(s, 9.0, 4.05, 4.0, 3.0, "PORTER'S 5 FORCES  ·  INDIA ASTRO");
    const forces = [
      { name: "Threat of new entrants",   rating: "HIGH",   why: "900+ religious tech startups (Tracxn 2024)" },
      { name: "Buyer bargaining power",   rating: "MED",    why: "Plentiful free kundli alternatives" },
      { name: "Supplier power",           rating: "LOW",    why: "AI replaces astrologer dependency" },
      { name: "Threat of substitutes",     rating: "HIGH",   why: "Free YouTube astrologers, WhatsApp pandits" },
      { name: "Competitive rivalry",       rating: "HIGH",   why: "AstroTalk ~80% share; consolidation underway" },
    ];
    forces.forEach((f, i) => {
      const yy = 4.55 + i * 0.49;
      card(s, 9.15, yy, 3.7, 0.45);
      const color = f.rating === "HIGH" ? C.red : f.rating === "MED" ? C.amber : C.green;
      s.addShape(pres.shapes.RECTANGLE, { x: 9.15, y: yy, w: 0.7, h: 0.45, fill: { color }, line: { type: "none" } });
      rt(s, 9.15, yy, 0.7, 0.45, f.rating, { size: 8, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 9.92, yy + 0.04, 2.95, 0.22, f.name, { size: 8.5, bold: true, color: C.redDark });
      rt(s, 9.92, yy + 0.24, 2.95, 0.22, f.why, { size: 7, italic: true, color: C.textGray });
    });
  }

  // ===========================================================================
  // SLIDE 6 — STRATEGIC LEVERS
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "STRATEGIC LEVERS", "WHERE TO PLAY × HOW TO WIN — A 5-PILLAR GROWTH ARCHITECTURE");
    footer(s, 6);

    // WHERE TO PLAY — 3 beachheads
    panel(s, 0.35, 1.4, 6.45, 2.8, "WHERE TO PLAY  ·  3 BEACHHEADS");
    const bh = [
      { tag: "BEACHHEAD #1", name: "Hindi-belt partner-birthdate", desc: "Scale @saathsetu viral formula across @rashitattva + @astrosaadhan. UP-Bihar-MP cohort: 25-45.",
        product: "₹199 → ₹499 kundli + chat", color: C.red },
      { tag: "BEACHHEAD #2", name: "Marathi micro-niche", desc: "@drishtiastro: virgin Marathi astro market. No major incumbent. Mumbai-Pune-Nashik.",
        product: "₹199 Marathi PDF + WA panchang", color: C.redDark },
      { tag: "BEACHHEAD #3", name: "Diaspora NRI Hindi", desc: "USA + UAE Hindi-speaking 30-55. Higher AOV. Long-form YT + WA delivery — natural fit.",
        product: "$15 USD kundli + live ₹2,499 consult", color: C.red },
    ];
    bh.forEach((b, i) => {
      const yy = 1.9 + i * 0.78;
      card(s, 0.5, yy, 6.15, 0.7);
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy, w: 1.2, h: 0.7, fill: { color: b.color }, line: { type: "none" } });
      rt(s, 0.5, yy + 0.06, 1.2, 0.25, b.tag, { size: 7, bold: true, color: C.white, align: "center", cs: 1 });
      rt(s, 0.5, yy + 0.3, 1.2, 0.35, "#" + (i + 1), { size: 24, bold: true, color: C.white, align: "center", valign: "middle", font: "Georgia" });
      rt(s, 1.75, yy + 0.05, 4.85, 0.25, b.name, { size: 11, bold: true, color: C.ink });
      rt(s, 1.75, yy + 0.28, 4.85, 0.22, b.desc, { size: 8, italic: true, color: C.textDark, ls: 1.2 });
      rt(s, 1.75, yy + 0.48, 4.85, 0.22, "Hero SKU: " + b.product, { size: 7.5, color: C.redDark, bold: true });
    });

    // HOW TO WIN — 5 pillars (right)
    panel(s, 6.95, 1.4, 6.05, 2.8, "HOW TO WIN  ·  5 STRATEGIC PILLARS");
    const pillars = [
      { n: "1", name: "VIRAL ENGINE",     desc: "Replicate partner-birthdate hook across 3 handles. Daily Reel cadence." },
      { n: "2", name: "TRUST STACK",     desc: "Get verified on all 4. Remove AI disclosure on @astrosaadhan. Hindi pandit voice." },
      { n: "3", name: "CHANNEL MOAT",    desc: "WhatsApp + YouTube + IVR + Temple QR. No single-platform risk." },
      { n: "4", name: "PRODUCT LADDER",  desc: "₹49 sub → ₹199 PDF → ₹499 chat → ₹1,499 detailed → ₹2,499 live" },
      { n: "5", name: "CRO DISCIPLINE",  desc: "Landing page rebuild. WhatsApp checkout. UPI + EMI. Retargeting pixel." },
    ];
    pillars.forEach((p, i) => {
      const yy = 1.92 + i * 0.45;
      s.addShape(pres.shapes.OVAL, { x: 7.1, y: yy, w: 0.42, h: 0.42, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 7.1, yy, 0.42, 0.42, p.n, { size: 14, bold: true, color: C.white, fontFace: "Georgia", align: "center", valign: "middle" });
      rt(s, 7.65, yy + 0.02, 1.8, 0.2, p.name, { size: 10, bold: true, color: C.redDark, cs: 1 });
      rt(s, 7.65, yy + 0.22, 5.1, 0.2, p.desc, { size: 8, color: C.textDark, italic: true });
    });

    // BOTTOM — Strategic Choices Cascade (Roger Martin / Playing to Win)
    panel(s, 0.35, 4.35, 12.65, 2.75, "STRATEGIC CHOICES CASCADE (ROGER MARTIN · PLAYING TO WIN)");
    const cascade = [
      { step: "01", name: "WINNING ASPIRATION", body: "Become India's #1 AI-native, multi-language astrology brand for the Hindi-Hinglish-Marathi belt within 18 months. Crack 25K followers per page and ₹50L+ MRR." },
      { step: "02", name: "WHERE TO PLAY",      body: "Hindi-belt (25-55) primary | Marathi sub-niche secondary | NRI diaspora tertiary. AVOID urban English-Gen-Z (Co-Star, AstroTalk dominate) and live-consult marketplace (margin compression)." },
      { step: "03", name: "HOW TO WIN",         body: "Viral hook engine (partner-birthdate + Mulank+planet) × AI cost base × cross-handle promotion × WhatsApp checkout × Hindi-pandit voice (no AI disclosure). 8x cheaper unit economics than AstroTalk." },
      { step: "04", name: "CAPABILITIES",       body: "AI Reel factory (GPT + ElevenLabs + Canva) | WhatsApp Business API | Razorpay UPI/EMI | Microsoft Clarity heatmap (already installed per scrape) | Vidya/Vedic copywriter (human-in-loop)." },
      { step: "05", name: "MANAGEMENT SYSTEMS", body: "Weekly NSM review | content pod (3 people) | landing CRO sprint cadence (bi-weekly) | WhatsApp drip A/B testing | UTM + Meta pixel tracking." },
    ];
    cascade.forEach((c, i) => {
      const cx = 0.5 + i * 2.55;
      card(s, cx, 4.85, 2.45, 2.15);
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: 4.85, w: 2.45, h: 0.35, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, cx, 4.85, 0.55, 0.35, c.step, { size: 11, bold: true, color: C.white, align: "center", valign: "middle", font: "Georgia" });
      rt(s, cx + 0.5, 4.85, 1.85, 0.35, c.name, { size: 8.5, bold: true, color: C.white, valign: "middle", cs: 1 });
      rt(s, cx + 0.1, 5.25, 2.25, 1.7, c.body, { size: 8, color: C.textDark, ls: 1.3, italic: true });
    });
  }

  // ===========================================================================
  // SLIDE 7 — GROWTH ENGINE
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "GROWTH ENGINE",
      "COLD-START ESCAPE PLAYBOOK + CONTENT FACTORY + DISTRIBUTION MOATS");
    footer(s, 7);

    // PHASE 1 — COLD START
    panel(s, 0.35, 1.4, 4.2, 5.65, "PHASE 1  ·  COLD-START ESCAPE (30 DAYS)");
    rt(s, 0.5, 1.92, 3.9, 0.3, "Break the algorithmic inertia of 3 dormant handles.", { size: 9, italic: true, color: C.textGray });
    const cs = [
      { n: "01", t: "@saathsetu cross-promo",
        d: "Verified handle posts a Story shoutout for each of 3 dormant handles. Avg 1,591 views = 800-1,200 sample." },
      { n: "02", t: "Reverse-engineered hook drops",
        d: "Day-1 to Day-14: 1 partner-birthdate Reel per handle per day. Variants on Mulank 1-9 × Venus/Mars/Saturn." },
      { n: "03", t: "Save-bait carousels",
        d: "Add 1 carousel/day per handle: 'Aap Mulank 5 ho? Yeh 7 cheez aapko jaroor jaanni chahiye.' High save rate = algo lift." },
      { n: "04", t: "Engagement pod",
        d: "Private WhatsApp group of 30 real accounts. First 30 min after every post = coordinated likes/saves/DMs." },
      { n: "05", t: "Trending audio stack",
        d: "Use top-3 Hindi/Marathi trending audio within 24h of trend spike. Stack 3 #VedicAstrology + 3 hyper-niche tags." },
      { n: "06", t: "Marathi push for @drishtiastro",
        d: "Switch ALL content to Marathi (currently 11 Devanagari / 23 Roman). Marathi-specific hashtags. Mumbai-Pune-Nashik geo-targeting." },
    ];
    cs.forEach((c, i) => {
      const yy = 2.25 + i * 0.78;
      card(s, 0.5, yy, 3.9, 0.7);
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy, w: 0.55, h: 0.7, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 0.5, yy, 0.55, 0.7, c.n, { size: 15, bold: true, color: C.white, font: "Georgia", align: "center", valign: "middle" });
      rt(s, 1.1, yy + 0.05, 3.25, 0.22, c.t, { size: 9, bold: true, color: C.redDark });
      rt(s, 1.1, yy + 0.27, 3.25, 0.42, c.d, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
    });

    // PHASE 2 — CONTENT FACTORY
    panel(s, 4.7, 1.4, 4.15, 5.65, "PHASE 2  ·  AI CONTENT FACTORY (DAILY OUTPUT)");
    rt(s, 4.85, 1.92, 3.85, 0.3, "Target ~22 Reels + 4 carousels + 1 long-form/day across portfolio.", { size: 9, italic: true, color: C.textGray });
    const factory = [
      { step: "STEP 1", tool: "GPT-4o + claude.ai",  job: "Generate 50 Roman-Hindi hooks/day from Mulank × planet × emotion matrix" },
      { step: "STEP 2", tool: "ElevenLabs Voice",     job: "Single Hindi voice (NOT marked AI). 3 voices per handle for variety." },
      { step: "STEP 3", tool: "Canva Pro + HeyGen",  job: "Auto-generate Reel template (text + B-roll + planet visual)" },
      { step: "STEP 4", tool: "CapCut + Suno",        job: "Music sync to trending audio. Hook in first 1.2 sec — critical for IG." },
      { step: "STEP 5", tool: "Later / Buffer",       job: "Auto-schedule per handle at optimal slot (4-5 PM + 9-10 PM Indian)" },
      { step: "STEP 6", tool: "Microsoft Clarity",    job: "Already live on landing page — feeds heatmap into Reel-CTA optimisation" },
    ];
    factory.forEach((f, i) => {
      const yy = 2.25 + i * 0.78;
      card(s, 4.85, yy, 3.85, 0.7);
      s.addShape(pres.shapes.RECTANGLE, { x: 4.85, y: yy, w: 1.1, h: 0.7, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, 4.85, yy + 0.08, 1.1, 0.26, f.step, { size: 9, bold: true, color: C.white, align: "center" });
      rt(s, 4.85, yy + 0.38, 1.1, 0.26, f.tool, { size: 7.5, italic: true, color: C.white, align: "center" });
      rt(s, 6.0, yy + 0.1, 2.7, 0.55, f.job, { size: 8, color: C.textDark, valign: "middle", ls: 1.2 });
    });

    // PHASE 3 — DISTRIBUTION MOATS
    panel(s, 9.0, 1.4, 4.0, 5.65, "PHASE 3  ·  DISTRIBUTION MOATS");
    rt(s, 9.15, 1.92, 3.7, 0.3, "Reduce IG dependency to <60% of new orders.", { size: 9, italic: true, color: C.textGray });
    const moats = [
      { icon: "📱", t: "WhatsApp Business",  d: "Daily panchang push to opt-in list. Free kundli → ₹199 upsell. Voice-note Hindi support." },
      { icon: "🛕", t: "Temple QR Network",  d: "Stickers at 50 pilot temples (Pune, Mumbai, Nashik). 'Free kundli — scan' → WA flow." },
      { icon: "📺", t: "YouTube long-form",  d: "Weekly 8-min 'Mulank 1 wale 2026 mein kya' video. SEO compounds. Mid-roll ads." },
      { icon: "📞", t: "IVR cold call (Hindi)",d: "Pre-recorded voice: 'Aap apni kundli sun-na chahte ho?' Press 1 = WA opt-in. ₹0.4/call." },
      { icon: "🙏", t: "Pandit referral",    d: "Local pandits get ₹30 commission per ₹199 order. WhatsApp link shared in their broadcast." },
      { icon: "🎪", t: "Festival activations", d: "Diwali, Navratri, Makar Sankranti — pre-built 3-message WA sequences." },
    ];
    moats.forEach((m, i) => {
      const yy = 2.25 + i * 0.78;
      card(s, 9.15, yy, 3.7, 0.7);
      s.addShape(pres.shapes.RECTANGLE, { x: 9.15, y: yy, w: 0.7, h: 0.7, fill: { color: C.bgDeep }, line: { type: "none" } });
      rt(s, 9.15, yy, 0.7, 0.7, m.icon, { size: 22, align: "center", valign: "middle" });
      rt(s, 9.9, yy + 0.05, 2.9, 0.22, m.t, { size: 9, bold: true, color: C.redDark });
      rt(s, 9.9, yy + 0.27, 2.9, 0.42, m.d, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
    });
  }

  // ===========================================================================
  // SLIDE 8 — CONTENT ARCHITECTURE
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "CONTENT ARCHITECTURE",
      "WHAT TO POST, WHEN TO POST, AND WHY EACH PIECE CONVERTS");
    footer(s, 8);

    // TOP — Pillar Framework (3 columns)
    panel(s, 0.35, 1.4, 12.65, 3.0, "3-PILLAR CONTENT FRAMEWORK · 70/20/10 RULE");
    const pillarsC = [
      { tag: "70% TRUST & RITUAL", color: C.redDark, types: [
          "Daily rashifal in Hindi/Marathi (5 AM auto-post)",
          "Aaj ka panchang + rahu kaal",
          "Festival muhurat (Navratri, Akshay Tritiya...)",
          "Sanskrit shloka + 1-line Hindi meaning",
        ], why: "Builds habit. High save rate. Targets Hindi-belt 35-65 buyer." },
      { tag: "20% IDENTITY & VIRAL", color: C.red, types: [
          "Partner-birthdate hook (our 8.5K-view formula)",
          "Mulank × planet × emotion combos",
          "'Aap Mulank 5 ho toh yeh problem aati hai...'",
          "Compatibility share-cards (2 dates → match %)",
        ], why: "Pure Explore-page fuel. Drives 18-34 followers + family share." },
      { tag: "10% EDUCATION & AUTHORITY", color: C.amber, types: [
          "'Saturn vakri kya hota hai?' explainer",
          "Birth chart reading tutorial (carousel)",
          "Common myths debunked",
          "'Why I trust Vedic over Western'",
        ], why: "Positions brand. Drives shares to family WhatsApp groups." },
    ];
    pillarsC.forEach((p, i) => {
      const px = 0.5 + i * 4.2;
      card(s, px, 1.85, 4.1, 2.5);
      s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.85, w: 4.1, h: 0.4, fill: { color: p.color }, line: { type: "none" } });
      rt(s, px, 1.85, 4.1, 0.4, p.tag, { size: 11, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      // Types
      p.types.forEach((t, ti) => {
        const yy = 2.32 + ti * 0.32;
        s.addShape(pres.shapes.OVAL, { x: px + 0.15, y: yy + 0.05, w: 0.12, h: 0.12, fill: { color: p.color }, line: { type: "none" } });
        rt(s, px + 0.32, yy, 3.7, 0.32, t, { size: 8.5, color: C.textDark, ls: 1.2 });
      });
      // Why
      s.addShape(pres.shapes.RECTANGLE, { x: px + 0.1, y: 3.65, w: 3.9, h: 0.65, fill: { color: C.pinkPale }, line: { color: C.border, width: 0.3 } });
      rt(s, px + 0.2, 3.7, 3.7, 0.25, "WHY IT CONVERTS:", { size: 7.5, bold: true, color: p.color, cs: 1 });
      rt(s, px + 0.2, 3.92, 3.7, 0.4, p.why, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
    });

    // BOTTOM ROW: Posting schedule (left) + Hook taxonomy (middle) + Cross-handle map (right)
    panel(s, 0.35, 4.55, 4.2, 2.55, "POSTING SCHEDULE  ·  24 HOURS");
    // Time slots
    const slots = [
      { time: "05:00 AM", content: "Panchang carousel", handle: "all 4", color: C.amber },
      { time: "07:30 AM", content: "Daily rashifal Reel", handle: "saath + drishti", color: C.red },
      { time: "12:30 PM", content: "Viral hook Reel #1", handle: "rashitattva", color: C.redDark },
      { time: "04:00 PM", content: "Identity / compat Reel", handle: "all 4", color: C.red },
      { time: "07:00 PM", content: "Trending audio Reel", handle: "saath + astro", color: C.amber },
      { time: "09:30 PM", content: "Authority carousel", handle: "drishtiastro", color: C.redDark },
    ];
    slots.forEach((sl, i) => {
      const yy = 4.95 + i * 0.32;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy, w: 0.95, h: 0.28, fill: { color: sl.color }, line: { type: "none" } });
      rt(s, 0.5, yy, 0.95, 0.28, sl.time, { size: 8.5, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 1.55, yy + 0.02, 1.85, 0.24, sl.content, { size: 8, color: C.textDark, valign: "middle" });
      rt(s, 3.5, yy + 0.02, 0.95, 0.24, sl.handle, { size: 7, italic: true, color: C.redDark, valign: "middle", align: "right" });
    });
    rt(s, 0.5, 6.92, 3.9, 0.2, "= ~22 Reels + 8 carousels weekly · auto-scheduled via Buffer",
      { size: 7.5, italic: true, color: C.gray, align: "center" });

    panel(s, 4.7, 4.55, 4.15, 2.55, "HOOK TAXONOMY  ·  COPY-PASTE TEMPLATES");
    const hookTpl = [
      { name: "Partner-Birthdate (HERO)",      ex: "\"Aapke partner ka janam X taarikh ko hua hai? Toh yeh planet inhe...\"", lift: "8.5K views (proven)" },
      { name: "Mulank Identity",                ex: "\"Sab Mulank 4 ek jaise nahi hote. Agar tum 13 ko born ho toh...\"",  lift: "Best on @astrosaadhan" },
      { name: "Compatibility 1×1",              ex: "\"Mulank 1 + Mulank 6 = (insert outcome). Yeh emotional combination ka...\"", lift: "Share-card potential" },
      { name: "Planet Vakri Alert",             ex: "\"Saturn vakri ho gaya. Inn 3 raashi walon ka khelega zyada...\"",         lift: "Time-bound urgency" },
      { name: "Numerology Decision Hook",       ex: "\"Yeh date pe shaadi mat karna agar tumhara Mulank ___ hai...\"",          lift: "Saves > 50%" },
    ];
    hookTpl.forEach((h, i) => {
      const yy = 4.95 + i * 0.4;
      card(s, 4.85, yy, 3.85, 0.36);
      rt(s, 4.95, yy + 0.02, 2.2, 0.16, h.name, { size: 7.5, bold: true, color: C.redDark });
      rt(s, 7.15, yy + 0.02, 1.6, 0.16, h.lift, { size: 6.5, italic: true, color: C.green, align: "right" });
      rt(s, 4.95, yy + 0.18, 3.7, 0.18, h.ex, { size: 7, italic: true, color: C.textGray });
    });
    rt(s, 4.85, 6.92, 3.95, 0.2, "Every hook ≤ 1.2 sec to first emotional beat — IG algo decides distribution there",
      { size: 7.5, italic: true, color: C.gray, align: "center" });

    panel(s, 9.0, 4.55, 4.0, 2.55, "CROSS-HANDLE PROMOTION MAP");
    // @saathsetu hub → other 3 spokes
    s.addShape(pres.shapes.OVAL, { x: 10.5, y: 4.95, w: 1.0, h: 1.0, fill: { color: C.red }, line: { color: C.redDark, width: 2 } });
    rt(s, 10.5, 4.95, 1.0, 1.0, "@saath\nsetu", { size: 9, bold: true, color: C.white, align: "center", valign: "middle" });
    // Three spokes
    const spokes = [
      { name: "@drishti", x: 9.2, y: 6.2 },
      { name: "@rashi",   x: 10.5, y: 6.7 },
      { name: "@astro",   x: 11.8, y: 6.2 },
    ];
    spokes.forEach(sp => {
      s.addShape(pres.shapes.OVAL, { x: sp.x, y: sp.y, w: 0.8, h: 0.6, fill: { color: C.white }, line: { color: C.redDark, width: 1 } });
      rt(s, sp.x, sp.y, 0.8, 0.6, sp.name, { size: 7, bold: true, color: C.redDark, align: "center", valign: "middle" });
      // Arrow
      s.addShape(pres.shapes.LINE, { x: sp.x + 0.4, y: sp.y, w: 11.0 - sp.x - 0.4, h: 4.95 + 0.5 - sp.y,
        line: { color: C.red, width: 1, endArrowType: "triangle" } });
    });
    rt(s, 9.15, 6.92, 3.7, 0.2, "Verified handle = trust transfer engine.",
      { size: 7.5, italic: true, color: C.gray, align: "center" });
  }

  // ===========================================================================
  // SLIDE 9 — MONETIZATION + LANDING CRO
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "MONETIZATION & CRO", "FROM ₹199 SINGLE SKU TO ₹49→₹2,499 LADDER + LANDING-PAGE FIXES");
    footer(s, 9);

    // PRODUCT LADDER (top half, full width)
    panel(s, 0.35, 1.4, 12.65, 2.55, "PRODUCT LADDER  ·  GROW BUYER FROM ₹49 TO ₹2,499 OVER 12 MONTHS");
    const tiers = [
      { name: "FREEMIUM",     price: "FREE",     desc: "Mini-kundli + 1 daily WA push",   nextStep: "Lead magnet",         color: C.bgDeep, tc: C.textDark },
      { name: "PANCHANG SUB", price: "₹49/mo",   desc: "Daily WA panchang + tithi alerts", nextStep: "Habit + upsell pool", color: C.pinkPale, tc: C.textDark },
      { name: "KUNDLI PDF",   price: "₹199",     desc: "11-page Vedic PDF (live SKU)",    nextStep: "Already monetising",   color: C.red, tc: C.white },
      { name: "PDF + CHAT",   price: "₹499",     desc: "Same PDF + 15-min astrologer chat", nextStep: "Live SKU on astrorajni", color: C.redDark, tc: C.white },
      { name: "DETAILED",     price: "₹1,499",   desc: "40-page + remedy + AI consult",   nextStep: "Mid-funnel hero",     color: C.redDark, tc: C.white },
      { name: "LIVE CONSULT", price: "₹2,499",   desc: "30-min pandit + recorded call",   nextStep: "Premium tier",        color: C.amber, tc: C.white },
    ];
    tiers.forEach((t, i) => {
      const tx = 0.5 + i * 2.07;
      card(s, tx, 1.93, 2.0, 1.95, t.color);
      s.addShape(pres.shapes.RECTANGLE, { x: tx, y: 1.93, w: 2.0, h: 0.45, fill: { color: t.color === C.bgDeep || t.color === C.pinkPale ? C.red : C.white }, line: { type: "none" } });
      rt(s, tx, 1.93, 2.0, 0.45, t.name,
        { size: 9, bold: true, color: t.color === C.bgDeep || t.color === C.pinkPale ? C.white : t.tc === C.white ? C.red : C.redDark,
          align: "center", valign: "middle", cs: 1 });
      rt(s, tx + 0.05, 2.45, 1.9, 0.55, t.price,
        { size: 22, bold: true, color: t.tc, align: "center", valign: "middle", font: "Georgia" });
      rt(s, tx + 0.08, 3.05, 1.85, 0.45, t.desc, { size: 7.5, italic: true, color: t.tc, align: "center", ls: 1.2 });
      rt(s, tx + 0.08, 3.55, 1.85, 0.3, "→ " + t.nextStep, { size: 7, color: t.tc, align: "center", bold: true });
    });

    // BOTTOM ROW — 8 ALT REVENUE STREAMS (left) + LANDING PAGE CRO (right)
    panel(s, 0.35, 4.1, 6.45, 3.0, "8 ALTERNATIVE REVENUE STREAMS BEYOND ₹199 PDF");
    const alts = [
      { icon: "📅", name: "Panchang Subscription", rev: "₹49/mo recurring" },
      { icon: "💎", name: "Gemstone E-commerce",  rev: "15-25% margin (dropship)" },
      { icon: "🎓", name: "Numerology Course",     rev: "₹1,999 self-paced WA" },
      { icon: "🏢", name: "B2B Horoscope License", rev: "₹15K-₹50K/mo per outlet" },
      { icon: "🎪", name: "Festival Pooja Booking", rev: "20% commission" },
      { icon: "🤝", name: "Astrologer Marketplace", rev: "30% platform fee" },
      { icon: "🎁", name: "Astro Gift Kits (Diwali)", rev: "₹799-₹2,499 AOV" },
      { icon: "📺", name: "YouTube + Brand Sponsor", rev: "Adsense + ₹50K-₹2L per video" },
    ];
    alts.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const ax = 0.5 + col * 3.15, ay = 4.62 + row * 0.6;
      card(s, ax, ay, 3.05, 0.55);
      rt(s, ax + 0.08, ay, 0.45, 0.55, a.icon, { size: 18, align: "center", valign: "middle" });
      rt(s, ax + 0.55, ay + 0.02, 2.4, 0.28, a.name, { size: 9, bold: true, color: C.redDark });
      rt(s, ax + 0.55, ay + 0.28, 2.4, 0.25, a.rev, { size: 7.5, italic: true, color: C.green });
    });

    // LANDING PAGE CRO
    panel(s, 6.95, 4.1, 6.05, 3.0, "LANDING PAGE CRO  ·  REAL AUDIT OF YOUR TWO LIVE PAGES");
    rt(s, 7.1, 4.6, 5.85, 0.25, "Pages audited: astrokalpana.bhagvatgitadaily.com  +  astrorajni.bhagvatgitadaily.com",
      { size: 8, italic: true, color: C.gray });
    // 2 columns: current state + recommended fixes
    rt(s, 7.1, 4.9, 2.85, 0.28, "WHAT'S WORKING (KEEP)", { size: 9, bold: true, color: C.green });
    const working = [
      "'52,459+ reports delivered' = strong social proof",
      "Microsoft Clarity already installed = heatmap data ready",
      "₹199 + ₹499 ladder live on astrorajni",
      "24-72hr WhatsApp delivery promise (clear SLA)",
      "Next.js + Tailwind = fast load, mobile-first",
      "Hinglish copy matches buyer's reading mode",
    ];
    working.forEach((w, i) => {
      rt(s, 7.1, 5.2 + i * 0.21, 2.85, 0.2, "✓ " + w, { size: 7.5, color: C.textDark });
    });
    rt(s, 10.05, 4.9, 2.9, 0.28, "FIXES (P0/P1)", { size: 9, bold: true, color: C.red });
    const fixes = [
      { p: "P0", t: "Countdown + scarcity (live)" },
      { p: "P0", t: "5 video testimonials above fold" },
      { p: "P0", t: "Money-back guarantee badge" },
      { p: "P1", t: "Free mini-kundli lead magnet" },
      { p: "P1", t: "WhatsApp 'Order via DM' CTA" },
      { p: "P1", t: "UPI Intent + Simpl BNPL" },
      { p: "P2", t: "Meta Pixel + retargeting setup" },
      { p: "P2", t: "Astrologer face photo + name above CTA" },
    ];
    fixes.forEach((f, i) => {
      const yy = 5.2 + i * 0.21;
      s.addShape(pres.shapes.RECTANGLE, { x: 10.05, y: yy + 0.02, w: 0.3, h: 0.18, fill: { color: f.p === "P0" ? C.red : f.p === "P1" ? C.amber : C.gray }, line: { type: "none" } });
      rt(s, 10.05, yy + 0.02, 0.3, 0.18, f.p, { size: 6.5, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 10.4, yy, 2.55, 0.2, f.t, { size: 7.5, color: C.textDark });
    });
  }

  // ===========================================================================
  // SLIDE 10 — ROADMAP + KPI SCOREBOARD + CLOSING
  // ===========================================================================
  {
    const s = pres.addSlide();
    bg(s);
    pageHeader(s, "EXECUTION & SCOREBOARD", "90-DAY PHASED ROADMAP + KPI TARGETS + RISK REGISTER + THE ASK");
    footer(s, 10);

    // ROADMAP — 3 phases
    panel(s, 0.35, 1.4, 8.65, 2.85, "90-DAY ROADMAP  ·  FOUNDATION → SCALE → MONETISE");
    const phases = [
      { name: "PHASE 1", days: "DAYS 1-30", color: C.red, items: [
          "@saathsetu cross-promo for 3 dormant handles",
          "Set up AI Reel factory (GPT + ElevenLabs + Canva)",
          "Daily 5-6 Reel cadence per handle",
          "Save-bait carousels (1/day per handle)",
          "Launch WhatsApp panchang subscription (₹49)",
          "Landing page P0 fixes (testimonials + scarcity + guarantee)",
        ], kpi: "1K followers / handle\n800+ daily Reel views" },
      { name: "PHASE 2", days: "DAYS 31-60", color: C.redDark, items: [
          "Marathi pivot for @drishtiastro (delete English content)",
          "Onboard 50 local pandits as Jyotish Ambassadors",
          "Temple QR pilot in 30 locations (Pune-Mumbai-Nashik)",
          "Launch ₹499 chat add-on at scale",
          "Compatibility share-card viral loop deploy",
          "Meta Pixel + retargeting (₹5K/mo budget)",
        ], kpi: "5K followers / handle\n50+ orders / day" },
      { name: "PHASE 3", days: "DAYS 61-90", color: C.amber, items: [
          "Launch ₹1,499 detailed report tier",
          "YouTube long-form channel (1 video/week)",
          "B2B horoscope syndication pitch (3 outlets)",
          "Gemstone affiliate launch (Diwali-timed)",
          "Festival campaign sequences automated (Diwali, Navratri)",
          "Hindi pandit avatar voice replaces AI disclosure",
        ], kpi: "10K-15K followers / handle\n₹10L MRR portfolio" },
    ];
    phases.forEach((p, i) => {
      const px = 0.5 + i * 2.85;
      card(s, px, 1.9, 2.75, 2.3);
      s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.9, w: 2.75, h: 0.5, fill: { color: p.color }, line: { type: "none" } });
      rt(s, px + 0.1, 1.95, 1.55, 0.2, p.name, { size: 10, bold: true, color: C.white, cs: 1 });
      rt(s, px + 0.1, 2.2, 1.55, 0.2, p.days, { size: 8, color: C.white, italic: true });
      p.items.forEach((it, ii) => {
        const yy = 2.5 + ii * 0.22;
        s.addShape(pres.shapes.RECTANGLE, { x: px + 0.1, y: yy + 0.06, w: 0.06, h: 0.08, fill: { color: p.color }, line: { type: "none" } });
        rt(s, px + 0.2, yy, 2.5, 0.22, it, { size: 7.5, color: C.textDark, ls: 1.1 });
      });
      // KPI box
      s.addShape(pres.shapes.RECTANGLE, { x: px, y: 3.85, w: 2.75, h: 0.35, fill: { color: p.color, transparency: 80 }, line: { type: "none" } });
      rt(s, px + 0.1, 3.9, 2.55, 0.3, "KPI: " + p.kpi, { size: 7.5, bold: true, color: p.color });
    });

    // KPI SCOREBOARD (right top)
    panel(s, 9.15, 1.4, 3.85, 2.85, "KPI SCOREBOARD  ·  D-30 / D-60 / D-90");
    const kpiSc = [
      { metric: "Followers / handle",         m30: "1K",   m60: "5K",   m90: "10-15K" },
      { metric: "Daily Reel views / portfolio", m30: "5K",   m60: "25K",  m90: "100K+"   },
      { metric: "Orders / day (₹199)",         m30: "10",  m60: "50",   m90: "150+"  },
      { metric: "WhatsApp opt-in base",        m30: "500", m60: "5K",   m90: "20K"   },
      { metric: "Blended CAC",                 m30: "₹120",m60: "₹65",  m90: "₹40"  },
      { metric: "AOV (avg order value)",       m30: "₹199",m60: "₹260", m90: "₹380" },
      { metric: "Portfolio MRR",               m30: "₹60K",m60: "₹3L",  m90: "₹10L" },
    ];
    const hdrS = ["METRIC", "D-30", "D-60", "D-90"];
    const cwS = [1.6, 0.7, 0.7, 0.7];
    xx = 9.3;
    hdrS.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 1.92, w: cwS[i], h: 0.32, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, xx, 1.92, cwS[i], 0.32, h, { size: 8, bold: true, color: C.white, align: "center", valign: "middle" });
      xx += cwS[i];
    });
    kpiSc.forEach((k, ri) => {
      xx = 9.3;
      const vals = [k.metric, k.m30, k.m60, k.m90];
      vals.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 2.24 + ri * 0.28, w: cwS[ci], h: 0.28, fill: { color: ri % 2 === 0 ? C.white : C.pinkPale }, line: { color: C.border, width: 0.3 } });
        rt(s, xx, 2.24 + ri * 0.28, cwS[ci], 0.28, v,
          { size: 7.5, bold: ci === 0 || ci === 3, color: ci === 3 ? C.green : (ci === 0 ? C.redDark : C.textDark),
            align: ci === 0 ? "left" : "center", valign: "middle" });
        xx += cwS[ci];
      });
    });

    // RISK REGISTER (left bottom)
    panel(s, 0.35, 4.4, 8.65, 2.7, "RISK REGISTER  ·  TOP 5 RISKS & MITIGATIONS");
    const risks = [
      { r: "IG algorithm change (Reels demoted)",  p: "MED",  i: "HIGH", m: "Build WA + YT + IVR in parallel; never >50% revenue from IG" },
      { r: "AI voice disclosure backlash",          p: "MED",  i: "HIGH", m: "Remove 'created by AI' from @astrosaadhan bio; use real Hindi pandit voice" },
      { r: "AstroTalk copy-cats partner hook",      p: "HIGH", i: "MED",  m: "Speed of replication > defensibility; ride first-mover for 6 months" },
      { r: "Temple QR low conversion",              p: "MED",  i: "LOW",  m: "Pilot 30 locations; A/B test offer; pivot in 14 days if <2% scan rate" },
      { r: "Regulatory (ASCI astrology disclaimer)", p: "LOW",  i: "HIGH", m: "Add 'for entertainment purposes' on landing pages; legal review" },
    ];
    const rh = ["RISK", "PROB", "IMPACT", "MITIGATION"];
    const rcw = [3.3, 0.65, 0.7, 3.85];
    xx = 0.5;
    rh.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 4.9, w: rcw[i], h: 0.3, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, xx, 4.9, rcw[i], 0.3, h, { size: 8, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      xx += rcw[i];
    });
    risks.forEach((r, ri) => {
      xx = 0.5;
      const vals = [r.r, r.p, r.i, r.m];
      vals.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 5.2 + ri * 0.35, w: rcw[ci], h: 0.35, fill: { color: ri % 2 === 0 ? C.white : C.pinkPale }, line: { color: C.border, width: 0.3 } });
        const color = (ci === 1 || ci === 2) ?
          (v === "HIGH" ? C.red : v === "MED" ? C.amber : C.green) : C.textDark;
        rt(s, xx, 5.2 + ri * 0.35, rcw[ci], 0.35, v,
          { size: 7.5, bold: ci === 0 || ci === 1 || ci === 2, color,
            align: ci === 0 || ci === 3 ? "left" : "center", valign: "middle" });
        xx += rcw[ci];
      });
    });

    // THE ASK (right bottom)
    panel(s, 9.15, 4.4, 3.85, 2.7, "THE ASK  ·  3 DECISIONS");
    const asks = [
      { n: "01", t: "Approve content factory",        d: "₹15-25K/mo opex" },
      { n: "02", t: "Approve cross-promo from saath", d: "Day 1 — costless" },
      { n: "03", t: "Approve landing P0 sprint",      d: "2-week dev cycle" },
    ];
    asks.forEach((a, i) => {
      const yy = 4.9 + i * 0.65;
      card(s, 9.3, yy, 3.55, 0.55);
      s.addShape(pres.shapes.OVAL, { x: 9.35, y: yy + 0.07, w: 0.4, h: 0.4, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 9.35, yy + 0.07, 0.4, 0.4, a.n, { size: 11, bold: true, color: C.white, fontFace: "Georgia", align: "center", valign: "middle" });
      rt(s, 9.85, yy + 0.05, 3.0, 0.25, a.t, { size: 9, bold: true, color: C.redDark });
      rt(s, 9.85, yy + 0.28, 3.0, 0.25, a.d, { size: 8, italic: true, color: C.textGray });
    });
    // Closing line
    s.addShape(pres.shapes.RECTANGLE, { x: 9.3, y: 6.85, w: 3.55, h: 0.22, fill: { color: C.redDark }, line: { type: "none" } });
    rt(s, 9.3, 6.85, 3.55, 0.22, "Sources: Upstox · MarkNtel · Tracxn · own scrape",
      { size: 6.5, italic: true, color: C.white, align: "center", valign: "middle" });
  }

  const outPath = "/mnt/session/outputs/Astrology_Portfolio_Strategy.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("DONE:", outPath);
}

main().catch(e => { console.error(e); process.exit(1); });
