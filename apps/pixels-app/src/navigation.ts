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
  DiceList: undefined;
  PixelDetails: { systemId: string };
  PixelAdvancedSettings: { systemId: string };
};

export type DiceListScreenProps = StackScreenProps<
  HomeScreenStackParamList,
  "DiceList"
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
  AnimationEdit: { animationId: number };
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
  ProfileRules: { profileId: number };
  ProfileEditRule: { ruleId: number };
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
