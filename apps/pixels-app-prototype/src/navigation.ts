import { StackScreenProps } from "@react-navigation/stack";
import { EditRule } from "@systemic-games/pixels-edit-animation";

//
// Main screens stack
//
export type RootStackParamList = {
  HomeNav: undefined;
  ProfilesNav: undefined;
  AnimationsNav: undefined;
  Settings: undefined;
};

//
// Home screen stack
//
export type HomeScreenStackParamList = {
  Home: undefined;
  PixelDetails: { pixelId: number };
  PixelAdvancedSettings: { pixelId: number };
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
  ProfileEdit: { profileUuid: string };
  RuleEdit: { observableRule: EditRule }; // At the moment it's just easier to pass an observable EditRule object rather than a serializable one
};

export type ProfilesListScreenProps = StackScreenProps<
  ProfilesScreenStackParamList,
  "ProfilesList"
>;

export type ProfileEditScreenProps = StackScreenProps<
  ProfilesScreenStackParamList,
  "ProfileEdit"
>;

export type RuleEditScreenProps = StackScreenProps<
  ProfilesScreenStackParamList,
  "RuleEdit"
>;
