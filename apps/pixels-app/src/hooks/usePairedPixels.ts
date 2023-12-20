import { assert } from "@systemic-games/pixels-core-utils";
import {
  getPixel,
  getPixelOrThrow,
  Pixel,
  PixelInfo,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import {
  addPairedDie,
  addPairedDieRoll,
  PairedDie,
  removePairedDie,
} from "~/features/store/pairedDiceSlice";

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function areArrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function getPixelsStable(
  pairedDice: readonly PairedDie[],
  lastPixels: readonly Pixel[]
): readonly Pixel[] {
  const newPixels = pairedDice.map((d) => getPixel(d.pixelId)).filter(notEmpty);
  return areArrayEqual(newPixels, lastPixels) ? lastPixels : newPixels;
}

// TODO this hooks works if only used once in the app
export function usePairedPixels(scannedPixels?: ScannedPixelNotifier[]): {
  pixels: readonly Pixel[];
  availablePixels: readonly ScannedPixelNotifier[];
  missingDice: readonly Readonly<PairedDie>[];
  pairDie: (pixel: PixelInfo) => void;
  unpairDie: (pixel: PixelInfo) => void;
} {
  const appDispatch = useAppDispatch();

  // Paired dice
  const pairedDice = useAppSelector((state) => state.pairedDice.data);
  const lastPixelsRef = React.useRef<readonly Pixel[]>([]);
  lastPixelsRef.current = getPixelsStable(pairedDice, lastPixelsRef.current);
  const pixels = lastPixelsRef.current;
  React.useEffect(() => {
    for (const pixel of pixels) {
      if (pixel.status === "disconnected") {
        pixel.addEventListener("roll", (roll) =>
          appDispatch(addPairedDieRoll({ pixelId: pixel.pixelId, roll }))
        );
        pixel
          .connect()
          .catch((e: Error) => console.log(`Connection error: ${e}`));
      }
    }
  }, [appDispatch, pixels]);

  // Missing dice
  const diceData = useAppSelector((state) => state.pairedDice.data);
  const missingDice = React.useMemo(
    () => diceData.filter((d) => pixels.every((p) => p.pixelId !== d.pixelId)),
    [diceData, pixels]
  );

  // Filter out Pixels that are already paired
  const availablePixels = React.useMemo(
    () =>
      scannedPixels?.filter((sp) =>
        pixels.every((p) => p.pixelId !== sp.pixelId)
      ) ?? [],
    [pixels, scannedPixels]
  );

  // Actions
  const pairDie = (pixel: PixelInfo) =>
    appDispatch(
      addPairedDie({
        pixelId: pixel.pixelId,
        name: pixel.name,
      })
    );
  const unpairDie = (pixel: PixelInfo) =>
    appDispatch(removePairedDie(pixel.pixelId));
  return { pixels, availablePixels, missingDice, pairDie, unpairDie };
}

export function usePairedPixel(pixelId: number): Pixel {
  const pairedDice = useAppSelector((state) => state.pairedDice.data);
  assert(
    pairedDice.find((d) => d.pixelId === pixelId),
    `Pixel ${pixelId.toString(16).padStart(8)} not paired`
  );
  return getPixelOrThrow(pixelId);
}
