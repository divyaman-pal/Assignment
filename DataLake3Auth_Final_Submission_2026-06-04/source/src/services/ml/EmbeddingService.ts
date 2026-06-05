import { Platform } from 'react-native';
import { ML_CONFIG } from '../../constants';
import type { EmbeddingResult } from '../../types';

/**
 * Face embedding generation using w600k_mbf (MobileFaceNet trained on WebFace600K).
 *
 * Model: insightface buffalo_sc recognition model
 *   - Architecture: MobileFaceNet backbone with ArcFace loss
 *   - Training data: WebFace600K (600K identities, diverse demographics)
 *   - Input: [1, 3, 112, 112] float32, CHW format, normalized (pixel/127.5 - 1.0)
 *   - Output: [1, 512] float32 embedding
 *   - Size: 13 MB
 *   - License: MIT (insightface open-source)
 *
 * Uses onnxruntime-react-native for cross-platform inference with
 * NNAPI delegate (Android) and CoreML delegate (iOS).
 */
export class EmbeddingService {
  private static instance: EmbeddingService;
  private session: any = null;
  private isLoaded = false;
  private lastError: unknown = null;
  private loadPromise: Promise<void> | null = null;

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async loadModel(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this._doLoad();
    return this.loadPromise;
  }

  private async _doLoad(): Promise<void> {
    try {
      const startMs = Date.now();
      this.lastError = null;
      const { InferenceSession } = require('onnxruntime-react-native');
      const modelAssetPath = await this.ensureModelFile();

      this.session = await InferenceSession.create(modelAssetPath, {
        executionProviders: Platform.OS === 'ios' ? ['coreml', 'cpu'] : ['cpu'],
      });

      this.isLoaded = true;
      console.log(`[ML:Embedding] ONNX model loaded in ${Date.now() - startMs}ms`);
    } catch (error) {
      console.error('[ML:Embedding] Failed to load ONNX model:', error);
      this.isLoaded = false;
      this.lastError = error;
      this.loadPromise = null;
      throw error;
    }
  }

  getStatus(): 'ready' | 'loading' | 'not_loaded' | 'error' {
    if (this.isLoaded) return 'ready';
    if (this.loadPromise) return 'loading';
    if (this.lastError) return 'error';
    return 'not_loaded';
  }

  /**
   * Generate 512-d face embedding from a preprocessed face image.
   *
   * @param facePixels - Float32Array in CHW format [C,H,W] = [3,112,112] = 37632 values.
   *                     Pixel values normalized to [-1, 1] via (pixel / 127.5 - 1.0).
   */
  async generateEmbedding(facePixels: Float32Array): Promise<EmbeddingResult> {
    if (!this.isLoaded || !this.session) {
      throw new Error('Embedding model not loaded. Call loadModel() first.');
    }

    const startMs = performance.now();
    const inputSize = 3 * ML_CONFIG.FACE_INPUT_SIZE * ML_CONFIG.FACE_INPUT_SIZE;
    if (facePixels.length !== inputSize) {
      throw new Error(
        `Expected ${inputSize} values (3x112x112 CHW), got ${facePixels.length}`,
      );
    }

    const { Tensor } = require('onnxruntime-react-native');
    const inputTensor = new Tensor('float32', facePixels, [1, 3, 112, 112]);
    const inputName = this.session.inputNames?.[0] ?? 'input.1';
    const results = await this.session.run({ [inputName]: inputTensor });

    const outputKey = Object.keys(results)[0];
    const rawEmbedding = new Float32Array(results[outputKey].data);
    const embedding = this.l2Normalize(rawEmbedding);

    const inferenceTimeMs = performance.now() - startMs;
    console.log(`[ML:Embedding] Inference: ${inferenceTimeMs.toFixed(1)}ms, dim=${embedding.length}`);

    return { embedding, inferenceTimeMs };
  }

  /**
   * Preprocess a raw RGBA/RGB image buffer into ONNX model input format.
   *
   * Converts from HWC (height, width, channels) RGBA to CHW (channels, height, width) RGB,
   * with normalization: pixel / 127.5 - 1.0
   */
  preprocessFace(
    imageData: Uint8Array,
    width: number,
    height: number,
    channels: 3 | 4 = 4,
  ): Float32Array {
    const targetSize = ML_CONFIG.FACE_INPUT_SIZE;
    const output = new Float32Array(3 * targetSize * targetSize);

    const scaleX = width / targetSize;
    const scaleY = height / targetSize;

    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const srcX = Math.min(Math.floor(x * scaleX), width - 1);
        const srcY = Math.min(Math.floor(y * scaleY), height - 1);
        const srcIdx = (srcY * width + srcX) * channels;
        const pixelIdx = y * targetSize + x;

        // CHW format: channel planes laid out sequentially
        output[0 * targetSize * targetSize + pixelIdx] = (imageData[srcIdx] / 127.5) - 1.0;     // R
        output[1 * targetSize * targetSize + pixelIdx] = (imageData[srcIdx + 1] / 127.5) - 1.0; // G
        output[2 * targetSize * targetSize + pixelIdx] = (imageData[srcIdx + 2] / 127.5) - 1.0; // B
      }
    }

    return output;
  }

  private l2Normalize(vec: Float32Array): Float32Array {
    let norm = 0;
    for (let i = 0; i < vec.length; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm < 1e-10) return vec;

    const result = new Float32Array(vec.length);
    for (let i = 0; i < vec.length; i++) {
      result[i] = vec[i] / norm;
    }
    return result;
  }

  async warmup(): Promise<number> {
    await this.loadModel();
    const dummyInput = new Float32Array(3 * ML_CONFIG.FACE_INPUT_SIZE * ML_CONFIG.FACE_INPUT_SIZE);
    const startMs = performance.now();
    await this.generateEmbedding(dummyInput);
    const elapsed = performance.now() - startMs;
    console.log(`[ML:Embedding] Warmup: ${elapsed.toFixed(1)}ms`);
    return elapsed;
  }

  dispose(): void {
    if (this.session?.release) {
      this.session.release();
    }
    this.session = null;
    this.isLoaded = false;
    this.lastError = null;
    this.loadPromise = null;
  }

  private async ensureModelFile(): Promise<string> {
    const RNFS = require('react-native-fs');
    const fileName = ML_CONFIG.MODEL_FILES.FACE_RECOGNITION;

    if (Platform.OS === 'android') {
      const assetPath = `models/${fileName}`;
      const destination = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const expectedMinSize = ML_CONFIG.MODEL_SIZE_BYTES.FACE_RECOGNITION * 0.9;
      const exists = await RNFS.exists(destination);

      if (exists) {
        const stats = await RNFS.stat(destination);
        if (Number(stats.size) >= expectedMinSize) {
          return destination;
        }
      }

      const assetExists = await RNFS.existsAssets(assetPath);
      if (!assetExists) {
        throw new Error(`Bundled ONNX model missing from APK assets: ${assetPath}`);
      }

      await RNFS.copyFileAssets(assetPath, destination);
      return destination;
    }

    return `${RNFS.MainBundlePath}/${fileName}`;
  }
}

export default EmbeddingService.getInstance();
