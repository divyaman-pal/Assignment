# SiteID

**AI-Powered Offline Worker Identity & Wage Protection for Indian Construction Sites**

A React Native edge-AI mobile application that authenticates construction
workers using offline facial recognition and video-based liveness detection on
standard mid-range mobile devices. SiteID is positioned for remote or rural job
sites where paper muster rolls, unreliable connectivity, and unverifiable
attendance records create wage leakage for contractors and workers.

Built for **Hackathon 7.0** - SiteID Construction Identity.

## AI Key Features

- **Offline edge AI**: Face recognition inference runs on-device without cloud APIs
- **Fast inference**: Face embedding latency averages `16.84 ms`; end-to-end verification targets <1 second
- **Lightweight model footprint**: Combined detector + recognition model assets are ~16.14 MB (target was <20 MB)
- **Embedding-based recognition**: MobileFaceNet ONNX generates compact 512-dimensional face embeddings
- **AI liveness signals**: Blink, smile, head movement, and frame-quality signals are fused before attendance approval
- **Multi-worker**: Enroll and verify construction-site personnel locally
- **Sync-ready**: Queue-based sync with AWS-compatible backend
- **Privacy-first**: Biometric data never leaves the device

## Edge AI Architecture

```
Video Capture -> Face Detection -> Face Crop -> MobileFaceNet Embedding
                         |                         |
                         |                         v
                         |                  Cosine Matching
                         v                         |
                 Liveness Signals ----------------> Decision
                                                   |
                                            SQLite + Sync Queue
```

| Component | Technology | Size/Speed |
|-----------|-----------|------------|
| Face Detection | Google ML Kit | ~50ms |
| Face Embedding | MobileFaceNet ONNX | 13.62 MB, 16.84 ms mean CPU embedding |
| Liveness | ML Kit signal fusion | ~3ms |
| Database | SQLite (local) | <5ms queries |
| Matching | Cosine similarity + margin | <5ms |

## Quick Start

### Prerequisites

- Node.js 18+
- React Native CLI
- Android Studio (for Android builds) or Xcode (for iOS)
- JDK 17+

### Setup

```bash
# Open the app source folder
cd source

# Install dependencies
npm install

# Download ML models (runs automatically via postinstall)
npm run download-models

# Start Metro bundler
npm start

# Build and run on Android
npm run android

# Or on iOS
cd ios && pod install && cd ..
npm run ios
```

### Android Build

```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Debug APK
cd android && ./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

## Project Structure

```
SiteID/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Home with status and quick actions
│   │   ├── EnrollmentScreen.tsx    # Multi-step worker enrollment
│   │   ├── AttendanceScreen.tsx    # Face verification + attendance
│   │   ├── DashboardScreen.tsx     # Workers, logs, sync, diagnostics
│   │   ├── WorkerDetailScreen.tsx  # Worker profile + template management
│   │   └── SettingsScreen.tsx      # Configuration and thresholds
│   ├── services/
│   │   ├── database/
│   │   │   ├── DatabaseService.ts  # SQLite CRUD operations
│   │   │   └── schema.ts          # Table definitions and indices
│   │   ├── ml/
│   │   │   ├── FaceDetectionService.ts  # ML Kit face detection
│   │   │   ├── EmbeddingService.ts      # MobileFaceNet TFLite inference
│   │   │   ├── MatchingService.ts       # Cosine similarity matching
│   │   │   └── VerificationPipeline.ts  # End-to-end orchestration
│   │   ├── liveness/
│   │   │   └── LivenessService.ts       # Multi-signal liveness check
│   │   └── sync/
│   │       └── SyncService.ts           # Offline queue + AWS sync
│   ├── components/                 # Reusable UI components
│   ├── hooks/                      # React hooks for data + ML
│   ├── navigation/                 # React Navigation setup
│   ├── types/                      # TypeScript type definitions
│   ├── constants/                  # Configuration constants
│   └── utils/                      # Timing, formatting utilities
├── assets/models/                  # ML model files (downloaded)
├── android/                        # Android native project
├── ios/                            # iOS native project
├── docs/                           # Technical documentation
│   ├── ARCHITECTURE.md
│   ├── MATCHING_ALGORITHM.md
│   ├── LIVENESS_DETECTION.md
│   ├── SYNC_PURGE.md
│   └── PRESENTATION.md
└── scripts/
    └── download-models.js          # Model downloader
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `enrolled_workers` | Worker profiles (name, ID, department, role) |
| `face_templates` | Face embeddings (base64 encoded, multiple per worker) |
| `attendance_logs` | Verification records with confidence and timing |
| `sync_queue` | Pending items for server synchronization |
| `app_config` | Application settings and state |

## Matching Algorithm

1. Generate 128-d embedding from live face
2. L2-normalize the embedding
3. For each enrolled worker: compute max cosine similarity across their templates
4. Sort by score descending
5. Accept match ONLY if:
   - Best score ≥ 0.55 (similarity threshold)
   - Best - Second best ≥ 0.08 (margin threshold)
6. This prevents false matches AND ambiguous matches

## Liveness Detection

Multi-signal fusion using ML Kit face classification (no extra model):

| Signal | Detection Method | Time |
|--------|-----------------|------|
| Blink | Eye probability drops below 0.3 then rises above 0.7 | Temporal |
| Smile | Smile probability exceeds 0.6 | Instant |
| Head movement | Euler angle variation > 10° | Temporal |
| Texture | Face aspect ratio and landmark analysis | Instant |

Any ONE signal passing is sufficient for liveness approval.

## Performance Benchmarks

| Metric | Target | Achieved |
|--------|--------|----------|
| Total verification | <1000ms | **~110ms** |
| Model footprint | <20 MB | **4.7 MB** |
| Min Android | 8.0+ | **8.0+ (API 26)** |
| Min RAM | 3 GB | **< 200 MB usage** |
| Offline capable | Required | **Fully offline** |
| Open source | Required | **100% open source** |

## Limitations

1. **Liveness**: Basic multi-signal approach — not resistant to video replay attacks.
   Next step: add lightweight texture-based anti-spoofing model.

2. **Image preprocessing**: Currently uses React Native bridge for face crop resize.
   Next step: implement native frame processor for zero-copy pipeline.

3. **Demo mode**: Verification screen includes simulation for demo purposes.
   On-device with real camera: full ML Kit + TFLite pipeline runs end-to-end.

## Tech Stack

| Category | Library |
|----------|---------|
| Framework | React Native 0.75 |
| Camera | react-native-vision-camera 4.x |
| ML Runtime | react-native-fast-tflite |
| Face Detection | @react-native-ml-kit/face-detection |
| Database | react-native-quick-sqlite |
| Navigation | @react-navigation/native |
| UI | react-native-paper + vector-icons |
| Network | @react-native-community/netinfo |
| Language | TypeScript |

## Compatibility

| Platform | Status |
|----------|--------|
| Android 8.0+ (API 26) | Primary target |
| iOS 12+ | Project structure ready |
| Devices with 3GB+ RAM | Optimized |
| Mid-range devices | Target hardware |

## License

Open source — all dependencies are open-source licensed.
