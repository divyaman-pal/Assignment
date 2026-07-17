import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as api from "./api.js";

const CITIES = { delhi: { name: "Delhi", center: [77.1, 28.65], zoom: 9.6 },
                 mumbai: { name: "Mumbai", center: [72.88, 19.08], zoom: 10.2 },
                 bengaluru: { name: "Bengaluru", center: [77.59, 12.97], zoom: 10.5 } };
const BAND_COLORS = { Good: "#3fb950", Satisfactory: "#7ee787", Moderate: "#d29922",
                      Poor: "#f0883e", "Very Poor": "#ff7b72", Severe: "#da3633" };
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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
    return () => m.remove();
  }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      const [st0, ev, ac, wards, lv] = await Promise.all([
        api.getStations(city), api.getEvents(city), api.getActions(city), api.getWards(city), api.getLive()]);
      if (dead) return;
      const cityName = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[city];
      const st = (era === "live" && lv && lv.available)
        ? lv.stations.filter(s => s.city === cityName).map(s => ({ station_id: s.station,
            station_name: s.station, lat: s.lat, lon: s.lon, pm25: s.pm25, pm10: s.pm10,
            aqi: s.aqi, band: s.band }))
        : st0;
      setStations(st); setEvents(ev); setActions(ac);
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
            properties: { name: s.station_name, aqi: s.aqi, band: s.band || "NA", pm25: s.pm25 },
            geometry: { type: "Point", coordinates: [s.lon, s.lat] } })) } });
        m.addLayer({ id: "stations-dots", type: "circle", source: "stations",
          paint: { "circle-radius": 7, "circle-stroke-width": 1.5, "circle-stroke-color": "#0d1117",
            "circle-color": ["match", ["get", "band"],
              ...Object.entries(BAND_COLORS).flat(), "#8b949e"] } });
        m.on("click", "wards-fill", e => {
          if (e.features && e.features[0] && !m.queryRenderedFeatures(e.point, { layers: ["stations-dots"] }).length) {
            const w = e.features[0].properties;
            new maplibregl.Popup().setLngLat(e.lngLat).setHTML(
              `<b>${w.name}</b><br/>Schools: ${w.schools} · Hospitals: ${w.hospitals}<br/>` +
              `Industrial zones: ${w.industrial} · Construction: ${w.construction}<br/>` +
              `<span style="color:#888">vulnerability data: OpenStreetMap</span>`).addTo(m);
          }
        });
        m.on("click", "stations-dots", e => {
          const p = e.features[0].properties;
          new maplibregl.Popup().setLngLat(e.lngLat)
            .setHTML(`<b>${p.name}</b><br/>PM2.5: ${Math.round(p.pm25)} µg/m³<br/>AQI: <b>${Math.round(p.aqi)}</b> (${p.band})`)
            .addTo(m);
        });
        m.flyTo({ center: CITIES[city].center, zoom: CITIES[city].zoom });
      };
      if (m.isStyleLoaded()) draw(); else m.once("load", draw);
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
              ? `LIVE — official data.gov.in feed as of ${live.as_of} · ${live.history_days_accumulated} day(s) of history accumulated · ${live.analytics_ready ? "full analytics active" : "forecast/attribution unlock at 7 days of history"}`
              : "Live mode: waiting for first government snapshot (runs every 6h once the data.gov.in key is configured) — showing crisis episode meanwhile")
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
            {tab === "actions" && <Actions actions={actions} />}
            {tab === "events" && <Events events={events} />}
            {tab === "compare" && <Compare />}
            {tab === "metrics" && <Metrics metrics={metrics} />}
            {tab === "replay" && <Replay replay={replay} busy={replayBusy} />}
          </div>
        </div>}
      </div>
      <div className="footer">
        Data: CPCB CAAQMS via Vonter/india-cpcb-aqi (ODbL) · Wards: DataMeet (CC-BY) ·
        Attribution = evidence-weighted likelihood with confidence, not legal proof ·
        {api.hasLiveApi() ? " live API" : " demo snapshot mode"}
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
const bandOf = a => a <= 50 ? "Good" : a <= 100 ? "Satisfactory" : a <= 200 ? "Moderate" : a <= 300 ? "Poor" : a <= 400 ? "Very Poor" : "Severe";
const TTS_LANG = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", kn: "kn-IN" };

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
    const list = wg.features.map(f => ({ id: f.properties.ward_id, name: f.properties.name,
      schools: f.properties.schools, hospitals: f.properties.hospitals }));
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    setWards(list); setStations(st); setWard(list[0]?.id || ""); setAdv(null);
  })().catch(console.error); }, [city]);

  const w = wards.find(x => x.id === ward);
  const inWard = stations.filter(s => s.ward_id === ward && s.aqi);
  const cityAqis = stations.map(s => s.aqi).filter(Boolean);
  const aqi = inWard.length ? Math.max(...inWard.map(s => s.aqi))
            : cityAqis.length ? Math.round(cityAqis.reduce((a, b) => a + b, 0) / cityAqis.length) : null;
  const band = aqi ? bandOf(aqi) : null;
  const src = inWard.length ? `${inWard.length} sensor(s) in this ward` : "city average (no sensor in ward)";

  async function getAdvice() {
    if (!w || !aqi) return;
    setBusy(true);
    const fallback = `Air quality alert for ${wardLabel(w.name)}: AQI ${aqi} (${band}). ` +
      `${CPCB_HEALTH[band]} ${(GROUP_ACTIONS[group] || {})[band] || "Follow general precautions."}`;
    try {
      const r = await api.getAdvisory(city, w.name, aqi, group, lang);
      setAdv(r && r.text ? r : { text: fallback, lang: "en", source: "official CPCB template" });
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
            {wards.map(x => <option key={x.id} value={x.id}>{wardLabel(x.name)}</option>)}
          </select>
          <div className="evli" style={{ marginTop: 6 }}>
            {w ? `${w.schools} schools · ${w.hospitals} hospitals in this ward (OpenStreetMap)` : ""}</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 46, fontWeight: 700, color: bandColor }}>{aqi ?? "—"}</div>
          <div style={{ color: bandColor, fontWeight: 700 }}>{band ?? "no data"}</div>
          <div className="evli">{src}</div>
        </div>
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

