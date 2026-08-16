// Data layer: uses the live API when VITE_API_URL is set; otherwise falls
// back to the bundled demo snapshot (works with zero backend — resilience
// for demo day). Every payload originates from vayu.duckdb either way.
const API = import.meta.env.VITE_API_URL || "";

async function j(url) { const r = await fetch(url); if (!r.ok) throw new Error(url); return r.json(); }

export const hasLiveApi = () => Boolean(API);

export async function getWards(slug) {
  // Ward geometry is static (official boundary files) and ships with the app —
  // never fetched from the API, which serves live measurements only.
  return j(`/demo/${slug}_wards.json`);
}
export async function getStations(slug) {
  if (API) return j(`${API}/cities/${slug}/stations`);
  const all = await j("/demo/stations.json");
  const city = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[slug];
  return all.filter(s => s.city === city);
}
export async function getEvents(slug, sinceDays) {
  if (API) return j(`${API}/cities/${slug}/events` + (sinceDays ? `?since_days=${sinceDays}` : ""));
  const all = await j("/demo/events.json");
  const city = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[slug];
  return all.filter(e => e.city === city);
}
export async function getActions(slug, sinceDays) {
  if (API) return j(`${API}/cities/${slug}/actions` + (sinceDays ? `?since_days=${sinceDays}` : ""));
  const all = await j("/demo/actions.json");
  const city = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[slug];
  return all.filter(a => a.city === city);
}
export async function getMetrics() {
  return j(API ? `${API}/metrics` : "/demo/metrics.json");
}
export async function runReplay(city) {
  // Prefer a live agent run when an API is configured; otherwise serve the
  // pre-computed timeline from a real run (same numbers, no backend needed).
  if (API) {
    try {
      const r = await fetch(`${API}/replay/run?city=${city}`, { method: "POST" });
      if (r.ok) return { ...(await r.json()), mode: "live" };
    } catch (e) { /* fall through to static */ }
  }
  const slug = String(city).toLowerCase();
  return { ...(await j(`/demo/replay_${slug}.json`)), mode: "precomputed" };
}

export async function getAdvisories() {
  try { return await j("/demo/advisories.json"); } catch { return {}; }
}
export const packUrl = id => (API ? `${API}/actions/${id}/pack.pdf` : `/demo/packs/pack_${id}.pdf`);

export async function getGrid(slug) {
  return j(`/demo/grid_${slug}.json`);  // precomputed 1-km IDW forecast grid
}

export async function getAdvisory(slug, ward, aqi, group, lang) {
  if (!API) return null; // demo mode: caller renders official CPCB template text client-side
  const u = `${API}/cities/${slug}/advisory?ward=${encodeURIComponent(ward)}&aqi=${Math.round(aqi)}&group=${group}&lang=${lang}`;
  return j(u);
}

export async function getLive() {
  try { return await j("/demo/live.json"); } catch { return { available: false }; }
}
