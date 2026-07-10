import FaceDetectionService from './FaceDetectionService';
import EmbeddingService from './EmbeddingService';
import MatchingService from './MatchingService';
import LivenessService from '../liveness/LivenessService';
import { preprocessFaceImage } from '../camera/CameraCaptureService';
import { ML_CONFIG } from '../../constants';
import type {
  VerificationResult,
  PerformanceTimings,
  FaceDetectionResult,
  ModelStatus,
} from '../../types';

/**
 * End-to-end verification pipeline orchestrating all ML services.
 *
 * Pipeline stages:
 *   1. Face detection (ML Kit) — ~30-80ms
 *   2. Face crop + resize to 112x112 + HWC→CHW normalization — ~10-20ms
 *   3. Embedding generation (w600k_mbf ONNX, 512-d) — ~40-80ms
 *   4. Liveness check (ML Kit classification signals) — ~1-5ms
 *   5. Database matching (cosine similarity + margin) — ~1-10ms
 *
 * Target total: <200ms on mid-range devices (well under 1s requirement).
 *
 * Model loading and warmup happen once at app start and are cached.
 */
export class VerificationPipeline {
  private static instance: VerificationPipeline;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  static getInstance(): VerificationPipeline {
    if (!VerificationPipeline.instance) {
      VerificationPipeline.instance = new VerificationPipeline();
    }
    return VerificationPipeline.instance;
  }

  /**
   * Initialize all ML services and warm up models.
   * Call once at app start.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    const startMs = performance.now();
    console.log('[Pipeline] Initializing ML services...');

    try {
      await Promise.all([
        FaceDetectionService.initialize(),
        EmbeddingService.loadModel(),
      ]);

      await EmbeddingService.warmup();
      this.isInitialized = true;

      const elapsed = performance.now() - startMs;
      console.log(`[Pipeline] All models ready in ${elapsed.toFixed(0)}ms`);
    } catch (error) {
      console.error('[Pipeline] Initialization failed:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Run the full verification pipeline on a captured image.
   *
   * @param imageUri - URI of the captured face image
   * @param facePixels - Pre-extracted face pixels for embedding (112x112 RGB normalized)
   * @param detectedFace - Pre-detected face data from ML Kit (optional, will detect if not provided)
   */
  async verify(
    imageUri: string,
    facePixels?: Float32Array,
    detectedFace?: FaceDetectionResult,
  ): Promise<VerificationResult> {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized. Call initialize() first.');
    }

    const totalStartMs = performance.now();
    const timings: PerformanceTimings = {
      faceDetectionMs: 0,
      embeddingMs: 0,
      livenessMs: 0,
      dbMatchMs: 0,
      totalMs: 0,
    };

    // Stage 1: Face detection
    let face: FaceDetectionResult | undefined = detectedFace ?? undefined;
    if (!face) {
      const detectStart = performance.now();
      const detected = await FaceDetectionService.detectPrimaryFace(imageUri);
      timings.faceDetectionMs = performance.now() - detectStart;

      if (!detected) {
        return this.createNoFaceResult(timings, totalStartMs);
      }
      face = detected;
    }

    // Stage 2: Quality check
    const quality = FaceDetectionService.isFaceQualityAcceptable(face);
    if (!quality.acceptable) {
      console.warn('[Pipeline] Face quality issues:', quality.issues);
    }

    // Stage 3: Generate embedding
    let embedding: Float32Array;
    const embedStart = performance.now();

    if (facePixels) {
      const result = await EmbeddingService.generateEmbedding(facePixels);
      embedding = result.embedding;
    } else {
      const preprocessed = await this.extractAndPreprocessFace(imageUri, face);
      const result = await EmbeddingService.generateEmbedding(preprocessed);
      embedding = result.embedding;
    }
    timings.embeddingMs = performance.now() - embedStart;

    // Stage 4: Liveness check
    const livenessStart = performance.now();
    LivenessService.recordFrame(face);
    const liveness = LivenessService.quickLivenessCheck(face);
    timings.livenessMs = performance.now() - livenessStart;

    // Stage 5: Database matching
    const matchStart = performance.now();
    const match = await MatchingService.matchEmbedding(embedding);
    timings.dbMatchMs = performance.now() - matchStart;

    timings.totalMs = performance.now() - totalStartMs;

    console.log(
      `[Pipeline] Verification complete in ${timings.totalMs.toFixed(0)}ms ` +
      `(detect: ${timings.faceDetectionMs.toFixed(0)}, embed: ${timings.embeddingMs.toFixed(0)}, ` +
      `liveness: ${timings.livenessMs.toFixed(0)}, match: ${timings.dbMatchMs.toFixed(0)})`,
    );

