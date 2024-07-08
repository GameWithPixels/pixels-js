import { NativeModules, Platform } from "react-native";
import type { Frame } from "react-native-vision-camera";

const LINKING_ERROR =
  `The package '@systemic-games/vision-camera-rgb-averages' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo Go\n";

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const VisionCameraRgbAveragesModule = isTurboModuleEnabled
  ? require("./NativeVisionCameraRgbAverages").default
  : NativeModules.VisionCameraRgbAverages;

const VisionCameraRgbAverages = VisionCameraRgbAveragesModule
  ? VisionCameraRgbAveragesModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

let installed = false;
export async function installFrameProcessor(): Promise<void> {
  if (!installed) {
    installed = true;
    await VisionCameraRgbAverages.install();
    // @ts-ignore because this function is dynamically injected by VisionCamera
    frameProcessor = global.frameProcessor;
  }
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

export function getRgbAveragesFrameProcessor():
  | ((
      frame: Frame,
      opt?: {
        subSamplingX?: number;
        subSamplingY?: number;
      }
    ) => ImageRgbAverages)
  | undefined {
  // @ts-ignore This function is dynamically injected by VisionCamera
  return global.frameProcessor;
}
