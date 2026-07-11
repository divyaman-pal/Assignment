"""Reproducible data acquisition for VAYU-NET.

Everything comes from open, verifiable sources via git (works behind
restrictive proxies). No API keys required for the core backbone.

Sources:
1. Vonter/india-cpcb-aqi  (ODbL) - CPCB CAAQMS readings:
   - data/cpcb-aqi.parquet            hourly AQI, 2017-2023, per station
   - data/latest-air-quality.parquet  15-min pollutants+met, latest window
2. datameet/Municipal_Spatial_Data (CC-BY) - ward boundary GeoJSONs
3. Station coordinates: data.gov.in "Real time AQI" snapshots committed in
   public GitHub repos (two independent snapshots are cross-validated;
   build_backbone.py refuses coordinates that disagree between snapshots).
"""
import shutil, subprocess, sys
from pathlib import Path

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"
TMP = Path("/tmp/vayu_fetch")

def sh(*args, cwd=None):
    print("+", " ".join(args)); subprocess.run(args, cwd=cwd, check=True)

def sparse_clone(url, dest, paths):
    if dest.exists(): shutil.rmtree(dest)
    sh("git", "clone", "--depth", "1", "--filter=blob:none", "--sparse", url, str(dest))
    sh("git", "-C", str(dest), "sparse-checkout", "set", "--no-cone", *paths)

def main():
    RAW.mkdir(parents=True, exist_ok=True); TMP.mkdir(parents=True, exist_ok=True)
    # 1. CPCB readings
    d = TMP / "aqi"
    sparse_clone("https://github.com/Vonter/india-cpcb-aqi.git", d, ["/data"])
    for f in ["cpcb-aqi.parquet", "latest-air-quality.parquet"]:
        shutil.copy(d / "data" / f, RAW / f); print("->", RAW / f)
    # 2. Ward boundaries
    d = TMP / "msd"
    sparse_clone("https://github.com/datameet/Municipal_Spatial_Data.git", d,
                 ["/Delhi", "/Mumbai", "/Bangalore"])
    wards = RAW / "wards"; wards.mkdir(exist_ok=True)
    for src, dst in [("Delhi/Delhi_Wards.geojson", "delhi.geojson"),
                     ("Mumbai/BMC_Wards.geojson", "mumbai.geojson"),
                     ("Bangalore/BBMP.geojson", "bengaluru.geojson")]:
        shutil.copy(d / src, wards / dst); print("->", wards / dst)
    # 3. Station coordinate snapshots (two independent sources, cross-checked)
    for url, name in [
        ("https://github.com/umang1717/Live-AQI-Prediction-Project.git", "snap1"),
        ("https://github.com/Vadisalamanoj/-Analyzing-Real-Time-Air-Quality-Across-Indian-Cities.git", "snap2")]:
        d = TMP / name
        if d.exists(): shutil.rmtree(d)
        sh("git", "clone", "--depth", "1", url, str(d))
        csvs = list(d.glob("*.csv"))
        assert csvs, f"no csv in {url}"
        shutil.copy(csvs[0], RAW / f"station_coords_{name}.csv"); print("->", RAW / f"station_coords_{name}.csv")
    print("DONE. Run: python etl/build_backbone.py")

if __name__ == "__main__":
    sys.exit(main())
