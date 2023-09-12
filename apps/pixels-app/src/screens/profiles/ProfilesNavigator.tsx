// import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { PixelThemeProvider } from "@systemic-games/react-native-pixels-components";

import { ProfileEditScreen } from "./ProfileEditScreen";
import { ProfilesListScreen } from "./ProfilesListScreen";
import { RuleEditScreen } from "./RuleEditScreen";

import { ProfilesScreenStackParamList } from "~/navigation";

const Stack = createStackNavigator<ProfilesScreenStackParamList>();

export function ProfilesNavigator() {
  return (
    <PixelThemeProvider accent="purple">
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
          name="ProfilesList"
          component={ProfilesListScreen}
          options={{
            title: "Profiles",
          }}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{
            title: "Edit Profile",
          }}
        />
        <Stack.Screen
          name="RuleEdit"
          component={RuleEditScreen}
          options={{
            title: "Edit Rule",
          }}
        />
      </Stack.Navigator>
    </PixelThemeProvider>
  );
}
