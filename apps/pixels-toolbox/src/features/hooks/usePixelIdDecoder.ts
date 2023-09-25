import { ImageRgbAverages } from "@systemic-games/vision-camera-rgb-averages";
import React from "react";

import PixelIdDecoder, { RbgColor } from "~/features/pixels/PixelIdDecoder";

export interface PixelIdDecoderState {
  pixelId: number;
  progress: number;
  scanColor?: RbgColor;
  info?: string;
}

export interface PixelIdDecoderAction {
  rgbAverages?: ImageRgbAverages;
  reset?: boolean;
}

// Returned dispatch function is stable
export function usePixelIdDecoder(): [
  PixelIdDecoderState,
  (action: PixelIdDecoderAction) => void
] {
  // Store internal data, we don't want it to trigger updates
  const dataRef = React.useRef({
    pixelIdDecoder: new PixelIdDecoder(),
    lastResultTimestamp: 0,
    frames: [] as { timestamp: number; duration: number }[],
  });
  // Store the state that is returned
  const [state, setState] = React.useState<PixelIdDecoderState>({
    pixelId: 0,
    progress: 0,
  });

  const processRgbAverages = React.useCallback(
    (action: PixelIdDecoderAction) => {
      const data = dataRef.current;
      // Prepare to decode Pixel id
      const decoder = data.pixelIdDecoder;
      let pixelId: number | undefined;
      let progress = 0;
      let scanColor: RbgColor | undefined;
      // Reset?
      if (action.reset) {
        pixelId = 0;
        decoder.resetFrameResults();
      }
      if (action.rgbAverages) {
        // Keep some perf stats
        if (data.frames.length > 10) {
          data.frames.splice(0, 1);
        }
        data.frames.push({
          timestamp: action.rgbAverages.timestamp,
          duration: action.rgbAverages.duration,
        });
        // Try to decode id
        const time = action.rgbAverages.timestamp;
        ({ value: pixelId, progress } = decoder.processFrameResult(
          action.rgbAverages.redAverage,
          action.rgbAverages.greenAverage,
          action.rgbAverages.blueAverage,
          time
        ));

        // Update device id
        if (pixelId !== undefined) {
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
        if (
          pixelId !== state.pixelId ||
          progress !== state.progress ||
          scanColor !== state.scanColor
        ) {
          // Compute stats
          const frames = data.frames;
          const fps =
            frames.length > 1
              ? Math.round(
                  (frames.at(-1)?.timestamp! - frames[0].timestamp) /
                    (frames.length - 1)
                )
              : 0;
          const cpu = Math.round(
            frames.reduce((prev, next) => prev + next.duration, 0) /
              frames.length // Length can't be 0
          );
          const avg = action.rgbAverages;
          // Note: only update the info when some other value has changed
          //       to limit the number of re-render
          const info =
            avg &&
            `res:${avg.imageWidth}x${avg?.imageHeight} ss:${avg.widthSubSampling}x${avg.heightSubSampling} fps:${fps} cpu:${cpu}ms`;
          return { pixelId, progress, scanColor, info };
        } else {
          return state;
        }
      });
    },
    []
  );

  return [state, processRgbAverages];
}
