import type { StackScreenProps } from "@react-navigation/stack";

export type RootScreensParamList = {
  HomeNavigator: undefined;
  Validation: undefined;
  Stats: undefined;
  Roll: undefined;
  Animations: undefined;
  DiceRenderer: undefined;
};

export type HomeScreensParamList = {
  Home: undefined;
  DieDetails: { pixelId: number };
  SelectDfuFiles: undefined;
};

export type DieDetailsProps = StackScreenProps<
  HomeScreensParamList,
  "DieDetails"
>;
