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

// Die details sub-screen
export type DieDetailsProps = StackScreenProps<
  HomeScreensParamList,
  "DieDetails"
>;
