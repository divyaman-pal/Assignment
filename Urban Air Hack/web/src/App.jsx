import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as api from "./api.js";
import { wardAqi, stationLabel, MAX_KM, bandOf } from "./geo.js";

const CITIES = { delhi: { name: "Delhi", center: [77.1, 28.65], zoom: 9.6 },
                 mumbai: { name: "Mumbai", center: [72.88, 19.08], zoom: 10.2 },
                 bengaluru: { name: "Bengaluru", center: [77.59, 12.97], zoom: 10.5 } };
const BAND_COLORS = { Good: "#3fb950", Satisfactory: "#7ee787", Moderate: "#d29922",
                      Poor: "#f0883e", "Very Poor": "#ff7b72", Severe: "#da3633" };
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const STALE_AFTER_H = 24;

// Reading timestamps are IST wall-clock without a zone, so the browser clock is
// not a safe reference. Both sides of this comparison come from the store.
function isStale(asOf, newestAsOf) {
  if (!asOf) return false;
  if (!newestAsOf) return false;
  const t = Date.parse(String(asOf).replace(" ", "T") + "Z");
  const n = Date.parse(String(newestAsOf).replace(" ", "T") + "Z");
  if (!isFinite(t) || !isFinite(n)) return false;
  return (n - t) > 36e5 * STALE_AFTER_H;
}

