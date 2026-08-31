// Assertions for the ward AQI estimator (web/src/geo.js).
//
// Run:  node deploy/verify_ward_estimate.mjs
//       node deploy/verify_ward_estimate.mjs --offline   (skip the live fetch)
//
// These are assertions, not a smoke test. Each one corresponds to a way the
// citizen view has been, or could silently become, wrong about where a number
// came from. The headline case is real: on 2026-08-29 every Delhi ward without
// a sensor displayed the city mean of 130 while Anand Vihar measured 448.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { wardAqi, centroidOf, haversineKm, bandOf, MAX_KM } from "../web/src/geo.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://vayu-net-api-ver-tex.vercel.app";
const fails = [];

function check(name, fn) {
  try { console.log(`  PASS  ${name}: ${fn() ?? ""}`); }
  catch (e) { console.log(`  FAIL  ${name}: ${e.message}`); fails.push(name); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const wards = slug => JSON.parse(
  readFileSync(join(ROOT, "web", "public", "demo", `${slug}_wards.json`), "utf-8")).features;

// ---- geometry -------------------------------------------------------------

check("centroid: every ward yields a point inside its own bbox", () => {
  let n = 0;
  for (const slug of ["delhi", "mumbai", "bengaluru"]) {
    for (const f of wards(slug)) {
      const c = centroidOf(f);
      assert(c, `${slug}/${f.properties.ward_id}: no centroid`);
      assert(isFinite(c[0]) && isFinite(c[1]),
        `${slug}/${f.properties.ward_id}: non-finite centroid ${c}`);
      // A centroid outside the ring's own bounding box means the shoelace sign
      // handling is wrong - the failure mode that puts a Mumbai ward in the sea.
      const ring = f.geometry.type === "Polygon"
        ? f.geometry.coordinates[0]
        : f.geometry.coordinates.flat(1).flat(0)[0] ? f.geometry.coordinates[0][0] : [];
      if (ring.length) {
        const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
        if (f.geometry.type === "Polygon") {
          assert(c[0] >= Math.min(...xs) - 1e-6 && c[0] <= Math.max(...xs) + 1e-6 &&
                 c[1] >= Math.min(...ys) - 1e-6 && c[1] <= Math.max(...ys) + 1e-6,
            `${slug}/${f.properties.ward_id}: centroid outside its bbox`);
        }
      }
      n++;
    }
  }
  return `${n} wards`;
});

check("haversine: known distance", () => {
  // Anand Vihar (77.3158, 28.6476) to Delhi centre (77.10, 28.65) ~ 21 km
  const d = haversineKm(77.315809, 28.647622, 77.10, 28.65);
  assert(d > 19 && d < 23, `expected ~21 km, got ${d.toFixed(1)}`);
  assert(haversineKm(77, 28, 77, 28) === 0, "zero distance not zero");
  return `${d.toFixed(1)} km`;
});

check("bandOf: boundaries and no-data", () => {
  assert(bandOf(50) === "Good" && bandOf(51) === "Satisfactory", "Good/Satisfactory edge");
  assert(bandOf(300) === "Poor" && bandOf(401) === "Severe", "Poor/Severe edge");
  // A null AQI must never receive a band - that painted no-data sensors red.
  assert(bandOf(null) === null && bandOf(undefined) === null && bandOf(NaN) === null,
    "no-data value was given a band");
  return "ok";
});

// ---- estimator, on synthetic input ---------------------------------------

const SQUARE = {
  properties: { ward_id: "test_1", name: "TEST" },
  geometry: { type: "Polygon", coordinates: [[[77.0, 28.0], [77.1, 28.0],
                                              [77.1, 28.1], [77.0, 28.1], [77.0, 28.0]]] },
};
const st = (id, lon, lat, aqi, ward) =>
  ({ station_id: id, station_name: id, lon, lat, aqi, ward_id: ward });

check("estimator: a sensor inside the ward is measured, worst-case", () => {
  const r = wardAqi(SQUARE, [st("a", 77.05, 28.05, 120, "test_1"),
                             st("b", 77.06, 28.06, 400, "test_1")]);
  assert(r.status === "measured", `status=${r.status}`);
  assert(r.aqi === 400, `expected the worst in-ward sensor (400), got ${r.aqi}`);
  assert(r.contributors.length === 2, "both in-ward sensors should be listed");
  return `${r.aqi} ${r.band}`;
});

check("estimator: no sensor within MAX_KM yields NO number", () => {
  const r = wardAqi(SQUARE, [st("far", 78.5, 29.5, 400, "other")]);
  assert(r.status === "unavailable", `status=${r.status}`);
  assert(r.aqi === null && r.band === null,
    `refused ward still carried a value: aqi=${r.aqi} band=${r.band}`);
  return "no value emitted";
});

check("estimator: the city mean is never substituted", () => {
  // The regression itself. A distant sensor must not contribute at all - the
  // old code averaged every station in the city regardless of distance.
  const near = st("near", 77.05, 28.055, 100, "other");     // ~0.6 km from centroid
  const far = st("far", 78.0, 28.05, 500, "other");         // ~98 km
  const r = wardAqi(SQUARE, [near, far]);
  assert(r.status === "estimated", `status=${r.status}`);
  assert(r.aqi === 100, `distant sensor leaked into the estimate: ${r.aqi} (mean would be 300)`);
  assert(r.contributors.every(cn => cn.km <= MAX_KM), "a contributor beyond MAX_KM was used");
  return `${r.aqi} from ${r.contributors.length} sensor(s)`;
});

check("estimator: IDW is nearest-dominant, not an average", () => {
  const r = wardAqi(SQUARE, [st("close", 77.05, 28.052, 100, "o"),   // ~0.2 km
                             st("mid", 77.05, 28.09, 400, "o")]);    // ~4.4 km
  assert(r.status === "estimated", `status=${r.status}`);
  assert(r.aqi < 250, `estimate ${r.aqi} is not nearest-dominant (plain mean = 250)`);
  assert(r.aqi > 100, `estimate ${r.aqi} ignored the second sensor entirely`);
  return `${r.aqi} (plain mean would be 250)`;
});

check("estimator: a worse nearby sensor is named, not averaged away", () => {
  const r = wardAqi(SQUARE, [st("calm", 77.05, 28.052, 90, "o"),
                             st("hotspot", 77.05, 28.085, 450, "o")]);
  assert(r.understated, "a Severe sensor in range was not flagged");
  assert(r.understated.band === "Severe", `flagged band=${r.understated.band}`);
  assert(r.understated.name === "hotspot", `flagged the wrong sensor: ${r.understated.name}`);
  return `${r.aqi} ${r.band}, flags ${r.understated.name} at ${r.understated.aqi}`;
});

check("estimator: no-AQI sensors are excluded", () => {
  const r = wardAqi(SQUARE, [{ ...st("dead", 77.05, 28.05, null, "test_1") },
                             { ...st("alsodead", 77.051, 28.05, 0, "test_1") }]);
  assert(r.status === "unavailable", `a non-reporting sensor was treated as data: ${r.status}`);
  return "excluded";
});

// ---- estimator, on live data ---------------------------------------------

if (!process.argv.includes("--offline")) {
  const res = await fetch(`${API}/cities/delhi/stations`);
  const stations = await res.json();
  const dw = wards("delhi");

  const reporting = s => s && typeof s.aqi === "number" && isFinite(s.aqi) && s.aqi > 0;

  // A sensor's own ward must show that sensor's own number. Asserted over every
  // reporting station rather than one named one: CPCB stations drop in and out
  // hour to hour - Anand Vihar itself read null at 2026-08-31 19:00, and 5 of
  // Delhi's 46 sensors were quiet - so pinning the invariant to a single station
  // tests the feed's luck instead of the ward_id join.
  check("live: every ward holding a sensor reads measured, matching the map", () => {
    // Iterated over features, not over ward_ids: delhi_193 ships as two
    // features (a ward split by geometry), and a ward_id-keyed loop would check
    // only the first of them.
    let checked = 0;
    for (const f of dw) {
      const wardId = String(f.properties.ward_id);
      const sens = stations.filter(s => reporting(s) && String(s.ward_id) === wardId);
      if (!sens.length) continue;
      const r = wardAqi(f, stations);
      assert(r.status === "measured",
        `${f.properties.name} holds ${sens.length} reporting sensor(s) but reads ${r.status}`);
      // worst-in-ward, not the average - see wardAqi
      const worst = Math.max(...sens.map(s => s.aqi));
      assert(Math.abs(r.aqi - worst) < 1,
        `${f.properties.name} shows ${r.aqi} but its worst sensor reads ${Math.round(worst)}`);
      checked++;
    }
    assert(checked > 0, "no ward joined to a reporting sensor - the ward_id join is broken");
    return `${checked} sensor-holding wards match their sensors`;
  });

  // The headline case keeps its own assertion, on the part that is invariant:
  // the station is in the feed and joined to a real ward, and a ward whose
  // sensor has gone quiet is never dressed up as a measurement.
  check("live: Anand Vihar is joined to its ward and never claims a stale reading", () => {
    const av = stations.find(s => String(s.station_name).includes("Anand Vihar"));
    assert(av, "Anand Vihar not present in the live feed");
    const f = dw.find(x => String(x.properties.ward_id) === String(av.ward_id));
    assert(f, `ward ${av.ward_id} missing from the boundary file`);
    const r = wardAqi(f, stations);
    if (reporting(av)) {
      assert(r.status === "measured", `sensor is reporting but the ward reads ${r.status}`);
      assert(Math.abs(r.aqi - av.aqi) < 1,
        `ward shows ${r.aqi} but the sensor reads ${Math.round(av.aqi)}`);
      return `${f.properties.name} -> ${r.aqi} ${r.band} (sensor ${Math.round(av.aqi)})`;
    }
    assert(r.status !== "measured",
      `sensor is not reporting yet the ward claims a measurement of ${r.aqi}`);
    return `${f.properties.name}: sensor quiet -> ${r.status}, correctly not measured`;
  });

  check("live: no single value dominates the city", () => {
    // The signature of the bug: one number repeated across hundreds of wards.
    const vals = dw.map(f => wardAqi(f, stations)).filter(r => r.aqi !== null).map(r => r.aqi);
    assert(vals.length, "no ward produced a value at all");
    const counts = {};
    vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const share = n / vals.length;
    assert(share < 0.25,
      `${n}/${vals.length} wards (${Math.round(share * 100)}%) all show AQI ${top} ` +
      `- this is the city-mean regression`);
    return `${vals.length} valued wards, ${Object.keys(counts).length} distinct, ` +
           `most common ${top} at ${Math.round(share * 100)}%`;
  });

  check("live: every ward is measured, estimated, or explicitly refused", () => {
    const by = { measured: 0, estimated: 0, unavailable: 0 };
    for (const f of dw) {
      const r = wardAqi(f, stations);
      assert(r.status in by, `unknown status ${r.status}`);
      by[r.status]++;
      // The core invariant: a value may never be shown without provenance, and
      // a refusal may never carry a number.
      if (r.status === "unavailable") assert(r.aqi === null, "refused ward carries a number");
      else assert(typeof r.aqi === "number" && r.band, "valued ward has no band");
      if (r.status === "estimated") assert(r.nearestKm <= MAX_KM, "estimate beyond MAX_KM");
    }
    assert(by.measured > 0, "no ward has a sensor in it - the ward_id join is broken");
    return JSON.stringify(by);
  });
}

console.log(fails.length ? `\nRESULT: ${fails.length} FAILED: ${fails.join(", ")}`
                         : "\nRESULT: ALL PASSED");
process.exit(fails.length ? 1 : 0);
