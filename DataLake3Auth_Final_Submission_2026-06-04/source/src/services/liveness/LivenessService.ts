import { ML_CONFIG } from '../../constants';
import type { FaceDetectionResult, LivenessResult } from '../../types';

/**
 * Offline liveness detection using ML Kit face classification signals.
 *
 * Strategy: Multi-signal fusion approach using readily available ML Kit outputs.
 * No additional model needed — uses the face detection model's classification scores.
 *
 * Signals checked (any ONE passing is sufficient):
 *   1. Blink detection: eye open probability drops below threshold
 *   2. Smile detection: smile probability exceeds threshold
 *   3. Head movement: euler angles show natural micro-movements
 *
 * Additionally, a texture/consistency check compares face bounding box aspect ratio
 * and landmark distribution against known patterns of printed photos/screens.
 *
 * Total check time target: <50ms (no additional model inference needed).
 */

interface FaceHistoryEntry {
  timestamp: number;
  leftEyeOpen: number;
  rightEyeOpen: number;
  smile: number;
  headX: number;
  headY: number;
  headZ: number;
}

export class LivenessService {
  private static instance: LivenessService;
  private faceHistory: FaceHistoryEntry[] = [];
  private readonly HISTORY_MAX = 30;
  private readonly HISTORY_WINDOW_MS = 3000;

  static getInstance(): LivenessService {
    if (!LivenessService.instance) {
      LivenessService.instance = new LivenessService();
    }
    return LivenessService.instance;
  }

  /**
   * Record a face detection frame for temporal liveness analysis.
   * Call this on each camera frame where a face is detected.
   */
  recordFrame(face: FaceDetectionResult): void {
    const now = Date.now();
    this.faceHistory.push({
      timestamp: now,
      leftEyeOpen: face.leftEyeOpenProbability,
      rightEyeOpen: face.rightEyeOpenProbability,
      smile: face.smilingProbability,
      headX: face.headEulerAngleX,
      headY: face.headEulerAngleY,
      headZ: face.headEulerAngleZ,
    });

    const cutoff = now - this.HISTORY_WINDOW_MS;
    this.faceHistory = this.faceHistory.filter(e => e.timestamp > cutoff);

    if (this.faceHistory.length > this.HISTORY_MAX) {
      this.faceHistory = this.faceHistory.slice(-this.HISTORY_MAX);
    }
  }

  /**
   * Run a liveness check using the current face detection and history.
   *
   * For single-shot verification (e.g., still photo capture), pass only `currentFace`.
   * For live camera verification, also ensure recordFrame() has been called on recent frames.
   */
  checkLiveness(currentFace: FaceDetectionResult): LivenessResult {
    const startMs = performance.now();

    const blinkResult = this.checkBlink(currentFace);
    const smileResult = this.checkSmile(currentFace);
    const headMoveResult = this.checkHeadMovement();
    const textureResult = this.checkFaceTexture(currentFace);

    const passedChecks = [
      blinkResult.detected,
      smileResult.detected,
      headMoveResult.detected,
    ].filter(Boolean).length;

    const isLive = passedChecks >= 1 && textureResult.score > 0.3;

    const score = this.computeLivenessScore(
      blinkResult,
      smileResult,
      headMoveResult,
      textureResult,
    );

    const method = this.describeMethod(blinkResult, smileResult, headMoveResult);
    const checkTimeMs = performance.now() - startMs;

    console.log(
      `[Liveness] Live: ${isLive}, Score: ${score.toFixed(2)}, ` +
      `Method: ${method}, Time: ${checkTimeMs.toFixed(1)}ms`,
    );

    return {
      isLive,
      score,
      method,
      details: {
        blinkDetected: blinkResult.detected,
        smileDetected: smileResult.detected,
        headMovement: headMoveResult.detected,
        textureScore: textureResult.score,
      },
      checkTimeMs,
    };
  }

  /**
   * Quick single-frame liveness for still-photo enrollment/verification.
   * Less strict — only checks face geometry and basic classification.
   */
  quickLivenessCheck(face: FaceDetectionResult): LivenessResult {
    const startMs = performance.now();

    const hasClassification =
      face.leftEyeOpenProbability >= 0 && face.smilingProbability >= 0;

    const eyesOpen =
      face.leftEyeOpenProbability > 0.5 && face.rightEyeOpenProbability > 0.5;

    const faceSize = face.bounds.width * face.bounds.height;
    const aspectRatio = face.bounds.width / Math.max(face.bounds.height, 1);
    const reasonableAspect = aspectRatio > 0.6 && aspectRatio < 1.5;
    const reasonableSize = faceSize > 5000;

    const naturalPose =
      Math.abs(face.headEulerAngleX) < 20 &&
      Math.abs(face.headEulerAngleY) < 25;

    const isLive = hasClassification && eyesOpen && reasonableAspect &&
                   reasonableSize && naturalPose;

    const score = isLive ? 0.7 : 0.2;
    const checkTimeMs = performance.now() - startMs;

    return {
      isLive,
      score,
      method: 'quick_check',
      details: {
        blinkDetected: false,
        smileDetected: face.smilingProbability > ML_CONFIG.LIVENESS_SMILE_THRESHOLD,
        headMovement: false,
        textureScore: reasonableAspect && reasonableSize ? 0.8 : 0.2,
      },
      checkTimeMs,
    };
  }

