import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { PaperProvider } from "react-native-paper";

import { EditAdvancedSettingsScreen } from "./EditAdvancedSettingsScreen";
import { EditProfileScreen } from "./EditProfileScreen";
import { EditRollRuleScreen } from "./EditRolledRulesScreen";
import { EditRuleScreen } from "./EditRuleScreen";

import {
  getStackNavigationOptions,
  EditProfileStackParamList,
} from "~/app/navigation";
import { useAppTheme } from "~/hooks";

const Stack = createNativeStackNavigator<EditProfileStackParamList>();

export function EditProfilesStack(/* props: EditProfileStackProps */) {
  const theme = useAppTheme("profiles");
  return (
    <PaperProvider theme={theme}>
      <BottomSheetModalProvider>
        <Stack.Navigator screenOptions={getStackNavigationOptions()}>
          <Stack.Screen
            name="editProfile"
            component={EditProfileScreen}
            options={getStackNavigationOptions("slide-from-bottom")}
          />
          <Stack.Screen
            name="editAdvancedSettings"
            component={EditAdvancedSettingsScreen}
          />
          <Stack.Screen name="editRule" component={EditRuleScreen} />
          <Stack.Screen name="editRollRules" component={EditRollRuleScreen} />
        </Stack.Navigator>
      </BottomSheetModalProvider>
    </PaperProvider>
  );
}
