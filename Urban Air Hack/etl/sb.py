"""Supabase (Postgres) connection helper — the platform's live data store."""
import os
import psycopg2
import psycopg2.extras

def dsn():
    d = os.environ.get("SUPABASE_DB_URL", "").strip()
    if not d:
        raise RuntimeError("SUPABASE_DB_URL not set")
    return d

def connect():
    c = psycopg2.connect(dsn(), connect_timeout=30)
    c.autocommit = False
    return c

def insert_rows(cur, table, cols, rows, conflict="do nothing", page=500):
    """Bulk insert with conflict handling; returns rows attempted."""
    if not rows:
        return 0
    sql = (f"insert into {table} ({','.join(cols)}) values %s on conflict {conflict}")
    for i in range(0, len(rows), page):
        psycopg2.extras.execute_values(cur, sql, rows[i:i + page], page_size=page)
    return len(rows)

def fetch_df(conn, sql, params=None):
    import pandas as pd
    return pd.read_sql(sql, conn, params=params)
