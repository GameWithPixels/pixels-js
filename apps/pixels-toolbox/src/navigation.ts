import type { StackScreenProps } from "@react-navigation/stack";

// Main menu
export type RootScreensParamList = {
  HomeNavigator: undefined;
  Validation: undefined;
  Stats: undefined;
  Roll: undefined;
  Animations: undefined;
  DiceRenderer: undefined;
};

// Home screen and sub screens
export type HomeScreensParamList = {
  Home: undefined;
  DieDetails: { pixelId: number };
  SelectDfuFiles: undefined;
};

export type HomeProps = StackScreenProps<HomeScreensParamList, "Home">;
export type DieDetailsProps = StackScreenProps<
  HomeScreensParamList,
  "DieDetails"
>;
export type SelectDfuFilesProps = StackScreenProps<
  HomeScreensParamList,
  "SelectDfuFiles"
>;
