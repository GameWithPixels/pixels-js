import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ValidationSettingsState {
  openOnStart: boolean;
}

const initialState: ValidationSettingsState = { openOnStart: false };

// Redux slice that stores validation settings
const validationSettingsSlice = createSlice({
  name: "validationSettings",
  initialState,
  reducers: {
    setOpenOnStart(state, action: PayloadAction<boolean>) {
      state.openOnStart = action.payload;
    },
  },
});

export const { setOpenOnStart } = validationSettingsSlice.actions;
export default validationSettingsSlice.reducer;
