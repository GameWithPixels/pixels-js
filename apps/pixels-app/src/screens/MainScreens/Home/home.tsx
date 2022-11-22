import { createStackNavigator } from "@react-navigation/stack";

import PixelAdvancedSettingsScreen from "./PixelAdvancedSettingsScreen";
import HomeScreen from "./homeScreen";
import PixelDetailScreen from "./pixelDetailScreen";

const Stack = createStackNavigator();
export default function Home() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Dices" component={HomeScreen} />
      <Stack.Screen name="Pixel Details" component={PixelDetailScreen} />
      <Stack.Screen
        name="PixelAdvancedSettingsScreen"
        component={PixelAdvancedSettingsScreen}
        options={{ title: "Advanced Settings" }}
      />
    </Stack.Navigator>
  );
}
