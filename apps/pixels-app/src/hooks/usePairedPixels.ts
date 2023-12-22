import { assert } from "@systemic-games/pixels-core-utils";
import {
  getPixel,
  getPixelOrThrow,
  Pixel,
  PixelInfo,
  PixelStatus,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import {
  addPairedDie,
  addPairedDieRoll,
  PairedDie,
  removePairedDie,
  setPairedDieName,
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

function pixelLog(pixel: Pick<PixelInfo, "pixelId">, message: string) {
  console.log(`Pixel ${pixel.pixelId.toString(16).padStart(8)}: ${message}`);
}

function scheduleConnect(
  pixel: Pixel,
  timeout: number,
  isActive: (id: number) => boolean
) {
  // Schedule reconnection
  setTimeout(() => {
    if (isActive(pixel.pixelId)) {
      pixelLog(pixel, `Auto-connecting after delay of ${timeout}ms`);
      pixel.connect().catch((e: Error) => {
        pixelLog(pixel, `Connection error, ${e}`);
      });
    }
  }, timeout);
}

function disconnect(pixel: Pixel) {
  pixel
    .disconnect()
    .catch((e: Error) => pixelLog(pixel, `Disconnection error: ${e}`));
}

// TODO this hook works if only used once in the app
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
  const activePixelsRef = React.useRef(new Map<number, () => void>());
  React.useEffect(() => {
    const isActive = (pixelId: number) =>
      !!activePixelsRef.current.get(pixelId);
    // Add new paired Pixels
    for (const pixel of pixels) {
      if (!isActive(pixel.pixelId)) {
        pixelLog(pixel, "Die has become active");
        // Add event listeners
        const onStatus = (status: PixelStatus) => {
          if (status === "disconnected") {
            // TODO Delay reconnecting because our previous call to connect() might still be cleaning up
            scheduleConnect(pixel, 1000, isActive);
          }
        };
        pixel.addEventListener("status", onStatus);
        const onRoll = (roll: number) =>
          appDispatch(addPairedDieRoll({ pixelId: pixel.pixelId, roll }));
        pixel.addEventListener("roll", onRoll);
        const onRename = ({ name }: PixelInfo) => {
          appDispatch(
            setPairedDieName({
              pixelId: pixel.pixelId,
              name,
            })
          );
        };
        pixel.addPropertyListener("name", onRename);
        activePixelsRef.current.set(pixel.pixelId, () => {
          pixel.removeEventListener("status", onStatus);
          pixel.removeEventListener("roll", onRoll);
          pixel.removePropertyListener("name", onRename);
          // Disconnect
          disconnect(pixel);
        });
        // Schedule connection
        if (pixel.status === "disconnected") {
          scheduleConnect(pixel, 0, isActive);
        }
      }
    }
  }, [appDispatch, pixels]);
  React.useEffect(() => {
    // Remove unpaired Pixels
    const entries = Array.from(activePixelsRef.current.entries());
    for (const [pixelId, dispose] of entries) {
      if (!pairedDice.find((d) => d.pixelId === pixelId)?.isPaired) {
        pixelLog({ pixelId }, "Die has become inactive");
        activePixelsRef.current.delete(pixelId);
        // Remove event listeners and disconnect
        dispose();
      }
    }
  }, [pairedDice]);
  React.useEffect(() => {
    // Clean up
    const activePixels = activePixelsRef.current;
    return () => {
      for (const dispose of activePixels.values()) {
        dispose();
      }
      activePixels.clear();
    };
  }, []);
  React.useEffect(() => {
    console.log("usePairedPixels: scannedPixels changed");
  }, []);

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
  const pairDie = React.useCallback(
    (pixel: PixelInfo) =>
      appDispatch(
        addPairedDie({
          pixelId: pixel.pixelId,
          name: pixel.name,
        })
      ),
    [appDispatch]
  );
  const unpairDie = React.useCallback(
    (pixel: PixelInfo) => {
      appDispatch(removePairedDie(pixel.pixelId));
    },
    [appDispatch]
  );
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
