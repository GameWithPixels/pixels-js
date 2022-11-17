import type { RouteProp } from "@react-navigation/native";
export type RootStackParamList = {
  Home: undefined;
  HomeScreen: undefined;
  SecondScreen: undefined;
  ThirdScreen: undefined;
};

export type HomeScreenStackParamList = {
  PixelDetailScreen: undefined;
};

export type PixelDetailScreenParamList = {
  AdvancedSettingsScreen: undefined;
  ProfilesScreen: undefined;
  PixelDetail: {
    pixelName: string;
  };
};

export type PixelDetailScreenRouteProp = RouteProp<
  PixelDetailScreenParamList,
  "PixelDetail"
>;
