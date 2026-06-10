// ============================================================================
//  UDAAN 2.0 — "Breaking Bihar's Industrial Stagnation"
//  Board-grade government strategy deck.  1 title + 10 content slides.
// ============================================================================
const pptxgen = require("pptxgenjs");
const fs = require("fs");

const A = "/workspace/deck/assets";       // icon dir
const ic = (k, c) => `${A}/${k}_${c}.png`; // icon path helper

// ----------------------------------------------------------------------------
//  PALETTE  (3 brand colours + neutrals)
// ----------------------------------------------------------------------------
const NAVY   = "0F2A43";   // deep navy  (dominant)
const NAVY2  = "1B3E5C";   // panel navy
const TEAL   = "0E8C84";   // teal       (secondary)
const TEALD  = "0B6F69";   // deep teal
const AMBER  = "E0901F";   // amber      (sharp accent)
const AMBERD = "C57A12";

const PAPER  = "F4F6F8";   // content background
const CARD   = "FFFFFF";
const GRID   = "E3E8EC";
const LINE   = "CBD5DD";
const MUTED  = "6B7C8A";
const INK    = "1B2B38";
const TEALBG = "E4F1F0";
const AMBERBG= "FBEBD3";
const NAVYBG = "E7ECF1";

const HEAD = "Bebas Neue";
const BODY = "PT Sans";

const W = 13.333, Hh = 7.5;
const ML = 0.55, MR = 0.55;
const USABLE = W - ML - MR;

const sh = () => ({ type: "outer", color: "0F2A43", blur: 9, offset: 3, angle: 90, opacity: 0.16 });
const shS = () => ({ type: "outer", color: "0F2A43", blur: 5, offset: 2, angle: 90, opacity: 0.12 });

let pres = new pptxgen();
pres.defineLayout({ name: "WIDE", width: W, height: Hh });
pres.layout = "WIDE";
pres.author = "GILP Fellowship 2026 submission";
pres.title  = "Breaking Bihar's Industrial Stagnation — UDAAN 2.0";

// ----------------------------------------------------------------------------
//  SHARED HELPERS
// ----------------------------------------------------------------------------
function bg(slide, color) { slide.background = { color }; }

function header(slide, kicker, title, pageNo, kickerColor = TEAL) {
  // kicker
  slide.addText(kicker.toUpperCase(), {
    x: ML, y: 0.34, w: 9.5, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 11, bold: true, color: kickerColor,
    charSpacing: 2, align: "left", valign: "middle",
  });
  // title
  slide.addText(title.toUpperCase(), {
    x: ML, y: 0.58, w: 10.6, h: 0.66, margin: 0,
    fontFace: HEAD, fontSize: 32, color: NAVY, charSpacing: 0.5,
    align: "left", valign: "middle",
  });
  // wordmark + page number (top right)
  slide.addText([
    { text: "UDAAN ", options: { color: NAVY, bold: true } },
    { text: "2.0", options: { color: AMBER, bold: true } },
  ], { x: W - MR - 2.6, y: 0.30, w: 2.6, h: 0.3, margin: 0, fontFace: BODY, fontSize: 12, align: "right", valign: "middle" });
  slide.addText(`${String(pageNo).padStart(2, "0")} / 10`, {
    x: W - MR - 2.6, y: 0.60, w: 2.6, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 10, color: MUTED, align: "right", valign: "middle",
  });
}

function sourceLine(slide, txt) {
  slide.addText([
    { text: "Source:  ", options: { bold: true, color: MUTED } },
    { text: txt, options: { color: MUTED } },
  ], { x: ML, y: Hh - 0.36, w: USABLE, h: 0.26, margin: 0, fontFace: BODY, fontSize: 8.5, align: "left", valign: "middle" });
}

function iconCircle(slide, key, x, y, dia, circleColor, iconColor = "white", pad = 0.22) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: dia, h: dia, fill: { color: circleColor }, line: { type: "none" } });
  const ip = dia * pad;
  slide.addImage({ path: ic(key, iconColor), x: x + ip, y: y + ip, w: dia - 2 * ip, h: dia - 2 * ip });
}

function takeawayBanner(slide, y, label, txt, fill = NAVY) {
  slide.addShape(pres.shapes.RECTANGLE, { x: ML, y, w: USABLE, h: 0.62, fill: { color: fill }, line: { type: "none" }, shadow: shS() });
  slide.addShape(pres.shapes.RECTANGLE, { x: ML, y, w: 0.09, h: 0.62, fill: { color: AMBER }, line: { type: "none" } });
  slide.addText([
    { text: label + "   ", options: { bold: true, color: AMBER, fontFace: BODY, fontSize: 11, charSpacing: 1 } },
    { text: txt, options: { color: "FFFFFF", fontFace: BODY, fontSize: 12.5, bold: true } },
  ], { x: ML + 0.28, y, w: USABLE - 0.5, h: 0.62, margin: 0, align: "left", valign: "middle" });
}

// pillar tracker strip ------------------------------------------------------
const PILLARS = [
  { id: "P1", name: "LAND & SHEDS" },
  { id: "P2", name: "WOMEN + RETURNEE" },
  { id: "P3", name: "OBOP CLUSTERS" },
  { id: "P4", name: "SKILLS-TO-JOB" },
  { id: "P5", name: "FINANCE + GOV" },
];
function tracker(slide, active, y) {
  const gap = 0.16;
  const segW = (USABLE - gap * 4) / 5;
  PILLARS.forEach((p, i) => {
    const x = ML + i * (segW + gap);
    const on = i === active;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: segW, h: 0.5, rectRadius: 0.06,
      fill: { color: on ? TEAL : "FFFFFF" },
      line: { color: on ? TEAL : LINE, width: 1 },
      shadow: on ? shS() : undefined,
    });
    slide.addText([
      { text: p.id + "  ", options: { bold: true, color: on ? "FFFFFF" : NAVY, fontSize: 11.5 } },
      { text: p.name, options: { bold: on, color: on ? "F1FBFA" : MUTED, fontSize: 8 } },
    ], { x: x + 0.06, y, w: segW - 0.1, h: 0.5, margin: 0, fontFace: BODY, align: "center", valign: "middle" });
  });
}

// ============================================================================
//  SLIDE 1 — TITLE
// ============================================================================
(function titleSlide() {
  const s = pres.addSlide();
  bg(s, NAVY);
  // subtle motif: large faint upward chevrons on the right
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: Hh, fill: { color: AMBER }, line: { type: "none" } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.18, y: 0, w: 0.06, h: Hh, fill: { color: TEAL }, line: { type: "none" } });

  // top row: programme tag + audience
  s.addText("GILP FELLOWSHIP 2026   ·   GOVERNMENT OF BIHAR   ·   24-MONTH INDUSTRIAL FRAMEWORK", {
    x: 0.7, y: 0.55, w: 12, h: 0.3, margin: 0, fontFace: BODY, fontSize: 11, bold: true, color: "9DB7CC", charSpacing: 1.5,
  });

  // wordmark
  s.addText([
    { text: "UDAAN ", options: { color: "FFFFFF", bold: true } },
    { text: "2.0", options: { color: AMBER, bold: true } },
  ], { x: 0.7, y: 1.0, w: 6, h: 0.5, margin: 0, fontFace: BODY, fontSize: 17 });

  // title
  s.addText("BREAKING BIHAR'S\nINDUSTRIAL STAGNATION", {
    x: 0.66, y: 1.42, w: 12, h: 1.9, margin: 0, fontFace: HEAD, fontSize: 62, color: "FFFFFF", charSpacing: 0.5, lineSpacingMultiple: 0.92,
  });

  s.addText("Unleashing District-level Agro-manufacturing & Advanced iNdustrialisation", {
    x: 0.7, y: 3.34, w: 11.6, h: 0.4, margin: 0, fontFace: BODY, fontSize: 15, italic: true, color: "CFE6E4",
  });

  // governing-thought spine (full width, above chips)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 3.85, w: 0.06, h: 0.98, fill: { color: TEAL }, line: { type: "none" } });
  s.addText([
    { text: "Bihar's stagnation is an execution gap, not a policy gap.   ", options: { bold: true, color: "FFFFFF", fontSize: 13.5 } },
    { text: "For the first time in two decades the assets, the money and the mandate are aligned — UDAAN 2.0 wires proven models onto Bihar's own delivery rails to convert approved paper into operating factories within 24 months.", options: { color: "C7D6E2", fontSize: 12 } },
  ], { x: 0.92, y: 3.85, w: 11.7, h: 0.98, margin: 0, fontFace: BODY, valign: "top", lineSpacingMultiple: 1.06 });

  // three stat chips (row, below governing thought)
  const chips = [
    { n: "7%", l: "mfg share of GSDP — vs 17% nationally" },
    { n: "~50 Mn", l: "out-migrants — 2x since 2005" },
    { n: "24 mo", l: "paper-to-factory delivery window" },
  ];
  const cg = 0.25, cw = (W - 1.4 - cg * 2) / 3, cx0 = 0.7;
  chips.forEach((c, i) => {
    const x = cx0 + i * (cw + cg);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.98, w: cw, h: 1.2, rectRadius: 0.07, fill: { color: NAVY2 }, line: { color: "27496B", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.98, w: 0.08, h: 1.2, fill: { color: AMBER }, line: { type: "none" } });
    s.addText(c.n, { x: x + 0.26, y: 5.12, w: cw - 0.4, h: 0.55, margin: 0, fontFace: HEAD, fontSize: 36, color: AMBER, align: "left", valign: "middle" });
    s.addText(c.l, { x: x + 0.28, y: 5.66, w: cw - 0.5, h: 0.42, margin: 0, fontFace: BODY, fontSize: 11, color: "C7D6E2", align: "left", valign: "top", lineSpacingMultiple: 0.95 });
  });

  // footer band
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 6.62, w: W, h: 0.88, fill: { color: "0A1F33" }, line: { type: "none" } });
  s.addText([
    { text: "PREPARED FOR  ", options: { bold: true, color: TEAL, fontSize: 9.5, charSpacing: 1 } },
    { text: "Government of Bihar senior officials + GILP 2026 jury     ", options: { color: "AEC4D6", fontSize: 10.5 } },
    { text: "TONE  ", options: { bold: true, color: TEAL, fontSize: 9.5, charSpacing: 1 } },
    { text: "Non-partisan · governance-focused · citizen-centric · execution-oriented", options: { color: "AEC4D6", fontSize: 10.5 } },
  ], { x: 0.7, y: 6.66, w: 12, h: 0.36, margin: 0, fontFace: BODY, valign: "middle" });
  s.addText([
    { text: "AI-usage disclosure:  ", options: { bold: true, color: "8FA8BC", fontSize: 9 } },
    { text: "Drafting and layout were AI-assisted; every figure was human-verified against the cited public sources (see Slide 10 references). No data was generated by the model.", options: { color: "8FA8BC", fontSize: 9, italic: true } },
  ], { x: 0.7, y: 7.04, w: 12, h: 0.34, margin: 0, fontFace: BODY, valign: "middle" });
})();