export default function App() {
  const [city, setCity] = useState("delhi");
  const [tab, setTab] = useState("actions");
  const [stations, setStations] = useState([]);
  const [events, setEvents] = useState([]);
  const [actions, setActions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [replay, setReplay] = useState(null);
  const [replayBusy, setReplayBusy] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [mode, setMode] = useState("commissioner");
  const [era, setEra] = useState("episode");   // "live" | "episode"
  const [live, setLive] = useState(null);
  const mapRef = useRef(null);
  const mapObj = useRef(null);

  useEffect(() => {
    const m = new maplibregl.Map({ container: mapRef.current, style: MAP_STYLE,
      center: CITIES[city].center, zoom: CITIES[city].zoom, attributionControl: true });
    mapObj.current = m;
    // Popups: bound once for the map's lifetime (layers come and go beneath them)
    m.on("click", "stations-dots", e => {
      const p = e.features[0].properties;
      new maplibregl.Popup().setLngLat(e.lngLat).setHTML(
        `<b>${p.name}</b><br/>PM2.5: ${p.pm25 == null ? "—" : Math.round(p.pm25)} µg/m³<br/>` +
        `AQI: <b>${p.aqi == null ? "—" : Math.round(p.aqi)}</b> (${p.band})` +
        (p.as_of ? `<br/><span style="color:#8b949e">as of ${p.as_of}` +
          (p.stale ? " — no current reading from this station" : "") + `</span>` : "")).addTo(m);
    });
    m.on("click", "wards-fill", e => {
      if (!e.features || !e.features[0]) return;
      if (m.queryRenderedFeatures(e.point, { layers: ["stations-dots"] }).length) return;
      const w = e.features[0].properties;
      new maplibregl.Popup().setLngLat(e.lngLat).setHTML(
        `<b>${w.name}</b><br/>Schools: ${w.schools} · Hospitals: ${w.hospitals}<br/>` +
        `Industrial zones: ${w.industrial} · Construction: ${w.construction}<br/>` +
        `<span style="color:#8b949e">vulnerability data: OpenStreetMap</span>`).addTo(m);
    });
    m.on("mouseenter", "stations-dots", () => { m.getCanvas().style.cursor = "pointer"; });
    m.on("mouseleave", "stations-dots", () => { m.getCanvas().style.cursor = ""; });
    return () => m.remove();
  }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      const safe = (p, fallback) => p.catch(e => { console.warn("source failed:", e && e.message); return fallback; });
      const [st0, ev, ac, wards, lv] = await Promise.all([
        safe(api.getStations(city), []),
        safe(api.getEvents(city, era === "live" ? 3 : null), []),
        safe(api.getActions(city, era === "live" ? 3 : null), []),
        safe(api.getWards(city), { type: "FeatureCollection", features: [] }), safe(api.getLive(), null)]);
      if (dead) return;
      const cityName = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[city];
      // With the live API configured, /stations already returns the newest
      // government reading per station. The bundled snapshot is only a
      // fallback for backend-free operation.
      const st = (st0 && st0.length) ? st0
        : (era === "live" && lv && lv.available)
          ? lv.stations.filter(s => s.city === cityName).map(s => ({ station_id: s.station,
              station_name: s.station, lat: s.lat, lon: s.lon, pm25: s.pm25, pm10: s.pm10,
              aqi: s.aqi, band: s.band }))
          : [];
      setStations(st); setEvents(ev); setActions(ac);
      // reference point for staleness: the freshest reading anywhere in the store
      const newestAsOf = (lv && lv.as_of) ||
        st.map(s => s.as_of).filter(Boolean).sort().pop() || null;
      const m = mapObj.current;
      const draw = () => {
        ["wards-fill", "wards-line", "stations-dots"].forEach(id => { if (m.getLayer(id)) m.removeLayer(id); });
        ["wards", "stations"].forEach(id => { if (m.getSource(id)) m.removeSource(id); });
        m.addSource("wards", { type: "geojson", data: wards });
        m.addLayer({ id: "wards-fill", type: "fill", source: "wards",
          paint: { "fill-color": "#1f6feb", "fill-opacity": 0.06 } });
        m.addLayer({ id: "wards-line", type: "line", source: "wards",
          paint: { "line-color": "#30363d", "line-width": 0.6 } });
        m.addSource("stations", { type: "geojson", data: {
          type: "FeatureCollection",
          features: st.filter(s => s.lat).map(s => ({ type: "Feature",
            properties: { name: s.station_name, aqi: s.aqi, band: s.band || "NA", pm25: s.pm25,
                          as_of: s.as_of || "",
                          // a station in the archive but absent from the current
                          // government feed must not be drawn as if it were live.
                          // Compared against the newest reading in the store, not
                          // the browser clock: these timestamps carry no timezone.
                          stale: (era === "live" && isStale(s.as_of, newestAsOf)) ? 1 : 0 },
            geometry: { type: "Point", coordinates: [s.lon, s.lat] } })) } });
        m.addLayer({ id: "stations-dots", type: "circle", source: "stations",
          paint: { "circle-radius": ["case", ["==", ["get", "stale"], 1], 4, 7],
            "circle-opacity": ["case", ["==", ["get", "stale"], 1], 0.35, 1],
            "circle-stroke-width": 1.5, "circle-stroke-color": "#0d1117",
            "circle-color": ["case", ["==", ["get", "stale"], 1], "#8b949e",
              ["match", ["get", "band"], ...Object.entries(BAND_COLORS).flat(), "#8b949e"]] } });
        // Dark-matter renders land at near-black; lift it so roads and place
        // names read against the app chrome.
        try { m.setPaintProperty("background", "background-color", "#101720"); } catch (e) {}
        m.flyTo({ center: CITIES[city].center, zoom: CITIES[city].zoom, duration: 900, essential: true });
      };
      // Draw as soon as the style JSON is parsed (that is all addSource/addLayer
      // need). Do NOT gate on isStyleLoaded()/"idle" — with vector basemaps those
      // can stay false indefinitely, which silently leaves the map empty.
      const styleReady = () => { try { return !!(m.style && m.getStyle() && m.getStyle().layers.length); } catch (e) { return false; } };
      if (styleReady()) draw();
      else m.once("load", () => { if (!dead) draw(); });
    })().catch(console.error);
    return () => { dead = true; };
  }, [city, era]);

  useEffect(() => { api.getMetrics().then(setMetrics).catch(console.error); }, []);

  useEffect(() => { api.getLive().then(l => {
    setLive(l);
    if (l && l.available) setEra("live");
  }).catch(console.error); }, []);

  useEffect(() => {
    const m = mapObj.current; if (!m) return;
    const remove = () => { if (m.getLayer("grid-fill")) m.removeLayer("grid-fill"); if (m.getSource("grid")) m.removeSource("grid"); };
    if (!showGrid) { remove(); return; }
    api.getGrid(city).then(g => {
      remove();
      const d = g.cell_deg / 2;
      const feats = g.cells.map(([x, y, pm, aqi]) => ({ type: "Feature", properties: { pm, aqi },
        geometry: { type: "Polygon", coordinates: [[[x-d,y-d],[x+d,y-d],[x+d,y+d],[x-d,y+d],[x-d,y-d]]] } }));
      m.addSource("grid", { type: "geojson", data: { type: "FeatureCollection", features: feats } });
      m.addLayer({ id: "grid-fill", type: "fill", source: "grid", paint: {
        "fill-opacity": 0.45,
        "fill-color": ["step", ["get", "aqi"], "#3fb950", 51, "#7ee787", 101, "#d29922", 201, "#f0883e", 301, "#ff7b72", 401, "#da3633"] } },
        m.getLayer("stations-dots") ? "stations-dots" : undefined);
    }).catch(console.error);
  }, [showGrid, city]);

  async function doReplay() {
    setReplayBusy(true); setTab("replay");
    try { setReplay(await api.runReplay(CITIES[city].name)); }
    catch (e) { setReplay({ error: String(e) }); }
    setReplayBusy(false);
  }

  return (
    <>
      <header>
        <h1>VAYU<span>-NET</span></h1>
        <span className="tag">signal → attribution → forecast → enforcement → advisory</span>
        {Object.entries(CITIES).map(([slug, c]) => (
          <button key={slug} className={`citybtn ${city === slug ? "active" : ""}`}
                  onClick={() => setCity(slug)}>{c.name}</button>))}
        <button className={`citybtn ${showGrid ? "active" : ""}`} onClick={() => setShowGrid(g => !g)}>
          Forecast +24h grid</button>
        <button className={`citybtn ${era === "live" ? "active" : ""}`}
          onClick={() => setEra(e => e === "live" ? "episode" : "live")}
          title={live && live.available ? "" : "Live feed activates once DATA_GOV_IN_KEY is configured"}>
          {era === "live" ? "● LIVE" : "Crisis episode"}</button>
        <button className={`citybtn ${mode === "citizen" ? "active" : ""}`}
          onClick={() => setMode(m => m === "citizen" ? "commissioner" : "citizen")}>
          {mode === "citizen" ? "◀ War-room" : "Citizen mode"}</button>
        <button className="replaybtn" onClick={doReplay} disabled={replayBusy}>
          {replayBusy ? "Running agents…" : "▶ Run war-room replay"}</button>
      </header>
      <div className="era-banner">
        {era === "live"
          ? (live && live.available
              ? `LIVE — official data.gov.in feed, latest reading ${live.as_of} (${ageLabel(live)})` +
                `${live.fresh_stations ? ` · ${live.fresh_stations} sensors reporting` : ""}` +
                ` · analytics run on the last 72 hours`
              : "LIVE — awaiting the first government snapshot of this cycle")
          : "CRISIS EPISODE — real CPCB data, Dec 25 2025 – Jan 1 2026 (New Year smog crisis) · every number from government sensors + NASA satellites"}
      </div>
      <div className="main">
        <div id="map" ref={mapRef} />
        {mode === "citizen" ? <CitizenView city={city} /> : <div className="rail">
          <div className="tabs">
            {["actions", "events", "compare", "metrics", "replay"].map(t => (
              <button key={t} className={`tab ${tab === t ? "active" : ""}`}
                      onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>))}
          </div>
          <div className="railbody">
            {tab === "actions" && <Actions actions={actions} era={era} live={live} city={city} />}
            {tab === "events" && <Events events={events} era={era} live={live} city={city} />}
            {tab === "compare" && <Compare />}
            {tab === "metrics" && <Metrics metrics={metrics} />}
            {tab === "replay" && <Replay replay={replay} busy={replayBusy} />}
          </div>
        </div>}
      </div>
      <div className="footer">
        Data: CPCB CAAQMS via Vonter/india-cpcb-aqi (ODbL) · Wards: DataMeet (CC-BY) ·
        Attribution = evidence-weighted likelihood with confidence, not legal proof ·
        {api.hasLiveApi() ? " live API" : " static deployment (no backend required)"}
      </div>
    </>
  );
}

