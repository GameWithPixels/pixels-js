import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { AppSettingsScreen } from "./AppSettingsScreen";
import { CheckForUpdateScreen } from "./CheckForUpdateScreen";
import { EditPresetScreen } from "./EditPresetScreen";
import { FirmwareInfoScreen } from "./FirmwareInfoScreen";
import { PresetsScreen } from "./PresetsScreen";
import { SettingsMenuScreen } from "./SettingsMenuScreen";
import { SupportScreen } from "./SupportScreen";
import { SystemInfoScreen } from "./SystemInfoScreen";
import { ThemesScreen } from "./ThemesScreen";
import { TurnOnDiceScreen } from "./TurnOnDiceScreen";

import {
  getStackNavigationOptions,
  SettingsStackParamList,
  SettingsStackProps,
} from "~/app/navigation";
import { NavigationRoot } from "~/components/NavigationRoot";

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack({ route }: SettingsStackProps) {
  return (
    <NavigationRoot screenName={route.name}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="settingsMenu" component={SettingsMenuScreen} />
        <Stack.Screen name="systemInfo" component={SystemInfoScreen} />
        <Stack.Screen name="firmwareInfo" component={FirmwareInfoScreen} />
        <Stack.Screen name="support" component={SupportScreen} />
        <Stack.Screen name="turnOnDice" component={TurnOnDiceScreen} />
        <Stack.Screen name="checkForUpdate" component={CheckForUpdateScreen} />
        <Stack.Screen name="appSettings" component={AppSettingsScreen} />
        <Stack.Screen name="themes" component={ThemesScreen} />
        <Stack.Screen name="presets" component={PresetsScreen} />
        <Stack.Screen
          name="editPreset"
          component={EditPresetScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
