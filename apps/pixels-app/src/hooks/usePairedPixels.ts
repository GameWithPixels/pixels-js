import { assert } from "@systemic-games/pixels-core-utils";
import {
  getPixel,
  Pixel,
  PixelInfo,
  PixelStatus,
  Profiles,
  ScannedPixelNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { store } from "~/app/store";
import { PairedPixel } from "~/features/dice/PairedPixel";
import { playRemoteAction } from "~/features/profiles/playRemoteAction";
import { addDieRoll } from "~/features/store/diceRollsSlice";
import {
  addPairedDie,
  PairedDie,
  removePairedDie,
  setPairedDieName,
} from "~/features/store/pairedDiceSlice";
import { readProfile } from "~/features/store/profiles";
import { areArraysEqual, notEmpty, unsigned32ToHex } from "~/features/utils";

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
  console.log(`Pixel ${unsigned32ToHex(pixel.pixelId)}: ${message}`);
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

function createRemoteActionListener(pixel: Pixel): (actionId: number) => void {
  return (actionId: number) => {
    const state = store.getState();
    const profileUuid = state.pairedDice.dice.find(
      (d) => d.pixelId === pixel.pixelId
    )?.profileUuid;
    const profile = profileUuid && readProfile(profileUuid, state.library);
    if (profile) {
      const action = profile.getRemoteAction(actionId);
      if (action instanceof Profiles.ActionRunOnDevice) {
        console.log(
          `Got remote action with id ${actionId} of type "${action.type}`
        );
        playRemoteAction(action, {
          profileName: profile.name,
          pixelName: pixel.name,
        });
      } else {
        console.warn(
          `Ignoring running action with id ${actionId} for profile ${
            profile.name
          } because ${
            action
              ? "the action is not a web oncerequest"
              : "there is no such action"
          }`
        );
      }
    }
  };
}

// TODO this hook works if only used  in the app
export function usePairedPixels(scannedPixels?: ScannedPixelNotifier[]): {
  pairedPixels: readonly PairedPixel[];
  availablePixels: readonly ScannedPixelNotifier[];
  pairDie: (pixel: PairedPixel) => void;
  unpairDie: (pixel: Pick<PairedPixel, "pixelId">) => void;
} {
  const appDispatch = useAppDispatch();

  // Paired dice
  const pairedDice = useAppSelector((state) => state.pairedDice.dice);
  const pairedPixels = React.useMemo(
    () =>
      pairedDice.map((d) => ({
        systemId: d.systemId,
        pixelId: d.pixelId,
        name: d.name,
        dieType: d.dieType,
        colorway: d.colorway,
      })),
    [pairedDice]
  );
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
          appDispatch(addDieRoll({ pixelId: pixel.pixelId, roll }));
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
        const onProfileHash = (hash: number) => {
          pixelLog(pixel, "Profile hash is " + (hash >>> 0).toString(16));
          // const profile =
          //   store
          //     .getState()
          //     .profilesLibrary.profiles.find((p) => p.hash === hash) ??
          //   getDefaultProfile(pixel.dieType);
          // appDispatch(
          //   setPairedDieProfile({
          //     pixelId: pixel.pixelId,
          //     profileUuid: profile.uuid,
          //   })
          // );
        };
        pixel.addEventListener("profileHash", onProfileHash);
        // Web request handling
        const onRemoteAction = createRemoteActionListener(pixel);
        pixel.addEventListener("remoteAction", onRemoteAction);
        // Store our disposer
        activePixelsRef.current.set(pixel.pixelId, () => {
          pixel.removeEventListener("status", onStatus);
          pixel.removeEventListener("roll", onRoll);
          pixel.removePropertyListener("name", onRename);
          pixel.removeEventListener("profileHash", onProfileHash);
          pixel.removeEventListener("remoteAction", onRemoteAction);
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

  // Filter out Pixels that are already paired
  const availablePixels = React.useMemo(
    () =>
      scannedPixels?.filter((sp) =>
        pixels.every((p) => p.pixelId !== sp.pixelId)
      ) ?? [],
    [pixels, scannedPixels]
  );

  // Actions
  const addressesRef = React.useRef(new Map<number, number>());
  for (const { pixelId, address } of availablePixels) {
    addressesRef.current.set(pixelId, address);
  }
  const pairDie = React.useCallback(
    (pixel: PairedPixel) =>
      appDispatch(
        addPairedDie({
          systemId: pixel.systemId,
          address: addressesRef.current.get(pixel.pixelId) ?? 0,
          pixelId: pixel.pixelId,
          name: pixel.name,
          dieType: pixel.dieType,
          colorway: pixel.colorway,
        })
      ),
    [appDispatch]
  );
  const unpairDie = React.useCallback(
    (pixel: Pick<PixelInfo, "pixelId">) => {
      appDispatch(removePairedDie(pixel.pixelId));
    },
    [appDispatch]
  );
  return {
    pairedPixels,
    availablePixels,
    pairDie,
    unpairDie,
  };
}

export function usePairedPixel(
  pixelOrPixelId: Pick<PairedPixel, "pixelId"> | number
): Pixel | undefined {
  const pairedDice = useAppSelector((state) => state.pairedDice.dice);
  const pixelId =
    typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  assert(
    pairedDice.find((d) => d.pixelId === pixelId)?.isPaired,
    `Pixel ${unsigned32ToHex(pixelId)} not paired`
  );
  return getPixel(pixelId);
}
