"""Apply OSM POI/land-use counts (fetched via Overpass, computed by
point-in-polygon into official ward boundaries) to the wards table."""
import json
from pathlib import Path
import duckdb

ROOT = Path(__file__).resolve().parent.parent
data = json.load(open(ROOT / "data" / "raw" / "osm_pois.json"))

def apply(db):
    con = duckdb.connect(str(db))
    cols = con.sql("DESCRIBE wards").df().column_name.tolist()
    for c in ["n_schools", "n_hospitals", "n_industrial", "n_construction"]:
        if c not in cols:
            con.sql(f"ALTER TABLE wards ADD COLUMN {c} INT DEFAULT 0")
    rows = []
    for city, counts in data.items():
        if city == "meta": continue
        for wid, c in counts.items():
            rows.append((c["schools"], c["hospitals"], c["industrial"], c["construction"], wid))
    con.executemany("UPDATE wards SET n_schools=?, n_hospitals=?, n_industrial=?, n_construction=? WHERE ward_id=?", rows)
    n = con.sql("SELECT count(*) FROM wards WHERE n_schools+n_hospitals>0").fetchone()[0]
    print(db.name, "wards with POI data:", n)
    con.close()

if __name__ == "__main__":
    for db in [ROOT/"data/vayu.duckdb", ROOT/"data/vayu_serve.duckdb"]:
        if db.exists(): apply(db)
