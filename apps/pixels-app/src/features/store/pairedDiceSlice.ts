import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PairedDie } from "~/app/PairedDie";
import { FactoryProfile } from "~/features/profiles";
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
    | "updatePairedDieName"
    | "updatePairedDieProfile"
    | "updatePairedDieFirmwareTimestamp",
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
          | "systemId"
          | "pixelId"
          | "name"
          | "dieType"
          | "colorway"
          | "firmwareTimestamp"
        >
      >
    ) {
      const { payload } = action;
      log("addPairedDie", payload);
      const withId = ({ pixelId }: PairedDie) => pixelId === payload.pixelId;
      const index = state.paired.findIndex(withId);
      const uIndex = state.unpaired.findIndex(withId);
      const { systemId, pixelId, name, dieType, colorway, firmwareTimestamp } =
        payload;
      const die = {
        systemId,
        pixelId,
        name,
        dieType,
        colorway,
        firmwareTimestamp,
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

    updatePairedDieProfile(
      state,
      action: PayloadAction<{
        pixelId: number;
        profileUuid: string;
      }>
    ) {
      const { payload } = action;
      log("updatePairedDieProfile", payload);
      const pairedDie = state.paired.find(
        ({ pixelId }) => pixelId === payload.pixelId
      );
      if (pairedDie) {
        pairedDie.profileUuid = payload.profileUuid;
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
  updatePairedDieProfile,
  updatePairedDieFirmwareTimestamp,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
