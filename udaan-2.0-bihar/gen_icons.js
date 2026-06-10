// Generate PNG icons (react-icons -> SVG -> PNG via sharp) for the UDAAN 2.0 deck.
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const fa = require("react-icons/fa");

const OUT = "/workspace/deck/assets";
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const COLORS = {
  white: "#FFFFFF",
  navy: "#0F2A43",
  teal: "#0E8C84",
  amber: "#E0901F",
  muted: "#6B7C8A",
};

// icon key -> react-icons/fa component name
const ICONS = {
  landmark: "FaLandmark",
  coins: "FaCoins",
  seedling: "FaSeedling",
  plane: "FaPlaneDeparture",
  hourglass: "FaHourglassHalf",
  walking: "FaWalking",
  female: "FaFemale",
  tractor: "FaTractor",
  grad: "FaUserGraduate",
  globe: "FaGlobeAsia",
  hands: "FaHandsHelping",
  store: "FaStore",
  users: "FaUsers",
  award: "FaAward",
  train: "FaTrain",
  mapmark: "FaMapMarkedAlt",
  bolt: "FaBolt",
  truck: "FaTruck",
  bank: "FaUniversity",
  balance: "FaBalanceScale",
  industry: "FaIndustry",
  warehouse: "FaWarehouse",
  solar: "FaSolarPanel",
  water: "FaWater",
  check: "FaCheckCircle",
  arrow: "FaArrowRight",
  building: "FaBuilding",
  handmoney: "FaHandHoldingUsd",
  leaf: "FaLeaf",
  tshirt: "FaTshirt",
  shoe: "FaShoePrints",
  chip: "FaMicrochip",
  chart: "FaChartLine",
  signature: "FaFileSignature",
  shield: "FaShieldAlt",
  clock: "FaClock",
  route: "FaRoute",
  flag: "FaFlagCheckered",
  cog: "FaCogs",
  seed2: "FaLeaf",
  home: "FaHome",
  baby: "FaBaby",
  vote: "FaVoteYea",
  briefcase: "FaBriefcase",
  handshake: "FaHandshake",
  recycle: "FaRecycle",
  bullseye: "FaBullseye",
  layer: "FaLayerGroup",
  scroll: "FaScroll",
  water2: "FaTint",
};

async function render(iconKey, compName, colorKey) {
  const Comp = fa[compName];
  if (!Comp) { console.log("MISSING", compName); return; }
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: COLORS[colorKey], size: "256" })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(`${OUT}/${iconKey}_${colorKey}.png`, png);
}

(async () => {
  const wanted = ["white", "navy", "teal", "amber", "muted"];
  for (const [k, comp] of Object.entries(ICONS)) {
    for (const c of wanted) {
      await render(k, comp, c);
    }
  }
  console.log("Icons generated:", Object.keys(ICONS).length, "x", wanted.length);
})();
