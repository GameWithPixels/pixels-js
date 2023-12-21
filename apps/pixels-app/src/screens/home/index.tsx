import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ThemeProvider } from "react-native-paper";

import { DiceListScreen } from "./DiceListScreen";
import { DieDetailsScreen } from "./DieDetailsScreen";
import { EditDieProfileStack } from "./EditDieProfileStack";
import { FirmwareUpdateScreen } from "./FirmwareUpdateScreen";

import {
  getStackNavigationOptions,
  HomeStackParamList,
  HomeStackProps,
} from "~/navigation";
import { getRootScreenTheme } from "~/themes";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack({ route }: HomeStackProps) {
  return (
    <ThemeProvider theme={getRootScreenTheme(route.name)}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="diceList" component={DiceListScreen} />
        <Stack.Screen
          name="firmwareUpdate"
          component={FirmwareUpdateScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="dieDetails"
          component={DieDetailsScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="editDieProfileStack"
          component={EditDieProfileStack}
          options={getStackNavigationOptions("bottom-sheet")}
        />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
