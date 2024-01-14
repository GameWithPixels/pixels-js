import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { CheckForUpdateScreen } from "./CheckForUpdateScreen";
import { FirmwareInfoScreen } from "./FirmwareInfoScreen";
import { SettingsMenuScreen } from "./SettingsMenuScreen";
import { SpeechScreen } from "./SpeechScreen";
import { SupportScreen } from "./SupportScreen";
import { SystemInfoScreen } from "./SystemInfoScreen";
import { TurnOnDiceScreen } from "./TurnOnDiceScreen";

import { NavigationRoot } from "~/components/NavigationRoot";
import {
  getStackNavigationOptions,
  SettingsStackParamList,
  SettingsStackProps,
} from "~/navigation";

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
        <Stack.Screen name="speech" component={SpeechScreen} />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
