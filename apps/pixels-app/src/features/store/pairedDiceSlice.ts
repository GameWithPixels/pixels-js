import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { FactoryProfile } from "../profiles";

import { PairedDie } from "~/app/PairedDie";
import { getTimeStringMs, logError, unsigned32ToHex } from "~/features/utils";

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
      action: PayloadAction<
        Pick<
          PairedDie,
          "systemId" | "pixelId" | "name" | "dieType" | "colorway"
        >
      >
    ) {
      log("addPairedDie", action.payload);
      const withId = ({ pixelId }: PairedDie) =>
        pixelId === action.payload.pixelId;
      const index = state.paired.findIndex(withId);
      const uIndex = state.unpaired.findIndex(withId);
      const { systemId, pixelId, name, dieType, colorway } = action.payload;
      const die = {
        systemId,
        pixelId,
        name,
        dieType,
        colorway,
        profileUuid:
          state.paired[index]?.profileUuid ??
          state.unpaired[uIndex]?.profileUuid ??
          FactoryProfile.getUuid(dieType),
      };
      if (index >= 0) {
        state.paired[index] = die;
      } else {
        state.paired.push(die);
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
        const pairedDie = state.paired[index];
        state.paired.splice(index, 1);
        const uIndex = state.unpaired.findIndex(
          ({ pixelId }) => pixelId === action.payload
        );
        if (uIndex >= 0) {
          logError(
            `PairedDiceSlice.removePairedDie: die was both paired and unpaired, pixelId is ${unsigned32ToHex(
              action.payload
            )}`
          );
          state.unpaired[uIndex] = pairedDie;
        } else {
          state.unpaired.push(pairedDie);
        }
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
