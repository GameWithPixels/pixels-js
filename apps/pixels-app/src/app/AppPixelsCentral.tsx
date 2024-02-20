import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useStore } from "react-redux";
import { Store } from "redux";

import { useAppDispatch, useAppSelector } from "./hooks";
import { RootState } from "./store";

import { PixelsCentral } from "~/features/dice/PixelsCentral";
import {
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
  const profile = profileUuid && readProfile(profileUuid, state.library);
  if (profile) {
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
        `Remote action with id=${actionId} for profile ${profile.name} not found`
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
    // Rolls
    const onRoll = ({ pixel, roll }: { pixel: Pixel; roll: number }) =>
      appDispatch(addDieRoll({ pixelId: pixel.pixelId, roll }));
    central.addEventListener("dieRoll", onRoll);

    // Die name
    const onRename = ({ pixel, name }: { pixel: Pixel; name: string }) =>
      appDispatch(
        setPairedDieName({
          pixelId: pixel.pixelId,
          name,
        })
      );
    central.addEventListener("dieRename", onRename);

    const onProfile = ({ pixel, hash }: { pixel: Pixel; hash: number }) => {
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
    central.addEventListener("dieProfile", onProfile);

    const onRemoteAction = ({
      pixel,
      actionId,
    }: {
      pixel: Pixel;
      actionId: number;
    }) => remoteActionListener(pixel, actionId, store);
    central.addEventListener("dieRemoteAction", onRemoteAction);

    return () => {
      central.removeEventListener("dieRoll", onRoll);
      central.removeEventListener("dieRename", onRename);
      central.removeEventListener("dieProfile", onProfile);
      central.removeEventListener("dieRemoteAction", onRemoteAction);
      central.setWatchedDice([]);
    };
  }, [appDispatch, central, store]);

  // Monitor paired dice
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  React.useEffect(
    () => central.setWatchedDice(pairedDice.map((d) => d.pixelId)),
    [pairedDice, central]
  );

  return (
    <PixelsCentralContext.Provider value={central}>
      {children}
    </PixelsCentralContext.Provider>
  );
}