const MUMBAI_WARDS = { "A": "A — Colaba", "B": "B — Sandhurst Rd", "C": "C — Marine Lines",
  "D": "D — Grant Road", "E": "E — Byculla", "F/N": "F North — Matunga·Sion", "F/S": "F South — Parel",
  "G/N": "G North — Dadar", "G/S": "G South — Worli", "H/E": "H East — Bandra E", "H/W": "H West — Bandra W",
  "K/E": "K East — Andheri E", "K/W": "K West — Andheri W", "L": "L — Kurla", "M/E": "M East — Govandi·Deonar",
  "M/W": "M West — Chembur", "N": "N — Ghatkopar", "P/N": "P North — Malad", "P/S": "P South — Goregaon",
  "R/C": "R Central — Borivali", "R/N": "R North — Dahisar", "R/S": "R South — Kandivali", "S": "S — Bhandup", "T": "T — Mulund" };
const wardLabel = n => MUMBAI_WARDS[n] || n;


// ---- Citizen mode: ward-level advisory with voice (IVR/public-display channel) ----
const CPCB_HEALTH = { Good: "Minimal impact.", Satisfactory: "Minor breathing discomfort to sensitive people.",
  Moderate: "Breathing discomfort to people with lung disease, children and older adults.",
  Poor: "Breathing discomfort to most people on prolonged exposure.",
  "Very Poor": "Respiratory illness on prolonged exposure.",
  Severe: "Affects healthy people and seriously impacts those with existing diseases." };
