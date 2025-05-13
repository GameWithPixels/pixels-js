import { PixelInfo } from "@systemic-games/pixels-core-connect";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { AppActionsData, AppActionType } from "../store";
import { buildWebRequestParams } from "./buildWebRequestParams";
import {
  playActionMakeWebRequestAsync,
  playActionSpeakText,
  sendToDDDiceAsync,
} from "./playRemoteAction";

import { AppConnections } from "~/app/AppConnections";
import { AppStore } from "~/app/store";

type AppActionMapping = {
  [T in AppActionType]: {
    type: T;
    data: AppActionsData[T];
  };
};

export type AppActionTypeAndData = AppActionMapping[AppActionType];

export function playAppActions(
  die: Omit<PixelInfo, "systemId">,
  roll: number,
  store: AppStore,
  connections: AppConnections
) {
  const actions = store.getState().appActions;
  // Iterate over all created actions and try to trigger them
  actions.entries.ids.forEach((id) => {
    const action = actions.entries.entities[id];
    const type = action?.type;
    if (type) {
      if (action.enabled) {
        const data = actions.data[type][action.uuid];
        playAppAction(
          die,
          roll,
          {
            type,
            data,
          } as AppActionTypeAndData,
          connections
        );
      }
    }
  });
}

export function playAppAction(
  die: Omit<PixelInfo, "systemId">,
  roll: number,
  { type, data }: AppActionTypeAndData,
  connections: AppConnections
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
    case "dddice":
      sendToDDDiceAsync(
        data,
        {
          die,
          value: roll,
        },
        connections
      );
      break;
    case "twitch":
      throw new Error("Not implemented");
    case "proxy":
      throw new Error("Not implemented");
    default:
      assertNever(type, `Unknown app action type: ${type}`);
  }
}
