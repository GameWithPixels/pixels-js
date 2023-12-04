import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { ThemeProvider } from "react-native-paper";

import { AnimationsListScreen } from "./AnimationsListScreen";
import { CreateAnimationScreen } from "./CreateAnimationScreen";
import { EditAnimationScreen } from "./EditAnimationScreen";
import { PickColorDesignScreen } from "./PickColorDesignScreen";

import {
  AnimationsStackParamList,
  AnimationsStackProps,
  getStackNavigationOptions,
} from "~/navigation";
import { getRootScreenTheme } from "~/themes";

const Stack = createStackNavigator<AnimationsStackParamList>();

export function AnimationsStack({ route }: AnimationsStackProps) {
  return (
    <ThemeProvider theme={getRootScreenTheme(route.name)}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="animationsList" component={AnimationsListScreen} />
        <Stack.Screen
          name="createAnimation"
          component={CreateAnimationScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="editAnimation"
          component={EditAnimationScreen}
          options={getStackNavigationOptions("slide-from-bottom")}
        />
        <Stack.Screen
          name="pickColorDesign"
          component={PickColorDesignScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
      </Stack.Navigator>
    </ThemeProvider>
  );
}