// ============================================================================
//  SLIDE 2 — CONTEXT: GROWTH–DEVELOPMENT PARADOX + WHY NOW
// ============================================================================
(function contextSlide() {
  const s = pres.addSlide();
  bg(s, PAPER);
  header(s, "Context · the case for action", "The Growth–Development Paradox — and Why Now", 1);

  // ---- LEFT: chart "Bihar vs national benchmark (India = 100)" ----
  const cx = ML, cy = 1.45, cwd = 5.55, chh = 2.47;
  s.addShape(pres.shapes.RECTANGLE, { x: cx, y: cy, w: cwd, h: chh, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
  s.addText("BIHAR vs THE NATIONAL BENCHMARK", { x: cx + 0.2, y: cy + 0.12, w: cwd - 1.6, h: 0.28, margin: 0, fontFace: BODY, fontSize: 11, bold: true, color: NAVY });
  s.addText("Bihar's level as % of India", { x: cx + 0.2, y: cy + 0.40, w: cwd - 1.6, h: 0.22, margin: 0, fontFace: BODY, fontSize: 9, color: MUTED });
  // benchmark chip (top-right of card)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx + cwd - 1.35, y: cy + 0.14, w: 1.18, h: 0.34, rectRadius: 0.05, fill: { color: AMBERBG }, line: { color: AMBER, width: 1 } });
  s.addText("INDIA = 100", { x: cx + cwd - 1.35, y: cy + 0.14, w: 1.18, h: 0.34, margin: 0, fontFace: BODY, fontSize: 9, bold: true, color: AMBERD, align: "center", valign: "middle" });
  s.addChart(pres.charts.BAR, [{
    name: "Bihar", labels: ["Mfg % of GSDP", "Mfg workforce", "Per-capita NSDP"], values: [41, 48, 32],
  }], {
    x: cx + 0.1, y: cy + 0.62, w: cwd - 0.25, h: chh - 0.78, barDir: "bar",
    chartColors: [TEAL], valAxisMinVal: 0, valAxisMaxVal: 100,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 9.5, catAxisLabelFontFace: BODY,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 8, valAxisLabelFontFace: BODY,
    valGridLine: { color: GRID, size: 0.5 }, catGridLine: { style: "none" },
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: NAVY, dataLabelFontFace: BODY, dataLabelFontSize: 10, dataLabelFontBold: true,
    dataLabelFormatCode: '0"%"', showLegend: false, barGapWidthPct: 55,
  });

  // ---- RIGHT TOP: two paradox callouts ----
  const rx = ML + cwd + 0.3, rw = USABLE - cwd - 0.3;
  // callout A
  const calW = (rw - 0.25) / 2;
  function paradox(x, big, unit, label, accent) {
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: calW, h: 1.42, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: calW, h: 0.09, fill: { color: accent }, line: { type: "none" } });
    s.addText([{ text: big, options: { fontFace: HEAD, fontSize: 33, color: NAVY } }, { text: " " + unit, options: { fontFace: BODY, fontSize: 12, color: accent, bold: true } }],
      { x: x + 0.18, y: 1.62, w: calW - 0.3, h: 0.6, margin: 0, valign: "middle", align: "left" });
    s.addText(label, { x: x + 0.18, y: 2.2, w: calW - 0.32, h: 0.6, margin: 0, fontFace: BODY, fontSize: 9.8, color: INK, valign: "top", lineSpacingMultiple: 0.98 });
  }
  paradox(rx, "8.6%", "real growth", "Among India's fastest (vs 6.5% national) — GSDP Rs 9,91,997 cr in 2024-25", TEAL);
  paradox(rx + calW + 0.25, "31.7%", "of national", "Per-capita NSDP just Rs 36,342 vs ~Rs 1,14,500 — fast growth, stalled development", AMBER);

  // factories + FDI mini strip
  s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 3.0, w: rw, h: 0.92, fill: { color: NAVYBG }, line: { color: GRID, width: 1 } });
  s.addText([
    { text: "Industry never arrived.   ", options: { bold: true, color: NAVY, fontSize: 11 } },
    { text: "Registered factories ", options: { color: INK, fontSize: 10.5 } },
    { text: "3,623 (FY16) → 3,307 (FY23)", options: { bold: true, color: AMBERD, fontSize: 10.5 } },
    { text: "    ·    FDI Oct-2019–Dec-2024 only ", options: { color: INK, fontSize: 10.5 } },
    { text: "$215.76 Mn", options: { bold: true, color: AMBERD, fontSize: 10.5 } },
    { text: "    ·    mfg workforce ", options: { color: INK, fontSize: 10.5 } },
    { text: "5.7% vs ~12%", options: { bold: true, color: AMBERD, fontSize: 10.5 } },
  ], { x: rx + 0.2, y: 3.0, w: rw - 0.4, h: 0.92, margin: 0, fontFace: BODY, valign: "middle", lineSpacingMultiple: 1.05 });

  // ---- migrant callout band (full under chart+right) ----
  const my = 4.06;
  s.addShape(pres.shapes.RECTANGLE, { x: ML, y: my, w: USABLE, h: 0.62, fill: { color: NAVY }, line: { type: "none" }, shadow: shS() });
  s.addShape(pres.shapes.RECTANGLE, { x: ML, y: my, w: 0.09, h: 0.62, fill: { color: AMBER }, line: { type: "none" } });
  iconCircle(s, "walking", ML + 0.22, my + 0.13, 0.36, AMBER, "white", 0.22);
  s.addText([
    { text: "The cost is human export:  ", options: { bold: true, color: AMBER, fontSize: 12 } },
    { text: "~50 Mn Biharis out-migrate (2x since 2005); remittances are the primary income for half of all rural households.", options: { color: "FFFFFF", fontSize: 12, bold: true } },
  ], { x: ML + 0.7, y: my, w: USABLE - 0.9, h: 0.62, margin: 0, fontFace: BODY, valign: "middle" });

  // ---- WHY NOW assets row ----
  s.addText("WHY NOW — ASSETS, MONEY & MANDATE ARE ALIGNED FOR THE FIRST TIME IN TWO DECADES", {
    x: ML, y: 4.84, w: USABLE, h: 0.26, margin: 0, fontFace: BODY, fontSize: 10.5, bold: true, color: TEALD, charSpacing: 0.5,
  });
  const assets = [
    { k: "vote", c: NAVY, t: "Stable 5-yr mandate", d: "Nov 2025, 200+/243 — jobs + women's livelihoods" },
    { k: "handmoney", c: TEAL, t: "Rs 7,500-cr MMRY", d: "Rs 10,000 seed to ~1 cr+ women; up to Rs 2 L follow-on" },
    { k: "seedling", c: TEAL, t: "National Makhana Board", d: "Rs 476-cr scheme; Bihar = ~90% of India's makhana" },
    { k: "plane", c: NAVY, t: "Anchor infra funded", d: "NIFTEM, AKIC-Gaya, Purnea+Bihta airports, Pirpainti" },
    { k: "hourglass", c: AMBER, t: "BIPPP-2025 expires Mar-26", d: "Policy window open — a successor is needed now" },
  ];
  const aw = (USABLE - 0.2 * 4) / 5, ay = 5.14, ahh = 1.18;
  assets.forEach((a, i) => {
    const x = ML + i * (aw + 0.2);
    s.addShape(pres.shapes.RECTANGLE, { x, y: ay, w: aw, h: ahh, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: ay, w: aw, h: 0.07, fill: { color: a.c }, line: { type: "none" } });
    iconCircle(s, a.k, x + 0.16, ay + 0.18, 0.46, a.c, "white", 0.24);
    s.addText(a.t, { x: x + 0.7, y: ay + 0.16, w: aw - 0.8, h: 0.5, margin: 0, fontFace: BODY, fontSize: 9.7, bold: true, color: NAVY, valign: "middle", lineSpacingMultiple: 0.92 });
    s.addText(a.d, { x: x + 0.14, y: ay + 0.66, w: aw - 0.28, h: 0.48, margin: 0, fontFace: BODY, fontSize: 8.2, color: MUTED, valign: "top", lineSpacingMultiple: 0.95 });
  });

  // ---- audience snapshot strip ----
  const auy = 6.52;
  s.addText("WHO THIS SERVES:", { x: ML, y: auy, w: 1.7, h: 0.4, margin: 0, fontFace: BODY, fontSize: 8.5, bold: true, color: NAVY, valign: "middle", charSpacing: 0.5 });
  const seg = [
    ["walking", "Migrant / returnee ~50 Mn"], ["female", "JEEViKA Didi ~1.4 cr"], ["tractor", "Marginal farmer 0.39 ha"],
    ["grad", "ITI youth 58% <30"], ["globe", "Skilled diaspora"], ["hands", "Weaver / artisan (GI)"], ["store", "MSME 53.5% C-D"],
  ];
  let sx = ML + 1.75;
  const segW = (USABLE - 1.75) / seg.length;
  seg.forEach((g) => {
    iconCircle(s, g[0], sx, auy + 0.02, 0.32, TEALBG, "teal", 0.2);
    s.addText(g[1], { x: sx + 0.36, y: auy, w: segW - 0.36, h: 0.4, margin: 0, fontFace: BODY, fontSize: 7.8, color: INK, valign: "middle", lineSpacingMultiple: 0.92 });
    sx += segW;
  });

  sourceLine(s, "Bihar Economic Survey 2025-26; ECI Bihar 2025; PIB (MMRY, JEEViKA Nidhi, National Makhana Board); Union Budget 2025-26; IBEF / Invest India; Census 2011 / Journal of Migration Affairs.");
})();

