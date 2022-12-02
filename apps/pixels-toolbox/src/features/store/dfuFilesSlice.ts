import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DfuFilesState {
  dfuFiles: string[];
}

const initialState: DfuFilesState = { dfuFiles: [] };

// Redux slice that stores theme mode
const dfuFilesSlice = createSlice({
  name: "dfuFiles",
  initialState,
  reducers: {
    setDfuFiles(state, action: PayloadAction<string[]>) {
      state.dfuFiles = action.payload;
    },
  },
});

export const { setDfuFiles } = dfuFilesSlice.actions;
export default dfuFilesSlice.reducer;
