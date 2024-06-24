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
  pixelId: number;
  dieType: PixelDieType;
  value: number;
}

export type DatedRollsState = EntityState<DatedRoll>;

export const datedRollsAdapter = createEntityAdapter({
  selectId: (roll: Readonly<DatedRoll>) => roll.timestamp,
});

export interface DiceRollerState {
  allRolls: DatedRollsState;
  visibleRolls: number[]; // Timestamps
  paused: boolean;
}

const initialState: DiceRollerState = {
  allRolls: datedRollsAdapter.getInitialState(),
  visibleRolls: [],
  paused: false,
};

function log(
  action:
    | "resetDiceRoller"
    | "addRollerEntry"
    | "hideRollerEntry"
    | "hideAllRollerEntries"
    | "setRollerPaused"
) {
  logWrite(action);
}

// Redux slice that stores rolls for the dice roller
const DiceRollerSlice = createSlice({
  name: "DiceRoller",
  initialState,
  reducers: {
    resetDiceRoller() {
      log("resetDiceRoller");
      return initialState;
    },

    addRollerEntry(state, action: PayloadAction<Omit<DatedRoll, "timestamp">>) {
      log("addRollerEntry");
      if (!state.paused) {
        const { allRolls, visibleRolls } = state;
        const lastTimestamp =
          allRolls.entities[allRolls.ids.at(-1) ?? -1]?.timestamp;
        const timestamp = Math.max(
          Date.now(),
          lastTimestamp ? lastTimestamp + 1 : 0
        );
        // Keep 100 items max
        const oldest = allRolls.ids.at(-1) as number;
        if (oldest && allRolls.ids.length > 100) {
          datedRollsAdapter.removeOne(allRolls, oldest);
          if (visibleRolls.includes(oldest)) {
            visibleRolls.splice(visibleRolls.indexOf(oldest), 1);
          }
        }
        datedRollsAdapter.addOne(allRolls, {
          timestamp,
          pixelId: action.payload.pixelId,
          dieType: action.payload.dieType,
          value: action.payload.value,
        });
        visibleRolls.push(timestamp);
      }
    },

    hideRollerEntry(state, action: PayloadAction<number>) {
      log("hideRollerEntry");
      const i = state.visibleRolls.indexOf(action.payload);
      if (i >= 0) {
        state.visibleRolls.splice(i, 1);
      }
    },

    hideAllRollerEntries(state) {
      log("hideAllRollerEntries");
      state.visibleRolls.length = 0;
    },

    setRollerPaused(state, action: PayloadAction<boolean>) {
      log("setRollerPaused");
      state.paused = action.payload;
    },
  },
});

export const {
  resetDiceRoller,
  addRollerEntry,
  hideRollerEntry,
  hideAllRollerEntries,
  setRollerPaused,
} = DiceRollerSlice.actions;
export default DiceRollerSlice.reducer;