// ============================================================================
//  SLIDE 3 — ROOT CAUSE 1/2 : THE SYSTEM (hard-infra constraints)
// ============================================================================
(function rootCause1() {
  const s = pres.addSlide();
  bg(s, PAPER);
  header(s, "Root-cause analysis · 1 of 2 · the diagnostic core", "The System — Six Bottlenecks That Feed Each Other", 2);

  // ---- LEFT: systemic reinforcing map ----
  const mx = ML, my = 1.5, mw = 6.5, mhh = 4.55;
  s.addShape(pres.shapes.RECTANGLE, { x: mx, y: my, w: mw, h: mhh, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
  s.addText("A REINFORCING SYSTEM — NOT SIX SEPARATE PROBLEMS", { x: mx + 0.2, y: my + 0.12, w: mw - 0.4, h: 0.26, margin: 0, fontFace: BODY, fontSize: 10.5, bold: true, color: NAVY });

  const cX = mx + mw / 2, cY = my + 2.36;       // centre node position
  const ccW = 2.5, ccH = 0.98;
  const Rx = 2.46, Ry = 1.42;                     // elliptical layout radii
  const nodes = [
    { k: "mapmark", t: "LAND", a: -90, meta: false },
    { k: "bolt",    t: "POWER", a: -30, meta: false },
    { k: "bank",    t: "FINANCE", a: 30, meta: false },
    { k: "grad",    t: "SKILLS", a: 90, meta: false },
    { k: "truck",   t: "LOGISTICS", a: 150, meta: false },
    { k: "balance", t: "GOVERNANCE", a: 210, meta: true },
  ];
  const nW = 1.55, nH = 0.6;
  const pos = (a) => ({ x: cX + Rx * Math.cos((a * Math.PI) / 180), y: cY + Ry * Math.sin((a * Math.PI) / 180) });
  // arrows from each node to centre (draw first, behind nodes)
  nodes.forEach((n) => {
    const p = pos(n.a);
    // start a touch inside the node toward centre so the arrow is not under the box
    const dx = cX - p.x, dy = cY - p.y, len = Math.hypot(dx, dy);
    const sx = p.x + (dx / len) * 0.62, sy = p.y + (dy / len) * 0.34;
    const ex = cX - (dx / len) * 1.3, ey = cY - (dy / len) * 0.55;
    s.addShape(pres.shapes.LINE, {
      x: sx, y: sy, w: ex - sx, h: ey - sy,
      line: { color: n.meta ? AMBER : LINE, width: n.meta ? 2.25 : 1.5, endArrowType: "triangle", beginArrowType: n.meta ? "triangle" : "none" },
    });
  });
  // reinforcing-loop dashed ring (through node centres)
  s.addShape(pres.shapes.OVAL, { x: cX - Rx, y: cY - Ry, w: 2 * Rx, h: 2 * Ry, fill: { type: "none" }, line: { color: TEAL, width: 1, dashType: "dash" } });
  // nodes
  nodes.forEach((n) => {
    const p = pos(n.a);
    const nx = p.x - nW / 2, ny = p.y - nH / 2;
    const col = n.meta ? AMBER : NAVY;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: nx, y: ny, w: nW, h: nH, rectRadius: 0.07, fill: { color: col }, line: { type: "none" }, shadow: shS() });
    s.addImage({ path: ic(n.k, "white"), x: nx + 0.12, y: ny + nH / 2 - 0.12, w: 0.24, h: 0.24 });
    s.addText(n.t, { x: nx + 0.42, y: ny, w: nW - 0.48, h: nH, margin: 0, fontFace: BODY, fontSize: 8.7, bold: true, color: "FFFFFF", align: "left", valign: "middle" });
  });
  // centre node
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cX - ccW / 2, y: cY - ccH / 2, w: ccW, h: ccH, rectRadius: 0.07, fill: { color: NAVY }, line: { color: AMBER, width: 2 }, shadow: sh() });
  s.addText([
    { text: "STALLED\nINDUSTRIALISATION\n+ OUT-MIGRATION", options: { color: "FFFFFF", fontSize: 10.5, bold: true } },
  ], { x: cX - ccW / 2 + 0.05, y: cY - ccH / 2, w: ccW - 0.1, h: ccH, margin: 0, fontFace: BODY, align: "center", valign: "middle", lineSpacingMultiple: 0.92 });
  // loop legend
  s.addText([
    { text: "—— ", options: { color: TEAL, bold: true } }, { text: "reinforcing cycle      ", options: { color: MUTED } },
    { text: "▲ ", options: { color: AMBER, bold: true } }, { text: "Governance is the meta-constraint (feeds all)", options: { color: MUTED } },
  ], { x: mx + 0.2, y: my + mhh - 0.28, w: mw - 0.4, h: 0.24, margin: 0, fontFace: BODY, fontSize: 8, valign: "middle" });

  // ---- RIGHT: three hard-infrastructure constraint cards ----
  const rx = mx + mw + 0.3, rw = USABLE - mw - 0.3;
  s.addText("THE HARD-INFRASTRUCTURE GAPS", { x: rx, y: 1.5, w: rw, h: 0.28, margin: 0, fontFace: BODY, fontSize: 11, bold: true, color: TEALD, charSpacing: 0.5 });
  const cards = [
    { k: "mapmark", t: "LAND", stat: "18–36-month conversion vs 3–6 in Gujarat / TN", d: "Fragmented 0.39-ha holdings · flood-prone · acquisition unreformed", hurt: "Hurts: investor + job-seeker" },
    { k: "bolt", t: "POWER", stat: "Captive backup adds +15–20% to unit cost", d: "Electrification ≠ 24×7 industrial supply for factories", hurt: "Hurts: MSMEs" },
    { k: "truck", t: "LOGISTICS", stat: "30–40% post-harvest loss · EDFC under-used", d: "Produce rots before it reaches a processor or market", hurt: "Hurts: marginal farmer" },
  ];
  const chh2 = 1.18, cgap = 0.13;
  cards.forEach((c, i) => {
    const y = 1.86 + i * (chh2 + cgap);
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y, w: rw, h: chh2, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y, w: 0.09, h: chh2, fill: { color: TEAL }, line: { type: "none" } });
    iconCircle(s, c.k, rx + 0.22, y + 0.2, 0.52, NAVY, "white", 0.24);
    s.addText(c.t, { x: rx + 0.86, y: y + 0.12, w: rw - 1.0, h: 0.3, margin: 0, fontFace: HEAD, fontSize: 19, color: NAVY, charSpacing: 0.5 });
    s.addText(c.stat, { x: rx + 0.86, y: y + 0.44, w: rw - 1.0, h: 0.3, margin: 0, fontFace: BODY, fontSize: 10.5, bold: true, color: AMBERD });
    s.addText(c.d, { x: rx + 0.22, y: y + 0.74, w: rw - 0.34, h: 0.26, margin: 0, fontFace: BODY, fontSize: 8.8, color: MUTED });
    s.addText(c.hurt, { x: rx + 0.22, y: y + 0.96, w: rw - 0.34, h: 0.2, margin: 0, fontFace: BODY, fontSize: 8.6, bold: true, color: TEALD });
  });

  takeawayBanner(s, 6.18, "TAKEAWAY", "These physical gaps starve greenfield projects and rot produce before market — capital and labour leave together.");
  sourceLine(s, "Bihar Economic Survey 2025-26; IBEF / Invest India (EDFC, land-conversion timelines); comparative: Gujarat & Tamil Nadu single-window data.");
})();

