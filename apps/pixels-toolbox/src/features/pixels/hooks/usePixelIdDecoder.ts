import { ImageRgbAverages } from "@systemic-games/vision-camera-rgb-averages";
import React from "react";

import PixelIdDecoder, { RbgColor } from "./../PixelIdDecoder";

export interface PixelIdDecoderState {
  pixelId: number;
  scanColor?: RbgColor;
}

export interface PixelIdDecoderAction {
  rgbAverages?: ImageRgbAverages;
  reset?: boolean;
}

// Returned dispatch function is stable
export default function (): [
  PixelIdDecoderState,
  (action: PixelIdDecoderAction) => void
] {
  // Store internal data, we don't want it to trigger updates
  const [data] = React.useState(() => ({
    pixelIdDecoder: new PixelIdDecoder(),
    lastResultTimestamp: 0,
  }));
  // Store the state that is returned
  const [state, setState] = React.useState<PixelIdDecoderState>({ pixelId: 0 });

  const processRgbAverages = React.useCallback(
    (action: PixelIdDecoderAction) => {
      const decoder = data.pixelIdDecoder;
      let pixelId: number | undefined;
      let scanColor: RbgColor | undefined;
      if (action.reset) {
        pixelId = 0;
        decoder.resetFrameResults();
      }
      if (action.rgbAverages) {
        const time = action.rgbAverages.timestamp;
        const decodedValue = decoder.processFrameResult(
          action.rgbAverages.redAverage,
          action.rgbAverages.greenAverage,
          action.rgbAverages.blueAverage,
          time
        );

        // Update device id
        if (decodedValue !== undefined) {
          pixelId = decodedValue;
          data.lastResultTimestamp = time;
        }
        // Reset result if it hasn't been updated for a while
        else if (
          time - data.lastResultTimestamp >
          2 * decoder.messageDuration
        ) {
          pixelId = 0;
        }

        // Get the color from the frame
        scanColor = decoder.lastFrameColor;
      }
      setState((state) => {
        if (pixelId === undefined) {
          pixelId = state.pixelId;
        }
        if (pixelId !== state.pixelId || scanColor !== state.scanColor) {
          return { pixelId, scanColor };
        } else {
          return state;
        }
      });
    },
    [data] // Never changes
  );

  return [state, processRgbAverages];
}
