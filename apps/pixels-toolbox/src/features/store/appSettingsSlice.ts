import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AppRootPageName } from "~/navigation";

export type ThemeMode = "system" | "dark" | "light";

export interface AppSettingsState {
  themeMode: ThemeMode;
  openPageOnStart: string;
}

const initialState: AppSettingsState = {
  themeMode: "dark",
  openPageOnStart: "Validation",
};

// Redux slice that stores app settings
const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setOpenPageOnStart(state, action: PayloadAction<AppRootPageName | "">) {
      state.openPageOnStart = action.payload;
    },
  },
});

export const { setThemeMode, setOpenPageOnStart } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
