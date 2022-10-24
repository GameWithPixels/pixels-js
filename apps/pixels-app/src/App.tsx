import "react-native-gesture-handler";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import {
  createStackNavigator,
  StackNavigationProp,
} from "@react-navigation/stack";
import {
  Toggle,
  Pxtheme,
  BatteryLevel,
  RSSIStrength,
  AppPage,
  Card,
} from "@systemic-games/react-native-pixels-components";
import {
  Text,
  Link,
  HStack,
  Center,
  Heading,
  Switch,
  useColorMode,
  VStack,
  Box,
  NativeBaseProvider,
  Button,
} from "native-base";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import NavigationMenuBar from "../../../packages/react-native-base-components/src/components/BottomMenuBar";
import { RootStackParamList, ScreenProps } from "./Navigation";
import { NavigationContainerComponent } from "./components/NavigationContainerComponent";
import homeScreen from "./screens/homeScreen";
import secondScreen from "./screens/secondScreen";
import ThirdScreen from "./screens/thirdScreen";

const Stack = createStackNavigator<RootStackParamList>();

// function NavigateTo({ navigation }: ScreenProps, path: any) {
//   navigation.navigate(path);
// }

export default function App() {
  return (
    <NativeBaseProvider theme={Pxtheme}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="HomeScreen" component={homeScreen} />
          <Stack.Screen name="SecondScreen" component={secondScreen} />
          <Stack.Screen name="ThirdScreen" component={ThirdScreen} />
        </Stack.Navigator>
        {/* <AppPage theme={Pxtheme}>
          <VStack space={4}>
            <Card />
            <Card />
            <Toggle text="Hello toggle" />
            <Card />
            <Card />
          </VStack>
        </AppPage> */}
        <NavigationContainerComponent />
      </NavigationContainer>
    </NativeBaseProvider>
  );
}

// Color Switch Component
function ToggleDarkMode() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <HStack space={2} alignItems="center">
      <Text>Dark</Text>
      <Switch
        isChecked={colorMode === "light"}
        onToggle={toggleColorMode}
        aria-label={
          colorMode === "light" ? "switch to dark mode" : "switch to light mode"
        }
      />
      <Text>Light</Text>
    </HStack>
  );
}
