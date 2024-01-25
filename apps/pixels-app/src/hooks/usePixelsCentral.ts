import {
  getPixel,
  Pixel,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppSelector } from "~/app/hooks";
import { PixelsCentral } from "~/features/dice/PixelsCentral";
import { PairedDie } from "~/features/store/pairedDiceSlice";
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
  const pairedDice = useAppSelector((state) => state.pairedDice.dice);
  const pixelId =
    typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  if (!pairedDice.find((d) => d.pixelId === pixelId)?.isPaired) {
    reportError(`Pixel ${unsigned32ToHex(pixelId)} not paired`);
  }
  return getPixel(pixelId);
}
