import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

import { PairedDie } from "~/app/PairedDie";
import { logError, unsigned32ToHex } from "~/features/utils";

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
    | "updatePairedDieName"
    | "updatePairedDieFirmwareTimestamp",
  payload?: any
) {
  logWrite(`${action}, payload: ${JSON.stringify(payload)}`);
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

    addPairedDie(state, action: PayloadAction<PairedDie>) {
      const { payload } = action;
      log("addPairedDie", payload);
      const withId = ({ pixelId }: PairedDie) => pixelId === payload.pixelId;
      const index = state.paired.findIndex(withId);
      if (index >= 0) {
        state.paired[index] = payload;
      } else {
        state.paired.push(payload);
      }
      const unpairIndex = state.unpaired.findIndex(withId);
      if (unpairIndex >= 0) {
        state.unpaired.splice(unpairIndex, 1);
      }
    },

    removePairedDie(state, action: PayloadAction<number>) {
      const { payload } = action;
      log("removePairedDie", payload);
      const index = state.paired.findIndex(
        ({ pixelId }) => pixelId === payload
      );
      if (index >= 0) {
        const pairedDie = state.paired[index];
        state.paired.splice(index, 1);
        const uIndex = state.unpaired.findIndex(
          ({ pixelId }) => pixelId === payload
        );
        if (uIndex >= 0) {
          logError(
            `PairedDiceSlice.removePairedDie: die was both paired and unpaired, pixelId is ${unsigned32ToHex(
              payload
            )}`
          );
          state.unpaired[uIndex] = pairedDie;
        } else {
          state.unpaired.push(pairedDie);
        }
      }
    },

    updatePairedDieName(
      state,
      action: PayloadAction<{
        pixelId: number;
        name: string;
      }>
    ) {
      const { payload } = action;
      log("updatePairedDieName", payload);
      const pairedDie = state.paired.find(
        ({ pixelId }) => pixelId === payload.pixelId
      );
      if (pairedDie) {
        pairedDie.name = payload.name;
      }
    },

    updatePairedDieFirmwareTimestamp(
      state,
      action: PayloadAction<{
        pixelId: number;
        timestamp: number;
      }>
    ) {
      const { payload } = action;
      log("updatePairedDieFirmwareTimestamp", payload);
      const pairedDie = state.paired.find(
        ({ pixelId }) => pixelId === payload.pixelId
      );
      if (pairedDie && payload.timestamp > 0) {
        pairedDie.firmwareTimestamp = payload.timestamp;
      }
    },
  },
});

export const {
  addPairedDie,
  removePairedDie,
  resetPairedDice,
  updatePairedDieName,
  updatePairedDieFirmwareTimestamp,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
