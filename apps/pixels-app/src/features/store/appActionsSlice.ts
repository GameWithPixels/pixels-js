import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { logWrite } from "./logWrite";

import { generateUuid } from "~/features/utils";

export type AppActionsData = {
  speak: {
    volume: number;
    pitch: number;
    rate: number;
  };
  url: {
    url: string;
  };
  json: {
    url: string;
  };
  discord: {
    url: string;
    diceImagesUrl: string;
  };
  twitch: {
    url: string;
  };
  dddice: {
    apiKey: string;
    roomSlug: string;
    theme: string;
    password: string;
    userUuid: string;
  };
  proxy: {
    provider: "pusher";
    apiKey: string;
    secret: string;
    channel: string;
  };
};

export type AppActionType = keyof AppActionsData;

export type AppActionEntry = {
  uuid: string;
  type: AppActionType;
  enabled: boolean;
};

export type AppActionEntriesState = EntityState<AppActionEntry>;

export const appActionEntriesAdapter = createEntityAdapter<AppActionEntry>({
  selectId: (action: Readonly<AppActionEntry>) => action.uuid,
});

export type AppActionsState = {
  entries: AppActionEntriesState;
  data: {
    [T in AppActionType]: Record<string, AppActionsData[T]>;
  };
};

function getInitialState(): AppActionsState {
  return {
    entries: appActionEntriesAdapter.getInitialState(),
    data: {
      speak: {},
      url: {},
      json: {},
      discord: {},
      twitch: {},
      dddice: {},
      proxy: {},
    },
  };
}

function log(
  action:
    | "resetAppActions"
    | "addAppAction"
    | "updateAppAction"
    | "removeAppAction"
    | "enableAppAction",
  payload?: unknown
) {
  logWrite(payload ? `${action}, payload: ${JSON.stringify(payload)}` : action);
}

function generateAppActionUuid({ entries }: AppActionsState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (entries.entities[uuid]);
  return uuid;
}

function createEmptyData<T extends AppActionType>(type: T): AppActionsData[T] {
  type U = AppActionsData[T];
  // Note: the "as AppActions[T]" cast won't be needed in TypeScript >= 5.8
  switch (type) {
    case "speak":
      return { volume: 1, pitch: 1, rate: 1 } as U;
    case "url":
      return { url: "" } as U;
    case "json":
      return { url: "" } as U;
    case "discord":
      return { url: "", diceImagesUrl: "" } as U;
    case "twitch":
      return { url: "" } as U;
    case "dddice":
      return {
        apiKey: "",
        roomSlug: "",
        theme: "",
        password: "",
        userUuid: "",
      } as U;
    case "proxy":
      return {
        provider: "pusher",
        apiKey: "",
        secret: "",
        channel: "",
      } as U;
    default:
      assertNever(type, `Unknown app action type: ${type}`);
  }
}

function updateData<T extends AppActionType>(
  dst: AppActionsData[T],
  src: Partial<AppActionsData[T]>
): AppActionsData[T] {
  // Copy only the known keys
  const keys = Object.keys(dst) as (keyof AppActionsData[T])[];
  for (const key of keys) {
    const value = src[key];
    if (typeof value === typeof dst[key]) {
      dst[key] = value!; // Can't be undefined because of the typeof check
    }
  }
  return dst;
}

// Redux slice that stores rolls for the dice roller
const AppActionsSlice = createSlice({
  name: "appActions",
  initialState: getInitialState,
  reducers: {
    resetAppActions() {
      log("resetAppActions");
      return getInitialState();
    },

    addAppAction<T extends AppActionType>(
      state: AppActionsState,
      {
        payload: { type, enabled, data },
      }: PayloadAction<{
        type: T;
        enabled: boolean;
        data: Partial<AppActionsData[T]>;
      }>
    ) {
      log("addAppAction", { type, enabled, data });
      const uuid = generateAppActionUuid(state);
      appActionEntriesAdapter.addOne(state.entries, {
        uuid,
        type,
        enabled,
      });
      const store = state.data[type] as Record<string, AppActionsData[T]>;
      store[uuid] = updateData(createEmptyData(type), data);
    },

    updateAppAction<T extends AppActionType>(
      state: AppActionsState,
      {
        payload: { uuid, type, data },
      }: PayloadAction<{
        uuid: string;
        type: T;
        data: Partial<AppActionsData[T]>;
      }>
    ) {
      log("updateAppAction", { uuid, type, data });
      const entry = state.entries.entities[uuid];
      if (entry?.type === type) {
        updateData(state.data[type][uuid], data);
      } else {
        console.warn(
          `Redux: No app action of type ${type} with uuid ${uuid} to update`
        );
      }
    },

    enableAppAction(
      state,
      {
        payload: { uuid, enabled },
      }: PayloadAction<{
        uuid: string;
        enabled: boolean;
      }>
    ) {
      log("enableAppAction", { uuid, enabled });
      const entry = state.entries.entities[uuid];
      if (entry) {
        entry.enabled = enabled;
      } else {
        console.warn(`Redux: No app action with uuid ${uuid} to update`);
      }
    },

    removeAppAction(state, { payload: uuid }: PayloadAction<string>) {
      log("removeAppAction", uuid);
      const entry = state.entries.entities[uuid];
      if (entry) {
        appActionEntriesAdapter.removeOne(state.entries, uuid);
        delete state.data[entry.type][uuid];
      } else {
        console.warn(`Redux: No app action with uuid ${uuid} to remove`);
      }
    },
  },
});

export const {
  resetAppActions,
  addAppAction,
  updateAppAction,
  enableAppAction,
  removeAppAction,
} = AppActionsSlice.actions;
export default AppActionsSlice.reducer;
