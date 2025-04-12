import { Audio } from "expo-av";
import React, { useRef } from "react";
import { Alert, AppState, Platform } from "react-native";
import { useStore } from "react-redux";

import { updatePairedDiceAndProfilesFrom3to4 } from "./migrations";
import { RootState } from "./store";
import { checkForAppUpdateAsync, installAppUpdateAsync } from "./updates";

import { useAppSelector } from "~/app/hooks";
import { setAudioSettingsAsync } from "~/features/audio";
import { loadDfuFilesAsync } from "~/features/dfu/loadDfuFilesAsync";
import { Library, setDfuFilesStatus } from "~/features/store";
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
  const playAudioInSilentModeIOS = useAppSelector(
    (state) => state.appSettings.playAudioInSilentModeIOS
  );
  const dummySoundObject = useRef(new Audio.Sound());

  React.useEffect(() => {
    const enableSound = async () => {
      if (Platform.OS === "ios") {
        setAudioSettingsAsync({
          staysActiveInBackground: backgroundAudio,
          playsInSilentModeIOS: playAudioInSilentModeIOS,
        }).catch((e) => logError(e));
        // Apparently we need to do this to make sure Speech works in background/silent mode
        await dummySoundObject.current.loadAsync(require("#/sounds/empty.mp3"));
        await dummySoundObject.current.playAsync();
      }
    };
    enableSound();
  }, [backgroundAudio, playAudioInSilentModeIOS]);

  // Load DFU files
  const {
    useBetaFirmware: betaFirmware,
    appFirmwareTimestampOverride: timestamp,
  } = useAppSelector((state) => state.appSettings);
  React.useEffect(() => {
    // Load DFU files (not interrupted if a fast refresh happens)
    loadDfuFilesAsync({ betaFirmware }).then((result) => {
      if (timestamp) {
        // Override timestamp for testing
        result = { ...result, timestamp };
      }
      store.dispatch(
        setDfuFilesStatus(result instanceof Error ? String(result) : result)
      );
    });
  }, [betaFirmware, store, timestamp]);

  return !initialized ? null : <>{children}</>;
}
