import {
  assertNever,
  SequentialPromiseQueue,
} from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  getPixel,
  ScannedPixel,
  useScannedPixels,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PixelConnectByIdState {
  status: "disconnected" | "scanning" | "connecting" | "connected";
  pixel?: Pixel;
  scannedPixel?: ScannedPixel;
}

export type PixelConnectByIdAction = "connect" | "disconnect";

export interface PixelConnectByIdOptions {
  pixelId: number;
}

export type PixelConnectByIdDispatch = (
  action: PixelConnectByIdAction,
  options?: PixelConnectByIdOptions
) => void;

// Returned dispatch function is stable
export default function (): [
  PixelConnectByIdState,
  PixelConnectByIdDispatch,
  Error?
] {
  const [lastError, setLastError] = useState<Error>();
  const [scannedPixels, scannerDispatch, scanLastError] = useScannedPixels();
  const [pixelId, setPixelId] = useState<number>(0);
  const [scannedPixel, setScannedPixel] = useState<ScannedPixel>();
  const [pixel, setPixel] = useState<Pixel>();
  const [queue] = useState(() => new SequentialPromiseQueue());
  const pixelStatus = usePixelStatus(pixel);
  const stateRef = useRef<PixelConnectByIdState>({ status: "disconnected" });
  useEffect(() => {
    if (scanLastError) {
      setLastError(scanLastError);
    }
  }, [scanLastError]);

  const dispatch = useCallback(
    (
      action: PixelConnectByIdAction,
      options?: PixelConnectByIdOptions
    ): void => {
      setLastError(undefined);
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
        default:
          assertNever(action);
      }
    },
    []
  );

  // Scan start/stop
  useEffect(() => {
    if (pixelId) {
      scannerDispatch("clear");
      scannerDispatch("start");
    } else {
      scannerDispatch("stop");
    }
  }, [pixelId, scannerDispatch]);

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
  }, [pixelId, scannedPixels]);

  // Clean up
  useEffect(() => {
    if (pixel) {
      queue
        .run(async () => {
          await pixel.connect();
        })
        .catch(setLastError);
      return () => {
        queue
          .run(async () => {
            await pixel.disconnect();
          })
          .catch(setLastError);
      };
    }
  }, [pixel, queue]);

  // Status isn't store in a state so to not trigger another state update when pixelStatus changes
  const status = pixelId
    ? "scanning"
    : pixelStatus === "connecting" || pixelStatus === "identifying"
    ? "connecting"
    : pixelStatus === "ready"
    ? "connected"
    : "disconnected";
  if (
    status !== stateRef.current.status ||
    pixel !== stateRef.current.pixel ||
    scannedPixel !== stateRef.current.scannedPixel
  ) {
    stateRef.current = { status, pixel, scannedPixel };
  }
  return [stateRef.current, dispatch, lastError];
}
