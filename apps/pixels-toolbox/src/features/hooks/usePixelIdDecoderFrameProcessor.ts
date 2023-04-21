import { getImageRgbAverages } from "@systemic-games/vision-camera-rgb-averages";
import React from "react";
import { runOnJS } from "react-native-reanimated";
import { Frame, useFrameProcessor } from "react-native-vision-camera";

import usePixelIdDecoder from "./usePixelIdDecoder";

import { RbgColor } from "~/features/pixels/PixelIdDecoder";

export type FrameProcessor = (frame: Frame) => void;

export default function (): [FrameProcessor, number, RbgColor?, Error?] {
  const [lastError, setLastError] = React.useState<Error>();

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
        runOnJS(setLastError)(
          new Error(
            `Exception in frame processor "getImageRgbAverages": ${error}`
          )
        );
      }
    },
    [decoderDispatch]
  );

  return [
    frameProcessor,
    decoderState.pixelId,
    decoderState.scanColor,
    lastError,
  ];
}
