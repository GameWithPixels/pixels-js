import { Profiles } from "@systemic-games/react-native-pixels-connect";
import * as Speech from "expo-speech";
import Toast from "react-native-root-toast";

import { buildActionURL } from "./buildURL";

import { ToastSettings } from "~/themes";

export function playRemoteAction(
  action: Profiles.ActionRunOnDevice,
  opt?: {
    profileName?: string;
    pixelName?: string;
  }
): void {
  if (action instanceof Profiles.ActionMakeWebRequest) {
    const url = buildActionURL(action, opt);
    console.log(`Play Web Request: ${url}`);
    const toastMsg = `\n\nURL: ${url}\n\n`;
    const forPixelMsg = opt?.pixelName ? " for " + opt.pixelName : "";
    fetch(url, { method: "POST" })
      .then(({ status }) => {
        console.log(
          `Action web request to ${url} returned with status ${status}`
        );
        Toast.show(
          `Web Request Send${forPixelMsg}!${toastMsg}Status: ${status}`,
          ToastSettings
        );
      })
      .catch((e: Error) => {
        console.log(
          `Action web request to ${url} failed with error ${e.message ?? e}`
        );
        Toast.show(
          `Failed Sending Web Request${forPixelMsg}!${toastMsg}Error: ${
            e.message ?? e
          }`,
          { ...ToastSettings, duration: Toast.durations.LONG }
        );
      });
  } else if (action instanceof Profiles.ActionSpeakText) {
    console.log(`Play Speak Text: ${action.text}`);
    if (action.text?.trim()?.length) {
      Toast.show(
        `Playing Text to Speak action.\nText: ${action.text}`,
        ToastSettings
      );
      const settings = { pitch: action.pitch, rate: action.rate } as const;
      Speech.speak(action.text, settings);
    } else {
      console.log("No text to speak");
    }
  } else {
    console.log(`Ignoring remote action of type "${action.type}`);
  }
}
