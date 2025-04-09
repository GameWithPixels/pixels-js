import { Pixel, PixelInfo } from "@systemic-games/pixels-core-connect";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { AppActionsData, AppActionType } from "../store";
import { buildWebRequestParams } from "./buildWebRequestParams";
import {
  playActionMakeWebRequestAsync,
  playActionSpeakText,
  sendToThreeDDiceAsync,
} from "./playRemoteAction";

import { AppStore } from "~/app/store";

type AppActionMapping = {
  [T in AppActionType]: {
    type: T;
    data: AppActionsData[T];
  };
};

export function appActionListener(pixel: Pixel, roll: number, store: AppStore) {
  const actions = store.getState().appActions;
  // Iterate over all created actions and try to trigger them
  actions.entries.ids.forEach((id) => {
    const action = actions.entries.entities[id];
    const type = action?.type;
    if (type) {
      if (action.enabled) {
        const data = actions.data[type][action.uuid];
        // @ts-ignore
        playAppAction(pixel, roll, { type, data });
      }
    }
  });
}

function playAppAction(
  die: PixelInfo,
  roll: number,
  { type, data }: AppActionMapping[AppActionType]
) {
  switch (type) {
    case "speak":
      playActionSpeakText({ text: roll.toString(), ...data });
      break;
    case "url":
    case "json":
    case "discord": {
      const params = buildWebRequestParams(die, "App Action", "1");
      const format =
        type === "url" ? "parameters" : type === "json" ? "json" : "discord";
      playActionMakeWebRequestAsync({ url: data.url, format }, params);
      break;
    }
    case "twitch":
      throw new Error("Not implemented");
    case "dddice":
      sendToThreeDDiceAsync(data, {
        dieType: die.dieType,
        value: roll,
      });
      break;
    case "proxy":
      throw new Error("Not implemented");
    default:
      assertNever(type, `Unknown app action type: ${type}`);
  }
}
