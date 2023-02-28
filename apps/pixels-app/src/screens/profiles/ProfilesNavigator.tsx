import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NativeBaseProvider } from "native-base";

import ProfileEditRuleScreen from "./ProfileEditRuleScreen";
import ProfilesRulesScreen from "./ProfileRulesScreen";
import { ProfilesListScreen } from "./ProfilesListScreen";

import { ProfilesScreenStackParamList } from "~/navigation";
import { paleBluePixelTheme } from "~/themes";

const Stack = createNativeStackNavigator<ProfilesScreenStackParamList>();

export default function ProfilesNavigator() {
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
          name="ProfilesList"
          component={ProfilesListScreen}
          options={{
            title: "Profiles",
          }}
        />
        <Stack.Screen
          name="ProfileRules"
          component={ProfilesRulesScreen}
          options={{
            title: "Profile Rules",
          }}
        />
        <Stack.Screen
          name="ProfileEditRule"
          component={ProfileEditRuleScreen}
          options={{
            title: "Edit Rule",
          }}
        />
      </Stack.Navigator>
    </NativeBaseProvider>
  );
}
