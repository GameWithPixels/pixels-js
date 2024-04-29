import React from "react";
import { runOnJS } from "react-native-reanimated";

import { PixelIdDecoderState, usePixelIdDecoder } from "./usePixelIdDecoder";

export type FrameProcessor = (frame: any) => void;

export function usePixelIdDecoderFrameProcessor(): [
  FrameProcessor,
  PixelIdDecoderState,
  Error?
] {
  const [lastError, setLastError] = React.useState<Error>();

  // PixelId decoder
  const [decoderState, decoderDispatch] = usePixelIdDecoder();

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = () => {
      // "worklet";
      
    };

  return [frameProcessor, decoderState, lastError];
}
