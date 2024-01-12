import { createDataSetForProfile } from "@systemic-games/pixels-edit-animation";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";
import Toast from "react-native-root-toast";

import { blinkDie } from "./blinkDie";
import {
  clearProfileTransfer,
  setProfileTransfer,
} from "../store/diceRollsSlice";
import { setPairedDieProfile } from "../store/pairedDiceSlice";

import { store } from "~/app/store";
import { applyProfileOverrides } from "~/features/profiles";
import { AppDarkTheme } from "~/themes";

export function transferProfile(
  pixel: Pixel,
  profile: Readonly<Profiles.Profile>
): void {
  console.log(
    `Transferring profile ${profile.name} to die ${pixel.pixelId
      .toString(16)
      .padStart(8)}`
  );
  const modified = applyProfileOverrides(profile);
  const ds = createDataSetForProfile(modified);
  // TODO update when getting confirmation from the die in usePairedPixels
  store.dispatch(
    setPairedDieProfile({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );
  store.dispatch(
    setProfileTransfer({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );
  const data = ds.toDataSet();
  pixel
    .transferDataSet(data)
    .then(() => {
      blinkDie(pixel);
      Toast.show(`\nProfile "${profile.name}" activated on ${pixel.name}\n`, {
        duration: Toast.durations.SHORT,
        position: -100,
        opacity: 1.0,
        backgroundColor: AppDarkTheme.colors.elevation.level3,
        textColor: AppDarkTheme.colors.onSurface,
      });
    })
    .catch((e) => {
      console.log(`Error while transferring profile: ${e}`);
      Alert.alert(
        "Failed to Activate Profile",
        "An error occurred while transferring the profile data to the die. The error is " +
          String(e),
        [{ text: "OK" }]
      );
    })
    .finally(() => store.dispatch(clearProfileTransfer()));
}
