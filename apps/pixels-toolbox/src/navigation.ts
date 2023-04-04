import { DrawerScreenProps } from "@react-navigation/drawer";
import type { StackScreenProps } from "@react-navigation/stack";

// Main screens
export type RootScreensParamList = {
  HomeNavigator: undefined;
  Validation: undefined;
  FirmwareUpdateNavigator: undefined;
  Stats: undefined;
  Roll: undefined;
  Animations: undefined;
  Settings: undefined;
};

// Home screen and sub screens
export type HomeNavigatorProps = DrawerScreenProps<
  RootScreensParamList,
  "HomeNavigator"
>;

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

// Firmware Update screen and sub screens
export type FirmwareUpdateParamList = {
  FirmwareUpdate: undefined;
  SelectDfuFiles: undefined;
};

export type FirmwareUpdateProps = StackScreenProps<
  FirmwareUpdateParamList,
  "FirmwareUpdate"
>;
