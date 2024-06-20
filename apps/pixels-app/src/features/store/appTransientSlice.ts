import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { logWrite } from "./logWrite";

export interface AppTransientState {
  update: {
    gotResponse: boolean;
    manifest?: {
      id: string;
      createdAt: string;
    };
    error?: string;
  };
}

const initialState: AppTransientState = {
  update: { gotResponse: false },
};

function log(
  action: "resetAppTransientState" | "setAppUpdateResponse",
  value?: unknown
) {
  logWrite(action + (value !== undefined ? `: ${value}` : ""));
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
  },
});

export const { resetAppTransientState, setAppUpdateResponse } =
  appUpdateSlice.actions;
export default appUpdateSlice.reducer;
