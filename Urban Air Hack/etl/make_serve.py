"""Build the slim serving DB (vayu_serve.duckdb) from the full backbone."""
import os
from pathlib import Path
import duckdb

ROOT = Path(__file__).resolve().parent.parent
src, dst = ROOT / "data/vayu.duckdb", ROOT / "data/vayu_serve.duckdb"
if dst.exists(): os.remove(dst)
con = duckdb.connect(str(dst))
con.sql(f"ATTACH '{src}' AS src (READ_ONLY)")
for t in ["readings", "stations", "wards", "attributions", "actions", "agent_log"]:
    con.sql(f"CREATE TABLE {t} AS SELECT * FROM src.{t}")
con.sql("DETACH src")
print("serve db:", round(dst.stat().st_size / 1e6, 1), "MB")
