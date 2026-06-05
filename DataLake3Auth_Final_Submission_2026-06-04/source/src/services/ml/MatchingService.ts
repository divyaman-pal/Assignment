import { ML_CONFIG } from '../../constants';
import DatabaseService from '../database/DatabaseService';
import type { MatchResult, FaceTemplate } from '../../types';

/**
 * Robust face matching engine using cosine similarity with margin-based rejection.
 *
 * Algorithm:
 *   1. L2-normalize the live embedding (should already be normalized, but verify).
 *   2. For each enrolled worker, compute cosine similarity against each stored template.
 *   3. Use the maximum similarity across a worker's templates as their score.
 *   4. Pick the best match.
 *   5. Reject if:
 *      - Best score < SIMILARITY_THRESHOLD (not close enough to anyone)
 *      - (Best - SecondBest) < MATCH_MARGIN_THRESHOLD (ambiguous match)
 *
 * This prevents the system from always matching the latest enrolled worker
 * and handles the case of similar-looking individuals.
 */
export class MatchingService {
  private static instance: MatchingService;

  private cachedTemplates: {
    workerId: string;
    workerName: string;
    templates: FaceTemplate[];
  }[] = [];
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 5000;

  static getInstance(): MatchingService {
    if (!MatchingService.instance) {
      MatchingService.instance = new MatchingService();
    }
    return MatchingService.instance;
  }

  /**
   * Match a live embedding against all enrolled workers.
   */
  async matchEmbedding(liveEmbedding: Float32Array): Promise<MatchResult> {
    const startMs = performance.now();

    const normalized = this.l2Normalize(liveEmbedding);
    const workerTemplates = await this.getTemplatesWithCache();

    if (workerTemplates.length === 0) {
      return {
        matched: false,
        workerId: null,
        workerName: null,
        confidence: 0,
        margin: 0,
        matchTimeMs: performance.now() - startMs,
        allScores: [],
      };
    }

    const workerScores: { workerId: string; workerName: string; score: number }[] = [];

    for (const wt of workerTemplates) {
      let maxSimilarity = -1;

      for (const template of wt.templates) {
        const similarity = this.cosineSimilarity(normalized, template.embedding);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
      }

      workerScores.push({
        workerId: wt.workerId,
        workerName: wt.workerName,
        score: maxSimilarity,
      });
    }

    workerScores.sort((a, b) => b.score - a.score);

    const best = workerScores[0];
    const secondBest = workerScores.length > 1 ? workerScores[1] : null;
    const margin = secondBest ? best.score - secondBest.score : 1.0;

    const matched =
      best.score >= ML_CONFIG.SIMILARITY_THRESHOLD &&
      margin >= ML_CONFIG.MATCH_MARGIN_THRESHOLD;

    const matchTimeMs = performance.now() - startMs;

    console.log(
      `[ML:Match] Best: ${best.workerName} (${best.score.toFixed(3)}), ` +
      `Margin: ${margin.toFixed(3)}, Matched: ${matched}, ` +
      `Time: ${matchTimeMs.toFixed(1)}ms`,
    );

    return {
      matched,
      workerId: matched ? best.workerId : null,
      workerName: matched ? best.workerName : null,
      confidence: best.score,
      margin,
      matchTimeMs,
      allScores: workerScores.slice(0, 5),
    };
  }

  /**
   * Compute cosine similarity between two L2-normalized vectors.
   * Since vectors are normalized, cosine similarity = dot product.
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }

  /**
   * L2 normalize a vector.
   */
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

  /**
   * Get templates from cache or DB.
   */
  private async getTemplatesWithCache() {
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL_MS && this.cachedTemplates.length > 0) {
      return this.cachedTemplates;
    }

    const db = DatabaseService;
    this.cachedTemplates = await db.getAllTemplates();
    this.cacheTimestamp = now;
    return this.cachedTemplates;
  }

  /**
   * Invalidate the template cache (call after enrollment changes).
   */
  invalidateCache(): void {
    this.cacheTimestamp = 0;
    this.cachedTemplates = [];
  }

  /**
   * Check if a new embedding is sufficiently different from existing templates
   * to be worth storing (for enrollment diversity).
   */
  isEmbeddingDiverse(
    newEmbedding: Float32Array,
    existingTemplates: FaceTemplate[],
    minDiversity = 0.15,
  ): boolean {
    if (existingTemplates.length === 0) return true;

    for (const t of existingTemplates) {
      const sim = this.cosineSimilarity(
        this.l2Normalize(newEmbedding),
        this.l2Normalize(t.embedding),
      );
      if (sim > 1.0 - minDiversity) {
        return false;
      }
    }
    return true;
  }
}

export default MatchingService.getInstance();