const GROUP_ACTIONS = {
  schools: { Poor: "Limit outdoor sports and assembly.", "Very Poor": "Move all activity indoors; masks for commutes.", Severe: "Recommend closure of outdoor activities; consider remote classes." },
  outdoor_workers: { Poor: "Take breaks away from traffic; N95 recommended.", "Very Poor": "N95 required; rotate shifts to reduce exposure.", Severe: "Minimise outdoor hours; employers should reschedule work." },
  elderly: { Poor: "Avoid morning walks near roads.", "Very Poor": "Stay indoors during peak hours; keep medication at hand.", Severe: "Remain indoors; use purifiers if available; seek help if breathless." },
  general: { Poor: "Reduce prolonged outdoor exertion.", "Very Poor": "Avoid outdoor exercise; keep windows closed at peak hours.", Severe: "Avoid all outdoor exertion; wear N95 outdoors." } };
// bandOf now lives in geo.js — one definition of the CPCB breakpoints, shared
// by the estimator and by whatever renders its output.

// State the real age rather than claiming a refresh cadence: the scheduled
// ingest is best-effort, and asserting "refreshed hourly" over a stale reading
// is exactly the claim the banner should not be making. Age comes from the API,
// measured against the database clock — readings carry no timezone, so the
// browser cannot work it out on its own.
function ageLabel(live) {
  const h = live && typeof live.age_hours === "number" ? live.age_hours : null;
  if (h === null) return "age unknown";
  if (h < 1.5) return "under an hour old";
  if (h < 48) return `${Math.round(h)}h old`;
  return `${Math.round(h / 24)} days old`;
}
const TTS_LANG = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", kn: "kn-IN" };

// The reading panel. A measured value and an interpolated one are different
// kinds of claim, so they are different objects on screen — same-looking
// numbers with a caption underneath is what let a city average be read as a
// ward reading. An estimate is dashed, labelled, and carries the sensors it
// came from; a ward with no sensor in range shows no number at all.
function WardReading({ est, bandColor }) {
  if (!est) return <div className="card" style={{ textAlign: "center" }}>Loading…</div>;

  if (est.status === "unavailable") return (
    <div className="card" style={{ textAlign: "center", borderStyle: "dashed" }}>
      <div style={{ fontSize: 46, fontWeight: 700, color: "#8b949e" }}>—</div>
      <div style={{ color: "#8b949e", fontWeight: 700 }}>No coverage</div>
      <div className="evli" style={{ marginLeft: 0, marginTop: 6 }}>
        No reporting sensor within {MAX_KM} km of this ward. We will not estimate
        this far out — no advisory can be issued here.
      </div>
    </div>);

  const measured = est.status === "measured";
  return (
    <div className="card" style={{ textAlign: "center",
      borderStyle: measured ? "solid" : "dashed",
      borderColor: measured ? "#30363d" : "#8b6d1f" }}>
      <div style={{ marginBottom: 2 }}>
        <span className="badge" style={{
          background: measured ? "#1f6feb" : "#8b6d1f", color: "#fff" }}>
          {measured ? "MEASURED" : "ESTIMATED"}</span>
      </div>
      <div style={{ fontSize: 46, fontWeight: 700, color: bandColor }}>{est.aqi}</div>
      <div style={{ color: bandColor, fontWeight: 700 }}>{est.band}</div>

      {measured ? (
        <div className="evli" style={{ marginLeft: 0, marginTop: 6 }}>
          {est.contributors.length === 1
            ? `sensor ${stationLabel(est.contributors[0].name)}, in this ward`
            : `worst of ${est.contributors.length} sensors in this ward ` +
              `(${est.contributors.map(c => `${stationLabel(c.name)} ${c.aqi}`).join(", ")})`}
        </div>
      ) : (<>
        <div className="evli" style={{ marginLeft: 0, marginTop: 6 }}>
          <b style={{ color: "#d29922" }}>No sensor in this ward.</b> Interpolated from{" "}
          {est.contributors.length} sensor{est.contributors.length > 1 ? "s" : ""} within{" "}
          {MAX_KM} km — nearest {est.nearestKm.toFixed(1)} km away.{" "}
          Confidence <b>{est.confidence}</b>.
        </div>
        <div className="evli" style={{ marginLeft: 0, marginTop: 4, textAlign: "left" }}>
          {est.contributors.map((c, i) => (
            <div key={i}>• {stationLabel(c.name)} — AQI {c.aqi} ({c.band}), {c.km.toFixed(1)} km</div>
          ))}
        </div>
      </>)}

      {est.understated && (
        <div style={{ marginTop: 8, padding: "6px 8px", borderRadius: 6,
          background: "#3d1d1d", border: "1px solid #da3633", textAlign: "left" }}>
          <b style={{ color: "#ff7b72" }}>Nearby sensor reads worse.</b>
          <div className="evli" style={{ marginLeft: 0, color: "#e6edf3" }}>
            {stationLabel(est.understated.name)} is at AQI {est.understated.aqi}{" "}
            ({est.understated.band}), {est.understated.km.toFixed(1)} km away. If you are
            closer to it than to the others, follow the {est.understated.band} guidance.
          </div>
        </div>)}
    </div>);
}