// ============================================================================
//  SLIDE 4 — ROOT CAUSE 2/2 : INSTITUTIONAL + BOTTLENECK -> PILLAR BRIDGE
// ============================================================================
(function rootCause2() {
  const s = pres.addSlide();
  bg(s, PAPER);
  header(s, "Root-cause analysis · 2 of 2 · the bridge", "The Institutional Constraints — and the Fix Map", 3);

  // ---- LEFT: three institutional cards (stacked) ----
  const lx = ML, lw = 4.95;
  s.addText("THE HUMAN & INSTITUTIONAL GAPS", { x: lx, y: 1.45, w: lw, h: 0.26, margin: 0, fontFace: BODY, fontSize: 11, bold: true, color: TEALD, charSpacing: 0.5 });
  const cards = [
    { k: "grad", t: "SKILLS", meta: false, stat: "58% under 30 — but 80% of out-migrants are low-skilled", d: "Weak ITIs · very low female labour-force participation", hurt: "Hurts: youth + women" },
    { k: "bank", t: "FINANCE", meta: false, stat: "53.5% credit-deposit ratio — banks export Bihar's deposits", d: "MSME credit gap of Rs 1.5–2 lakh cr", hurt: "Hurts: MSME + scaling Didi" },
    { k: "balance", t: "GOVERNANCE", meta: true, stat: "Rs 6,800 bn approved proposals un-operationalised", d: "No true single window · 9.2%-of-GSDP fiscal deficit (FY24)", hurt: "The meta-constraint — hurts everyone" },
  ];
  const chh = 1.32, cgap = 0.12;
  cards.forEach((c, i) => {
    const y = 1.8 + i * (chh + cgap);
    const accent = c.meta ? AMBER : TEAL;
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y, w: lw, h: chh, fill: { color: c.meta ? "FFF7EA" : CARD }, line: { color: c.meta ? AMBER : GRID, width: c.meta ? 1.5 : 1 }, shadow: shS() });
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y, w: 0.09, h: chh, fill: { color: accent }, line: { type: "none" } });
    iconCircle(s, c.k, lx + 0.22, y + 0.2, 0.52, c.meta ? AMBER : NAVY, "white", 0.24);
    s.addText([
      { text: c.t, options: { fontFace: HEAD, fontSize: 19, color: NAVY, charSpacing: 0.5 } },
      ...(c.meta ? [{ text: "   META", options: { fontFace: BODY, fontSize: 9, bold: true, color: AMBERD } }] : []),
    ], { x: lx + 0.86, y: y + 0.1, w: lw - 1.0, h: 0.32, margin: 0, valign: "middle" });
    s.addText(c.stat, { x: lx + 0.86, y: y + 0.44, w: lw - 1.0, h: 0.4, margin: 0, fontFace: BODY, fontSize: 10, bold: true, color: AMBERD, lineSpacingMultiple: 0.95 });
    s.addText(c.d, { x: lx + 0.22, y: y + 0.86, w: lw - 0.34, h: 0.26, margin: 0, fontFace: BODY, fontSize: 8.8, color: MUTED });
    s.addText(c.hurt, { x: lx + 0.22, y: y + 1.08, w: lw - 0.34, h: 0.22, margin: 0, fontFace: BODY, fontSize: 8.8, bold: true, color: c.meta ? AMBERD : TEALD });
  });

  // ---- RIGHT: conclusion banner + bottleneck->pillar mapping ----
  const rx = lx + lw + 0.32, rw = USABLE - lw - 0.32;
  // conclusion banner
  s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.45, w: rw, h: 0.78, fill: { color: NAVY }, line: { type: "none" }, shadow: shS() });
  s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 1.45, w: 0.09, h: 0.78, fill: { color: AMBER }, line: { type: "none" } });
  s.addText([
    { text: "DIAGNOSIS:  ", options: { bold: true, color: AMBER, fontSize: 12, charSpacing: 1 } },
    { text: "an execution-architecture failure, not a deficit of policy intent.", options: { color: "FFFFFF", fontSize: 14, bold: true } },
  ], { x: rx + 0.28, y: 1.45, w: rw - 0.5, h: 0.78, margin: 0, fontFace: BODY, valign: "middle" });

  // mapping table heading
  s.addText("THE BRIDGE — EACH BOTTLENECK MAPS TO A UDAAN PILLAR", { x: rx, y: 2.42, w: rw, h: 0.26, margin: 0, fontFace: BODY, fontSize: 11, bold: true, color: TEALD, charSpacing: 0.5 });

  const rows = [
    { b: "Land + flood risk", k: "mapmark", who: "Investor · job-seeker", p: "P1", pn: "Land & plug-and-play sheds", pc: TEAL },
    { b: "Power reliability", k: "bolt", who: "MSMEs", p: "P1", pn: "Ready-shed power + solar feeder", pc: TEAL },
    { b: "Logistics + farm value-loss", k: "truck", who: "Marginal farmer", p: "P2/P3", pn: "FPO units + OBOP cold-chain/CFCs", pc: TEALD },
    { b: "Skilled-labour paradox", k: "grad", who: "Youth · women", p: "P4", pn: "Skills-to-job pipeline", pc: TEAL },
    { b: "Shallow finance", k: "bank", who: "MSME · scaling Didi", p: "P5", pn: "Guarantee fund + 65% C-D", pc: NAVY },
    { b: "Governance (meta)", k: "balance", who: "Everyone", p: "P5", pn: "Statutory single window + activation office", pc: AMBER },
  ];
  const ty = 2.74, rh = 0.535;
  // header row
  const colX = [rx, rx + 2.55, rx + 4.35, rx + 5.0];
  s.addShape(pres.shapes.RECTANGLE, { x: rx, y: ty, w: rw, h: 0.34, fill: { color: NAVY2 }, line: { type: "none" } });
  s.addText("BOTTLENECK", { x: rx + 0.12, y: ty, w: 2.4, h: 0.34, margin: 0, fontFace: BODY, fontSize: 8.5, bold: true, color: "FFFFFF", valign: "middle", charSpacing: 0.5 });
  s.addText("WHO IT HURTS", { x: rx + 2.55, y: ty, w: 1.8, h: 0.34, margin: 0, fontFace: BODY, fontSize: 8.5, bold: true, color: "FFFFFF", valign: "middle", charSpacing: 0.5 });
  s.addText("FIXED BY", { x: rx + 4.4, y: ty, w: rw - 4.4, h: 0.34, margin: 0, fontFace: BODY, fontSize: 8.5, bold: true, color: "FFFFFF", valign: "middle", charSpacing: 0.5 });
  rows.forEach((r, i) => {
    const y = ty + 0.34 + i * rh;
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y, w: rw, h: rh, fill: { color: i % 2 ? "FFFFFF" : "EEF2F5" }, line: { color: GRID, width: 0.5 } });
    s.addImage({ path: ic(r.k, "navy"), x: rx + 0.12, y: y + rh / 2 - 0.11, w: 0.22, h: 0.22 });
    s.addText(r.b, { x: rx + 0.4, y, w: 2.1, h: rh, margin: 0, fontFace: BODY, fontSize: 9, bold: true, color: NAVY, valign: "middle" });
    s.addText(r.who, { x: rx + 2.55, y, w: 1.85, h: rh, margin: 0, fontFace: BODY, fontSize: 8.5, color: MUTED, valign: "middle" });
    // pillar chip
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: rx + 4.4, y: y + rh / 2 - 0.16, w: 0.62, h: 0.32, rectRadius: 0.05, fill: { color: r.pc }, line: { type: "none" } });
    s.addText(r.p, { x: rx + 4.4, y: y + rh / 2 - 0.16, w: 0.62, h: 0.32, margin: 0, fontFace: BODY, fontSize: 9.5, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    s.addText(r.pn, { x: rx + 5.1, y, w: rw - 5.18, h: rh, margin: 0, fontFace: BODY, fontSize: 8.6, color: INK, valign: "middle", lineSpacingMultiple: 0.92 });
  });
  s.addText("→ The five solution slides that follow take these pillars one at a time.", {
    x: rx, y: ty + 0.34 + rows.length * rh + 0.04, w: rw, h: 0.24, margin: 0, fontFace: BODY, fontSize: 8.8, italic: true, color: TEALD,
  });

  sourceLine(s, "Bihar Economic Survey 2025-26; RBI / SLBC Bihar (C-D ratio); CAG / state finance accounts (fiscal deficit); BIPPP-2025; Invest India approved-investment pipeline.");
})();

