import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { SiteIDCamera } = NativeModules;

export interface FaceVideoCapture {
  videoUri: string;
  frameUris: string[];
  durationMs: number;
}

async function requestCameraPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera Permission',
      message: 'SiteID needs camera access to capture face videos.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    },
  );

  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Camera permission was not granted.');
  }
}

export async function captureFaceVideo(
  durationMs = 3200,
  frameCount = 6,
): Promise<FaceVideoCapture> {
  if (Platform.OS !== 'android') {
    throw new Error('Video capture is currently implemented for Android.');
  }

  if (!SiteIDCamera?.captureVideo) {
    throw new Error('Native video capture module is not available.');
  }

  await requestCameraPermission();
  const result = await SiteIDCamera.captureVideo(durationMs, frameCount);

  if (!result?.videoUri || !Array.isArray(result.frameUris)) {
    throw new Error('Video capture did not return usable frames.');
  }

  return {
    videoUri: result.videoUri,
    frameUris: result.frameUris,
    durationMs: result.durationMs ?? durationMs,
  };
}

export async function preprocessFaceImage(
  imageUri: string,
  bounds: { x: number; y: number; width: number; height: number },
  targetSize: number,
): Promise<Float32Array> {
  if (!SiteIDCamera?.preprocessFace) {
    throw new Error('Native face preprocessing module is not available.');
  }

  const values: number[] = await SiteIDCamera.preprocessFace(
    imageUri,
    bounds,
    targetSize,
  );
  return Float32Array.from(values);
}
