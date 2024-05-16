import { createLibraryProfile } from "@systemic-games/pixels-edit-animation";
import {
  Pixel,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";

import { AppDispatch } from "~/app/store";
import { Library } from "~/features/store";
import { unsigned32ToHex } from "~/features/utils";

export function resetDieSettings(
  pixel: Pixel,
  profileUuid: string,
  appDispatch: AppDispatch
): void {
  const task = async () => {
    try {
      await pixel.sendMessage("clearSettings");
      // TODO force default name
      // @ts-ignore Calling private function
      pixel._updateName("Pixel" + unsigned32ToHex(pixel.pixelId));
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
