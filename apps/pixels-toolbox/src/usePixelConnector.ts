import {
  Pixel,
  getPixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";
import { useErrorHandler } from "react-error-boundary";

import SequentialPromiseQueue from "./SequentialPromiseQueue";
import usePixelScanner from "./usePixelScanner";
import usePixelStatus from "./usePixelStatus";

export interface PixelConnectorState {
  status: "disconnected" | "scanning" | "connecting" | "connected";
  pixel?: Pixel;
  scannedPixel?: ScannedPixel;
}

export type PixelConnectorAction = "connect" | "disconnect";

export interface PixelConnectorOptions {
  pixelId: number;
}

export type PixelConnectorDispatch = (
  action: PixelConnectorAction,
  options?: PixelConnectorOptions
) => void;

export default function (): [PixelConnectorState, PixelConnectorDispatch] {
  const errorHandler = useErrorHandler();
  const [scannedPixels, scannerDispatchAsync] = usePixelScanner();
  const [pixelId, setPixelId] = useState<number>(0);
  const [scannedPixel, setScannedPixel] = useState<ScannedPixel>();
  const [pixel, setPixel] = useState<Pixel>();
  const [queue] = useState(() => new SequentialPromiseQueue());
  const pixelStatus = usePixelStatus(pixel);
  const stateRef = useRef<PixelConnectorState>({ status: "disconnected" });

  const dispatch = useCallback(
    (action: PixelConnectorAction, options?: PixelConnectorOptions): void => {
      switch (action) {
        case "connect":
          if (options?.pixelId) {
            setPixel(undefined);
            setScannedPixel(undefined);
            setPixelId(options.pixelId);
          }
          break;
        case "disconnect":
          setPixel(undefined);
          setScannedPixel(undefined);
          break;
        default: {
          const check: never = action;
          throw new Error(check);
        }
      }
    },
    []
  );

  // Scan start/stop
  useEffect(() => {
    (async () => {
      if (pixelId) {
        await scannerDispatchAsync("clear");
        await scannerDispatchAsync("start");
      } else {
        await scannerDispatchAsync("stop");
      }
    })().catch(errorHandler);
  }, [errorHandler, pixelId, scannerDispatchAsync]);

  // Assign Pixel
  useEffect(() => {
    if (pixelId) {
      const i = scannedPixels.findIndex((p) => p.pixelId === pixelId);
      if (i >= 0) {
        setPixel(getPixel(scannedPixels[i]));
        setPixelId(0);
        setScannedPixel(scannedPixels[i]);
      }
    }
  }, [errorHandler, pixelId, scannedPixels]);

  // Clean up
  useEffect(() => {
    if (pixel) {
      queue
        .run(async () => {
          await pixel.connect();
        })
        .catch(errorHandler);
      return () => {
        queue
          .run(async () => {
            await pixel.disconnect();
          })
          .catch(errorHandler);
      };
    }
  }, [errorHandler, pixel, queue]);

  // Status isn't store in a state so to not trigger another state update when pixelStatus changes
  const status = pixelId
    ? "scanning"
    : pixelStatus === "connecting" || pixelStatus === "identifying"
    ? "connecting"
    : pixelStatus === "ready"
    ? "connected"
    : "disconnected";
  if (status !== stateRef.current.status || pixel !== stateRef.current.pixel) {
    stateRef.current = { status, pixel, scannedPixel };
  }
  return [stateRef.current, dispatch];
}
