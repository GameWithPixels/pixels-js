import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

export interface DiceTransientState {
  transfer?: {
    pixelId: number;
    profileUuid: string;
  };
}

const initialState: DiceTransientState = {};

function log(
  action:
    | "resetDiceTransientState"
    | "setProfileTransfer"
    | "clearProfileTransfer"
) {
  logWrite(action);
}

// Redux slice that stores information about paired dice rolls
const DiceRollsSlice = createSlice({
  name: "DiceTransient",
  initialState,
  reducers: {
    resetDiceTransientState() {
      log("resetDiceTransientState");
      return initialState;
    },
    setProfileTransfer(
      state,
      action: PayloadAction<{
        pixelId: number;
        profileUuid: string;
      }>
    ) {
      log("setProfileTransfer");
      const { pixelId, profileUuid } = action.payload;
      state.transfer = { pixelId, profileUuid };
    },
    clearProfileTransfer(state) {
      log("clearProfileTransfer");
      state.transfer = undefined;
    },
  },
});

export const {
  resetDiceTransientState,
  setProfileTransfer,
  clearProfileTransfer,
} = DiceRollsSlice.actions;
export default DiceRollsSlice.reducer;