    return { match, liveness, totalTimeMs: timings.totalMs, timings };
  }

  async verifyVideo(frameUris: string[]): Promise<VerificationResult> {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized. Call initialize() first.');
    }

    if (frameUris.length === 0) {
      throw new Error('No video frames available for verification.');
    }

    const totalStartMs = performance.now();
    const timings: PerformanceTimings = {
      faceDetectionMs: 0,
      embeddingMs: 0,
      livenessMs: 0,
      dbMatchMs: 0,
      totalMs: 0,
    };

    LivenessService.resetHistory();
    const detectStart = performance.now();
    const samples: { frameUri: string; face: FaceDetectionResult; quality: number }[] = [];

    for (const frameUri of frameUris) {
      console.log(`[Pipeline] Verification analyzing frame: ${frameUri}`);
      const face = await FaceDetectionService.detectPrimaryFace(frameUri);
      if (!face) {
        console.warn(`[Pipeline] Verification frame had no face: ${frameUri}`);
        continue;
      }

      LivenessService.recordFrame(face);
      samples.push({
        frameUri,
        face,
        quality: this.scoreFaceQuality(face),
      });
    }
    timings.faceDetectionMs = performance.now() - detectStart;

    if (samples.length === 0) {
      return this.createNoFaceResult(timings, totalStartMs);
    }

    samples.sort((a, b) => b.quality - a.quality);
    const bestSample = samples[0];

    const embedStart = performance.now();
    const preprocessed = await this.extractAndPreprocessFace(
      bestSample.frameUri,
      bestSample.face,
    );
    const embeddingResult = await EmbeddingService.generateEmbedding(preprocessed);
    timings.embeddingMs = performance.now() - embedStart;

    const livenessStart = performance.now();
    const liveness = LivenessService.checkLiveness(bestSample.face);
    timings.livenessMs = performance.now() - livenessStart;

    const matchStart = performance.now();
    const match = await MatchingService.matchEmbedding(embeddingResult.embedding);
    timings.dbMatchMs = performance.now() - matchStart;

    timings.totalMs = performance.now() - totalStartMs;

    console.log(
      `[Pipeline] Video verification used ${samples.length}/${frameUris.length} face frames ` +
      `in ${timings.totalMs.toFixed(0)}ms`,
    );

    return { match, liveness, totalTimeMs: timings.totalMs, timings };
  }

  /**
   * Generate embedding only (for enrollment, no matching needed).
   */
  async generateEnrollmentEmbedding(
    imageUri: string,
    facePixels?: Float32Array,
  ): Promise<{ embedding: Float32Array; face: FaceDetectionResult; timings: Partial<PerformanceTimings> }> {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized');
    }

    const detectStart = performance.now();
    const face = await FaceDetectionService.detectPrimaryFace(imageUri);
    const detectMs = performance.now() - detectStart;

    if (!face) {
      throw new Error('No face detected in image');
    }

    const quality = FaceDetectionService.isFaceQualityAcceptable(face);
    if (!quality.acceptable) {
      throw new Error(`Face quality issue: ${quality.issues.join(', ')}`);
    }

    const embedStart = performance.now();
    let embedding: Float32Array;

    if (facePixels) {
      const result = await EmbeddingService.generateEmbedding(facePixels);
      embedding = result.embedding;
    } else {
      const preprocessed = await this.extractAndPreprocessFace(imageUri, face);
      const result = await EmbeddingService.generateEmbedding(preprocessed);
      embedding = result.embedding;
    }
    const embedMs = performance.now() - embedStart;

    return {
      embedding,
      face,
      timings: { faceDetectionMs: detectMs, embeddingMs: embedMs },
    };
  }

  async generateEnrollmentEmbeddingsFromVideo(
    frameUris: string[],
  ): Promise<{
    embedding: Float32Array;
    face: FaceDetectionResult;
    frameUri: string;
    quality: number;
    timings: Partial<PerformanceTimings>;
  }[]> {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized');
    }

    const samples: {
      frameUri: string;
      face: FaceDetectionResult;
      quality: number;
    }[] = [];

    for (const frameUri of frameUris) {
      console.log(`[Pipeline] Enrollment analyzing frame: ${frameUri}`);
      const face = await FaceDetectionService.detectPrimaryFace(frameUri);
      if (!face) {
        console.warn(`[Pipeline] Enrollment frame had no face: ${frameUri}`);
        continue;
      }

      const quality = FaceDetectionService.isFaceQualityAcceptable(face);
      if (!quality.acceptable) {
        console.warn('[Pipeline] Enrollment frame quality warnings:', quality.issues);
      }

      samples.push({
        frameUri,
        face,
        quality: this.scoreFaceQuality(face),
      });
    }

    if (samples.length === 0) {
      throw new Error('No usable face frames found in the video.');
    }

    samples.sort((a, b) => b.quality - a.quality);
    const selectedSamples = samples.slice(0, ML_CONFIG.MAX_TEMPLATES_PER_WORKER);
    const results: {
      embedding: Float32Array;
      face: FaceDetectionResult;
      frameUri: string;
      quality: number;
      timings: Partial<PerformanceTimings>;
    }[] = [];

    for (const sample of selectedSamples) {
      const embedStart = performance.now();
      const preprocessed = await this.extractAndPreprocessFace(sample.frameUri, sample.face);
      const embeddingResult = await EmbeddingService.generateEmbedding(preprocessed);

      results.push({
        embedding: embeddingResult.embedding,
        face: sample.face,
        frameUri: sample.frameUri,
        quality: sample.quality,
        timings: { embeddingMs: performance.now() - embedStart },
      });
    }

    return results;
  }

  getModelStatus(): ModelStatus {
    const faceDetector = FaceDetectionService.getStatus();

    return {
      faceDetector,
      embeddingModel: EmbeddingService.getStatus(),
      livenessModel: faceDetector === 'ready' ? 'ready' : faceDetector,
      lastWarmup: null,
      warmupTimeMs: null,
    };
  }

  /**
   * Extract face region from image and preprocess for the ONNX embedding model.
   *
   * Steps:
   *   1. Add padding around the face bounding box (20%)
   *   2. Resize the face crop to 112x112 using react-native-image-resizer
   *   3. Read the resized image pixel data via react-native-blob-util
   *   4. Convert from HWC RGBA uint8 → CHW RGB float32 normalized [-1, 1]
   *
   * The output is directly feedable to w600k_mbf.onnx.
   */
  private async extractAndPreprocessFace(
    imageUri: string,
    face: FaceDetectionResult,
  ): Promise<Float32Array> {
    const targetSize = 112;
    const totalPixels = 3 * targetSize * targetSize;

    try {
      return await preprocessFaceImage(imageUri, face.bounds, targetSize);
    } catch (error) {
      console.warn('[Pipeline] Native image preprocessing failed:', error);

      try {
        const RNBlobUtil = require('react-native-blob-util').default;
        const base64 = await RNBlobUtil.fs.readFile(imageUri, 'base64');
        const binaryStr = atob(base64);
        const rawBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          rawBytes[i] = binaryStr.charCodeAt(i);
        }
        return EmbeddingService.preprocessFace(rawBytes, 112, 112, 4);
      } catch (fallbackError) {
        console.error('[Pipeline] All preprocessing failed:', fallbackError);
        throw new Error('Failed to preprocess face image for embedding model');
      }
    }
  }

  private scoreFaceQuality(face: FaceDetectionResult): number {
    const faceArea = face.bounds.width * face.bounds.height;
    const sizeScore = Math.min(faceArea / 80_000, 1);
    const yawScore = Math.max(0, 1 - Math.abs(face.headEulerAngleY) / 35);
    const pitchScore = Math.max(0, 1 - Math.abs(face.headEulerAngleX) / 30);
    const eyesScore =
      face.leftEyeOpenProbability >= 0 && face.rightEyeOpenProbability >= 0
        ? (face.leftEyeOpenProbability + face.rightEyeOpenProbability) / 2
        : 0.5;
    const landmarkScore = Math.min((face.landmarks?.length ?? 0) / 6, 1);

    return (
      sizeScore * 0.35 +
      yawScore * 0.2 +
      pitchScore * 0.2 +
      eyesScore * 0.15 +
      landmarkScore * 0.1
    );
  }

  private createNoFaceResult(
    timings: PerformanceTimings,
    startMs: number,
  ): VerificationResult {
    timings.totalMs = performance.now() - startMs;
    return {
      match: {
        matched: false,
        workerId: null,
        workerName: null,
        confidence: 0,
        margin: 0,
        matchTimeMs: 0,
        allScores: [],
      },
      liveness: {
        isLive: false,
        score: 0,
        method: 'no_face',
        details: {
          blinkDetected: false,
          smileDetected: false,
          headMovement: false,
          textureScore: 0,
        },
        checkTimeMs: 0,
      },
      totalTimeMs: timings.totalMs,
      timings,
    };
  }
}

export default VerificationPipeline.getInstance();
