export const ML_CONFIG = {
  EMBEDDING_SIZE: 512,
  FACE_INPUT_SIZE: 112,

  SIMILARITY_THRESHOLD: 0.4,
  MATCH_MARGIN_THRESHOLD: 0.06,
  MAX_TEMPLATES_PER_WORKER: 5,
  MIN_ENROLLMENT_SAMPLES: 3,

  LIVENESS_BLINK_THRESHOLD: 0.3,
  LIVENESS_SMILE_THRESHOLD: 0.6,
  LIVENESS_HEAD_ROTATION_THRESHOLD: 10,
  LIVENESS_MIN_SCORE: 0.5,

  MODEL_FILES: {
    FACE_RECOGNITION: 'w600k_mbf.onnx',
    FACE_DETECTION: 'det_500m.onnx',
  },

  MODEL_SIZE_BYTES: {
    FACE_RECOGNITION: 13_000_000,
    FACE_DETECTION: 2_500_000,
    TOTAL: 15_500_000,
  },
} as const;

export const DB_CONFIG = {
  DATABASE_NAME: 'siteid.db',
  DATABASE_VERSION: 1,
} as const;

export const SYNC_CONFIG = {
  SYNC_INTERVAL_MS: 60_000,
  MAX_RETRY_COUNT: 5,
  BATCH_SIZE: 50,
  BASE_URL: 'https://v8ihgcm30b.execute-api.ap-southeast-2.amazonaws.com/v1',
} as const;

export const CAMERA_CONFIG = {
  PHOTO_QUALITY: 0.8,
  FRAME_RATE: 15,
  RESOLUTION: '720p' as const,
  VIDEO_DURATION_MS: 3200,
  VIDEO_FRAME_COUNT: 6,
} as const;

export const UI_CONFIG = {
  COLORS: {
    primary: '#1A73E8',
    primaryDark: '#0D47A1',
    primaryLight: '#BBDEFB',
    secondary: '#00C853',
    accent: '#FF6D00',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    error: '#D32F2F',
    warning: '#FFA000',
    success: '#388E3C',
    text: '#212121',
    textSecondary: '#757575',
    textOnPrimary: '#FFFFFF',
    border: '#E0E0E0',
    disabled: '#BDBDBD',
    overlay: 'rgba(0,0,0,0.5)',
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
} as const;
