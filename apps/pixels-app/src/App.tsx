import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { PixelTheme } from "@systemic-games/react-native-pixels-components";
import { NativeBaseProvider } from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { LogBox } from "react-native";
import { Provider } from "react-redux";

import { RootStackParamList } from "./Navigation";
import { store } from "./app/store";
import { NavigationContainerComponent } from "./components/NavigationContainerComponent";
import secondScreen from "./screens/MainScreens/secondScreen";
import ThirdScreen from "./screens/MainScreens/thirdScreen";

import HomeNavigator from "~/screens/MainScreens/Home/HomeNavigator";

const Stack = createStackNavigator<RootStackParamList>();

// Disable theses warnings that come from NativeBase
LogBox.ignoreLogs([
  "We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320",
]);

export default function App() {
  return (
    <Provider store={store}>
      <NativeBaseProvider theme={PixelTheme}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              ...TransitionPresets.SlideFromRightIOS,
              animationTypeForReplace: "pop",
            }}
          >
            <Stack.Screen name="Home" component={HomeNavigator} />
            <Stack.Screen name="SecondScreen" component={secondScreen} />
            <Stack.Screen name="ThirdScreen" component={ThirdScreen} />
          </Stack.Navigator>
          <NavigationContainerComponent />
        </NavigationContainer>
      </NativeBaseProvider>
    </Provider>
  );
}
