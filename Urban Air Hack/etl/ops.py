"""Deployment secrets, resolved environment-first with an `ops_config` fallback.

A Vercel environment variable is applied only at build time, and only to the
project that owns the deployment. A value saved against the wrong project, or
saved without triggering a rebuild, therefore reads exactly like a value that
was never set: the running function sees an empty string, and the only symptom
is whatever that code path does with nothing. This deployment lost its hourly
ingest to that failure mode twice -- once on INGEST_TOKEN, then again on
DATA_GOV_IN_KEY -- each time with the dashboard showing the variable present.

Storing the value in `ops_config` removes the failure mode rather than
re-diagnosing it. It crosses no new trust boundary: any process reaching that
table already holds the service-role DSN, without which it could not serve a
request at all. It also makes each secret single-sourced, so a rotation is one
UPDATE instead of two systems that can drift apart silently.

The environment still wins when it is populated, so a correctly-configured
deployment behaves exactly as before and needs no database round trip.
"""
import os

_CACHE = {}


def secret(env_var, key=None, conn=None):
    """Return ``(value, source)`` for a deployment secret.

    ``source`` is ``"env"``, ``"ops_config"``, ``"unset"`` (resolved nowhere) or
    ``"unavailable"`` (the table could not be read). Callers report it so that
    "saved in the dashboard" and "visible to the running code" stay
    distinguishable -- conflating those is what made the original outage take
    days to attribute.
    """
    val = os.environ.get(env_var, "").strip()
    if val:
        return val, "env"

    key = key or env_var.lower()
    if _CACHE.get(key):
        return _CACHE[key], "ops_config"

    try:
        if conn is None:
            from etl.sb import connect
            conn = connect()
        with conn.cursor() as c:
            c.execute("select value from ops_config where key = %s", (key,))
            row = c.fetchone()
    except Exception:
        # An unreadable table must never take the caller down with it; an
        # unresolved secret is reported, not raised.
        try:
            conn.rollback()
        except Exception:
            pass
        return "", "unavailable"

    val = (row[0] or "").strip() if row else ""
    if val:
        _CACHE[key] = val
        return val, "ops_config"
    return "", "unset"
