import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { AppActionsListScreen } from "./AppActionsListScreen";
import { EditAppActionAdvancedSettingsScreen } from "./EditAppActionAdvancedSettingsScreen";
import { EditAppActionScreen } from "./EditAppActionScreen";

import {
  getStackNavigationOptions,
  AppActionsStackParamList,
  AppActionsStackProps,
} from "~/app/navigation";
import { NavigationRoot } from "~/components/NavigationRoot";

const Stack = createNativeStackNavigator<AppActionsStackParamList>();

export function AppActionsStack({ route }: AppActionsStackProps) {
  return (
    <NavigationRoot screenName={route.name}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="appActionsList" component={AppActionsListScreen} />
        <Stack.Screen name="editAppAction" component={EditAppActionScreen} />
        <Stack.Screen
          name="editAppActionAdvancedSettings"
          component={EditAppActionAdvancedSettingsScreen}
        />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
