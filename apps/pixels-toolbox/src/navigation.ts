import { DrawerScreenProps } from "@react-navigation/drawer";
import type { StackScreenProps } from "@react-navigation/stack";

// Main screens
export type RootScreensParamList = {
  HomeNavigator: undefined;
  Validation: undefined;
  LabelPrinting: undefined;
  FirmwareUpdateNavigator: undefined;
  TransferTest: undefined;
  Roll: undefined;
  Animations: undefined;
  Batch: undefined;
  Settings: undefined;
};

export type AppRootPageName = keyof RootScreensParamList;

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

export type HomeScreenProps = StackScreenProps<HomeScreensParamList, "Home">;
export type DieDetailsScreenProps = StackScreenProps<
  HomeScreensParamList,
  "DieDetails"
>;
export type SelectDfuFilesScreenProps = StackScreenProps<
  HomeScreensParamList,
  "SelectDfuFiles"
>;

// Firmware Update screen and sub screens
export type FirmwareUpdateParamList = {
  FirmwareUpdate: undefined;
  SelectDfuFiles: undefined;
};

export type FirmwareUpdateScreenProps = StackScreenProps<
  FirmwareUpdateParamList,
  "FirmwareUpdate"
>;
