# SiteID Face Recognition Benchmark Summary

## Model Tested

- App model: `siteid/assets/models/w600k_mbf.onnx`
- Model family: MobileFaceNet / ArcFace-style face embedding model
- Input: `[1, 3, 112, 112]`, RGB, CHW, normalized to `[-1, 1]`
- Output: 512-dimensional face embedding
- SHA-256: `9CC6E4A75F0E2BF0B1AED94578F144D15175F357BDC05E815E5C4A02B319EB4F`
- Face recognition model size: `13.62 MB`
- Face detection model size: `2.52 MB`
- Combined model assets: `16.14 MB`

## Dataset

- Dataset: Labeled Faces in the Wild (LFW) funneled
- Dataset size used: 13,233 images, 5,749 people
- Official verification protocol: 6,000 same/different face pairs, 10-fold threshold selection
- Note: LFW is a public still-image face benchmark. It is not an Indian field-worker, mobile-camera, outdoor-lighting, or liveness/spoof dataset.

## Results

### Official LFW Pair Verification

- Pairs evaluated: `6,000`
- Accuracy: `97.2833%`
- True accept rate: `96.10%`
- False reject rate: `3.90%`
- True reject rate: `98.4667%`
- False accept rate: `1.5333%`
- Fold accuracy mean: `97.2833%`
- Fold accuracy standard deviation: `0.6058%`

### Attendance-Like Identification Protocol

This protocol is closer to the app flow: enroll each identity with template images, then identify later probe images against enrolled templates.

| Enrollment templates/person | Identities | Probe images | Top-1 accuracy | Correct accepted | Wrong accepted |
|---:|---:|---:|---:|---:|---:|
| 1 | 1,680 | 7,484 | 86.3843% | 75.2405% | 1.2560% |
| 3 | 610 | 4,903 | 95.4926% | 89.4554% | 0.5507% |
| 5 | 311 | 3,870 | 97.2093% | 93.4884% | 0.5426% |

The app stores up to 5 templates per enrolled worker, so the 3-template and 5-template rows are the most relevant.

## Latency

CPU-only single-image embedding latency on the benchmark machine:

- Mean: `16.836 ms`
- p50: `15.358 ms`
- p95: `25.024 ms`
- Max: `52.593 ms`

This measures only the ONNX face embedding model. Full app verification also includes camera capture, ML Kit face detection, liveness scoring, and SQLite matching.

## Report-Ready Statement

The current SiteID face-recognition model (`w600k_mbf.onnx`) was benchmarked on the public Labeled Faces in the Wild (LFW) funneled dataset. Under the official 6,000-pair LFW verification protocol, the model achieved `97.28%` verification accuracy, with `96.10%` true accept rate and `1.53%` false accept rate. In an attendance-like identification protocol using multiple enrollment templates, top-1 identification accuracy reached `95.49%` with 3 templates/person and `97.21%` with 5 templates/person. CPU-only single-image embedding latency averaged `16.84 ms`, supporting the app's sub-1-second offline verification target.

## Caveat

These results validate the face-recognition embedding model on a public still-image benchmark. They do not by themselves validate liveness/spoof resistance, camera capture reliability, Indian outdoor lighting performance, or field deployment robustness. Those should be reported separately as device-demo and field-test results.
