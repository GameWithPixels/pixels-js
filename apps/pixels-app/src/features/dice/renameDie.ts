import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";

import { programProfile } from "./programProfile";

import { AppStore } from "~/app/store";

export function renameDie(
  pixel: Pixel,
  newName: string,
  profile: Readonly<Profiles.Profile>,
  store: AppStore
): void {
  const task = async () => {
    try {
      await pixel.rename(newName);
      programProfile(pixel, profile, store, {
        silent: true,
      });
    } catch (e) {
      console.log(`Error renaming die: ${e}`);
      Alert.alert(
        "Failed to Rename Die",
        "An error occurred while renaming the die: " + String(e),
        [{ text: "OK" }]
      );
    }
  };
  newName = newName.trim();
  if (newName.length) {
    task();
  }
}
