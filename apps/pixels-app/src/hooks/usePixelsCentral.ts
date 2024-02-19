import {
  getPixel,
  Pixel,
  PixelScannerStatus,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { PixelsCentral } from "~/features/dice/PixelsCentral";
import { logError, unsigned32ToHex } from "~/features/utils";

export const PixelsCentralContext = React.createContext<PixelsCentral>(
  new PixelsCentral()
);

export function usePixelsCentral(): PixelsCentral {
  return React.useContext(PixelsCentralContext);
}

export function usePairedPixels(pairedPixelIds: readonly number[]): Pixel[] {
  const central = usePixelsCentral();
  const [pairedPixels, setPairedPixels] = React.useState<Pixel[]>([]);
  return pairedPixels;
}

export function useAvailablePixels(): ScannedPixelNotifier[] {
  const central = usePixelsCentral();
  const [availablePixels, setAvailablePixels] = React.useState<
    ScannedPixelNotifier[]
  >([]);
  return availablePixels;
}

export function usePairedPixel(
  pixelOrPixelId: Pick<PairedDie, "pixelId"> | number
): Pixel | undefined {
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const pixelId =
    typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  if (!pairedDice.some((d) => d.pixelId === pixelId)) {
    logError(`Pixel ${unsigned32ToHex(pixelId)} not paired`);
  }
  return getPixel(pixelId);
}

export function useAppPixelsScanner(): {
  availablePixels: ScannedPixelNotifier[];
  scannerStatus: PixelScannerStatus;
  startScan: () => void;
  stopScan: () => void;
} {
  const central = React.useContext(PixelsCentralContext);
  const [scannerStatus, setScannerStatus] = React.useState<PixelScannerStatus>(
    central.scannerStatus
  );
  const [availablePixels, setAvailablePixels] = React.useState(
    central.availablePixels
  );
  React.useEffect(() => {
    central.addEventListener("scannerStatusChanged", setScannerStatus);
    central.addEventListener("availablePixelsChanged", setAvailablePixels);
    return () => {
      central.removeEventListener("scannerStatusChanged", setScannerStatus);
      central.removeEventListener("availablePixelsChanged", setAvailablePixels);
      // Stop scanning on unmount
      central.stopScanning();
    };
  }, [central]);
  const startStop = React.useMemo(
    () => ({
      startScan: () => central.startScanning(),
      stopScan: () => central.stopScanning(),
    }),
    [central]
  );
  return {
    availablePixels,
    scannerStatus,
    ...startStop,
  };
}

export function useAppMonitoredPixels(): Pixel[] {
  const central = usePixelsCentral();
  const [pixels, setPixels] = React.useState(central.monitoredPixels);
  React.useEffect(() => {
    central.addEventListener("monitoredPixelsChanged", setPixels);
    return () =>
      central.removeEventListener("monitoredPixelsChanged", setPixels);
  }, [central]);
  return pixels;
}
