import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";

export interface DatedRoll {
  timestamp: number; // Unique identifier
  dieType: PixelDieType;
  value: number;
}

export type DatedRollsState = EntityState<DatedRoll>;

export const datedRollsAdapter = createEntityAdapter({
  selectId: (roll: Readonly<DatedRoll>) => roll.timestamp,
});

export interface AppTransientState {
  update: {
    gotResponse: boolean;
    manifest?: {
      id: string;
      createdAt: string;
    };
    error?: string;
  };
  roller: {
    allRolls: DatedRollsState;
    visibleRolls: number[]; // Timestamps
  };
}

const initialState: AppTransientState = {
  update: { gotResponse: false },
  roller: {
    allRolls: datedRollsAdapter.getInitialState(),
    visibleRolls: [],
  },
};

function log(
  action:
    | "resetAppTransientState"
    | "setAppUpdateResponse"
    | "addRollerEntry"
    | "hideRollerEntry"
    | "hideAllRollerEntries",
  value?: unknown
) {
  logWrite(action + (value !== undefined ? `: ${value}` : ""));
}

// Redux slice that stores app settings
const appUpdateSlice = createSlice({
  name: "appTransient",
  initialState,
  reducers: {
    resetAppTransientState() {
      log("resetAppTransientState");
      return initialState;
    },

    setAppUpdateResponse(
      state,
      action: PayloadAction<
        Partial<{ id: string; createdAt: string; error: string }>
      >
    ) {
      log("setAppUpdateResponse");
      const { id, createdAt, error } = action.payload;
      const { update } = state;
      update.gotResponse = true;
      update.error = error;
      if (!update.error && id) {
        update.manifest = {
          id,
          createdAt: createdAt ?? "",
        };
      } else {
        update.manifest = undefined;
      }
    },

    addRollerEntry(
      state,
      action: PayloadAction<Pick<DatedRoll, "dieType" | "value">>
    ) {
      log("addRollerEntry");
      const { allRolls: allItems, visibleRolls: visibleItems } = state.roller;
      const lastTimestamp =
        allItems.entities[allItems.ids.at(-1) ?? 0]?.timestamp;
      const timestamp = Math.max(
        Date.now(),
        lastTimestamp ? lastTimestamp + 1 : 0
      );
      datedRollsAdapter.addOne(allItems, {
        timestamp,
        dieType: action.payload.dieType,
        value: action.payload.value,
      });
      visibleItems.push(timestamp);
    },

    hideRollerEntry(state, action: PayloadAction<number>) {
      log("hideRollerEntry");
      const { visibleRolls: visibleItems } = state.roller;
      const i = visibleItems.indexOf(action.payload);
      if (i >= 0) {
        state.roller.visibleRolls.splice(i, 1);
      }
    },

    hideAllRollerEntries(state) {
      log("hideAllRollerEntries");
      state.roller.visibleRolls.length = 0;
    },
  },
});

export const {
  resetAppTransientState,
  setAppUpdateResponse,
  addRollerEntry,
  hideRollerEntry,
  hideAllRollerEntries,
} = appUpdateSlice.actions;
export default appUpdateSlice.reducer;
