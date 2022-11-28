import { createStackNavigator } from "@react-navigation/stack";

import PixelAdvancedSettingsScreen from "./PixelAdvancedSettingsScreen";
import HomeScreen from "./homeScreen";
import PixelDetailScreen from "./pixelDetailScreen";

const Stack = createStackNavigator();
export default function Home() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: "black",
        },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen
        name="Dices"
        component={HomeScreen}
        options={{ title: "Dice Bag" }}
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
