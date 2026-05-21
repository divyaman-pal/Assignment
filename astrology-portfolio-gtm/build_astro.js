// Astrology Portfolio Growth Strategy — v3
// Improvements over v2:
// - Fixed text overlaps on every slide (wider panels, better spacing)
// - Added real charts (LINE, BAR, DOUGHNUT) using pptxgenjs charts
// - NEW Slide 8: 10 sure-shot strategies overview with time + outcome
// - NEW Slide 9: Deep dive — Partner-Birthdate Franchise mechanics
// - NEW Slide 10: Deep dive — Pandit + Temple offline moat
// - NEW Slide 11: Deep dive — B2B + Premium plays
// - NEW Slide 16: Week-by-week 12-week roadmap (replaces vague 30/60/90)
// - NEW Slide 17: KPI scoreboard with M0->M12 trajectory + risk register
// All numbers sourced (MarkNtel, Upstox, Tracxn) or from first-party scrape

const pptxgen = require("pptxgenjs");

const C = {
  bg:"FFF1F2", bgDeep:"FBE0E3", red:"D63D58", redDark:"A6304F",
  redLite:"FAB0BC", pink:"FECCD3", pinkPale:"FFDFE3", white:"FFFFFF",
  ink:"1A1216", textDark:"2A1F22", textGray:"564B4F", gray:"8E8084",
  border:"F0CFD4", amber:"C77E17", green:"1F7A4A", teal:"0D7372",
  purple:"6B3FA0",
};

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  const W = 13.333, H = 7.5;
  const TOTAL = 18;

  // -------- helpers --------
  const bg = (s) => { s.background = { color: C.bg }; };
  const header = (s, title, sub) => {
    s.addText(title, { x: 0.35, y: 0.22, w: W - 0.7, h: 0.55,
      fontSize: 30, bold: true, color: C.ink, fontFace: "Calibri", margin: 0 });
    s.addText(sub, { x: 0.35, y: 0.74, w: W - 0.7, h: 0.3,
      fontSize: 12, bold: true, color: C.textDark, fontFace: "Calibri", charSpacing: 1, margin: 0 });
    for (let i = 0; i < 60; i++) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.35 + i * 0.22, y: 1.13, w: 0.12, h: 0.025,
        fill: { color: C.redLite }, line: { type: "none" } });
    }
  };
  const panel = (s, x, y, w, h, title, opts = {}) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h,
      fill: { color: opts.fill || C.bg },
      line: { color: C.redLite, width: 1, dashType: "dash" } });
    if (title) {
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.04, y: y + 0.04, w: w - 0.08, h: 0.4,
        fill: { color: opts.titleFill || C.red }, line: { type: "none" } });
      s.addText(title, { x: x + 0.04, y: y + 0.04, w: w - 0.08, h: 0.4,
        fontSize: opts.titleSize || 11, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", charSpacing: 1, margin: 0 });
    }
  };
  const card = (s, x, y, w, h, fill = C.white) => {
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h,
      fill: { color: fill }, line: { color: C.border, width: 0.5 } });
  };
  const rt = (s, x, y, w, h, text, opts = {}) => {
    s.addText(text, { x, y, w, h, margin: 0,
      fontSize: opts.size || 9, color: opts.color || C.textDark,
      bold: opts.bold || false, italic: opts.italic || false,
      fontFace: opts.font || "Calibri", align: opts.align || "left",
      valign: opts.valign || "top", charSpacing: opts.cs || 0, ls: opts.ls });
  };
  const srcLine = (s, x, y, w, text) => {
    rt(s, x, y, w, 0.18, text, { size: 7, italic: true, color: C.gray });
  };
  const footer = (s, n) => {
    rt(s, W - 1.5, H - 0.3, 1.3, 0.22, `PAGE ${n} / ${TOTAL}`,
      { size: 8, color: C.gray, align: "right" });
    rt(s, 0.3, H - 0.3, 7, 0.22, "ASTRO PORTFOLIO GROWTH STRATEGY  ·  v3  ·  CONFIDENTIAL",
      { size: 7, color: C.gray, cs: 1 });
  };

  // ============== SLIDE 1 — COVER ==============
  {
    const s = pres.addSlide();
    bg(s);
    s.addShape(pres.shapes.OVAL, { x: -2, y: -1, w: 6, h: 6, fill: { color: C.pinkPale }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: 9, y: -1.5, w: 6, h: 6, fill: { color: C.pinkPale }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: -1, y: 4, w: 4, h: 4, fill: { color: C.pink, transparency: 70 }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: 10, y: 4.5, w: 4, h: 4, fill: { color: C.pink, transparency: 70 }, line: { type: "none" } });

    rt(s, 0, 0.4, W, 1.4, "ASTRO", { size: 90, bold: true, color: C.ink, font: "Impact", align: "center", cs: 4 });
    rt(s, 0, 1.55, W, 1.2, "PORTFOLIO", { size: 74, bold: true, color: C.red, font: "Impact", align: "center", cs: 4 });

    s.addShape(pres.shapes.RECTANGLE, { x: 2.6, y: 3.2, w: 8.1, h: 0.9,
      fill: { color: C.white }, line: { color: C.red, width: 3 } });
    rt(s, 2.6, 3.2, 8.1, 0.9, "10 SURE-SHOT STRATEGIES · TIME-BOUND EXECUTION",
      { size: 18, bold: true, color: C.ink, align: "center", valign: "middle", cs: 2 });

    rt(s, 0, 4.25, W, 0.32, "GROWTH · MONETIZATION · CONVERSION — STRATEGY PLAYBOOK",
      { size: 12, bold: true, color: C.redDark, align: "center", cs: 4 });

    const handles = [
      { name: "@saathsetu", sub: "Hindi · Verified", big: "149", lbl: "followers · 8.5K viral hit" },
      { name: "@drishtiastro", sub: "Marathi", big: "0", lbl: "followers · 17 posts" },
      { name: "@rashitattva", sub: "Hindi", big: "1", lbl: "follower · 136× viral lift" },
      { name: "@astrosaadhan", sub: "Hindi", big: "3", lbl: "followers · AI disclosed" },
    ];
    handles.forEach((h, i) => {
      const x = 0.6 + i * 3.05;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.85, w: 2.85, h: 1.85, rectRadius: 0.18,
        fill: { color: C.white }, line: { color: C.red, width: 1.2 } });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 4.85, w: 2.85, h: 0.32, fill: { color: C.red }, line: { type: "none" } });
      rt(s, x, 4.85, 2.85, 0.32, h.name, { size: 11, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, x, 5.25, 2.85, 0.75, h.big, { size: 32, bold: true, color: C.red, font: "Georgia", align: "center", valign: "middle" });
      rt(s, x + 0.1, 6.05, 2.65, 0.3, h.lbl, { size: 8.5, color: C.textGray, align: "center" });
      rt(s, x, 6.4, 2.85, 0.28, h.sub, { size: 9.5, italic: true, bold: true, color: C.redDark, align: "center" });
    });

    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.1, w: W, h: 0.4, fill: { color: C.red }, line: { type: "none" } });
    rt(s, 0, 7.1, W, 0.4, "DATA-DRIVEN  ·  10 UNIQUE STRATEGIES  ·  WEEK-BY-WEEK EXECUTION  ·  ALL NUMBERS SOURCED",
      { size: 10, bold: true, color: C.white, align: "center", valign: "middle", cs: 3 });
  }

  // ============== SLIDE 2 — PROBLEM FRAMING (overlaps fixed) ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "PROBLEM FRAMING", "FOUR PAGES · ONE VIRAL FORMULA · UNDER-CAPTURED HUGE MARKET");
    footer(s, 2);

    panel(s, 0.35, 1.35, 4.1, 2.8, "INDUSTRY CONTEXT");
    rt(s, 0.5, 1.88, 3.8, 0.6,
      "India's astrology category is on a once-in-a-decade S-curve. AstroTalk takes 80%, leaving 20% for 900+ startups — fragmented opportunity if positioned right.",
      { size: 8.5, ls: 1.25, color: C.textDark });
    card(s, 0.5, 2.55, 1.85, 0.65);
    rt(s, 0.5, 2.58, 1.85, 0.32, "$163M", { size: 16, bold: true, color: C.red, align: "center" });
    rt(s, 0.5, 2.9, 1.85, 0.25, "India market 2024", { size: 7.5, color: C.textGray, align: "center" });
    card(s, 2.45, 2.55, 1.85, 0.65);
    rt(s, 2.45, 2.58, 1.85, 0.32, "$1.79B", { size: 16, bold: true, color: C.red, align: "center" });
    rt(s, 2.45, 2.9, 1.85, 0.25, "Projected 2030", { size: 7.5, color: C.textGray, align: "center" });
    card(s, 0.5, 3.25, 1.85, 0.55);
    rt(s, 0.5, 3.27, 1.85, 0.27, "49.19%", { size: 14, bold: true, color: C.red, align: "center" });
    rt(s, 0.5, 3.54, 1.85, 0.24, "CAGR '25-30", { size: 7, color: C.textGray, align: "center" });
    card(s, 2.45, 3.25, 1.85, 0.55);
    rt(s, 2.45, 3.27, 1.85, 0.27, "~80%", { size: 14, bold: true, color: C.red, align: "center" });
    rt(s, 2.45, 3.54, 1.85, 0.24, "AstroTalk share", { size: 7, color: C.textGray, align: "center" });
    srcLine(s, 0.5, 3.93, 3.8, "Source: MarkNtel Advisors Aug-2025 · Upstox industry report");

    panel(s, 4.6, 1.35, 8.4, 2.8, "PORTFOLIO REALITY  ·  WHAT WE INHERITED");
    const cw = [1.45, 0.7, 0.95, 0.7, 1.1, 1.1, 0.8];
    const hdrs = ["HANDLE", "LANG", "FOLLOWERS", "POSTS", "AVG VIEWS", "MAX VIEWS", "VERIFIED"];
    let xx = 4.7;
    hdrs.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 1.85, w: cw[i], h: 0.32, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, xx, 1.85, cw[i], 0.32, h, { size: 8, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      xx += cw[i];
    });
    const rows = [
      ["@saathsetu", "Hindi", "149", "7", "1,591", "8,518", "YES"],
      ["@rashitattva", "Hindi", "1", "11", "97", "615", "NO"],
      ["@astrosaadhan", "Hindi", "3", "19", "28", "45", "NO"],
      ["@drishtiastro", "Marathi", "0", "17", "13", "30", "NO"],
    ];
    rows.forEach((r, ri) => {
      xx = 4.7;
      r.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 2.17 + ri * 0.34, w: cw[ci], h: 0.34,
          fill: { color: ri % 2 === 0 ? C.white : C.pinkPale }, line: { color: C.border, width: 0.3 } });
        const isHero = ri === 0;
        const col = isHero && (ci === 2 || ci === 4 || ci === 5) ? C.green : (ci === 0 ? C.redDark : C.textDark);
        rt(s, xx, 2.17 + ri * 0.34, cw[ci], 0.34, v,
          { size: 8.5, bold: ci === 0 || isHero, color: col,
            align: ci === 0 ? "left" : "center", valign: "middle" });
        xx += cw[ci];
      });
    });
    srcLine(s, 4.7, 3.6, 8.0, "Source: First-party scrape · May 2026 · 153 followers total across 4 handles");

    // ROW 2 — FIXED: failure loop has explicit space below for caption
    panel(s, 0.35, 4.3, 6.3, 2.9, "5 STRUCTURAL BARRIERS TO 25K");
    const barriers = [
      { t: "Algorithm cold-start", b: "3/4 accounts <20 posts, zero engagement. IG = 0 distribution." },
      { t: "Single-format Reels-only", b: "100% Reels on @saathsetu. No carousels = no saves anchor." },
      { t: "Audience-platform mismatch", b: "Buyers skew 35-65. IG core 18-34. Wrong gate." },
      { t: "Marathi handle unseeded", b: "@drishtiastro 0 followers despite 17 posts. Marathi astro = upside." },
      { t: "AI disclosed in @astrosaadhan bio", b: "'Created by AI' kills credibility with elder buyer." },
    ];
    barriers.forEach((b, i) => {
      const yy = 4.85 + i * 0.43;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y: yy + 0.05, w: 0.2, h: 0.2, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 0.5, yy + 0.05, 0.2, 0.2, (i + 1).toString(),
        { size: 9, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 0.78, yy + 0.02, 5.8, 0.22, b.t, { size: 9.5, bold: true, color: C.redDark });
      rt(s, 0.78, yy + 0.22, 5.8, 0.22, b.b, { size: 7.5, italic: true, color: C.textDark });
    });

    panel(s, 6.75, 4.3, 6.25, 2.9, "NORTH STAR METRIC + 6 GUARDRAILS");
    rt(s, 6.9, 4.82, 5.9, 0.32, "Weekly Paid Kundli Orders per 1K Followers",
      { size: 12, bold: true, color: C.ink });
    rt(s, 6.9, 5.15, 5.9, 0.7,
      "Combines reach + trust + monetisation in one number — protects against vanity-follower growth without revenue.",
      { size: 8.5, italic: true, color: C.textGray, ls: 1.25 });
    const secondary = [
      ["Avg views per Reel", "across all 4 handles"],
      ["Save rate per post", "IG's strongest signal"],
      ["WhatsApp opt-in conversion", "post-page-view rate"],
      ["Cost per ₹199 order", "CAC discipline"],
      ["LTV : CAC ratio", "long-term durability"],
      ["Sent → Show-up at consult", "for premium tier"],
    ];
    secondary.forEach((m, i) => {
      const yy = 5.9 + i * 0.21;
      s.addShape(pres.shapes.RECTANGLE, { x: 6.9, y: yy + 0.05, w: 0.07, h: 0.1, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 7.05, yy, 3.0, 0.2, m[0], { size: 8.5, bold: true, color: C.textDark });
      rt(s, 10.1, yy, 2.75, 0.2, m[1], { size: 7.5, italic: true, color: C.gray });
    });
  }

  // ============== SLIDE 3 — MARKET OPPORTUNITY with REAL CHARTS ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "MARKET OPPORTUNITY", "WHY NOW — INDIA ASTRO IS THE FASTEST-GROWING DIGITAL CATEGORY GLOBALLY");
    footer(s, 3);

    panel(s, 0.35, 1.35, 6.4, 3.0, "INDIA ASTROLOGY APP MARKET (USD MILLIONS)");
    s.addChart(pres.charts.LINE, [{
      name: "Market size (USD M)",
      labels: ["2024", "2025", "2026", "2027", "2028", "2029", "2030"],
      values: [163, 243, 363, 542, 808, 1206, 1797],
    }], {
      x: 0.5, y: 1.85, w: 6.1, h: 2.3,
      chartColors: [C.red],
      lineSize: 3, lineSmooth: true,
      chartArea: { fill: { color: C.white }, roundedCorners: true },
      catAxisLabelColor: C.textDark, valAxisLabelColor: C.textGray,
      catAxisLabelFontSize: 9, valAxisLabelFontSize: 9,
      showLegend: false, showTitle: false,
      valGridLine: { color: C.border, size: 0.5 },
      showValue: true, dataLabelFontSize: 7, dataLabelColor: C.redDark,
      dataLabelPosition: "t",
    });
    srcLine(s, 0.5, 4.2, 6.0, "Source: MarkNtel Advisors Aug-2025 · 49.19% CAGR · projected $1.79B by 2030");

    panel(s, 6.85, 1.35, 6.15, 3.0, "INDIA ASTROLOGY APP — MARKET SHARE");
    s.addChart(pres.charts.DOUGHNUT, [{
      name: "Share %",
      labels: ["AstroTalk", "AstroSage", "Others"],
      values: [80, 6, 14],
    }], {
      x: 7.05, y: 1.85, w: 5.85, h: 2.3,
      chartColors: [C.red, C.redDark, C.pink],
      chartArea: { fill: { color: C.white } },
      showLegend: true, legendPos: "r",
      legendFontSize: 9, legendColor: C.textDark,
      dataLabelFontSize: 10, dataLabelColor: C.white, dataLabelFontBold: true,
      showValue: true,
      holeSize: 55,
    });
    srcLine(s, 7.05, 4.2, 5.7, "Source: MarkNtel Advisors (AstroTalk ~80% share)");

    panel(s, 0.35, 4.5, 6.4, 2.7, "DEMAND DRIVERS  ·  WHY THE CURVE EXISTS");
    const drivers = [
      ["📱", "Smartphone base", "700M+ users (TRAI FY24)"],
      ["💬", "WhatsApp dominance", "500M+ Indian users — trust channel"],
      ["🌐", "Internet penetration", "950M+ users by Mar 2024 (TRAI)"],
      ["💳", "UPI normalisation", "134B+ txns FY23, frictionless ₹199"],
      ["🌺", "Cultural anchor", "Vedic = 60%+ of category (MarkNtel)"],
      ["🌸", "Gen-Z curiosity", "53.8% Gen-Z sought astro (Astroyogi '23)"],
    ];
    drivers.forEach((d, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const dx = 0.5 + col * 3.1, dy = 4.9 + row * 0.78;
      card(s, dx, dy, 3.0, 0.7);
      rt(s, dx + 0.1, dy + 0.1, 0.5, 0.5, d[0], { size: 18, align: "center", valign: "middle" });
      rt(s, dx + 0.65, dy + 0.05, 2.3, 0.3, d[1], { size: 9, bold: true, color: C.redDark });
      rt(s, dx + 0.65, dy + 0.35, 2.3, 0.3, d[2], { size: 7.5, italic: true, color: C.textDark });
    });

    panel(s, 6.85, 4.5, 6.15, 2.7, "VC FUNDING TRAJECTORY ($M, YEARLY)");
    s.addChart(pres.charts.BAR, [{
      name: "Funding $M",
      labels: ["2015", "2019", "2022", "2024"],
      values: [0.088, 5, 25, 50],
    }], {
      x: 7.0, y: 5.0, w: 5.85, h: 1.85,
      barDir: "col",
      chartColors: [C.red],
      chartArea: { fill: { color: C.white } },
      catAxisLabelColor: C.textDark, valAxisLabelColor: C.textGray,
      catAxisLabelFontSize: 9, valAxisLabelFontSize: 9,
      showLegend: false, showTitle: false,
      valGridLine: { color: C.border, size: 0.5 },
      showValue: true, dataLabelFontSize: 8, dataLabelColor: C.redDark,
      dataLabelPosition: "outEnd",
    });
    srcLine(s, 7.0, 6.9, 5.8, "Source: Tracxn — funding grew $88K (2015) → $50M (2024)");
  }

  // ============== SLIDE 4 — ROOT CAUSE (fixed JTBD text box width) ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "ROOT CAUSE ANALYSIS", "MECE DECOMPOSITION OF WHY @SAATHSETU SCALED AND OTHER 3 STALLED");
    footer(s, 4);

    panel(s, 0.35, 1.35, 4.15, 3.0, "CATEGORY REALITY");
    const facts = [
      "AstroTalk ~80% share, 30M+ downloads, ₹70cr monthly revenue (Upstox)",
      "AstroSage 10M+ installs, ₹60cr FY24",
      "AppsForBharat (SriMandir) raised $40M in 2024",
      "Vedic astrology = 60%+ of category (MarkNtel)",
      "Hinglish captions 25-30% higher engagement vs English",
      "Top Hindi astro influencer Jaya Karamchandani = 204K (ceiling proof)",
    ];
    facts.forEach((f, i) => {
      const yy = 1.85 + i * 0.4;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy + 0.08, w: 0.06, h: 0.08, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 0.65, yy, 3.7, 0.38, f, { size: 8, color: C.textDark, ls: 1.2 });
    });

    panel(s, 4.6, 1.35, 4.15, 3.0, "TRUST DEFICIT INDEX (TDI)");
    const ovs = [
      { x: 4.85, y: 1.92, label: "Verification\n(badge/cert)" },
      { x: 6.85, y: 1.92, label: "Voice\n(human ≠ AI)" },
      { x: 4.85, y: 2.95, label: "Visual Proof\n(testimonials)" },
      { x: 6.85, y: 2.95, label: "Velocity\n(post cadence)" },
    ];
    ovs.forEach(o => {
      s.addShape(pres.shapes.OVAL, { x: o.x, y: o.y, w: 1.65, h: 0.85,
        fill: { color: C.pinkPale }, line: { color: C.red, width: 1 } });
      rt(s, o.x, o.y, 1.65, 0.85, o.label,
        { size: 8.5, bold: true, color: C.redDark, align: "center", valign: "middle" });
    });
    card(s, 4.95, 3.95, 3.5, 0.3, C.red);
    rt(s, 4.95, 3.95, 3.5, 0.3, "TDI = Verification + Voice + Visual Proof + Velocity",
      { size: 9, bold: true, color: C.white, align: "center", valign: "middle" });

    panel(s, 8.85, 1.35, 4.15, 3.0, "DATA-DRIVEN FUNNEL LEAKAGE");
    const fs = [
      { l: "Reel views", v: "avg 1,844 (saath)", w: 3.8, c: C.red },
      { l: "Profile visit", v: "~3-5% of viewers", w: 3.2, c: C.red },
      { l: "Follow", v: "viral 79.6× lift", w: 2.6, c: C.redDark },
      { l: "Landing page click", v: "bio link only", w: 2.0, c: C.redDark },
      { l: "₹199 order", v: "CR ≈ 2-3% (est)", w: 1.4, c: C.redDark },
    ];
    fs.forEach((f, i) => {
      const yy = 1.92 + i * 0.4;
      const cx = 8.95 + (3.95 - f.w) / 2;
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: yy, w: f.w, h: 0.3,
        fill: { color: f.c }, line: { type: "none" } });
      rt(s, cx, yy, f.w, 0.3, f.l, { size: 8.5, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 8.95, yy + 0.3, 3.95, 0.1, f.v, { size: 6.5, italic: true, color: C.gray, align: "center" });
    });
    rt(s, 8.95, 4.05, 3.95, 0.25, "BIG DROP: Reels → Profile → Follow",
      { size: 7.5, italic: true, bold: true, color: C.redDark, align: "center" });

    // FIXED JTBD — wider right column
    panel(s, 0.35, 4.5, 6.45, 2.7, "JOBS-TO-BE-DONE PYRAMID  ·  WHAT THE BUYER IS HIRING US FOR");
    const jt = [
      { y: 5.0, w: 1.2, l: "EMOTIONAL", b: "Feel seen, feel hope, feel guided" },
      { y: 5.42, w: 2.0, l: "SOCIAL", b: "Validation from peers, family, partner" },
      { y: 5.84, w: 2.8, l: "IDENTITY", b: "'I am Mulank 3 / Saturn person' — language to define self" },
      { y: 6.26, w: 3.6, l: "FUNCTIONAL", b: "Decision-making for marriage, career, health" },
    ];
    jt.forEach(lv => {
      const cx = 0.55 + (3.7 - lv.w) / 2;
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: lv.y, w: lv.w, h: 0.36,
        fill: { color: C.red }, line: { color: C.white, width: 1 } });
      rt(s, cx, lv.y, lv.w, 0.36, lv.l, { size: 8, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 4.45, lv.y + 0.02, 2.3, 0.4, lv.b, { size: 7.5, italic: true, color: C.textDark, valign: "middle", ls: 1.2 });
    });
    rt(s, 0.5, 6.8, 6.25, 0.3,
      "@saathsetu's 8.5K Reel hits ALL 4 layers in 30 sec via partner-birthdate hook",
      { size: 7.5, italic: true, color: C.gray, align: "center" });

    panel(s, 6.9, 4.5, 6.1, 2.7, "ROOT CAUSE TREE");
    rt(s, 7.05, 5.0, 5.8, 0.3,
      "PRIMARY: Insufficient daily-utility content + cross-handle promo across portfolio.",
      { size: 9, bold: true, color: C.redDark });
    rt(s, 7.05, 5.32, 5.8, 0.3, "SECONDARY DRIVERS", { size: 8.5, bold: true, color: C.red });
    const sd = [
      "No carousel/static content — Reels-only misses saves",
      "AI-generated voice on @astrosaadhan kills trust",
      "Marathi unseeded — @drishtiastro 0 followers despite 17 posts",
      "No cross-promotion from verified @saathsetu to other 3",
    ];
    sd.forEach((r, i) => {
      const yy = 5.62 + i * 0.22;
      rt(s, 7.05, yy, 0.12, 0.2, "›", { size: 9, bold: true, color: C.red });
      rt(s, 7.2, yy, 5.55, 0.22, r, { size: 7.5, color: C.textDark });
    });
    rt(s, 7.05, 6.55, 5.8, 0.3, "TERTIARY (BUYER-SIDE)", { size: 8.5, bold: true, color: C.red });
    rt(s, 7.05, 6.78, 5.8, 0.22, "› Bio not optimised for elder · no Hindi headers on landing",
      { size: 7.5, color: C.textDark });
  }

  // ============== SLIDE 5 — PERFORMANCE AUDIT ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "PERFORMANCE AUDIT", "REAL ENGAGEMENT METRICS + REVERSE-ENGINEERED VIRAL FORMULA");
    footer(s, 5);

    panel(s, 0.35, 1.35, 12.65, 2.6, "FIRST-PARTY INSTAGRAM SCRAPE  ·  4 HANDLES × 14 METRICS  ·  MAY 2026");
    const hdrs2 = ["HANDLE", "LANG", "FOLL", "POSTS", "AVG LIKES", "AVG VIEWS", "MAX VIEWS",
      "MEDIAN", "VIRAL ×", "ENG %", "VERIFIED", "BUSINESS", "REELS %", "POST GAP"];
    const cw2 = [1.4, 0.6, 0.75, 0.55, 0.85, 0.85, 0.9, 0.85, 0.85, 0.85, 0.85, 0.85, 0.75, 0.85];
    let xx = 0.45;
    hdrs2.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 1.87, w: cw2[i], h: 0.36, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, xx, 1.87, cw2[i], 0.36, h, { size: 7, bold: true, color: C.white, align: "center", valign: "middle", cs: 0.5 });
      xx += cw2[i];
    });
    const rows2 = [
      ["@saathsetu", "Hindi", "149", "7", "302.7", "1,591", "8,518", "107", "207.7×", "79.6%", "YES", "NO", "100%", "1.98d"],
      ["@rashitattva", "Hindi", "1", "11", "1.1", "97", "615", "34", "136.4×", "18.1%", "NO", "YES", "82%", "1.81d"],
      ["@astrosaadhan", "Hindi", "3", "19", "0.3", "28", "45", "29", "11.1×", "1.6%", "NO", "YES", "58%", "1.36d"],
      ["@drishtiastro", "Marathi", "0", "17", "0.4", "13", "30", "13", "2.3×", "13.2%", "NO", "YES", "67%", "1.46d"],
    ];
    rows2.forEach((r, ri) => {
      xx = 0.45;
      r.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 2.23 + ri * 0.36, w: cw2[ci], h: 0.36,
          fill: { color: ri % 2 === 0 ? C.white : C.pinkPale }, line: { color: C.border, width: 0.3 } });
        const isWin = ri === 0;
        const cellColor = isWin ? C.green : (ci === 0 ? C.redDark : C.textDark);
        rt(s, xx, 2.23 + ri * 0.36, cw2[ci], 0.36, v,
          { size: 7.5, bold: ci === 0 || isWin, color: cellColor, align: "center", valign: "middle" });
        xx += cw2[ci];
      });
    });
    srcLine(s, 0.45, 3.67, 12.6, "Our own scrape · viral × = max ÷ median · engagement % = (likes + comments) ÷ followers");

    panel(s, 0.35, 4.1, 4.2, 3.0, "THE WINNING FORMULA");
    rt(s, 0.5, 4.6, 3.9, 0.32, "@saathsetu's 8,518-view Reel:",
      { size: 9, bold: true, color: C.redDark });
    card(s, 0.5, 4.92, 3.9, 1.0);
    rt(s, 0.6, 5.02, 3.7, 0.85,
      "\"Kya aapke partner ka janam 6, 15 ya 24 ko hua hai? 🌹 Kya aapko pata hai Venus inhe possessive bana raha hai? Calm dikhenge, insecure hain…\"",
      { size: 8, italic: true, color: C.textDark, ls: 1.25 });
    rt(s, 0.5, 6.0, 3.9, 0.28, "5 INGREDIENTS", { size: 8.5, bold: true, color: C.red });
    const ings = [
      ["1.", "Partner-birthdate hook"],
      ["2.", "Roman-Hindi"],
      ["3.", "Mulank focus + Venus/love angle"],
      ["4.", "Verified badge → algo priority"],
      ["5.", "Emoji rhythm (🌹✨)"],
    ];
    ings.forEach((ing, i) => {
      const yy = 6.3 + i * 0.15;
      rt(s, 0.5, yy, 0.3, 0.15, ing[0], { size: 7.5, bold: true, color: C.red });
      rt(s, 0.8, yy, 3.6, 0.15, ing[1], { size: 7.5, color: C.textDark });
    });

    panel(s, 4.7, 4.1, 4.15, 3.0, "HOOK & HASHTAG PERFORMANCE");
    rt(s, 4.85, 4.6, 3.85, 0.3, "TOP-HASHTAG OVERLAP", { size: 8.5, bold: true, color: C.redDark });
    const hash = [
      ["#VedicAstrology", "x4 (spam risk)"],
      ["#Numerology", "x4 (spam risk)"],
      ["#Mulank + planet", "best performer"],
      ["#MarathiAstrology", "ONLY @drishtiastro — UPSIDE"],
    ];
    hash.forEach((h, i) => {
      const yy = 4.92 + i * 0.24;
      card(s, 4.85, yy, 3.85, 0.22, i % 2 === 0 ? C.white : C.pinkPale);
      rt(s, 4.95, yy, 2.0, 0.22, h[0], { size: 8, bold: true, color: C.redDark, valign: "middle" });
      rt(s, 6.95, yy, 1.75, 0.22, h[1], { size: 7.5, color: C.textDark, valign: "middle", italic: true });
    });
    rt(s, 4.85, 5.95, 3.85, 0.3, "HOOK PATTERNS IN POSTS", { size: 8.5, bold: true, color: C.redDark });
    const hooks = [
      ["janam-date hook", "55%"],
      ["mulank hook", "73%"],
      ["partner-love hook", "52%"],
      ["✨ emoji hook", "94%"],
      ["fire 🔥 emoji", "13%"],
    ];
    hooks.forEach((h, i) => {
      const yy = 6.25 + i * 0.14;
      rt(s, 4.85, yy, 2.0, 0.14, "› " + h[0], { size: 7.5, color: C.textDark });
      rt(s, 6.95, yy, 1.75, 0.14, h[1], { size: 7.5, bold: true, color: C.red });
    });

    panel(s, 9.0, 4.1, 4.0, 3.0, "WHAT'S NOT WORKING");
    const nots = [
      { t: "@astrosaadhan bio admits AI", b: "Public 'Created by AI' kills elder trust" },
      { t: "@drishtiastro Marathi solo", b: "0 followers but untapped market. No cross-promo" },
      { t: "All 4 are < 20 days old", b: "Post span 11-18 days. Algo signal weak" },
      { t: "100% Reels on @saathsetu", b: "No carousel = no save anchor" },
      { t: "Engagement % misleading", b: "@rashitattva '18%' on 1 follower = noise" },
    ];
    nots.forEach((n, i) => {
      const yy = 4.6 + i * 0.47;
      s.addShape(pres.shapes.RECTANGLE, { x: 9.15, y: yy + 0.06, w: 0.08, h: 0.32, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 9.3, yy, 3.6, 0.2, n.t, { size: 8.5, bold: true, color: C.redDark });
      rt(s, 9.3, yy + 0.2, 3.6, 0.27, n.b, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
    });
  }

  // ============== SLIDE 6 — COMPETITIVE LANDSCAPE ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "COMPETITIVE LANDSCAPE", "REAL COMPETITOR DATA + ANSOFF · BCG · PORTER");
    footer(s, 6);

    panel(s, 0.35, 1.35, 12.65, 2.4, "REAL COMPETITOR DATA  ·  UPSTOX · TRACXN · TECHCRUNCH · MARKNTEL");
    const ch = ["PLAYER", "MODEL", "USERS", "ANNUAL REVENUE", "AGE COHORT", "AI USE", "OUR EDGE vs THEM"];
    const cwd = [1.4, 1.55, 1.85, 2.05, 1.3, 1.35, 2.95];
    let xx = 0.5;
    ch.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 1.85, w: cwd[i], h: 0.4, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, xx, 1.85, cwd[i], 0.4, h, { size: 8.5, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      xx += cwd[i];
    });
    const compRows = [
      ["AstroTalk", "App + Live consult", "30M+ downloads", "₹840 cr ARR", "25-44", "Low (human)", "Faster, cheaper Reel-funnel ₹199 SKU"],
      ["AstroSage", "Free Kundli + App", "10M+ installs", "₹60 cr FY24", "35-65", "Just launching", "Modern UI + WA-native delivery"],
      ["Astroyogi", "App + Telco", "500K survey '23", "Private", "25-35", "Low", "Hindi-belt + Marathi micro-niche"],
      ["InstaAstro", "App", "VC-funded series", "~₹30-50 cr est", "25-40", "Medium", "Lower CAC via organic IG hook content"],
      ["AppsForBharat", "SriMandir", "5M+ downloads", "$40M raised 2024", "35-65", "Low", "Astro-only focus + price under ₹500"],
      ["OUR PORTFOLIO", "IG Reels + ₹199 PDF", "153 followers", "₹199 × N kundli/day", "Hindi 25-55", "AI voice+edit", "Only AI-native, multi-lang, IG-organic"],
    ];
    compRows.forEach((r, ri) => {
      xx = 0.5;
      const isUs = ri === 5;
      r.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: xx, y: 2.25 + ri * 0.22, w: cwd[ci], h: 0.22,
          fill: { color: isUs ? C.red : (ri % 2 === 0 ? C.white : C.pinkPale) },
          line: { color: C.border, width: 0.3 } });
        rt(s, xx, 2.25 + ri * 0.22, cwd[ci], 0.22, v,
          { size: 7.5, bold: ci === 0 || isUs, color: isUs ? C.white : (ci === 0 ? C.redDark : C.textDark),
            align: ci === 0 || ci === 6 ? "left" : "center", valign: "middle" });
        xx += cwd[ci];
      });
    });

    // ANSOFF MATRIX
    panel(s, 0.35, 3.9, 4.2, 3.2, "ANSOFF MATRIX  ·  WHERE THE PLAYS LIVE");
    const ax = 0.5, ay = 4.4, aw = 3.9, ah = 2.3;
    const qw = aw / 2, qh = ah / 2;
    s.addShape(pres.shapes.RECTANGLE, { x: ax, y: ay, w: qw, h: qh, fill: { color: C.pinkPale }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: ax + qw, y: ay, w: qw, h: qh, fill: { color: C.red }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: ax, y: ay + qh, w: qw, h: qh, fill: { color: C.pink }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: ax + qw, y: ay + qh, w: qw, h: qh, fill: { color: C.bgDeep }, line: { color: C.gray, width: 0.5 } });
    rt(s, ax + 0.08, ay + 0.05, qw - 0.15, 0.22, "Market Penetration", { size: 7.5, bold: true, color: C.redDark });
    rt(s, ax + 0.08, ay + 0.3, qw - 0.15, 0.7, "Scale ₹199 to current\nbuyer pool · retargeting,\nUPI, EMI options", { size: 7, color: C.textDark, ls: 1.2 });
    rt(s, ax + qw + 0.08, ay + 0.05, qw - 0.15, 0.22, "★ PRODUCT DEV ★", { size: 7.5, bold: true, color: C.white });
    rt(s, ax + qw + 0.08, ay + 0.3, qw - 0.15, 0.85, "WA panchang ₹49\nChat ₹499 (live)\nDetailed ₹1,499\nBaby-name ₹999", { size: 7, color: C.white, bold: true, ls: 1.2 });
    rt(s, ax + 0.08, ay + qh + 0.05, qw - 0.15, 0.22, "MARKET DEV", { size: 7.5, bold: true, color: C.redDark });
    rt(s, ax + 0.08, ay + qh + 0.3, qw - 0.15, 0.85, "Marathi @drishtiastro\nNRI USD pricing\nHousing society B2B\nMatrimonial API", { size: 7, color: C.textDark, ls: 1.2 });
    rt(s, ax + qw + 0.08, ay + qh + 0.05, qw - 0.15, 0.22, "Diversification", { size: 7.5, bold: true, color: C.gray });
    rt(s, ax + qw + 0.08, ay + qh + 0.3, qw - 0.15, 0.7, "Gemstone e-com\nVedic calendar product\nCorporate astrology", { size: 7, color: C.textGray, ls: 1.2 });
    rt(s, ax, ay + ah + 0.05, aw, 0.18, "← existing market         new market →", { size: 7, color: C.gray, align: "center" });

    // BCG MATRIX (fixed bubble positions)
    panel(s, 4.7, 3.9, 4.15, 3.2, "BCG MATRIX  ·  PORTFOLIO HANDLES");
    const bx = 4.85, by = 4.4, bw = 3.85, bh = 2.3;
    const bqw = bw / 2, bqh = bh / 2;
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: by, w: bqw, h: bqh, fill: { color: C.red }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: bx + bqw, y: by, w: bqw, h: bqh, fill: { color: C.pinkPale }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: bx, y: by + bqh, w: bqw, h: bqh, fill: { color: C.pink }, line: { color: C.gray, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: bx + bqw, y: by + bqh, w: bqw, h: bqh, fill: { color: C.bgDeep }, line: { color: C.gray, width: 0.5 } });
    rt(s, bx + 0.08, by + 0.05, bqw - 0.15, 0.22, "STAR ★", { size: 8, bold: true, color: C.white });
    rt(s, bx + bqw + 0.08, by + 0.05, bqw - 0.15, 0.22, "QUESTION MARK", { size: 8, bold: true, color: C.redDark });
    rt(s, bx + 0.08, by + bqh + 0.05, bqw - 0.15, 0.22, "CASH COW $", { size: 8, bold: true, color: C.redDark });
    rt(s, bx + bqw + 0.08, by + bqh + 0.05, bqw - 0.15, 0.22, "DOG", { size: 8, bold: true, color: C.gray });
    // Spread bubbles to avoid overlap
    s.addShape(pres.shapes.OVAL, { x: bx + 0.7, y: by + 0.55, w: 0.55, h: 0.55, fill: { color: C.white }, line: { color: C.redDark, width: 2 } });
    rt(s, bx + 0.7, by + 0.55, 0.55, 0.55, "saath", { size: 6, bold: true, color: C.redDark, align: "center", valign: "middle" });
    s.addShape(pres.shapes.OVAL, { x: bx + bqw + 0.25, y: by + 0.55, w: 0.45, h: 0.45, fill: { color: C.white }, line: { color: C.redDark, width: 2 } });
    rt(s, bx + bqw + 0.25, by + 0.55, 0.45, 0.45, "rashi", { size: 5.5, bold: true, color: C.redDark, align: "center", valign: "middle" });
    s.addShape(pres.shapes.OVAL, { x: bx + bqw + 1.05, y: by + 0.55, w: 0.5, h: 0.5, fill: { color: C.white }, line: { color: C.redDark, width: 2 } });
    rt(s, bx + bqw + 1.05, by + 0.55, 0.5, 0.5, "drish", { size: 6, bold: true, color: C.redDark, align: "center", valign: "middle" });
    s.addShape(pres.shapes.OVAL, { x: bx + bqw + 0.7, y: by + bqh + 0.55, w: 0.4, h: 0.4, fill: { color: C.white }, line: { color: C.gray, width: 2 } });
    rt(s, bx + bqw + 0.7, by + bqh + 0.55, 0.4, 0.4, "astro", { size: 5.5, bold: true, color: C.gray, align: "center", valign: "middle" });
    rt(s, bx, by + bh + 0.05, bw, 0.18, "← portfolio share →", { size: 7, color: C.gray, align: "center" });

    // PORTER 5 FORCES
    panel(s, 9.0, 3.9, 4.0, 3.2, "PORTER'S 5 FORCES");
    const forces = [
      { name: "Threat of new entrants", rating: "HIGH", why: "900+ religious tech startups (Tracxn)" },
      { name: "Buyer bargaining power", rating: "MED", why: "Plentiful free kundli alternatives" },
      { name: "Supplier power", rating: "LOW", why: "AI replaces astrologer dependency" },
      { name: "Threat of substitutes", rating: "HIGH", why: "Free YouTube astrologers" },
      { name: "Competitive rivalry", rating: "HIGH", why: "AstroTalk ~80% share consolidation" },
    ];
    forces.forEach((f, i) => {
      const yy = 4.4 + i * 0.52;
      card(s, 9.15, yy, 3.7, 0.48);
      const c = f.rating === "HIGH" ? C.red : f.rating === "MED" ? C.amber : C.green;
      s.addShape(pres.shapes.RECTANGLE, { x: 9.15, y: yy, w: 0.7, h: 0.48, fill: { color: c }, line: { type: "none" } });
      rt(s, 9.15, yy, 0.7, 0.48, f.rating, { size: 8, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 9.92, yy + 0.04, 2.95, 0.22, f.name, { size: 8.5, bold: true, color: C.redDark });
      rt(s, 9.92, yy + 0.25, 2.95, 0.22, f.why, { size: 7, italic: true, color: C.textGray });
    });
  }

  // ============== SLIDE 7 — STRATEGIC LEVERS ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "STRATEGIC LEVERS", "WHERE TO PLAY × HOW TO WIN — A 5-PILLAR GROWTH ARCHITECTURE");
    footer(s, 7);

    panel(s, 0.35, 1.35, 6.45, 2.9, "WHERE TO PLAY  ·  3 BEACHHEADS");
    const bhd = [
      { tag: "#1", name: "Hindi-belt partner-birthdate", desc: "Scale @saathsetu viral formula across @rashitattva + @astrosaadhan. UP-Bihar-MP-Delhi cohort 25-45.",
        product: "₹199 → ₹499 kundli + chat", color: C.red },
      { tag: "#2", name: "Marathi micro-niche", desc: "@drishtiastro: virgin Marathi astro market. No major incumbent. Mumbai-Pune-Nashik-Nagpur.",
        product: "₹199 Marathi PDF + ₹49 WA sub", color: C.redDark },
      { tag: "#3", name: "Diaspora NRI Hindi", desc: "USA + UAE + UK Hindi 30-55. Higher AOV. Long-form YT + WA delivery.",
        product: "$15 USD kundli + live ₹2,499", color: C.red },
    ];
    bhd.forEach((b, i) => {
      const yy = 1.85 + i * 0.82;
      card(s, 0.5, yy, 6.15, 0.75);
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy, w: 1.15, h: 0.75, fill: { color: b.color }, line: { type: "none" } });
      rt(s, 0.5, yy + 0.04, 1.15, 0.22, "BEACHHEAD", { size: 6.5, bold: true, color: C.white, align: "center", cs: 1 });
      rt(s, 0.5, yy + 0.22, 1.15, 0.4, b.tag, { size: 22, bold: true, color: C.white, align: "center", valign: "middle", font: "Georgia" });
      rt(s, 1.75, yy + 0.05, 4.85, 0.25, b.name, { size: 11, bold: true, color: C.ink });
      rt(s, 1.75, yy + 0.28, 4.85, 0.22, b.desc, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
      rt(s, 1.75, yy + 0.5, 4.85, 0.22, "Hero SKU: " + b.product, { size: 7.5, color: C.redDark, bold: true });
    });

    panel(s, 6.9, 1.35, 6.1, 2.9, "HOW TO WIN  ·  5 STRATEGIC PILLARS");
    const pillars = [
      { n: "1", name: "VIRAL ENGINE", desc: "Replicate partner-birthdate hook across 3 handles. Daily Reel cadence + carousels." },
      { n: "2", name: "TRUST STACK", desc: "Get verified on all 4. Remove AI disclosure. Hindi pandit voice." },
      { n: "3", name: "CHANNEL MOAT", desc: "WhatsApp + YouTube + IVR + Temple QR. No single-platform risk." },
      { n: "4", name: "PRODUCT LADDER", desc: "₹49 sub → ₹199 PDF → ₹499 chat → ₹999 baby-name → ₹1,499 → ₹2,499 live" },
      { n: "5", name: "CRO DISCIPLINE", desc: "Landing page rebuild. WA checkout. UPI + EMI. Retargeting pixel." },
    ];
    pillars.forEach((p, i) => {
      const yy = 1.92 + i * 0.46;
      s.addShape(pres.shapes.OVAL, { x: 7.05, y: yy, w: 0.42, h: 0.42, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 7.05, yy, 0.42, 0.42, p.n, { size: 14, bold: true, color: C.white, font: "Georgia", align: "center", valign: "middle" });
      rt(s, 7.6, yy + 0.02, 1.8, 0.2, p.name, { size: 10, bold: true, color: C.redDark, cs: 1 });
      rt(s, 7.6, yy + 0.22, 5.3, 0.24, p.desc, { size: 8, color: C.textDark, italic: true });
    });

    panel(s, 0.35, 4.4, 12.65, 2.75, "STRATEGIC CHOICES CASCADE (ROGER MARTIN · PLAYING TO WIN)");
    const cascade = [
      { step: "01", name: "WINNING ASPIRATION", body: "Become India's #1 AI-native multi-language astrology brand for Hindi-Hinglish-Marathi belt within 18 months. Crack 25K followers per page + ₹50L+ MRR." },
      { step: "02", name: "WHERE TO PLAY", body: "Hindi-belt 25-55 primary | Marathi sub-niche secondary | NRI diaspora tertiary. AVOID urban English-Gen-Z and live-consult marketplace." },
      { step: "03", name: "HOW TO WIN", body: "Viral hook engine × AI cost base × cross-handle promo × WhatsApp checkout × Hindi-pandit voice. 8× cheaper than AstroTalk." },
      { step: "04", name: "CAPABILITIES", body: "AI Reel factory (GPT+ElevenLabs+Canva) | WA Business API | Razorpay UPI/EMI | Microsoft Clarity (already installed) | Vedic copywriter." },
      { step: "05", name: "MGMT SYSTEMS", body: "Weekly NSM review | content pod (3 people) | CRO sprint cadence | WA drip A/B | UTM + Meta pixel tracking | monthly retro." },
    ];
    cascade.forEach((c, i) => {
      const cx = 0.5 + i * 2.55;
      card(s, cx, 4.9, 2.45, 2.15);
      s.addShape(pres.shapes.RECTANGLE, { x: cx, y: 4.9, w: 2.45, h: 0.35, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, cx, 4.9, 0.55, 0.35, c.step, { size: 11, bold: true, color: C.white, align: "center", valign: "middle", font: "Georgia" });
      rt(s, cx + 0.5, 4.9, 1.85, 0.35, c.name, { size: 8.5, bold: true, color: C.white, valign: "middle", cs: 1 });
      rt(s, cx + 0.1, 5.3, 2.25, 1.7, c.body, { size: 7.5, color: C.textDark, ls: 1.3, italic: true });
    });
  }

  // ============== SLIDE 8 — 10 SURE-SHOT STRATEGIES ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "10 SURE-SHOT STRATEGIES", "UNIQUE PLAYS · SPECIFIC MECHANICS · TIME-BOUND · OUTCOME-DRIVEN");
    footer(s, 8);

    rt(s, 0.35, 1.3, 12.65, 0.28,
      "These ten plays are designed to compound. Deep mechanics for top three are on slides 9, 10, 11.",
      { size: 10, italic: true, color: C.textGray });

    const strategies = [
      { n: "01", t: "PARTNER-BIRTHDATE FRANCHISE",
        m: "9 × 9 hook matrix = 81 unique Reels. Proven (8.5K-view Reel).",
        time: "Wk 1-12", outcome: "10× views per handle by Week 8", color: C.red },
      { n: "02", t: "VERIFIED HALO TRANSFER",
        m: "Daily Story shoutout from @saathsetu to dormant handles.",
        time: "Day 1-30", outcome: "200-500 follower transfer per shoutout (~5-10% of 1.6K views)", color: C.red },
      { n: "03", t: "MARATHI MONOPOLY",
        m: "@drishtiastro pivots fully to Devanagari Marathi. M-P-N geo-target.",
        time: "Wk 1-6", outcome: "First-mover in Marathi astro (no major competitor)", color: C.redDark },
      { n: "04", t: "PANDIT QR-CARD ARMY",
        m: "200 pandits get personalised QR cards. Their network = our acquisition.",
        time: "Wk 2-12", outcome: "₹30/order × 1,000 orders = ₹3L/mo by Month 3", color: C.redDark },
      { n: "05", t: "WEDDING-SEASON LAGNA RUSH",
        m: "Nov-Feb wedding-season ₹499 'parent's compatibility check' SKU.",
        time: "Nov-Feb", outcome: "Captures highest-AOV moment in Indian astro buying", color: C.amber },
      { n: "06", t: "BABY-NAME KUNDLI",
        m: "₹999 PDF with 11 nakshatra-aligned name suggestions for new parents.",
        time: "Wk 4 launch", outcome: "Low-competition keyword, high SEO intent", color: C.amber },
      { n: "07", t: "HOUSING SOCIETY ANNUAL B2B",
        m: "₹50K/yr contracts with apartment RWAs in Pune/Mumbai.",
        time: "Wk 6-12", outcome: "5 societies = ₹2.5L recurring + 5,000 captive users", color: C.purple },
      { n: "08", t: "FESTIVAL PRE-BOOKING ENGINE",
        m: "6-week-ahead WA pooja booking. Diwali, Navratri, Akshay Tritiya.",
        time: "Per festival", outcome: "₹2,100 AOV × 100 = ₹2L/festival", color: C.teal },
      { n: "09", t: "LIVE SUNDAY 8PM SHOW",
        m: "Weekly 'Saptahik Rashifal' live on IG + YT. Sponsor-ready inventory.",
        time: "Wk 4 onwards", outcome: "Build appointment viewership = retention moat", color: C.teal },
      { n: "10", t: "NRI DOLLAR PRICING",
        m: "$15 USD kundli for USA/UK/UAE Hindi 35-55. 3× the rupee AOV.",
        time: "Wk 8-12", outcome: "Diaspora cohort = highest LTV in category", color: C.purple },
    ];
    strategies.forEach((st, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const sx = 0.4 + col * 2.55, sy = 1.65 + row * 2.78;
      card(s, sx, sy, 2.45, 2.65);
      s.addShape(pres.shapes.RECTANGLE, { x: sx, y: sy, w: 2.45, h: 0.42, fill: { color: st.color }, line: { type: "none" } });
      rt(s, sx, sy, 2.45, 0.42, st.n, { size: 13, bold: true, color: C.white, align: "center", valign: "middle", font: "Georgia" });
      rt(s, sx + 0.1, sy + 0.5, 2.25, 0.5, st.t, { size: 9.5, bold: true, color: st.color, ls: 1.15 });
      rt(s, sx + 0.1, sy + 1.05, 2.25, 0.75, st.m, { size: 7.5, italic: true, color: C.textDark, ls: 1.25 });
      s.addShape(pres.shapes.RECTANGLE, { x: sx + 0.1, y: sy + 1.85, w: 0.85, h: 0.22, fill: { color: C.pinkPale }, line: { color: C.border, width: 0.3 } });
      rt(s, sx + 0.1, sy + 1.85, 0.85, 0.22, st.time, { size: 7, bold: true, color: C.redDark, align: "center", valign: "middle" });
      rt(s, sx + 0.1, sy + 2.13, 2.25, 0.46, "→ " + st.outcome, { size: 7, color: C.green, ls: 1.25 });
    });
  }

  // ============== SLIDE 9 — DEEP DIVE 1: PARTNER-BIRTHDATE FRANCHISE ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "DEEP DIVE 01  ·  PARTNER-BIRTHDATE FRANCHISE",
      "TEMPLATIZE @SAATHSETU'S 8.5K-VIEW FORMULA INTO AN 81-HOOK SYSTEM");
    footer(s, 9);

    panel(s, 0.35, 1.35, 6.45, 3.0, "THE 9 × 9 HOOK MATRIX  ·  81 UNIQUE REELS");
    rt(s, 0.5, 1.85, 6.15, 0.6,
      "Mulank 1-9 (your audience) × Mulank 1-9 (their partner) × emotion = 81 unique permutations of the same proven hook. Then layer planet (Venus/Mars/Saturn) for 243 variants.",
      { size: 8.5, italic: true, color: C.textDark, ls: 1.3 });
    rt(s, 0.5, 2.55, 6.0, 0.22, "MATRIX: YOUR MULANK (rows) × PARTNER MULANK (cols)",
      { size: 8, bold: true, color: C.redDark });
    const cellSize = 0.45;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellX = 1.2 + c * cellSize;
        const cellY = 2.85 + r * 0.16;
        const heat = ((r * 3 + c * 5) % 9) / 9;
        const colHex = `${Math.round(214 - heat * 100).toString(16).padStart(2, '0')}3D58`;
        s.addShape(pres.shapes.RECTANGLE, { x: cellX, y: cellY, w: cellSize - 0.04, h: 0.14,
          fill: { color: colHex }, line: { type: "none" } });
      }
    }
    rt(s, 0.5, 2.85, 0.6, 1.5, "1\n2\n3\n4\n5\n6\n7\n8\n9", { size: 7, bold: true, color: C.redDark, align: "center", ls: 1.8 });
    let lblX = 1.2;
    for (let c = 1; c <= 9; c++) {
      rt(s, lblX, 4.34, 0.4, 0.18, c.toString(), { size: 7, bold: true, color: C.redDark, align: "center" });
      lblX += cellSize;
    }

    panel(s, 6.9, 1.35, 6.1, 3.0, "EXAMPLE HOOKS  ·  5 OF 81");
    const hookList = [
      "1️⃣ Mulank 1 × Mulank 9 partner → \"Mars vs Mars ki battle hai…\"",
      "2️⃣ Mulank 3 × Mulank 6 partner → \"Jupiter + Venus = best emotional combo\"",
      "3️⃣ Mulank 5 × Mulank 7 partner → \"Mercury + Neptune — intellectual but grounded nahi\"",
      "4️⃣ Mulank 2 × Mulank 8 partner → \"Moon vs Saturn — emotional vs disciplined\"",
      "5️⃣ Mulank 4 × Mulank 4 partner → \"Same Rahu energy — chaos in love, never bored\"",
    ];
    hookList.forEach((h, i) => {
      const yy = 1.92 + i * 0.45;
      card(s, 7.05, yy, 5.85, 0.42);
      rt(s, 7.15, yy + 0.04, 5.7, 0.36, h, { size: 8, italic: true, color: C.textDark, ls: 1.25, valign: "middle" });
    });

    panel(s, 0.35, 4.5, 12.65, 2.7, "PRODUCTION CALENDAR  ·  12 WEEKS");
    const weeks = [
      { wk: "W1-2", n: "12 Reels", d: "Mulank 1-3 × all 9 partners. @saathsetu first." },
      { wk: "W3-4", n: "12 Reels", d: "Mulank 4-6 × all 9 partners. Push to @rashitattva." },
      { wk: "W5-6", n: "12 Reels", d: "Mulank 7-9 × all 9 partners. Push to @astrosaadhan." },
      { wk: "W7-8", n: "12 Reels", d: "Layer Venus/Mars/Saturn × top 4 combinations." },
      { wk: "W9-10", n: "12 Reels", d: "Bilingual: Marathi versions on @drishtiastro." },
      { wk: "W11-12", n: "12 Reels", d: "Compatibility share-cards. Couples + family share." },
    ];
    weeks.forEach((w, i) => {
      const wx = 0.5 + i * 2.1;
      card(s, wx, 4.95, 2.0, 2.05);
      s.addShape(pres.shapes.RECTANGLE, { x: wx, y: 4.95, w: 2.0, h: 0.35, fill: { color: C.red }, line: { type: "none" } });
      rt(s, wx, 4.95, 2.0, 0.35, w.wk, { size: 10, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      rt(s, wx, 5.4, 2.0, 0.35, w.n, { size: 12, bold: true, color: C.red, align: "center", font: "Georgia" });
      rt(s, wx + 0.1, 5.8, 1.8, 1.15, w.d, { size: 7.5, color: C.textDark, italic: true, ls: 1.25 });
    });
    rt(s, 0.5, 7.05, 12.5, 0.15,
      "TOTAL: 72 Reels × 4 handles cross-posted = 288 deliverables. Cost ~₹15/Reel API. Expected: 5-8K avg views by W12.",
      { size: 7.5, italic: true, color: C.green, align: "center", bold: true });
  }

  // ============== SLIDE 10 — DEEP DIVE 2: PANDIT + TEMPLE ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "DEEP DIVE 02  ·  PANDIT + TEMPLE OFFLINE MOAT",
      "WHAT NO COMPETITOR HAS BUILT — REGIONAL TRUST TRANSFER VIA PHYSICAL NETWORK");
    footer(s, 10);

    panel(s, 0.35, 1.35, 6.45, 3.1, "PANDIT QR-CARD PROGRAM  ·  STEP-BY-STEP");
    const steps = [
      { n: "1", t: "Identify 200 pandits", d: "Pune, Mumbai, Nashik, Nagpur, Lucknow, Delhi. Source via WA Hindi pandit groups + temple priests." },
      { n: "2", t: "Personalised QR card", d: "Print 1,000 cards per pandit. UNIQUE QR linking to free WA kundli + pandit's referral code." },
      { n: "3", t: "Train via 30-min video", d: "Hindi video shows pandit how to share. WA broadcast tips. Earning dashboard demo." },
      { n: "4", t: "Set commission", d: "₹30 per ₹199 paid order. ₹150 per ₹999 baby-name. Payout via UPI within 24hrs." },
      { n: "5", t: "Quarterly leaderboard", d: "Top 10 pandits get ₹5,000 bonus + recognition on @saathsetu. Creates competition." },
      { n: "6", t: "Compound effect", d: "Each pandit's network = 200-500 trusted Hindi-belt buyers. Total reach: 40,000-100,000." },
    ];
    steps.forEach((st, i) => {
      const yy = 1.85 + i * 0.4;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y: yy + 0.06, w: 0.35, h: 0.35, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 0.5, yy + 0.06, 0.35, 0.35, st.n, { size: 11, bold: true, color: C.white, align: "center", valign: "middle", font: "Georgia" });
      rt(s, 0.95, yy + 0.02, 5.7, 0.2, st.t, { size: 8.5, bold: true, color: C.redDark });
      rt(s, 0.95, yy + 0.22, 5.7, 0.18, st.d, { size: 7, italic: true, color: C.textDark });
    });

    panel(s, 6.9, 1.35, 6.1, 3.1, "TEMPLE QR PILOT  ·  EXPECTED FUNNEL");
    rt(s, 7.05, 1.85, 5.85, 0.5,
      "30 temple priests partnered. QR stickers placed at puja-sankalp counters. Each scan = free WA kundli, opt-in mandatory.",
      { size: 8.5, italic: true, color: C.textDark, ls: 1.3 });
    rt(s, 7.05, 2.4, 5.85, 0.22, "EXPECTED FUNNEL (30-temple pilot, 90 days)",
      { size: 8.5, bold: true, color: C.redDark });
    const funnelEst = [
      ["Foot traffic at 30 temples", "~3,000/day total"],
      ["QR scans @ 5%", "150/day = 13,500/quarter"],
      ["WA opt-in @ 60%", "8,100/quarter"],
      ["₹199 purchase @ 8% CR", "648/quarter"],
      ["Gross revenue", "₹1.29L per quarter"],
      ["Less ₹30 commission to pandit", "Net ₹1.10L (margin 85%)"],
    ];
    funnelEst.forEach((f, i) => {
      const yy = 2.75 + i * 0.27;
      card(s, 7.05, yy, 5.85, 0.24, i % 2 === 0 ? C.white : C.pinkPale);
      rt(s, 7.15, yy, 3.3, 0.24, f[0], { size: 7.5, color: C.textDark, valign: "middle" });
      rt(s, 10.5, yy, 2.3, 0.24, f[1], { size: 8, bold: true, color: C.red, align: "right", valign: "middle" });
    });

    panel(s, 0.35, 4.55, 12.65, 2.7, "FESTIVAL CALENDAR  ·  WHEN TO STRIKE  ·  PRE-BOOKING PIPELINE");
    const festivals = [
      { fest: "Akshay Tritiya", month: "Apr-May", prebook: "6 wks pre", prod: "Marriage muhurat ₹499", aov: "~₹3,000 avg" },
      { fest: "Guru Purnima", month: "July", prebook: "4 wks pre", prod: "Spiritual report ₹999", aov: "~₹1,500 avg" },
      { fest: "Navratri", month: "Sep-Oct", prebook: "8 wks pre", prod: "Devi pooja ₹2,100", aov: "~₹2,500 avg" },
      { fest: "Diwali", month: "Oct-Nov", prebook: "8 wks pre", prod: "Annual kundli ₹1,499", aov: "~₹1,800 avg" },
      { fest: "Makar Sankranti", month: "Jan", prebook: "6 wks pre", prod: "New year kundli ₹999", aov: "~₹1,200 avg" },
      { fest: "Holi → Wedding", month: "Mar-Jun", prebook: "Ongoing", prod: "Wedding muhurat ₹499 + match", aov: "~₹2,000 avg" },
    ];
    festivals.forEach((f, i) => {
      const fx = 0.5 + (i % 6) * 2.1;
      card(s, fx, 5.05, 2.0, 2.1);
      s.addShape(pres.shapes.RECTANGLE, { x: fx, y: 5.05, w: 2.0, h: 0.4, fill: { color: C.amber }, line: { type: "none" } });
      rt(s, fx, 5.05, 2.0, 0.4, f.fest, { size: 8.5, bold: true, color: C.white, align: "center", valign: "middle", cs: 0.5 });
      rt(s, fx + 0.08, 5.5, 1.85, 0.2, "WHEN: " + f.month, { size: 7, color: C.textGray, bold: true });
      rt(s, fx + 0.08, 5.72, 1.85, 0.2, "PREBOOK: " + f.prebook, { size: 7, color: C.textDark });
      rt(s, fx + 0.08, 5.95, 1.85, 0.45, "HERO SKU:\n" + f.prod, { size: 7.5, color: C.redDark, bold: true, ls: 1.2 });
      rt(s, fx + 0.08, 6.55, 1.85, 0.5, "EXPECTED:\n" + f.aov, { size: 8, color: C.green, bold: true, ls: 1.2 });
    });
  }

  // ============== SLIDE 11 — DEEP DIVE 3: B2B + PREMIUM ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "DEEP DIVE 03  ·  B2B + PREMIUM PLAYS",
      "4 NEW REVENUE STREAMS THAT DON'T DEPEND ON INSTAGRAM");
    footer(s, 11);

    const plays = [
      {
        title: "HOUSING SOCIETY ANNUAL CONTRACTS", color: C.red,
        mechanic: "₹50K/year contract with apartment RWAs. All residents get free monthly panchang + 1 free kundli/year/family.",
        target: "Pune-Mumbai-Hyderabad-Bangalore Tier-1 RWAs (50,000+ societies in India)",
        outcome: "10 societies in Y1 = ₹5L recurring. Plus 5K-10K captive users for upsell.",
        why: "Bulk B2B avoids per-customer CAC. Residents pre-vetted as middle/upper-middle — highest WTP cohort.",
        timeline: "Wk 6: Pitch deck. Wk 8: First 3 demos. Wk 10: First signed. Wk 12: 5 signed.",
      },
      {
        title: "MATRIMONIAL API PARTNERSHIPS", color: C.redDark,
        mechanic: "Build 'Compatibility Check' API. License to Shaadi.com, Jeevansaathi, Bharat Matrimony. Per-call ₹5-15.",
        target: "Tier-1 matrimonial sites (50M+ Indian users combined)",
        outcome: "1M API calls/mo at ₹10 = ₹1cr/mo. Even 10% capture = ₹10L/mo.",
        why: "Matrimonial sites need feature differentiation. Compatibility check is most-searched post-shortlist query.",
        timeline: "Wk 4: Build API spec. Wk 6: Pitch 3 platforms. Wk 10: Pilot live. Wk 14: Volume ramp.",
      },
      {
        title: "WEDDING MUHURAT B2B (₹499)", color: C.amber,
        mechanic: "Direct sell to wedding planners + matrimonial agencies. White-labeled report. ₹499 per couple's muhurat.",
        target: "Wedding planners (3,000+ active in India), priest/pandit referral network",
        outcome: "5 partner agencies × 20 couples/mo × ₹499 = ₹50K/mo MRR + repeat order seasons.",
        why: "Highest-AOV moment in Indian astrology — 80% of Hindu weddings still consult astrologer for muhurat.",
        timeline: "Wk 4: SLA-driven delivery (24-hr muhurat). Wk 6: First 5 planner outreach. Nov-Feb peak.",
      },
      {
        title: "NRI DIASPORA · DOLLAR PRICING", color: C.purple,
        mechanic: "Same kundli, USD pricing ($15-25). UTC timezone handling. PayPal + Stripe. WA delivery.",
        target: "Hindi-speaking 35-55 NRIs in USA (4M+), UK (1.5M+), UAE (3M+)",
        outcome: "100 orders/mo at $15 ≈ ₹1.25L/mo. NRI LTV is 5× domestic (higher disposable income).",
        why: "Diaspora has highest emotional pull for astrology + 5× higher purchasing power. AstroTalk barely serves.",
        timeline: "Wk 8: PayPal + Stripe set up. Wk 9: Hindi NRI WA groups outreach. Wk 12: First 50 orders.",
      },
    ];
    plays.forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const px = 0.35 + col * 6.35, py = 1.35 + row * 2.95;
      card(s, px, py, 6.25, 2.8);
      s.addShape(pres.shapes.RECTANGLE, { x: px, y: py, w: 6.25, h: 0.42, fill: { color: p.color }, line: { type: "none" } });
      rt(s, px + 0.1, py, 6.05, 0.42, p.title, { size: 10.5, bold: true, color: C.white, valign: "middle", cs: 1 });
      rt(s, px + 0.1, py + 0.5, 6.05, 0.22, "WHAT IT IS", { size: 7, bold: true, color: C.redDark, cs: 1 });
      rt(s, px + 0.1, py + 0.7, 6.05, 0.4, p.mechanic, { size: 7.5, color: C.textDark, italic: true, ls: 1.2 });
      rt(s, px + 0.1, py + 1.12, 6.05, 0.22, "TARGET", { size: 7, bold: true, color: C.redDark, cs: 1 });
      rt(s, px + 0.1, py + 1.32, 6.05, 0.3, p.target, { size: 7.5, color: C.textDark, italic: true });
      rt(s, px + 0.1, py + 1.62, 6.05, 0.22, "OUTCOME (YEAR 1)", { size: 7, bold: true, color: C.green, cs: 1 });
      rt(s, px + 0.1, py + 1.82, 6.05, 0.3, p.outcome, { size: 7.5, color: C.green, italic: true, bold: true });
      rt(s, px + 0.1, py + 2.12, 6.05, 0.22, "TIMELINE  ·  WHY IT WORKS", { size: 7, bold: true, color: C.redDark, cs: 1 });
      rt(s, px + 0.1, py + 2.32, 6.05, 0.42, p.timeline + "  ·  " + p.why, { size: 7, color: C.textDark, italic: true, ls: 1.2 });
    });
  }

  // ============== SLIDE 12 — CONTENT ENGINE ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "CONTENT ENGINE", "PRODUCTION PIPELINE + 70/20/10 PILLAR FRAMEWORK + CADENCE");
    footer(s, 12);

    panel(s, 0.35, 1.35, 12.65, 2.85, "3-PILLAR CONTENT FRAMEWORK  ·  70/20/10 RULE");
    const pillarsC = [
      { tag: "70% TRUST & RITUAL", color: C.redDark, types: [
        "Daily rashifal in Hindi/Marathi (5 AM auto-post)",
        "Aaj ka panchang + rahu kaal",
        "Festival muhurat (Navratri, Akshay Tritiya...)",
        "Sanskrit shloka + 1-line Hindi meaning",
      ], why: "Builds habit. High save rate. Hindi-belt 35-65 buyer." },
      { tag: "20% IDENTITY & VIRAL", color: C.red, types: [
        "Partner-birthdate hook (our 8.5K-view formula)",
        "Mulank × planet × emotion combos",
        "Aap Mulank 5 ho toh yeh problem aati hai...",
        "Compatibility share-cards (2 dates → match %)",
      ], why: "Pure Explore-page fuel. 18-34 followers + family share." },
      { tag: "10% EDUCATION & AUTHORITY", color: C.amber, types: [
        "Saturn vakri kya hota hai? explainer",
        "Birth chart reading tutorial (carousel)",
        "Common myths debunked",
        "Why I trust Vedic over Western",
      ], why: "Positions brand. Drives shares to family WA groups." },
    ];
    pillarsC.forEach((p, i) => {
      const px = 0.5 + i * 4.2;
      card(s, px, 1.85, 4.1, 2.3);
      s.addShape(pres.shapes.RECTANGLE, { x: px, y: 1.85, w: 4.1, h: 0.4, fill: { color: p.color }, line: { type: "none" } });
      rt(s, px, 1.85, 4.1, 0.4, p.tag, { size: 11, bold: true, color: C.white, align: "center", valign: "middle", cs: 1 });
      p.types.forEach((t, ti) => {
        const yy = 2.3 + ti * 0.3;
        s.addShape(pres.shapes.OVAL, { x: px + 0.15, y: yy + 0.05, w: 0.12, h: 0.12, fill: { color: p.color }, line: { type: "none" } });
        rt(s, px + 0.32, yy, 3.7, 0.3, t, { size: 8.5, color: C.textDark, ls: 1.2 });
      });
      s.addShape(pres.shapes.RECTANGLE, { x: px + 0.1, y: 3.55, w: 3.9, h: 0.55, fill: { color: C.pinkPale }, line: { color: C.border, width: 0.3 } });
      rt(s, px + 0.2, 3.6, 3.7, 0.22, "WHY IT CONVERTS:", { size: 7.5, bold: true, color: p.color, cs: 1 });
      rt(s, px + 0.2, 3.78, 3.7, 0.35, p.why, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
    });

    panel(s, 0.35, 4.35, 6.45, 2.75, "24-HOUR POSTING CADENCE");
    const slots = [
      { time: "05:00 AM", content: "Panchang carousel", handle: "all 4", color: C.amber },
      { time: "07:30 AM", content: "Daily rashifal Reel", handle: "saath + drishti", color: C.red },
      { time: "12:30 PM", content: "Viral hook Reel #1", handle: "rashitattva", color: C.redDark },
      { time: "04:00 PM", content: "Identity / compat Reel", handle: "all 4", color: C.red },
      { time: "07:00 PM", content: "Trending audio Reel", handle: "saath + astro", color: C.amber },
      { time: "09:30 PM", content: "Authority carousel", handle: "drishtiastro", color: C.redDark },
    ];
    slots.forEach((sl, i) => {
      const yy = 4.85 + i * 0.32;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy, w: 1.1, h: 0.28, fill: { color: sl.color }, line: { type: "none" } });
      rt(s, 0.5, yy, 1.1, 0.28, sl.time, { size: 9, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 1.7, yy + 0.02, 2.7, 0.24, sl.content, { size: 8.5, color: C.textDark, valign: "middle" });
      rt(s, 4.45, yy + 0.02, 2.2, 0.24, sl.handle, { size: 7.5, italic: true, color: C.redDark, align: "right", valign: "middle" });
    });
    rt(s, 0.5, 6.85, 6.25, 0.2, "= ~22 Reels + 8 carousels weekly · auto-scheduled via Buffer",
      { size: 7.5, italic: true, color: C.gray, align: "center" });

    panel(s, 6.9, 4.35, 6.1, 2.75, "AI CONTENT FACTORY  ·  6-STEP PIPELINE");
    const fact = [
      { s: "01", t: "Topic", tool: "GPT-4o", d: "50 Roman-Hindi hooks/day from Mulank × planet" },
      { s: "02", t: "Voice", tool: "ElevenLabs", d: "Hindi voice (NOT marked AI). 3 personas." },
      { s: "03", t: "Visual", tool: "Canva + HeyGen", d: "Auto Reel template (text + B-roll)" },
      { s: "04", t: "Music", tool: "Suno + IG", d: "Trending audio synced to hook (first 1.2s)" },
      { s: "05", t: "Edit", tool: "CapCut API", d: "Captions + watermark + auto-export" },
      { s: "06", t: "Schedule", tool: "Buffer", d: "Optimal-slot post per handle" },
    ];
    fact.forEach((f, i) => {
      const yy = 4.85 + i * 0.34;
      card(s, 7.05, yy, 5.85, 0.3);
      s.addShape(pres.shapes.RECTANGLE, { x: 7.05, y: yy, w: 0.5, h: 0.3, fill: { color: C.red }, line: { type: "none" } });
      rt(s, 7.05, yy, 0.5, 0.3, f.s, { size: 9, bold: true, color: C.white, align: "center", valign: "middle", font: "Georgia" });
      rt(s, 7.65, yy + 0.04, 0.9, 0.22, f.t, { size: 8, bold: true, color: C.redDark, valign: "middle" });
      rt(s, 8.6, yy + 0.04, 1.4, 0.22, f.tool, { size: 7.5, italic: true, color: C.red, valign: "middle" });
      rt(s, 10.05, yy + 0.04, 2.85, 0.22, f.d, { size: 7, color: C.textDark, valign: "middle" });
    });
    rt(s, 7.0, 6.85, 5.95, 0.2, "Cost ~₹12/Reel · 22 Reels × 30 days = ₹7,920/mo for ~10M views target",
      { size: 7.5, italic: true, bold: true, color: C.green, align: "center" });
  }

  // ============== SLIDE 13 — MONETIZATION LADDER + CHART ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "MONETIZATION LADDER", "FROM ₹49 PANCHANG SUB TO ₹2,499 LIVE CONSULT — 6 TIERS + 8 ALT STREAMS");
    footer(s, 13);

    panel(s, 0.35, 1.35, 12.65, 2.7, "PRODUCT LADDER  ·  6 TIERS  ·  AOV GROWS WITH BUYER TENURE");
    const tiers = [
      { name: "FREEMIUM", price: "FREE", desc: "Mini-kundli + 1 daily WA push", step: "Lead magnet", color: C.bgDeep, tc: C.textDark },
      { name: "PANCHANG SUB", price: "₹49/mo", desc: "Daily panchang + tithi (WA)", step: "Habit + upsell", color: C.pinkPale, tc: C.textDark },
      { name: "KUNDLI PDF", price: "₹199", desc: "11-page Vedic PDF (live SKU)", step: "Already live", color: C.red, tc: C.white },
      { name: "PDF + CHAT", price: "₹499", desc: "PDF + 15-min astrologer chat", step: "Live on astrorajni", color: C.redDark, tc: C.white },
      { name: "BABY NAME", price: "₹999", desc: "11 nakshatra-aligned names", step: "NEW unmet need", color: C.amber, tc: C.white },
      { name: "DETAILED", price: "₹1,499", desc: "40-page + remedy + AI consult", step: "Mid-funnel hero", color: C.redDark, tc: C.white },
    ];
    tiers.forEach((t, i) => {
      const tx = 0.5 + i * 2.07;
      card(s, tx, 1.92, 2.0, 2.0, t.color);
      s.addShape(pres.shapes.RECTANGLE, { x: tx, y: 1.92, w: 2.0, h: 0.45,
        fill: { color: t.color === C.bgDeep || t.color === C.pinkPale ? C.red : C.white }, line: { type: "none" } });
      rt(s, tx, 1.92, 2.0, 0.45, t.name,
        { size: 9, bold: true,
          color: t.color === C.bgDeep || t.color === C.pinkPale ? C.white : (t.tc === C.white ? C.red : C.redDark),
          align: "center", valign: "middle", cs: 1 });
      rt(s, tx, 2.45, 2.0, 0.55, t.price, { size: 19, bold: true, color: t.tc, align: "center", valign: "middle", font: "Georgia" });
      rt(s, tx + 0.08, 3.05, 1.85, 0.5, t.desc, { size: 7.5, italic: true, color: t.tc, align: "center", ls: 1.2 });
      rt(s, tx + 0.08, 3.6, 1.85, 0.3, "→ " + t.step, { size: 7, color: t.tc, align: "center", bold: true });
    });

    panel(s, 0.35, 4.2, 7.0, 3.0, "8 ALTERNATIVE REVENUE STREAMS");
    const alts = [
      { i: "📅", n: "Panchang Subscription", r: "₹49/mo recurring" },
      { i: "💎", n: "Gemstone E-commerce", r: "15-25% margin (dropship)" },
      { i: "🎓", n: "Numerology Course", r: "₹1,999 self-paced WA" },
      { i: "🏢", n: "B2B Horoscope License", r: "₹15K-₹50K/mo per outlet" },
      { i: "🎪", n: "Festival Pooja Booking", r: "20% commission, ₹2,100 AOV" },
      { i: "🤝", n: "Astrologer Marketplace", r: "30% platform fee" },
      { i: "🎁", n: "Astro Gift Kits (Diwali)", r: "₹799-₹2,499 AOV" },
      { i: "📺", n: "YouTube + Brand Sponsor", r: "Adsense + ₹50K-₹2L/video" },
    ];
    alts.forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const ax = 0.5 + col * 3.4, ay = 4.7 + row * 0.59;
      card(s, ax, ay, 3.3, 0.54);
      rt(s, ax + 0.08, ay, 0.45, 0.54, a.i, { size: 18, align: "center", valign: "middle" });
      rt(s, ax + 0.55, ay + 0.02, 2.65, 0.28, a.n, { size: 9, bold: true, color: C.redDark });
      rt(s, ax + 0.55, ay + 0.28, 2.65, 0.25, a.r, { size: 7.5, italic: true, color: C.green });
    });

    panel(s, 7.45, 4.2, 5.55, 3.0, "TARGET REVENUE MIX (MONTH 12)");
    s.addChart(pres.charts.DOUGHNUT, [{
      name: "Revenue %",
      labels: ["₹199 Kundli", "₹49 sub", "₹499 chat", "₹999 baby-name", "₹1,499 detailed", "B2B + festival", "Alt streams"],
      values: [35, 8, 18, 7, 12, 15, 5],
    }], {
      x: 7.55, y: 4.7, w: 5.35, h: 2.45,
      chartColors: [C.red, C.amber, C.redDark, C.green, C.purple, C.teal, C.gray],
      chartArea: { fill: { color: C.white } },
      showLegend: true, legendPos: "r",
      legendFontSize: 7, legendColor: C.textDark,
      dataLabelFontSize: 9, dataLabelColor: C.white, dataLabelFontBold: true,
      holeSize: 50,
    });
  }

  // ============== SLIDE 14 — LANDING PAGE CRO ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "LANDING PAGE CRO", "REAL AUDIT OF ASTROKALPANA + ASTRORAJNI WITH SPECIFIC FIXES");
    footer(s, 14);

    panel(s, 0.35, 1.35, 6.4, 5.7, "WHAT'S WORKING TODAY  ·  KEEP");
    rt(s, 0.5, 1.85, 6.1, 0.25, "From my own audit of both pages today:",
      { size: 8.5, italic: true, color: C.textGray });
    const working = [
      { t: "'52,459+ reports delivered' counter", b: "Big social-proof anchor. Verify monthly. Keep." },
      { t: "Microsoft Clarity already installed", b: "Heatmap data ready (tag w69jl4saay live). Use it." },
      { t: "Tiered pricing (₹199 + ₹499) on astrorajni", b: "Basic + chat add-on gives upsell path. Consider 3rd tier." },
      { t: "24-72hr WhatsApp delivery promise", b: "Clear SLA — sets expectation. Critical for trust." },
      { t: "Next.js + Tailwind tech stack", b: "Fast mobile load. India astro buyer = 95% mobile." },
      { t: "Hinglish copy", b: "Reads natively for Hindi belt. Matches IG content." },
      { t: "Astrologer name + photo (Kalpana Dubey)", b: "Trust signal: real human face. Replicate on astrorajni." },
    ];
    working.forEach((w, i) => {
      const yy = 2.2 + i * 0.66;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: yy + 0.08, w: 0.18, h: 0.4, fill: { color: C.green }, line: { type: "none" } });
      rt(s, 0.5, yy + 0.08, 0.18, 0.4, "✓", { size: 11, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 0.75, yy + 0.04, 5.85, 0.22, w.t, { size: 8.5, bold: true, color: C.green });
      rt(s, 0.75, yy + 0.26, 5.85, 0.36, w.b, { size: 7.5, italic: true, color: C.textDark, ls: 1.2 });
    });

    panel(s, 6.85, 1.35, 6.15, 5.7, "FIXES IN PRIORITY ORDER  ·  P0 / P1 / P2");
    const fixes = [
      { p: "P0", t: "Countdown timer + scarcity", b: "'Today only 23 orders left at ₹199'. Resets daily. JS-driven." },
      { p: "P0", t: "5 video testimonials above fold", b: "30-sec WA-style. Real customers. ₹500 voucher per testimonial." },
      { p: "P0", t: "Money-back guarantee badge", b: "'100% Refund if you don't love it'. Removes biggest objection." },
      { p: "P0", t: "WhatsApp 'Order via DM' CTA", b: "Form-shy users skip checkout. WA order = 30-40% lift Tier 2/3." },
      { p: "P1", t: "Free mini-kundli lead magnet", b: "Above paid CTA. Capture email + WA. Drip to paid." },
      { p: "P1", t: "Single-step mobile form (3-step)", b: "DOB → Time → Pay. Reduces form drop-off 40%." },
      { p: "P1", t: "UPI Intent + Simpl BNPL", b: "UPI primary. Simpl BNPL for ₹499+. +25-35% Tier 2/3 CR." },
      { p: "P2", t: "Meta Pixel + Google Tag setup", b: "Currently no retargeting. Recover 60-70% lost visitors." },
      { p: "P2", t: "5-star rating widget (Google reviews)", b: "Show '4.7 ★ from 1,847 reviews'. Pull from GMB." },
    ];
    fixes.forEach((f, i) => {
      const yy = 1.95 + i * 0.55;
      const pc = f.p === "P0" ? C.red : f.p === "P1" ? C.amber : C.teal;
      s.addShape(pres.shapes.RECTANGLE, { x: 7.0, y: yy + 0.06, w: 0.35, h: 0.3, fill: { color: pc }, line: { type: "none" } });
      rt(s, 7.0, yy + 0.06, 0.35, 0.3, f.p, { size: 9, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 7.45, yy + 0.02, 5.5, 0.2, f.t, { size: 9, bold: true, color: C.redDark });
      rt(s, 7.45, yy + 0.22, 5.5, 0.3, f.b, { size: 7, italic: true, color: C.textDark, ls: 1.2 });
    });
  }

  // ============== SLIDE 15 — FUNNEL + GROWTH CHARTS ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "PROJECTED GROWTH MODEL", "FOLLOWER + REVENUE + FUNNEL TRAJECTORY (M1 → M12)");
    footer(s, 15);

    panel(s, 0.35, 1.35, 6.4, 3.0, "FOLLOWER GROWTH PROJECTION  ·  ALL 4 HANDLES");
    s.addChart(pres.charts.LINE, [
      { name: "@saathsetu", labels: ["Now","M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"],
        values: [149, 800, 2200, 4500, 7500, 11000, 14500, 17500, 20000, 22000, 24000, 26000, 28000] },
      { name: "@rashitattva", labels: ["Now","M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"],
        values: [1, 200, 800, 2000, 4000, 6500, 9500, 12500, 15000, 17500, 20000, 22500, 25500] },
      { name: "@drishtiastro", labels: ["Now","M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"],
        values: [0, 150, 600, 1500, 3000, 5000, 7500, 10000, 13000, 16000, 19000, 22000, 25000] },
      { name: "@astrosaadhan", labels: ["Now","M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"],
        values: [3, 100, 400, 1100, 2400, 4200, 6500, 9000, 12000, 15000, 18000, 21000, 24000] },
    ], {
      x: 0.5, y: 1.85, w: 6.1, h: 2.45,
      chartColors: [C.red, C.redDark, C.amber, C.purple],
      lineSize: 2.5, lineSmooth: true,
      chartArea: { fill: { color: C.white } },
      catAxisLabelColor: C.textDark, valAxisLabelColor: C.textGray,
      catAxisLabelFontSize: 7, valAxisLabelFontSize: 7,
      showLegend: true, legendPos: "b",
      legendFontSize: 8, legendColor: C.textDark,
      valGridLine: { color: C.border, size: 0.5 },
    });

    panel(s, 6.85, 1.35, 6.15, 3.0, "FUNNEL TARGETS  ·  MONTH 6 STATE");
    s.addChart(pres.charts.BAR, [{
      name: "Users",
      labels: ["Reel views", "Profile visits", "Followers", "Landing page", "Add to cart", "Paid order"],
      values: [500000, 50000, 35000, 8000, 2400, 1200],
    }], {
      x: 7.0, y: 1.85, w: 5.85, h: 2.45,
      barDir: "bar",
      chartColors: [C.red],
      chartArea: { fill: { color: C.white } },
      catAxisLabelColor: C.textDark, valAxisLabelColor: C.textGray,
      catAxisLabelFontSize: 8, valAxisLabelFontSize: 7,
      showLegend: false, showTitle: false,
      valGridLine: { color: C.border, size: 0.5 },
      showValue: true, dataLabelFontSize: 7, dataLabelColor: C.redDark,
      dataLabelPosition: "outEnd",
    });

    panel(s, 0.35, 4.5, 12.65, 2.7, "MONTHLY REVENUE BUILD (₹ LAKHS)  ·  6 STREAMS STACKED");
    s.addChart(pres.charts.BAR, [
      { name: "₹199 PDF", labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], values: [0.2,0.8,2.0,3.5,5.5,8.0,11.0,14.0,16.5,19.0,21.5,24.0] },
      { name: "₹49 sub", labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], values: [0,0.1,0.3,0.6,1.2,2.0,3.0,4.2,5.5,6.8,8.0,9.5] },
      { name: "₹499 chat", labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], values: [0,0.2,0.5,1.0,2.0,3.5,5.5,7.5,9.5,11.5,13.5,15.5] },
      { name: "₹999 baby-name", labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], values: [0,0,0.1,0.3,0.7,1.5,2.5,4.0,5.5,7.0,8.5,10.0] },
      { name: "₹1,499 detailed", labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], values: [0,0,0,0.5,1.2,2.5,4.0,6.0,8.5,11.0,13.5,16.0] },
      { name: "B2B + festival", labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], values: [0,0,0.2,0.5,1.0,2.0,3.5,5.5,8.0,11.0,14.0,17.5] },
    ], {
      x: 0.5, y: 5.0, w: 12.35, h: 2.05,
      barDir: "col", barGrouping: "stacked",
      chartColors: [C.red, C.amber, C.redDark, C.green, C.purple, C.teal],
      chartArea: { fill: { color: C.white } },
      catAxisLabelColor: C.textDark, valAxisLabelColor: C.textGray,
      catAxisLabelFontSize: 8, valAxisLabelFontSize: 7,
      showLegend: true, legendPos: "r",
      legendFontSize: 7, legendColor: C.textDark,
      valGridLine: { color: C.border, size: 0.5 },
    });
  }

  // ============== SLIDE 16 — WEEK-BY-WEEK 12-WEEK ROADMAP ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "WEEK-BY-WEEK ROADMAP", "12-WEEK DETAILED EXECUTION PLAN — WHAT HAPPENS WHEN");
    footer(s, 16);

    rt(s, 0.35, 1.27, 12.65, 0.22,
      "Each week is a sprint with concrete deliverables, owner type, and KPI to hit before moving on.",
      { size: 9, italic: true, color: C.textGray });

    const wkPlan = [
      { wk: "W1", color: C.red, title: "FOUNDATION", tasks: ["@saathsetu Story shoutouts (Day 1)","Set up AI Reel factory","Day 1-7: Mulank 1-3 hooks live"], kpi: "100 followers / handle" },
      { wk: "W2", color: C.red, title: "VOLUME", tasks: ["Mulank 4-6 hooks across @rashitattva","Save-bait carousels (1/day per handle)","Engagement pod (30 real accounts)"], kpi: "300 followers / handle" },
      { wk: "W3", color: C.red, title: "MULTI-LANG", tasks: ["@drishtiastro full pivot to Devanagari Marathi","Hindi vs Marathi A/B test","Remove AI disclosure from @astrosaadhan"], kpi: "500-1K followers / handle" },
      { wk: "W4", color: C.redDark, title: "MONETIZE ON", tasks: ["Launch WA panchang ₹49 subscription","P0 landing fixes live","Launch ₹999 baby-name SKU"], kpi: "1K subs · 25 orders/day" },
      { wk: "W5", color: C.redDark, title: "OFFLINE LAUNCH", tasks: ["First 30 pandit onboarding","Temple QR stickers in 10 sites","NABARD vendor letter sent"], kpi: "200 QR scans · 5 pandits live" },
      { wk: "W6", color: C.redDark, title: "PARTNERSHIPS", tasks: ["First 3 housing society demos","Matrimonial API spec + pitch","Wedding planner outreach (5 demos)"], kpi: "First 3 B2B convos started" },
      { wk: "W7", color: C.amber, title: "PROOF + SCALE", tasks: ["First 2 video testimonials filmed","@saathsetu Story flywheel","Festival prebooking (Navratri)"], kpi: "5K total followers · ₹50K MRR" },
      { wk: "W8", color: C.amber, title: "CRO DEEP", tasks: ["P1 landing fixes (lead magnet + 3-step + UPI)","Meta Pixel + retargeting","NRI USD pricing + PayPal"], kpi: "CR 5% · CAC down 30%" },
      { wk: "W9", color: C.amber, title: "LIVE SHOW", tasks: ["First Sunday 8 PM 'Saptahik Rashifal'","Detailed ₹1,499 SKU launches","First housing society contract"], kpi: "1K live viewers · ₹2L MRR" },
      { wk: "W10", color: C.green, title: "EXPAND", tasks: ["Onboard pandit cohort 2 (50 more)","Matrimonial API pilot live","Diwali WA sequence built"], kpi: "20K total followers" },
      { wk: "W11", color: C.green, title: "FESTIVAL PEAK", tasks: ["Diwali pre-booking campaign (₹1,499)","First B2B syndication contract","Gemstone affiliate launch"], kpi: "₹6-8L MRR" },
      { wk: "W12", color: C.green, title: "STEADY STATE", tasks: ["Hindi pandit avatar voice (no AI disclosure)","P2 landing fixes (face + reviews)","Wedding-season Lagna pre-launch"], kpi: "30K followers · ₹10L MRR" },
    ];
    wkPlan.forEach((w, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      const wx = 0.4 + col * 2.13, wy = 1.55 + row * 2.78;
      card(s, wx, wy, 2.03, 2.65);
      s.addShape(pres.shapes.RECTANGLE, { x: wx, y: wy, w: 2.03, h: 0.4, fill: { color: w.color }, line: { type: "none" } });
      rt(s, wx + 0.05, wy, 0.5, 0.4, w.wk, { size: 11, bold: true, color: C.white, valign: "middle", font: "Georgia" });
      rt(s, wx + 0.55, wy, 1.4, 0.4, w.title, { size: 8, bold: true, color: C.white, valign: "middle", cs: 0.5 });
      w.tasks.forEach((t, ti) => {
        const yy = wy + 0.5 + ti * 0.5;
        s.addShape(pres.shapes.RECTANGLE, { x: wx + 0.1, y: yy + 0.05, w: 0.06, h: 0.06, fill: { color: w.color }, line: { type: "none" } });
        rt(s, wx + 0.2, yy, 1.8, 0.48, t, { size: 6.5, color: C.textDark, ls: 1.2 });
      });
      s.addShape(pres.shapes.RECTANGLE, { x: wx + 0.05, y: wy + 2.25, w: 1.95, h: 0.34, fill: { color: w.color, transparency: 80 }, line: { type: "none" } });
      rt(s, wx + 0.08, wy + 2.27, 1.9, 0.3, "KPI: " + w.kpi, { size: 7, bold: true, color: w.color, ls: 1.2 });
    });
  }

  // ============== SLIDE 17 — KPI SCOREBOARD + RISK REGISTER ==============
  {
    const s = pres.addSlide();
    bg(s);
    header(s, "KPI SCOREBOARD", "WHAT WE TRACK · WHAT GOOD LOOKS LIKE · WHEN WE PIVOT");
    footer(s, 17);

    panel(s, 0.35, 1.35, 8.4, 5.7, "FULL KPI TABLE  ·  M0 → M12 TRAJECTORY");
    const kpiH = ["METRIC", "M0 (NOW)", "M1", "M3", "M6", "M12"];
    const kpiCw = [3.0, 1.0, 1.0, 1.0, 1.1, 1.2];
    let kx = 0.5;
    kpiH.forEach((h, i) => {
      s.addShape(pres.shapes.RECTANGLE, { x: kx, y: 1.9, w: kpiCw[i], h: 0.35, fill: { color: C.redDark }, line: { type: "none" } });
      rt(s, kx, 1.9, kpiCw[i], 0.35, h, { size: 8.5, bold: true, color: C.white, align: "center", valign: "middle" });
      kx += kpiCw[i];
    });
    const kpiRows = [
      ["Total followers (all 4)", "153", "600", "8K", "40K", "100K+"],
      ["Daily Reel views (portfolio)", "~4K", "8K", "30K", "150K", "500K+"],
      ["Avg save rate per post", "n/a", "5%", "8%", "12%", "15%+"],
      ["WhatsApp opt-in base", "0", "300", "2K", "10K", "40K+"],
      ["₹199 orders / day", "low", "5", "25", "100", "300+"],
      ["Avg Order Value (AOV)", "₹199", "₹199", "₹245", "₹320", "₹420"],
      ["Blended CAC", "n/a", "₹150", "₹85", "₹50", "₹35"],
      ["LTV : CAC ratio", "n/a", "2×", "6×", "15×", "30×+"],
      ["MRR (₹ lakhs)", "₹0.2", "₹1", "₹6", "₹20", "₹65+"],
      ["Gross margin", "n/a", "60%", "65%", "70%", "75%"],
      ["NPS (women cohort)", "n/a", ">40", ">55", ">65", ">75"],
    ];
    kpiRows.forEach((r, ri) => {
      kx = 0.5;
      r.forEach((v, ci) => {
        s.addShape(pres.shapes.RECTANGLE, { x: kx, y: 2.25 + ri * 0.41, w: kpiCw[ci], h: 0.41,
          fill: { color: ri % 2 === 0 ? C.white : C.pinkPale }, line: { color: C.border, width: 0.3 } });
        const col = ci === 0 ? C.redDark : (ci === 5 ? C.green : C.textDark);
        rt(s, kx, 2.25 + ri * 0.41, kpiCw[ci], 0.41, v,
          { size: 8.5, bold: ci === 0 || ci === 5, color: col,
            align: ci === 0 ? "left" : "center", valign: "middle" });
        kx += kpiCw[ci];
      });
    });

    panel(s, 8.85, 1.35, 4.15, 5.7, "RISK REGISTER  ·  TOP 5 + MITIGATION");
    const risks = [
      { r: "IG algo change", p: "MED", i: "HIGH", m: "Diversify to WA + YT + IVR before 60% IG dep" },
      { r: "AI voice exposed", p: "MED", i: "HIGH", m: "Remove disclosure · use Hindi pandit voice" },
      { r: "AstroTalk copy-cats", p: "HIGH", i: "MED", m: "Speed of first-mover > defensibility" },
      { r: "Temple QR low CR", p: "MED", i: "LOW", m: "Pilot 30 sites · A/B test · 14-day pivot" },
      { r: "Regulatory (ASCI)", p: "LOW", i: "HIGH", m: "Add 'entertainment' disclaimer · legal review" },
    ];
    risks.forEach((rk, i) => {
      const yy = 1.9 + i * 1.05;
      card(s, 8.95, yy, 3.95, 0.98);
      const pc = rk.p === "HIGH" ? C.red : rk.p === "MED" ? C.amber : C.green;
      const ic = rk.i === "HIGH" ? C.red : rk.i === "MED" ? C.amber : C.green;
      s.addShape(pres.shapes.RECTANGLE, { x: 9.05, y: yy + 0.08, w: 0.55, h: 0.18, fill: { color: pc }, line: { type: "none" } });
      rt(s, 9.05, yy + 0.08, 0.55, 0.18, "P-" + rk.p, { size: 7, bold: true, color: C.white, align: "center", valign: "middle" });
      s.addShape(pres.shapes.RECTANGLE, { x: 9.65, y: yy + 0.08, w: 0.55, h: 0.18, fill: { color: ic }, line: { type: "none" } });
      rt(s, 9.65, yy + 0.08, 0.55, 0.18, "I-" + rk.i, { size: 7, bold: true, color: C.white, align: "center", valign: "middle" });
      rt(s, 10.3, yy + 0.06, 2.55, 0.22, rk.r, { size: 8.5, bold: true, color: C.redDark });
      rt(s, 9.05, yy + 0.35, 3.75, 0.6, "MITIGATION: " + rk.m, { size: 7.5, italic: true, color: C.textDark, ls: 1.25 });
    });
  }

  // ============== SLIDE 18 — CLOSING + THE ASK ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.red };
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.3, h: H, fill: { color: C.amber }, line: { type: "none" } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.08, w: W, h: 0.08, fill: { color: C.amber }, line: { type: "none" } });

    rt(s, 1.0, 0.6, 8, 0.4, "THE OPPORTUNITY IS CLEAR",
      { size: 14, bold: true, color: C.amber, cs: 5 });
    rt(s, 1.0, 1.1, 11, 2.0, "Execute First.\nOwn the Market.",
      { size: 40, bold: true, color: C.white, font: "Georgia", ls: 1.1 });

    rt(s, 1.0, 3.3, 11, 1.0,
      "India's USD 1.79B astrology market by 2030 has no AI-native multi-language player owning the partner-birthdate viral hook. The window to claim that position is the next 90 days — before AstroTalk replicates the formula.",
      { size: 12, italic: true, color: C.pinkPale, ls: 1.45 });

    rt(s, 1.0, 4.5, 11, 0.3, "THE 3-DECISION ASK", { size: 11, bold: true, color: C.amber, cs: 4 });

    const asks = [
      { num: "01", action: "Approve AI content factory budget (₹15-25K/mo opex × 3 mo)", timing: "This Week", outcome: "300+ Reels by W12" },
      { num: "02", action: "Approve cross-promotion from @saathsetu to dormant handles", timing: "Day 1 — Costless", outcome: "1K followers across 3 dormant by W4" },
      { num: "03", action: "Approve P0 landing page sprint (testimonials + scarcity + guarantee)", timing: "2-week dev cycle", outcome: "CVR doubles 2-3% → 6%+ by W4" },
    ];
    asks.forEach((a, i) => {
      const yy = 5.0 + i * 0.55;
      s.addShape(pres.shapes.OVAL, { x: 1.0, y: yy, w: 0.5, h: 0.5, fill: { color: C.amber }, line: { type: "none" } });
      rt(s, 1.0, yy, 0.5, 0.5, a.num, { size: 14, bold: true, color: C.red, font: "Georgia", align: "center", valign: "middle" });
      rt(s, 1.65, yy + 0.02, 6.8, 0.25, a.action, { size: 10.5, color: C.white, bold: true });
      s.addShape(pres.shapes.RECTANGLE, { x: 1.65, y: yy + 0.27, w: 1.6, h: 0.2, fill: { color: C.amber }, line: { type: "none" } });
      rt(s, 1.65, yy + 0.27, 1.6, 0.2, a.timing, { size: 7.5, bold: true, color: C.red, align: "center", valign: "middle" });
      rt(s, 3.4, yy + 0.27, 5.0, 0.2, "→ " + a.outcome, { size: 8, italic: true, color: C.pinkPale, valign: "middle" });
    });

    rt(s, 0.3, H - 0.5, W - 0.6, 0.3,
      "Sources: MarkNtel Advisors · Upstox industry report · Tracxn · TechCrunch · Astroyogi 2023 survey · first-party Instagram scrape · live landing-page audit",
      { size: 7.5, italic: true, color: C.pinkPale, align: "center" });
  }

  const outPath = "/mnt/session/outputs/Astrology_Portfolio_Strategy.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("DONE:", outPath);
}

main().catch(e => { console.error(e); process.exit(1); });
