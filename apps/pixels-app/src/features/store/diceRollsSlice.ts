import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { getTimeStringMs } from "~/features/utils";

export interface DieRolls {
  pixelId: number;
  rolls: number[];
}

export interface ProfileTransfer {
  pixelId: number;
  profileUuid: string;
}

export interface DiceRollsState {
  dice: DieRolls[];
  transfer?: ProfileTransfer;
}

const initialState: DiceRollsState = {
  dice: [],
};

function log(
  action: "addDieRoll" | "setProfileTransfer" | "clearProfileTransfer"
) {
  if (__DEV__) {
    console.log(`[${getTimeStringMs()}] Store Write ${action}`);
  }
}

// Redux slice that stores information about paired dice rolls
const DiceRollsSlice = createSlice({
  name: "DiceRolls",
  initialState,
  reducers: {
    resetRollsHistory() {
      return initialState;
    },
    addDieRoll(
      state,
      action: PayloadAction<{ pixelId: number; roll: number }>
    ) {
      log("addDieRoll");
      const die = state.dice.find(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      // TODO check that is paired
      if (die) {
        die.rolls.push(action.payload.roll);
      } else {
        state.dice.push({
          pixelId: action.payload.pixelId,
          rolls: [action.payload.roll],
        });
      }
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
  resetRollsHistory,
  addDieRoll,
  setProfileTransfer,
  clearProfileTransfer,
} = DiceRollsSlice.actions;
export default DiceRollsSlice.reducer;
