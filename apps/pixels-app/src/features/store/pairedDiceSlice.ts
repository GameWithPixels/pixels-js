import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";

import { logWrite } from "./logWrite";

import { PairedDie } from "~/app/PairedDie";
import { logError } from "~/features/utils";

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
    | "updatePairedDieFirmwareTimestamp"
    | "updatePairedDieProfileHash"
    | "updatePairedDieBrightness",
  payload?: unknown
) {
  logWrite(`${action}, payload: ${JSON.stringify(payload)}`);
}

// Redux slice that stores information about paired dice
const PairedDiceSlice = createSlice({
  name: "PairedDice",
  initialState,
  reducers: {
    resetPairedDice() {
      log("resetPairedDice");
      return initialState;
    },

    addPairedDie(state, action: PayloadAction<Omit<PairedDie, "profileHash">>) {
      const { payload } = action;
      log("addPairedDie", payload);
      const index = state.paired.findIndex(
        (d) => d.pixelId === payload.pixelId
      );
      const die = {
        systemId: payload.systemId,
        pixelId: payload.pixelId,
        name: payload.name,
        ledCount: payload.ledCount,
        colorway: payload.colorway,
        dieType: payload.dieType,
        firmwareTimestamp: payload.firmwareTimestamp,
        profileHash: 0,
        profileUuid: payload.profileUuid,
        brightness: payload.brightness,
      };
      if (index >= 0) {
        state.paired[index] = die;
      } else {
        state.paired.push(die);
      }
      const unpairIndex = state.unpaired.findIndex(
        ({ pixelId }) => pixelId === payload.pixelId
      );
      if (unpairIndex >= 0) {
        state.unpaired.splice(unpairIndex, 1);
      }
    },

    removePairedDie(state, action: PayloadAction<number>) {
      const { payload } = action;
      log("removePairedDie", payload);
      const index = state.paired.findIndex((i) => i.pixelId === payload);
      if (index >= 0) {
        const die = state.paired[index];
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
          state.unpaired[uIndex] = die;
        } else {
          state.unpaired.push(die);
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
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (die) {
        die.name = payload.name;
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
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (
        die &&
        payload.timestamp > 0 &&
        die.firmwareTimestamp !== payload.timestamp
      ) {
        log("updatePairedDieFirmwareTimestamp", payload);
        die.firmwareTimestamp = payload.timestamp;
      }
    },

    updatePairedDieProfileHash(
      state,
      action: PayloadAction<{
        pixelId: number;
        hash: number;
      }>
    ) {
      const { payload } = action;
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (die && die.profileHash !== payload.hash) {
        log("updatePairedDieProfileHash", payload);
        die.profileHash = payload.hash;
      }
    },

    updatePairedDieBrightness(
      state,
      action: PayloadAction<{
        pixelId: number;
        brightness: number;
      }>
    ) {
      const { payload } = action;
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (die && die.brightness !== payload.brightness) {
        log("updatePairedDieBrightness", payload);
        die.brightness = payload.brightness;
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
  updatePairedDieProfileHash,
  updatePairedDieBrightness,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
