import React from "react";
import { Alert, AppState } from "react-native";
import { useStore } from "react-redux";

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
      // Init sequence
      const hasTemplates = store.getState().library.templates.ids.length > 0;
      if (!hasTemplates) {
        console.warn("Resetting library");
        Library.dispatchReset(appDispatch);
      }
      const library = store.getState().library;
      if (!library.profiles.ids.length) {
        console.warn("Creating default profiles");
        Library.dispatchAddDefaultProfiles(appDispatch, library);
      }
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
  const hasUpdate = useAppSelector((state) => !!state.appUpdate.manifest);
  React.useEffect(() => {
    if (hasUpdate) {
      // Inform user
      Alert.alert(
        "App Update Available",
        "An update is available, would you like to install it now?",
        [
          {
            text: "Yes",
            onPress: () => installAppUpdateAsync(appDispatch),
          },
          {
            text: "No",
          },
        ]
      );
    }
  }, [appDispatch, hasUpdate]);

  return !initialized ? null : <>{children}</>;
}
