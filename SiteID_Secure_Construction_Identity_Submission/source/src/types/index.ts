export interface Worker {
  id: string;
  workerId: string;
  name: string;
  department: string;
  role: string;
  enrolledAt: string;
  updatedAt: string;
  templateCount: number;
  isActive: boolean;
}

export interface FaceTemplate {
  id: string;
  workerId: string;
  embedding: Float32Array;
  embeddingBlob: ArrayBuffer;
  quality: number;
  capturedAt: string;
  metadata: string;
}

export interface AttendanceLog {
  id: string;
  workerId: string;
  workerName: string;
  timestamp: string;
  confidence: number;
  livenessScore: number;
  livenessMethod: string;
  matchMargin: number;
  verificationTimeMs: number;
  synced: boolean;
  syncedAt: string | null;
}

export interface SyncQueueItem {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  createdAt: string;
  synced: boolean;
  syncedAt: string | null;
  retryCount: number;
}

export interface FaceDetectionResult {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: FaceLandmark[];
  smilingProbability: number;
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  headEulerAngleX: number;
  headEulerAngleY: number;
  headEulerAngleZ: number;
  trackingId?: number;
}

export interface FaceLandmark {
  type: string;
  position: { x: number; y: number };
}

export interface EmbeddingResult {
  embedding: Float32Array;
  inferenceTimeMs: number;
}

export interface MatchResult {
  matched: boolean;
  workerId: string | null;
  workerName: string | null;
  confidence: number;
  margin: number;
  matchTimeMs: number;
  allScores: { workerId: string; workerName: string; score: number }[];
}

export interface LivenessResult {
  isLive: boolean;
  score: number;
  method: string;
  details: {
    blinkDetected: boolean;
    smileDetected: boolean;
    headMovement: boolean;
    textureScore: number;
  };
  checkTimeMs: number;
}

export interface VerificationResult {
  match: MatchResult;
  liveness: LivenessResult;
  totalTimeMs: number;
  timings: PerformanceTimings;
}

export interface PerformanceTimings {
  faceDetectionMs: number;
  embeddingMs: number;
  livenessMs: number;
  dbMatchMs: number;
  totalMs: number;
}

export interface ModelStatus {
  faceDetector: 'loading' | 'ready' | 'error' | 'not_loaded';
  embeddingModel: 'loading' | 'ready' | 'error' | 'not_loaded';
  livenessModel: 'loading' | 'ready' | 'error' | 'not_loaded';
  lastWarmup: string | null;
  warmupTimeMs: number | null;
}

export interface SyncStatus {
  pendingCount: number;
  lastSyncAt: string | null;
  isSyncing: boolean;
  lastError: string | null;
}

export interface DashboardStats {
  totalWorkers: number;
  totalTemplates: number;
  todayAttendance: number;
  weekAttendance: number;
  pendingSync: number;
  avgVerificationMs: number;
}

export interface EnrollmentSession {
  worker: Partial<Worker>;
  capturedFrames: CapturedFrame[];
  step: 'info' | 'capture' | 'processing' | 'review' | 'complete';
}

export interface CapturedFrame {
  uri: string;
  embedding: Float32Array | null;
  quality: number;
  timestamp: string;
}

export type NavigationParamList = {
  Home: undefined;
  Enrollment: undefined;
  Attendance: undefined;
  Dashboard: undefined;
  WorkerDetail: { workerId: string };
  Settings: undefined;
};
