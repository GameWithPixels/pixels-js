import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { getTimeStringMs } from "~/features/utils";

export interface DfuPathnamesBundle {
  readonly timestamp: number;
  readonly firmware: string;
  readonly bootloader?: string;
}

export interface DfuFilesState {
  latest: {
    bundle?: DfuPathnamesBundle;
    error?: string;
  };
}

function log(action: "setDfuFileError" | "setDfuFilesBundle") {
  if (__DEV__) {
    console.log(`[${getTimeStringMs()}] Store Write ${action}`);
  }
}

// Redux slice that stores app settings
const dfuFilesSlice = createSlice({
  name: "dfuFiles",
  initialState: { latest: {} } as DfuFilesState,
  reducers: {
    setDfuFileError(state, action: PayloadAction<string>) {
      log("setDfuFileError");
      state.latest = { error: action.payload };
    },
    setDfuFilesBundle(state, action: PayloadAction<DfuPathnamesBundle>) {
      log("setDfuFilesBundle");
      state.latest = {
        bundle: {
          timestamp: action.payload.timestamp,
          firmware: action.payload.firmware,
          bootloader: action.payload.bootloader,
        },
      };
    },
  },
});

export const { setDfuFileError, setDfuFilesBundle } = dfuFilesSlice.actions;
export default dfuFilesSlice.reducer;
