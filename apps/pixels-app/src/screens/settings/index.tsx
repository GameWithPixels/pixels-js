import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { ThemeProvider } from "react-native-paper";

import { SettingsMenuScreen } from "./SettingsMenuScreen";
import { SystemInfoScreen } from "./SystemInfoScreen";

import {
  getStackNavigationOptions,
  SettingsStackParamList,
  SettingsStackProps,
} from "@/navigation";
import { getRootScreenTheme } from "@/themes";

const Stack = createStackNavigator<SettingsStackParamList>();

export function SettingsStack({ route }: SettingsStackProps) {
  return (
    <ThemeProvider theme={getRootScreenTheme(route.name)}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="settingsMenu" component={SettingsMenuScreen} />
        <Stack.Screen name="systemInfo" component={SystemInfoScreen} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
