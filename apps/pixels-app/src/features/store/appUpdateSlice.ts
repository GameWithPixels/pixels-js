import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { getTimeStringMs } from "~/features/utils";

export interface AppUpdateState {
  gotResponse: boolean;
  manifest?: {
    id: string;
    createdAt: string;
  };
  error?: string;
}

const initialState: AppUpdateState = { gotResponse: false };

function log(action: "resetAppUpdate" | "setAppUpdateResponse") {
  if (__DEV__) {
    console.log(`[${getTimeStringMs()}] Store Write ${action}`);
  }
}

// Redux slice that stores app settings
const appUpdateSlice = createSlice({
  name: "appUpdate",
  initialState,
  reducers: {
    resetAppUpdate() {
      log("resetAppUpdate");
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
      state.gotResponse = true;
      state.error = error;
      if (!state.error && id) {
        state.manifest = {
          id,
          createdAt: createdAt ?? "",
        };
      } else {
        state.manifest = undefined;
      }
    },
  },
});

export const { resetAppUpdate, setAppUpdateResponse } = appUpdateSlice.actions;
export default appUpdateSlice.reducer;
