import { useState, useEffect, useCallback } from 'react';
import VerificationPipeline from '../services/ml/VerificationPipeline';
import type { ModelStatus } from '../types';

export function useMLStatus() {
  const [status, setStatus] = useState<ModelStatus>({
    faceDetector: 'not_loaded',
    embeddingModel: 'not_loaded',
    livenessModel: 'not_loaded',
    lastWarmup: null,
    warmupTimeMs: null,
  });
  const [initializing, setInitializing] = useState(false);

  const initModels = useCallback(async () => {
    setInitializing(true);
    try {
      await VerificationPipeline.initialize();
      setStatus(VerificationPipeline.getModelStatus());
    } catch (error) {
      console.error('[useMLStatus] Init failed:', error);
      setStatus(VerificationPipeline.getModelStatus());
    } finally {
      setInitializing(false);
    }
  }, []);

  const refreshStatus = useCallback(() => {
    setStatus(VerificationPipeline.getModelStatus());
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return { status, initializing, initModels, refreshStatus };
}
