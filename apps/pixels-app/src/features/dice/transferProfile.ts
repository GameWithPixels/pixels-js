import { createDataSetForProfile } from "@systemic-games/pixels-edit-animation";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";
import Toast from "react-native-root-toast";

import { blinkDie } from "./blinkDie";

import { AppDispatch } from "~/app/store";
import { applyProfileOverrides } from "~/features/profiles";
import {
  clearProfileTransfer,
  setProfileTransfer,
} from "~/features/store/diceRollsSlice";
import { updatePairedDieProfile } from "~/features/store/pairedDiceSlice";
import { ToastSettings } from "~/themes";

export function transferProfile(
  pixel: Pixel,
  profile: Readonly<Profiles.Profile>,
  appDispatch: AppDispatch,
  opt?: { silent?: boolean }
): void {
  console.log(
    `Transferring profile ${profile.name} (${
      profile.uuid
    }) to die ${pixel.pixelId.toString(16).padStart(8)}`
  );

  // Create new profile with action overrides applied to it
  const modified = applyProfileOverrides(profile);

  // Log information about the modified profile
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

  // TODO update when getting confirmation from the die in AppPixelsCentral
  appDispatch(
    updatePairedDieProfile({
      pixelId: pixel.pixelId,
      profileUuid: profile.uuid,
    })
  );
  appDispatch(
    setProfileTransfer({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );

  // Create the data set for the profile
  const dataSet = createDataSetForProfile(modified).toDataSet();
  const task = async () => {
    try {
      await pixel.transferDataSet(dataSet);

      // Notify user
      if (!opt?.silent) {
        blinkDie(pixel);
        Toast.show(
          `\nProfile "${profile.name}" activated on ${pixel.name}\n`,
          ToastSettings
        );
      }
    } catch (e) {
      console.log(`Error transferring profile: ${e}`);
      Alert.alert(
        "Failed to Activate Profile",
        "An error occurred while transferring the profile data to the die: " +
          String(e),
        [{ text: "OK" }]
      );
    } finally {
      appDispatch(clearProfileTransfer());
    }
  };
  task();
}
