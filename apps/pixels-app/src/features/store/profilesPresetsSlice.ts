import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";

import { generateUuid } from "~/features/utils";
import { logWrite } from "./logWrite";

export type WebRequestSettings = {
  uuid: string;
  name: string;
  diceImagesUrl?: string; // Only used by Discord at the moment
  discord: {
    webhookUrl?: string;
  };
  twitch: {
    url?: string;
  };
  dddice: {
    apiKey: string;
    roomSlug: string;
    password?: string;
    userUuid?: string;
  };
};

export type WebRequestsSettingsState = EntityState<WebRequestSettings>;

export const webRequestsSettingsAdapter =
  createEntityAdapter<WebRequestSettings>({
    selectId: (ps: Readonly<WebRequestSettings>) => ps.uuid,
  });

export type ProfilesSettingsState = {
  webRequests: WebRequestsSettingsState;
};

function getInitialState(): ProfilesSettingsState {
  return {
    webRequests: webRequestsSettingsAdapter.getInitialState(),
  };
}

function log(
  action:
    | "resetPresets"
    | "addWebRequest"
    | "updateWebRequest"
    | "removeWebRequest"
    | "removeAllWebRequests",
  payload?: unknown
) {
  logWrite(
    payload ? `presets/${action}, payload: ${JSON.stringify(payload)}` : action
  );
}

function generateWebRequestSettingsUuid({
  webRequests,
}: ProfilesSettingsState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (webRequests.entities[uuid]);
  return uuid;
}

// Redux slice that stores rolls for the dice roller
const PresetsSlice = createSlice({
  name: "Presets",
  initialState: getInitialState,
  reducers: {
    resetPresets() {
      log("resetPresets");
      return getInitialState();
    },

    addWebRequest(state, { payload }: PayloadAction<WebRequestSettings>) {
      log("addWebRequest", payload);
      webRequestsSettingsAdapter.addOne(state.webRequests, payload);
    },

    updateWebRequest(state, { payload }: PayloadAction<WebRequestSettings>) {
      log("updateWebRequest", payload);
      webRequestsSettingsAdapter.updateOne(state.webRequests, {
        id: payload.uuid,
        changes: payload,
      });
    },

    removeWebRequest(state, { payload }: PayloadAction<string>) {
      log("removeWebRequest", payload);
      webRequestsSettingsAdapter.removeOne(state.webRequests, payload);
    },

    removeAllWebRequests(state) {
      log("removeAllWebRequests");
      webRequestsSettingsAdapter.removeAll(state.webRequests);
    },
  },
});

export const {
  resetPresets,
  addWebRequest,
  updateWebRequest,
  removeWebRequest,
  removeAllWebRequests,
} = PresetsSlice.actions;
export default PresetsSlice.reducer;
