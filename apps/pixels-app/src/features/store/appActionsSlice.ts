import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { logWrite } from "./logWrite";

import { generateUuid } from "~/features/utils";

export type AppAction =
  | { kind: "speak"; volume: number }
  | {
      kind: "url";
      url: string;
    }
  | {
      kind: "json";
      url: string;
    }
  | {
      kind: "discord";
      webhookUrl: string;
      diceImagesUrl?: string;
    }
  | {
      kind: "twitch";
      url: string;
    }
  | {
      kind: "dddice";
      apiKey: string;
      roomSlug: string;
      password?: string;
      userUuid?: string;
    };

export type AppActionKind = AppAction["kind"];

export type AppActionEntry = {
  uuid: string;
  kind: AppActionKind;
  enabled: boolean;
};

export type AppActionEntriesState = EntityState<AppActionEntry>;

export const appActionEntriesAdapter = createEntityAdapter<AppActionEntry>({
  selectId: (action: Readonly<AppActionEntry>) => action.uuid,
});

export type AppActionData<K extends AppActionKind> = Omit<
  Extract<AppAction, { kind: K }>,
  "kind"
>;

export type AppActionsState = {
  entries: AppActionEntriesState;
  data: {
    [K in AppActionKind]: Record<string, AppActionData<K>>;
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

// https://stackoverflow.com/a/75543542
type ReplaceUndefinedWithNull<T> = T extends undefined ? null : T;
type ToNullProps<T> = {
  [P in keyof T]-?: ReplaceUndefinedWithNull<T[P]>;
};

function createEmptyData(
  kind: AppActionKind
):
  | ToNullProps<AppActionData<"speak">>
  | ToNullProps<AppActionData<"url">>
  | ToNullProps<AppActionData<"json">>
  | ToNullProps<AppActionData<"discord">>
  | ToNullProps<AppActionData<"twitch">>
  | ToNullProps<AppActionData<"dddice">> {
  switch (kind) {
    case "speak":
      return { volume: 0 };
    case "url":
      return { url: "" };
    case "json":
      return { url: "" };
    case "discord":
      return { webhookUrl: "", diceImagesUrl: null };
    case "twitch":
      return { url: "" };
    case "dddice":
      return { apiKey: "", roomSlug: "", password: null, userUuid: null };
    default:
      assertNever(kind, `Unknown app action kind: ${kind}`);
  }
}

function copyData<K extends AppActionKind>(
  store: Record<string, AppActionData<K>>,
  kind: K,
  uuid: string,
  data: AppActionData<K>
): void {
  const copy = createEmptyData(kind) as unknown as AppActionData<K>;
  // Copy only the known keys and remove missing keys
  const keys = Object.keys(copy) as (keyof AppActionData<K>)[];
  for (const key of keys) {
    if (data.hasOwnProperty(key)) {
      copy[key] = data[key];
    } else if (copy[key] === null) {
      delete copy[key];
    }
  }
  store[uuid] = copy;
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

    addAppAction<K extends AppActionKind>(
      state: AppActionsState,
      {
        payload: { kind, enabled, data },
      }: PayloadAction<{
        kind: K;
        enabled: boolean;
        data: AppActionData<K>;
      }>
    ) {
      log("addAppAction", { kind, enabled, data });
      const uuid = generateAppActionUuid(state);
      appActionEntriesAdapter.addOne(state.entries, { uuid, kind, enabled });
      copyData(state.data[kind], kind, uuid, data);
    },

    updateAppAction<K extends AppActionKind>(
      state: AppActionsState,
      {
        payload: { uuid, kind, data },
      }: PayloadAction<{
        uuid: string;
        kind: K;
        data: AppActionData<K>;
      }>
    ) {
      log("updateAppAction", { uuid, kind, data });
      const entry = state.entries.entities[uuid];
      if (entry?.kind === kind) {
        copyData(state.data[kind], kind, uuid, data);
      } else {
        console.warn(
          `Redux: No app action of kind ${kind} with uuid ${uuid} to update`
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
        delete state.data[entry.kind][uuid];
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
  removeAppAction,
} = AppActionsSlice.actions;
export default AppActionsSlice.reducer;
