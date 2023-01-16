import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";

import ProfileEditRuleScreen from "./ProfileEditRuleScreen";
import ProfilesRulesScreen from "./ProfileRulesScreen";
import { ProfilesListScreen } from "./ProfilesListScreen";

const Stack = createStackNavigator();
export default function ProfilesNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ProfilesListScreen"
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
        name="ProfilesListScreen"
        component={ProfilesListScreen}
        options={{
          title: "Profiles",
        }}
      />
      <Stack.Screen
        name="ProfileRulesScreen"
        component={ProfilesRulesScreen}
        options={{
          title: "Profile Rules",
        }}
      />
      <Stack.Screen
        name="ProfileEditRuleScreen"
        component={ProfileEditRuleScreen}
        options={{
          title: "Edit Rule",
        }}
      />
    </Stack.Navigator>
  );
}
