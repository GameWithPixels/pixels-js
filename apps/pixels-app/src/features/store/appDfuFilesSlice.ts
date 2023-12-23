import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

// Redux slice that stores app settings
const dfuFilesSlice = createSlice({
  name: "dfuFiles",
  initialState: { latest: {} } as DfuFilesState,
  reducers: {
    setDfuFileError(state, action: PayloadAction<string>) {
      state.latest = { error: action.payload };
    },
    setDfuFilesBundle(state, action: PayloadAction<DfuPathnamesBundle>) {
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
