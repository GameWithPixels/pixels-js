import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { PaperProvider } from "react-native-paper";

import { EditDieProfileScreen } from "./EditDieProfileScreen";
import { EditAdvancedRulesScreen } from "../profiles/EditAdvancedRulesScreen";
import { EditRollRuleScreen } from "../profiles/EditRolledRulesScreen";
import { EditRuleScreen } from "../profiles/EditRuleScreen";

import {
  EditDieProfileStackParamList,
  getStackNavigationOptions,
} from "~/navigation";
import { getRootScreenTheme } from "~/themes";

const Stack = createNativeStackNavigator<EditDieProfileStackParamList>();

export function EditDieProfileStack(/* props: EditDieProfileStackProps */) {
  return (
    <PaperProvider theme={getRootScreenTheme("home")}>
      <BottomSheetModalProvider>
        <Stack.Navigator screenOptions={getStackNavigationOptions()}>
          <Stack.Screen
            name="editDieProfile"
            component={EditDieProfileScreen}
            options={getStackNavigationOptions("slide-from-bottom")}
          />
          <Stack.Screen
            name="editAdvancedRules"
            component={EditAdvancedRulesScreen}
          />
          <Stack.Screen name="editRule" component={EditRuleScreen} />
          <Stack.Screen name="editRollRules" component={EditRollRuleScreen} />
        </Stack.Navigator>
      </BottomSheetModalProvider>
    </PaperProvider>
  );
}