function CitizenView({ city }) {
  const [wards, setWards] = useState([]);
  const [stations, setStations] = useState([]);
  const [ward, setWard] = useState("");
  const [group, setGroup] = useState("general");
  const [lang, setLang] = useState("en");
  const [adv, setAdv] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => {
    const [wg, st] = await Promise.all([api.getWards(city), api.getStations(city)]);
    // Keep the GeoJSON feature: the estimator needs the geometry to place the
    // ward, not just its name.
    const list = wg.features.map(f => ({ id: f.properties.ward_id, name: f.properties.name,
      schools: f.properties.schools, hospitals: f.properties.hospitals, feature: f }));
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    setWards(list); setStations(st); setWard(list[0]?.id || ""); setAdv(null);
  })().catch(console.error); }, [city]);

  // A station absent from the current feed keeps serving its last archived
  // reading. Averaging those in put winter-crisis numbers behind a live health
  // advisory — the citizen view showed AQI 271 for monsoon-season Delhi.
  const newestAsOf = stations.map(s => s.as_of).filter(Boolean).sort().pop() || null;
  const fresh = stations.filter(s => s.aqi && !isStale(s.as_of, newestAsOf));
  const w = wards.find(x => x.id === ward);

  // Three outcomes, never conflated: measured / estimated / unavailable.
  // See web/src/geo.js for why the city mean was removed.
  const est = w ? wardAqi(w.feature, fresh) : null;
  const aqi = est ? est.aqi : null;
  const band = est ? est.band : null;

  // Wards are named after municipal charges, so the ward holding the Anand
  // Vihar sensor is listed as "I.P EXTENTION". Residents search for the
  // landmark; show them both.
  const sensorIn = {};
  fresh.forEach(s => {
    const k = String(s.ward_id);
    if (!sensorIn[k] || s.aqi > sensorIn[k].aqi) sensorIn[k] = s;
  });
  const dropdownLabel = x => {
    const s = sensorIn[String(x.id)];
    return s ? `${wardLabel(x.name)} — ${stationLabel(s.station_name)}` : wardLabel(x.name);
  };

  async function getAdvice() {
    if (!w || !est || est.aqi === null) return;
    setBusy(true);
    // `basis` must match where the number came from — the API renders
    // "measured now" for current and says so for an estimate. Sending the
    // wrong one would make the system state a measurement it does not have.
    const basis = est.status === "measured" ? "current" : "estimated";
    const lead = est.status === "measured"
      ? `AQI ${aqi} (${band}) measured now`
      : `an estimated AQI ${aqi} (${band}), interpolated from sensors near this ward`;
    const fallback = `Air quality alert for ${wardLabel(w.name)}: ${lead}. ` +
      `${CPCB_HEALTH[band]} ${(GROUP_ACTIONS[group] || {})[band] || "Follow general precautions."}`;
    try {
      const r = await api.getAdvisory(city, w.name, aqi, group, lang, basis);
      // The client knows the provenance for certain; the API is only told. An
      // API that does not echo the basis back is older than this field and will
      // describe an interpolated number as "measured now" — which is the exact
      // claim being guarded against, so the local template wins instead. Front
      // end and API deploy separately, so this skew is not hypothetical: it is
      // the state of every deployment between the two pushes.
      const honoured = r && r.text && (basis !== "estimated" || r.basis === "estimated");
      setAdv(honoured ? r : { text: fallback, lang: "en",
        source: r && r.text ? "official CPCB template (API did not confirm basis)"
                            : "official CPCB template" });
    } catch { setAdv({ text: fallback, lang: "en", source: "official CPCB template" }); }
    setBusy(false);
  }
  function speak() {
    if (!adv) return;
    const u = new SpeechSynthesisUtterance(adv.text);
    u.lang = TTS_LANG[adv.lang] || "en-IN"; u.rate = 0.95;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  const bandColor = { Good: "#3fb950", Satisfactory: "#7ee787", Moderate: "#d29922", Poor: "#f0883e", "Very Poor": "#ff7b72", Severe: "#da3633" }[band] || "#8b949e";
  return (
    <div className="rail">
      <div className="railbody">
        <div className="card"><h4>My ward</h4>
          <select value={ward} onChange={e => { setWard(e.target.value); setAdv(null); }}
            style={{ width: "100%", padding: 6, background: "#21262d", color: "#e6edf3", border: "1px solid #30363d", borderRadius: 6 }}>
            {wards.map(x => <option key={x.id} value={x.id}>{dropdownLabel(x)}</option>)}
          </select>
          <div className="evli" style={{ marginTop: 6 }}>
            {w ? `${w.schools} schools · ${w.hospitals} hospitals in this ward (OpenStreetMap)` : ""}</div>
        </div>
        <WardReading est={est} bandColor={bandColor} />
        <div className="card"><h4>Who is this for?</h4>
          {Object.keys(GROUP_ACTIONS).map(g => (
            <button key={g} className={`langbtn ${group === g ? "active" : ""}`}
              style={{ margin: 3, background: group === g ? "#1f6feb" : undefined }}
              onClick={() => { setGroup(g); setAdv(null); }}>{g.replace("_", " ")}</button>))}
          <div style={{ marginTop: 8 }}>
            {["en", "hi", "mr", "kn"].map(l => (
              <button key={l} className="langbtn" style={{ margin: 3, background: lang === l ? "#1f6feb" : undefined }}
                onClick={() => { setLang(l); setAdv(null); }}>{{ en: "English", hi: "हिंदी", mr: "मराठी", kn: "ಕನ್ನಡ" }[l]}</button>))}
          </div>
          <button className="replaybtn" style={{ marginTop: 10, width: "100%" }} onClick={getAdvice} disabled={busy || !aqi}>
            {busy ? "Preparing…" : "Get my advisory"}</button>
        </div>
        {adv && <div className="card">
          <div style={{ fontSize: 15, lineHeight: 1.5 }}>{adv.text}</div>
          <div className="evli" style={{ marginTop: 6 }}>source: {adv.source}</div>
          <button className="langbtn" style={{ marginTop: 8 }} onClick={speak}>🔊 Listen (IVR / public display)</button>
        </div>}
        <div className="card evli">Health guidance text is CPCB's official National AQI wording — never AI-generated.
          Translations are AI-assisted with validation and safe fallback.</div>
      </div>
    </div>);
}

