import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { getFactoryProfileUuid } from "./profiles";

export interface PairedDie {
  systemId: string;
  address: number;
  pixelId: number;
  name: string;
  isPaired: boolean; // Move unpaired dice to a separate list
  dieType: PixelDieType;
  colorway: PixelColorway;
  profileUuid: string;
}

export interface PairedDiceState {
  dice: PairedDie[];
}

const initialState: PairedDiceState = {
  dice: [],
};

function storeLog(
  action:
    | "addPairedDie"
    | "removePairedDie"
    | "resetPairedDice"
    | "resetPairedDice"
    | "setPairedDieName"
    | "setPairedDieProfile",
  payload?: any
) {
  console.log("STORE " + action + " " + JSON.stringify(payload));
}

// Redux slice that stores information about paired dice
const PairedDiceSlice = createSlice({
  name: "PairedDice",
  initialState,
  reducers: {
    addPairedDie(
      state,
      action: PayloadAction<{
        systemId: string;
        address: number;
        pixelId: number;
        name: string;
        dieType: PixelDieType;
        colorway: PixelColorway;
      }>
    ) {
      storeLog("addPairedDie", action.payload);
      const index = state.dice.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (index !== -1) {
        state.dice[index].name = action.payload.name;
        state.dice[index].isPaired = true;
      } else {
        const { systemId, address, pixelId, name, dieType, colorway } =
          action.payload;
        state.dice.push({
          systemId,
          address,
          pixelId,
          name,
          dieType,
          colorway,
          isPaired: true,
          profileUuid: getFactoryProfileUuid(dieType),
        });
      }
    },
    removePairedDie(state, action: PayloadAction<number>) {
      storeLog("removePairedDie", action.payload);
      const pairedDie = state.dice.find(
        ({ pixelId }) => pixelId === action.payload
      );
      if (pairedDie) {
        pairedDie.isPaired = false;
      }
    },
    resetPairedDice(state) {
      storeLog("resetPairedDice");
      state.dice = [];
    },
    setPairedDieName(
      state,
      action: PayloadAction<{
        pixelId: number;
        name: string;
      }>
    ) {
      storeLog("setPairedDieName", action.payload);
      const pairedDie = state.dice.find(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (pairedDie) {
        pairedDie.name = action.payload.name;
      }
    },
    setPairedDieProfile(
      state,
      action: PayloadAction<{
        pixelId: number;
        profileUuid: string;
      }>
    ) {
      storeLog("setPairedDieProfile", action.payload);
      const pairedDie = state.dice.find(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      if (pairedDie) {
        pairedDie.profileUuid = action.payload.profileUuid;
      }
    },
  },
});

export const {
  addPairedDie,
  removePairedDie,
  resetPairedDice,
  setPairedDieName,
  setPairedDieProfile,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
