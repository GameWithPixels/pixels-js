import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { NativeBaseProvider } from "native-base";
import React from "react";

import AnimationEditScreen from "./AnimationEditScreen";
import AnimationsListScreen from "./AnimationsListScreen";

import { AnimationsScreenStackParamList } from "~/navigation";
import { paleBluePixelTheme } from "~/themes";

const Stack = createStackNavigator<AnimationsScreenStackParamList>();

export function PatternsNavigator() {
  return (
    <NativeBaseProvider theme={paleBluePixelTheme}>
      <Stack.Navigator
        screenOptions={{
          headerBackImage: () => (
            <Ionicons name="md-arrow-back-outline" size={24} color="white" />
          ),
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
