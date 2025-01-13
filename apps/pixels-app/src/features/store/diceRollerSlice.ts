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

function generateTimestamp(state: DiceRollerState) {
  const { allRolls } = state;
  const lastTimestamp = allRolls.entities[allRolls.ids.at(-1) ?? -1]?.timestamp;
  return Math.max(Date.now(), (lastTimestamp ?? -1) + 1);
}

// 128 because we are geeks!
function keepLessThan128Rolls(state: DiceRollerState) {
  const { allRolls, visibleRolls } = state;
  if (allRolls.ids.length >= 128) {
    const oldest = allRolls.ids[0];
    datedRollsAdapter.removeOne(allRolls, oldest);
    const i = visibleRolls.indexOf(oldest as number);
    if (i >= 0) {
      visibleRolls.splice(i, 1);
    }
  }
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
      if (!state.paused) {
        log("addRollerEntry");
        keepLessThan128Rolls(state);
        const { allRolls, visibleRolls } = state;
        const timestamp = generateTimestamp(state);
        const { pixelId, dieType, value } = action.payload;
        datedRollsAdapter.addOne(allRolls, {
          timestamp,
          pixelId,
          dieType,
          value,
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
