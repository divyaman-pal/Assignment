# SiteID

**AI-powered offline worker identity and wage protection for Indian construction sites.**

SiteID is an edge-AI mobile prototype that verifies construction workers without requiring live internet. It uses on-device face recognition, video-based liveness checks, local attendance storage, and delayed AWS sync so remote job sites can capture trusted worker identity records even in zero-network conditions.

## AI Problem Being Solved

Construction attendance is still often handled through paper muster rolls or manual supervisor entries. That creates two fraud risks: ghost workers can inflate contractor costs, and real workers can lose wages when their attendance is under-recorded. SiteID uses mobile AI to make each attendance event biometric, local, fast, and auditable.

## AI Pipeline

```text
In-app video capture
  -> face detection
  -> face crop and preprocessing
  -> MobileFaceNet ONNX embedding
  -> cosine-similarity identity matching
  -> liveness signal fusion
  -> local attendance decision
  -> offline queue and cloud sync
```

## AI Highlights

- **Offline edge inference:** Face recognition runs on the phone, not on a cloud API.
- **Lightweight model package:** Detector + recognition model assets are about `16.14 MB`.
- **Fast recognition:** Mean CPU embedding latency is `16.84 ms`, supporting sub-1-second verification.
- **Face-recognition benchmark:** `97.28%` LFW pair verification accuracy.
- **Multi-frame video enrollment:** The app stores multiple face templates from a short worker video.
- **Basic anti-spoofing:** Liveness uses blink, smile, head movement, and frame-quality signals.
- **Privacy-aware design:** Biometric embeddings remain on-device; sync sends operational records, not raw face videos.

## Working Prototype Features

- Worker enrollment through in-app video.
- Worker verification through in-app video.
- Offline identity matching with MobileFaceNet embeddings.
- Local SQLite storage for workers, templates, and attendance logs.
- Sync queue for offline-to-online operation.
- AWS API Gateway, Lambda, CloudWatch, and DynamoDB validation path.
- Android APK, source code, benchmark data, presentation deck, and demo video included.

## What Is Included

- `source/` - React Native app source with Android project files, iOS scaffold, ML services, sync logic, and bundled model assets.
- `apk/SiteID-aws-sync-release.apk` - Android APK for the working prototype.
- `presentation_and_docs/SiteID_Secure_Construction_Identity.pdf` - SiteID presentation deck.
- `presentation_and_docs/SiteID_Verification_Video.mp4` - Android verification demo video.
- `benchmarks/` - benchmark reports for the MobileFaceNet model used by SiteID.

## Validation Summary

| Area | Result |
| --- | --- |
| Android prototype | Validated |
| Face verification accuracy | `97.28%` on LFW pair verification |
| Mean embedding latency | `16.84 ms` CPU |
| Model asset footprint | ~`16.14 MB` detector + recognizer |
| Offline operation | Enrollment, verification, storage, and queue work locally |
| Cloud sync proof | CloudWatch logs and DynamoDB records validated |

## Build Notes

- Android is the validated platform for the included APK.
- The iOS scaffold is included in the React Native project, but iOS camera/liveness validation requires macOS, Xcode, and an iPhone.
- AWS endpoint configured in source: `https://v8ihgcm30b.execute-api.ap-southeast-2.amazonaws.com/v1`
- DynamoDB validation table: `SiteIDSyncRecords`
- APK SHA-256: `16DB822E1A9CD4B1C32984799E333AC79EB62B202CF88DF35789A6269163B63B`
