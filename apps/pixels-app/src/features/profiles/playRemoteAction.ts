import { Profiles } from "@systemic-games/react-native-pixels-connect";
import * as Speech from "expo-speech";
import Toast from "react-native-root-toast";

import {
  ActionMakeWebRequestPayload,
  getWebRequestURL,
} from "./getWebRequestURL";

import { ToastSettings } from "~/themes";

export function playActionMakeWebRequest(
  action: Profiles.ActionMakeWebRequest,
  payload: ActionMakeWebRequestPayload
): void {
  const body = action.format === "json" ? JSON.stringify(payload) : undefined;
  const url = body ? action.url.trim() : getWebRequestURL(action.url, payload);
  console.log(
    `Playing Web Request: ${url} with payload ${JSON.stringify(payload)}`
  );
  const toastMsg = `\n\nURL: ${url}${body ? `\nbody: ${body}` : ""}\n\n`;
  const forPixelMsg = payload.pixelName ? ` for "${payload.pixelName}"` : "";
  fetch(url, {
    method: "POST",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body,
        }
      : {}),
  })
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
}

export function playActionSpeakText(action: Profiles.ActionSpeakText): void {
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
}
