import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./homeScreen";
import PixelDetailScreen from "./pixelDetailScreen";

import { ProfilesScreen } from "~/screens/ProfilesScreen";
const Stack = createStackNavigator();
export default function Home() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Dices" component={HomeScreen} />
      <Stack.Screen name="Pixel Details" component={PixelDetailScreen} />
      <Stack.Screen name="Profiles " component={ProfilesScreen} />
    </Stack.Navigator>
  );
}
