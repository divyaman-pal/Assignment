"""Build the slim serving DB (vayu_serve.duckdb) from the full backbone."""
import os
from pathlib import Path
import duckdb

ROOT = Path(__file__).resolve().parent.parent
src, dst = ROOT / "data/vayu.duckdb", ROOT / "data/vayu_serve.duckdb"
if dst.exists(): os.remove(dst)
con = duckdb.connect(str(dst))
con.sql(f"ATTACH '{src}' AS src (READ_ONLY)")
src_tables = {r[0] for r in con.sql("SELECT table_name FROM duckdb_tables() WHERE database_name='src'").fetchall()}
for t in ["readings", "stations", "wards", "attributions", "actions", "agent_log"]:
    if t in src_tables:
        con.sql(f"CREATE TABLE {t} AS SELECT * FROM src.{t}")
# agent_log is created lazily by the orchestrator; ensure schema exists for the API
if "agent_log" not in src_tables:
    con.sql("""CREATE TABLE IF NOT EXISTS agent_log (
        run_id VARCHAR, step INT, agent VARCHAR, ts TIMESTAMP,
        elapsed_s DOUBLE, input_summary VARCHAR, output_summary VARCHAR)""")
con.sql("DETACH src")
print("serve db:", round(dst.stat().st_size / 1e6, 1), "MB")
