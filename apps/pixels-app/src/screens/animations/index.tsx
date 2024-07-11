import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { AnimationsListScreen } from "./AnimationsListScreen";
import { CreateAnimationScreen } from "./CreateAnimationScreen";
import { EditAnimationScreen } from "./EditAnimationScreen";
import { PickColorDesignScreen } from "./PickColorDesignScreen";

import {
  AnimationsStackParamList,
  AnimationsStackProps,
  getStackNavigationOptions,
} from "~/app/navigation";
import { NavigationRoot } from "~/components/NavigationRoot";

const Stack = createNativeStackNavigator<AnimationsStackParamList>();

export function AnimationsStack({ route }: AnimationsStackProps) {
  return (
    <NavigationRoot screenName={route.name}>
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
    </NavigationRoot>
  );
}
