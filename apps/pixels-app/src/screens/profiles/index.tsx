import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { ThemeProvider } from "react-native-paper";

import { CreateProfileScreen } from "./CreateProfileScreen";
import { EditProfileScreen } from "./EditProfileScreen";
import { EditRollRuleScreen } from "./EditRolledRulesScreen";
import { EditAdvancedRulesScreen, EditRuleScreen } from "./EditRuleScreen";
import { PickAnimationScreen } from "./PickAnimationScreen";
import { ProfilesListScreen } from "./ProfilesListScreen";

import {
  ProfilesStackProps,
  ProfilesStackParamList,
  getStackNavigationOptions,
} from "@/navigation";
import { getRootScreenTheme } from "@/themes";

const Stack = createStackNavigator<ProfilesStackParamList>();

export function ProfilesStack({ route }: ProfilesStackProps) {
  return (
    <ThemeProvider theme={getRootScreenTheme(route.name)}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="profilesList" component={ProfilesListScreen} />
        <Stack.Screen
          name="createProfile"
          component={CreateProfileScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="editProfile"
          component={EditProfileScreen}
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