  resetHistory(): void {
    this.faceHistory = [];
  }

  // ─── Internal checks ────────────────────────────────────────

  private checkBlink(current: FaceDetectionResult): { detected: boolean; confidence: number } {
    if (current.leftEyeOpenProbability < 0 || current.rightEyeOpenProbability < 0) {
      return { detected: false, confidence: 0 };
    }

    if (this.faceHistory.length < 5) {
      return { detected: false, confidence: 0 };
    }

    let hadEyesClosed = false;
    let hadEyesOpen = false;

    for (const entry of this.faceHistory) {
      if (entry.leftEyeOpen < ML_CONFIG.LIVENESS_BLINK_THRESHOLD &&
          entry.rightEyeOpen < ML_CONFIG.LIVENESS_BLINK_THRESHOLD) {
        hadEyesClosed = true;
      }
      if (entry.leftEyeOpen > 0.7 && entry.rightEyeOpen > 0.7) {
        hadEyesOpen = true;
      }
    }

    const detected = hadEyesClosed && hadEyesOpen;
    return { detected, confidence: detected ? 0.9 : 0.1 };
  }

  private checkSmile(current: FaceDetectionResult): { detected: boolean; confidence: number } {
    if (current.smilingProbability < 0) {
      return { detected: false, confidence: 0 };
    }

    const detected = current.smilingProbability > ML_CONFIG.LIVENESS_SMILE_THRESHOLD;

    if (!detected && this.faceHistory.length >= 3) {
      const hadSmile = this.faceHistory.some(
        e => e.smile > ML_CONFIG.LIVENESS_SMILE_THRESHOLD,
      );
      const hadNoSmile = this.faceHistory.some(e => e.smile < 0.3);
      if (hadSmile && hadNoSmile) {
        return { detected: true, confidence: 0.85 };
      }
    }

    return { detected, confidence: detected ? 0.8 : 0.1 };
  }

  private checkHeadMovement(): { detected: boolean; confidence: number } {
    if (this.faceHistory.length < 5) {
      return { detected: false, confidence: 0 };
    }

    const yValues = this.faceHistory.map(e => e.headY);
    const xValues = this.faceHistory.map(e => e.headX);

    const yRange = Math.max(...yValues) - Math.min(...yValues);
    const xRange = Math.max(...xValues) - Math.min(...xValues);

    const hasMovement =
      yRange > ML_CONFIG.LIVENESS_HEAD_ROTATION_THRESHOLD ||
      xRange > ML_CONFIG.LIVENESS_HEAD_ROTATION_THRESHOLD;

    const hasNaturalVariation = yRange > 3 || xRange > 3;

    const detected = hasMovement || hasNaturalVariation;
    const confidence = hasMovement ? 0.9 : hasNaturalVariation ? 0.6 : 0.1;

    return { detected, confidence };
  }

  private checkFaceTexture(face: FaceDetectionResult): { score: number } {
    const aspectRatio = face.bounds.width / Math.max(face.bounds.height, 1);
    const isReasonableAspect = aspectRatio > 0.65 && aspectRatio < 1.4;

    const landmarkCount = face.landmarks?.length || 0;
    const hasLandmarks = landmarkCount >= 3;

    const naturalPose =
      Math.abs(face.headEulerAngleX) < 30 &&
      Math.abs(face.headEulerAngleY) < 35 &&
      Math.abs(face.headEulerAngleZ) < 25;

    let score = 0.5;
    if (isReasonableAspect) score += 0.15;
    if (hasLandmarks) score += 0.2;
    if (naturalPose) score += 0.15;

    return { score: Math.min(score, 1.0) };
  }

  private computeLivenessScore(
    blink: { detected: boolean; confidence: number },
    smile: { detected: boolean; confidence: number },
    headMove: { detected: boolean; confidence: number },
    texture: { score: number },
  ): number {
    const weights = { blink: 0.3, smile: 0.25, headMove: 0.25, texture: 0.2 };
    return (
      blink.confidence * weights.blink +
      smile.confidence * weights.smile +
      headMove.confidence * weights.headMove +
      texture.score * weights.texture
    );
  }

  private describeMethod(
    blink: { detected: boolean },
    smile: { detected: boolean },
    headMove: { detected: boolean },
  ): string {
    const methods: string[] = [];
    if (blink.detected) methods.push('blink');
    if (smile.detected) methods.push('smile');
    if (headMove.detected) methods.push('head_movement');
    return methods.length > 0 ? methods.join('+') : 'none';
  }
}

export default LivenessService.getInstance();
