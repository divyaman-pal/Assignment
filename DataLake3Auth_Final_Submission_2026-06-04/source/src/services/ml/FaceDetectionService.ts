import { NativeModules, Platform } from 'react-native';
import type { FaceDetectionResult } from '../../types';

const { DataLakeCamera } = NativeModules;

/**
 * Face detection using Google ML Kit via @react-native-ml-kit/face-detection.
 *
 * Provides face bounding boxes, landmarks, and classification scores
 * (smile, eye open) which are also used for liveness detection.
 *
 * Runs fully offline using on-device ML Kit models.
 */
export class FaceDetectionService {
  private static instance: FaceDetectionService;
  private isInitialized = false;
  private lastError: unknown = null;
  private faceDetector: any = null;

  static getInstance(): FaceDetectionService {
    if (!FaceDetectionService.instance) {
      FaceDetectionService.instance = new FaceDetectionService();
    }
    return FaceDetectionService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.lastError = null;
      const hasNativeDetector =
        Platform.OS === 'android' &&
        typeof DataLakeCamera?.detectFaces === 'function';

      try {
        const MLKitFaceDetection = require('@react-native-ml-kit/face-detection');
        const candidates = [
          MLKitFaceDetection?.default,
          MLKitFaceDetection?.FaceDetection,
          MLKitFaceDetection,
        ];
        this.faceDetector = candidates.find(
          candidate => typeof candidate?.detect === 'function',
        );
      } catch (error) {
        console.warn('[ML:FaceDetect] JS face detector wrapper unavailable:', error);
      }

      if (!hasNativeDetector && !this.faceDetector) {
        throw new Error('No face detector implementation is available');
      }

      this.isInitialized = true;
      console.log(
        `[ML:FaceDetect] ML Kit face detector initialized ` +
        `(${hasNativeDetector ? 'native' : 'js'} path)`,
      );
    } catch (error) {
      console.error('[ML:FaceDetect] Failed to init:', error);
      this.lastError = error;
      throw error;
    }
  }

  getStatus(): 'ready' | 'not_loaded' | 'error' {
    if (this.isInitialized) return 'ready';
    if (this.lastError) return 'error';
    return 'not_loaded';
  }

  /**
   * Detect faces in a camera frame or image.
   *
   * @param imageUri - URI or path to the image to process
   * @returns Array of detected faces with landmarks and classification scores
   */
  async detectFaces(imageUri: string): Promise<FaceDetectionResult[]> {
    if (!this.isInitialized) {
      throw new Error('Face detector not initialized');
    }

    const startMs = performance.now();

    try {
      let results: any[] | null = null;

      if (
        Platform.OS === 'android' &&
        typeof DataLakeCamera?.detectFaces === 'function'
      ) {
        results = await DataLakeCamera.detectFaces(imageUri);
      } else if (typeof this.faceDetector?.detect === 'function') {
        results = await this.detectWithJsWrapper(imageUri);
      } else {
        throw new Error('Face detector detect() function is not available');
      }

      const faces = this.normalizeFaces(results || []);

      const elapsed = performance.now() - startMs;
      console.log(
        `[ML:FaceDetect] ${faces.length} face(s) in ${elapsed.toFixed(1)}ms`,
      );

      return faces;
    } catch (error) {
      console.error('[ML:FaceDetect] Detection failed:', error);
      return [];
    }
  }

  private async detectWithJsWrapper(imageUri: string): Promise<any[]> {
    const options = {
      performanceMode: 'fast',
      landmarkMode: 'all',
      classificationMode: 'all',
      contourMode: 'none',
      minFaceSize: 0.15,
      trackingEnabled: true,
    };

    const uriCandidates = imageUri.startsWith('file://')
      ? [imageUri, imageUri.replace(/^file:\/\//, '')]
      : [imageUri, `file://${imageUri}`];

    let lastError: unknown = null;
    for (const uri of uriCandidates) {
      try {
        return await this.faceDetector.detect(uri, options);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  private normalizeFaces(results: any[]): FaceDetectionResult[] {
    return (results || []).map((face: any) => ({
      bounds: {
        x: face.bounds?.x ?? face.frame?.x ?? face.bounds?.origin?.x ?? 0,
        y: face.bounds?.y ?? face.frame?.y ?? face.bounds?.origin?.y ?? 0,
        width:
          face.bounds?.width ??
          face.frame?.width ??
          face.bounds?.size?.width ??
          0,
        height:
          face.bounds?.height ??
          face.frame?.height ??
          face.bounds?.size?.height ??
          0,
      },
      landmarks: (face.landmarks || []).map((lm: any) => ({
        type: lm.type,
        position: { x: lm.position?.x || 0, y: lm.position?.y || 0 },
      })),
      smilingProbability: face.smilingProbability ?? -1,
      leftEyeOpenProbability: face.leftEyeOpenProbability ?? -1,
      rightEyeOpenProbability: face.rightEyeOpenProbability ?? -1,
      headEulerAngleX: face.headEulerAngleX ?? 0,
      headEulerAngleY: face.headEulerAngleY ?? 0,
      headEulerAngleZ: face.headEulerAngleZ ?? 0,
      trackingId: face.trackingId,
    }));
  }

  /**
   * Detect the single largest face in an image.
   */
  async detectPrimaryFace(imageUri: string): Promise<FaceDetectionResult | null> {
    const faces = await this.detectFaces(imageUri);
    if (faces.length === 0) return null;

    return faces.reduce((largest, face) => {
      const area = face.bounds.width * face.bounds.height;
      const largestArea = largest.bounds.width * largest.bounds.height;
      return area > largestArea ? face : largest;
    }, faces[0]);
  }

  /**
   * Check if a detected face meets minimum quality requirements.
   */
  isFaceQualityAcceptable(face: FaceDetectionResult): {
    acceptable: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const minSize = 80;

    if (face.bounds.width < minSize || face.bounds.height < minSize) {
      issues.push('Face too small. Move closer to camera.');
    }

    if (Math.abs(face.headEulerAngleY) > 30) {
      issues.push('Face turned too far sideways. Look at camera.');
    }

    if (Math.abs(face.headEulerAngleX) > 25) {
      issues.push('Face tilted too much. Keep head level.');
    }

    if (
      face.leftEyeOpenProbability >= 0 &&
      face.rightEyeOpenProbability >= 0 &&
      face.leftEyeOpenProbability < 0.3 &&
      face.rightEyeOpenProbability < 0.3
    ) {
      issues.push('Both eyes appear closed. Open your eyes.');
    }

    return { acceptable: issues.length === 0, issues };
  }
}

export default FaceDetectionService.getInstance();
