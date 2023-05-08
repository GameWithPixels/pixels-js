import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { PixelThemeProvider } from "@systemic-games/react-native-pixels-components";
import React from "react";

import AnimationEditScreen from "./AnimationEditScreen";
import AnimationsListScreen from "./AnimationsListScreen";

import { AnimationsScreenStackParamList } from "~/navigation";

const Stack = createStackNavigator<AnimationsScreenStackParamList>();

export function PatternsNavigator() {
  return (
    <PixelThemeProvider accent="green">
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // headerBackImage: () => (
          //   <Ionicons name="md-arrow-back-outline" size={24} color="white" />
          // ),
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
            title: "Animations",
          }}
        />
        <Stack.Screen
          name="AnimationEdit"
          component={AnimationEditScreen}
          options={{
            title: "Animation Settings",
          }}
        />
      </Stack.Navigator>
    </PixelThemeProvider>
  );
}
