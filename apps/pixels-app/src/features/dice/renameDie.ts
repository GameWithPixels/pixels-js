import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";

import { transferProfile } from "./transferProfile";

import { AppDispatch } from "~/app/store";

export function renameDie(
  pixel: Pixel,
  newName: string,
  profile: Readonly<Profiles.Profile>,
  brightnessFactor: number,
  appDispatch: AppDispatch
): void {
  const task = async () => {
    try {
      await pixel.rename(newName);
      transferProfile(pixel, profile, brightnessFactor, appDispatch, {
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
