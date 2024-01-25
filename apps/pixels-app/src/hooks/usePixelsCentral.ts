import {
  getPixel,
  Pixel,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { PixelsCentral } from "~/features/dice/PixelsCentral";
import { unsigned32ToHex } from "~/features/utils";

export const PixelsCentralContext = React.createContext<PixelsCentral>(
  new PixelsCentral()
);

export function usePairedPixels(pairedPixelIds: readonly number[]): Pixel[] {
  const central = React.useContext(PixelsCentralContext);
  const [pairedPixels, setPairedPixels] = React.useState<Pixel[]>([]);
  return pairedPixels;
}

export function useAvailablePixels(): ScannedPixelNotifier[] {
  const central = React.useContext(PixelsCentralContext);
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
    reportError(`Pixel ${unsigned32ToHex(pixelId)} not paired`);
  }
  return getPixel(pixelId);
}
