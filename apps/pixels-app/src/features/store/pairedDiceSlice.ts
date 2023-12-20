import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PairedDie {
  paired: boolean;
  pixelId: number;
  name: string;
  profileUuid?: string;
  rolls: number[];
}

export interface PairedDiceState {
  data: PairedDie[];
}

const initialState: PairedDiceState = {
  data: [],
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
      const index = state.data.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (index !== -1) {
        state.data[index].name = action.payload.name;
      } else {
        state.data.push({
          paired: true,
          pixelId: action.payload.pixelId,
          name: action.payload.name,
          rolls: [],
        });
      }
    },
    removePairedDie(state, action: PayloadAction<number>) {
      const pairedDie = state.data.find(
        ({ pixelId }) => pixelId === action.payload
      );
      if (pairedDie) {
        pairedDie.paired = false;
      }
    },
    resetPairedDice(state) {
      state.data = [];
    },
    setPairedDieProfile(
      state,
      action: PayloadAction<{
        pixelId: number;
        profileUuid: string;
      }>
    ) {
      const pairedDie = state.data.find(
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
      const pairedDie = state.data.find(
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
