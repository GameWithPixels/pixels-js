import {
  getRgbAveragesFrameProcessor,
  ImageRgbAverages,
  installFrameProcessor,
} from "@systemic-games/vision-camera-rgb-averages";
import React from "react";
import {
  Frame,
  ReadonlyFrameProcessor,
  useFrameProcessor,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";

import { PixelIdDecoderState, usePixelIdDecoder } from "./usePixelIdDecoder";

export type FrameProcessor = (frame: Frame) => void;

installFrameProcessor();

export function usePixelIdDecoderFrameProcessor(): [
  ReadonlyFrameProcessor,
  PixelIdDecoderState,
  Error?,
] {
  const [lastError, setLastError] = React.useState<Error>();

  // PixelId decoder
  const [decoderState, decoderDispatch] = usePixelIdDecoder();

  // Process the RGB averages on the JS thread
  const processOnJS = Worklets.createRunOnJS(
    (rgbAverages: ImageRgbAverages) => {
      try {
        decoderDispatch({ rgbAverages });
      } catch (error) {
        setLastError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  );

  // Get the frame processor
  const frameProc = getRgbAveragesFrameProcessor();

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (frameProc) {
        // console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`)
        const rgbAverages = frameProc(frame, {
          subSamplingX: 2,
          subSamplingY: 2,
        });
        if (rgbAverages) {
          processOnJS(rgbAverages);
        }
      }
    },
    [frameProc, processOnJS]
  );

  return [frameProcessor, decoderState, lastError];
}
