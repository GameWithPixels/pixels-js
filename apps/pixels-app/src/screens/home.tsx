import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./homeScreen";
import PixelDetailScreen from "./pixelDetailScreen";
const Stack = createStackNavigator();
export default function Home() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PixelDetailScreen" component={PixelDetailScreen} />
    </Stack.Navigator>
  );
}
