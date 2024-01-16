import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { getFactoryProfileUuid } from "./library/factory";

import { getTimeStringMs } from "~/features/utils";

export interface PairedDie {
  isPaired: boolean; // Move unpaired dice to a separate list
  systemId: string;
  address: number;
  pixelId: number;
  name: string;
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

function log(
  action:
    | "addPairedDie"
    | "removePairedDie"
    | "resetPairedDice"
    | "resetPairedDice"
    | "setPairedDieName"
    | "setPairedDieProfile",
  payload?: any
) {
  if (__DEV__) {
    console.log(
      `[${getTimeStringMs()}] Store Write ${action}, payload: ${JSON.stringify(
        payload
      )}`
    );
  }
}

// Redux slice that stores information about paired dice
const PairedDiceSlice = createSlice({
  name: "PairedDice",
  initialState,
  reducers: {
    resetPairedDice(state) {
      log("resetPairedDice");
      state.dice = [];
    },
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
      log("addPairedDie", action.payload);
      const index = state.dice.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      const { systemId, address, pixelId, name, dieType, colorway } =
        action.payload;
      const dieInfo = {
        isPaired: true,
        systemId,
        address,
        pixelId,
        name,
        dieType,
        colorway,
        profileUuid: getFactoryProfileUuid(dieType),
      };
      if (index !== -1) {
        state.dice[index] = dieInfo;
      } else {
        state.dice.push(dieInfo);
      }
    },
    removePairedDie(state, action: PayloadAction<number>) {
      log("removePairedDie", action.payload);
      const pairedDie = state.dice.find(
        ({ pixelId }) => pixelId === action.payload
      );
      if (pairedDie) {
        pairedDie.isPaired = false;
      }
    },
    setPairedDieName(
      state,
      action: PayloadAction<{
        pixelId: number;
        name: string;
      }>
    ) {
      log("setPairedDieName", action.payload);
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
      log("setPairedDieProfile", action.payload);
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
