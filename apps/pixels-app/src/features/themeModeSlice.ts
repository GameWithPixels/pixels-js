import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

export interface ThemeModeState {
  themeMode: ThemeMode;
}

const initialState: ThemeModeState = { themeMode: "light" };

// Redux slice that stores theme mode
const themeModeSlice = createSlice({
  name: "themeMode",
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setLightMode(state) {
      state.themeMode = "light";
    },
    setDarkMode(state) {
      state.themeMode = "dark";
    },
  },
});

export const { setThemeMode, setLightMode, setDarkMode } =
  themeModeSlice.actions;
export default themeModeSlice.reducer;
