# Liveness Detection — Technical Details

## Approach: ML Kit Signal Fusion

Rather than using a separate anti-spoofing model (which would add to the
model footprint), DataLake3Auth uses the **face classification signals**
already produced by ML Kit's face detector.

This is a zero-additional-cost approach: the face detector runs anyway
for bounding box extraction, and its classification outputs are free.

## Signals

### 1. Blink Detection

**Source**: `leftEyeOpenProbability`, `rightEyeOpenProbability`

**Algorithm**:
- Maintain a rolling window of the last 3 seconds of frames
- Look for at least one frame where BOTH eyes were closed (probability < 0.3)
- AND at least one frame where BOTH eyes were open (probability > 0.7)
- This detects a natural blink cycle

**Why it works for liveness**:
- Printed photos have static eyes (always open)
- Screen replays may not show natural blink timing
- Natural blink rate: 15-20 blinks/minute

### 2. Smile Detection

**Source**: `smilingProbability`

**Algorithm**:
- Current frame smile probability > 0.6 triggers detection
- OR: History shows both smiling (>0.6) and neutral (<0.3) frames
- The transition from neutral to smile is a strong live signal

**Why it works for liveness**:
- Static photos show a fixed expression
- Asking user to smile is a simple, fast interaction

### 3. Head Movement

**Source**: `headEulerAngleX` (pitch), `headEulerAngleY` (yaw)

**Algorithm**:
- Compute range of head angles across rolling window
- If yaw range > 10° OR pitch range > 10° → movement detected
- Even natural micro-movements (range > 3°) count as weak signal

**Why it works for liveness**:
- Real faces show involuntary micro-movements
- Printed photos are perfectly static
- Screen replays often have uniform head pose

### 4. Face Texture Check (Heuristic)

**Source**: Face bounding box and landmark analysis

**Algorithm**:
- Check face aspect ratio is realistic (0.65 - 1.4)
- Verify landmarks are present and well-distributed
- Check head pose is natural (not extreme angles)

**Why it works**:
- Flat photos may have distorted aspect ratios when photographed at an angle
- Screen displays may show edge artifacts

## Fusion Strategy

```
liveness_score = 0.30 × blink_confidence
               + 0.25 × smile_confidence
               + 0.25 × head_move_confidence
               + 0.20 × texture_score

is_live = (at_least_1_signal_passed) AND (texture_score > 0.3)
```

**Key design decision**: Any ONE live cue passing is sufficient.
This keeps the user experience fast and natural — no complicated
multi-step instructions.

## Quick Check Mode

For still-photo enrollment (no frame history available):
- Checks eyes are open
- Checks face geometry is reasonable
- Checks head pose is natural
- Lower confidence score (0.7 max vs 0.95 for full check)

## Performance

| Component | Time |
|-----------|------|
| Signal extraction | 0ms (from ML Kit detection) |
| History analysis | ~1ms |
| Score computation | ~0.5ms |
| **Total** | **~2-3ms** |

## Limitations

1. **Not cryptographically secure**: A sophisticated attacker with a
   video of the target person blinking could potentially fool this system.
2. **Requires user cooperation**: At least one natural movement needed.
3. **Lighting dependent**: ML Kit classification accuracy drops in very
   low light.

## Recommended Enhancements

For production deployment beyond hackathon scope:
1. Add a lightweight texture-based anti-spoofing model (~2 MB)
2. Use depth sensor data on devices that support it
3. Add random challenge-response (e.g., "turn head left")
4. Implement frame-to-frame optical flow analysis
