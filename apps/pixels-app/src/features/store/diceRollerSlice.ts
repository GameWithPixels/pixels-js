import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

import { logWrite } from "./logWrite";

export interface RollerSingleEntry {
  timestamp: number; // Unique identifier
  pixelId: number;
  dieType: PixelDieType;
  value: number;
}

export type RollerSinglesState = EntityState<RollerSingleEntry>;

export const singleRollsAdapter = createEntityAdapter({
  selectId: (roll: Readonly<RollerSingleEntry>) => roll.timestamp,
});

export interface RollerCompositeEntry {
  timestamp: number; // Unique identifier
  formula: string;
  result: number;
  rolls: { dieType: PixelDieType; value?: number }[];
}

export type RollerCompositesState = EntityState<RollerCompositeEntry>;

export const compositeRollsAdapter = createEntityAdapter({
  selectId: (roll: Readonly<RollerCompositeEntry>) => roll.timestamp,
});

export interface DiceRollerState {
  singleRolls: RollerSinglesState;
  compositeRolls: RollerCompositesState;
  visibleRollsIds: number[]; // Timestamps
  paused: boolean;
  activeProfileUuid: string;
}

const initialState: DiceRollerState = {
  singleRolls: singleRollsAdapter.getInitialState(),
  compositeRolls: compositeRollsAdapter.getInitialState(),
  visibleRollsIds: [],
  paused: false,
  activeProfileUuid: "",
};

function log(
  action:
    | "resetDiceRoller"
    | "addSingleRollerEntry"
    | "addCompositeRollerEntry"
    | "hideRollerEntry"
    | "hideAllRollerEntries"
    | "setRollerPaused"
    | "setActiveRollerProfileUuid"
) {
  logWrite(action);
}

function generateTimestamp(state: DiceRollerState) {
  const { singleRolls, compositeRolls } = state;
  const timestampSingle =
    singleRolls.entities[singleRolls.ids.at(-1) ?? -1]?.timestamp;
  const timestampComposite =
    compositeRolls.entities[compositeRolls.ids.at(-1) ?? -1]?.timestamp;
  const timestamp = Math.max(
    Date.now(),
    (timestampSingle ?? -1) + 1,
    (timestampComposite ?? -1) + 1
  );
  return timestamp;
}

// 128 because we are geeks!
function keepLessThan128Rolls(state: DiceRollerState) {
  const { singleRolls, compositeRolls, visibleRollsIds: visibleRolls } = state;
  if (singleRolls.ids.length + compositeRolls.ids.length >= 128) {
    const oldestSingle = (singleRolls.ids[0] as number) ?? 0;
    const oldestComposite = (compositeRolls.ids[0] as number) ?? 0;
    const oldest = Math.min(oldestSingle, oldestComposite);
    if (oldest === oldestSingle) {
      singleRollsAdapter.removeOne(singleRolls, oldest);
    } else {
      compositeRollsAdapter.removeOne(compositeRolls, oldest);
    }
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

    addSingleRollerEntry(
      state,
      action: PayloadAction<Omit<RollerSingleEntry, "timestamp">>
    ) {
      if (!state.paused) {
        log("addSingleRollerEntry");
        keepLessThan128Rolls(state);
        const { singleRolls, visibleRollsIds } = state;
        const timestamp = generateTimestamp(state);
        const { pixelId, dieType, value } = action.payload;
        singleRollsAdapter.addOne(singleRolls, {
          timestamp,
          pixelId,
          dieType,
          value,
        });
        visibleRollsIds.push(timestamp);
      }
    },

    addCompositeRollerEntry(
      state,
      action: PayloadAction<Omit<RollerCompositeEntry, "timestamp">>
    ) {
      if (!state.paused) {
        log("addCompositeRollerEntry");
        keepLessThan128Rolls(state);
        const { compositeRolls, visibleRollsIds } = state;
        const timestamp = generateTimestamp(state);
        const { formula, result, rolls } = action.payload;
        compositeRollsAdapter.addOne(compositeRolls, {
          timestamp,
          formula,
          result,
          rolls: rolls.map(({ dieType, value }) => ({ dieType, value })),
        });
        visibleRollsIds.push(timestamp);
      }
    },

    hideRollerEntry(state, action: PayloadAction<number>) {
      log("hideRollerEntry");
      const i = state.visibleRollsIds.indexOf(action.payload);
      if (i >= 0) {
        state.visibleRollsIds.splice(i, 1);
      }
    },

    hideAllRollerEntries(state) {
      log("hideAllRollerEntries");
      state.visibleRollsIds.length = 0;
    },

    setRollerPaused(state, action: PayloadAction<boolean>) {
      log("setRollerPaused");
      state.paused = action.payload;
    },

    setActiveRollerProfileUuid(state, action: PayloadAction<string>) {
      log("setRollerPaused");
      state.activeProfileUuid = action.payload;
    },
  },
});

export const {
  resetDiceRoller,
  addSingleRollerEntry,
  addCompositeRollerEntry,
  hideRollerEntry,
  hideAllRollerEntries,
  setRollerPaused,
  setActiveRollerProfileUuid,
} = DiceRollerSlice.actions;
export default DiceRollerSlice.reducer;
