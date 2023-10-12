import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ValidationSettingsState {
  openOnStart: boolean;
  useSelectedFirmware: boolean;
}

const initialState: ValidationSettingsState = {
  openOnStart: true,
  useSelectedFirmware: false,
};

// Redux slice that stores validation settings
const validationSettingsSlice = createSlice({
  name: "validationSettings",
  initialState,
  reducers: {
    setOpenOnStart(state, action: PayloadAction<boolean>) {
      state.openOnStart = action.payload;
    },
    setUseSelectedFirmware(state, action: PayloadAction<boolean>) {
      state.useSelectedFirmware = action.payload;
    },
  },
});

export const { setOpenOnStart, setUseSelectedFirmware } =
  validationSettingsSlice.actions;
export default validationSettingsSlice.reducer;
