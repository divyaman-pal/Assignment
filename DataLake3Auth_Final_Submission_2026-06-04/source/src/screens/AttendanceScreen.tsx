import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from '../components/SafeIcon';
import { UI_CONFIG, CAMERA_CONFIG } from '../constants';
import VerificationPipeline from '../services/ml/VerificationPipeline';
import LivenessService from '../services/liveness/LivenessService';
import DatabaseService from '../services/database/DatabaseService';
import {
  captureFaceVideo,
  type FaceVideoCapture,
} from '../services/camera/CameraCaptureService';
import ConfidenceBar from '../components/ConfidenceBar';
import StatusBadge from '../components/StatusBadge';
import type { VerificationResult } from '../types';
import { formatMs } from '../utils/timing';

type VerifyState = 'idle' | 'scanning' | 'processing' | 'success' | 'failed' | 'no_match';

export default function AttendanceScreen() {
  const [state, setState] = useState<VerifyState>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('Position face in frame');
  const [workerCount, setWorkerCount] = useState(0);
  const [capturedVideo, setCapturedVideo] = useState<FaceVideoCapture | null>(null);

  useEffect(() => {
    DatabaseService.getWorkers().then(workers => {
      setWorkerCount(workers.length);
    });
  }, []);

  const handleVerify = useCallback(async () => {
    setState('scanning');
    setResult(null);
    setCapturedVideo(null);
    setStatusMessage('Recording liveness video...');
    LivenessService.resetHistory();

    try {
      const video = await captureFaceVideo(
        CAMERA_CONFIG.VIDEO_DURATION_MS,
        CAMERA_CONFIG.VIDEO_FRAME_COUNT,
      );
      setCapturedVideo(video);

      setState('processing');
      setStatusMessage(`Analyzing ${video.frameUris.length} video frames...`);
      await VerificationPipeline.initialize();

      const verifyResult = await VerificationPipeline.verifyVideo(video.frameUris);
      setResult(verifyResult);

      if (verifyResult.match.matched && verifyResult.liveness.isLive) {
        setState('success');
        setStatusMessage(`Verified: ${verifyResult.match.workerName}`);

        await DatabaseService.logAttendance(
          verifyResult.match.workerId!,
          verifyResult.match.workerName!,
          verifyResult.match.confidence,
          verifyResult.liveness.score,
          verifyResult.liveness.method,
          verifyResult.match.margin,
          verifyResult.totalTimeMs,
        );
      } else if (verifyResult.match.matched && !verifyResult.liveness.isLive) {
        setState('failed');
        setStatusMessage('Liveness check failed. Blink or turn your head in the video.');
      } else {
        setState('no_match');
        setStatusMessage('No matching worker found. Ensure enrollment is complete.');
      }
    } catch (err: any) {
      console.error('[Verify] Error:', err);
      setState('failed');
      setStatusMessage(`Verification error: ${err.message}`);
    }
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setResult(null);
    setCapturedVideo(null);
    setStatusMessage('Position face in frame');
    LivenessService.resetHistory();
  }, []);

  const stateColor =
    state === 'success'
      ? UI_CONFIG.COLORS.success
      : state === 'failed'
      ? UI_CONFIG.COLORS.error
      : state === 'no_match'
      ? UI_CONFIG.COLORS.warning
      : UI_CONFIG.COLORS.primary;

  return (
    <View style={styles.container}>
      <View style={styles.cameraSection}>
        <View style={styles.cameraPreview}>
          <Icon
            name={
              state === 'success'
                ? 'check-circle'
                : state === 'failed'
                ? 'close-circle'
                : state === 'no_match'
                ? 'help-circle'
                : 'face-recognition'
            }
            size={80}
            color={stateColor}
          />
          <Text style={[styles.cameraStatusText, { color: stateColor }]}>
            {statusMessage}
          </Text>
        </View>

        <View style={styles.faceGuide}>
          <View style={[styles.faceGuideCorner, styles.topLeft]} />
          <View style={[styles.faceGuideCorner, styles.topRight]} />
          <View style={[styles.faceGuideCorner, styles.bottomLeft]} />
          <View style={[styles.faceGuideCorner, styles.bottomRight]} />
        </View>

        <View style={styles.workersBadge}>
          <Icon name="database" size={14} color="#FFF" />
          <Text style={styles.workersBadgeText}>{workerCount} enrolled</Text>
        </View>
      </View>

      <View style={styles.resultsPanel}>
        {state === 'idle' && (
          <View style={styles.idlePanel}>
            <Text style={styles.idleTitle}>Ready to Verify</Text>
            <Text style={styles.idleDesc}>
              Tap the button below to record a short in-app video. Blink or turn
              your head slightly so liveness can be checked before attendance is saved.
            </Text>
            {workerCount === 0 && (
              <View style={styles.warningBox}>
                <Icon name="alert" size={18} color={UI_CONFIG.COLORS.warning} />
                <Text style={styles.warningText}>
                  No workers enrolled yet. Enroll workers first.
                </Text>
              </View>
            )}
          </View>
        )}

        {(state === 'scanning' || state === 'processing') && (
          <View style={styles.processingPanel}>
            <ActivityIndicator size="large" color={UI_CONFIG.COLORS.primary} />
            <Text style={styles.processingText}>{statusMessage}</Text>
          </View>
        )}

        {result && (state === 'success' || state === 'failed' || state === 'no_match') && (
          <View style={styles.resultDetail}>
            <View style={styles.videoSummaryCard}>
              <Icon name="camera-iris" size={20} color={stateColor} />
              <Text style={styles.videoSummaryText}>
                {capturedVideo
                  ? `${capturedVideo.frameUris.length} video frames analyzed`
                  : 'Video processed'}
              </Text>
            </View>

            {result.match.matched && (
              <View style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Icon
                    name="account-check"
                    size={24}
                    color={
                      result.liveness.isLive
                        ? UI_CONFIG.COLORS.success
                        : UI_CONFIG.COLORS.warning
                    }
                  />
                  <Text style={styles.matchName}>{result.match.workerName}</Text>
                </View>
                <ConfidenceBar value={result.match.confidence} label="Match Confidence" />
                <View style={styles.matchMeta}>
                  <Text style={styles.metaItem}>
                    Margin: {result.match.margin.toFixed(3)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.livenessCard}>
              <View style={styles.livenessHeader}>
                <Icon
                  name={result.liveness.isLive ? 'shield-check' : 'shield-alert'}
                  size={20}
                  color={
                    result.liveness.isLive
                      ? UI_CONFIG.COLORS.success
                      : UI_CONFIG.COLORS.error
                  }
                />
                <Text style={styles.livenessTitle}>
                  Liveness: {result.liveness.isLive ? 'PASS' : 'FAIL'}
                </Text>
                <StatusBadge
                  status={result.liveness.isLive ? 'ready' : 'error'}
                  label={result.liveness.method}
                  size="small"
                />
              </View>
              <ConfidenceBar value={result.liveness.score} label="Liveness Score" />
              <View style={styles.livenessDetails}>
                <LivenessCheck label="Blink" passed={result.liveness.details.blinkDetected} />
                <LivenessCheck label="Smile" passed={result.liveness.details.smileDetected} />
                <LivenessCheck label="Head Move" passed={result.liveness.details.headMovement} />
              </View>
            </View>

            <View style={styles.timingCard}>
              <Text style={styles.timingTitle}>Performance</Text>
              <TimingRow label="Face Detection" ms={result.timings.faceDetectionMs} />
              <TimingRow label="Embedding" ms={result.timings.embeddingMs} />
              <TimingRow label="Liveness Check" ms={result.timings.livenessMs} />
              <TimingRow label="DB Matching" ms={result.timings.dbMatchMs} />
              <View style={styles.timingDivider} />
              <TimingRow label="Total" ms={result.timings.totalMs} bold />
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          {state === 'idle' && (
            <TouchableOpacity
              style={[styles.verifyButton, workerCount === 0 && styles.disabledButton]}
              onPress={handleVerify}
              disabled={workerCount === 0}>
              <Icon name="face-recognition" size={24} color="#FFF" />
              <Text style={styles.verifyButtonText}>Verify Identity</Text>
            </TouchableOpacity>
          )}
          {(state === 'success' || state === 'failed' || state === 'no_match') && (
            <TouchableOpacity style={styles.retryButton} onPress={handleReset}>
              <Icon name="refresh" size={20} color={UI_CONFIG.COLORS.primary} />
              <Text style={styles.retryButtonText}>Verify Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function LivenessCheck({ label, passed }: { label: string; passed: boolean }) {
  return (
    <View style={styles.livenessCheckRow}>
      <Icon
        name={passed ? 'check-circle' : 'circle-outline'}
        size={16}
        color={passed ? UI_CONFIG.COLORS.success : UI_CONFIG.COLORS.disabled}
      />
      <Text style={[styles.livenessCheckLabel, passed && styles.livenessCheckPassed]}>
        {label}
      </Text>
    </View>
  );
}

function TimingRow({ label, ms, bold }: { label: string; ms: number; bold?: boolean }) {
  return (
    <View style={styles.timingRow}>
      <Text style={[styles.timingLabel, bold && styles.timingBold]}>{label}</Text>
      <Text style={[styles.timingValue, bold && styles.timingBold]}>{formatMs(ms)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
  },
  cameraSection: {
    height: '40%',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraPreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  faceGuide: {
    position: 'absolute',
    width: 200,
    height: 250,
    top: '50%',
    left: '50%',
    marginLeft: -100,
    marginTop: -125,
  },
  faceGuideCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  workersBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workersBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  resultsPanel: {
    flex: 1,
    padding: 16,
  },
  idlePanel: {
    flex: 1,
  },
  idleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginBottom: 6,
  },
  idleDesc: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.textSecondary,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.warning,
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  processingPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 12,
  },
  resultDetail: {
    flex: 1,
  },
  videoSummaryCard: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  videoSummaryText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 8,
  },
  matchCard: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchName: {
    fontSize: 17,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginLeft: 8,
  },
  matchMeta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  metaItem: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '500',
  },
  livenessCard: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  livenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  livenessTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    flex: 1,
  },
  livenessDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  livenessCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  livenessCheckLabel: {
    fontSize: 11,
    color: UI_CONFIG.COLORS.textSecondary,
  },
  livenessCheckPassed: {
    color: UI_CONFIG.COLORS.success,
    fontWeight: '600',
  },
  timingCard: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 14,
    elevation: 1,
  },
  timingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginBottom: 8,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  timingLabel: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.textSecondary,
  },
  timingValue: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.text,
    fontWeight: '500',
  },
  timingBold: {
    fontWeight: '700',
    color: UI_CONFIG.COLORS.primary,
  },
  timingDivider: {
    height: 1,
    backgroundColor: UI_CONFIG.COLORS.border,
    marginVertical: 4,
  },
  actionRow: {
    paddingTop: 12,
  },
  verifyButton: {
    backgroundColor: UI_CONFIG.COLORS.success,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: UI_CONFIG.COLORS.disabled,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  retryButton: {
    borderWidth: 1.5,
    borderColor: UI_CONFIG.COLORS.primary,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: UI_CONFIG.COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});
