import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DieData {
  pixelId: number;
  name: string;
  profileUuid?: string;
}

export interface PairedDiceState {
  pixelsIds: number[];
  diceData: DieData[];
}

const initialState: PairedDiceState = {
  pixelsIds: [],
  diceData: [],
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
      if (!state.pixelsIds.includes(action.payload.pixelId)) {
        state.pixelsIds.push(action.payload.pixelId);
      }
      const index = state.diceData.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (index !== -1) {
        state.diceData[index].name = action.payload.name;
      } else {
        state.diceData.push({
          pixelId: action.payload.pixelId,
          name: action.payload.name,
        });
      }
    },
    removePairedDie(state, action: PayloadAction<number>) {
      const index = state.pixelsIds.indexOf(action.payload);
      if (index !== -1) {
        state.pixelsIds.splice(index, 1);
      }
    },
    removeAllPairedDie(state) {
      state.pixelsIds.length = 0;
      state.diceData.length = 0;
    },
    setPairedDieProfile(
      state,
      action: PayloadAction<{
        pixelId: number;
        profileUuid: string;
      }>
    ) {
      const index = state.diceData.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (index !== -1) {
        state.diceData[index].profileUuid = action.payload.profileUuid;
      }
    },
  },
});

export const {
  addPairedDie,
  removePairedDie,
  removeAllPairedDie,
  setPairedDieProfile,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
