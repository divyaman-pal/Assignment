"""Supabase (Postgres) connection helper — the platform's live data store.

Connectivity notes:
* Supabase's direct host (db.<ref>.supabase.co) resolves only to IPv6. CI
  runners and serverless platforms are IPv4-only, so a direct connection hangs
  until timeout. We therefore prefer the IPv4 pooler in those environments and
  cache whichever endpoint succeeds, so a warm instance never re-probes.
* Probe timeouts are deliberately short: a slow fallback would show up as a
  multi-second delay on every API request.
"""
import os
import re
import psycopg2
import psycopg2.extras

POOLER_REGIONS = ["ap-south-1", "us-east-1", "ap-southeast-1", "eu-central-1"]
_GOOD_DSN = None          # remembered across warm invocations
_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
                   or os.environ.get("GITHUB_ACTIONS"))

def _direct():
    d = os.environ.get("SUPABASE_DB_URL", "").strip()
    if not d:
        raise RuntimeError("SUPABASE_DB_URL not set")
    return d

def _pooler_variants(direct):
    m = re.match(r"postgresql://([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co:(\d+)/(\w+)", direct)
    if not m:
        return []
    user, pw, ref, _port, db = m.groups()
    out = []
    for prefix in ("aws-0", "aws-1"):
        for region in POOLER_REGIONS:
            for port in (5432, 6543):
                out.append(f"postgresql://{user}.{ref}:{pw}@{prefix}-{region}.pooler.supabase.com:{port}/{db}")
    return out

def _candidates():
    direct = _direct()
    pooler = _pooler_variants(direct)
    # IPv4-only environments: pooler first, direct last (it will simply fail)
    return (pooler + [direct]) if _SERVERLESS else ([direct] + pooler)

def connect():
    global _GOOD_DSN
    if _GOOD_DSN:
        try:
            c = psycopg2.connect(_GOOD_DSN, connect_timeout=8)
            c.autocommit = False
            return c
        except psycopg2.OperationalError:
            _GOOD_DSN = None          # endpoint went away; fall through to probing
    last = None
    for dsn in _candidates():
        try:
            c = psycopg2.connect(dsn, connect_timeout=4)
            c.autocommit = False
            _GOOD_DSN = dsn
            return c
        except psycopg2.OperationalError as e:
            last = e
            if "password" in str(e).lower() or "authentication" in str(e).lower():
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
