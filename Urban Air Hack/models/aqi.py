"""CPCB AQI computation — official breakpoints (CPCB, National AQI, 2014).
Source: CPCB 'National Air Quality Index' report. Sub-index via linear
interpolation within breakpoint bands; AQI = max over available pollutants.
Only PM2.5 and PM10 are used here (dominant pollutants in winter episodes);
this is stated honestly in the UI as 'PM-based AQI'.
"""
BREAKPOINTS = {
    "pm25": [(0, 30, 0, 50), (30, 60, 51, 100), (60, 90, 101, 200),
             (90, 120, 201, 300), (120, 250, 301, 400), (250, 500, 401, 500)],
    "pm10": [(0, 50, 0, 50), (50, 100, 51, 100), (100, 250, 101, 200),
             (250, 350, 201, 300), (350, 430, 301, 400), (430, 600, 401, 500)],
}

def sub_index(pollutant: str, c):
    if c is None or c != c:  # NaN
        return None
    c = min(max(c, 0.0), BREAKPOINTS[pollutant][-1][1])
    for lo, hi, ilo, ihi in BREAKPOINTS[pollutant]:
        if lo <= c <= hi:
            return ilo + (ihi - ilo) * (c - lo) / (hi - lo) if hi > lo else ilo
    return 500.0

def pm_aqi(pm25, pm10):
    subs = [s for s in (sub_index("pm25", pm25), sub_index("pm10", pm10)) if s is not None]
    return max(subs) if subs else None

BANDS = [(0, 50, "Good"), (51, 100, "Satisfactory"), (101, 200, "Moderate"),
         (201, 300, "Poor"), (301, 400, "Very Poor"), (401, 500, "Severe")]

def band(aqi):
    if aqi is None: return None
    for lo, hi, name in BANDS:
        if lo <= aqi <= hi: return name
    return "Severe"
