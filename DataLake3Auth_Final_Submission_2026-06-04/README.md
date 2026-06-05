# DataLake3Auth Final Android Submission Snapshot

This folder preserves the final Android-level DataLake3Auth hackathon app state with AWS sync integrated.

Contents:

- `source/` - React Native source code, Android project files, iOS scaffold, app docs, scripts, and bundled model assets.
- `apk/DataLake3Auth-aws-sync-release.apk` - final Android release APK built from the AWS-integrated source snapshot.
- `benchmarks/` - LFW benchmark report for the current `w600k_mbf.onnx` MobileFaceNet model used by this app.
- `presentation_and_docs/DataLake3Auth_Secure_Final_PPT.pdf` - final presentation deck exported as PDF.
- `presentation_and_docs/Final_Technical_Report.pdf` - final technical report.
- `presentation_and_docs/Final_Verification_Video.mp4` - verification demo video for the final Android workflow.

Build notes:

- Target branch: `main`
- Snapshot date: 2026-06-05
- APK SHA-256: `16DB822E1A9CD4B1C32984799E333AC79EB62B202CF88DF35789A6269163B63B`
- Main product flow: offline in-app video enrollment, offline face verification, basic liveness checks, local SQLite storage, sync queue, and AWS sync to API Gateway/Lambda/DynamoDB.
- AWS endpoint configured in source: `https://v8ihgcm30b.execute-api.ap-southeast-2.amazonaws.com/v1`
- DynamoDB validation table: `DataLake3AuthSyncRecords`
- Benchmark summary: `97.28%` LFW pair verification accuracy; CPU embedding latency mean `16.84 ms`.

Notes:

- Android is the validated platform for this final APK.
- The React Native iOS scaffold is included, but iOS native camera/video validation requires macOS/Xcode work.
- The APK is tracked with Git LFS because it is larger than GitHub's normal 100 MB file limit.
