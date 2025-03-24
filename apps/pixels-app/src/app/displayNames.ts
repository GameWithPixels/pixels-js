import { Profiles } from "@systemic-games/react-native-pixels-connect";

import { RootScreenName } from "./navigation";
import { AppThemes } from "./themes";

export const AppScreensNames: Record<RootScreenName, string> = {
  home: "Dice Bag",
  profiles: "Profiles",
  animations: "Animations",
  settings: "Settings",
  appActions: "App Actions",
  onboarding: "Onboarding",
} as const;

export const AppThemesNames: Record<keyof typeof AppThemes, string> = {
  dark: "Dark",
  light: "Light",
  blue: "Blue",
  purple: "Purple",
  yellow: "Yellow",
  orange: "Orange",
  colorblindBluePurple: "Blue Purple 👁",
  colorblindYellowOrange: "Yellow Orange 👁",
  colorblindShadow: "Shadow 👁",
  crystalAqua: "Crystal Aqua",
  vitalGreen: "Vital Green",
  dnD: "DnD",
  cthulhu: "Cthulhu",
  vampire: "Vampire",
} as const;

export const AnimationsCategories: Record<Profiles.AnimationCategory, string> =
  {
    colorful: "Colorful",
    animated: "Animated",
    flashy: "Flashy",
    uniform: "Uniform",
    system: "System",
  } as const;
