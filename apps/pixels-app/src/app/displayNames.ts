import { RootScreenName } from "./navigation";
import { AppThemes } from "./themes";

export const AppScreenNames: Record<RootScreenName, string> = {
  home: "Dice Bag",
  profiles: "Profiles",
  animations: "Animations",
  settings: "Settings",
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
