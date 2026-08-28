"""Canonical station identity — one physical sensor, one station_id.

The archive (Vonter CPCB mirror) keys stations as `site_103`, carrying the
human-readable name in `station_name`. The data.gov.in live feed has no such id
and only gives the name, which earlier ingests wrote straight into
`station_id` — creating a second row for every sensor already in the store.

The two sets were disjoint: every ward-mapped station was frozen in the
archive, every live station had no ward. That single split broke enforcement
(which requires a ward), doubled the station count, and severed the history the
attribution baselines and forecast models depend on.

`resolve()` maps an incoming feed name back onto the archive id it belongs to,
so live readings land on the same row as that sensor's history.
"""
import math


def _norm(s):
    return " ".join(str(s or "").strip().lower().split())


def _prefix(s):
    """Location part, before the agency suffix: 'Aya Nagar, Delhi - IITM' -> 'aya nagar'."""
    return _norm(str(s or "").split(",")[0])


def _km(lat1, lon1, lat2, lon2):
    for v in (lat1, lon1, lat2, lon2):
        if v is None or v != v:
            return None
    mlat = math.radians((lat1 + lat2) / 2)
    return math.hypot((lon2 - lon1) * 111.320 * math.cos(mlat), (lat2 - lat1) * 110.574)


class Resolver:
    """Built once from the existing `stations` rows, then queried per feed record.

    known: iterable of (station_id, station_name, city, lat, lon)
    """

    # An agency rename ('… - IMD' -> '… - IITM') keeps the same mast, so the
    # coordinates match exactly; a genuinely different site in the same
    # locality does not. 1.5 km separates those two cases cleanly.
    PREFIX_MAX_KM = 1.5
    COORD_MAX_KM = 0.3

    def __init__(self, known):
        self.rows = [(sid, nm, city, lat, lon) for sid, nm, city, lat, lon in known]
        self.by_id = {_norm(r[0]): r[0] for r in self.rows}
        self.by_name = {}
        for sid, nm, city, _lat, _lon in self.rows:
            self.by_name.setdefault((_norm(city), _norm(nm)), sid)

    def resolve(self, feed_id, city, lat=None, lon=None):
        """-> (canonical_station_id, how). how is one of:
        existing_id | name | prefix_coord | coord | new
        """
        n = _norm(feed_id)
        if n in self.by_id:
            return self.by_id[n], "existing_id"

        hit = self.by_name.get((_norm(city), n))
        if hit:
            return hit, "name"

        # Prefer archive ids when several rows tie, so history is preserved.
        def rank(sid):
            return (0 if str(sid).startswith("site_") else 1, str(sid))

        pfx = _prefix(feed_id)
        cands = []
        for sid, nm, c, la, lo in self.rows:
            if _norm(c) != _norm(city) or _prefix(nm) != pfx:
                continue
            d = _km(lat, lon, la, lo)
            if d is not None and d <= self.PREFIX_MAX_KM:
                cands.append((d, rank(sid), sid))
        if cands:
            return min(cands)[2], "prefix_coord"

        cands = []
        for sid, nm, c, la, lo in self.rows:
            if _norm(c) != _norm(city):
                continue
            d = _km(lat, lon, la, lo)
            if d is not None and d <= self.COORD_MAX_KM:
                cands.append((d, rank(sid), sid))
        if cands:
            return min(cands)[2], "coord"

        return feed_id, "new"
