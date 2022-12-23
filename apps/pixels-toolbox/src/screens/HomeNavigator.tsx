import { useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect } from "react";

import Header from "./HomeScreen/Header";

import { type HomeScreensParamList } from "~/navigation";
import DieDetailsScreen from "~/screens/DieDetailsScreen";
import HomeScreen from "~/screens/HomeScreen";
import SelectDfuFilesScreen from "~/screens/SelectDfuFilesScreen";

const Stack = createStackNavigator<HomeScreensParamList>();

export default function () {
  // Setup page options
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Header />,
      //TODO do this instead: https://github.com/react-navigation/react-navigation/issues/7011#issuecomment-575375103
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SelectDfuFiles" component={SelectDfuFilesScreen} />
      <Stack.Screen name="DieDetails" component={DieDetailsScreen} />
    </Stack.Navigator>
  );
}
