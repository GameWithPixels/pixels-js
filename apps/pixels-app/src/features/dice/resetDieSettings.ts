import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";

import { FactoryProfile } from "../profiles";
import { updatePairedDieProfile } from "../store/pairedDiceSlice";

import { AppDispatch } from "~/app/store";

export function resetDieSettings(pixel: Pixel, appDispatch: AppDispatch): void {
  const task = async () => {
    try {
      await pixel.sendMessage("clearSettings");
      // TODO force default name
      // @ts-ignore Calling private function
      pixel._updateName("Pixel" + pixel.pixelId.toString(16));
      appDispatch(
        updatePairedDieProfile({
          pixelId: pixel.pixelId,
          profileUuid: FactoryProfile.getUuid(pixel.dieType),
        })
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
