import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";

import { logWrite } from "./logWrite";

import { PairedDie } from "~/app/PairedDie";
import { logError } from "~/features/utils";

export type PairedDiceState = {
  paired: PairedDie[];
  unpaired: PairedDie[];
};

const initialState: PairedDiceState = {
  paired: [],
  unpaired: [],
};

function log(
  action:
    | "resetPairedDice"
    | "addPairedDie"
    | "removePairedDie"
    | "updatePairedDieName"
    | "updatePairedDieFirmwareTimestamp"
    | "updatePairedDieProfileHash"
    | "updatePairedDieBrightness",
  payload?: unknown,
  extra?: string
) {
  logWrite(
    `${action}, payload: ${JSON.stringify(payload)}${extra ? ", " + extra : ""}`
  );
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

    addPairedDie(
      state,
      { payload }: PayloadAction<Omit<PairedDie, "profileHash">>
    ) {
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

    removePairedDie(state, { payload }: PayloadAction<number>) {
      const index = state.paired.findIndex((i) => i.pixelId === payload);
      if (index >= 0) {
        log("removePairedDie", payload);
        const die = state.paired[index];
        state.paired.splice(index, 1);
        const uIndex = state.unpaired.findIndex(
          ({ pixelId }) => pixelId === payload
        );
        if (uIndex >= 0) {
          logError(
            `removePairedDie: die ${unsigned32ToHex(payload)} was both paired and unpaired`
          );
          state.unpaired[uIndex] = die;
        } else {
          state.unpaired.push(die);
        }
      }
    },

    updatePairedDieName(
      state,
      {
        payload,
      }: PayloadAction<{
        pixelId: number;
        name: string;
      }>
    ) {
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (die && die.name !== payload.name) {
        log("updatePairedDieName", payload);
        die.name = payload.name;
      }
    },

    updatePairedDieFirmwareTimestamp(
      state,
      {
        payload,
      }: PayloadAction<{
        pixelId: number;
        timestamp: number;
      }>
    ) {
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (die && die.firmwareTimestamp !== payload.timestamp) {
        log("updatePairedDieFirmwareTimestamp", payload);
        die.firmwareTimestamp = payload.timestamp;
      }
    },

    updatePairedDieProfileHash(
      state,
      {
        payload,
      }: PayloadAction<{
        pixelId: number;
        hash: number;
      }>
    ) {
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (die && die.profileHash !== payload.hash) {
        log("updatePairedDieProfileHash", payload, `was: ${die.profileHash}`);
        die.profileHash = payload.hash;
      }
    },

    updatePairedDieBrightness(
      state,
      {
        payload,
      }: PayloadAction<{
        pixelId: number;
        brightness: number;
      }>
    ) {
      const die = state.paired.find((d) => d.pixelId === payload.pixelId);
      if (die && die.brightness !== payload.brightness) {
        log("updatePairedDieBrightness", payload, `was: ${die.brightness}`);
        die.brightness = payload.brightness;
      }
    },
  },
});

export const {
  resetPairedDice,
  addPairedDie,
  removePairedDie,
  updatePairedDieName,
  updatePairedDieFirmwareTimestamp,
  updatePairedDieProfileHash,
  updatePairedDieBrightness,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
