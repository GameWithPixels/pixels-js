import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DieRolls {
  pixelId: number;
  rolls: number[];
}

export interface DiceRollsState {
  dice: DieRolls[];
}

const initialState: DiceRollsState = {
  dice: [],
};

// Redux slice that stores information about paired dice rolls
const DiceRollsSlice = createSlice({
  name: "DiceRolls",
  initialState,
  reducers: {
    addDieRoll(
      state,
      action: PayloadAction<{ pixelId: number; roll: number }>
    ) {
      const pair = state.dice.find(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (pair) {
        pair.rolls.push(action.payload.roll);
      } else {
        state.dice.push({
          pixelId: action.payload.pixelId,
          rolls: [action.payload.roll],
        });
      }
    },
  },
});

export const { addDieRoll } = DiceRollsSlice.actions;
export default DiceRollsSlice.reducer;
