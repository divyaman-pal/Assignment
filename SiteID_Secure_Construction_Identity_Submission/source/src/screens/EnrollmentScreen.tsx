import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from '../components/SafeIcon';
import { UI_CONFIG, CAMERA_CONFIG } from '../constants';
import DatabaseService from '../services/database/DatabaseService';
import VerificationPipeline from '../services/ml/VerificationPipeline';
import MatchingService from '../services/ml/MatchingService';
import {
  captureFaceVideo,
  type FaceVideoCapture,
} from '../services/camera/CameraCaptureService';
import type { CapturedFrame } from '../types';

type Step = 'info' | 'capture' | 'processing' | 'review' | 'complete';

export default function EnrollmentScreen() {
  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [capturedVideo, setCapturedVideo] = useState<FaceVideoCapture | null>(null);
  const [processing, setProcessing] = useState(false);
  const [enrolledWorkerName, setEnrolledWorkerName] = useState('');
  const [savedTemplateCount, setSavedTemplateCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateInfo = useCallback(() => {
    if (!name.trim()) return 'Worker name is required';
    if (!workerId.trim()) return 'Worker ID is required';
    if (!department.trim()) return 'Department is required';
    if (!role.trim()) return 'Role is required';
    return null;
  }, [name, workerId, department, role]);

  const handleNextToCapture = useCallback(() => {
    const validationError = validateInfo();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }
    setStep('capture');
  }, [validateInfo]);

  const handleProcessAndEnroll = useCallback(async (
    video: FaceVideoCapture,
    frames: CapturedFrame[],
  ) => {
    setProcessing(true);
    setError(null);

    try {
      await VerificationPipeline.initialize();
      const processedTemplates =
        await VerificationPipeline.generateEnrollmentEmbeddingsFromVideo(
          video.frameUris,
        );

      if (processedTemplates.length === 0) {
        throw new Error('No usable face samples found. Record a clear face video and try again.');
      }

      const worker = await DatabaseService.enrollWorker(
        name.trim(),
        workerId.trim(),
        department.trim(),
        role.trim(),
      );

      let savedTemplates = 0;
      for (let i = 0; i < processedTemplates.length; i++) {
        const item = processedTemplates[i];
        await DatabaseService.saveFaceTemplate(
          worker.id,
          item.embedding,
          item.quality,
          {
            source: 'video_capture',
            timestamp: frames[i]?.timestamp ?? new Date().toISOString(),
            videoUri: video.videoUri,
            frameUri: item.frameUri,
            sampleIndex: i,
          },
        );
        savedTemplates++;
      }

      MatchingService.invalidateCache();
      setEnrolledWorkerName(name.trim());
      setSavedTemplateCount(savedTemplates);
      setStep('complete');

      console.log(
        `[Enroll] Worker "${name}" enrolled from video with ${savedTemplates} templates`,
      );
    } catch (err: any) {
      console.error('[Enroll] Enrollment failed:', err);
      if (err.message?.includes('UNIQUE')) {
        setError('A worker with this ID already exists.');
      } else {
        setError(`Enrollment failed: ${err.message}`);
      }
    } finally {
      setProcessing(false);
    }
  }, [name, workerId, department, role]);

  const handleCaptureVideo = useCallback(async () => {
    try {
      setError(null);
      const video = await captureFaceVideo(
        CAMERA_CONFIG.VIDEO_DURATION_MS,
        CAMERA_CONFIG.VIDEO_FRAME_COUNT,
      );
      const frames: CapturedFrame[] = video.frameUris.map(uri => ({
        uri,
        embedding: null,
        quality: 0,
        timestamp: new Date().toISOString(),
      }));

      setCapturedVideo(video);
      setCapturedFrames(frames);
      setStep('processing');
      await handleProcessAndEnroll(video, frames);
    } catch (err) {
      console.error('[Enroll] Video capture/enrollment failed:', err);
      setStep('capture');
      setError(err instanceof Error ? err.message : 'Failed to enroll from video');
    }
  }, [handleProcessAndEnroll]);

  const handleReset = useCallback(() => {
    setStep('info');
    setName('');
    setWorkerId('');
    setDepartment('');
    setRole('');
    setCapturedFrames([]);
    setCapturedVideo(null);
    setError(null);
    setEnrolledWorkerName('');
    setSavedTemplateCount(0);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress Steps */}
      <View style={styles.progressBar}>
        {(['info', 'capture', 'processing', 'complete'] as const).map((s, i) => (
          <View key={s} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                step === s && styles.progressDotActive,
                ['capture', 'processing', 'complete'].indexOf(step) >= i &&
                  styles.progressDotDone,
              ]}
            >
              <Text style={styles.progressNumber}>{i + 1}</Text>
            </View>
            <Text style={styles.progressLabel}>
              {['Details', 'Capture', 'Process', 'Done'][i]}
            </Text>
          </View>
        ))}
      </View>

      {/* Step 1: Worker Info */}
      {step === 'info' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Worker Information</Text>
          <Text style={styles.stepDesc}>
            Enter the field personnel details for enrollment.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Rajesh Kumar"
              placeholderTextColor={UI_CONFIG.COLORS.disabled}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Worker ID *</Text>
            <TextInput
              style={styles.input}
              value={workerId}
              onChangeText={setWorkerId}
              placeholder="e.g., EMP-2024-001"
              placeholderTextColor={UI_CONFIG.COLORS.disabled}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Department *</Text>
            <TextInput
              style={styles.input}
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g., Field Operations"
              placeholderTextColor={UI_CONFIG.COLORS.disabled}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role *</Text>
            <TextInput
              style={styles.input}
              value={role}
              onChangeText={setRole}
              placeholder="e.g., Field Engineer"
              placeholderTextColor={UI_CONFIG.COLORS.disabled}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleNextToCapture}>
            <Text style={styles.primaryButtonText}>Next: Capture Face</Text>
            <Icon name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Face Capture */}
      {step === 'capture' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Face Video Enrollment</Text>
          <Text style={styles.stepDesc}>
            Record one short in-app video. Blink or turn your head slightly so
            liveness signals and face templates can be extracted from the clip.
          </Text>

          <View style={styles.cameraPlaceholder}>
            {capturedFrames.length > 0 ? (
              <Image
                source={{ uri: capturedFrames[capturedFrames.length - 1].uri }}
                style={styles.capturedPreview}
                resizeMode="cover"
              />
            ) : (
              <>
                <Icon name="camera" size={64} color={UI_CONFIG.COLORS.disabled} />
                <Text style={styles.cameraPlaceholderText}>
                  In-App Video Camera
                </Text>
                <Text style={styles.cameraHint}>
                  Camera opens inside SiteID
                </Text>
              </>
            )}
          </View>

          <View style={styles.captureInfo}>
            <Text style={styles.captureCount}>
              {capturedFrames.length > 0
                ? `${capturedFrames.length} frames extracted from video`
                : `${CAMERA_CONFIG.VIDEO_DURATION_MS / 1000}s face video required`}
            </Text>
            {capturedVideo && (
              <Text style={styles.cameraHint}>
                Video captured. Processing will store the best face templates.
              </Text>
            )}
          </View>

          <View style={styles.captureActions}>
            <TouchableOpacity style={styles.captureButton} onPress={handleCaptureVideo}>
              <Icon name="camera-iris" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleCaptureVideo}>
            <Text style={styles.primaryButtonText}>Record & Enroll Video</Text>
            <Icon name="check-circle" size={18} color="#FFF" />
          </TouchableOpacity>

          {error && (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={20} color={UI_CONFIG.COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.textButton}
            onPress={() => setStep('info')}>
            <Icon name="arrow-left" size={16} color={UI_CONFIG.COLORS.textSecondary} />
            <Text style={styles.textButtonText}>Back to Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Processing */}
      {step === 'processing' && (
        <View style={[styles.stepContainer, styles.centered]}>
          {!error && (
            <>
              <ActivityIndicator size="large" color={UI_CONFIG.COLORS.primary} />
              <Text style={styles.processingText}>Processing enrollment...</Text>
              <Text style={styles.processingDetail}>
                Extracting video frames, generating embeddings, and saving locally
              </Text>
            </>
          )}
          {error && (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={20} color={UI_CONFIG.COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleReset}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <View style={[styles.stepContainer, styles.centered]}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={64} color={UI_CONFIG.COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Enrollment Complete!</Text>
          <Text style={styles.successDetail}>
            {enrolledWorkerName} has been successfully enrolled with{' '}
            {savedTemplateCount} face templates from one video.
          </Text>

          <View style={styles.enrollmentSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Name</Text>
              <Text style={styles.summaryValue}>{name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Worker ID</Text>
              <Text style={styles.summaryValue}>{workerId}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Department</Text>
              <Text style={styles.summaryValue}>{department}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Role</Text>
              <Text style={styles.summaryValue}>{role}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Templates</Text>
              <Text style={styles.summaryValue}>
                {savedTemplateCount} stored locally
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Video Frames</Text>
              <Text style={styles.summaryValue}>
                {capturedFrames.length} analyzed
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleReset}>
            <Icon name="account-plus" size={18} color="#FFF" />
            <Text style={styles.primaryButtonText}>Enroll Another Worker</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.background,
  },
  content: {
    paddingBottom: 32,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: UI_CONFIG.COLORS.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: UI_CONFIG.COLORS.primary,
    transform: [{ scale: 1.1 }],
  },
  progressDotDone: {
    backgroundColor: UI_CONFIG.COLORS.primary,
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  progressLabel: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  stepContainer: {
    padding: 20,
  },
  centered: {
    alignItems: 'center',
    paddingTop: 40,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.text,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderWidth: 1.5,
    borderColor: UI_CONFIG.COLORS.border,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: UI_CONFIG.COLORS.text,
  },
  primaryButton: {
    backgroundColor: UI_CONFIG.COLORS.primary,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 6,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: UI_CONFIG.COLORS.primary,
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: UI_CONFIG.COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  textButtonText: {
    color: UI_CONFIG.COLORS.textSecondary,
    fontSize: 13,
    marginLeft: 4,
  },
  cameraPlaceholder: {
    height: 300,
    backgroundColor: '#1A1A1A',
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraPlaceholderText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  cameraHint: {
    color: '#555',
    fontSize: 11,
    marginTop: 4,
  },
  capturedPreview: {
    width: '100%',
    height: '100%',
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
  },
  captureInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  captureCount: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.text,
  },
  captureDotsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  captureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: UI_CONFIG.COLORS.border,
  },
  captureDotFilled: {
    backgroundColor: UI_CONFIG.COLORS.success,
  },
  captureActions: {
    alignItems: 'center',
    marginVertical: 12,
  },
  captureButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: UI_CONFIG.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.text,
    marginTop: 16,
  },
  processingDetail: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.textSecondary,
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: UI_CONFIG.BORDER_RADIUS.md,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    color: UI_CONFIG.COLORS.error,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  retryText: {
    color: UI_CONFIG.COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: UI_CONFIG.COLORS.success,
    marginBottom: 8,
  },
  successDetail: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  enrollmentSummary: {
    backgroundColor: UI_CONFIG.COLORS.surface,
    borderRadius: UI_CONFIG.BORDER_RADIUS.lg,
    padding: 16,
    width: '100%',
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: UI_CONFIG.COLORS.border,
  },
  summaryLabel: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: UI_CONFIG.COLORS.text,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