function LiveNote({ what }) {
  return (
    <div className="card" style={{ borderLeft: "3px solid #3fb950" }}>
      <b style={{ color: "#3fb950" }}>No {what} in the last 72 hours.</b> The agents ran on the current
      government feed and no ward cleared the trigger thresholds in that window.
      <div className="evli" style={{ marginTop: 6 }}>
        Switch to <b>Crisis episode</b> to see the full chain on the December smog week, or open
        <b> Replay</b> to run the agents live against the current data.
      </div>
    </div>);
}

function LiveHotspots({ live, city }) {
  const cityName = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[city];
  const hot = (live && live.available ? live.stations : [])
    .filter(s => s.city === cityName && s.aqi >= 201)
    .sort((a, b) => b.aqi - a.aqi);
  if (!hot.length) return (
    <div className="card"><b style={{ color: "#3fb950" }}>No live hotspots right now</b> — no station in
      {" "}{cityName} is above AQI 200 in the latest government snapshot.</div>);
  return (
    <div className="card">
      <h4 style={{ color: "#ff7b72" }}>⚡ Current hotspots — live snapshot ({live.as_of})</h4>
      <table><thead><tr><th>Station</th><th>AQI</th><th>Band</th><th>PM2.5</th></tr></thead>
        <tbody>{hot.map(h => (<tr key={h.station}><td>{h.station.split(",")[0]}</td>
          <td style={{ fontWeight: 700 }}>{h.aqi}</td><td>{h.band}</td><td>{h.pm25 ?? "—"}</td></tr>))}</tbody></table>
      <div className="evli">Severity crossings need no history — these are actionable now. Source attribution joins in once 7 days accumulate.</div>
    </div>);
}