// ============================================================================
//  SOLUTION SLIDE BUILDER (slides 5–9 / pillars P1–P5)
// ============================================================================
function solutionSlide(opts) {
  const s = pres.addSlide();
  bg(s, PAPER);
  header(s, "Action core · one slide per pillar", `Solution ${opts.num} — ${opts.title}`, opts.page);

  let y = 1.32;
  tracker(s, opts.active, y);
  y += 0.5 + 0.16;

  // governing thought banner (P1 only)
  if (opts.governing) {
    s.addShape(pres.shapes.RECTANGLE, { x: ML, y, w: USABLE, h: 0.74, fill: { color: NAVY }, line: { type: "none" }, shadow: shS() });
    s.addShape(pres.shapes.RECTANGLE, { x: ML, y, w: 0.09, h: 0.74, fill: { color: TEAL }, line: { type: "none" } });
    s.addText([
      { text: "GOVERNING THOUGHT   ", options: { bold: true, color: TEAL, fontSize: 9.5, charSpacing: 1 } },
      { text: "Bihar's stagnation is an execution gap, not a policy gap. The assets, money and mandate are finally aligned — UDAAN 2.0 wires proven models onto Bihar's own delivery rails to turn approved paper into operating factories in 24 months.", options: { color: "EAF1F6", fontSize: 10.3 } },
    ], { x: ML + 0.26, y, w: USABLE - 0.5, h: 0.74, margin: 0, fontFace: BODY, valign: "middle", lineSpacingMultiple: 0.98 });
    y += 0.74 + 0.14;
  }

  // three tagged chips
  const chipDefs = [
    { tag: "AUDIENCE SERVED", icon: "users", color: TEAL, txt: opts.chips.audience },
    { tag: "PROVEN MODEL BORROWED", icon: "award", color: NAVY, txt: opts.chips.model },
    { tag: "LIVE DELIVERY RAIL", icon: "route", color: AMBER, txt: opts.chips.rail },
  ];
  const cg = 0.22, cw = (USABLE - cg * 2) / 3, chh = 0.82;
  chipDefs.forEach((c, i) => {
    const x = ML + i * (cw + cg);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: chh, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.07, h: chh, fill: { color: c.color }, line: { type: "none" } });
    iconCircle(s, c.icon, x + 0.18, y + chh / 2 - 0.24, 0.48, c.color, "white", 0.24);
    s.addText(c.tag, { x: x + 0.74, y: y + 0.1, w: cw - 0.84, h: 0.22, margin: 0, fontFace: BODY, fontSize: 8, bold: true, color: c.color === AMBER ? AMBERD : c.color, charSpacing: 0.5 });
    s.addText(c.txt, { x: x + 0.74, y: y + 0.3, w: cw - 0.84, h: 0.48, margin: 0, fontFace: BODY, fontSize: 9.3, color: INK, valign: "top", lineSpacingMultiple: 0.95 });
  });
  y += chh + 0.18;

  // 3-phase process flow
  const phaseLabels = [
    { l: "MONTHS 1–6", s2: "IDENTIFY / LAUNCH", c: TEAL },
    { l: "MONTHS 7–18", s2: "BUILD / COMMISSION", c: NAVY },
    { l: "MONTHS 19–24", s2: "OPERATIONALISE / SCALE", c: AMBER },
  ];
  const flowH = opts.governing ? 2.18 : 2.62;
  const arrowW = 0.34;
  const pcw = (USABLE - arrowW * 2) / 3;
  opts.phases.forEach((ph, i) => {
    const x = ML + i * (pcw + arrowW);
    const pl = phaseLabels[i];
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: pcw, h: flowH, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
    // header strip
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: pcw, h: 0.56, fill: { color: pl.c }, line: { type: "none" } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.14, y: y + 0.12, w: 0.32, h: 0.32, fill: { color: "FFFFFF" }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.14, y: y + 0.12, w: 0.32, h: 0.32, margin: 0, fontFace: HEAD, fontSize: 16, color: pl.c, align: "center", valign: "middle" });
    s.addText([
      { text: pl.l, options: { fontFace: BODY, fontSize: 10.5, bold: true, color: "FFFFFF", breakLine: true } },
      { text: pl.s2, options: { fontFace: BODY, fontSize: 7.5, color: "EAF1F6", charSpacing: 0.5 } },
    ], { x: x + 0.54, y: y, w: pcw - 0.62, h: 0.56, margin: 0, valign: "middle", lineSpacingMultiple: 0.9 });
    // actions
    const acts = ph.map((a) => ({ text: a, options: { bullet: { code: "2022", indent: 10 }, color: INK, fontSize: 9.6, breakLine: true, paraSpaceAfter: 5 } }));
    s.addText(acts, { x: x + 0.18, y: y + 0.66, w: pcw - 0.34, h: flowH - 0.74, margin: 0, fontFace: BODY, valign: "top", lineSpacingMultiple: 0.96 });
    // arrow between
    if (i < 2) {
      s.addShape(pres.shapes.LINE, { x: x + pcw + 0.04, y: y + flowH / 2, w: arrowW - 0.08, h: 0, line: { color: AMBER, width: 2.5, endArrowType: "triangle" } });
    }
  });
  y += flowH + 0.16;

  // target callout band
  const th = 0.84;
  s.addShape(pres.shapes.RECTANGLE, { x: ML, y, w: USABLE, h: th, fill: { color: AMBER }, line: { type: "none" }, shadow: shS() });
  s.addShape(pres.shapes.RECTANGLE, { x: ML, y, w: 0.12, h: th, fill: { color: NAVY }, line: { type: "none" } });
  iconCircle(s, "bullseye", ML + 0.28, y + th / 2 - 0.25, 0.5, NAVY, "white", 0.24);
  s.addText("24-MONTH TARGET", { x: ML + 0.92, y: y + 0.12, w: 3.2, h: 0.24, margin: 0, fontFace: BODY, fontSize: 9.5, bold: true, color: "5A3A06", charSpacing: 1 });
  s.addText(opts.target, { x: ML + 0.92, y: y + 0.32, w: 6.7, h: 0.5, margin: 0, fontFace: HEAD, fontSize: 25, color: NAVY, charSpacing: 0.5, valign: "middle" });
  // sector lever on right of band
  s.addShape(pres.shapes.RECTANGLE, { x: ML + USABLE - 4.55, y: y + 0.13, w: 4.4, h: th - 0.26, fill: { color: "FFFFFF" }, line: { type: "none" } });
  s.addText([
    { text: "SECTOR LEVER   ", options: { bold: true, color: TEALD, fontSize: 8, charSpacing: 0.5, breakLine: true } },
    { text: opts.sector, options: { color: INK, fontSize: 8.8 } },
  ], { x: ML + USABLE - 4.42, y: y + 0.14, w: 4.16, h: th - 0.28, margin: 0, fontFace: BODY, valign: "middle", lineSpacingMultiple: 0.95 });

  sourceLine(s, opts.source);
}

