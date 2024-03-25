import {
  Pixel,
  PixelInfo,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useStore } from "react-redux";
import { Store } from "redux";

import { useAppDispatch, useAppSelector } from "./hooks";
import { RootState } from "./store";

import { PixelsCentral } from "~/features/dice/PixelsCentral";
import {
  FactoryProfile,
  getWebRequestPayload,
  playActionMakeWebRequest,
  playActionSpeakText,
} from "~/features/profiles";
import { addDieRoll } from "~/features/store/diceRollsSlice";
import { setPairedDieName } from "~/features/store/pairedDiceSlice";
import { readProfile } from "~/features/store/profiles";
import { PixelsCentralContext } from "~/hooks";

function remoteActionListener(
  pixel: Pixel,
  actionId: number,
  store: Store<RootState>
): void {
  const state = store.getState();
  const profileUuid = state.pairedDice.paired.find(
    (d) => d.pixelId === pixel.pixelId
  )?.profileUuid;
  if (profileUuid) {
    const profile =
      FactoryProfile.getByUuid(profileUuid) ??
      readProfile(profileUuid, state.library);
    const action = profile.getRemoteAction(actionId);
    if (action) {
      console.log(
        `Got remote action id=${actionId} of type ${action.type} for profile ${profile.name}`
      );
      if (action instanceof Profiles.ActionMakeWebRequest) {
        playActionMakeWebRequest(
          action,
          getWebRequestPayload(pixel, profile.name, action.value)
        );
      } else if (action instanceof Profiles.ActionSpeakText) {
        playActionSpeakText(action);
      } else {
        console.log(`Ignoring remote action of type "${action.type}`);
      }
    } else {
      console.warn(
        `Remote action with id=${actionId} for profile ${profile.name} (${profileUuid}) not found`
      );
    }
  }
}

export function AppPixelsCentral({ children }: React.PropsWithChildren) {
  const appDispatch = useAppDispatch();
  const central = React.useState(() => new PixelsCentral())[0];
  const store = useStore<RootState>();

  // Setup event handlers
  React.useEffect(() => {
    const disposers = new Map<number, () => void>();

    // Hook to Pixel events
    const onPixelFound = ({ pixel }: { pixel: Pixel }) => {
      // Clean up previous event listeners
      disposers.get(pixel.pixelId)?.();

      // Rolls
      const onRoll = (roll: number) =>
        appDispatch(addDieRoll({ pixelId: pixel.pixelId, roll }));
      pixel.addEventListener("roll", onRoll);

      // Die name
      const onRename = ({ name }: PixelInfo) =>
        appDispatch(
          setPairedDieName({
            pixelId: pixel.pixelId,
            name,
          })
        );
      pixel.addPropertyListener("name", onRename);

      // Profile
      const onProfileHash = (hash: number) => {
        console.log(
          `Got profile hash ${(hash >>> 0).toString(16)} for ${pixel.name}`
        );
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

      // Remote action
      const onRemoteAction = (actionId: number) =>
        remoteActionListener(pixel, actionId, store);
      pixel.addEventListener("remoteAction", onRemoteAction);

      disposers.set(pixel.pixelId, () => {
        pixel.removeEventListener("roll", onRoll);
        pixel.removePropertyListener("name", onRename);
        pixel.removeEventListener("profileHash", onProfileHash);
        pixel.removeEventListener("remoteAction", onRemoteAction);
      });
    };
    central.addEventListener("pixelFound", onPixelFound);

    // Unhook from Pixel events
    const onPixelRemoved = ({ pixel }: { pixel: Pixel }) => {
      disposers.get(pixel.pixelId)?.();
      disposers.delete(pixel.pixelId);
    };
    central.addEventListener("pixelRemoved", onPixelRemoved);

    return () => {
      central.removeEventListener("pixelFound", onPixelFound);
      central.removeEventListener("pixelRemoved", onPixelRemoved);
      central.stopScan();
      central.unwatchAll();
      for (const dispose of disposers.values()) {
        dispose();
      }
    };
  }, [appDispatch, central, store]);

  // Monitor paired dice
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  React.useEffect(() => {
    const pixelIds = pairedDice.map((d) => d.pixelId);
    for (const id of central.watchedPixelsIds) {
      if (!pixelIds.includes(id)) {
        central.unwatch(id);
      }
    }
    for (const id of pixelIds) {
      central.watch(id);
    }
  }, [pairedDice, central]);

  return (
    <PixelsCentralContext.Provider value={central}>
      {children}
    </PixelsCentralContext.Provider>
  );
}
