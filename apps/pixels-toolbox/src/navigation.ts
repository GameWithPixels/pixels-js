import { DrawerScreenProps } from "@react-navigation/drawer";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

// Main screens
export type RootScreensParamList = {
  HomeNavigator: undefined;
  Validation: undefined;
  FirmwareUpdateNavigator: undefined;
  Stats: undefined;
  Roll: undefined;
  Animations: undefined;
  DiceRenderer: undefined;
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

export type HomeProps = NativeStackScreenProps<HomeScreensParamList, "Home">;
export type DieDetailsProps = NativeStackScreenProps<
  HomeScreensParamList,
  "DieDetails"
>;
export type SelectDfuFilesProps = NativeStackScreenProps<
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
