import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PairedDie {
  pixelId: number;
  name: string;
  isPaired: boolean;
  profileUuid?: string;
  rolls: number[];
}

export interface PairedDiceState {
  dice: PairedDie[];
}

const initialState: PairedDiceState = {
  dice: [],
};

// Redux slice that stores information about paired dice
const PairedDiceSlice = createSlice({
  name: "PairedDice",
  initialState,
  reducers: {
    addPairedDie(
      state,
      action: PayloadAction<{ pixelId: number; name: string }>
    ) {
      const index = state.dice.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (index !== -1) {
        state.dice[index].name = action.payload.name;
        state.dice[index].isPaired = true;
      } else {
        state.dice.push({
          pixelId: action.payload.pixelId,
          name: action.payload.name,
          isPaired: true,
          rolls: [],
        });
      }
    },
    removePairedDie(state, action: PayloadAction<number>) {
      const pairedDie = state.dice.find(
        ({ pixelId }) => pixelId === action.payload
      );
      if (pairedDie) {
        pairedDie.isPaired = false;
      }
    },
    resetPairedDice(state) {
      state.dice = [];
    },
    setPairedDieProfile(
      state,
      action: PayloadAction<{
        pixelId: number;
        profileUuid: string;
      }>
    ) {
      const pairedDie = state.dice.find(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (pairedDie) {
        pairedDie.profileUuid = action.payload.profileUuid;
      }
    },
    addPairedDieRoll(
      state,
      action: PayloadAction<{ pixelId: number; roll: number }>
    ) {
      const pairedDie = state.dice.find(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (pairedDie) {
        pairedDie.rolls.push(action.payload.roll);
      }
    },
  },
});

export const {
  addPairedDie,
  removePairedDie,
  resetPairedDice,
  setPairedDieProfile,
  addPairedDieRoll,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