function Actions({ actions, era, live, city }) {
  if (!actions.length) return era === "live"
    ? <LiveNote what="enforcement action" />
    : <div className="card">No enforcement actions for this city in the episode window.</div>;
  return <>{actions.map(a => (
    <div className="card" key={a.action_id}>
      <span className="prio">{Number(a.priority).toFixed(2)}</span>
      <h4>{wardLabel(a.ward_name) || a.ward_id}</h4>
      <span className={`badge b-${a.category}`}>{a.category}</span>
      <span className="conf">{Math.round(a.confidence)}% confidence</span>
      <div className="evli">{a.n_events} events · mean PM2.5 {Math.round(a.mean_pm25)} µg/m³ (max {Math.round(a.max_pm25)})</div>
      <div className="evli">→ {a.action}</div>
      <div className="evli">Legal basis: {a.statute}</div>
      {api.packUrl(a.action_id) && <a href={api.packUrl(a.action_id)} target="_blank" rel="noreferrer">Evidence pack (PDF)</a>}
    </div>))}</>;
}

function Events({ events, era, live, city }) {
  // The API already returns newest-first. Taking the tail and reversing showed
  // the OLDEST 80 and dropped every recent event.
  const recent = events.slice(0, 80);
  const liveTop = era === "live" ? <LiveHotspots live={live} city={city} /> : null;
  if (!recent.length) return <>{liveTop}{era === "live"
    ? <LiveNote what="attributed pollution event" />
    : <div className="card">No events.</div>}</>;
  return <>{liveTop}{recent.map((e, i) => {
    const ev = safeParse(e.evidence_json);
    return (
      <div className="card" key={i}>
        <span className={`badge b-${e.category}`}>{e.category}</span>
        <span className="conf">{Math.round(e.confidence)}%</span>
        <span style={{ float: "right", color: "#8b949e" }}>{(e.h || "").slice(0, 16)}</span>
        <div className="evli">station {e.station_id} · PM2.5 {e.pm25} · {e.event_type}</div>
        {ev && ev.evidence && ev.evidence.slice(0, 3).map((b, j) => <div className="evli" key={j}>• {b}</div>)}
      </div>);
  })}</>;
}

function Compare() {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.getCompare().then(setRows).catch(e => { console.error(e); setRows([]); }); }, []);
  if (!rows) return <div className="card">Comparing cities…</div>;
  const dash = v => (v === null || v === undefined ? "—" : v);
  return (
    <>
      <div className="card">
        <h4>Same window, same scoring — cities directly comparable</h4>
        <table><thead><tr><th>City</th><th>Mean AQI</th><th>Max</th><th>Events</th><th>Top source</th><th>Top priority</th></tr></thead>
          <tbody>{rows.map(r => (<tr key={r.city}><td>{r.city}</td><td>{dash(r.meanAqi)}</td><td>{dash(r.maxAqi)}</td>
            <td>{dash(r.events)}</td><td>{dash(r.topSource)}</td><td>{dash(r.topPriority)}</td></tr>))}</tbody></table>
        <div className="evli">AQI is the latest reading per station (last 24h); events and priority span the
          full attributed record. Priority scores share one formula
          (severity × confidence × persistence × vulnerability), so cities rank on identical terms.</div>
      </div>
      <div className="card">
        <h4>Onboarding a 4th city</h4>
        <div className="evli">1 ward GeoJSON + 1 config block + `make onboard` — the entire pipeline (attribution,
          forecast, enforcement, advisory) applies unchanged. All data sources are national (CPCB, FIRMS, OSM).</div>
      </div>
    </>);
}

