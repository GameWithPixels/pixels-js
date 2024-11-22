import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { MPCDetailsScreen } from "./MPCDetailsScreen";
import { MPCsListScreen } from "./MPCsListScreen";

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
        <Stack.Screen name="mpcDetails" component={MPCDetailsScreen} />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
