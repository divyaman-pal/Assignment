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
      const [st, ev, ac, wards] = await Promise.all([
        api.getStations(city), api.getEvents(city), api.getActions(city), api.getWards(city)]);
      if (dead) return;
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
        m.on("click", "stations-dots", e => {
          const p = e.features[0].properties;
          new maplibregl.Popup().setLngLat(e.lngLat)
            .setHTML(`<b>${p.name}</b><br/>PM2.5: ${p.pm25} µg/m³<br/>AQI: ${p.aqi} (${p.band})`)
            .addTo(m);
        });
        m.flyTo({ center: CITIES[city].center, zoom: CITIES[city].zoom });
      };
      if (m.isStyleLoaded()) draw(); else m.once("load", draw);
    })().catch(console.error);
    return () => { dead = true; };
  }, [city]);

  useEffect(() => { api.getMetrics().then(setMetrics).catch(console.error); }, []);

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
        <button className="replaybtn" onClick={doReplay} disabled={replayBusy}>
          {replayBusy ? "Running agents…" : "▶ Run war-room replay"}</button>
      </header>
      <div className="main">
        <div id="map" ref={mapRef} />
        <div className="rail">
          <div className="tabs">
            {["actions", "events", "metrics", "replay"].map(t => (
              <button key={t} className={`tab ${tab === t ? "active" : ""}`}
                      onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>))}
          </div>
          <div className="railbody">
            {tab === "actions" && <Actions actions={actions} />}
            {tab === "events" && <Events events={events} />}
            {tab === "metrics" && <Metrics metrics={metrics} />}
            {tab === "replay" && <Replay replay={replay} busy={replayBusy} />}
          </div>
        </div>
      </div>
      <div className="footer">
        Data: CPCB CAAQMS via Vonter/india-cpcb-aqi (ODbL) · Wards: DataMeet (CC-BY) ·
        Attribution = evidence-weighted likelihood with confidence, not legal proof ·
        {api.hasLiveApi() ? " live API" : " demo snapshot mode"}
      </div>
    </>
  );
}

function Actions({ actions }) {
  if (!actions.length) return <div className="card">No enforcement actions for this city in the episode window.</div>;
  return actions.map(a => (
    <div className="card" key={a.action_id}>
      <span className="prio">{Number(a.priority).toFixed(2)}</span>
      <h4>{a.ward_name || a.ward_id}</h4>
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
      {(replay.advisories || []).map((a, i) => <div className="card" key={i}><b>{a.ward}</b>: {a.text}</div>)}
    </div>);
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
