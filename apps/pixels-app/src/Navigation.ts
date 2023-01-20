import type { RouteProp } from "@react-navigation/native";
import { EditProfile } from "@systemic-games/pixels-edit-animation";
import { PatternInfo } from "@systemic-games/react-native-pixels-components";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";

//Main screens stack params
export type RootStackParamList = {
  Home: undefined;
  HomeScreen: undefined;
  Patterns: undefined;
};

//Home screen stack params
export type HomeScreenStackParamList = {
  PixelDetailScreen: undefined;
  PixelAdvancedSettingsScreen: undefined;
};
//Patterns screen stack params
export type PatternsScreenStackParamList = {
  PatternsScreen: undefined;
  AnimationSettingsScreen: undefined;
};
export type AnimationScreenParamList = {
  PatternInfo: PatternInfo;
};
//For route
export type AnimationSettingsScreenRouteProps = RouteProp<
  AnimationScreenParamList,
  "PatternInfo"
>;

//PixelDetailScreen params and props
export type PixelDetailScreenStackParamList = {
  PixelAdvancedSettingsScreen: undefined;
  PixelInfo: ScannedPixel;
};
//For route
export type PixelDetailScreenRouteProp = RouteProp<
  PixelDetailScreenStackParamList,
  "PixelInfo"
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
