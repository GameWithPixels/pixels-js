import { getImageRgbAverages } from "@systemic-games/vision-camera-rgb-averages";
import React from "react";
import { runOnJS } from "react-native-reanimated";
import { Frame, useFrameProcessor } from "react-native-vision-camera";

import { PixelIdDecoderState, usePixelIdDecoder } from "./usePixelIdDecoder";

export type FrameProcessor = (frame: Frame) => void;

export function usePixelIdDecoderFrameProcessor(): [
  FrameProcessor,
  PixelIdDecoderState,
  Error?,
] {
  const [lastError, setLastError] = React.useState<Error>();

  // PixelId decoder
  const [decoderState, decoderDispatch] = usePixelIdDecoder();

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const result = getImageRgbAverages(frame, {
        maxPixelsToProcess: 320 * 240, // Limit number of processed pixels for performance reason
      });
      if (typeof result === "string") {
        setLastError(new Error(result));
      } else {
        runOnJS(decoderDispatch)({ rgbAverages: result });
      }
    },
    [decoderDispatch]
  );

  return [frameProcessor, decoderState, lastError];
}
