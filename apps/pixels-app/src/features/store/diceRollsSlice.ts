import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

// Redux slice that stores information about paired dice rolls
const DiceRollsSlice = createSlice({
  name: "DiceRolls",
  initialState,
  reducers: {
    addDieRoll(
      state,
      action: PayloadAction<{ pixelId: number; roll: number }>
    ) {
      console.log("STORE addDieRoll");
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
    setProfileTransfer(
      state,
      action: PayloadAction<{
        pixelId: number;
        profileUuid: string;
      }>
    ) {
      console.log("STORE setProfileTransfer");
      const { pixelId, profileUuid } = action.payload;
      state.transfer = { pixelId, profileUuid };
    },
    clearProfileTransfer(state) {
      console.log("STORE clearProfileTransfer");
      state.transfer = undefined;
    },
  },
});

export const { addDieRoll, setProfileTransfer, clearProfileTransfer } =
  DiceRollsSlice.actions;
export default DiceRollsSlice.reducer;
