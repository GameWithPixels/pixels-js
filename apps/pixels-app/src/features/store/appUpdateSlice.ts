import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AppUpdateState {
  gotResponse: boolean;
  manifest?: {
    id: string;
    createdAt: string;
  };
  error?: string;
}

const initialState: AppUpdateState = { gotResponse: false };

// Redux slice that stores app settings
const appUpdateSlice = createSlice({
  name: "appUpdate",
  initialState,
  reducers: {
    resetAppUpdate() {
      return initialState;
    },
    setAppUpdateResponse(
      state,
      action: PayloadAction<
        Partial<{ id: string; createdAt: string; error: string }>
      >
    ) {
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
