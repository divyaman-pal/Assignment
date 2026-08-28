"""Ward assignment for stations — point-in-polygon, no geo dependencies.

The Supabase `wards` table stores centroids only; the authoritative ward
boundaries ship with the frontend as GeoJSON (`web/public/demo/*_wards.json`),
which CI checks out alongside the ETL. This module reads those polygons and
resolves a lat/lon to a ward using ray casting, falling back to the nearest
centroid within a bounded radius.

Deliberately pure-Python: shapely is not in the slim serverless requirements,
and the hourly ingest must not need it.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# data/ ships with the serverless bundle; web/ is excluded from it by
# .vercelignore, so the API can only reach the copy under data/. CI and local
# runs have both — whichever is found first wins.
WARD_DIRS = [ROOT / "data" / "wards_geo", ROOT / "web" / "public" / "demo"]
CITY_SLUG = {"Delhi": "delhi", "Mumbai": "mumbai", "Bengaluru": "bengaluru"}
NEAREST_MAX_KM = 3.0          # same bound the original backbone used

_cache = {}


def _rings(geom):
    """Yield (outer, holes) ring lists for Polygon and MultiPolygon alike."""
    t, co = geom.get("type"), geom.get("coordinates") or []
    if t == "Polygon":
        yield co[0], co[1:]
    elif t == "MultiPolygon":
        for poly in co:
            if poly:
                yield poly[0], poly[1:]


def _in_ring(lon, lat, ring):
    """Standard even-odd ray casting. Ring is [[lon, lat], ...]."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat):
            # x of the edge at this latitude
            x = (xj - xi) * (lat - yi) / (yj - yi) + xi
            if lon < x:
                inside = not inside
        j = i
    return inside


def load_city(city):
    """[(ward_id, name, bbox, [(outer, holes)], centroid)] for one city."""
    if city in _cache:
        return _cache[city]
    slug = CITY_SLUG.get(city, str(city).lower())
    path = next((d / f"{slug}_wards.json" for d in WARD_DIRS
                 if (d / f"{slug}_wards.json").exists()), None)
    if path is None:
        _cache[city] = []
        return []
    gj = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for f in gj.get("features", []):
        polys = list(_rings(f.get("geometry") or {}))
        if not polys:
            continue
        xs = [p[0] for outer, _ in polys for p in outer]
        ys = [p[1] for outer, _ in polys for p in outer]
        bbox = (min(xs), min(ys), max(xs), max(ys))
        cen = (sum(xs) / len(xs), sum(ys) / len(ys))
        out.append((f["properties"].get("ward_id"), f["properties"].get("name"), bbox, polys, cen))
    _cache[city] = out
    return out


def _km(lon1, lat1, lon2, lat2):
    """Equirectangular approximation — accurate enough at city scale."""
    mlat = math.radians((lat1 + lat2) / 2)
    return math.hypot((lon2 - lon1) * 111.320 * math.cos(mlat), (lat2 - lat1) * 110.574)


def assign(city, lat, lon):
    """-> (ward_id, method). method is point_in_polygon | nearest_within_3km | unassigned."""
    if lat is None or lon is None or lat != lat or lon != lon:
        return None, "unassigned"
    wards = load_city(city)
    if not wards:
        return None, "unassigned"
    for wid, _name, (x0, y0, x1, y1), polys, _cen in wards:
        if not (x0 <= lon <= x1 and y0 <= lat <= y1):
            continue                                   # bbox reject first — cheap
        for outer, holes in polys:
            if _in_ring(lon, lat, outer) and not any(_in_ring(lon, lat, h) for h in holes):
                return wid, "point_in_polygon"
    best, best_d = None, None
    for wid, _name, _bbox, _polys, (clon, clat) in wards:
        d = _km(lon, lat, clon, clat)
        if best_d is None or d < best_d:
            best, best_d = wid, d
    if best_d is not None and best_d <= NEAREST_MAX_KM:
        return best, "nearest_within_3km"
    return None, "unassigned"


if __name__ == "__main__":
    for city, lat, lon in [("Delhi", 28.647622, 77.315809), ("Delhi", 28.815329, 77.15301),
                           ("Mumbai", 19.065931, 72.862131), ("Bengaluru", 12.951913, 77.539784)]:
        print(city, lat, lon, "->", assign(city, lat, lon))
