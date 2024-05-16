import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { DiceListScreen } from "./DiceListScreen";
import { DieDetailsScreen } from "./DieDetailsScreen";
import { DieFocusScreen } from "./DieFocusScreen";
import { EditDieProfileStack } from "./EditDieProfileStack";
import { FirmwareUpdateScreen } from "./FirmwareUpdateScreen";
import { RollsHistoryScreen } from "./RollsHistoryScreen";

import { NavigationRoot } from "~/components/NavigationRoot";
import {
  getStackNavigationOptions,
  HomeStackParamList,
  HomeStackProps,
} from "~/navigation";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack({ route }: HomeStackProps) {
  return (
    <NavigationRoot screenName={route.name}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="diceList" component={DiceListScreen} />
        <Stack.Screen
          name="firmwareUpdate"
          component={FirmwareUpdateScreen}
          options={{
            ...getStackNavigationOptions("bottom-sheet"),
            gestureEnabled: false,
          }}
        />
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
          name="rollsHistory"
          component={RollsHistoryScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="editDieProfileStack"
          component={EditDieProfileStack}
          options={getStackNavigationOptions("bottom-sheet")}
        />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
