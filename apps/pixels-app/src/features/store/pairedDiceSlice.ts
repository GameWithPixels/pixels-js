import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { getFactoryProfileUuid } from "./library/factory";
import { PairedDie } from "../../app/PairedDie";

import { getTimeStringMs, unsigned32ToHex } from "~/features/utils";

export interface PairedDiceState {
  paired: PairedDie[];
  unpaired: PairedDie[];
}

const initialState: PairedDiceState = {
  paired: [],
  unpaired: [],
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
      state.paired = [];
      state.unpaired = [];
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
      const index = state.paired.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      const uIndex = state.unpaired.findIndex(
        ({ pixelId }) => pixelId === action.payload.pixelId
      );
      const { systemId, pixelId, name, dieType, colorway } = action.payload;
      const dieInfo = {
        systemId,
        pixelId,
        name,
        dieType,
        colorway,
        profileUuid:
          index >= 0
            ? state.paired[uIndex].profileUuid
            : uIndex >= 0
              ? state.unpaired[uIndex].profileUuid
              : getFactoryProfileUuid(dieType),
      };
      if (index >= 0) {
        state.paired[index] = dieInfo;
      } else {
        state.paired.push(dieInfo);
      }
      if (uIndex >= 0) {
        state.unpaired.splice(uIndex, 1);
      }
    },

    removePairedDie(state, action: PayloadAction<number>) {
      log("removePairedDie", action.payload);
      const index = state.paired.findIndex(
        ({ pixelId }) => pixelId === action.payload
      );
      if (index >= 0) {
        state.paired.splice(index, 1);
        const uIndex = state.unpaired.findIndex(
          ({ pixelId }) => pixelId === action.payload
        );
        if (uIndex >= 0) {
          state.unpaired[uIndex] = state.paired[index];
        } else {
          state.unpaired.push(state.paired[index]);
        }
      } else {
        reportError(
          `PairedDiceSlice.removePairedDie: no paired die with pixelId ${unsigned32ToHex(
            action.payload
          )}`
        );
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
      const pairedDie = state.paired.find(
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
      const pairedDie = state.paired.find(
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