// ---- P1 ----
solutionSlide({
  num: 1, page: 4, active: 0, title: "Land & Plug-and-Play Readiness", governing: true,
  chips: {
    audience: "Local job-seekers + investors",
    model: "Sri City / Tamil Nadu ready-park + anchor model",
    rail: "BIADA + 10 new parks + AKIC-Gaya",
  },
  phases: [
    ["Designate 5 Priority Industrial Districts: Gaya, Muzaffarpur, Darbhanga, Bhagalpur, Begusarai", "500–1,000 acres each, govt land first", "90-day land-allotment SLA"],
    ["Build plug-and-play sheds: power, water, ETP, solar feeder", "10 cold stores at production clusters", "Stand up 2 Mega Food Parks"],
    ["Reach 60% shed occupancy", "Land 1 anchor tenant per park", "Captive solar live across parks"],
  ],
  target: "60% shed occupancy + 1 anchor per park",
  sector: "Anchors light engineering & electronics — AKIC-Gaya PCB/EMS + defence corridor; wages 30–40% below Mumbai/Chennai.",
  source: "BIADA; IBEF / Invest India (AKIC-Gaya); model transfer: Sri City & Tamil Nadu plug-and-play parks.",
});
// ---- P2 ----
solutionSlide({
  num: 2, page: 5, active: 1, title: "Women-Led & Returnee Enterprise Engine", governing: false,
  chips: {
    audience: "1.4 cr JEEViKA women + ~50 Mn migrants",
    model: "Amul + SEWA / Lijjat + Kerala NORKA",
    rail: "JEEViKA + MMRY + Makhana Board FPOs + new Returnee Mission",
  },
  phases: [
    ["Form 200+ JEEViKA producer groups", "Launch a Migrant & Returnee Registry", "Map returnee skills to anchor demand"],
    ["MMRY follow-on credit up to Rs 2 lakh", "'Homecoming' loan for returnee founders", "Creches + safe transport for women lines"],
    ["Commission FPO-owned processing units", "Scale Lakhpati Didi enterprises", "Wage-parity + owner tracks to retain returnees"],
  ],
  target: "1 lakh Lakhpati Didi + 10,000 returnee units",
  sector: "Agro-processing — 8–12 jobs per Rs 1 cr, 60–70% female; makhana processed in-state = 3–4x the jobs of raw.",
  source: "PIB (MMRY, JEEViKA Nidhi); National Makhana Board (Rs 476.03-cr scheme); model transfer: Amul/GCMMF, SEWA/Lijjat, Kerala NORKA.",
});
// ---- P3 ----
solutionSlide({
  num: 3, page: 6, active: 2, title: "Distributed Cluster Activation (OBOP)", governing: false,
  chips: {
    audience: "Weavers, artisans + district MSMEs",
    model: "UP ODOP + Tirupur RMG + Sialkot CFCs",
    rail: "OBOP + District Industries Centres",
  },
  phases: [
    ["One product per block: Bhagalpur silk, Madhubani, footwear", "Design Common Facility Centres (CFCs)", "Map cluster demand + buyers"],
    ["Commission CFCs on PPP", "Secure GI tags for cluster products", "Onboard clusters to ONDC"],
    ["Activate 15–20 clusters with live orders", "Link clusters to OBOP marketing", "Aggregate exports via district hubs"],
  ],
  target: "15–20 OBOP clusters with live orders",
  sector: "Textiles / apparel / handloom — 50–80 jobs per Rs 1 cr (Bhagalpuri silk GI); leather & footwear 50,000–100,000 jobs in 24 months.",
  source: "OBOP / District Industries Centres; model transfer: UP ODOP, Tirupur & Bangladesh RMG, Sialkot CFCs; Bhagalpur silk GI.",
});
// ---- P4 ----
solutionSlide({
  num: 4, page: 7, active: 3, title: "Skills-to-Job Pipeline", governing: false,
  chips: {
    audience: "ITI youth + skilled diaspora",
    model: "German dual-VET + Vietnam pre-trained cohorts",
    rail: "1,497 ITIs + Kaushal Vikas Kendras",
  },
  phases: [
    ["Audit all ITIs; invest in the top 300", "Add 5 demand-led trades", "Anchor curricula to live employer needs"],
    ["Stand up 5 District Skill Academies (PPP)", "6-month apprenticeship link to employers", "Reserve 40% of seats for women"],
    ["Pre-train cohorts to named-anchor specs", "Place into park anchors + clusters", "Track placements to 70%"],
  ],
  target: "200,000 certifications · 70% placement",
  sector: "Feeds every pillar — pre-trained cohorts de-risk anchors (China+1 / Vietnam playbook) and unlock female workforce entry.",
  source: "Bihar Economic Survey 2025-26 (ITIs, youth demography); model transfer: German dual-VET, Vietnam China+1 pre-training.",
});
// ---- P5 ----
solutionSlide({
  num: 5, page: 8, active: 4, title: "Finance & Governance Acceleration", governing: false,
  chips: {
    audience: "MSMEs + investors",
    model: "Telangana TS-iPASS + CGTMSE / SIDBI",
    rail: "Statutory single window + Credit Guarantee Fund",
  },
  phases: [
    ["Legislate a statutory single window: 45/90-day deemed clearance + public dashboard", "Seed a Rs 500-cr MSME Credit Guarantee Fund (20% first-loss → ~5x lending)"],
    ["Secure a 65% C-D-ratio commitment from banks", "Launch a Rs 1,000-cr Bihar Industrial Growth Fund"],
    ["District Industrial Task Forces under DMs", "CMO Investment Activation Office runs 60-day health-checks on the Rs 6,800-bn pipeline"],
  ],
  target: "45/90-day single-window SLA + 65% C-D ratio",
  sector: "The meta-fix — unblocks the Rs 6,800-bn stalled pipeline and closes the Rs 1.5–2 lakh-cr MSME credit gap.",
  source: "Model transfer: Telangana TS-iPASS, CGTMSE / SIDBI; BIPPP-2025; RBI / SLBC Bihar (C-D ratio).",
});