function Metrics({ metrics }) {
  if (!metrics) return <div className="card">Loading…</div>;
  const f = metrics.forecast || {};
  return (
    <>
      <div className="card">
        <h4>Forecast accuracy — honest backtest (test window = hardest 36h incl. NYE spike)</h4>
        <table><thead><tr><th>Horizon</th><th>Model RMSE</th><th>Persistence</th><th>Improvement</th></tr></thead>
          {/* horizons with no test window carry a note instead of numbers —
              rendering them as empty cells with a stray % read as broken */}
          <tbody>{Object.entries(f).map(([h, v]) => (v.n_test
            ? <tr key={h}><td>{h.slice(1)}h</td><td>{v.rmse_model}</td><td>{v.rmse_persistence}</td>
                <td>{v.improvement_vs_persistence_pct}%</td></tr>
            : <tr key={h}><td>{h.slice(1)}h</td>
                <td colSpan={3} style={{ color: "#8b949e", fontSize: 11 }}>
                  not backtested — {v.note || "no test window available"}</td></tr>))}</tbody></table>
      </div>
      <div className="card">
        <h4>Attribution</h4>
        <div className="evli">{metrics.attribution?.events} events · mean confidence {metrics.attribution?.mean_confidence}%</div>
        {/* reported from the store, not asserted: the layer silently ran on
            December detections for months while this claimed it was active */}
        <div className="evli">Satellite fire layer (VIIRS/FIRMS): {
          !metrics.fires || metrics.fires.status === "absent" ? "not loaded"
          : metrics.fires.status === "live"
            ? `live — ${metrics.fires.detections.toLocaleString()} detections, newest ${metrics.fires.newest}`
            : `archive only — newest detection ${metrics.fires.newest ?? "n/a"}, not current enough to inform attribution`
        }</div>
      </div>
      <div className="card">
        <h4>Attribution vs ground-truth inventory (CAQM unified report, Jan 2026)</h4>
        <table><thead><tr><th>Source</th><th>Ours*</th><th>CAQM winter</th><th>Why they differ</th></tr></thead>
          <tbody>{(metrics.inventory_validation?.rows || []).map(r => (
            <tr key={r.category}><td>{r.category}</td><td>{r.ours}%</td><td>{r.caqm}%</td>
              <td style={{ color: "#8b949e", fontSize: 11 }}>{r.note}</td></tr>))}</tbody></table>
        <div className="evli">*{metrics.inventory_validation?.caveat}</div>
      </div>
      <div className="card">
        <h4>Data integrity (build report)</h4>
        <div className="evli">{metrics.build?.readings_rows?.toLocaleString()} readings · {metrics.build?.stations_with_coords}/{metrics.build?.stations_total} stations geocoded</div>
        <div className="evli">{metrics.build?.verified_by_two_sources} station coordinates verified by two independent sources; {metrics.build?.coord_conflicts_dropped} conflicts dropped</div>
      </div>
    </>);
}

function Replay({ replay, busy }) {
  if (busy) return <div className="card">Agents running…</div>;
  if (!replay) return <div className="card">Click “Run war-room replay” to execute the live agent chain
    against the current government feed. Without the live API configured, the app replays a recorded
    run over the same dataset.</div>;
  if (replay.error || !replay.log) return <div className="card">Replay unavailable: {replay?.error || "data not found"}</div>;
  return (
    <div className="replaylog">
      <div className="card"><b>{replay.events}</b> events → <b>{replay.actions ?? 0}</b> ranked actions in <b>{replay.elapsed_s}s</b>
        {replay.mode === "precomputed" && <div className="evli" style={{ color: "#8b949e" }}>
          Timeline from a recorded agent run on this dataset — identical pipeline, timings as measured.</div>}
        <div className="evli">(status quo: multi-day manual coordination — CAG 2024: only 31% of cities have any response protocol)</div></div>
      {replay.log.map(l => (
        <div className="step" key={l.step}>t+{l.elapsed_s}s <b>{l.agent}</b><br />{l.output_summary}</div>))}
      {(replay.advisories || []).map((a, i) => <div className="card" key={i}><b>{wardLabel(a.ward)}</b>: {a.text}</div>)}
    </div>);
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
