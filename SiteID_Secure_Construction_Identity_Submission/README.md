# SiteID

**Offline-first worker identity and wage protection for Indian construction sites.**

SiteID is a React Native working prototype for verifying construction workers in remote or rural job sites where internet access is unreliable. The app uses on-device face recognition, basic liveness checks, local storage, and delayed cloud sync so attendance records can be captured even when the site is offline.

## Why SiteID

Paper muster rolls and manual attendance records can create two problems at once: ghost workers can increase contractor costs, and real workers can lose wages when their attendance is not recorded correctly. SiteID replaces that weak paper checkpoint with video-based worker enrollment, face verification, and auditable sync records.

## What Is Included

- `source/` - React Native source code with Android project files, iOS scaffold, app documentation, scripts, and bundled model assets.
- `apk/SiteID-aws-sync-release.apk` - Android APK for the working prototype.
- `presentation_and_docs/SiteID_Secure_Construction_Identity.pdf` - SiteID presentation deck.
- `presentation_and_docs/SiteID_Verification_Video.mp4` - Android verification demo video.
- `benchmarks/` - benchmark files for the MobileFaceNet model used by the app.

## Core Workflow

1. Enroll a worker using a short in-app camera video.
2. Extract face frames and generate local face embeddings.
3. Verify the worker later with another in-app video.
4. Run basic liveness checks such as blink, smile, or head movement signals.
5. Save attendance and verification logs locally in SQLite.
6. Sync queued records to AWS when network connectivity returns.

## Tech Stack

- React Native mobile app
- Android native camera bridge
- MobileFaceNet ONNX face-recognition model
- Face detection and liveness signal extraction
- SQLite local database
- Offline sync queue
- AWS API Gateway, Lambda, CloudWatch, and DynamoDB validation path

## Validation Summary

- Android prototype validated.
- Face-recognition benchmark: `97.28%` LFW pair verification accuracy.
- Mean CPU embedding latency: `16.84 ms`.
- Combined detector and recognition model assets: about `16.14 MB`.
- AWS sync validated through CloudWatch logs and DynamoDB records.

## Build Notes

- Android is the validated platform for the included APK.
- The iOS scaffold is included in the React Native project, but iOS camera/liveness validation requires macOS, Xcode, and an iPhone.
- AWS endpoint configured in source: `https://v8ihgcm30b.execute-api.ap-southeast-2.amazonaws.com/v1`
- DynamoDB validation table: `SiteIDSyncRecords`
- APK SHA-256: `16DB822E1A9CD4B1C32984799E333AC79EB62B202CF88DF35789A6269163B63B`
