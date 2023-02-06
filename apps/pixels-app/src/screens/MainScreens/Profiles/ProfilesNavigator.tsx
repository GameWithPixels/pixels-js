import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { NativeBaseProvider } from "native-base";

import ProfileEditRuleScreen from "./ProfileEditRuleScreen";
import ProfilesRulesScreen from "./ProfileRulesScreen";
import { ProfilesListScreen } from "./ProfilesListScreen";

import { ProfilesScreenStackParamList } from "~/navigation";
import { paleBluePixelTheme } from "~/themes";

const Stack = createStackNavigator<ProfilesScreenStackParamList>();

export default function ProfilesNavigator() {
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
