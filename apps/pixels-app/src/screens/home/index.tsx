import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { DiceListScreen } from "./DiceListScreen";
import { DiceRollerScreen } from "./DiceRollerScreen";
import { DiceRollerSettingsScreen } from "./DiceRollerSettingsScreen";
import { DieDetailsScreen } from "./DieDetailsScreen";
import { DieFocusScreen } from "./DieFocusScreen";
import { EditCompositeProfileScreen } from "./EditCompositeProfileScreen";
import { EditDieProfileStack } from "./EditDieProfileStack";
import { FirmwareUpdateScreen } from "./FirmwareUpdateScreen";
import { RestoreFirmwareScreen } from "./RestoreFirmwareScreen";
import { RollsHistoryScreen } from "./RollsHistoryScreen";

import {
  getStackNavigationOptions,
  HomeStackParamList,
  HomeStackProps,
} from "~/app/navigation";
import { NavigationRoot } from "~/components/NavigationRoot";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack({ route }: HomeStackProps) {
  return (
    <NavigationRoot screenName={route.name}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="diceList" component={DiceListScreen} />
        <Stack.Screen
          name="dieFocus"
          component={DieFocusScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="dieDetails"
          component={DieDetailsScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="dieRollsHistory"
          component={RollsHistoryScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="editDieProfileStack"
          component={EditDieProfileStack}
          options={{
            ...getStackNavigationOptions("bottom-sheet"),
            gestureEnabled: false, // TODO disable gestures because sliding down bottom sheet also slides down screen
          }}
        />
        <Stack.Screen
          name="firmwareUpdate"
          component={FirmwareUpdateScreen}
          options={{
            ...getStackNavigationOptions("bottom-sheet"),
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="restoreFirmware"
          component={RestoreFirmwareScreen}
          options={{
            ...getStackNavigationOptions("bottom-sheet"),
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="diceRoller"
          component={DiceRollerScreen}
          options={{
            ...getStackNavigationOptions("bottom-sheet"),
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="diceRollerSettings"
          component={DiceRollerSettingsScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="editCompositeProfile"
          component={EditCompositeProfileScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
