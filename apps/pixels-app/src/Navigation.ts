import type { RouteProp } from "@react-navigation/native";
import { PixelInfo } from "@systemic-games/react-native-pixels-components";

//Main screens stack params
export type RootStackParamList = {
  Home: undefined;
  HomeScreen: undefined;
  SecondScreen: undefined;
  ThirdScreen: undefined;
};

//Home screen stack params
export type HomeScreenStackParamList = {
  PixelDetailScreen: undefined;
  PixelAdvancedSettingsScreen: undefined;
};

//PixelDetailScreen params and props
export type PixelDetailScreenParamList = {
  PixelAdvancedSettingsScreen: undefined;
  PixelInfo: PixelInfo;
};
export type PixelDetailScreenRouteProp = RouteProp<
  PixelDetailScreenParamList,
  "PixelInfo"
>;
