import { assert } from "@systemic-games/pixels-core-utils";
import {
  getPixel,
  getPixelOrThrow,
  Pixel,
  PixelInfo,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import {
  addPairedDie,
  removePairedDie,
} from "~/features/store/pairedDiceSlice";

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function usePairedPixels(): {
  pixels: Pixel[];
  addDie: (pixel: PixelInfo) => void;
  removeDie: (pixel: PixelInfo) => void;
} {
  // Paired dice
  const pixelsIds = useAppSelector((state) => state.pairedDice.pixelsIds);
  const lastPixelsRef = React.useRef<Pixel[]>([]);
  const newPixels = pixelsIds.map(getPixel).filter(notEmpty);
  const pixels =
    lastPixelsRef.current?.length === newPixels.length
      ? lastPixelsRef.current
      : newPixels;
  lastPixelsRef.current = pixels;
  // Actions
  const appDispatch = useAppDispatch();
  const addDie = (pixel: PixelInfo) =>
    appDispatch(
      addPairedDie({
        pixelId: pixel.pixelId,
        name: pixel.name,
      })
    );
  const removeDie = (pixel: PixelInfo) =>
    appDispatch(removePairedDie(pixel.pixelId));
  return { pixels, addDie, removeDie };
}

export function usePairedPixel(pixelId: number): Pixel {
  const pixelsIds = useAppSelector((state) => state.pairedDice.pixelsIds);
  assert(
    pixelsIds.indexOf(pixelId) >= 0,
    `Pixel ${pixelId.toString(16).padStart(8)} not paired`
  );
  return getPixelOrThrow(pixelId);
}
