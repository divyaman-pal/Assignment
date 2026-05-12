"""
Fit scorer — the most important module.

Enforces C-DISC's #1 constraint: PEN Foundation and MNZE Homes are G+1 only.
Auto-rejects leads with multi-storey / apartment / high-rise signals.
"""
from __future__ import annotations
import re
from dataclasses import dataclass

from .. import config


# Positive G+1-friendly signals (presence increases fit score)
POSITIVE_KEYWORDS = [
    "shed", "godown", "warehouse", "poultry", "dairy", "cattle", "farm",
    "cottage", "cottages", "eco resort", "resort", "homestay", "glamping",
    "single floor", "single-floor", "single storey", "single-storey",
    "g+1", "ground+1", "ground + 1", "ground floor",
    "fencing", "compound wall", "boundary wall", "shelter",
    "cold storage", "agri", "agro", "rural", "kothi", "bungalow",
    "industrial shed", "logistics park", "pre-engineered", "peb",
]


@dataclass
class FitResult:
    score: float
    rejected: bool
    reason: str
    matched_positive: list[str]
    matched_negative: list[str]


def _normalize(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.lower()).strip()


def fit_score(name: str, description: str = "", extra_context: str = "") -> FitResult:
    """
    Returns a FitResult with score 0-100.

    Rules:
    - Hard reject (score=0) if any reject keyword is found.
    - Otherwise, base score 40 + 10 per matched positive keyword (cap 100).
    """
    blob = " ".join([_normalize(name), _normalize(description), _normalize(extra_context)])
    rejects = config.reject_keywords()
    matched_negative = [k for k in rejects if k in blob]

    if matched_negative:
        return FitResult(
            score=0.0,
            rejected=True,
            reason=f"Multi-storey / high-rise signal: '{matched_negative[0]}'",
            matched_positive=[],
            matched_negative=matched_negative,
        )

    matched_positive = [k for k in POSITIVE_KEYWORDS if k in blob]
    base = 40.0
    bonus = min(60.0, len(matched_positive) * 12.0)
    score = base + bonus

    return FitResult(
        score=round(score, 2),
        rejected=False,
        reason="" if matched_positive else "No strong positive signals; default base score",
        matched_positive=matched_positive,
        matched_negative=[],
    )


def is_rejected_text(*texts: str) -> tuple[bool, str]:
    """Quick check: returns (rejected?, reason)."""
    blob = " ".join(_normalize(t) for t in texts)
    for k in config.reject_keywords():
        if k in blob:
            return True, f"Contains reject keyword: '{k}'"
    return False, ""
