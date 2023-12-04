import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { ThemeProvider } from "react-native-paper";

import { DiceListScreen } from "./DiceListScreen";
import { DieDetailsScreen } from "./DieDetailsScreen";
import { EditDieProfileScreen } from "./EditDieProfileScreen";
import { FirmwareUpdateScreen } from "./FirmwareUpdateScreen";
import {
  PickProfileScreen,
  PickProfileScreenAndroid,
} from "./PickProfileScreen";
import { EditRollRuleScreen } from "../profiles/EditRolledRulesScreen";
import {
  EditAdvancedRulesScreen,
  EditRuleScreen,
} from "../profiles/EditRuleScreen";
import { PickAnimationScreen } from "../profiles/PickAnimationScreen";

import {
  getStackNavigationOptions,
  HomeStackParamList,
  HomeStackProps,
} from "~/navigation";
import { getRootScreenTheme } from "~/themes";

const Stack = createStackNavigator<HomeStackParamList>();

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
          name="pickProfile"
          component={PickProfileScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="pickProfileAndroid"
          component={PickProfileScreenAndroid}
          options={getStackNavigationOptions("bottom-sheet-android")}
        />
        <Stack.Screen
          name="editDieProfile"
          component={EditDieProfileScreen}
          options={getStackNavigationOptions("slide-from-bottom")}
        />
        <Stack.Screen
          name="editAdvancedRules"
          component={EditAdvancedRulesScreen}
        />
        <Stack.Screen name="editRule" component={EditRuleScreen} />
        <Stack.Screen name="editRollRules" component={EditRollRuleScreen} />
        <Stack.Screen name="pickAnimation" component={PickAnimationScreen} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
