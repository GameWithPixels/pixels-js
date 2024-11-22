import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

import { MPCRole, MPCRoles, PairedMPC } from "~/app/PairedMPC";

export interface PairedMPCsState {
  paired: PairedMPC[];
}

const initialState: PairedMPCsState = {
  paired: [],
};

function log(
  action: "resetPairedMPCs" | "addPairedMPC" | "removePairedMPC" | "setMPCRole",
  payload?: unknown
) {
  logWrite(`${action}, payload: ${JSON.stringify(payload)}`);
}

// Redux slice that stores information about paired dice
const PairedDiceSlice = createSlice({
  name: "PairedDice",
  initialState,
  reducers: {
    resetPairedMPCs() {
      log("resetPairedMPCs");
      return initialState;
    },

    addPairedMPC(
      state,
      action: PayloadAction<Omit<PairedMPC, "profileHash" | "role">>
    ) {
      const { payload } = action;
      log("addPairedMPC", payload);
      const index = state.paired.findIndex(
        (d) => d.pixelId === payload.pixelId
      );
      // Assign role
      const role =
        MPCRoles.find((r) => !state.paired.find((d) => d.role === r)) ??
        "panel";
      const mpc = {
        systemId: payload.systemId,
        pixelId: payload.pixelId,
        name: payload.name,
        ledCount: payload.ledCount,
        firmwareTimestamp: payload.firmwareTimestamp,
        profileHash: 0,
        role,
      };
      if (index >= 0) {
        state.paired[index] = mpc;
      } else {
        state.paired.push(mpc);
      }
    },

    removePairedMPC(state, action: PayloadAction<number>) {
      const { payload } = action;
      const index = state.paired.findIndex((i) => i.pixelId === payload);
      if (index >= 0) {
        log("removePairedMPC", payload);
        state.paired.splice(index, 1);
      }
    },

    setPairedMPCRole(
      state,
      action: PayloadAction<{ pixelId: number; role: MPCRole }>
    ) {
      const { pixelId, role } = action.payload;
      const index = state.paired.findIndex((i) => i.pixelId === pixelId);
      if (index >= 0) {
        log("setMPCRole", action.payload);
        state.paired[index].role = role;
      }
    },
  },
});

export const {
  resetPairedMPCs,
  addPairedMPC,
  removePairedMPC,
  setPairedMPCRole,
} = PairedDiceSlice.actions;
export default PairedDiceSlice.reducer;
