import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "system" | "dark" | "light";

export interface DisplaySettingsState {
  themeMode: ThemeMode;
}

const initialState: DisplaySettingsState = { themeMode: "dark" };

// Redux slice that stores display settings
const displaySettingsSlice = createSlice({
  name: "displaySettings",
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
  },
});

export const { setThemeMode } = displaySettingsSlice.actions;
export default displaySettingsSlice.reducer;
