import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";

import { logWrite } from "./logWrite";

import { PairedDie } from "~/app/PairedDie";
import { logError } from "~/features/utils";

export interface PairedDiceState {
  paired: {
    die: PairedDie;
    profile: {
      hash: number; // Hash of the bound profile to be programmed
      sourceUuid?: string; // Profile used as the source for the die's profile
    };
  }[];
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
    | "updatePairedDieProfileInfo",
  payload?: any
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
        (i) => i.die.pixelId === payload.pixelId
      );
      const pairedDie = {
        systemId: payload.systemId,
        pixelId: payload.pixelId,
        name: payload.name,
        ledCount: payload.ledCount,
        colorway: payload.colorway,
        dieType: payload.dieType,
        firmwareTimestamp: payload.firmwareTimestamp,
        profileUuid: payload.profileUuid,
        profileHash: 0,
        pendingProfileHash: 0,
      };
      const item = {
        die: pairedDie,
        profile: {
          hash: 0,
          sourceUuid: undefined,
        },
      };
      if (index >= 0) {
        state.paired[index] = item;
      } else {
        state.paired.push(item);
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
      const index = state.paired.findIndex((i) => i.die.pixelId === payload);
      if (index >= 0) {
        const { die } = state.paired[index];
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
      const item = state.paired.find((i) => i.die.pixelId === payload.pixelId);
      if (item?.die) {
        item.die.name = payload.name;
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
      const item = state.paired.find((i) => i.die.pixelId === payload.pixelId);
      if (item && payload.timestamp > 0) {
        item.die.firmwareTimestamp = payload.timestamp;
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
      log("updatePairedDieProfileHash", payload);
      const item = state.paired.find((i) => i.die.pixelId === payload.pixelId);
      if (item) {
        item.die.profileHash = payload.hash;
      }
    },

    updatePairedDieProfileInfo(
      state,
      action: PayloadAction<{
        pixelId: number;
        hash: number;
        sourceProfileUuid?: string | false;
      }>
    ) {
      const { payload } = action;
      log("updatePairedDieProfileInfo", payload);
      const item = state.paired.find((i) => i.die.pixelId === payload.pixelId);
      if (item) {
        item.profile.hash = payload.hash;
        if (payload.sourceProfileUuid === false) {
          item.profile.sourceUuid = undefined;
        } else if (payload.sourceProfileUuid !== item.die.profileUuid) {
          item.profile.sourceUuid = payload.sourceProfileUuid;
        }
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
  updatePairedDieProfileInfo,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
