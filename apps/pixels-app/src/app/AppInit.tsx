import React from "react";
import { Alert, AppState } from "react-native";
import { useStore } from "react-redux";

import { RootState } from "./store";
import { checkForAppUpdateAsync, installAppUpdateAsync } from "./updates";

import { useAppSelector, useAppDispatch } from "~/app/hooks";
import { pairDie } from "~/features/dice";
import { Library, readProfile } from "~/features/store";

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
      // Create dice profiles (needed when upgrading from v2.2)
      const { paired, unpaired } = store.getState().pairedDice;
      for (const d of paired.concat(unpaired)) {
        // Create die profile by re-pairing die
        if (!d.profileHash) {
          console.warn(`Re-pairing die ${d.name} to generate profile & hash`);
          // Profile won't be found if it's using the default profile
          const hasProfile = store
            .getState()
            .library.profiles.ids.includes(d.profileUuid);
          pairDie(
            {
              systemId: d.systemId,
              pixelId: d.pixelId,
              name: d.name,
              ledCount: d.ledCount,
              colorway: d.colorway,
              dieType: d.dieType,
              firmwareDate: new Date(d.firmwareTimestamp),
            },
            store,
            hasProfile
              ? readProfile(d.profileUuid, store.getState().library)
              : undefined
          );
        }
      }
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
        "An patch is available, would you like to install it now?\n" +
          "You can always install it later from the More tab.",
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
