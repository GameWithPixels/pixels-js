import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Speech from "expo-speech";
import Toast from "react-native-root-toast";

import type {
  DiscordWebhookEmbed,
  EmbedsDiscordWebhookPayload,
} from "./discordWebhook";
import {
  ActionMakeWebRequestPayload,
  getWebRequestURL,
} from "./getWebRequestURL";

import { ToastSettings } from "~/app/themes";

const baseDiceIconUrl =
  "https://raw.githubusercontent.com/GameWithPixels/pixels-js/main/apps/pixels-app/assets/wireframes";

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

const soundMap = new Map<AVPlaybackSource, Audio.Sound>();

async function getSound(source: AVPlaybackSource): Promise<Audio.Sound> {
  let loadedSound = soundMap.get(source);
  if (!loadedSound) {
    const { sound } = await Audio.Sound.createAsync(source);
    soundMap.set(source, sound);
    loadedSound = sound;
  }
  return loadedSound;
}

async function playSoundAsync(
  source: AVPlaybackSource,
  volume = 1
): Promise<void> {
  try {
    const sound = await getSound(source);
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(volume);
    await sound.playAsync();
  } catch (e) {
    console.log(`Error playing sound: ${e}`);
  }
}

export function playActionAudioClip(
  action: Profiles.ActionPlayAudioClip,
  clipName?: string
): void {
  console.log(`Play Audio Clip: ${action.clipUuid}`);
  if (action.clipUuid) {
    Toast.show(
      `Playing Audio Clip action.\nClip: ${clipName ?? action.clipUuid}`,
      ToastSettings
    );
    playSoundAsync(
      {
        uri: FileSystem.documentDirectory + "audioClips/" + action.clipUuid,
      },
      action.volume
    );
  } else {
    console.log("No audio clip");
  }
}
