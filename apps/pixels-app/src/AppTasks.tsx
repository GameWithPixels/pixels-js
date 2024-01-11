import { Serializable } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Alert, AppState } from "react-native";

import { checkForAppUpdateAsync, installAppUpdateAsync } from "./app/updates";

import { useAppSelector, useAppDispatch } from "~/app/hooks";
import { createDefaultProfiles } from "~/features/profiles";
import { Library } from "~/features/store";

// TODO show splash screen until library is loaded
// TODO is there a better way to do this?
export function AppTasks() {
  const appDispatch = useAppDispatch();

  // Library defaults
  const hasTemplates = useAppSelector(
    (state) => state.library.templates.ids.length > 0
  );
  const library = useAppSelector((state) => state.library);
  React.useEffect(() => {
    if (!hasTemplates) {
      Library.dispatchReset(appDispatch);
    } else if (!library.profiles.ids.length) {
      console.log("!!! Creating default profiles !!!");
      const { profiles, animations, gradients, patterns } =
        createDefaultProfiles("d20", library);
      for (const gradient of gradients) {
        appDispatch(Library.Gradients.add(Serializable.fromGradient(gradient)));
      }
      for (const pattern of patterns) {
        appDispatch(Library.Patterns.add(Serializable.fromPattern(pattern)));
      }
      for (const animation of animations) {
        appDispatch(
          Library.Animations.add(Serializable.fromAnimation(animation))
        );
      }
      for (const profile of profiles) {
        appDispatch(Library.Profiles.add(Serializable.fromProfile(profile)));
      }
    }
  }, [appDispatch, hasTemplates, library]);

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

  return null;
}
