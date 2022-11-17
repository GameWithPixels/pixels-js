import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./homeScreen";
import PixelDetailScreen from "./pixelDetailScreen";

import { ProfilesScreen } from "~/screens/ProfilesScreen";
const Stack = createStackNavigator();
export default function Home() {
  return (
    <Stack.Navigator initialRouteName="HomeScreen">
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="PixelDetailScreen" component={PixelDetailScreen} />
      <Stack.Screen name="ProfilesScreen" component={ProfilesScreen} />
    </Stack.Navigator>
  );
}
