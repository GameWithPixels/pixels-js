import { StackScreenProps } from "@react-navigation/stack";

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

export type HomeScreenProps = StackScreenProps<
  HomeScreenStackParamList,
  "Home"
>;

export type PixelDetailScreenProps = StackScreenProps<
  HomeScreenStackParamList,
  "PixelDetails"
>;

export type PixelAdvancedSettingsScreenProps = StackScreenProps<
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

export type AnimationsListScreenProps = StackScreenProps<
  AnimationsScreenStackParamList,
  "AnimationsList"
>;

export type AnimationEditScreenProps = StackScreenProps<
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

export type ProfilesListScreenProps = StackScreenProps<
  ProfilesScreenStackParamList,
  "ProfilesList"
>;

export type ProfileRulesScreenProps = StackScreenProps<
  ProfilesScreenStackParamList,
  "ProfileRules"
>;

export type ProfileEditRuleScreenProps = StackScreenProps<
  ProfilesScreenStackParamList,
  "ProfileEditRule"
>;
