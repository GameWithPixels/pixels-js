import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DfuBundleState {
  selected: number;
  available: { bootloader?: string; firmware?: string }[];
}

const initialState: DfuBundleState = { selected: -1, available: [] };

// Redux slice that stores theme mode
const dfuBundlesSlice = createSlice({
  name: "dfuBundles",
  initialState,
  reducers: {
    setSelectedDfuBundle(state, action: PayloadAction<number>) {
      state.selected = action.payload;
    },
    setAvailableDfuBundles(
      state,
      action: PayloadAction<DfuBundleState["available"]>
    ) {
      if (state.available.length !== 0 || action.payload.length !== 0) {
        state.available = action.payload;
      }
    },
  },
});

export const { setSelectedDfuBundle, setAvailableDfuBundles } =
  dfuBundlesSlice.actions;
export default dfuBundlesSlice.reducer;
