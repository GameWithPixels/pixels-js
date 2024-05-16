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
  editableProfile?: {
    profileUuid: string;
    version: number;
  };
}

const initialState: AppTransientState = { update: { gotResponse: false } };

function log(
  action:
    | "resetAppTransientState"
    | "setAppUpdateResponse"
    | "touchEditableProfile"
    | "clearEditableProfile",
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
    touchEditableProfile(
      state,
      action: PayloadAction<{ profileUuid: string }>
    ) {
      if (state.editableProfile?.profileUuid === action.payload.profileUuid) {
        state.editableProfile.version++;
      } else {
        state.editableProfile = {
          profileUuid: action.payload.profileUuid,
          version: 0,
        };
      }
      log("touchEditableProfile", state.editableProfile?.version);
    },
    clearEditableProfile(state) {
      log("clearEditableProfile");
      state.editableProfile = undefined;
    },
  },
});

export const {
  resetAppTransientState,
  setAppUpdateResponse,
  touchEditableProfile,
  clearEditableProfile,
} = appUpdateSlice.actions;
export default appUpdateSlice.reducer;
