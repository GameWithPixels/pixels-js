import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import * as Speech from "expo-speech";
import { AppState } from "react-native";
import Toast, { ToastOptions } from "react-native-root-toast";

import type {
  DiscordWebhookEmbed,
  EmbedsDiscordWebhookPayload,
} from "./discordWebhook";
import {
  ActionMakeWebRequestPayload,
  getWebRequestURL,
} from "./getWebRequestURL";

import { RootState } from "~/app/store";
import { ToastSettings } from "~/app/themes";
import { getAssetPathname, playAudioClipAsync } from "~/features/audio";
import { logError } from "~/features/utils";

const baseDiceIconUrl =
  "https://raw.githubusercontent.com/GameWithPixels/pixels-js/main/apps/pixels-app/assets/wireframes";

function showToast(
  message: string,
  options: ToastOptions = ToastSettings
): void {
  if (AppState.currentState === "active") {
    Toast.show(message, options);
  }
}

function showLongToast(message: string): void {
  showToast(message, { ...ToastSettings, duration: Toast.durations.LONG });
}

export function getDiscordWebhookPayload(
  dieType: PixelDieType,
  payload: ActionMakeWebRequestPayload
): EmbedsDiscordWebhookPayload {
  const { pixelName, profileName, actionValue, faceValue } = payload;
  return {
    embeds: [
      {
        title: `${pixelName} rolled a ${faceValue}`,
        type: "rich",
        thumbnail: {
          url: `${baseDiceIconUrl}/${dieType}.png`,
        },
        description: actionValue,
        footer: { text: `profile: ${profileName}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function getSimplifyDiscordWebhookPayload(
  dieType: PixelDieType,
  payload: ActionMakeWebRequestPayload
): DiscordWebhookEmbed {
  const obj = getDiscordWebhookPayload(dieType, payload).embeds[0];
  if (obj.thumbnail?.url) {
    obj.thumbnail.url = obj.thumbnail.url.replace(
      baseDiceIconUrl,
      "https://[...]"
    );
  }
  return obj;
}

export function playActionMakeWebRequest(
  action: Profiles.ActionMakeWebRequest,
  dieType: PixelDieType,
  payload: ActionMakeWebRequestPayload
): void {
  const body =
    action.format === "json"
      ? JSON.stringify(payload)
      : action.format === "discord"
        ? JSON.stringify(getDiscordWebhookPayload(dieType, payload))
        : undefined;
  const url = body ? action.url.trim() : getWebRequestURL(action.url, payload);
  console.log(
    `Playing Web Request: ${url} with payload ${JSON.stringify(payload)}`
  );
  const toastMsg = `\n\nURL: ${url}${
    action.format === "json" ? `\nbody: ${body}` : ""
  }\n\n`;
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
      showToast(`Web Request Send${forPixelMsg}!${toastMsg}Status: ${status}`);
    })
    .catch((e: Error) => {
      console.log(
        `Action web request to ${url} failed with error ${e.message ?? e}`
      );
      showLongToast(
        `Failed Sending Web Request${forPixelMsg}!${toastMsg}Error: ${
          e.message ?? e
        }`
      );
    });
}

export function playActionSpeakText({
  text,
  volume,
  pitch,
  rate,
}: Profiles.ActionSpeakText): void {
  console.log(`Play Speak Text: ${text}`);
  if (text?.trim()?.length) {
    showToast(`Playing Speak Text action.\nText: ${text}`);
    Speech.speak(text, {
      volume,
      pitch,
      rate,
      onError: (e: Error) => {
        logError(
          `Speak Text error: ${e}, with params: ${JSON.stringify({ text, volume, pitch, rate })}`
        );
        showLongToast(
          `Error playing Speak Text action:\n${e.message ?? e}\nText: ${text}`
        );
      },
    });
  } else {
    console.log("No text to speak");
  }
}

export function playActionAudioClip(
  action: Profiles.ActionPlayAudioClip,
  assets: RootState["libraryAssets"]["audioClips"]["entities"]
): void {
  const { clipUuid, volume, loopCount } = action;
  const clip = clipUuid && assets[clipUuid];
  if (clip) {
    showToast(`Playing Audio Clip action.\nClip: ${clip.name}`);
    const play = async () => {
      const uri = getAssetPathname(clip, "audio");
      try {
        if (!uri) {
          throw new Error("Invalid audio clip directory");
        }
        console.log(`Play Audio Clip: ${uri} ${loopCount} time(s)`);
        for (let i = 0; i < loopCount; i++) {
          await playAudioClipAsync(uri, volume);
        }
      } catch (e) {
        logError(
          `Audio Clip error: ${e}, with params: ${JSON.stringify({ uri, volume, loopCount })}`
        );
        showLongToast(
          `Error playing Audio Clip action:\n${(e as Error).message ?? e}\nClip: ${clip.name}`
        );
      }
    };
    play();
  } else {
    console.log(`Audio clip not found: ${clipUuid}`);
  }
}
