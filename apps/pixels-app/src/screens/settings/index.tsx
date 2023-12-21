import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ThemeProvider } from "react-native-paper";

import { FirmwareInfoScreen } from "./FirmwareInfoScreen";
import { SettingsMenuScreen } from "./SettingsMenuScreen";
import { SystemInfoScreen } from "./SystemInfoScreen";

import {
  getStackNavigationOptions,
  SettingsStackParamList,
  SettingsStackProps,
} from "~/navigation";
import { getRootScreenTheme } from "~/themes";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack({ route }: SettingsStackProps) {
  return (
    <ThemeProvider theme={getRootScreenTheme(route.name)}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="settingsMenu" component={SettingsMenuScreen} />
        <Stack.Screen name="systemInfo" component={SystemInfoScreen} />
        <Stack.Screen name="firmwareInfo" component={FirmwareInfoScreen} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
