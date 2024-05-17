import { createLibraryProfile } from "@systemic-games/pixels-edit-animation";
import {
  Pixel,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";

import { AppDispatch } from "~/app/store";
import { Library } from "~/features/store";

export function resetDieSettings(
  pixel: Pixel,
  profileUuid: string,
  appDispatch: AppDispatch
): void {
  const task = async () => {
    try {
      await pixel.sendAndWaitForResponse("clearSettings", "clearSettingsAck");
      appDispatch(
        Library.Profiles.update(
          Serializable.fromProfile(
            createLibraryProfile("default", pixel.dieType, profileUuid)
          )
        )
      );
    } catch (e) {
      console.log(`Error renaming die: ${e}`);
      Alert.alert(
        "Failed to Reset Die Settings",
        "An error occurred while resetting the die settings: " + String(e),
        [{ text: "OK" }]
      );
    }
  };
  task();
}
