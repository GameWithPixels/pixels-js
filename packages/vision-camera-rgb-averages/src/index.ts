import { Platform } from "react-native";
import type { Frame } from "react-native-vision-camera";

declare let _WORKLET: true | undefined;

/**
 * Optional parameters for {@link getImageRgbAverages}.
 */
export interface ImageRgbAveragesOptions {
  /** Sub-sampling along the long dimension for computing average. */
  subSamplingX?: number;
  /** Sub-sampling along the short dimension for computing average. */
  subSamplingY?: number;
  /** Use vector processor to convert image to RGB. */
  useVectorProc?: boolean; // iOS only
  /** Output image to file. Android only. */
  writeImage?: boolean;
  /** Output YUV planes to files. Android only. */
  writePlanes?: boolean;
}

/**
 * Type of return value of {@link getImageRgbAverages}.
 */
export interface ImageRgbAverages {
  /** Timestamp of when the frame processor started to work on the frame. */
  timestamp: number;
  /** Time im ms it took the frame processor to process the frame. */
  duration: number;
  /** Width of processed frame. */
  width: number;
  /** Height of processed frame. */
  height: number;
  /** Average amount of red in the frame. */
  redAverage: number;
  /** Average amount of green in the frame. */
  greenAverage: number;
  /** Average amount of blue in the frame. */
  blueAverage: number;
}

/**
 * Frame Processor that the image red, green and blue average for the
 * entire given frame.
 * @param frame The frame to use.
 * @param opt Optional parameters, see {@link ImageRgbAveragesOptions}.
 * @returns An object with red, green and blue averages,
 *          see {@link ImageRgbAveragesOptions}.
 * @throws Throws an exception when given invalid parameters.
 */
export function getImageRgbAverages(
  frame: Frame,
  opt?: ImageRgbAveragesOptions
): ImageRgbAverages {
  "worklet";
  if (!_WORKLET)
    throw new Error(
      "getImageRgbAverages() must be called from a frame processor!"
    );

  const result =
    Platform.OS === "android"
      ? // @ts-expect-error because this function is dynamically injected by VisionCamera
        __getImageRgbAverages(
          frame,
          opt?.subSamplingX ?? 1,
          opt?.subSamplingY ?? 1,
          opt?.writeImage ?? false,
          opt?.writePlanes ?? false
        )
      : // @ts-expect-error because this function is dynamically injected by VisionCamera
        __getImageRgbAverages(
          frame,
          opt?.subSamplingX ?? 1,
          opt?.subSamplingY ?? 1,
          opt?.useVectorProc ?? false
        );

  if (typeof result === "string") {
    throw new Error(result);
  } else {
    return result as ImageRgbAverages;
  }
}
