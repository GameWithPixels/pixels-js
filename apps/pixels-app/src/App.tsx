import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { Pxtheme } from "@systemic-games/react-native-pixels-components";
import {
  Box,
  ChevronLeftIcon,
  HStack,
  NativeBaseProvider,
  Text,
} from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { LogBox } from "react-native";

import { RootStackParamList } from "./Navigation";
import { NavigationContainerComponent } from "./components/NavigationContainerComponent";
import homeScreen from "./screens/homeScreen";
import secondScreen from "./screens/secondScreen";
import ThirdScreen from "./screens/thirdScreen";

const Stack = createStackNavigator<RootStackParamList>();

// Disable this warning that comes from NativeBase
LogBox.ignoreLogs(["EventEmitter.removeListener"]);
LogBox.ignoreLogs([
  "We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320",
]);

function CustomNavigationHeader() {
  return (
    <Box h="100%" w={400} p={2} bg="primary.500">
      <HStack>
        <Text>This is the navigation header</Text>
      </HStack>
    </Box>
  );
}

export default function App() {
  return (
    <NativeBaseProvider theme={Pxtheme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerBackImage: (props) => <ChevronLeftIcon />,
            headerShown: false,
            ...TransitionPresets.SlideFromRightIOS,
            animationTypeForReplace: "pop",
          }}
        >
          <Stack.Screen name="HomeScreen" component={homeScreen} />
          <Stack.Screen name="SecondScreen" component={secondScreen} />
          <Stack.Screen name="ThirdScreen" component={ThirdScreen} />
        </Stack.Navigator>
        <NavigationContainerComponent />
      </NavigationContainer>
    </NativeBaseProvider>
  );
}
