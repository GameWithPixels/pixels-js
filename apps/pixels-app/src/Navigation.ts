import { StackNavigationProp } from "@react-navigation/stack";
export type RootStackParamList = {
  HomeScreen: undefined;
  SecondScreen: undefined;
  ThirdScreen: undefined;
};

export type ScreenProps = StackNavigationProp<RootStackParamList, "HomeScreen">;
