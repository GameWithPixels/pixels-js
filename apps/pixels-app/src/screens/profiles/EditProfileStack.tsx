import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ThemeProvider } from "react-native-paper";

import { EditAdvancedRulesScreen } from "./EditAdvancedRulesScreen";
import { EditProfileScreen } from "./EditProfileScreen";
import { EditRollRuleScreen } from "./EditRolledRulesScreen";
import { EditRuleScreen } from "./EditRuleScreen";

import {
  getStackNavigationOptions,
  EditProfileStackParamList,
} from "~/navigation";
import { getRootScreenTheme } from "~/themes";

const Stack = createNativeStackNavigator<EditProfileStackParamList>();

export function EditProfilesStack(/* props: EditProfileStackProps */) {
  return (
    <ThemeProvider theme={getRootScreenTheme("profiles")}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
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
      </Stack.Navigator>
    </ThemeProvider>
  );
}
