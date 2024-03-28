import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

export interface DieStats {
  pixelId: number;
  rolls: number[];
}

export type DieStatsState = EntityState<DieStats>;

export const dieStatsAdapter = createEntityAdapter({
  selectId: (dieStats: DieStats) => dieStats.pixelId,
});

function log(action: "resetDiceStats" | "addDieRoll") {
  logWrite(action);
}

// Redux slice that stores paired dice statistics
const DiceStatsSlice = createSlice({
  name: "DiceStats",
  initialState: dieStatsAdapter.getInitialState(),
  reducers: {
    resetDiceStats() {
      log("resetDiceStats");
      return dieStatsAdapter.getInitialState();
    },
    addDieRoll(
      state,
      action: PayloadAction<{ pixelId: number; roll: number }>
    ) {
      log("addDieRoll");
      const { pixelId, roll } = action.payload;
      const stats = state.entities[pixelId] ?? { pixelId, rolls: [] };
      stats.rolls.push(roll);
      dieStatsAdapter.setOne(state, stats);
    },
  },
});

export const { resetDiceStats, addDieRoll } = DiceStatsSlice.actions;
export default DiceStatsSlice.reducer;
