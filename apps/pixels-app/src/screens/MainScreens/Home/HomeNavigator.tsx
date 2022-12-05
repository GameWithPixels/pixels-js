import { Ionicons } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./HomeScreen";
import PixelAdvancedSettingsScreen from "./PixelAdvancedSettingsScreen";
import PixelDetailScreen from "./PixelDetailScreen";

const Stack = createStackNavigator();
export default function HomeNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
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
        name="Dices"
        component={HomeScreen}
        options={{
          title: "Dice Bag",
        }}
      />
      <Stack.Screen
        name="Pixel Details"
        component={PixelDetailScreen}
        options={{
          title: "Die Details",
        }}
      />
      <Stack.Screen
        name="PixelAdvancedSettingsScreen"
        component={PixelAdvancedSettingsScreen}
        options={{ title: "Advanced Settings" }}
      />
    </Stack.Navigator>
  );
}
