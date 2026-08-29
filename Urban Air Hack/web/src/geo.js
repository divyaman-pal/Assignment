// Ward-level AQI estimation over a sparse sensor network.
//
// Why this module exists. Delhi's boundary file has 289 wards; 38 of them
// contain a reporting sensor. The citizen view used to substitute the city
// arithmetic mean for the other 251 and render it in the same 46px type, under
// the ward's own name, as a real reading. On 2026-08-29 that meant each of
// those wards displayed AQI 130 "Moderate - reduce prolonged outdoor exertion"
// while the sensor at Anand Vihar read 448 "Severe". A city mean is not an
// estimate of anywhere: it is the least informative number available, and it is
// biased low at exactly the hotspots the advisory exists to warn about.
//
// Replaced with inverse-distance weighting over the nearest sensors, masked
// past MAX_KM - the same convention the precomputed forecast grid already
// states ("IDW of station forecasts; cells >8km from any station masked").
// Past that range the correct output is no number at all, and the caller must
// render the absence rather than invent a value.
//
// No React import here on purpose: this is the part that has to be verifiable
// on its own (see deploy/verify_ward_estimate.mjs).

export const MAX_KM = 8;      // beyond this, no sensor speaks for the ward
export const K_NEAREST = 4;   // a sensor on the far side of the city must not vote
const IDW_POWER = 2;          // standard exponent; 2 keeps the nearest sensor dominant

// CPCB National AQI bands. Mirrors the API's band() - kept client-side so the
// citizen view can label a value it derived itself, never to override a band
// the API has already assigned to a measured reading.
const BAND_EDGES = [[50, "Good"], [100, "Satisfactory"], [200, "Moderate"],
                    [300, "Poor"], [400, "Very Poor"]];
export const BAND_ORDER = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"];

export function bandOf(aqi) {
  if (aqi === null || aqi === undefined || !isFinite(aqi)) return null;
  for (const [edge, name] of BAND_EDGES) if (aqi <= edge) return name;
  return "Severe";
}

const bandRank = b => { const i = BAND_ORDER.indexOf(b); return i < 0 ? -1 : i; };

// Area-weighted polygon centroid (shoelace). The mean of the vertices is not
// the centroid - boundary files carry far more vertices along complex edges, so
// vertex-averaging pulls the point toward whichever side was digitised in most
// detail. For a ward kilometres across, that error competes with the distances
// this module is deciding on.
function ringCentroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const [x0, y0] = ring[i], [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    a += cross; cx += (x0 + x1) * cross; cy += (y0 + y1) * cross;
  }
  a *= 0.5;
  if (!isFinite(a) || Math.abs(a) < 1e-12) {   // degenerate or unclosed ring
    const pts = ring.filter(p => isFinite(p[0]) && isFinite(p[1]));
    if (!pts.length) return null;
    return [pts.reduce((s, p) => s + p[0], 0) / pts.length,
            pts.reduce((s, p) => s + p[1], 0) / pts.length];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++)
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(a * 0.5);
}

// Mumbai ships one MultiPolygon (a ward split by water). Its outline is two
// disjoint land masses, and the centroid of the pair can fall in the sea, so
// use the largest component instead of averaging them.
export function centroidOf(feature) {
  const g = feature && feature.geometry;
  if (!g || !g.coordinates) return null;
  if (g.type === "Polygon") {
    const r = g.coordinates[0];
    return r && r.length >= 4 ? ringCentroid(r) : null;
  }
  if (g.type === "MultiPolygon") {
    let best = null, bestArea = -1;
    for (const poly of g.coordinates) {
      const r = poly[0];
      if (!r || r.length < 4) continue;
      const a = ringArea(r);
      if (a > bestArea) { bestArea = a; best = r; }
    }
    return best ? ringCentroid(best) : null;
  }
  return null;
}

