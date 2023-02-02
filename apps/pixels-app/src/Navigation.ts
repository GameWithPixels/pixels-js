import type { RouteProp } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { PatternInfo } from "@systemic-games/react-native-pixels-components";

//
// Main screens stack
//
export type RootStackParamList = {
  DiceBag: undefined;
  Profiles: undefined;
  Patterns: undefined;
  Settings: undefined;
};

//
// Home screen stack
//
export type HomeScreenStackParamList = {
  Dices: undefined;
  PixelDetails: { systemId: string };
  PixelAdvancedSettings: { systemId: string };
};

export type PixelDetailScreenProps = StackScreenProps<
  HomeScreenStackParamList,
  "PixelDetails"
>;

export type PixelAdvancedSettingsScreenProps = StackScreenProps<
  HomeScreenStackParamList,
  "PixelAdvancedSettings"
>;

//
// Patterns screen stack
//
export type PatternsScreenStackParamList = {
  PatternsScreen: undefined;
  AnimationSettingsScreen: undefined;
};

//
// Animation screen
//
export type AnimationScreenParamList = {
  PatternInfo: PatternInfo;
};

export type AnimationSettingsScreenRouteProps = RouteProp<
  AnimationScreenParamList,
  "PatternInfo"
>;

//
// ProfileScreen params and props
//
export type ProfilesScreenStackParamList = {
  ProfileRulesScreen: undefined;
  ProfileEditRuleScreen: undefined;
};
