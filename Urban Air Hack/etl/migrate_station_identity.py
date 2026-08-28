"""One-off migration: merge duplicate station rows onto canonical ids.

Earlier hourly ingests keyed live readings by the data.gov.in station *name*,
while the archive keys the same sensors as `site_NNN`. Every sensor therefore
existed twice: the archive row held the history and the ward mapping, the live
row held current readings and no ward.

This walks every non-archive station row, resolves it to its archive twin, and
moves `readings_hourly` and `attributions` across before deleting the duplicate.
Stations with no twin are kept and given a ward. Finally every station still
missing a ward is resolved by point-in-polygon.

Idempotent: a second run finds nothing to merge. Run with --dry-run first.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from etl.sb import connect                       # noqa: E402
from etl.station_identity import Resolver        # noqa: E402
from etl import wards_geo                        # noqa: E402

READING_COLS = ["pm25", "pm10", "no2", "co", "so2", "nh3", "o3", "ws", "wd", "at_c", "rh"]


def merge_readings(cur, live_id, canon):
    """Move rows, then fold any (station_id, h) collisions into the canonical row."""
    cur.execute("""update readings_hourly r set station_id = %s
                   where r.station_id = %s and not exists (
                     select 1 from readings_hourly x where x.station_id = %s and x.h = r.h)""",
                (canon, live_id, canon))
    moved = cur.rowcount
    sets = ", ".join(f"{c} = coalesce(l.{c}, c.{c})" for c in READING_COLS)
    cur.execute(f"""update readings_hourly c set {sets}
                    from readings_hourly l
                    where c.station_id = %s and l.station_id = %s and l.h = c.h""",
                (canon, live_id))
    folded = cur.rowcount
    cur.execute("delete from readings_hourly where station_id = %s", (live_id,))
    return moved, folded


def add_era_column(cur):
    """Enforcement now ranks the live window and the historical episode into two
    separate pools. Without this column both shared one ranking, and December's
    crisis outranked every current event forever."""
    cur.execute("alter table actions add column if not exists era text")
    cur.execute("update actions set era = 'episode' where era is null")


def run(dry_run=False):
    conn = connect()
    cur = conn.cursor()

    if not dry_run:
        add_era_column(cur)
        print("actions.era column present")

    cur.execute("select station_id, station_name, city, lat, lon, ward_id from stations")
    rows = cur.fetchall()
    archive = [r for r in rows if str(r[0]).startswith("site_")]
    incoming = [r for r in rows if not str(r[0]).startswith("site_")]
    resolver = Resolver([(r[0], r[1], r[2], r[3], r[4]) for r in archive])

    print(f"{len(archive)} archive rows | {len(incoming)} feed-keyed rows")
    merged = kept = 0
    for sid, name, city, lat, lon, _ward in incoming:
        canon, how = resolver.resolve(sid, city, lat, lon)
        if how == "new" or canon == sid:
            kept += 1
            continue
        cur.execute("select count(*) from readings_hourly where station_id = %s", (sid,))
        n_read = cur.fetchone()[0]
        cur.execute("select count(*) from attributions where station_id = %s", (sid,))
        n_attr = cur.fetchone()[0]
        print(f"  merge {sid[:44]:46s} -> {canon:10s} ({how:12s}) "
              f"{n_read:5d} readings, {n_attr:3d} attributions")
        if dry_run:
            merged += 1
            continue
        merge_readings(cur, sid, canon)
        cur.execute("update attributions set station_id = %s where station_id = %s", (canon, sid))
        # the feed carries current coordinates; keep them if the archive lacks any
        cur.execute("""update stations set lat = coalesce(lat, %s), lon = coalesce(lon, %s)
                       where station_id = %s""", (lat, lon, canon))
        cur.execute("delete from stations where station_id = %s", (sid,))
        merged += 1

    print(f"\nmerged {merged} duplicate rows | kept {kept} stations with no archive twin")

    # every station without a ward is unreachable by the enforcement agent
    cur.execute("select station_id, city, lat, lon from stations where ward_id is null")
    orphans = cur.fetchall()
    fixed = {}
    for sid, city, lat, lon in orphans:
        wid, method = wards_geo.assign(city, lat, lon)
        fixed[method] = fixed.get(method, 0) + 1
        if wid and not dry_run:
            cur.execute("update stations set ward_id = %s, ward_method = %s where station_id = %s",
                        (wid, method, sid))
    print(f"ward backfill over {len(orphans)} unmapped stations: {fixed}")

    if dry_run:
        conn.rollback()
        print("\nDRY RUN — rolled back")
    else:
        conn.commit()
        cur.execute("""select count(*) total,
                              count(*) filter (where ward_id is not null) with_ward,
                              count(*) filter (where station_id like 'site!_%%' escape '!') archive
                       from stations""")
        t, w, a = cur.fetchone()
        print(f"\ncommitted. stations: {t} total, {w} ward-mapped, {a} archive-keyed")
    conn.close()


if __name__ == "__main__":
    run(dry_run="--dry-run" in sys.argv)