export function haversineKm(lon1, lat1, lon2, lat2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Distance is the whole basis of the estimate's credibility, so it is reported
// as a confidence the interface can show rather than kept as an internal number.
function confidenceFor(km) {
  if (km <= 2) return "high";
  if (km <= 5) return "medium";
  return "low";
}

/**
 * Ward AQI with its provenance. Returns one of three statuses, and the caller
 * MUST render them differently - conflating the first two is the bug this
 * module was written to remove.
 *
 *   measured    - one or more reporting sensors inside the ward
 *   estimated   - none inside, but at least one within MAX_KM; aqi interpolated
 *   unavailable - nearest sensor beyond MAX_KM; aqi is null, show no number
 *
 * @param feature  ward GeoJSON feature (properties.ward_id, geometry)
 * @param stations live rows: {station_id, station_name, lat, lon, ward_id, aqi}
 */
export function wardAqi(feature, stations) {
  const none = { status: "unavailable", aqi: null, band: null, confidence: null,
                 nearestKm: null, contributors: [], understated: null };
  if (!feature || !feature.properties) return none;
  const wardId = String(feature.properties.ward_id);
  const usable = (stations || []).filter(s =>
    s && typeof s.aqi === "number" && isFinite(s.aqi) && s.aqi > 0);

  // 1. Sensors inside the ward. Take the worst rather than the average: the
  // advisory is a health instruction for everyone in the ward, and averaging a
  // roadside hotspot against a park understates what a resident at the roadside
  // is breathing. "Worst sensor in your ward" is also a claim the number can
  // actually support.
  const inside = usable.filter(s => String(s.ward_id) === wardId);
  if (inside.length) {
    const worst = inside.reduce((a, b) => (b.aqi > a.aqi ? b : a));
    return { status: "measured", aqi: Math.round(worst.aqi), band: bandOf(worst.aqi),
             confidence: "high", nearestKm: 0,
             contributors: inside.map(s => ({ name: s.station_name, aqi: Math.round(s.aqi),
                                              km: 0, band: bandOf(s.aqi) })),
             understated: null };
  }

  // 2. No sensor in the ward: interpolate, or refuse.
  const c = centroidOf(feature);
  if (!c) return none;
  const near = usable
    .filter(s => isFinite(s.lat) && isFinite(s.lon))
    .map(s => ({ name: s.station_name, aqi: s.aqi, band: bandOf(s.aqi),
                 km: haversineKm(c[0], c[1], s.lon, s.lat) }))
    .filter(s => s.km <= MAX_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, K_NEAREST);
  if (!near.length) return none;

  let wsum = 0, vsum = 0;
  for (const s of near) {
    // clamp: a sensor sitting on the centroid would otherwise divide by zero
    const w = 1 / Math.pow(Math.max(s.km, 0.1), IDW_POWER);
    wsum += w; vsum += w * s.aqi;
  }
  const est = Math.round(vsum / wsum);
  const band = bandOf(est);

  // An interpolated value smooths away the peak it sits next to. When a
  // contributing sensor is in a worse band than the estimate, the interface has
  // to say so by name - that is the difference between "Moderate" and a Severe
  // reading 3 km upwind, and it is the resident's call to make, not ours to
  // average away.
  const worst = near.reduce((a, b) => (b.aqi > a.aqi ? b : a));
  const understated = bandRank(worst.band) > bandRank(band)
    ? { name: worst.name, aqi: Math.round(worst.aqi), band: worst.band, km: worst.km }
    : null;

  return {
    status: "estimated", aqi: est, band,
    confidence: confidenceFor(near[0].km),
    nearestKm: near[0].km,
    contributors: near.map(s => ({ name: s.name, aqi: Math.round(s.aqi),
                                   km: s.km, band: s.band })),
    understated,
  };
}

// Ward names in the official boundary files are municipal charge names: the
// Anand Vihar sensor sits in "I.P EXTENTION". Residents search for the landmark,
// so a ward that owns a sensor is labelled with it.
export function stationLabel(name) {
  return String(name || "").split(",")[0].trim();
}
