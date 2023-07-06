import { Platform } from "react-native";
import type { Frame } from "react-native-vision-camera";

declare let _WORKLET: true | undefined;

/**
 * Optional parameters for {@link getImageRgbAverages}.
 */
export interface ImageRgbAveragesOptions {
  /**
   * Maximum number of pixels to process, it that's more than
   * contained in the image then sub-sampling is applied.
   */
  maxPixelsToProcess?: number;
  /** Disable using vector processor on iOS to convert image to RGB. iOS only. */
  noHardwareAcceleration?: boolean;
  /**
   * Output image to file. Android only.
   * Images are usually stored in
   * `Android\data\{applicationId}\files\Pictures`.
   */
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
  /** Average amount of red in the frame. */
  redAverage: number;
  /** Average amount of green in the frame. */
  greenAverage: number;
  /** Average amount of blue in the frame. */
  blueAverage: number;
  /** Sub-sampling factor applied on frame width. */
  widthSubSampling: number;
  /** Sub-sampling factor applied on frame height. */
  heightSubSampling: number;
  /** Width of processed frame. */
  imageWidth: number;
  /** Height of processed frame. */
  imageHeight: number;
}

/**
 * Frame Processor that the image red, green and blue average for the
 * entire given frame.
 * @param frame The frame to use.
 * @param opt Optional parameters, see {@link ImageRgbAveragesOptions}.
 * @returns An object with red, green and blue averages,
 *          see {@link ImageRgbAveragesOptions},
 *          or a string with an error message.
 * @throws Throws an exception when not called inside a worklet.
 */
export function getImageRgbAverages(
  frame: Frame,
  opt?: ImageRgbAveragesOptions
): ImageRgbAverages | string {
  "worklet";
  if (!_WORKLET)
    throw new Error("getImageRgbAverages() must be called from a worklet");

  const result =
    Platform.OS === "android"
      ? // @ts-expect-error because this function is dynamically injected by VisionCamera
        __getImageRgbAverages(
          frame,
          opt?.maxPixelsToProcess ?? 0,
          opt?.writeImage ?? false,
          opt?.writePlanes ?? false
        )
      : // @ts-expect-error because this function is dynamically injected by VisionCamera
        __getImageRgbAverages(
          frame,
          opt?.maxPixelsToProcess ?? 0,
          !(opt?.noHardwareAcceleration ?? false)
        );

  return result as ImageRgbAverages | string;
}
