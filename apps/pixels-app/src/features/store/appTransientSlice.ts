import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

export type DfuFilesInfo = {
  timestamp: number;
  firmwarePath: string;
  bootloaderPath?: string;
};

export interface AppTransientState {
  update: {
    gotResponse: boolean;
    manifest?: {
      id: string;
      createdAt: string;
    };
    error?: string;
  };
  dfuFilesStatus?: DfuFilesInfo | string; // String is the error message
  dice: {
    selectedDieId?: number;
    transferProgress: {
      [dieId: number]: number;
    };
  };
}

const initialState: AppTransientState = {
  update: { gotResponse: false },
  dice: { transferProgress: {} },
};

function log(
  action:
    | "resetAppTransientState"
    | "setAppUpdateResponse"
    | "setDfuFilesStatus"
    | "setSelectedDieId"
) {
  logWrite(action);
}

// Redux slice that stores app settings
const appUpdateSlice = createSlice({
  name: "appTransient",
  initialState,
  reducers: {
    resetAppTransientState() {
      log("resetAppTransientState");
      return initialState;
    },

    setAppUpdateResponse(
      state,
      action: PayloadAction<
        Partial<{ id: string; createdAt: string; error: string }>
      >
    ) {
      log("setAppUpdateResponse");
      const { id, createdAt, error } = action.payload;
      const { update } = state;
      update.gotResponse = true;
      update.error = error;
      if (!update.error && id) {
        update.manifest = {
          id,
          createdAt: createdAt ?? "",
        };
      } else {
        update.manifest = undefined;
      }
    },

    setDfuFilesStatus(state, action: PayloadAction<DfuFilesInfo | string>) {
      log("setDfuFilesStatus");
      state.dfuFilesStatus = action.payload;
    },

    setSelectedDieId(state, action: PayloadAction<number>) {
      log("setSelectedDieId");
      state.dice.selectedDieId = action.payload;
    },
  },
});

export const {
  resetAppTransientState,
  setAppUpdateResponse,
  setDfuFilesStatus,
  setSelectedDieId,
} = appUpdateSlice.actions;
export default appUpdateSlice.reducer;
