import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  AnimationsGrouping,
  DiceGrouping,
  ProfilesGrouping,
  SortMode,
} from "~/features/sortingOptions";

export type ThemeMode = "system" | "dark" | "light";

export interface AppSettingsState {
  themeMode: ThemeMode;
  showOnboarding: boolean;
  showWelcomeBanner: boolean;
  showFocusModeHelp: boolean;
  showProfileHelp: boolean;
  showProfileAdvancedHelp: boolean;
  diceGrouping: DiceGrouping;
  diceSortMode: SortMode;
  profilesGrouping: ProfilesGrouping;
  profilesSortMode: SortMode;
  animationsGrouping: AnimationsGrouping;
  animationsSortMode: SortMode;
}

const initialState: AppSettingsState = {
  themeMode: "dark",
  showOnboarding: true,
  showWelcomeBanner: true,
  showFocusModeHelp: true,
  showProfileHelp: true,
  showProfileAdvancedHelp: true,
  diceGrouping: "dieType",
  diceSortMode: "alphabetical",
  profilesGrouping: "dieType",
  profilesSortMode: "alphabetical",
  animationsGrouping: "type",
  animationsSortMode: "alphabetical",
};

// Redux slice that stores app settings
const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {
    resetAppSettingsToDefault() {
      return initialState;
    },
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setShowOnboarding(state, action: PayloadAction<boolean>) {
      state.showOnboarding = action.payload;
    },
    setShowWelcomeBanner(state, action: PayloadAction<boolean>) {
      state.showWelcomeBanner = action.payload;
    },
    setShowFocusModeHelp(state, action: PayloadAction<boolean>) {
      state.showFocusModeHelp = action.payload;
    },
    setShowProfileHelp(state, action: PayloadAction<boolean>) {
      state.showProfileHelp = action.payload;
    },
    setShowProfileAdvancedHelp(state, action: PayloadAction<boolean>) {
      state.showProfileAdvancedHelp = action.payload;
    },
    setDiceGrouping(state, action: PayloadAction<DiceGrouping>) {
      state.diceGrouping = action.payload;
    },
    setDiceSortMode(state, action: PayloadAction<SortMode>) {
      state.diceSortMode = action.payload;
    },
    setProfilesGrouping(state, action: PayloadAction<ProfilesGrouping>) {
      state.profilesGrouping = action.payload;
    },
    setProfilesSortMode(state, action: PayloadAction<SortMode>) {
      state.profilesSortMode = action.payload;
    },
    setAnimationsGrouping(state, action: PayloadAction<AnimationsGrouping>) {
      state.animationsGrouping = action.payload;
    },
    setAnimationsSortMode(state, action: PayloadAction<SortMode>) {
      state.animationsSortMode = action.payload;
    },
  },
});

export const {
  resetAppSettingsToDefault,
  setThemeMode,
  setShowOnboarding,
  setShowWelcomeBanner,
  setShowFocusModeHelp,
  setShowProfileHelp,
  setShowProfileAdvancedHelp,
  setDiceGrouping,
  setDiceSortMode,
  setProfilesGrouping,
  setProfilesSortMode,
  setAnimationsGrouping,
  setAnimationsSortMode,
} = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
