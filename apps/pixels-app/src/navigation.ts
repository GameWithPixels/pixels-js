import { NativeStackScreenProps } from "@react-navigation/native-stack";

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
  Home: undefined;
  PixelDetails: { systemId: string };
  PixelAdvancedSettings: { systemId: string };
};

export type HomeScreenProps = NativeStackScreenProps<
  HomeScreenStackParamList,
  "Home"
>;

export type PixelDetailScreenProps = NativeStackScreenProps<
  HomeScreenStackParamList,
  "PixelDetails"
>;

export type PixelAdvancedSettingsScreenProps = NativeStackScreenProps<
  HomeScreenStackParamList,
  "PixelAdvancedSettings"
>;

//
// Animation screen stack
//
export type AnimationsScreenStackParamList = {
  AnimationsList: undefined;
  AnimationEdit: { animationUuid: string };
};

export type AnimationsListScreenProps = NativeStackScreenProps<
  AnimationsScreenStackParamList,
  "AnimationsList"
>;

export type AnimationEditScreenProps = NativeStackScreenProps<
  AnimationsScreenStackParamList,
  "AnimationEdit"
>;

//
// Profiles screen stack
//
export type ProfilesScreenStackParamList = {
  ProfilesList: undefined;
  ProfileRules: { profileUuid: string };
  ProfileEditRule: { profileUuid: string; ruleIndex: number };
};

export type ProfilesListScreenProps = NativeStackScreenProps<
  ProfilesScreenStackParamList,
  "ProfilesList"
>;

export type ProfileRulesScreenProps = NativeStackScreenProps<
  ProfilesScreenStackParamList,
  "ProfileRules"
>;

export type ProfileEditRuleScreenProps = NativeStackScreenProps<
  ProfilesScreenStackParamList,
  "ProfileEditRule"
>;
