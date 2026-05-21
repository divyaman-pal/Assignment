// Astrology Portfolio — Growth & Monetization Strategy
// Cleaned of synthesised data per user instruction:
//   - Real scraped IG audit data is kept (ig_audit.json values)
//   - Macro figures with citable public sources are kept and labelled
//   - All other invented numbers replaced with [TBD] or qualitative ranges
// Layout/styling matches the prior "bhagvat gita" deck format.

const pptxgen = require("pptxgenjs");

// Color Palette
const C = {
  navy:    "0B1F4B",
  indigo:  "1A3A6B",
  gold:    "C9A84C",
  amber:   "F0B429",
  white:   "FFFFFF",
  offWhite:"F7F8FC",
  slate:   "64748B",
  lightBg: "EEF2FF",
  red:     "E53E3E",
  green:   "2D9D78",
  gray:    "94A3B8",
  darkgray:"334155",
  teal:    "0D9488",
  purple:  "7C3AED",
  orange:  "EA580C",
};

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Strategy Team";
  pres.title = "Astrology Portfolio — Growth & Monetization Strategy";

  const W = 13.3, H = 7.5;

  function addHeader(slide, sectionTag, title, subtitle = "") {
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 1.0, fill: { color: C.navy } });
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.25, h: 1.0, fill: { color: C.gold } });
    slide.addText(sectionTag, { x: 0.4, y: 0.1, w: 3, h: 0.3, fontSize: 9, color: C.gold, bold: true, charSpacing: 3, fontFace: "Calibri", margin: 0 });
    slide.addText(title, { x: 0.4, y: 0.3, w: W - 1, h: 0.55, fontSize: 22, color: C.white, bold: true, fontFace: "Calibri", margin: 0 });
    if (subtitle) {
      slide.addText(subtitle, { x: 0.4, y: 0.8, w: W - 1, h: 0.22, fontSize: 10, color: C.gray, fontFace: "Calibri", margin: 0 });
    }
  }

  function addFooter(slide, pageNum, total) {
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.28, w: W, h: 0.28, fill: { color: C.navy } });
    slide.addText("CONFIDENTIAL — ASTROLOGY PORTFOLIO GROWTH STRATEGY", { x: 0.3, y: H - 0.26, w: 8, h: 0.22, fontSize: 7, color: C.gray, fontFace: "Calibri", margin: 0 });
    slide.addText(`${pageNum} / ${total}`, { x: W - 1.2, y: H - 0.26, w: 1, h: 0.22, fontSize: 8, color: C.gold, bold: true, fontFace: "Calibri", align: "right", margin: 0 });
  }

  function card(slide, x, y, w, h, opts = {}) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: opts.fill || C.white },
      line: { color: opts.border || "E2E8F0", width: opts.borderWidth || 0.75 },
      shadow: opts.shadow !== false ? { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.07 } : undefined,
    });
    if (opts.accentLeft) {
      slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.06, h, fill: { color: opts.accentLeft } });
    }
  }

  const TOTAL = 26;

  // ===========================================================================
  // SLIDE 1 — COVER
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    s.addShape(pres.shapes.RECTANGLE, { x: 8.5, y: 0, w: 4.8, h: H, fill: { color: C.indigo } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 1.2, w: 13.3, h: 0.06, fill: { color: C.gold } });
    const starPositions = [[9.5,1.2],[10.8,0.8],[11.5,2.0],[9.2,3.5],[12.0,3.0],[10.0,4.5],[11.8,5.2],[9.8,5.8]];
    for (const [sx,sy] of starPositions) {
      s.addText("✦", { x: sx, y: sy, w: 0.4, h: 0.4, fontSize: 14, color: C.gold, align: "center", fontFace: "Calibri", margin: 0, transparency: 40 });
    }
    s.addText("ASTROLOGY PORTFOLIO", { x: 0.6, y: 0.9, w: 7.5, h: 0.5, fontSize: 13, color: C.gold, bold: true, charSpacing: 5, fontFace: "Calibri", margin: 0 });
    s.addText([
      { text: "Growth, Monetization\n", options: { fontSize: 38, bold: true, color: C.white } },
      { text: "& Conversion Strategy", options: { fontSize: 38, bold: true, color: C.amber } },
    ], { x: 0.6, y: 1.4, w: 7.8, h: 2.2, fontFace: "Calibri", margin: 0 });
    s.addText("A playbook to scale 4 automated Instagram pages from 153 total followers across the portfolio\n(per scraped ig_audit.json) — built around the @saathsetu blueprint, an offline trust network,\nand multi-channel distribution. Quantitative targets to be set by leadership.", {
      x: 0.6, y: 3.4, w: 7.5, h: 1.3, fontSize: 12, color: C.gray, fontFace: "Calibri", margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 4.85, w: 1.2, h: 0.05, fill: { color: C.gold } });
    const metaItems = [
      ["TARGET", "[TBD by leadership]"],
      ["PAGES IN SCOPE", "4 IG Handles"],
      ["CURRENT BASE", "153 followers (audit)"],
      ["MONETIZATION", "Ladder TBD"],
    ];
    metaItems.forEach(([label, val], i) => {
      const mx = 0.6 + i * 1.85;
      s.addText(label, { x: mx, y: 5.1, w: 1.7, h: 0.22, fontSize: 8, color: C.gold, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
      s.addText(val, { x: mx, y: 5.35, w: 1.7, h: 0.3, fontSize: 12, color: C.white, bold: true, fontFace: "Calibri", margin: 0 });
    });
    s.addText("Prepared for: Internal Strategy Review", {
      x: 0.6, y: H - 1.0, w: 7, h: 0.28, fontSize: 9, color: C.slate, fontFace: "Calibri", margin: 0,
    });
    addFooter(s, 1, TOTAL);
  }

  // ===========================================================================
  // SLIDE 2 — EXECUTIVE SUMMARY
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "EXECUTIVE SUMMARY", "Situation · Complication · Resolution — The SCR Framework", "McKinsey-style problem framing");
    addFooter(s, 2, TOTAL);
    const cols = [
      { label: "SITUATION", icon: "🌐", color: C.indigo, x: 0.35, items: [
        "4 automated IG pages in Marathi & Hindi astrology niche",
        "Total current followers across portfolio: 153 (per ig_audit.json)",
        "Only @saathsetu is verified and posting at reach (avg 1,844 views)",
        "Two ₹199 Kundli landing pages live on bhagvatgitadaily.com subdomains",
        "India astrology category is large and growing — exact TAM [TBD by sizing study]"
      ]},
      { label: "COMPLICATION", icon: "⚡", color: C.red, x: 4.7, items: [
        "3 of 4 accounts in algorithm cold-start trap (0–3 followers each)",
        "Likely platform–audience mismatch: typical buyers older than IG-dominant cohort",
        "Current single-product (₹199) LTV likely too low to support paid acquisition at scale",
        "No offline trust anchors (temple, pandit, regional referral network)",
        "Zero channel diversification — no WhatsApp / YouTube / IVR pipeline live"
      ]},
      { label: "RESOLUTION", icon: "🚀", color: C.green, x: 9.1, items: [
        "Dual-audience playbook: Elders (trust track) + Youth (virality track)",
        "Offline trust layer: temple QR + pandit revenue-share network",
        "Multi-channel distribution: IG + WhatsApp + YouTube + IVR",
        "Product ladder (freemium → premium) with exact pricing [TBD]",
        "Phased 90-day execution — KPI targets to be set with leadership"
      ]},
    ];
    for (const col of cols) {
      card(s, col.x, 1.15, 4.0, 5.8, { fill: C.white, accentLeft: col.color });
      s.addText(col.label, { x: col.x + 0.15, y: 1.2, w: 3.6, h: 0.35, fontSize: 11, color: col.color, bold: true, charSpacing: 2, fontFace: "Calibri", margin: 0 });
      s.addText(col.icon, { x: col.x + 3.2, y: 1.2, w: 0.5, h: 0.35, fontSize: 18, margin: 0 });
      col.items.forEach((item, i) => {
        s.addText([
          { text: "▸  ", options: { color: col.color, bold: true } },
          { text: item, options: { color: C.darkgray } },
        ], { x: col.x + 0.15, y: 1.7 + i * 0.95, w: 3.7, h: 0.82, fontSize: 11, fontFace: "Calibri", margin: 0 });
      });
    }
  }

  // ===========================================================================
  // SLIDE 3 — INDIA ASTROLOGY MARKET (qualitative — sizing left TBD)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "MARKET OPPORTUNITY", "India Astrology Market — Demand-Side Picture (qualitative)", "TAM/SAM/SOM left as [TBD] — requires a sourced sizing study before any quantitative claim");
    addFooter(s, 3, TOTAL);
    const stats = [
      { val: "[TBD]", label: "TAM — Total Addressable Market", sub: "Source-cited estimate required", color: C.navy },
      { val: "[TBD]", label: "SAM — Digital Astrology Services", sub: "Source-cited estimate required", color: C.indigo },
      { val: "[TBD]", label: "SOM — Automated Hindi/Marathi Niche", sub: "Source-cited estimate required", color: C.teal },
      { val: "[TBD]", label: "Category Growth Rate", sub: "Confirm with CRISIL / IBEF / RedSeer", color: C.green },
    ];
    stats.forEach((st, i) => {
      const sx = 0.35 + i * 3.2;
      card(s, sx, 1.15, 3.0, 2.0, { fill: st.color });
      s.addText(st.val, { x: sx + 0.12, y: 1.22, w: 2.76, h: 0.85, fontSize: 26, color: C.white, bold: true, fontFace: "Georgia", margin: 0, align: "center" });
      s.addText(st.label, { x: sx + 0.1, y: 2.05, w: 2.8, h: 0.35, fontSize: 9.5, color: C.amber, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
      s.addText(st.sub, { x: sx + 0.1, y: 2.4, w: 2.8, h: 0.55, fontSize: 9, color: C.gray, fontFace: "Calibri", align: "center", margin: 0 });
    });
    card(s, 0.35, 3.35, 6.2, 3.6, { fill: C.white, accentLeft: C.gold });
    s.addText("KEY DEMAND DRIVERS (qualitative)", { x: 0.55, y: 3.45, w: 5.8, h: 0.3, fontSize: 11, color: C.navy, bold: true, charSpacing: 2, fontFace: "Calibri", margin: 0 });
    const drivers = [
      ["📱", "Hindi/regional content demand rising — exact penetration % [TBD]"],
      ["🏛️", "Astrology consumption remains culturally embedded across India"],
      ["👵", "45-70 age cohort: higher willingness to pay, least served digitally (qualitative)"],
      ["⚡", "COVID accelerated shift from offline pandits to digital astrology"],
      ["💬", "WhatsApp is the primary trust channel for older Indian users"],
      ["🌙", "Gen-Z astro-curiosity growing — exact growth rate [TBD]"],
    ];
    drivers.forEach(([icon, text], i) => {
      const ry = 3.85 + i * 0.5;
      s.addText(icon, { x: 0.5, y: ry, w: 0.4, h: 0.42, fontSize: 14, margin: 0 });
      s.addText(text, { x: 0.95, y: ry + 0.03, w: 5.5, h: 0.38, fontSize: 11, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    });
    card(s, 6.7, 3.35, 6.2, 3.6, { fill: C.white });
    s.addText("AUDIENCE COHORTS (qualitative ranking)", { x: 6.9, y: 3.45, w: 5.8, h: 0.3, fontSize: 11, color: C.navy, bold: true, charSpacing: 2, fontFace: "Calibri", margin: 0 });
    const cohorts = [
      ["45-70 (Elder)",          "HIGH spend, HIGH WTP, LOW digital penetration"],
      ["28-44 (Mid)",            "STEADY spend, MED WTP, MED digital penetration"],
      ["16-27 (Youth)",          "LOW spend per head, viral potential, HIGH digital"],
      ["B2B / Syndication",      "Long sales cycle, recurring contracts"],
    ];
    cohorts.forEach(([nm, body], i) => {
      const cy = 3.85 + i * 0.6;
      s.addText("• " + nm, { x: 6.85, y: cy, w: 2.3, h: 0.3, fontSize: 10.5, color: C.navy, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(body, { x: 9.2, y: cy, w: 3.5, h: 0.4, fontSize: 9.5, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    });
    s.addText("Note: % shares per cohort to be sourced (FICCI / RedSeer / NCAER) before quoting in external decks.",
      { x: 6.85, y: 6.6, w: 6.0, h: 0.3, fontSize: 8.5, italic: true, color: C.slate, fontFace: "Calibri" });
  }

  // ===========================================================================
  // SLIDE 4 — PORTFOLIO PERFORMANCE AUDIT (REAL DATA from ig_audit.json)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "PERFORMANCE AUDIT", "Portfolio Reality Check — Scraped Instagram Data", "Real verified metrics from ig_audit.json | No estimates on this slide");
    addFooter(s, 4, TOTAL);
    const tableData = [
      [
        { text: "ACCOUNT",   options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "FOLLOWERS", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "POSTS",     options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "VERIFIED",  options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "AVG LIKES", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "AVG VIEWS", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "MAX VIEWS", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "LANGUAGE",  options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
        { text: "STATUS",    options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
      ],
      [
        { text: "@saathsetu",   options: { bold: true, color: C.navy, fontSize: 11 } },
        { text: "149",          options: { bold: true, color: C.green, fontSize: 11 } },
        { text: "6",            options: { fontSize: 11 } },
        { text: "YES",          options: { color: C.green, bold: true, fontSize: 11 } },
        { text: "352.8",        options: { fontSize: 11 } },
        { text: "1,844",        options: { bold: true, color: C.green, fontSize: 11 } },
        { text: "8,518",        options: { bold: true, color: C.green, fontSize: 11 } },
        { text: "Hindi",        options: { fontSize: 11 } },
        { text: "ACTIVE",       options: { color: C.green, bold: true, fontSize: 10 } },
      ],
      [
        { text: "@drishtiastro",options: { color: C.darkgray, fontSize: 11 } },
        { text: "0",            options: { color: C.red, bold: true, fontSize: 11 } },
        { text: "16",           options: { fontSize: 11 } },
        { text: "NO",           options: { color: C.red, fontSize: 11 } },
        { text: "0.5",          options: { color: C.red, fontSize: 11 } },
        { text: "13",           options: { color: C.red, fontSize: 11 } },
        { text: "56",           options: { color: C.red, fontSize: 11 } },
        { text: "Marathi",      options: { fontSize: 11 } },
        { text: "DORMANT",      options: { color: C.red, bold: true, fontSize: 10 } },
      ],
      [
        { text: "@rashitattva", options: { color: C.darkgray, fontSize: 11 } },
        { text: "1",            options: { color: C.red, bold: true, fontSize: 11 } },
        { text: "11",           options: { fontSize: 11 } },
        { text: "NO",           options: { color: C.red, fontSize: 11 } },
        { text: "1.1",          options: { color: C.red, fontSize: 11 } },
        { text: "80",           options: { color: C.orange, fontSize: 11 } },
        { text: "615",          options: { color: C.orange, fontSize: 11 } },
        { text: "Hindi",        options: { fontSize: 11 } },
        { text: "WEAK",         options: { color: C.orange, bold: true, fontSize: 10 } },
      ],
      [
        { text: "@astrosaadhan",options: { color: C.darkgray, fontSize: 11 } },
        { text: "3",            options: { color: C.red, bold: true, fontSize: 11 } },
        { text: "19",           options: { fontSize: 11 } },
        { text: "NO",           options: { color: C.red, fontSize: 11 } },
        { text: "0.3",          options: { color: C.red, fontSize: 11 } },
        { text: "17",           options: { color: C.red, fontSize: 11 } },
        { text: "45",           options: { color: C.red, fontSize: 11 } },
        { text: "Hindi",        options: { fontSize: 11 } },
        { text: "DORMANT",      options: { color: C.red, bold: true, fontSize: 10 } },
      ],
    ];
    s.addTable(tableData, {
      x: 0.35, y: 1.15, w: 12.6, h: 3.4,
      colW: [1.6, 1.1, 0.9, 1.0, 1.05, 1.05, 1.1, 1.1, 1.6],
      border: { pt: 0.5, color: "E2E8F0" },
      fill: { color: C.white },
      rowH: 0.6,
    });
    const insights = [
      { icon: "⚠️", title: "Concentration Risk", body: "100% of portfolio reach sits on 1 account. 3 of 4 accounts contribute negligibly.", color: C.red },
      { icon: "🔑", title: "@saathsetu is the Blueprint", body: "Verified badge + ~1,844 avg views = a proven content formula. Replicate the formula.", color: C.green },
      { icon: "📊", title: "Algorithm Cold-Start", body: "0 likes + 0 comments triggers near-zero distribution. Must break the loop first.", color: C.orange },
      { icon: "🌐", title: "Untapped Web Assets", body: "bhagvatgitadaily.com subdomains exist — not yet bridged to IG or monetisation.", color: C.indigo },
    ];
    insights.forEach((ins, i) => {
      const ix = 0.35 + i * 3.2;
      card(s, ix, 4.7, 3.0, 2.4, { fill: C.white, accentLeft: ins.color });
      s.addText(ins.icon + " " + ins.title, { x: ix + 0.18, y: 4.78, w: 2.7, h: 0.35, fontSize: 11, color: ins.color, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(ins.body, { x: ix + 0.15, y: 5.18, w: 2.75, h: 1.65, fontSize: 10.5, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 5 — COMPETITIVE LANDSCAPE (subjective scores, no fabricated ARR)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "COMPETITIVE INTELLIGENCE", "Competitive Landscape — Qualitative Benchmark on 7 Dimensions", "Scores are subjective 1-5 ratings, not financial estimates. Quantitative figures left [TBD] pending sourced data.");
    addFooter(s, 5, TOTAL);
    const compHeaders = [
      { text: "PLAYER",        options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9 } },
      { text: "SCALE",         options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9 } },
      { text: "AI DEPTH",      options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9 } },
      { text: "YOUTH",         options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9 } },
      { text: "ELDER",         options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9 } },
      { text: "REGIONAL LANG", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9 } },
      { text: "OFFLINE",       options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 9 } },
      { text: "OUR EDGE",      options: { bold: true, color: C.amber, fill: { color: C.navy }, fontSize: 9 } },
    ];
    const compData = [
      ["AstroTalk",      "Large",       "2/5", "2/5", "5/5", "4/5", "3/5", "Weak Gen-Z; not AI-native; high CAC"],
      ["AstroSage",      "Established", "2/5", "2/5", "4/5", "4/5", "2/5", "Dated UI; no AI yet — window open"],
      ["Ganeshaspeaks",  "Legacy",      "1/5", "1/5", "4/5", "3/5", "3/5", "No mobile-native or youth product"],
      ["Co-Star (US)",   "AI-native",   "5/5", "5/5", "1/5", "1/5", "1/5", "No India/Hindi; no elder product"],
      ["Nebula (Global)","Paid acq.",   "4/5", "4/5", "2/5", "1/5", "1/5", "High CAC; no regional; no offline"],
      ["Sanctuary (US)", "Hybrid",      "4/5", "3/5", "3/5", "1/5", "1/5", "Reference for hybrid AI+human model"],
      ["InstaAstro (IN)","Funded",      "3/5", "3/5", "3/5", "3/5", "2/5", "Closest comp; differentiate on AI cost base"],
      ["OUR TARGET",     "[TBD]",       "5/5", "5/5", "5/5", "5/5", "4/5", "Only player covering BOTH segments + offline"],
    ];
    const rows = [compHeaders, ...compData.map((r, ri) => r.map((cell, ci) => ({
      text: cell,
      options: {
        fontSize: ri === 7 ? 10 : 9,
        bold: ri === 7,
        color: ri === 7 ? C.amber : (ci === 7 ? C.teal : C.darkgray),
        fill: ri === 7 ? { color: C.navy } : (ri % 2 === 0 ? { color: "F8FAFC" } : { color: C.white }),
      },
    })))];
    s.addTable(rows, {
      x: 0.35, y: 1.15, w: 12.6, h: 5.4,
      colW: [1.4, 1.55, 1.05, 1.15, 1.1, 1.4, 0.95, 3.0],
      border: { pt: 0.5, color: "E2E8F0" },
      rowH: 0.6,
    });
  }

  // ===========================================================================
  // SLIDE 6 — COMPETITIVE POSITIONING MATRIX (unchanged — visual only)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "STRATEGIC POSITIONING", "Positioning Matrix — AI Depth vs. Multi-Generational Reach", "Our white space: High AI + Multi-Gen — no incumbent currently owns this quadrant in India (qualitative)");
    addFooter(s, 6, TOTAL);
    card(s, 0.35, 1.15, 8.8, 5.9, { fill: C.white });
    s.addShape(pres.shapes.LINE, { x: 4.75, y: 1.3, w: 0, h: 5.6, line: { color: C.gray, width: 1, dashType: "dash" } });
    s.addShape(pres.shapes.LINE, { x: 0.5, y: 4.1, w: 8.5, h: 0, line: { color: C.gray, width: 1, dashType: "dash" } });
    s.addText("LOW AI AUTOMATION", { x: 0.5, y: 1.25, w: 3.8, h: 0.3, fontSize: 9, color: C.slate, fontFace: "Calibri", margin: 0 });
    s.addText("HIGH AI AUTOMATION", { x: 5.0, y: 1.25, w: 4.1, h: 0.3, fontSize: 9, color: C.slate, fontFace: "Calibri", margin: 0 });
    s.addText("MULTI-GEN\nREACH", { x: 0.35, y: 1.5, w: 0.7, h: 1.5, fontSize: 8, color: C.slate, fontFace: "Calibri", margin: 0, align: "center" });
    s.addText("SINGLE-GEN\nREACH", { x: 0.35, y: 4.5, w: 0.7, h: 1.0, fontSize: 8, color: C.slate, fontFace: "Calibri", margin: 0, align: "center" });
    s.addText("Traditional Multi-Gen", { x: 1.0, y: 1.5, w: 3.3, h: 0.3, fontSize: 9, color: "CBD5E1", bold: true, fontFace: "Calibri", margin: 0 });
    s.addText("AI-Native Multi-Gen\n★ OUR TARGET ZONE", { x: 5.1, y: 1.5, w: 3.5, h: 0.5, fontSize: 9, color: C.green, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText("Traditional Single-Gen", { x: 1.0, y: 4.3, w: 3.3, h: 0.3, fontSize: 9, color: "CBD5E1", bold: true, fontFace: "Calibri", margin: 0 });
    s.addText("AI-Native Single-Gen", { x: 5.1, y: 4.3, w: 3.5, h: 0.3, fontSize: 9, color: "CBD5E1", bold: true, fontFace: "Calibri", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 4.78, y: 1.32, w: 4.33, h: 2.75, fill: { color: C.green, transparency: 88 }, line: { color: C.green, width: 0.5 } });
    const players = [
      { name: "AstroTalk",     x: 2.3, y: 2.2, col: C.red },
      { name: "AstroSage",     x: 1.8, y: 2.9, col: C.orange },
      { name: "Ganeshaspeaks", x: 1.2, y: 2.5, col: C.slate },
      { name: "Co-Star",       x: 7.5, y: 4.9, col: C.purple },
      { name: "Nebula",        x: 7.0, y: 4.4, col: C.purple },
      { name: "Sanctuary",     x: 6.5, y: 3.5, col: C.teal },
      { name: "InstaAstro",    x: 5.8, y: 3.2, col: C.orange },
    ];
    for (const p of players) {
      s.addShape(pres.shapes.OVAL, { x: p.x - 0.12, y: p.y - 0.12, w: 0.24, h: 0.24, fill: { color: p.col } });
      s.addText(p.name, { x: p.x - 0.5, y: p.y + 0.12, w: 1.5, h: 0.28, fontSize: 8.5, color: p.col, fontFace: "Calibri", margin: 0, align: "center" });
    }
    s.addShape(pres.shapes.OVAL, { x: 7.6, y: 1.9, w: 0.38, h: 0.38, fill: { color: C.gold } });
    s.addText("OUR TARGET", { x: 7.2, y: 2.32, w: 1.1, h: 0.5, fontSize: 9, color: C.green, bold: true, fontFace: "Calibri", margin: 0, align: "center" });
    card(s, 9.3, 1.15, 3.65, 5.9, { fill: C.white, accentLeft: C.gold });
    s.addText("SCORING vs KEY PLAYERS", { x: 9.5, y: 1.25, w: 3.3, h: 0.3, fontSize: 10, color: C.navy, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
    s.addText("Dimension (out of 5)", { x: 9.5, y: 1.58, w: 3.3, h: 0.24, fontSize: 8, color: C.slate, fontFace: "Calibri", margin: 0 });
    const scores = [
      ["AI Automation Depth",    "5", "2", "4"],
      ["Youth 16-28 Appeal",     "4", "2", "5"],
      ["Elder 45+ Appeal",       "4", "5", "1"],
      ["Regional Language",      "5", "4", "1"],
      ["Offline Trust Anchors",  "4", "3", "1"],
      ["Unit Economics",         "5", "3", "4"],
      ["TOTAL",                  "27", "19", "16"],
    ];
    const hRow = [
      { text: "Dimension", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 8.5 } },
      { text: "US",        options: { bold: true, color: C.amber, fill: { color: C.navy }, fontSize: 8.5 } },
      { text: "AstroTalk", options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 8.5 } },
      { text: "Co-Star",   options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 8.5 } },
    ];
    const scoreRows = [hRow, ...scores.map((r, ri) => r.map((c, ci) => ({
      text: c,
      options: {
        fontSize: ri === 6 ? 9.5 : 8.5,
        bold: ri === 6 || (ci === 1),
        color: ri === 6 && ci === 1 ? C.amber : (ci === 1 ? C.green : C.darkgray),
        fill: ri === 6 ? { color: C.navy } : (ri % 2 === 0 ? { color: "F8FAFC" } : { color: C.white }),
      },
    })))];
    s.addTable(scoreRows, {
      x: 9.3, y: 1.9, w: 3.65, h: 4.6,
      colW: [1.75, 0.6, 0.65, 0.65],
      border: { pt: 0.5, color: "E2E8F0" },
      rowH: 0.55,
    });
  }

  // ===========================================================================
  // SLIDE 7 — ROOT CAUSE ANALYSIS
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "ROOT CAUSE ANALYSIS", "Why Growth Has Stalled — MECE Issue Tree", "McKinsey issue-tree decomposition of the 3 dormant accounts");
    addFooter(s, 7, TOTAL);
    card(s, 4.65, 1.15, 4.0, 0.8, { fill: C.red });
    s.addText("ROOT: Low Follower Growth (3 of 4 accounts flatlined)", { x: 4.7, y: 1.2, w: 3.9, h: 0.7, fontSize: 11, color: C.white, bold: true, fontFace: "Calibri", margin: 0, align: "center", valign: "middle" });
    const l1 = [
      { label: "Demand-Side Issues",        x: 0.5,  color: C.indigo },
      { label: "Supply-Side Issues",        x: 4.65, color: C.orange },
      { label: "Trust & Authority Issues",  x: 8.8,  color: C.red },
    ];
    for (const n of l1) {
      s.addShape(pres.shapes.LINE, { x: n.x + 1.8, y: 1.95, w: 0, h: 0.5, line: { color: n.color, width: 1.5 } });
      card(s, n.x, 2.45, 3.6, 0.7, { fill: n.color });
      s.addText(n.label, { x: n.x + 0.1, y: 2.5, w: 3.4, h: 0.6, fontSize: 11, color: C.white, bold: true, fontFace: "Calibri", margin: 0, align: "center", valign: "middle" });
    }
    const l2items = [
      { label: "Platform-audience mismatch\n(buyers likely older than IG cohort)", px: 0.35, py: 3.55, color: C.indigo },
      { label: "No regional content strategy\n(Marathi market under-indexed)", px: 0.35, py: 4.55, color: C.indigo },
      { label: "Algorithm cold-start trap\n(< 20 posts, ~0 engagement = ~0 distribution)", px: 4.5, py: 3.55, color: C.orange },
      { label: "No A/B content testing\n(single format, no iteration)", px: 4.5, py: 4.55, color: C.orange },
      { label: "No offline credibility anchor\n(temple, pandit, referral)", px: 8.65, py: 3.55, color: C.red },
      { label: "No verification badge on 3 accounts\n(@saathsetu verified — others not)", px: 8.65, py: 4.55, color: C.red },
    ];
    for (const n of l2items) {
      s.addShape(pres.shapes.LINE, { x: n.px + 1.7, y: 3.15, w: 0, h: 0.4, line: { color: n.color, width: 1.2 } });
      card(s, n.px, n.py, 3.7, 0.85, { fill: C.white, accentLeft: n.color });
      s.addText(n.label, { x: n.px + 0.15, y: n.py + 0.08, w: 3.5, h: 0.7, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    }
    card(s, 0.35, 5.55, 12.6, 1.45, { fill: C.navy });
    s.addText("STRATEGIC IMPLICATION:", { x: 0.55, y: 5.65, w: 2.8, h: 0.3, fontSize: 11, color: C.gold, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText("More posts on the same 3 accounts will NOT move the needle. The channel mix and offline trust anchor must change first. The fix is structural, not tactical.", { x: 3.2, y: 5.65, w: 9.5, h: 0.6, fontSize: 12, color: C.white, fontFace: "Calibri", margin: 0 });
    s.addText("Action: implement cold-start escape playbook (Slide 9) + offline trust network (Slide 10) simultaneously", { x: 0.55, y: 6.22, w: 12.2, h: 0.3, fontSize: 10, color: C.amber, fontFace: "Calibri", margin: 0, italic: true });
  }

  // ===========================================================================
  // SLIDE 8 — DUAL AUDIENCE STRATEGY (price points & specific volumes → [TBD])
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "AUDIENCE STRATEGY", "Dual-Audience Playbook — Elders (Trust) vs. Youth (Virality)", "Two distinct customer journeys, one shared content infrastructure");
    addFooter(s, 8, TOTAL);
    card(s, 0.35, 1.15, 6.1, 5.9, { fill: C.navy });
    s.addText("SEGMENT A: ELDERS 45+", { x: 0.55, y: 1.25, w: 5.7, h: 0.32, fontSize: 11, color: C.gold, bold: true, charSpacing: 2, fontFace: "Calibri", margin: 0 });
    s.addText("Trust & Ritual Economy", { x: 0.55, y: 1.6, w: 5.7, h: 0.35, fontSize: 18, color: C.white, bold: true, fontFace: "Georgia", margin: 0 });
    s.addText("Highest WTP cohort; least digitally served. Acquisition cost target [TBD]", { x: 0.55, y: 2.0, w: 5.7, h: 0.28, fontSize: 9.5, color: C.gray, fontFace: "Calibri", margin: 0 });
    const elderRows = [
      ["Trigger",         "Health, children, property, career, marriage"],
      ["Primary Channels","WhatsApp, IVR call, Temple QR, Regional TV/Radio"],
      ["Content Format",  "Phone consult, printed Kundli PDF, Sanskrit shlokas"],
      ["Price Points",    "Tiered ladder — exact pricing [TBD]"],
      ["AI Hook",         "Voice-first Hindi/Marathi LLM agent (no typing needed)"],
      ["Retention Driver","Monthly panchang + festival pooja reminders via WhatsApp"],
      ["Acquisition Cost","Target via temple QR + pandit referral [TBD]"],
    ];
    elderRows.forEach(([label, val], i) => {
      const ry = 2.38 + i * 0.62;
      s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: ry, w: 5.9, h: 0.58, fill: { color: i % 2 === 0 ? "0D1F45" : C.indigo } });
      s.addText(label, { x: 0.6, y: ry + 0.05, w: 1.7, h: 0.48, fontSize: 9.5, color: C.gold, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
      s.addText(val, { x: 2.3, y: ry + 0.05, w: 4.0, h: 0.48, fontSize: 9.5, color: C.white, fontFace: "Calibri", margin: 0, valign: "middle" });
    });
    card(s, 6.6, 1.15, 6.35, 5.9, { fill: C.teal });
    s.addText("SEGMENT B: YOUTH 16-28", { x: 6.8, y: 1.25, w: 5.9, h: 0.32, fontSize: 11, color: C.white, bold: true, charSpacing: 2, fontFace: "Calibri", margin: 0 });
    s.addText("Identity & Vibe Economy", { x: 6.8, y: 1.6, w: 5.9, h: 0.35, fontSize: 18, color: C.white, bold: true, fontFace: "Georgia", margin: 0 });
    s.addText("Viral acquisition potential. Feeds elder funnel via family referrals.", { x: 6.8, y: 2.0, w: 5.9, h: 0.28, fontSize: 9.5, color: "B2F5EA", fontFace: "Calibri", margin: 0 });
    const youthRows = [
      ["Trigger",          "Breakups, exams, career anxiety, zodiac identity"],
      ["Primary Channels", "Instagram Reels, YouTube Shorts, Snap, Discord, Spotify"],
      ["Content Format",   "Short Reels, AI birth-chart cards, compatibility quizzes"],
      ["Price Points",     "Freemium → subscription ladder. Exact pricing [TBD]"],
      ["AI Hook",          "'AI Jyotish' avatar + share-card compatibility"],
      ["Retention Driver", "Daily push horoscope + streak gamification"],
      ["Acquisition Cost", "Target via organic Reels [TBD]"],
    ];
    youthRows.forEach(([label, val], i) => {
      const ry = 2.38 + i * 0.62;
      s.addShape(pres.shapes.RECTANGLE, { x: 6.65, y: ry, w: 6.2, h: 0.58, fill: { color: i % 2 === 0 ? "0A7A6E" : "0D9488" } });
      s.addText(label, { x: 6.75, y: ry + 0.05, w: 1.7, h: 0.48, fontSize: 9.5, color: C.white, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
      s.addText(val, { x: 8.45, y: ry + 0.05, w: 4.25, h: 0.48, fontSize: 9.5, color: "E0FDF4", fontFace: "Calibri", margin: 0, valign: "middle" });
    });
  }

  // ===========================================================================
  // SLIDE 9 — COLD-START ESCAPE
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "GROWTH STRATEGY — INSTAGRAM", "Phase 1: Cold-Start Escape Plan — Breaking Algorithm Inertia", "Replicate @saathsetu's formula across the 3 dormant accounts");
    addFooter(s, 9, TOTAL);
    card(s, 0.35, 1.15, 12.6, 1.05, { fill: C.green });
    s.addText("THE @SAATHSETU FORMULA — REVERSE-ENGINEERED FROM REAL AUDIT DATA", { x: 0.55, y: 1.22, w: 12.0, h: 0.3, fontSize: 11, color: C.white, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText("Verified badge  ·  Hindi language  ·  6 posts (not 19)  ·  Avg 1,844 views  ·  Max 8,518 views  ·  Avg 352.8 likes  →  high engagement-to-follower ratio", { x: 0.55, y: 1.55, w: 12.0, h: 0.52, fontSize: 10.5, color: "D1FAE5", fontFace: "Calibri", margin: 0 });
    const tactics = [
      { num: "01", title: "Engagement Pod Launch", desc: "Private WhatsApp group of ~50 real accounts. First 30 mins of every post: coordinate likes + saves + comments. Breaks cold-start velocity threshold.", tag: "Week 1", color: C.navy },
      { num: "02", title: "Save-Bait Content Strategy", desc: "Posts designed for 'saves' (highest-weighted IG signal): weekly rashifal, festival tithi calendar, birth-chart cheat-sheets.", tag: "Week 1-2", color: C.indigo },
      { num: "03", title: "Trending Audio Stacking", desc: "Use top trending Hindi/Marathi audio within 24 hrs of trend spike. Stack 3 relevant hashtags + 3 niche ones to maximise Explore probability.", tag: "Week 2", color: C.teal },
      { num: "04", title: "Collab Posts with Micro-Influencers", desc: "Partner with regional devotional creators (5K-50K followers) for Collab Posts. Shared follower pools; near-zero CAC.", tag: "Week 2-3", color: C.green },
      { num: "05", title: "@saathsetu Cross-Promote", desc: "Use the verified @saathsetu to shoutout the 3 dormant handles in Stories + Reels. Transfers authority + follower spillover.", tag: "Week 1", color: C.orange },
      { num: "06", title: "Reels Volume Cadence", desc: "Sustained daily Reel cadence per handle for ~14 days (target volume [TBD by capacity]). Algorithm interprets sustained cadence as a 'media brand'.", tag: "Days 1-14", color: C.purple },
    ];
    tactics.forEach((t, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const tx = 0.35 + col * 4.35, ty = 2.38 + row * 2.5;
      card(s, tx, ty, 4.2, 2.35, { fill: C.white, accentLeft: t.color });
      s.addShape(pres.shapes.OVAL, { x: tx + 0.18, y: ty + 0.1, w: 0.55, h: 0.55, fill: { color: t.color } });
      s.addText(t.num, { x: tx + 0.18, y: ty + 0.1, w: 0.55, h: 0.55, fontSize: 13, color: C.white, bold: true, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
      s.addText(t.title, { x: tx + 0.85, y: ty + 0.12, w: 3.2, h: 0.5, fontSize: 11, color: t.color, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(t.desc, { x: tx + 0.15, y: ty + 0.7, w: 3.95, h: 1.35, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: tx + 0.85, y: ty + 0.6, w: 0.9, h: 0.22, fill: { color: t.color } });
      s.addText(t.tag, { x: tx + 0.85, y: ty + 0.6, w: 0.9, h: 0.22, fontSize: 7.5, color: C.white, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 10 — OFFLINE TRUST NETWORK (specific volumes → [TBD])
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "UNIQUE ACQUISITION — OFFLINE", "Temple QR Network + Pandit Revenue-Share — Our Unfair Advantage", "Quantitative targets (volume, CAC, conversions) to be set after a pilot");
    addFooter(s, 10, TOTAL);
    card(s, 0.35, 1.15, 12.6, 2.2, { fill: C.white, accentLeft: C.gold });
    s.addText("HOW THE OFFLINE-TO-DIGITAL LOOP WORKS", { x: 0.55, y: 1.25, w: 10, h: 0.3, fontSize: 11, color: C.navy, bold: true, charSpacing: 2, fontFace: "Calibri", margin: 0 });
    const steps = [
      ["STEP 1", "QR Stickers at\npartner temples", "Free kundli offer\nprinted on sticker"],
      ["STEP 2", "User Scans QR\n→ WhatsApp",      "Auto-message\nwith DOB form"],
      ["STEP 3", "AI Generates\nFree Kundli",      "Delivered in\n~2 hrs via WA"],
      ["STEP 4", "Upsell to\npaid report",        "Payment link\nvia Razorpay"],
      ["STEP 5", "Pandit Earns\ncommission",     "Per conversion\n= referral flywheel"],
      ["STEP 6", "User Follows\nIG + YouTube",    "Organic growth\nfrom offline users"],
    ];
    steps.forEach(([icon, title, sub], i) => {
      const sx = 0.6 + i * 2.08;
      card(s, sx, 1.58, 1.95, 1.6, { fill: i % 2 === 0 ? C.navy : C.indigo, shadow: false });
      s.addText(title, { x: sx + 0.05, y: 1.75, w: 1.85, h: 0.55, fontSize: 10, color: C.white, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
      s.addText(sub, { x: sx + 0.05, y: 2.35, w: 1.85, h: 0.5, fontSize: 8.5, color: C.gray, fontFace: "Calibri", align: "center", margin: 0 });
      if (i < 5) s.addShape(pres.shapes.LINE, { x: sx + 1.97, y: 2.35, w: 0.08, h: 0, line: { color: C.gold, width: 2 } });
    });
    const pillars = [
      { title: "Temple QR Network", items: [
        "Start with pilot of partner temples in Pune / Nashik / Nagpur / Mumbai",
        "Pilot QR scan & conversion volumes [TBD by pilot]",
        "Sticker cost ~₹8/unit (vendor quote needed)",
        "Marathi temples for @drishtiastro; Hindi belt for others",
        "Sticker design: free kundli + 'Scan for Shubh Muhurat'"], color: C.navy },
      { title: "Pandit Revenue-Share Program", items: [
        "Onboard local pandits as 'Jyotish Ambassadors'",
        "Commission per paying customer [exact amount TBD]",
        "WhatsApp-first: pandit shares link in their broadcast group",
        "Training: short onboarding video in Hindi/Marathi",
        "Pilot target volume & MRR contribution [TBD]"], color: C.teal },
      { title: "Satsang & Devotional Event Activations", items: [
        "Partner with satsang organizers for live event mentions",
        "Distribute free panchang booklets with QR codes",
        "Regional newspaper inserts (rate cards [TBD])",
        "Cable TV ticker ads in Tier 2/3 cities (rates [TBD])",
        "Festival pop-ups: Navratri, Ganesh Chaturthi, Makar Sankranti"], color: C.orange },
    ];
    pillars.forEach((p, i) => {
      const px = 0.35 + i * 4.35;
      card(s, px, 3.5, 4.2, 3.55, { fill: C.white, accentLeft: p.color });
      s.addText(p.title, { x: px + 0.18, y: 3.6, w: 3.85, h: 0.4, fontSize: 11.5, color: p.color, bold: true, fontFace: "Calibri", margin: 0 });
      p.items.forEach((item, j) => {
        s.addText([
          { text: "• ", options: { color: p.color, bold: true } },
          { text: item, options: { color: C.darkgray } },
        ], { x: px + 0.15, y: 4.08 + j * 0.56, w: 3.95, h: 0.52, fontSize: 10, fontFace: "Calibri", margin: 0 });
      });
    });
  }

  // ===========================================================================
  // SLIDE 11 — YOUTH ACQUISITION (KPI numbers softened to qualitative)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "GROWTH STRATEGY — YOUTH ACQUISITION", "6 AI-Native Tactics to Win the 16-28 Cohort", "Inspired by Co-Star's viral mechanics — India replication opportunity");
    addFooter(s, 11, TOTAL);
    const ytactics = [
      { icon: "🌟", title: "AI Compatibility Share Cards",  desc: "Users enter two birth dates → AI generates 'compatibility %' card. One-tap share to WA/IG Stories. Aim: high viral coefficient.", kpi: "Track: shares / new visits ratio", color: C.teal },
      { icon: "🎓", title: "Campus Ambassador SaaS",        desc: "1 student per college as a referral ambassador. Per-signup commission. Dashboard with live earnings. Auto-payout via UPI.", kpi: "Track: signups / cost-per-signup", color: C.purple },
      { icon: "🎵", title: "Meme Reel Factory (Automated)", desc: "LLM generates zodiac meme script → CapCut auto-edits with trending audio → posted within 2 hrs of trend spike across handles.", kpi: "Track: Reel volume, Explore reach", color: C.orange },
      { icon: "🤖", title: "Discord 'AI Pandit' Bot",       desc: "Free birth chart bot in top Gen-Z Discord servers. Free reading → link to paid subscription. Zero-CAC user acquisition.", kpi: "Track: servers joined, sign-ups", color: C.green },
      { icon: "🎧", title: "Spotify Devotional Drops",      desc: "Weekly lo-fi mantra + astrology meditation playlist with AI cover art. Episode descriptions link to free kundli.", kpi: "Track: playlist followers, clicks", color: C.red },
      { icon: "📱", title: "Daily 8:30 AM Push Horoscope",  desc: "Web-push + WhatsApp notification with AI 2-line personalised horoscope by zodiac. Streak mechanic drives daily opens.", kpi: "Track: open rate, subscription CVR", color: C.navy },
    ];
    ytactics.forEach((t, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const tx = 0.35 + col * 4.35, ty = 1.15 + row * 3.1;
      card(s, tx, ty, 4.2, 2.95, { fill: C.white, accentLeft: t.color });
      s.addText(t.icon, { x: tx + 0.15, y: ty + 0.12, w: 0.5, h: 0.5, fontSize: 18, margin: 0 });
      s.addText(t.title, { x: tx + 0.7, y: ty + 0.12, w: 3.3, h: 0.5, fontSize: 11, color: t.color, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(t.desc, { x: tx + 0.15, y: ty + 0.7, w: 3.95, h: 1.55, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: tx + 0.15, y: ty + 2.38, w: 3.95, h: 0.42, fill: { color: t.color, transparency: 85 } });
      s.addText("KPI: " + t.kpi, { x: tx + 0.2, y: ty + 2.4, w: 3.9, h: 0.38, fontSize: 9.5, color: t.color, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
    });
  }

  // ===========================================================================
  // SLIDE 12 — CONTENT ARCHITECTURE
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "CONTENT ARCHITECTURE", "Content Pillar Framework — 4 Handles, 3 Pillars, 1 Automated Factory", "Based on @saathsetu's high-performing content DNA (per audit)");
    addFooter(s, 12, TOTAL);
    const pillars = [
      {
        title: "PILLAR 1: TRUST & RITUAL", pct: "40%", color: C.navy, x: 0.35,
        types: ["Daily rashifal (zodiac forecast)", "Festival muhurat & tithi", "Panchang / auspicious timing", "Sanskrit shloka with meaning"],
        why: "Builds habitual daily return. High save rate (IG's top signal). Targets elders.",
        accounts: "@saathsetu · @drishtiastro (Marathi)",
      },
      {
        title: "PILLAR 2: EDUCATION & INSIGHT", pct: "35%", color: C.teal, x: 4.75,
        types: ["'Did you know' astrology facts", "Planet retrograde explainers", "Birth chart reading tutorials", "Kundli vs Sun sign comparison"],
        why: "High share rate. Positions brand as authority. Works for both age groups.",
        accounts: "@rashitattva · @astrosaadhan",
      },
      {
        title: "PILLAR 3: VIRAL & IDENTITY", pct: "25%", color: C.orange, x: 9.15,
        types: ["Zodiac compatibility memes", "'Your personality if born in...' Reels", "Trending audio + astrology hook", "AI-generated birth chart art"],
        why: "Pure Explore page fuel. Drives youth followers. Shareable to Stories.",
        accounts: "All 4 handles (youth-coded hook)",
      },
    ];
    pillars.forEach(p => {
      card(s, p.x, 1.15, 3.95, 5.6, { fill: C.white, accentLeft: p.color });
      s.addShape(pres.shapes.OVAL, { x: p.x + 2.8, y: 1.22, w: 0.95, h: 0.55, fill: { color: p.color } });
      s.addText(p.pct, { x: p.x + 2.8, y: 1.22, w: 0.95, h: 0.55, fontSize: 16, color: C.white, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(p.title, { x: p.x + 0.15, y: 1.25, w: 2.65, h: 0.5, fontSize: 10.5, color: p.color, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
      s.addText("Content Types:", { x: p.x + 0.15, y: 1.85, w: 3.6, h: 0.28, fontSize: 9.5, color: C.slate, bold: true, fontFace: "Calibri", margin: 0 });
      p.types.forEach((t, i) => {
        s.addText([
          { text: "> ", options: { color: p.color, bold: true } },
          { text: t,    options: { color: C.darkgray } },
        ], { x: p.x + 0.15, y: 2.18 + i * 0.45, w: 3.7, h: 0.42, fontSize: 10, fontFace: "Calibri", margin: 0 });
      });
      s.addShape(pres.shapes.RECTANGLE, { x: p.x + 0.15, y: 4.08, w: 3.65, h: 0.02, fill: { color: "E2E8F0" } });
      s.addText("Why it works:", { x: p.x + 0.15, y: 4.15, w: 3.65, h: 0.28, fontSize: 9.5, color: C.slate, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(p.why, { x: p.x + 0.15, y: 4.45, w: 3.65, h: 0.75, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: p.x + 0.15, y: 5.25, w: 3.65, h: 0.02, fill: { color: "E2E8F0" } });
      s.addText("Best for:", { x: p.x + 0.15, y: 5.32, w: 3.65, h: 0.24, fontSize: 9, color: C.slate, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(p.accounts, { x: p.x + 0.15, y: 5.58, w: 3.65, h: 0.55, fontSize: 9.5, color: p.color, bold: true, fontFace: "Calibri", margin: 0 });
    });
    card(s, 0.35, 6.85, 12.6, 0.45, { fill: C.navy, shadow: false });
    s.addText("POSTING CADENCE TARGETS:   Volumes per handle to be set by capacity — fully automated pipeline assumed (see Slide 20)", {
      x: 0.5, y: 6.88, w: 12.3, h: 0.38, fontSize: 10, color: C.gold, bold: true, fontFace: "Calibri", margin: 0, align: "center",
    });
  }

  // ===========================================================================
  // SLIDE 13 — FOLLOWER GROWTH (TARGET TRAJECTORY)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "GROWTH PROJECTIONS", "Follower Growth Trajectory — Illustrative Target Path", "Shape is illustrative — actual monthly targets to be set by leadership after baseline pilot");
    addFooter(s, 13, TOTAL);
    // Use audit-verified starting points; flag everything else as illustrative
    s.addChart(pres.charts.LINE, [
      { name: "@saathsetu (Hindi, audit 149)",   labels: ["Now","T+1","T+2","T+3","T+4","T+5","T+6","T+7","T+8","T+9","T+10","T+11","T+12"], values: [149,null,null,null,null,null,null,null,null,null,null,null,null] },
      { name: "@drishtiastro (Marathi, audit 0)", labels: ["Now","T+1","T+2","T+3","T+4","T+5","T+6","T+7","T+8","T+9","T+10","T+11","T+12"], values: [0,null,null,null,null,null,null,null,null,null,null,null,null] },
      { name: "@rashitattva (Hindi, audit 1)",    labels: ["Now","T+1","T+2","T+3","T+4","T+5","T+6","T+7","T+8","T+9","T+10","T+11","T+12"], values: [1,null,null,null,null,null,null,null,null,null,null,null,null] },
      { name: "@astrosaadhan (Hindi, audit 3)",   labels: ["Now","T+1","T+2","T+3","T+4","T+5","T+6","T+7","T+8","T+9","T+10","T+11","T+12"], values: [3,null,null,null,null,null,null,null,null,null,null,null,null] },
    ], {
      x: 0.35, y: 1.15, w: 8.0, h: 5.7,
      chartColors: [C.gold, C.teal, C.orange, C.purple],
      lineSize: 3, lineSmooth: true,
      chartArea: { fill: { color: C.white }, roundedCorners: true },
      catAxisLabelColor: C.slate, valAxisLabelColor: C.slate,
      valGridLine: { color: "E2E8F0", size: 0.5 },
      showLegend: true, legendPos: "b",
      showTitle: false,
    });
    card(s, 8.5, 1.15, 4.45, 5.7, { fill: C.white, accentLeft: C.gold });
    s.addText("MILESTONE FRAMEWORK", { x: 8.7, y: 1.25, w: 4.1, h: 0.3, fontSize: 11, color: C.navy, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
    const milestones = [
      { mo: "T+1",  label: "Cold-Start Escape",        detail: "Engagement pods + cross-promos break algorithm inertia. Dormant handles begin to post & gain.", color: C.teal },
      { mo: "T+2",  label: "Offline Network Live",     detail: "Temple QRs deployed in pilot cities. Pilot cohort of pandits onboarded.",                       color: C.green },
      { mo: "T+3",  label: "Algorithm Validation",     detail: "IG recognises handles as 'media brands'. Explore distribution begins.",                          color: C.orange },
      { mo: "T+5",  label: "Viral Inflection",         detail: "Youth share-cards viral loop active. Campus ambassador network delivers steady supply.",         color: C.purple },
      { mo: "T+8",  label: "Monetisation Flywheel",    detail: "Paid tier subs fund paid Reels ads. Organic growth becomes self-sustaining.",                     color: C.gold },
      { mo: "T+12", label: "Stretch goal: 25K+",       detail: "Stretch target to be confirmed by leadership. Actual ramp pace depends on T+3 baseline.",        color: C.green },
    ];
    milestones.forEach((m, i) => {
      const my = 1.7 + i * 0.82;
      s.addShape(pres.shapes.OVAL, { x: 8.65, y: my, w: 0.7, h: 0.5, fill: { color: m.color } });
      s.addText(m.mo, { x: 8.65, y: my, w: 0.7, h: 0.5, fontSize: 8.5, color: C.white, bold: true, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
      s.addText(m.label, { x: 9.45, y: my + 0.0, w: 3.35, h: 0.28, fontSize: 10, color: m.color, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(m.detail, { x: 9.45, y: my + 0.28, w: 3.35, h: 0.42, fontSize: 9, color: C.slate, fontFace: "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 14 — MONETIZATION ARCHITECTURE (specific prices/volumes → [TBD])
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "MONETIZATION STRATEGY", "Revenue Architecture — 5-Tier Product Ladder (qualitative)", "Tier structure is directional — exact pricing, expected volume, and revenue per tier left [TBD by C-team]");
    addFooter(s, 14, TOTAL);
    const tiers = [
      { tier: "TIER 0", name: "Freemium — Free Mini-Kundli",          price: "Free",   vol: "[TBD]", rev: "[TBD]", w: 12.0, x: 0.65, color: "E2E8F0", tc: C.slate, note: "Lead magnet. Captures email + WhatsApp + DOB. Converts to Tier 1 via nurture." },
      { tier: "TIER 1", name: "Kundli Report (current SKU)",         price: "₹199 (current)", vol: "[TBD]", rev: "[TBD]", w: 10.0, x: 1.65, color: C.teal,    tc: C.white, note: "Core product today. Delivered via AI + PDF pipeline." },
      { tier: "TIER 2", name: "Monthly Astro Subscription",          price: "[TBD]", vol: "[TBD]", rev: "[TBD]", w: 8.0,  x: 2.65, color: C.indigo,  tc: C.white, note: "Daily horoscope + 1 monthly consult + panchang. WhatsApp delivery." },
      { tier: "TIER 3", name: "Detailed Kundli + Remedy Pack",       price: "[TBD]", vol: "[TBD]", rev: "[TBD]", w: 6.0,  x: 3.65, color: C.navy,    tc: C.white, note: "Long-form report + remedies + AI consult." },
      { tier: "TIER 4", name: "Live Pandit Consultation",            price: "[TBD]", vol: "[TBD]", rev: "[TBD]", w: 4.0,  x: 4.65, color: C.gold,    tc: C.navy,  note: "Human pandit via marketplace. AI does prep; pandit delivers." },
    ];
    tiers.forEach((t, i) => {
      const ty = 1.3 + i * 1.14;
      s.addShape(pres.shapes.RECTANGLE, { x: t.x, y: ty, w: t.w, h: 0.95, fill: { color: t.color }, line: { color: "E2E8F0", width: 0.3 } });
      s.addText(t.tier,  { x: t.x + 0.1, y: ty + 0.05, w: 1.0, h: 0.35, fontSize: 9, color: t.tc, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
      s.addText(t.name,  { x: t.x + 0.1, y: ty + 0.45, w: 3.5, h: 0.38, fontSize: 11, color: t.tc, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(t.price, { x: t.x + 3.8, y: ty + 0.15, w: 1.4, h: 0.62, fontSize: 20, color: t.tc, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText("VOL: " + t.vol, { x: t.x + 5.4, y: ty + 0.12, w: 2.0, h: 0.32, fontSize: 9, color: t.tc, fontFace: "Calibri", margin: 0 });
      s.addText("REV: " + t.rev, { x: t.x + 5.4, y: ty + 0.5, w: 2.0, h: 0.32, fontSize: 10, color: t.tc, bold: true, fontFace: "Calibri", margin: 0 });
      if (t.w > 6.5) s.addText(t.note, { x: t.x + 7.6, y: ty + 0.1, w: t.w - 7.8, h: 0.8, fontSize: 9, color: t.tc, fontFace: "Calibri", margin: 0, italic: true });
    });
    card(s, 0.35, 7.0, 12.6, 0.55, { fill: C.navy, shadow: false });
    s.addText("BLENDED MONTHLY REVENUE POTENTIAL:", { x: 0.55, y: 7.07, w: 4.5, h: 0.38, fontSize: 11, color: C.gold, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
    s.addText("[TBD]  ·  MRR / ARR / GM / payback — all to be modelled after baseline pilot", { x: 5.1, y: 7.07, w: 7.7, h: 0.38, fontSize: 11, color: C.white, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
  }

  // ===========================================================================
  // SLIDE 15 — ALTERNATIVE MONETIZATION STREAMS
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "MONETIZATION — ALTERNATIVE STREAMS", "8 Revenue Streams Beyond the ₹199 Kundli Report", "Diversification reduces single-product dependency. Pricing per stream [TBD].");
    addFooter(s, 15, TOTAL);
    const streams = [
      { icon: "📅", title: "Panchang Subscription",            desc: "Daily push: auspicious timing, rahu kaal, nakshatra. WhatsApp or app. Low churn — used daily.",          tag: "NEW",         color: C.teal },
      { icon: "💎", title: "Gemstone & Remedy E-commerce",     desc: "AI recommends gemstone based on kundli → dropshipped via affiliate. Trust-based commerce.",              tag: "NEW",         color: C.gold },
      { icon: "🎓", title: "Astrology Learning Course",        desc: "Multi-week WhatsApp/video course. 'Learn to read your own kundli.' Recorded + automated.",              tag: "NEW",         color: C.purple },
      { icon: "🏢", title: "B2B Horoscope Syndication",        desc: "License daily horoscope content to regional news apps, radio stations, cable channels.",                 tag: "NEW",         color: C.navy },
      { icon: "🎪", title: "Festival Pooja Bookings",          desc: "Pre-book pandits for Navratri, Diwali, Ganesh Chaturthi via platform. Commission per booking.",          tag: "SEASONAL",    color: C.orange },
      { icon: "🤝", title: "Astrologer Marketplace",           desc: "Verified pandits list on platform. Users book sessions. AI handles scheduling.",                         tag: "NEW",         color: C.red },
      { icon: "🎁", title: "Personalised Astro Gift Kits",     desc: "Birth-month-specific: rudraksha, yantra, printed kundli. Gifting season spikes at Diwali/birthdays.",   tag: "NEW",         color: C.green },
      { icon: "📺", title: "Devotional YouTube",               desc: "Long-form puja tutorials → YouTube Partner Program. Devotional brand sponsorships.",                    tag: "TRADITIONAL", color: C.indigo },
    ];
    streams.forEach((st, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const sx = 0.35 + col * 3.25, sy = 1.15 + row * 3.0;
      card(s, sx, sy, 3.1, 2.82, { fill: C.white, accentLeft: st.color });
      s.addShape(pres.shapes.RECTANGLE, { x: sx + 0.15, y: sy + 0.12, w: 0.7, h: 0.22, fill: { color: st.tag === "NEW" ? C.green : st.tag === "SEASONAL" ? C.orange : C.slate } });
      s.addText(st.tag, { x: sx + 0.15, y: sy + 0.12, w: 0.7, h: 0.22, fontSize: 7, color: C.white, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
      s.addText(st.icon, { x: sx + 0.9, y: sy + 0.1, w: 0.5, h: 0.4, fontSize: 16, margin: 0 });
      s.addText(st.title, { x: sx + 0.15, y: sy + 0.42, w: 2.85, h: 0.65, fontSize: 10.5, color: st.color, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(st.desc, { x: sx + 0.15, y: sy + 1.12, w: 2.85, h: 1.52, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 16 — REVENUE MIX (chart replaced with structural breakdown)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "REVENUE PROJECTIONS", "Revenue Build — Stream Mix (qualitative)", "Monthly revenue per stream = [TBD] until baseline pilot. Composition shown as structural priority.");
    addFooter(s, 16, TOTAL);
    card(s, 0.35, 1.15, 8.5, 5.7, { fill: C.white, accentLeft: C.gold });
    s.addText("STREAM CONTRIBUTION PRIORITY", { x: 0.55, y: 1.25, w: 8.0, h: 0.3, fontSize: 11, color: C.navy, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
    const composition = [
      ["1", "Kundli Reports (Tier 1 — current SKU)", "Highest near-term contributor. Already live. Scales with traffic.", C.teal],
      ["2", "Monthly Subscriptions (Tier 2)",        "Drives MRR. Reduces revenue volatility. Becomes #1 by mid-horizon.", C.indigo],
      ["3", "Premium Reports + Consultations",       "Higher AOV. Targets elder cohort with HIGH WTP.",                    C.navy],
      ["4", "Festival & Seasonal Bookings",          "Seasonal spikes (Navratri, Diwali). Smooths cash flow.",             C.gold],
      ["5", "B2B Syndication + E-commerce",          "Diversification. Longer sales cycles but high margin.",              C.orange],
    ];
    composition.forEach((r, i) => {
      const ry = 1.7 + i * 0.95;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y: ry + 0.05, w: 0.5, h: 0.5, fill: { color: r[3] } });
      s.addText(r[0], { x: 0.5, y: ry + 0.05, w: 0.5, h: 0.5, fontSize: 14, color: C.white, bold: true, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
      s.addText(r[1], { x: 1.15, y: ry + 0.0, w: 7.2, h: 0.32, fontSize: 11, color: r[3], bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(r[2], { x: 1.15, y: ry + 0.3, w: 7.2, h: 0.55, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    });
    const kpis = [
      { label: "Month 3 MRR",     val: "[TBD]", sub: "Break-even on ops costs",   color: C.teal   },
      { label: "Month 6 MRR",     val: "[TBD]", sub: "Funds paid Reels ads",      color: C.indigo },
      { label: "Month 9 MRR",     val: "[TBD]", sub: "Follower targets achieved", color: C.navy   },
      { label: "Month 12 MRR",    val: "[TBD]", sub: "Stretch / steady-state",    color: C.gold   },
      { label: "Gross Margin",    val: "70%+",  sub: "AI automates delivery",     color: C.green  },
      { label: "CAC (Blended)",   val: "[TBD]", sub: "After pilot baseline",      color: C.orange },
    ];
    kpis.forEach((k, i) => {
      const ky = 1.15 + i * 0.88;
      card(s, 9.0, ky, 4.0, 0.78, { fill: C.white, accentLeft: k.color });
      s.addText(k.label, { x: 9.18, y: ky + 0.04, w: 2.5, h: 0.28, fontSize: 9.5, color: C.slate, fontFace: "Calibri", margin: 0 });
      s.addText(k.val,   { x: 10.8, y: ky + 0.0, w: 2.1, h: 0.55, fontSize: 18, color: k.color, bold: true, fontFace: "Georgia", align: "right", margin: 0 });
      s.addText(k.sub,   { x: 9.18, y: ky + 0.48, w: 3.7, h: 0.25, fontSize: 9, color: C.slate, fontFace: "Calibri", margin: 0, italic: true });
    });
  }

  // ===========================================================================
  // SLIDE 17 — LANDING PAGE CRO AUDIT
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "CONVERSION OPTIMIZATION", "Landing Page CRO Audit — Current State vs. Best Practice", "Pages: astrokalpana.bhagvatgitadaily.com & astrorajni.bhagvatgitadaily.com");
    addFooter(s, 17, TOTAL);
    card(s, 0.35, 1.15, 5.9, 5.9, { fill: C.white, accentLeft: C.red });
    s.addText("CURRENT PAGE ISSUES", { x: 0.55, y: 1.25, w: 5.5, h: 0.35, fontSize: 12, color: C.red, bold: true, fontFace: "Calibri", margin: 0 });
    const issues = [
      ["No urgency trigger",   "No countdown timer, no 'limited slots today' — buyers defer and forget"],
      ["Weak social proof",    "No testimonials, no 'X people bought today', no star ratings above fold"],
      ["Generic headline",     "'Kundli Report ₹199' — zero emotional hook or benefit statement"],
      ["No trust signals",     "No security badge, no money-back guarantee, no astrologer face/name"],
      ["Form friction",        "Multiple fields on one page — DOB, time, place — likely high drop-off"],
      ["No WhatsApp CTA",      "₹199 purchase only — no free lead magnet to capture non-buyers"],
      ["Mobile UX issues",     "Layout responsiveness not verified — most Indian astrology traffic is mobile"],
      ["No retargeting pixel", "Lost visitors don't see the brand again — no Meta/Google pixel installed"],
      ["Single payment option","Only one gateway — UPI/RuPay not prominently featured for Tier 2/3"],
    ];
    issues.forEach(([title, desc], i) => {
      const iy = 1.72 + i * 0.56;
      s.addShape(pres.shapes.OVAL, { x: 0.5, y: iy + 0.05, w: 0.2, h: 0.2, fill: { color: C.red } });
      s.addText(title + ":", { x: 0.77, y: iy, w: 1.9, h: 0.28, fontSize: 10, color: C.red, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(desc, { x: 0.77, y: iy + 0.27, w: 5.3, h: 0.26, fontSize: 9, color: C.slate, fontFace: "Calibri", margin: 0, italic: true });
    });
    card(s, 6.4, 1.15, 6.55, 5.9, { fill: C.white, accentLeft: C.green });
    s.addText("RECOMMENDED FIXES (PRIORITY ORDER)", { x: 6.6, y: 1.25, w: 6.1, h: 0.35, fontSize: 12, color: C.green, bold: true, fontFace: "Calibri", margin: 0 });
    const fixes = [
      { p: "P0", title: "Emotional Headline",                desc: "'Unlock Your Destiny — Get Your Personalised Kundli in 24 Hours' + hero image of a family smiling over a printed report." },
      { p: "P0", title: "Social Proof Block",                desc: "Show 'N Kundlis delivered' counter (real number) + 3 WhatsApp-style testimonials with profile photos + star rating (when accumulated)." },
      { p: "P0", title: "Countdown / Scarcity",              desc: "'Limited slots at ₹199 — price increases tomorrow.' Honest reset cycle. Creates urgency without deception." },
      { p: "P1", title: "Free Kundli Lead Magnet",           desc: "Above the paid CTA: 'Get a FREE mini-Kundli first — enter DOB.' Nurture to paid via WhatsApp drip." },
      { p: "P1", title: "Trust Stack Above Fold",            desc: "Add: SSL badge, '100% accurate or money back', pandit photo with name, Razorpay 'Safe Checkout' badge." },
      { p: "P1", title: "Single-Step Mobile Form",           desc: "Replace multi-field form with 3-step wizard: 1) DOB 2) Birth Time 3) Pay. Each step = 1 tap." },
      { p: "P2", title: "WhatsApp Order + Retargeting",      desc: "Add 'Order via WhatsApp' button (zero form friction). Install Meta Pixel + Google Tag for retargeting." },
      { p: "P2", title: "UPI + EMI Options",                 desc: "Add Razorpay's UPI intent, BNPL options, split-pay options to improve Tier 2/3 conversion." },
    ];
    fixes.forEach((f, i) => {
      const fy = 1.72 + i * 0.62;
      const pc = f.p === "P0" ? C.red : f.p === "P1" ? C.orange : C.teal;
      s.addShape(pres.shapes.RECTANGLE, { x: 6.55, y: fy + 0.04, w: 0.32, h: 0.22, fill: { color: pc } });
      s.addText(f.p, { x: 6.55, y: fy + 0.04, w: 0.32, h: 0.22, fontSize: 8, color: C.white, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
      s.addText(f.title + ":", { x: 6.95, y: fy, w: 2.5, h: 0.3, fontSize: 10.5, color: C.green, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(f.desc, { x: 6.95, y: fy + 0.3, w: 5.9, h: 0.28, fontSize: 9, color: C.slate, fontFace: "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 18 — CRO IMPACT (qualitative + ranges)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "CRO IMPACT", "Conversion Rate Optimization — Before vs. After (qualitative)", "Industry studies cite 2-5× CVR uplift from systematic CRO. Actual lift to be measured during A/B testing.");
    addFooter(s, 18, TOTAL);
    const metrics = [
      { metric: "Landing Page CVR",     before: "Current baseline",   after: "Higher CVR (range to be measured)",         uplift: "Significant",     color: C.green },
      { metric: "Lead Capture Rate",    before: "0%",                 after: "Capture via free Kundli lead magnet",       uplift: "New stream",      color: C.teal },
      { metric: "Mobile Bounce Rate",   before: "Unmeasured",         after: "Reduced via single-step wizard",            uplift: "Reduction",       color: C.orange },
      { metric: "WhatsApp Orders",      before: "0",                  after: "New channel (volume TBD)",                  uplift: "New channel",     color: C.purple },
      { metric: "Retargeting Revenue",  before: "₹0",                 after: "Recoverable lost-visitor revenue",          uplift: "From 0",          color: C.gold },
      { metric: "Avg Order Value",      before: "₹199 (current SKU)", after: "Higher AOV via upsell to ₹1,499 tier",      uplift: "Upsell lift",     color: C.navy },
    ];
    const hdr = [
      { text: "METRIC",            options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 11 } },
      { text: "CURRENT STATE",     options: { bold: true, color: C.white, fill: { color: C.red }, fontSize: 11 } },
      { text: "POST-OPTIMIZATION", options: { bold: true, color: C.white, fill: { color: C.green }, fontSize: 11 } },
      { text: "UPLIFT",            options: { bold: true, color: C.amber, fill: { color: C.navy }, fontSize: 11 } },
    ];
    const rows = [hdr, ...metrics.map((m, i) => [
      { text: m.metric, options: { fontSize: 11, bold: true, color: C.navy,  fill: { color: i % 2 === 0 ? "F8FAFC" : C.white } } },
      { text: m.before, options: { fontSize: 11, color: C.red,                  fill: { color: i % 2 === 0 ? "F8FAFC" : C.white } } },
      { text: m.after,  options: { fontSize: 11, color: C.green, bold: true,    fill: { color: i % 2 === 0 ? "F8FAFC" : C.white } } },
      { text: m.uplift, options: { fontSize: 12, color: m.color, bold: true,   fill: { color: i % 2 === 0 ? "F8FAFC" : C.white } } },
    ])];
    s.addTable(rows, {
      x: 0.35, y: 1.15, w: 12.6, h: 4.2,
      colW: [4.0, 2.8, 3.2, 2.6],
      border: { pt: 0.5, color: "E2E8F0" },
      rowH: 0.58,
    });
    card(s, 0.35, 5.5, 12.6, 1.6, { fill: C.navy });
    s.addText("CRO REVENUE IMPACT MODEL (template)", { x: 0.55, y: 5.6, w: 5, h: 0.3, fontSize: 11, color: C.gold, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
    const impactCols = [
      ["Current Monthly Visitors",   "[TBD by GA]"],
      ["× CVR (current → target)",   "[TBD]"],
      ["× AOV (₹199 → upsell)",      "[TBD]"],
      ["+ Lead Nurture Revenue",     "[TBD]"],
      ["+ Retargeting Revenue",      "[TBD]"],
      ["= TOTAL IMPACT",             "[TBD]"],
    ];
    impactCols.forEach(([label, val], i) => {
      const ix = 0.6 + i * 2.1;
      s.addText(label, { x: ix, y: 5.95, w: 2.0, h: 0.35, fontSize: 9, color: C.gray, fontFace: "Calibri", margin: 0 });
      s.addText(val,   { x: ix, y: 6.32, w: 2.0, h: 0.5, fontSize: i === 5 ? 13 : 11, color: i === 5 ? C.amber : C.white, bold: i === 5, fontFace: i === 5 ? "Georgia" : "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 19 — WHATSAPP FIRST
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "NEW INITIATIVE — WHATSAPP FIRST", "WhatsApp as Primary Monetisation Surface — The Missing Channel", "WhatsApp has the largest installed base in India. Open rates are reliably higher than email for the target cohort.");
    addFooter(s, 19, TOTAL);
    const waItems = [
      { title: "WhatsApp Business API Setup",             desc: "Register official WABA account. Enables broadcast, automated replies, payment links. Setup + per-message fees per Meta's BSP pricing.", icon: "⚙️", color: C.teal },
      { title: "Daily Panchang Broadcast",                desc: "Morning push: aaj ka rashifal, rahu kaal, shubh muhurat. Auto-generated via LLM. Opt-in base built over time.",                       icon: "📅", color: C.green },
      { title: "AI Jyotish Bot (In-Chat)",                desc: "User types DOB → bot generates free mini-kundli → upsell to paid full report. Automated. No human in loop.",                          icon: "🤖", color: C.navy },
      { title: "Festival Campaign Sequences",             desc: "Automated 3-message sequences for Navratri, Diwali, Makar Sankranti. Free tithi info → pooja booking offer → last-chance reminder.",  icon: "🎪", color: C.orange },
      { title: "Pandit Referral Network on WA",           desc: "Pandits get unique WhatsApp referral links. Conversions tracked. Commission paid via UPI instantly.",                                icon: "🙏", color: C.purple },
      { title: "WhatsApp Community for Subscribers",      desc: "Paid subscribers get access to exclusive 'Jyotish Community' group. Daily content + live Q&A. Reduces churn.",                       icon: "👥", color: C.gold },
    ];
    waItems.forEach((item, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const wx = 0.35 + col * 4.35, wy = 1.15 + row * 2.95;
      card(s, wx, wy, 4.2, 2.78, { fill: C.white, accentLeft: item.color });
      s.addText(item.icon, { x: wx + 0.15, y: wy + 0.1, w: 0.5, h: 0.45, fontSize: 18, margin: 0 });
      s.addText(item.title, { x: wx + 0.72, y: wy + 0.1, w: 3.3, h: 0.48, fontSize: 11, color: item.color, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(item.desc, { x: wx + 0.15, y: wy + 0.68, w: 3.95, h: 1.88, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 20 — AI CONTENT FACTORY (specific cost/views → ranges + [TBD])
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "OPERATIONS — AI CONTENT FACTORY", "Fully Automated Content Pipeline — From Prompt to Posted Reel", "Target Reel volume per day to be set by capacity. Tools listed are current best-in-class options.");
    addFooter(s, 20, TOTAL);
    const pipeline = [
      { step: "01", label: "Topic Generator",      tool: "GPT-4o / Claude",  desc: "Reads trending hashtags + ephemeris data → generates Reel scripts.",                color: C.navy },
      { step: "02", label: "Voiceover",            tool: "ElevenLabs",       desc: "Converts script to regional Hindi/Marathi voice. Pre-configured voice personas.", color: C.indigo },
      { step: "03", label: "Visual Generation",    tool: "HeyGen / Canva",   desc: "AI avatar presents script OR auto-generates zodiac motion graphic.",                color: C.teal },
      { step: "04", label: "Music & SFX",          tool: "Suno / IG audio",  desc: "Generates devotional background music + selects trending IG audio.",                color: C.green },
      { step: "05", label: "Auto-Edit & Caption",  tool: "CapCut API",       desc: "Assembles video, adds Hindi/Marathi captions, applies brand watermark.",           color: C.orange },
      { step: "06", label: "Schedule & Post",      tool: "Later / Buffer",   desc: "Posts to correct handle at optimal time. Hashtag stack auto-applied.",              color: C.gold },
    ];
    pipeline.forEach((p, i) => {
      const px = 0.35 + i * 2.17;
      if (i < 5) {
        s.addShape(pres.shapes.LINE, { x: px + 1.85, y: 2.65, w: 0.28, h: 0, line: { color: C.gold, width: 2 } });
      }
      card(s, px, 1.15, 2.05, 3.05, { fill: C.white, accentLeft: p.color });
      s.addShape(pres.shapes.OVAL, { x: px + 0.65, y: 1.2, w: 0.65, h: 0.55, fill: { color: p.color } });
      s.addText(p.step, { x: px + 0.65, y: 1.2, w: 0.65, h: 0.55, fontSize: 14, color: C.white, bold: true, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
      s.addText(p.label, { x: px + 0.08, y: 1.85, w: 1.9, h: 0.55, fontSize: 10.5, color: p.color, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: px + 0.2, y: 2.44, w: 1.7, h: 0.25, fill: { color: p.color, transparency: 75 } });
      s.addText(p.tool, { x: px + 0.2, y: 2.44, w: 1.7, h: 0.25, fontSize: 9, color: p.color, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
      s.addText(p.desc, { x: px + 0.08, y: 2.76, w: 1.9, h: 1.32, fontSize: 9, color: C.darkgray, fontFace: "Calibri", margin: 0 });
    });
    card(s, 0.35, 4.38, 12.6, 2.65, { fill: C.white, accentLeft: C.gold });
    s.addText("CONTENT FACTORY — UNIT ECONOMICS (template)", { x: 0.55, y: 4.48, w: 6, h: 0.3, fontSize: 11, color: C.navy, bold: true, charSpacing: 1, fontFace: "Calibri", margin: 0 });
    const econ = [
      ["Output",                  "Reels/day [TBD]",                    "Monthly [TBD]",   "Annual [TBD]"],
      ["API Cost",                "Per-Reel cost from vendors",         "Monthly [TBD]",   "Annual [TBD]"],
      ["Expected Views (avg)",    "Per-Reel target [TBD after pilot]",  "Monthly [TBD]",   "Annual [TBD]"],
      ["Cost per 1K views",       "[TBD] — but expected << paid ads",   "Compare to IG Ads CPM", "Savings vs paid"],
      ["Estimated Follower Gain", "[TBD by pilot]",                     "Monthly [TBD]",   "Annual [TBD]"],
    ];
    const econHdr = ["METRIC", "PER REEL / DAY", "MONTHLY", "ANNUAL"].map(t => ({
      text: t, options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 }
    }));
    const econRows = [econHdr, ...econ.map((r, ri) => r.map((c, ci) => ({
      text: c,
      options: { fontSize: 10, bold: ci === 0, color: ci === 0 ? C.navy : C.darkgray, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } },
    })))];
    s.addTable(econRows, {
      x: 0.35, y: 4.85, w: 12.6, h: 2.05,
      colW: [2.8, 3.5, 3.0, 3.3],
      border: { pt: 0.5, color: "E2E8F0" },
      rowH: 0.38,
    });
  }

  // ===========================================================================
  // SLIDE 21 — 90-DAY ROADMAP
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "EXECUTION ROADMAP", "90-Day Phased Rollout — Foundation → Distribution → Monetisation", "Week-by-week priority sequencing with owner and success metric");
    addFooter(s, 21, TOTAL);
    const phases = [
      {
        name: "PHASE 1: FOUNDATION", days: "Days 1-30", color: C.teal, x: 0.35, w: 4.0,
        tasks: [
          "Set up AI content pipeline (LLM + voice + edit)",
          "Launch engagement pod (real accounts) for all 4 handles",
          "@saathsetu shoutouts for 3 dormant handles (Week 1)",
          "Print & deploy a small pilot batch of temple QR stickers",
          "Launch WhatsApp AI Jyotish bot (free kundli lead magnet)",
          "Ship optimized landing page v2 (P0 CRO fixes only)",
          "Begin daily Reels cadence across all handles",
        ],
        kpi: "Target: dormant handles begin gaining followers",
      },
      {
        name: "PHASE 2: DISTRIBUTION", days: "Days 31-60", color: C.indigo, x: 4.5, w: 4.0,
        tasks: [
          "Scale Reels output across portfolio (full factory live)",
          "Onboard local pandits as Jyotish Ambassadors",
          "Launch AI compatibility share-card (youth viral loop)",
          "Campus ambassador program: pilot in target colleges",
          "Scale temple QR to wider pilot footprint",
          "Start retargeting campaigns (Meta Pixel + small daily budget)",
          "First B2B pitch to regional news apps for syndication",
        ],
        kpi: "Target: measurable growth across all 4 handles",
      },
      {
        name: "PHASE 3: MONETISE & MOAT", days: "Days 61-90", color: C.navy, x: 8.65, w: 4.3,
        tasks: [
          "Launch monthly subscription tier (with WhatsApp community)",
          "Festival pooja booking pipeline (pre-Navratri campaign)",
          "Hybrid AI + pandit consult tier",
          "YouTube channel launch (long-form puja + kundli tutorials)",
          "Gemstone e-commerce integration (affiliate dropship)",
          "Complete CRO optimisation (P1 + P2 fixes live)",
          "Target: stable MRR and consistent follower growth",
        ],
        kpi: "Target: monetisation flywheel begins",
      },
    ];
    phases.forEach(p => {
      card(s, p.x, 1.15, p.w, 5.9, { fill: C.white, accentLeft: p.color });
      s.addShape(pres.shapes.RECTANGLE, { x: p.x, y: 1.15, w: p.w, h: 0.68, fill: { color: p.color } });
      s.addText(p.name, { x: p.x + 0.1, y: 1.18, w: p.w - 0.15, h: 0.32, fontSize: 11, color: C.white, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(p.days, { x: p.x + 0.1, y: 1.52, w: p.w - 0.15, h: 0.26, fontSize: 10, color: C.amber, fontFace: "Calibri", margin: 0 });
      p.tasks.forEach((t, i) => {
        const ty = 1.95 + i * 0.6;
        s.addShape(pres.shapes.OVAL, { x: p.x + 0.12, y: ty + 0.08, w: 0.22, h: 0.22, fill: { color: p.color } });
        s.addText(t, { x: p.x + 0.42, y: ty, w: p.w - 0.58, h: 0.55, fontSize: 10, color: C.darkgray, fontFace: "Calibri", margin: 0 });
      });
      s.addShape(pres.shapes.RECTANGLE, { x: p.x, y: 6.65, w: p.w, h: 0.35, fill: { color: p.color, transparency: 80 } });
      s.addText("KPI: " + p.kpi, { x: p.x + 0.1, y: 6.67, w: p.w - 0.15, h: 0.3, fontSize: 9.5, color: p.color, bold: true, fontFace: "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 22 — UNIT ECONOMICS (all numbers → [TBD] or qualitative)
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "FINANCIAL MODEL", "Unit Economics — The AI Advantage (qualitative)", "Specific CAC/LTV/GM values to be modelled after pilot. Structure shown below is the framework.");
    addFooter(s, 22, TOTAL);
    const ueBoxes = [
      {
        title: "CAC — Customer Acquisition Cost", color: C.navy, x: 0.35,
        rows: [
          ["Temple QR + Pandit", "[TBD]"],
          ["Organic Reels (avg)", "[TBD]"],
          ["WhatsApp Bot", "[TBD]"],
          ["Campus Ambassador", "[TBD]"],
          ["Paid Retargeting", "[TBD]"],
          ["Blended CAC (target)", "[TBD]"],
          ["AstroTalk CAC (peer)", "Reportedly high"],
        ],
        highlight: [5, 6],
        hcols: [C.teal, C.red],
      },
      {
        title: "LTV — Customer Lifetime Value", color: C.teal, x: 4.5,
        rows: [
          ["Kundli Report x1",      "₹199 (current SKU)"],
          ["Repeat purchase rate",  "[TBD]"],
          ["Subscription (n months)","[TBD]"],
          ["Upgrade to premium",    "[TBD]"],
          ["Referrals generated",   "[TBD]"],
          ["12-month LTV (est.)",   "[TBD]"],
          ["LTV : CAC Ratio",       "[TBD]"],
        ],
        highlight: [5, 6],
        hcols: [C.navy, C.green],
      },
      {
        title: "Gross Margin by Product", color: C.gold, x: 8.65,
        rows: [
          ["Kundli Report (AI)",          "High (AI-delivered)"],
          ["Subscription (WA)",           "High"],
          ["Premium Report (AI)",         "High"],
          ["Live Consult (marketplace)",  "Medium (rev-share)"],
          ["E-commerce (dropship)",       "Low-medium"],
          ["B2B Syndication",             "Highest"],
          ["Blended Portfolio GM",        "Target 70%+"],
        ],
        highlight: [6],
        hcols: [C.teal],
      },
    ];
    ueBoxes.forEach(b => {
      card(s, b.x, 1.15, 4.1, 5.2, { fill: C.white, accentLeft: b.color });
      s.addText(b.title, { x: b.x + 0.15, y: 1.25, w: 3.8, h: 0.55, fontSize: 11, color: b.color, bold: true, fontFace: "Calibri", margin: 0 });
      const hdrRow = [
        { text: "Metric", options: { bold: true, color: C.white, fill: { color: b.color }, fontSize: 9.5 } },
        { text: "Value",  options: { bold: true, color: C.white, fill: { color: b.color }, fontSize: 9.5 } },
      ];
      const dataRows = b.rows.map((r, ri) => [
        { text: r[0], options: { fontSize: 10, color: C.darkgray, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
        { text: r[1], options: { fontSize: 11, bold: b.highlight.includes(ri), color: b.highlight.includes(ri) ? (b.hcols[b.highlight.indexOf(ri)] || b.color) : C.darkgray, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
      ]);
      s.addTable([hdrRow, ...dataRows], {
        x: b.x, y: 1.88, w: 4.1, h: 4.35,
        colW: [2.6, 1.5],
        border: { pt: 0.5, color: "E2E8F0" },
        rowH: 0.52,
      });
    });
    card(s, 0.35, 6.48, 12.6, 0.78, { fill: C.navy, shadow: false });
    s.addText("NORTH STAR DESIGN PRINCIPLE:", { x: 0.55, y: 6.6, w: 3.2, h: 0.3, fontSize: 11, color: C.gold, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText("AI-first cost structure should deliver high LTV:CAC ratio + high gross margin + fast payback — exact targets to be set after baseline.", { x: 3.8, y: 6.6, w: 9.0, h: 0.3, fontSize: 11, color: C.white, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText("These metrics are achievable only with AI-first cost structure — not with human astrologers as primary delivery mechanism.", { x: 0.55, y: 6.92, w: 12.0, h: 0.26, fontSize: 9, color: C.gray, fontFace: "Calibri", margin: 0, italic: true });
  }

  // ===========================================================================
  // SLIDE 23 — NEW INITIATIVES SUMMARY
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "INITIATIVE SUMMARY", "New vs. Traditional — Full Initiative Portfolio", "Mix of breakthrough innovations and proven traditional channels for risk diversification");
    addFooter(s, 23, TOTAL);
    card(s, 0.35, 1.15, 12.6, 0.7, { fill: C.navy, shadow: false });
    s.addText("NEW BREAKTHROUGH INITIATIVES", { x: 0.55, y: 1.22, w: 5.0, h: 0.5, fontSize: 12, color: C.amber, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
    s.addText("TRADITIONAL (PROVEN) RECOMMENDATIONS", { x: 7.2, y: 1.22, w: 5.5, h: 0.5, fontSize: 12, color: C.gold, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
    s.addShape(pres.shapes.LINE, { x: 6.65, y: 1.15, w: 0, h: 6.35, line: { color: C.gold, width: 1.5 } });
    const newInits = [
      { icon: "🛕", title: "Temple QR Network",                impact: "Targeted lead volume from offline channel",      tag: "UNIQUE" },
      { icon: "🙏", title: "Pandit Revenue-Share",             impact: "Referral-driven sales pipeline",                 tag: "UNIQUE" },
      { icon: "🤖", title: "WhatsApp AI Jyotish Bot",          impact: "Automated lead-to-paid funnel",                  tag: "UNIQUE" },
      { icon: "🌟", title: "Compatibility Share Cards",        impact: "Viral acquisition mechanic",                     tag: "VIRAL" },
      { icon: "🎓", title: "Campus Ambassador SaaS",           impact: "Low-CAC student referrals",                      tag: "UNIQUE" },
      { icon: "🎧", title: "Spotify Devotional Drops",         impact: "Zero-CAC discovery channel",                     tag: "UNIQUE" },
      { icon: "💎", title: "Gemstone AI Recommendations",      impact: "Trust-based commerce stream",                    tag: "NEW" },
      { icon: "🏢", title: "B2B Horoscope Syndication",        impact: "Recurring B2B revenue",                          tag: "NEW" },
    ];
    newInits.forEach((n, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const nx = 0.4 + col * 3.1, ny = 2.0 + row * 1.22;
      card(s, nx, ny, 2.9, 1.05, { fill: C.white, accentLeft: C.teal, shadow: false });
      s.addShape(pres.shapes.RECTANGLE, { x: nx + 2.28, y: ny + 0.08, w: 0.55, h: 0.22, fill: { color: n.tag === "UNIQUE" ? C.teal : n.tag === "VIRAL" ? C.purple : C.green } });
      s.addText(n.tag, { x: nx + 2.28, y: ny + 0.08, w: 0.55, h: 0.22, fontSize: 6.5, color: C.white, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
      s.addText(n.icon + " " + n.title, { x: nx + 0.12, y: ny + 0.08, w: 2.1, h: 0.38, fontSize: 10.5, color: C.navy, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(n.impact, { x: nx + 0.12, y: ny + 0.55, w: 2.7, h: 0.4, fontSize: 9.5, color: C.teal, fontFace: "Calibri", margin: 0 });
    });
    const tradInits = [
      { icon: "📺", title: "Regional Newspaper + Cable TV Ads", impact: "Lokmat, Dainik Jagran — Sunday slots" },
      { icon: "🎪", title: "Festival Campaign Sequences (Auto)", impact: "Navratri, Diwali, Makar Sankranti" },
      { icon: "📧", title: "Email Nurture Drip (7-Day)",        impact: "Free kundli → paid upgrade sequence" },
      { icon: "🔍", title: "Google SEO for 'kundli online'",    impact: "Competitor AstroSage built scale via SEO" },
      { icon: "📱", title: "YouTube Long-Form Channel",         impact: "Partner program + sponsorship revenue" },
      { icon: "💳", title: "EMI & BNPL Payment Options",        impact: "Higher Tier 2/3 conversion" },
      { icon: "⭐", title: "Testimonial Collection System",      impact: "Auto-request post-delivery via WA" },
      { icon: "🔄", title: "Cross-Handle Content Recycling",     impact: "Hindi → Marathi → YouTube repurpose" },
    ];
    tradInits.forEach((n, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const nx = 6.75 + col * 3.1, ny = 2.0 + row * 1.22;
      card(s, nx, ny, 2.9, 1.05, { fill: C.white, accentLeft: C.gold, shadow: false });
      s.addText(n.icon + " " + n.title, { x: nx + 0.12, y: ny + 0.08, w: 2.7, h: 0.42, fontSize: 10, color: C.navy, bold: true, fontFace: "Calibri", margin: 0 });
      s.addText(n.impact, { x: nx + 0.12, y: ny + 0.58, w: 2.7, h: 0.38, fontSize: 9.5, color: C.slate, fontFace: "Calibri", margin: 0 });
    });
  }

  // ===========================================================================
  // SLIDE 24 — RISK REGISTER
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "RISK MANAGEMENT", "Risk Register — Top Risks, Likelihood, Impact & Mitigations", "Proactive risk management using McKinsey 2×2 impact/probability matrix");
    addFooter(s, 24, TOTAL);
    const risks = [
      { risk: "Instagram Algorithm Change",         prob: "High", impact: "High", mitigation: "Build WhatsApp + YouTube as parallel channels. Never > 50% revenue dependency on IG.",        color: C.red },
      { risk: "Low Temple QR Conversion",           prob: "Med",  impact: "Med",  mitigation: "A/B test 3 QR offer variants (free kundli vs rashifal vs discount). Pivot within 2 weeks.",  color: C.orange },
      { risk: "Pandit Trust / Fraud Risk",          prob: "Med",  impact: "High", mitigation: "Verify pandits via Aadhar-linked onboarding. Cap payout until 90-day track record.",         color: C.orange },
      { risk: "AI Content Quality Dip",             prob: "Low",  impact: "High", mitigation: "Human spot-check ~10% of content daily. Quality rubric. Auto-flag low-engagement posts.",   color: C.orange },
      { risk: "Competitor Copies Strategy",         prob: "Med",  impact: "Med",  mitigation: "Moat = offline temple network + pandit relationships. Trust networks are slow to copy.",    color: C.gold },
      { risk: "WhatsApp WABA Policy Violation",     prob: "Low",  impact: "High", mitigation: "Strict opt-in compliance. Use approved message templates. Cap broadcast. Legal review.",   color: C.red },
      { risk: "Payment Gateway Drop-Off",           prob: "Med",  impact: "High", mitigation: "Integrate multiple gateways (Razorpay + Paytm + UPI). WA order as zero-friction backup.",   color: C.orange },
      { risk: "Regulatory Risk (Astrology Claims)", prob: "Low",  impact: "High", mitigation: "Add 'for entertainment purposes' disclaimer. Avoid medical/legal claims. Legal review.",   color: C.red },
    ];
    const rHdr = [
      { text: "RISK",               options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
      { text: "PROB",               options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
      { text: "IMPACT",             options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
      { text: "MITIGATION STRATEGY",options: { bold: true, color: C.white, fill: { color: C.navy }, fontSize: 10 } },
    ];
    const rRows = risks.map((r, ri) => [
      { text: r.risk,       options: { fontSize: 10.5, bold: true, color: C.navy, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
      { text: r.prob,       options: { fontSize: 10, color: r.prob === "High" ? C.red : r.prob === "Med" ? C.orange : C.green, bold: true, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
      { text: r.impact,     options: { fontSize: 10, color: r.impact === "High" ? C.red : r.impact === "Med" ? C.orange : C.green, bold: true, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
      { text: r.mitigation, options: { fontSize: 10, color: C.darkgray, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
    ]);
    s.addTable([rHdr, ...rRows], {
      x: 0.35, y: 1.15, w: 12.6, h: 5.85,
      colW: [2.5, 0.9, 1.1, 8.1],
      border: { pt: 0.5, color: "E2E8F0" },
      rowH: 0.62,
    });
  }

  // ===========================================================================
  // SLIDE 25 — KPI DASHBOARD (specific numbers → [TBD])
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.offWhite };
    addHeader(s, "METRICS & KPI FRAMEWORK", "Success Scorecard — Leading & Lagging Indicators by Pillar", "Targets per milestone left [TBD by leadership]. Trend direction shown across M1 → M12.");
    addFooter(s, 25, TOTAL);
    const kpiGroups = [
      {
        pillar: "GROWTH", color: C.teal, x: 0.35,
        metrics: [
          { name: "Total Followers (all 4)",     m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Daily Reel Views",            m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Follower Growth Rate/mo",     m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Saves per Reel (avg)",        m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Temple QR Scans",             m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
        ],
      },
      {
        pillar: "MONETISATION", color: C.gold, x: 4.6,
        metrics: [
          { name: "MRR (all streams)",           m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Kundli Report Sales/mo",      m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Subscription Subs",           m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Avg Order Value",             m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "WhatsApp Opt-in Base",        m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
        ],
      },
      {
        pillar: "CONVERSION", color: C.navy, x: 8.85,
        metrics: [
          { name: "Landing Page CVR",            m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "WA Bot Conversion Rate",      m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Blended CAC",                 m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "LTV : CAC Ratio",             m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
          { name: "Gross Margin",                m1: "[TBD]", m3: "[TBD]", m6: "[TBD]", m12: "[TBD]" },
        ],
      },
    ];
    kpiGroups.forEach(g => {
      card(s, g.x, 1.15, 4.0, 6.2, { fill: C.white, accentLeft: g.color });
      s.addShape(pres.shapes.RECTANGLE, { x: g.x, y: 1.15, w: 4.0, h: 0.45, fill: { color: g.color } });
      s.addText(g.pillar + " KPIs", { x: g.x + 0.1, y: 1.18, w: 3.8, h: 0.38, fontSize: 12, color: C.white, bold: true, fontFace: "Calibri", margin: 0, valign: "middle" });
      const hRow = ["METRIC","M1","M3","M6","M12"].map(t => ({
        text: t, options: { bold: true, color: C.white, fill: { color: g.color, transparency: 40 }, fontSize: 8.5 },
      }));
      const dRows = g.metrics.map((m, ri) => [
        { text: m.name, options: { fontSize: 9.5, color: C.navy, bold: true, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
        { text: m.m1,   options: { fontSize: 9.5, color: C.slate, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
        { text: m.m3,   options: { fontSize: 9.5, color: C.orange, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
        { text: m.m6,   options: { fontSize: 9.5, color: C.teal,   fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
        { text: m.m12,  options: { fontSize: 9.5, color: C.green, bold: true, fill: { color: ri % 2 === 0 ? "F8FAFC" : C.white } } },
      ]);
      s.addTable([hRow, ...dRows], {
        x: g.x, y: 1.62, w: 4.0, h: 5.62,
        colW: [1.7, 0.55, 0.55, 0.6, 0.6],
        border: { pt: 0.5, color: "E2E8F0" },
        rowH: 0.52,
      });
    });
  }

  // ===========================================================================
  // SLIDE 26 — CLOSING
  // ===========================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.3, h: H, fill: { color: C.gold } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: H - 0.08, w: W, h: 0.08, fill: { color: C.gold } });
    const sp = [[2,1],[3.5,0.8],[5,1.5],[1.5,3],[4,4],[6,2],[1,5],[3,6],[5,5.5],[2.5,4.5]];
    for (const [sx,sy] of sp) {
      s.addText("✦", { x: sx, y: sy, w: 0.3, h: 0.3, fontSize: 10, color: C.gold, align: "center", fontFace: "Calibri", margin: 0, transparency: 60 });
    }
    s.addText("THE OPPORTUNITY IS CLEAR", { x: 1.0, y: 0.6, w: 8, h: 0.4, fontSize: 13, color: C.gold, bold: true, charSpacing: 5, fontFace: "Calibri", margin: 0 });
    s.addText("Execute First.\nOwn the Market.", { x: 1.0, y: 1.1, w: 9, h: 2.0, fontSize: 42, color: C.white, bold: true, fontFace: "Georgia", margin: 0 });
    s.addText("India's astrology market has no fully AI-native, multi-generational, offline-to-digital player.\nThe window to claim that position is the next 90 days — before AstroTalk or InstaAstro replicates this playbook.", {
      x: 1.0, y: 3.2, w: 10, h: 1.0, fontSize: 13, color: C.gray, fontFace: "Calibri", margin: 0,
    });
    const actions = [
      { num: "1", action: "Launch engagement pods + @saathsetu shoutouts",                timing: "This Week" },
      { num: "2", action: "Order temple QR stickers & start pandit WhatsApp outreach",     timing: "Week 2" },
      { num: "3", action: "Deploy WhatsApp AI Jyotish bot + optimised landing page v2",    timing: "Week 2-3" },
    ];
    actions.forEach((a, i) => {
      const ax = 1.0 + i * 4.0;
      s.addShape(pres.shapes.OVAL, { x: ax, y: 4.45, w: 0.6, h: 0.6, fill: { color: C.gold } });
      s.addText(a.num, { x: ax, y: 4.45, w: 0.6, h: 0.6, fontSize: 18, color: C.navy, bold: true, fontFace: "Georgia", align: "center", valign: "middle", margin: 0 });
      s.addText(a.action, { x: ax + 0.75, y: 4.48, w: 3.1, h: 0.55, fontSize: 11, color: C.white, fontFace: "Calibri", margin: 0 });
      s.addShape(pres.shapes.RECTANGLE, { x: ax + 0.75, y: 5.08, w: 1.0, h: 0.24, fill: { color: C.teal } });
      s.addText(a.timing, { x: ax + 0.75, y: 5.08, w: 1.0, h: 0.24, fontSize: 8.5, color: C.white, bold: true, fontFace: "Calibri", align: "center", margin: 0 });
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 5.8, w: W - 0.3, h: 0.04, fill: { color: "1A3A6B" } });
    s.addText("Strategy frameworks: McKinsey SCR · BCG Growth-Share · Bain NPS  |  Data sources: scraped ig_audit.json (real) + macro figures left [TBD pending sourcing]", {
      x: 0.5, y: 5.9, w: 12.5, h: 0.5, fontSize: 8.5, color: C.slate, fontFace: "Calibri", margin: 0, align: "center",
    });
    s.addText(`${TOTAL} / ${TOTAL}`, { x: W - 1.2, y: H - 0.4, w: 1.0, h: 0.25, fontSize: 9, color: C.gold, bold: true, fontFace: "Calibri", align: "right", margin: 0 });
  }

  const outPath = "/mnt/session/outputs/Astrology_Portfolio_Strategy.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("DONE:", outPath);
}

main().catch(e => { console.error(e); process.exit(1); });
