import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "system" | "dark" | "light";

export interface AppSettingsState {
  themeMode: ThemeMode;
  showIntro: boolean;
  showPromo: boolean;
}

const initialState: AppSettingsState = {
  themeMode: "dark",
  showIntro: false,
  showPromo: false,
};

// Redux slice that stores app settings
const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setShowIntro(state, action: PayloadAction<boolean>) {
      state.showIntro = action.payload;
    },
    setShowPromo(state, action: PayloadAction<boolean>) {
      state.showPromo = action.payload;
    },
  },
});

export const { setThemeMode, setShowIntro, setShowPromo } =
  appSettingsSlice.actions;
export default appSettingsSlice.reducer;
