# SiteID Secure Construction Identity Submission

This folder is a cloned, SiteID-branded working prototype package for offline-first worker identity and wage protection on Indian construction sites.

Contents:

- `source/` - React Native source code, Android project files, iOS scaffold, app docs, scripts, and bundled model assets.
- `apk/SiteID-aws-sync-release.apk` - Android release APK for the working offline facial recognition and liveness prototype.
- `benchmarks/` - LFW benchmark report for the current `w600k_mbf.onnx` MobileFaceNet model used by this app.
- `presentation_and_docs/SiteID_Secure_Construction_Identity.pdf` - final SiteID presentation deck.
- `presentation_and_docs/SiteID_Verification_Video.mp4` - verification demo video for the final Android workflow.

Build notes:

- Target branch: `main`
- SiteID clone date: 2026-07-10
- APK SHA-256: `16DB822E1A9CD4B1C32984799E333AC79EB62B202CF88DF35789A6269163B63B`
- Main product flow: offline in-app video enrollment, worker face verification, basic liveness checks, local SQLite storage, sync queue, and AWS sync to API Gateway/Lambda/DynamoDB.
- SiteID use case: replace paper muster-roll dependency with on-device biometric verification for rural construction sites where connectivity is unreliable.
- AWS endpoint configured in source: `https://v8ihgcm30b.execute-api.ap-southeast-2.amazonaws.com/v1`
- DynamoDB validation table: `SiteIDSyncRecords`
- Benchmark summary: `97.28%` LFW pair verification accuracy; CPU embedding latency mean `16.84 ms`.

Notes:

- Android is the validated platform for this final APK.
- The React Native iOS scaffold is included, but iOS native camera/video validation requires macOS/Xcode work.
- The APK is tracked with Git LFS because it is larger than GitHub's normal 100 MB file limit.
