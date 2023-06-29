import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { NativeBaseProvider } from "native-base";

import HomeScreen from "./HomeScreen";
import PixelAdvancedSettingsScreen from "./PixelAdvancedSettingsScreen";
import PixelDetailScreen from "./PixelDetailScreen";

import { HomeScreenStackParamList } from "~/navigation";
import { paleBluePixelTheme } from "~/themes";

const Stack = createStackNavigator<HomeScreenStackParamList>();

export default function HomeNavigator() {
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