import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DieInfo {
  systemId: string;
  profileUuid?: string;
}

export interface PairedDiceState {
  dice: DieInfo[];
}

const initialState: PairedDiceState = { dice: [] };

// Redux slice that stores a list of paired dice
const pairedDiceSlice = createSlice({
  name: "pairedDice",
  initialState,
  reducers: {
    updatePairedDie(state, action: PayloadAction<DieInfo>) {
      const pairedDie = action.payload;
      const index = state.dice.findIndex(
        (d) => d.systemId === pairedDie.systemId
      );
      if (index >= 0) {
        state.dice[index] = pairedDie;
      } else {
        state.dice.push(pairedDie);
      }
    },

    removePairedDie(state, action: PayloadAction<string>) {
      const index = state.dice.findIndex((d) => d.systemId === action.payload);
      if (index >= 0) {
        state.dice.splice(index, 1);
      } else {
        console.log(
          `Paired die not found in state, systemId is ${action.payload}`
        );
      }
    },

    removeAllPairedDice(state) {
      state.dice = [];
    },
  },
});

export const { updatePairedDie, removePairedDie, removeAllPairedDice } =
  pairedDiceSlice.actions;
export default pairedDiceSlice.reducer;
