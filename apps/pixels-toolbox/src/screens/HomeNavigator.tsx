import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { useTranslation } from "react-i18next";

import { Header } from "./HomeScreen/Header";

import { HomeNavigatorProps, type HomeScreensParamList } from "~/navigation";
import DieDetailsScreen from "~/screens/DieDetailsScreen";
import HomeScreen from "~/screens/HomeScreen";
import SelectDfuFilesScreen from "~/screens/SelectDfuFilesScreen";

const Stack = createStackNavigator<HomeScreensParamList>();

export function HomeNavigator({ navigation }: HomeNavigatorProps) {
  // Setup page options
  React.useEffect(() => {
    navigation.setOptions({
      header: () => <Header onPress={() => navigation.openDrawer()} />,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="SelectDfuFiles"
        component={SelectDfuFilesScreen}
        options={{ title: t("selectFirmware") }}
      />
      <Stack.Screen name="DieDetails" component={DieDetailsScreen} />
    </Stack.Navigator>
  );
}
