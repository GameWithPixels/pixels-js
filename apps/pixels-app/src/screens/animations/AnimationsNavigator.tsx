import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NativeBaseProvider } from "native-base";
import React from "react";

import AnimationEditScreen from "./AnimationEditScreen";
import AnimationsListScreen from "./AnimationsListScreen";

import { AnimationsScreenStackParamList } from "~/navigation";
import { paleBluePixelTheme } from "~/themes";

const Stack = createNativeStackNavigator<AnimationsScreenStackParamList>();

export default function PatternsNavigator() {
  return (
    <NativeBaseProvider theme={paleBluePixelTheme}>
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "black",
          },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen
          name="AnimationsList"
          component={AnimationsListScreen}
          options={{
            title: "Lighting Patterns",
          }}
        />
        <Stack.Screen
          name="AnimationEdit"
          component={AnimationEditScreen}
          options={{
            title: "Lighting Patterns Settings",
          }}
        />
      </Stack.Navigator>
    </NativeBaseProvider>
  );
}
