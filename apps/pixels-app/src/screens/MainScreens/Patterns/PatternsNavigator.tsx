import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { NativeBaseProvider } from "native-base";
import React from "react";

import AnimationSettingsScreen from "./AnimationSettingsScreen";
import PatternsListScreen from "./PatternsListScreen";

import { AnimationsScreenStackParamList } from "~/navigation";
import { paleBluePixelTheme } from "~/themes";

const Stack = createStackNavigator<AnimationsScreenStackParamList>();

export default function PatternsNavigator() {
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
          name="PatternsList"
          component={PatternsListScreen}
          options={{
            title: "Lighting Patterns",
          }}
        />
        <Stack.Screen
          name="AnimationSettings"
          component={AnimationSettingsScreen}
          options={{
            title: "Lighting Patterns Settings",
          }}
        />
      </Stack.Navigator>
    </NativeBaseProvider>
  );
}
