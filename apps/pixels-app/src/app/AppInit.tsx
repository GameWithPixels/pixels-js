import React from "react";
import { Alert, AppState } from "react-native";
import { useStore } from "react-redux";

import { updatePairedDiceAndProfilesFrom3to4 } from "./migrations";
import { RootState } from "./store";
import { checkForAppUpdateAsync, installAppUpdateAsync } from "./updates";

import { useAppSelector } from "~/app/hooks";
import { setAudioActiveInBackground } from "~/features/audio";
import { Library } from "~/features/store";
import { logError } from "~/features/utils";

export function AppInit({ children }: React.PropsWithChildren) {
  const store = useStore<RootState>();
  const [initialized, setInitialized] = React.useState(false);

  // Library defaults
  React.useEffect(() => {
    if (!initialized) {
      // Init library
      const hasStuff = store.getState().library.gradients.ids.length > 0;
      if (!hasStuff) {
        console.warn("Resetting library except profiles");
        Library.dispatchReset(store.dispatch, {
          keepProfiles: true,
        });
      }
      // Upgrading from v2.2
      updatePairedDiceAndProfilesFrom3to4(store);
      // Set as initialized
      setInitialized(true);
    }
  }, [initialized, store]);

  // Monitor app state
  const [active, setActive] = React.useState(true);
  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setActive(state === "active");
    });
    return () => sub.remove();
  }, []);

  // Check for updates every 10 minutes
  React.useEffect(() => {
    if (active) {
      checkForAppUpdateAsync(store.dispatch);
      const id = setInterval(
        () => checkForAppUpdateAsync(store.dispatch),
        10 * 60 * 1000
      );
      return () => clearInterval(id);
    }
  }, [active, store]);
  const hasUpdate = useAppSelector(
    (state) => !!state.appTransient.update.manifest
  );
  React.useEffect(() => {
    if (hasUpdate) {
      // Inform user
      Alert.alert(
        "App Patch Available",
        "The app will update itself to apply the latest patch, " +
          "you have no action to take.",
        [
          {
            text: "Ok",
            onPress: () => installAppUpdateAsync(store.dispatch),
          },
        ]
      );
    }
  }, [hasUpdate, store]);

  const backgroundAudio = useAppSelector(
    (state) => state.appSettings.backgroundAudio
  );
  React.useEffect(() => {
    setAudioActiveInBackground(backgroundAudio).catch((e) => logError(e));
  }, [backgroundAudio]);

  return !initialized ? null : <>{children}</>;
}
