import { assertNever } from "@systemic-games/pixels-core-utils";
import { ActionWebRequestFormat } from "@systemic-games/pixels-edit-animation";
import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import * as Speech from "expo-speech";
import { AppState } from "react-native";
import Toast, { ToastOptions } from "react-native-root-toast";

import { ThreeDDiceConnectorParams } from "./ThreeDDiceConnector";
import { WebRequestParams } from "./buildWebRequestParams";
import { buildWebRequestURL } from "./buildWebRequestURL";
import type { EmbedsDiscordWebhookPayload } from "./discordWebhook";

import { RootState } from "~/app/store";
import { ToastSettings } from "~/app/themes";
import { getAssetPathname, playAudioClipAsync } from "~/features/audio";
import { logError } from "~/features/utils";

const defaultDiceIconsBaseUrl =
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

function buildDiscordWebhookPayload(
  {
    pixelName,
    profileName,
    actionValue,
    faceValue,
    dieType,
  }: Pick<
    WebRequestParams,
    "pixelName" | "profileName" | "actionValue" | "faceValue" | "dieType"
  >,
  diceIconsBaseUrl?: string
): EmbedsDiscordWebhookPayload {
  return {
    embeds: [
      {
        title: `${pixelName} rolled a ${faceValue}`,
        type: "rich",
        thumbnail: {
          url: `${diceIconsBaseUrl ?? defaultDiceIconsBaseUrl}/${dieType}.png`,
        },
        description: actionValue,
        footer: { text: `profile: ${profileName}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function buildThreeDDiceConnectorParams(
  { dieType, faceValue }: Pick<WebRequestParams, "dieType" | "faceValue">,
  options: Exclude<WebRequestOptions["dddice"], undefined>
): ThreeDDiceConnectorParams & {
  dieType: PixelDieType;
  faceValue: number;
} {
  return {
    dieType,
    faceValue,
    ...options,
  };
}

export type WebRequestOptions = Readonly<{
  // Discord
  diceIconsBaseUrl?: string; // May be used by other web request formats later on
  // Twitch

  // dddice
  dddice?: {
    apiKey: string;
    roomSlug: string;
    roomPasscode?: string;
    userUuid?: string;
  };
}>;

export function buildWebRequestPayload(
  format: ActionWebRequestFormat,
  params: WebRequestParams,
  options?: WebRequestOptions
): object | undefined {
  switch (format) {
    case "parameters":
      return undefined;
    case "json":
      return params;
    case "discord":
      return buildDiscordWebhookPayload(params, options?.diceIconsBaseUrl);
    case "twitch":
    case "dddice":
      return buildThreeDDiceConnectorParams(
        params,
        options?.dddice ?? {
          apiKey: "<missing>",
          roomSlug: "<missing>",
        }
      );
    default:
      assertNever(format, `Unknown web request format: ${format}`);
  }
}

export function playActionMakeWebRequest(
  action: Profiles.ActionMakeWebRequest,
  params: WebRequestParams,
  options?: WebRequestOptions
): void {
  const bodyObj = buildWebRequestPayload(action.format, params, options);
  const body = bodyObj ? JSON.stringify(bodyObj) : undefined;
  const url = body ? action.url.trim() : buildWebRequestURL(action.url, params);
  console.log(
    `Playing Web Request: ${url} with payload ${JSON.stringify(params)}`
  );
  const toastMsg = `\n\nURL: ${url}${
    action.format === "json" ? `\nbody: ${body}` : ""
  }\n\n`;
  const forPixelMsg = params.pixelName ? ` for "${params.pixelName}"` : "";
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
