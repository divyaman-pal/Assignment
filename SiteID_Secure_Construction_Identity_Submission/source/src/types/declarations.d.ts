declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle | ViewStyle;
  }

  export default class Icon extends Component<IconProps> {}
}

declare module 'react-native-quick-sqlite' {
  export function open(options: { name: string }): void;
  export function executeSql(
    dbName: string,
    sql: string,
    params?: any[],
  ): any;
}

declare module 'react-native-fast-tflite' {
  export function loadTensorflowModel(
    source: any,
    delegate?: string,
  ): Promise<{
    run: (inputs: Float32Array[]) => Promise<Float32Array[]>;
    close: () => void;
  }>;
}

declare module 'onnxruntime-react-native' {
  export class InferenceSession {
    static create(path: string, options?: any): Promise<InferenceSession>;
    run(feeds: Record<string, any>): Promise<Record<string, any>>;
    release(): void;
  }
  export class Tensor {
    constructor(type: string, data: Float32Array | number[], dims: number[]);
    data: Float32Array;
    dims: number[];
  }
}

declare module '@react-native-ml-kit/face-detection' {
  interface FaceDetectionOptions {
    performanceMode?: 'fast' | 'accurate';
    landmarkMode?: 'none' | 'all';
    classificationMode?: 'none' | 'all';
    contourMode?: 'none' | 'all';
    minFaceSize?: number;
    trackingEnabled?: boolean;
  }

  function detect(imageUri: string, options?: FaceDetectionOptions): Promise<any[]>;
  export default { detect };
}

declare module 'react-native-image-resizer' {
  export function createResizedImage(
    uri: string,
    width: number,
    height: number,
    format: string,
    quality: number,
    rotation?: number,
    outputPath?: string,
    keepMeta?: boolean,
    options?: any,
  ): Promise<{ uri: string; path: string; name: string; size: number }>;
}

declare module '*.tflite' {
  const content: any;
  export default content;
}

declare module '*.onnx' {
  const content: any;
  export default content;
}
