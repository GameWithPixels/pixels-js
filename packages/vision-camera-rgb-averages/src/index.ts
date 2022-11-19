import type { Frame } from "react-native-vision-camera";

declare let _WORKLET: true | undefined;

export interface ImageRgbAveragesOptions {
  subSamplingX?: number;
  subSamplingY?: number;
  writeImage?: boolean;
  writePlanes?: boolean;
}

export interface ImageRgbAverages {
  timestamp: number;
  duration: number;
  width: number;
  height: number;
  redAverage: number;
  greenAverage: number;
  blueAverage: number;
}

// Frame Processor that computes the image red, green and blue average
// Throws an exception if invalid arguments are given
export function getImageRgbAverages(
  frame: Frame,
  opt?: ImageRgbAveragesOptions
): ImageRgbAverages {
  "worklet";
  if (!_WORKLET)
    throw new Error(
      "getImageRgbAverages() must be called from a frame processor!"
    );

  // @ts-expect-error because this function is dynamically injected by VisionCamera
  // eslint-disable-next-line no-undef
  const result = __getImageRgbAverages(
    frame,
    opt?.subSamplingX ?? 1,
    opt?.subSamplingY ?? 1,
    opt?.writeImage ?? false,
    opt?.writePlanes ?? false
  );

  return result as ImageRgbAverages;
}
