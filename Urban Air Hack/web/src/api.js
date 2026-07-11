// Data layer: uses the live API when VITE_API_URL is set; otherwise falls
// back to the bundled demo snapshot (works with zero backend — resilience
// for demo day). Every payload originates from vayu.duckdb either way.
const API = import.meta.env.VITE_API_URL || "";

async function j(url) { const r = await fetch(url); if (!r.ok) throw new Error(url); return r.json(); }

export const hasLiveApi = () => Boolean(API);

export async function getWards(slug) {
  return j(API ? `${API}/cities/${slug}/wards.geojson` : `/demo/${slug}_wards.json`);
}
export async function getStations(slug) {
  if (API) return j(`${API}/cities/${slug}/stations`);
  const all = await j("/demo/stations.json");
  const city = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[slug];
  return all.filter(s => s.city === city);
}
export async function getEvents(slug) {
  if (API) return j(`${API}/cities/${slug}/events`);
  const all = await j("/demo/events.json");
  const city = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[slug];
  return all.filter(e => e.city === city);
}
export async function getActions(slug) {
  if (API) return j(`${API}/cities/${slug}/actions`);
  const all = await j("/demo/actions.json");
  const city = { delhi: "Delhi", mumbai: "Mumbai", bengaluru: "Bengaluru" }[slug];
  return all.filter(a => a.city === city);
}
export async function getMetrics() {
  return j(API ? `${API}/metrics` : "/demo/metrics.json");
}
export async function runReplay(city) {
  if (!API) return null; // replay requires live API
  const r = await fetch(`${API}/replay/run?city=${city}`, { method: "POST" });
  return r.json();
}
export const packUrl = id => (API ? `${API}/actions/${id}/pack.pdf` : null);
