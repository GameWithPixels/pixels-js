import type { RouteProp } from "@react-navigation/native";
import {
  PatternInfo,
  PixelInfo,
} from "@systemic-games/react-native-pixels-components";

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
export type AnimationSettingsScreenRouteProps = RouteProp<
  AnimationScreenParamList,
  "PatternInfo"
>;

//PixelDetailScreen params and props
export type PixelDetailScreenParamList = {
  PixelAdvancedSettingsScreen: undefined;
  PixelInfo: PixelInfo;
};
export type PixelDetailScreenRouteProp = RouteProp<
  PixelDetailScreenParamList,
  "PixelInfo"
>;
