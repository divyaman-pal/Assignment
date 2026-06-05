# Face Matching Algorithm — Technical Details

## Overview

The matching engine uses **cosine similarity** between L2-normalized 128-d face
embeddings, with a **margin-based rejection** strategy to prevent false positives
and ambiguous matches.

## Embedding Space

MobileFaceNet produces 128-dimensional vectors trained with ArcFace loss.
After L2-normalization, these lie on the unit hypersphere in R^128.

For normalized vectors, **cosine similarity equals the dot product**:

```
similarity(a, b) = Σ(a_i × b_i)   where ||a|| = ||b|| = 1
```

Same person → similarity ≈ 0.7–1.0
Different person → similarity ≈ -0.1–0.4

## Matching Algorithm

```python
def match(live_embedding, enrolled_workers):
    scores = []
    for worker in enrolled_workers:
        # Use BEST template score for each worker
        best_score = max(
            cosine_similarity(live_embedding, template)
            for template in worker.templates
        )
        scores.append((worker, best_score))

    scores.sort(by=score, descending=True)
    best = scores[0]
    second_best = scores[1] if len(scores) > 1 else (None, 0)
    margin = best.score - second_best.score

    if best.score >= SIMILARITY_THRESHOLD and margin >= MARGIN_THRESHOLD:
        return Match(worker=best.worker, confidence=best.score, margin=margin)
    else:
        return NoMatch()
```

## Thresholds

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| SIMILARITY_THRESHOLD | 0.55 | Conservative: rejects poor matches |
| MARGIN_THRESHOLD | 0.08 | Prevents ambiguous matches between similar-looking people |

## Multiple Templates Per Worker

Each worker can have up to 5 templates, captured at different:
- Angles (slight head tilts)
- Expressions (neutral, slight smile)
- Lighting conditions

Using the **maximum** similarity across templates means:
- Verification succeeds if ANY template matches well
- Robust against pose and expression variation
- Each template covers a different region of the worker's appearance space

## Why Margin Matters

Without margin-based rejection:
```
Worker A: 0.60 similarity
Worker B: 0.58 similarity
→ Matches Worker A (but very uncertain!)
```

With margin-based rejection (margin = 0.02 < 0.08):
```
Worker A: 0.60 similarity
Worker B: 0.58 similarity
→ REJECTED (ambiguous — margin too small)
```

This prevents the system from confidently matching when two workers
look similar from the model's perspective.

## Template Diversity Check

During enrollment, new embeddings are checked for diversity:
```
For each existing template T:
  if cosine_similarity(new_embedding, T) > 0.85:
    reject as duplicate (too similar to existing template)
```

This ensures templates capture meaningfully different appearances
rather than redundant near-identical captures.

## Performance

- Cosine similarity computation: O(D) where D = 128 dimensions
- Per-worker comparison: O(D × T) where T = templates per worker
- Full match: O(D × T × W) where W = total enrolled workers
- With 100 workers × 5 templates = 500 comparisons × 128 multiplications
- Total: 64,000 float multiply-adds ≈ **<1ms on any modern CPU**
