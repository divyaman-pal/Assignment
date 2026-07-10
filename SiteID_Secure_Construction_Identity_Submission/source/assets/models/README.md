# ML Models — SiteID

## w600k_mbf.onnx — Face Recognition (MobileFaceNet)

- **Source**: insightface buffalo_sc model pack (MIT License)
- **Architecture**: MobileFaceNet backbone with ArcFace loss
- **Training data**: WebFace600K (600K identities, diverse global demographics)
- **Input**: [1, 3, 112, 112] float32, CHW format, normalized (pixel/127.5 - 1.0)
- **Output**: [1, 512] float32 L2-normalized face embedding
- **Size**: 13.0 MB
- **Runtime**: onnxruntime-react-native (NNAPI on Android, CoreML on iOS)

## det_500m.onnx — Face Detection (SCRFD)

- **Source**: insightface buffalo_sc model pack (MIT License)
- **Architecture**: SCRFD (Sample and Computation Redistribution for Face Detection)
- **Input**: [1, 3, H, W] float32 (dynamic spatial)
- **Output**: Face bounding boxes + landmarks + confidence
- **Size**: 2.5 MB
- **Note**: Used alongside ML Kit; provides higher-accuracy detection when needed

## Total Model Budget

| Model | Size | Purpose |
|-------|------|---------|
| w600k_mbf.onnx | 13.0 MB | Face embedding (recognition) |
| det_500m.onnx | 2.5 MB | Face detection (backup) |
| ML Kit Face (device-bundled) | 0 MB | Primary face detection + liveness signals |
| **Total** | **15.5 MB** | **Under 20 MB target** |
