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
import { notEmpty, areArraysEqual } from "~/features/utils";

function stableFilterPixels(
  pairedDice: readonly PairedDie[],
  lastPixels: readonly Pixel[]
): readonly Pixel[] {
  const newPixels = pairedDice
    .map((d) => (d.isPaired ? getPixel(d.pixelId) : undefined))
    .filter(notEmpty);
  return areArraysEqual(newPixels, lastPixels) ? lastPixels : newPixels;
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
  const pairedDice = useAppSelector((state) => state.pairedDice.dice);
  const lastPixelsRef = React.useRef<readonly Pixel[]>([]);
  lastPixelsRef.current = stableFilterPixels(pairedDice, lastPixelsRef.current);
  const pixels = lastPixelsRef.current;
  const hookedPixelsRef = React.useRef(new Map<number, () => void>());
  React.useEffect(() => {
    for (const pixel of pixels) {
      if (!hookedPixelsRef.current.get(pixel.pixelId)) {
        const onRoll = (roll: number) =>
          appDispatch(addPairedDieRoll({ pixelId: pixel.pixelId, roll }));
        pixel.addEventListener("roll", onRoll);
        hookedPixelsRef.current.set(pixel.pixelId, () => {
          pixel.removeEventListener("roll", onRoll);
        });
      }
      // TODO should always try to connect?
      if (pixel.status === "disconnected") {
        pixel
          .connect()
          .catch((e: Error) => console.log(`Connection error: ${e}`));
      }
    }
  }, [appDispatch, pixels]);

  // Missing dice
  const diceData = useAppSelector((state) => state.pairedDice.dice);
  const missingDice = React.useMemo(
    () =>
      diceData.filter(
        (d) => d.isPaired && pixels.every((p) => p.pixelId !== d.pixelId)
      ),
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
  const unpairDie = (pixel: PixelInfo) => {
    hookedPixelsRef.current.get(pixel.pixelId)?.();
    hookedPixelsRef.current.delete(pixel.pixelId);
    appDispatch(removePairedDie(pixel.pixelId));
    getPixel(pixel.pixelId)
      ?.disconnect()
      .catch((e: Error) => console.log(`Connection error: ${e}`));
  };
  return { pixels, availablePixels, missingDice, pairDie, unpairDie };
}

export function usePairedPixel(pixelId: number): Pixel {
  const pairedDice = useAppSelector((state) => state.pairedDice.dice);
  assert(
    pairedDice.find((d) => d.pixelId === pixelId),
    `Pixel ${pixelId.toString(16).padStart(8)} not paired`
  );
  return getPixelOrThrow(pixelId);
}
