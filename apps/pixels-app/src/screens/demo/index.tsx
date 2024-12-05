import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { MPCDetailsScreen } from "./MPCDetailsScreen";
import { MPCsListScreen } from "./MPCsListScreen";
import { RollToWinScreenScreenScreen } from "../home/RollToWinScreen";

import {
  DemoStackParamList,
  DemoStackProps,
  getStackNavigationOptions,
} from "~/app/navigation";
import { NavigationRoot } from "~/components/NavigationRoot";

const Stack = createNativeStackNavigator<DemoStackParamList>();

export function DemoStack({ route }: DemoStackProps) {
  return (
    <NavigationRoot screenName={route.name}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="mpcsList" component={MPCsListScreen} />
        <Stack.Screen
          name="mpcDetails"
          component={MPCDetailsScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="rollToWin"
          component={RollToWinScreenScreenScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