function Actions({ actions }) {
  if (!actions.length) return <div className="card">No enforcement actions for this city in the episode window.</div>;
  return actions.map(a => (
    <div className="card" key={a.action_id}>
      <span className="prio">{Number(a.priority).toFixed(2)}</span>
      <h4>{wardLabel(a.ward_name) || a.ward_id}</h4>
      <span className={`badge b-${a.category}`}>{a.category}</span>
      <span className="conf">{Math.round(a.confidence)}% confidence</span>
      <div className="evli">{a.n_events} events · mean PM2.5 {Math.round(a.mean_pm25)} µg/m³ (max {Math.round(a.max_pm25)})</div>
      <div className="evli">→ {a.action}</div>
      <div className="evli">Legal basis: {a.statute}</div>
      {api.packUrl(a.action_id) && <a href={api.packUrl(a.action_id)} target="_blank" rel="noreferrer">Evidence pack (PDF)</a>}
    </div>));
}

function Events({ events }) {
  const recent = events.slice(-80).reverse();
  if (!recent.length) return <div className="card">No events.</div>;
  return recent.map((e, i) => {
    const ev = safeParse(e.evidence_json);
    return (
      <div className="card" key={i}>
        <span className={`badge b-${e.category}`}>{e.category}</span>
        <span className="conf">{Math.round(e.confidence)}%</span>
        <span style={{ float: "right", color: "#8b949e" }}>{(e.h || "").slice(0, 16)}</span>
        <div className="evli">station {e.station_id} · PM2.5 {e.pm25} · {e.event_type}</div>
        {ev && ev.evidence && ev.evidence.slice(0, 3).map((b, j) => <div className="evli" key={j}>• {b}</div>)}
      </div>);
  });
}

function Compare() {
  const [rows, setRows] = useState(null);
  useEffect(() => { (async () => {
    const out = [];
    for (const [slug, c] of Object.entries(CITIES)) {
      const [st, ev, ac] = await Promise.all([api.getStations(slug), api.getEvents(slug), api.getActions(slug)]);
      const aqis = st.map(s => s.aqi).filter(Boolean);
      const cats = {};
      ev.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
      const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
      out.push({ city: c.name, stations: st.length,
        maxAqi: aqis.length ? Math.round(Math.max(...aqis)) : "—",
        meanAqi: aqis.length ? Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length) : "—",
        events: ev.length, topSource: top ? `${top[0]} (${top[1]})` : "—",
        topPriority: ac.length ? Number(ac[0].priority).toFixed(2) : "—" });
    }
    setRows(out);
  })().catch(console.error); }, []);
  if (!rows) return <div className="card">Comparing cities…</div>;
  return (
    <>
      <div className="card">
        <h4>Same episode week, same scoring — cities directly comparable</h4>
        <table><thead><tr><th>City</th><th>Mean AQI</th><th>Max</th><th>Events</th><th>Top source</th><th>Top priority</th></tr></thead>
          <tbody>{rows.map(r => (<tr key={r.city}><td>{r.city}</td><td>{r.meanAqi}</td><td>{r.maxAqi}</td>
            <td>{r.events}</td><td>{r.topSource}</td><td>{r.topPriority}</td></tr>))}</tbody></table>
        <div className="evli">Priority scores share one formula (severity × confidence × persistence × vulnerability) —
          a commissioner can see at a glance that Delhi's NYE week needed ~6× Mumbai's response.</div>
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
          <tbody>{Object.entries(f).map(([h, v]) => (
            <tr key={h}><td>{h.slice(1)}h</td><td>{v.rmse_model}</td><td>{v.rmse_persistence}</td>
              <td>{v.improvement_vs_persistence_pct}%</td></tr>))}</tbody></table>
      </div>
      <div className="card">
        <h4>Attribution</h4>
        <div className="evli">{metrics.attribution?.events} events · mean confidence {metrics.attribution?.mean_confidence}%</div>
        <div className="evli">Satellite fire layer: {metrics.attribution?.fires_used ? "active (VIIRS/FIRMS)" : "pending FIRMS csv"}</div>
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
    on the Dec 31 NYE window. Requires the live API (Railway/local); demo snapshot mode shows precomputed results in other tabs.</div>;
  if (replay.error || !replay.log) return <div className="card">Replay unavailable: {replay?.error || "live API required"}</div>;
  return (
    <div className="replaylog">
      <div className="card"><b>{replay.events}</b> events → <b>{replay.actions}</b> ranked actions in <b>{replay.elapsed_s}s</b>
        <div className="evli">(status quo: multi-day manual coordination — CAG 2024: only 31% of cities have any response protocol)</div></div>
      {replay.log.map(l => (
        <div className="step" key={l.step}>t+{l.elapsed_s}s <b>{l.agent}</b><br />{l.output_summary}</div>))}
      {(replay.advisories || []).map((a, i) => <div className="card" key={i}><b>{wardLabel(a.ward)}</b>: {a.text}</div>)}
    </div>);
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
