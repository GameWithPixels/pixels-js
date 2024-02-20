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
import { ToastSettings } from "~/themes";

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
  console.log(`Transferring profile: ${profile.name} - ${profile.uuid}`);
  for (const rule of modified.rules) {
    console.log(" - Rule of type " + rule.condition.type);
    if (rule.condition instanceof Profiles.ConditionRolled) {
      console.log("    Mapped faces: " + rule.condition.faces.join(", "));
    }
    for (const action of rule.actions) {
      if (action instanceof Profiles.ActionPlayAnimation) {
        const anim = action.animation;
        console.log(
          anim
            ? `    * Play anim ${anim.name}, type: ${anim.type},` +
                ` duration: ${anim.duration}, count ${(anim as any).count}`
            : "    * No animation!"
        );
      } else if (action instanceof Profiles.ActionMakeWebRequest) {
        console.log(
          `    * Web request to "${action.url}" with value "${action.value}"`
        );
      } else if (action instanceof Profiles.ActionSpeakText) {
        console.log(
          `    * Speak "${action.text}" with pitch ${action.pitch} and rate ${action.rate}`
        );
      }
    }
  }
  const ds = createDataSetForProfile(modified);
  // TODO update when getting confirmation from the die in AppPixelsCentral
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
      Toast.show(
        `\nProfile "${profile.name}" activated on ${pixel.name}\n`,
        ToastSettings
      );
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
