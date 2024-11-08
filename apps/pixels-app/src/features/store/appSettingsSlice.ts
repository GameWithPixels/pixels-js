import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootScreenName } from "~/app/navigation";
import { AppThemes } from "~/app/themes";
import {
  AnimationsGrouping,
  DiceGrouping,
  ProfilesGrouping,
  SortMode,
} from "~/features/profiles";
import { DiceViewMode } from "~/screens/home/DiceListScreen";
import { ProfilesViewMode } from "~/screens/profiles/ProfilesListScreen";

export type ThemeMode = "system" | "dark" | "light";

export interface AppSettingsState {
  themeMode: ThemeMode;
  showOnboarding: boolean;
  showNewPixelsAppBanner: boolean;
  showProfileHelp: boolean;
  showRollsHelp: boolean;
  diceViewMode: DiceViewMode;
  diceGrouping: DiceGrouping;
  diceSortMode: SortMode;
  profileViewMode: ProfilesViewMode;
  profilesGrouping: ProfilesGrouping;
  profilesSortMode: SortMode;
  animationsGrouping: AnimationsGrouping;
  animationsSortMode: SortMode;
  updateBootloader: boolean;
  diceBrightnessFactor: number;
  rollerCardsSizeRatio: number;
  disablePlayingAnimations: boolean;
  screensTheme: Record<RootScreenName, keyof typeof AppThemes>;
  showAdvancedSettings: boolean;
  debugMode: boolean;
  useBetaFirmware: boolean;
  appFirmwareTimestampOverride: number;
  backgroundAudio: boolean;
  playAudioInSilentModeIOS: boolean;
}

const initialState: AppSettingsState = {
  themeMode: "dark",
  showOnboarding: true,
  showNewPixelsAppBanner: true,
  showProfileHelp: true,
  showRollsHelp: true,
  diceViewMode: "grid",
  diceGrouping: "dieType",
  diceSortMode: "alphabetical",
  profileViewMode: "list",
  profilesGrouping: "dieType",
  profilesSortMode: "chronological-reverse",
  animationsGrouping: "type",
  animationsSortMode: "alphabetical",
  updateBootloader: false,
  diceBrightnessFactor: 1,
  rollerCardsSizeRatio: 0.5,
  disablePlayingAnimations: false,
  screensTheme: {
    onboarding: "blue",
    home: "blue",
    profiles: "purple",
    animations: "yellow",
    settings: "orange",
  },
  showAdvancedSettings: false,
  debugMode: false,
  useBetaFirmware: false,
  appFirmwareTimestampOverride: 0,
  backgroundAudio: true,
  playAudioInSilentModeIOS: true,
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

    setDiceViewMode(state, action: PayloadAction<DiceViewMode>) {
      state.diceViewMode = action.payload;
    },

    setDiceGrouping(state, action: PayloadAction<DiceGrouping>) {
      state.diceGrouping = action.payload;
    },

    setDiceSortMode(state, action: PayloadAction<SortMode>) {
      state.diceSortMode = action.payload;
    },

    setProfilesViewMode(state, action: PayloadAction<ProfilesViewMode>) {
      state.profileViewMode = action.payload;
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

    setDisablePlayingAnimations(state, action: PayloadAction<boolean>) {
      state.disablePlayingAnimations = action.payload;
    },

    setScreenTheme(
      state,
      action: PayloadAction<{
        screen: RootScreenName;
        themeKey: keyof typeof AppThemes;
      }>
    ) {
      state.screensTheme[action.payload.screen] = action.payload.themeKey;
    },

    setShowAdvancedSettings(state, action: PayloadAction<boolean>) {
      state.showAdvancedSettings = action.payload;
      if (!action.payload) {
        // Reset advanced settings when hiding them
        state.debugMode = false;
        state.updateBootloader = false;
        state.useBetaFirmware = false;
        state.appFirmwareTimestampOverride = 0;
      }
    },

    setDebugMode(state, action: PayloadAction<boolean>) {
      state.debugMode = action.payload;
    },

    setUseBetaFirmware(state, action: PayloadAction<boolean>) {
      state.useBetaFirmware = action.payload;
    },

    setAppFirmwareTimestampOverride(state, action: PayloadAction<number>) {
      state.appFirmwareTimestampOverride = action.payload;
    },

    setBackgroundAudio(state, action: PayloadAction<boolean>) {
      state.backgroundAudio = action.payload;
    },

    setPlayAudioInSilentModeIOS(state, action: PayloadAction<boolean>) {
      state.playAudioInSilentModeIOS = action.payload;
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
  setDiceViewMode,
  setDiceGrouping,
  setDiceSortMode,
  setProfilesViewMode,
  setProfilesGrouping,
  setProfilesSortMode,
  setAnimationsGrouping,
  setAnimationsSortMode,
  setUpdateBootloader,
  setDiceBrightnessFactor,
  setRollerCardsSizeRatio,
  setDisablePlayingAnimations,
  setScreenTheme,
  setShowAdvancedSettings,
  setDebugMode,
  setUseBetaFirmware,
  setAppFirmwareTimestampOverride,
  setBackgroundAudio,
  setPlayAudioInSilentModeIOS,
} = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
