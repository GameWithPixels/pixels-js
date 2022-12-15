import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import AnimationSettingsScreen from "./AnimationSettingsScreen";
import PatternsScreen from "./PatternsScreen";

const Stack = createStackNavigator();
export default function PatternsNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Patterns"
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
        name="PatternsScreen"
        component={PatternsScreen}
        options={{
          title: "Lighting Patterns",
        }}
      />
      <Stack.Screen
        name="AnimationSettingsScreen"
        component={AnimationSettingsScreen}
        options={{
          title: "Animation Settings",
        }}
      />
    </Stack.Navigator>
  );
}
