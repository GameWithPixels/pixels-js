import type { RouteProp } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { EditProfile } from "@systemic-games/pixels-edit-animation";
import { PatternInfo } from "@systemic-games/react-native-pixels-components";

//Main screens stack
export type RootStackParamList = {
  DiceBag: undefined;
  Profiles: undefined;
  Patterns: undefined;
  Settings: undefined;
};

//Home screen stack
export type HomeScreenStackParamList = {
  Dices: undefined;
  PixelDetails: { systemId: string };
  PixelAdvancedSettings: { systemId: string };
};
//For route
export type PixelDetailScreenProps = StackScreenProps<
  HomeScreenStackParamList,
  "PixelDetails"
>;
//For route
export type PixelAdvancedSettingsScreenProps = StackScreenProps<
  HomeScreenStackParamList,
  "PixelAdvancedSettings"
>;

//Pixel Detail sub-screen stack
export type PixelDetailScreenStackParamList = {
  PixelAdvancedSettingsScreen: undefined;
  PixelInfo: { systemId: string };
};
//For route
// export type PixelDetailScreenRouteProp = RouteProp<
//   PixelDetailScreenStackParamList,
//   "PixelInfo"
// >;

//Patterns screen stack
export type PatternsScreenStackParamList = {
  PatternsScreen: undefined;
  AnimationSettingsScreen: undefined;
};

//Animation screen
export type AnimationScreenParamList = {
  PatternInfo: PatternInfo;
};
//For route
export type AnimationSettingsScreenRouteProps = RouteProp<
  AnimationScreenParamList,
  "PatternInfo"
>;

//ProfileScreen params and props
export type ProfilesScreenStackParamList = {
  ProfileRulesScreen: undefined;
  ProfileEditRuleScreen: undefined;
  routeParams: { profileInfo: EditProfile };
};
export type RouteTestParams = {
  ProfileInfo: EditProfile;
};
//For route
export type ProfileScreenRouteProp = RouteProp<RouteTestParams, "ProfileInfo">;
