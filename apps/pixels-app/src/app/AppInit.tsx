import React from "react";
import { Alert, AppState } from "react-native";
import { useStore } from "react-redux";

import { updatePairedDiceAndProfilesFrom3to4 } from "./migrations";
import { RootState } from "./store";
import { checkForAppUpdateAsync, installAppUpdateAsync } from "./updates";

import { useAppSelector, useAppDispatch } from "~/app/hooks";
import { Library } from "~/features/store";

export function AppInit({ children }: React.PropsWithChildren) {
  const appDispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [initialized, setInitialized] = React.useState(false);

  // Library defaults
  React.useEffect(() => {
    if (!initialized) {
      // Init library
      const hasStuff = store.getState().library.gradients.ids.length > 0;
      if (!hasStuff) {
        console.warn("Resetting library except profiles");
        Library.dispatchReset(appDispatch, {
          keepProfiles: true,
        });
      }
      // Upgrading from v2.2
      updatePairedDiceAndProfilesFrom3to4(store);
      // Set as initialized
      setInitialized(true);
    }
  }, [appDispatch, initialized, store]);

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
      checkForAppUpdateAsync(appDispatch);
      const id = setInterval(
        () => checkForAppUpdateAsync(appDispatch),
        10 * 60 * 1000
      );
      return () => clearInterval(id);
    }
  }, [appDispatch, active]);
  const hasUpdate = useAppSelector(
    (state) => !!state.appTransient.update.manifest
  );
  React.useEffect(() => {
    if (hasUpdate) {
      // Inform user
      Alert.alert(
        "App Patch Available",
        "Tap OK to update your app with the latest patch.",
        [
          {
            text: "Ok",
            onPress: () => installAppUpdateAsync(appDispatch),
          },
        ]
      );
    }
  }, [appDispatch, hasUpdate]);

  return !initialized ? null : <>{children}</>;
}
