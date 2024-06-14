import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  AnimationsGrouping,
  DiceGrouping,
  ProfilesGrouping,
  SortMode,
} from "~/features/profiles";

export type ThemeMode = "system" | "dark" | "light";

export interface AppSettingsState {
  themeMode: ThemeMode;
  showOnboarding: boolean;
  showNewPixelsAppBanner: boolean;
  showProfileHelp: boolean;
  showRollsHelp: boolean;
  diceGrouping: DiceGrouping;
  diceSortMode: SortMode;
  profilesGrouping: ProfilesGrouping;
  profilesSortMode: SortMode;
  animationsGrouping: AnimationsGrouping;
  animationsSortMode: SortMode;
  updateBootloader: boolean;
  diceBrightnessFactor: number;
  rollerCardsSizeRatio: number;
}

const initialState: AppSettingsState = {
  themeMode: "dark",
  showOnboarding: true,
  showNewPixelsAppBanner: true,
  showProfileHelp: true,
  showRollsHelp: true,
  diceGrouping: "dieType",
  diceSortMode: "alphabetical",
  profilesGrouping: "dieType",
  profilesSortMode: "chronological-reverse",
  animationsGrouping: "type",
  animationsSortMode: "alphabetical",
  updateBootloader: false,
  diceBrightnessFactor: 1,
  rollerCardsSizeRatio: 0.5,
};

// Redux slice that stores app settings
const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {
    resetAppSettings() {
      return initialState;
    },

    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },

    setShowOnboarding(state, action: PayloadAction<boolean>) {
      state.showOnboarding = action.payload;
    },

    setShowNewPixelsAppBanner(state, action: PayloadAction<boolean>) {
      state.showNewPixelsAppBanner = action.payload;
    },

    setShowProfileHelp(state, action: PayloadAction<boolean>) {
      state.showProfileHelp = action.payload;
    },

    setShowRollsHelp(state, action: PayloadAction<boolean>) {
      state.showRollsHelp = action.payload;
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

    setUpdateBootloader(state, action: PayloadAction<boolean>) {
      state.updateBootloader = action.payload;
    },

    setDiceBrightnessFactor(state, action: PayloadAction<number>) {
      state.diceBrightnessFactor = action.payload;
    },

    setRollerCardsSizeRatio(state, action: PayloadAction<number>) {
      state.rollerCardsSizeRatio = action.payload;
    },
  },
});

export const {
  resetAppSettings,
  setThemeMode,
  setShowOnboarding,
  setShowNewPixelsAppBanner,
  setShowProfileHelp,
  setShowRollsHelp,
  setDiceGrouping,
  setDiceSortMode,
  setProfilesGrouping,
  setProfilesSortMode,
  setAnimationsGrouping,
  setAnimationsSortMode,
  setUpdateBootloader,
  setDiceBrightnessFactor,
  setRollerCardsSizeRatio,
} = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
