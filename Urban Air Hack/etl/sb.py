"""Supabase (Postgres) connection helper — the platform's live data store.

Note on connectivity: Supabase's direct host (db.<ref>.supabase.co) resolves
only to IPv6. GitHub-hosted runners and many serverless platforms are IPv4-only,
so a direct connection fails with "Network is unreachable". We therefore fall
back automatically to Supabase's IPv4 connection pooler, deriving its URL from
the project reference — so the same secret works everywhere.
"""
import os
import re
import psycopg2
import psycopg2.extras

POOLER_REGIONS = ["ap-south-1", "us-east-1", "ap-southeast-1", "eu-central-1"]

def _direct():
    d = os.environ.get("SUPABASE_DB_URL", "").strip()
    if not d:
        raise RuntimeError("SUPABASE_DB_URL not set")
    return d

def _pooler_variants(direct):
    """Derive IPv4 pooler URLs from a direct connection string."""
    m = re.match(r"postgresql://([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)/(\w+)", direct)
    if not m:
        return []
    user, pw, ref, _port, db = m.groups()
    out = []
    for prefix in ("aws-1", "aws-0"):
        for region in POOLER_REGIONS:
            for port in (5432, 6543):        # session pooler, then transaction pooler
                out.append(f"postgresql://{user}.{ref}:{pw}@{prefix}-{region}.pooler.supabase.com:{port}/{db}")
    return out

def connect():
    """Connect via the direct host when reachable, else via the IPv4 pooler."""
    direct = _direct()
    attempts = [direct] + _pooler_variants(direct)
    last = None
    for i, dsn in enumerate(attempts):
        try:
            c = psycopg2.connect(dsn, connect_timeout=12)
            c.autocommit = False
            if i:
                host = dsn.split("@")[1].split("/")[0]
                print(f"  connected via pooler: {host}")
            return c
        except psycopg2.OperationalError as e:
            last = e
            msg = str(e)
            # only keep probing while the failure is a network/route problem
            if "password" in msg.lower() or "authentication" in msg.lower():
                raise
    raise RuntimeError(f"could not reach Supabase on any endpoint; last error: {last}")

def insert_rows(cur, table, cols, rows, conflict="do nothing", page=500):
    if not rows:
        return 0
    sql = f"insert into {table} ({','.join(cols)}) values %s on conflict {conflict}"
    for i in range(0, len(rows), page):
        psycopg2.extras.execute_values(cur, sql, rows[i:i + page], page_size=page)
    return len(rows)

def fetch_df(conn, sql, params=None):
    import pandas as pd
    return pd.read_sql(sql, conn, params=params)
