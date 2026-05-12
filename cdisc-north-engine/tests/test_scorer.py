"""Unit tests for the fit scorer — most critical module."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from cdisc.scoring import fit_scorer, scorer, segment, geo


def test_rejects_apartment():
    r = fit_scorer.fit_score("Gomti Heights Apartments", "G+8 residential apartments")
    assert r.rejected, "Apartments must be auto-rejected"
    assert r.score == 0.0
    assert "apartment" in r.reason.lower() or "g+" in r.reason.lower()


def test_rejects_tower():
    r = fit_scorer.fit_score("Kanpur Residential Towers Pvt Ltd", "High-rise residential")
    assert r.rejected
    assert r.score == 0.0


def test_rejects_g_plus_8():
    r = fit_scorer.fit_score("Some Builder", "Project: G+8 mixed use")
    assert r.rejected


def test_rejects_housing_society():
    r = fit_scorer.fit_score("Sundaram Housing Society", "")
    assert r.rejected


def test_accepts_poultry_farm():
    r = fit_scorer.fit_score("Saraswati Poultry Farm", "Layer poultry shed expansion")
    assert not r.rejected
    assert r.score > 60
    assert "poultry" in r.matched_positive or "farm" in r.matched_positive


def test_accepts_industrial_shed():
    r = fit_scorer.fit_score("Hindustan Logistics Park", "Single-storey warehouse complex")
    assert not r.rejected
    assert r.score > 60


def test_accepts_eco_resort():
    r = fit_scorer.fit_score("Lakeview Eco Resort", "Eco-cottages on hillside")
    assert not r.rejected


def test_geo_zone1_top_score():
    s, label = geo.geo_score("Gautam Buddh Nagar")
    assert s == 100
    assert "YEIDA" in label


def test_geo_unknown_district():
    s, _ = geo.geo_score("Some Random Town")
    assert s <= 60


def test_segment_classification_farm():
    seg = segment.classify_segment("Saraswati Poultry Farm", "Layer shed")
    assert seg == "farm_infra"


def test_segment_classification_warehouse():
    seg = segment.classify_segment("Hindustan Logistics Park", "Warehouse complex")
    assert seg == "industrial_shed"


def test_full_score_apartment_zero():
    res = scorer.score_lead({"name": "ABC Apartments", "description": "G+10 residential",
                             "district": "Lucknow"})
    assert res.rejected
    assert res.final_score == 0.0


def test_full_score_poultry_high():
    res = scorer.score_lead({"name": "Saraswati Poultry Farm",
                             "description": "Layer poultry shed expansion",
                             "district": "Bareilly", "state": "Uttar Pradesh"})
    assert not res.rejected
    assert res.final_score > 70
    assert res.segment == "farm_infra"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
