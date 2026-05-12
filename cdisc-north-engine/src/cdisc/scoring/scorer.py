"""Composite scorer — combines fit, geo, and segment scores into a final 0-100."""
from __future__ import annotations
from dataclasses import dataclass, asdict

from .. import config
from . import fit_scorer, geo, segment


@dataclass
class ScoreResult:
    final_score: float
    fit_score: float
    geo_score: float
    segment_score: float
    segment: str
    geo_zone: str
    rejected: bool
    reject_reason: str

    def to_dict(self) -> dict:
        return asdict(self)


def score_lead(lead: dict) -> ScoreResult:
    """
    `lead` is expected to have:
      name, description, district, state (optional), segment_hint (optional)
    """
    name = lead.get("name", "")
    description = lead.get("description") or lead.get("address") or ""
    fit = fit_scorer.fit_score(name, description)

    if fit.rejected:
        return ScoreResult(
            final_score=0.0,
            fit_score=0.0,
            geo_score=0.0,
            segment_score=0.0,
            segment=lead.get("segment_hint", "industrial_shed"),
            geo_zone="N/A",
            rejected=True,
            reject_reason=fit.reason,
        )

    geo_pts, zone_label = geo.geo_score(lead.get("district"), lead.get("state"))
    seg_key = segment.classify_segment(name, description, lead.get("segment_hint"))
    seg_pts = segment.segment_score(seg_key)

    w = config.get("scoring.weights", {"fit": 0.45, "geo": 0.30, "segment": 0.25})
    final = (w["fit"] * fit.score) + (w["geo"] * geo_pts) + (w["segment"] * seg_pts)

    return ScoreResult(
        final_score=round(final, 2),
        fit_score=fit.score,
        geo_score=geo_pts,
        segment_score=seg_pts,
        segment=seg_key,
        geo_zone=zone_label,
        rejected=False,
        reject_reason="",
    )
