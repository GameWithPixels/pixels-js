import { getImageRgbAverages } from "@systemic-games/vision-camera-rgb-averages";
import { useErrorHandler } from "react-error-boundary";
import { runOnJS } from "react-native-reanimated";
import { Frame, useFrameProcessor } from "react-native-vision-camera";

import usePixelIdDecoder from "./usePixelIdDecoder";

export type FrameProcessor = (frame: Frame) => void;

export default function (): [FrameProcessor, number] {
  const errorHandler = useErrorHandler();

  // PixelId decoder
  const [decoderState, decoderDispatch] = usePixelIdDecoder();

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      try {
        const result = getImageRgbAverages(frame, {
          subSamplingX: 4,
          subSamplingY: 2,
          // writeImage: false,
          // writePlanes: false,
        });
        runOnJS(decoderDispatch)({ rgbAverages: result });
      } catch (error) {
        errorHandler(
          new Error(
            `Exception in frame processor "getImageRgbAverages": ${error}`
          )
        );
      }
    },
    [decoderDispatch, errorHandler]
  );

  return [frameProcessor, decoderState.pixelId];
}