// ============================================================================
//  SLIDE 10 — EXECUTION ROADMAP + KPI DASHBOARD
// ============================================================================
(function roadmap() {
  const s = pres.addSlide();
  bg(s, PAPER);
  header(s, "Execution · 24-month plan", "Execution Roadmap + KPI Dashboard", 9);

  // ---- LEFT: 3-phase Gantt across 5 pillars ----
  const gx = ML, gy = 1.5, gw = 6.55, ghh = 4.7;
  s.addShape(pres.shapes.RECTANGLE, { x: gx, y: gy, w: gw, h: ghh, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
  s.addText("3-PHASE GANTT — 5 PILLARS x 24 MONTHS", { x: gx + 0.18, y: gy + 0.12, w: gw - 0.3, h: 0.26, margin: 0, fontFace: BODY, fontSize: 10.5, bold: true, color: NAVY });
  // phase header columns
  const labW = 1.65;                       // pillar label column
  const trackX = gx + 0.18 + labW;
  const trackW = gw - 0.36 - labW;
  const phName = ["M1–6 IDENTIFY/LAUNCH", "M7–18 BUILD/COMMISSION", "M19–24 SCALE"];
  const phColors = [TEAL, NAVY2, AMBER];
  const phFrac = [0.25, 0.5, 0.25];        // 6/24, 12/24, 6/24
  let accX = trackX;
  const colHeadY = gy + 0.46;
  phName.forEach((nm, i) => {
    const cwd = trackW * phFrac[i];
    s.addText(nm, { x: accX, y: colHeadY, w: cwd, h: 0.3, margin: 0, fontFace: BODY, fontSize: 6.8, bold: true, color: phColors[i] === NAVY2 ? NAVY : (i === 2 ? AMBERD : TEALD), align: "center", valign: "middle", lineSpacingMultiple: 0.9 });
    accX += cwd;
  });
  // grid verticals
  s.addShape(pres.shapes.LINE, { x: trackX + trackW * 0.25, y: gy + 0.78, w: 0, h: ghh - 1.05, line: { color: GRID, width: 0.75, dashType: "dash" } });
  s.addShape(pres.shapes.LINE, { x: trackX + trackW * 0.75, y: gy + 0.78, w: 0, h: ghh - 1.05, line: { color: GRID, width: 0.75, dashType: "dash" } });

  const grows = [
    { p: "P1", n: "Land & sheds", segs: [[0, 0.45, TEAL], [0.42, 0.86, NAVY2], [0.8, 1.0, AMBER]] },
    { p: "P2", n: "Women + returnee", segs: [[0, 0.4, TEAL], [0.36, 0.8, NAVY2], [0.7, 1.0, AMBER]] },
    { p: "P3", n: "OBOP clusters", segs: [[0, 0.45, TEAL], [0.4, 0.82, NAVY2], [0.78, 1.0, AMBER]] },
    { p: "P4", n: "Skills-to-job", segs: [[0, 0.42, TEAL], [0.38, 0.85, NAVY2], [0.8, 1.0, AMBER]] },
    { p: "P5", n: "Finance + gov", segs: [[0, 0.3, TEAL], [0.25, 0.7, NAVY2], [0.6, 1.0, AMBER]] },
  ];
  const rowY0 = gy + 0.84, rowH = (ghh - 1.05) / grows.length;
  grows.forEach((r, i) => {
    const ry = rowY0 + i * rowH;
    // pillar chip + label
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx + 0.18, y: ry + rowH / 2 - 0.15, w: 0.5, h: 0.3, rectRadius: 0.05, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(r.p, { x: gx + 0.18, y: ry + rowH / 2 - 0.15, w: 0.5, h: 0.3, margin: 0, fontFace: BODY, fontSize: 9, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    s.addText(r.n, { x: gx + 0.72, y: ry, w: labW - 0.5, h: rowH, margin: 0, fontFace: BODY, fontSize: 8, color: NAVY, valign: "middle", lineSpacingMultiple: 0.9 });
    // base rail
    s.addShape(pres.shapes.RECTANGLE, { x: trackX, y: ry + rowH / 2 - 0.015, w: trackW, h: 0.03, fill: { color: GRID }, line: { type: "none" } });
    // segment bars
    r.segs.forEach((sg) => {
      const bx = trackX + trackW * sg[0];
      const bw = trackW * (sg[1] - sg[0]);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: ry + rowH / 2 - 0.11, w: bw, h: 0.22, rectRadius: 0.04, fill: { color: sg[2] }, line: { type: "none" } });
    });
  });
  // legend
  const lgY = gy + ghh - 0.22;
  [["IDENTIFY/LAUNCH", TEAL], ["BUILD/COMMISSION", NAVY2], ["SCALE", AMBER]].forEach((lg, i) => {
    const lx = gx + 0.2 + i * 2.1;
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y: lgY, w: 0.18, h: 0.12, fill: { color: lg[1] }, line: { type: "none" } });
    s.addText(lg[0], { x: lx + 0.22, y: lgY - 0.04, w: 1.85, h: 0.2, margin: 0, fontFace: BODY, fontSize: 7, color: MUTED, valign: "middle" });
  });

  // ---- RIGHT: KPI dashboard table ----
  const kx = gx + gw + 0.3, kw = USABLE - gw - 0.3;
  s.addText("KPI DASHBOARD — BASELINE → M12 → M24", { x: kx, y: gy, w: kw, h: 0.26, margin: 0, fontFace: BODY, fontSize: 10.5, bold: true, color: NAVY });
  const kpis = [
    ["Registered factories", "3,307", "3,600+", "4,200+"],
    ["Private investment / yr", "$216 Mn*", "$150 Mn", "$300 Mn"],
    ["Mfg % of GSDP", "~7%", "8.5%", "11%"],
    ["Direct industrial jobs", "—", "75,000", "2,50,000"],
    ["Lakhpati Didi enterprises", "seeded", "40,000", "1,00,000"],
    ["Returnee-led enterprises", "0", "3,000", "10,000"],
    ["Women in industrial workforce", "very low", "+30,000", "+80,000"],
    ["FPO / OBOP clusters", "few", "8", "15–20"],
    ["Credit-deposit ratio", "53.5%", "58%", "65%"],
    ["MSME approval time", "18–36 mo", "60 days", "45 days"],
    ["ITI placement", "<30%", "50%", "70%"],
  ];
  const kHeadH = 0.36, kRowH = (ghh - kHeadH - 0.2) / kpis.length;
  const kcol = [kx, kx + kw * 0.42, kx + kw * 0.62, kx + kw * 0.81];
  const kcw = [kw * 0.42, kw * 0.20, kw * 0.19, kw * 0.19];
  // header
  s.addShape(pres.shapes.RECTANGLE, { x: kx, y: gy + 0.3, w: kw, h: kHeadH, fill: { color: NAVY }, line: { type: "none" } });
  ["METRIC", "BASE '25", "M12", "M24"].forEach((h, i) => {
    s.addText(h, { x: kcol[i] + (i ? 0 : 0.1), y: gy + 0.3, w: kcw[i], h: kHeadH, margin: 0, fontFace: BODY, fontSize: 8.5, bold: true, color: i === 3 ? AMBER : "FFFFFF", align: i ? "center" : "left", valign: "middle", charSpacing: 0.5 });
  });
  kpis.forEach((r, i) => {
    const ry = gy + 0.3 + kHeadH + i * kRowH;
    s.addShape(pres.shapes.RECTANGLE, { x: kx, y: ry, w: kw, h: kRowH, fill: { color: i % 2 ? "FFFFFF" : "EEF2F5" }, line: { color: GRID, width: 0.5 } });
    s.addText(r[0], { x: kx + 0.1, y: ry, w: kcw[0] - 0.12, h: kRowH, margin: 0, fontFace: BODY, fontSize: 8.6, bold: true, color: NAVY, valign: "middle" });
    s.addText(r[1], { x: kcol[1], y: ry, w: kcw[1], h: kRowH, margin: 0, fontFace: BODY, fontSize: 8.4, color: MUTED, align: "center", valign: "middle" });
    s.addText(r[2], { x: kcol[2], y: ry, w: kcw[2], h: kRowH, margin: 0, fontFace: BODY, fontSize: 8.4, color: TEALD, bold: true, align: "center", valign: "middle" });
    // M24 highlighted cell
    s.addShape(pres.shapes.RECTANGLE, { x: kcol[3], y: ry, w: kcw[3], h: kRowH, fill: { color: "FBEBD3" }, line: { color: GRID, width: 0.5 } });
    s.addText(r[3], { x: kcol[3], y: ry, w: kcw[3], h: kRowH, margin: 0, fontFace: BODY, fontSize: 8.7, color: AMBERD, bold: true, align: "center", valign: "middle" });
  });
  s.addText("* baseline private investment is the $215.76 Mn total recorded across Oct-2019–Dec-2024 (≈ 5 years).", {
    x: kx, y: gy + 0.3 + kHeadH + kpis.length * kRowH + 0.02, w: kw, h: 0.2, margin: 0, fontFace: BODY, fontSize: 7, italic: true, color: MUTED,
  });

  sourceLine(s, "UDAAN 2.0 targets vs Bihar Economic Survey 2025-26 baselines; RBI / SLBC Bihar (C-D ratio); Invest India (investment, factories). Targets are programme commitments.");
})();

