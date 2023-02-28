import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NativeBaseProvider } from "native-base";

import HomeScreen from "./HomeScreen";
import PixelAdvancedSettingsScreen from "./PixelAdvancedSettingsScreen";
import PixelDetailScreen from "./PixelDetailScreen";

import { HomeScreenStackParamList } from "~/navigation";
import { paleBluePixelTheme } from "~/themes";

const Stack = createNativeStackNavigator<HomeScreenStackParamList>();

export default function HomeNavigator() {
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
          name="Home"
          component={HomeScreen}
          options={{
            title: "Dice Bag",
          }}
        />
        <Stack.Screen
          name="PixelDetails"
          component={PixelDetailScreen}
          options={{
            title: "Die Details",
          }}
        />
        <Stack.Screen
          name="PixelAdvancedSettings"
          component={PixelAdvancedSettingsScreen}
          options={{ title: "Advanced Settings" }}
        />
      </Stack.Navigator>
    </NativeBaseProvider>
  );
}
