import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { CreateProfileScreen } from "./CreateProfileScreen";
import { EditProfilesStack } from "./EditProfileStack";
import { ProfilesListScreen } from "./ProfilesListScreen";

import { NavigationRoot } from "~/components/NavigationRoot";
import {
  ProfilesStackProps,
  ProfilesStackParamList,
  getStackNavigationOptions,
} from "~/navigation";

const Stack = createNativeStackNavigator<ProfilesStackParamList>();

export function ProfilesStack({ route }: ProfilesStackProps) {
  return (
    <NavigationRoot screenName={route.name}>
      <Stack.Navigator screenOptions={getStackNavigationOptions()}>
        <Stack.Screen name="profilesList" component={ProfilesListScreen} />
        <Stack.Screen
          name="createProfile"
          component={CreateProfileScreen}
          options={getStackNavigationOptions("bottom-sheet")}
        />
        <Stack.Screen
          name="editProfileStack"
          component={EditProfilesStack}
          options={{
            ...getStackNavigationOptions("bottom-sheet"),
            gestureEnabled: false, // TODO disable gestures because sliding down bottom sheet also slides down screen
          }}
        />
      </Stack.Navigator>
    </NavigationRoot>
  );
}
