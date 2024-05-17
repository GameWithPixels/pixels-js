import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import { createDataSetForProfile } from "@systemic-games/pixels-edit-animation";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import { Alert } from "react-native";
import Toast from "react-native-root-toast";

import { blinkDie } from "./blinkDie";

import { AppStore } from "~/app/store";
import { applyProfileOverrides } from "~/features/profiles";
import {
  clearProfileTransfer,
  setProfileTransfer,
} from "~/features/store/diceTransientSlice";
import { ToastSettings } from "~/themes";

export function programProfile(
  pixel: Pixel,
  profile: Readonly<Profiles.Profile>,
  store: AppStore,
  opt?: { silent?: boolean }
): void {
  console.log(
    `Programming profile ${profile.name} (${
      profile.uuid
    }) to die ${unsigned32ToHex(pixel.pixelId)}`
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
                ` duration: ${anim.duration}, count ${action.loopCount}`
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

  const brightnessFactor = store.getState().appSettings.diceBrightnessFactor;
  console.log(
    ` - Brightness: ${brightnessFactor} * ${modified.brightness} = ${
      brightnessFactor * modified.brightness
    }`
  );

  // TODO update when getting confirmation from the die in AppPixelsCentral
  store.dispatch(
    setProfileTransfer({ pixelId: pixel.pixelId, profileUuid: profile.uuid })
  );

  // Create the data set for the profile
  const dataSet = createDataSetForProfile(
    modified,
    brightnessFactor
  ).toDataSet();
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
      store.dispatch(clearProfileTransfer());
    }
  };
  task();
}