// ============================================================================
//  SLIDE 11 — RISKS, TRADE-OFFS & REFERENCES
// ============================================================================
(function risksRefs() {
  const s = pres.addSlide();
  bg(s, PAPER);
  header(s, "Risk · trade-offs · references", "Risks, Mitigations & References", 10);

  // ---- LEFT: probability x impact matrix ----
  const mx = ML, my = 1.5, msz = 3.45;     // square plot (sits fully above references band)
  const plotX = mx + 0.5, plotY = my + 0.08, plotW = msz - 0.5, plotH = msz - 0.6;
  s.addShape(pres.shapes.RECTANGLE, { x: mx, y: my, w: msz, h: msz, fill: { color: CARD }, line: { color: GRID, width: 1 }, shadow: shS() });
  // quadrant background tints (3x3)
  const cellW = plotW / 3, cellH = plotH / 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      // severity = (impact col + prob row); higher right/top = worse
      const sev = (c) + (2 - r); // 0..4
      let col = "EAF3EE"; // low - greenish grey
      if (sev >= 3) col = "FBE2DC"; else if (sev === 2) col = "FBEFD9"; else col = "EAF3EE";
      s.addShape(pres.shapes.RECTANGLE, { x: plotX + c * cellW, y: plotY + r * cellH, w: cellW, h: cellH, fill: { color: col }, line: { color: "FFFFFF", width: 1.5 } });
    }
  }
  // axis labels
  s.addText("PROBABILITY →", { x: mx + 0.04, y: my + 0.1, w: 0.34, h: plotH, margin: 0, fontFace: BODY, fontSize: 8, bold: true, color: NAVY, align: "center", valign: "middle", rotate: 270 });
  s.addText("IMPACT →", { x: plotX, y: my + msz - 0.32, w: plotW, h: 0.26, margin: 0, fontFace: BODY, fontSize: 8, bold: true, color: NAVY, align: "center", valign: "middle" });
  // L/M/H ticks
  ["L", "M", "H"].forEach((t, i) => {
    s.addText(t, { x: plotX + i * cellW, y: my + msz - 0.5, w: cellW, h: 0.2, margin: 0, fontFace: BODY, fontSize: 7.5, color: MUTED, align: "center" });
    s.addText(["H", "M", "L"][i], { x: mx + 0.28, y: plotY + i * cellH, w: 0.2, h: cellH, margin: 0, fontFace: BODY, fontSize: 7.5, color: MUTED, align: "center", valign: "middle" });
  });
  // plot risks: cell center by [probIdx(0=L..2=H from bottom), impactIdx]
  const risks = [
    { n: "1", lab: "Flood", p: 2, im: 2 },
    { n: "5", lab: "Land delay", p: 2, im: 2 },
    { n: "2", lab: "Elite capture", p: 1, im: 2 },
    { n: "3", lab: "Women safety", p: 1, im: 2 },
    { n: "4", lab: "Re-migration", p: 1, im: 2 },
    { n: "6", lab: "Bank inertia", p: 1, im: 1 },
  ];
  // group offset for overlapping cells
  const cellCount = {};
  risks.forEach((rk) => {
    const key = `${rk.p}-${rk.im}`;
    cellCount[key] = (cellCount[key] || 0);
    const idx = cellCount[key]++;
    const rowFromTop = 2 - rk.p;
    const baseCx = plotX + rk.im * cellW + cellW / 2;
    const baseCy = plotY + rowFromTop * cellH + cellH / 2;
    // arrange multiple in a cell side by side
    const total = risks.filter((z) => z.p === rk.p && z.im === rk.im).length;
    const spread = 0.28;
    const ox = (idx - (total - 1) / 2) * spread;
    const cxp = baseCx + ox, cyp = baseCy;
    s.addShape(pres.shapes.OVAL, { x: cxp - 0.14, y: cyp - 0.14, w: 0.28, h: 0.28, fill: { color: NAVY }, line: { color: "FFFFFF", width: 1.5 }, shadow: shS() });
    s.addText(rk.n, { x: cxp - 0.14, y: cyp - 0.14, w: 0.28, h: 0.28, margin: 0, fontFace: BODY, fontSize: 9.5, bold: true, color: AMBER, align: "center", valign: "middle" });
  });
  s.addText("Red = act first (high severity)", { x: mx + 0.1, y: my + 0.04, w: msz - 0.2, h: 0.2, margin: 0, fontFace: BODY, fontSize: 7, italic: true, color: MUTED, align: "right" });

  // ---- RIGHT: risk register with mitigations ----
  const rx = mx + msz + 0.3, rw = USABLE - msz - 0.3;
  s.addText("RISK REGISTER — PROBABILITY / IMPACT + MITIGATION", { x: rx, y: 1.5, w: rw, h: 0.26, margin: 0, fontFace: BODY, fontSize: 10.5, bold: true, color: NAVY });
  const reg = [
    ["1", "Flood disruption", "H / H", "Elevated non-flood sites · flood insurance · raised plinths · Kosi-Mechi alignment"],
    ["2", "Elite / caste capture", "M / H", "EBC / Mahadalit / landless quotas · social audits · public beneficiary lists"],
    ["3", "Women's mobility / safety", "M / H", "Units near villages · creches · women-only production lines"],
    ["4", "Returnee re-migration", "M / H", "Wage parity + housing / childcare + owner tracks"],
    ["5", "Land delay / litigation", "H / H", "Govt land first · willing-seller · legal fast-track"],
    ["6", "Banking inertia on C-D", "M / M", "State-deposit pressure · RBI engagement · guarantee de-risking"],
  ];
  const rhd = 0.3, rrh = 0.52, ry0 = 1.82;
  reg.forEach((r, i) => {
    const y = ry0 + i * rrh;
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y, w: rw, h: rrh - 0.06, fill: { color: i % 2 ? "FFFFFF" : "EEF2F5" }, line: { color: GRID, width: 0.5 }, shadow: i % 2 ? undefined : undefined });
    // number circle
    s.addShape(pres.shapes.OVAL, { x: rx + 0.08, y: y + (rrh - 0.06) / 2 - 0.13, w: 0.26, h: 0.26, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(r[0], { x: rx + 0.08, y: y + (rrh - 0.06) / 2 - 0.13, w: 0.26, h: 0.26, margin: 0, fontFace: BODY, fontSize: 9, bold: true, color: AMBER, align: "center", valign: "middle" });
    s.addText(r[1], { x: rx + 0.42, y: y + 0.03, w: 1.95, h: 0.24, margin: 0, fontFace: BODY, fontSize: 9.3, bold: true, color: NAVY, valign: "middle" });
    // P/I chip
    const sev = r[2] === "H / H" ? "D9534F" : (r[2] === "M / M" ? TEALD : AMBERD);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: rx + 2.4, y: y + 0.04, w: 0.7, h: 0.22, rectRadius: 0.04, fill: { color: sev }, line: { type: "none" } });
    s.addText(r[2], { x: rx + 2.4, y: y + 0.04, w: 0.7, h: 0.22, margin: 0, fontFace: BODY, fontSize: 7.8, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    s.addText(r[3], { x: rx + 0.42, y: y + 0.26, w: rw - 0.5, h: 0.24, margin: 0, fontFace: BODY, fontSize: 8.2, color: INK, valign: "middle", lineSpacingMultiple: 0.9 });
  });

  // ---- BOTTOM: references + AI disclosure ----
  const refY = 5.08;
  s.addShape(pres.shapes.RECTANGLE, { x: ML, y: refY, w: USABLE, h: 1.62, fill: { color: NAVY }, line: { type: "none" }, shadow: shS() });
  s.addShape(pres.shapes.RECTANGLE, { x: ML, y: refY, w: 0.09, h: 1.62, fill: { color: AMBER }, line: { type: "none" } });
  s.addText("REFERENCES", { x: ML + 0.26, y: refY + 0.08, w: 4, h: 0.24, margin: 0, fontFace: BODY, fontSize: 10, bold: true, color: AMBER, charSpacing: 1 });
  const refsL = [
    "1.  Bihar Economic Survey 2025-26 (GSDP, per-capita, factories, ITIs, mfg share).",
    "2.  ECI Bihar 2025 (mandate / seat share).",
    "3.  PIB — MMRY, JEEViKA Nidhi, National Makhana Board (Rs 476.03-cr scheme).",
    "4.  BIPPP-2025 cabinet approval; Union Budget 2025-26 (Makhana Board, NIFTEM, airports).",
    "5.  IBEF / Invest India — AKIC-Gaya, EDFC, FDI inflow.",
    "6.  Census 2011 / Journal of Migration Affairs (out-migration, remittances).",
  ];
  const refsR = [
    "7.  RBI / SLBC Bihar — credit-deposit ratio; SIDBI / CGTMSE — guarantee model.",
    "8.  Telangana TS-iPASS (statutory single window).",
    "9.  UP ODOP; Tirupur & Bangladesh RMG; Sialkot CFCs.",
    "10. Kerala NORKA (migrant & returnee mission).",
    "11. Amul / GCMMF; SEWA / Lijjat (producer-group models).",
    "12. German dual-VET; Vietnam China+1 pre-training.",
  ];
  s.addText(refsL.map((t) => ({ text: t, options: { breakLine: true, paraSpaceAfter: 3 } })), { x: ML + 0.26, y: refY + 0.34, w: USABLE / 2 - 0.4, h: 1.2, margin: 0, fontFace: BODY, fontSize: 8, color: "C7D6E2", valign: "top", lineSpacingMultiple: 0.98 });
  s.addText(refsR.map((t) => ({ text: t, options: { breakLine: true, paraSpaceAfter: 3 } })), { x: ML + USABLE / 2 + 0.05, y: refY + 0.34, w: USABLE / 2 - 0.3, h: 1.2, margin: 0, fontFace: BODY, fontSize: 8, color: "C7D6E2", valign: "top", lineSpacingMultiple: 0.98 });
  s.addText([
    { text: "AI-usage disclosure:  ", options: { bold: true, color: AMBER, fontSize: 8 } },
    { text: "Drafting and layout were AI-assisted. Every figure was human-verified against the cited public sources above; no data was generated by the model.", options: { color: "9DB7CC", fontSize: 8, italic: true } },
  ], { x: ML + 0.26, y: refY + 1.34, w: USABLE - 0.5, h: 0.24, margin: 0, fontFace: BODY, valign: "middle" });

  sourceLine(s, "Risk assessment is the authors' analysis; mitigations align to Bihar's existing delivery institutions and the cited model transfers.");
})();

// ----------------------------------------------------------------------------
pres.writeFile({ fileName: "/workspace/deck/UDAAN_2.0.pptx" }).then((f) => {
  console.log("WROTE", f);
}).catch((e) => { console.error("ERR", e); process.exit(1); });
