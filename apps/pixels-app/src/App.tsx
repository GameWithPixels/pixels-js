import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { PixelTheme } from "@systemic-games/react-native-pixels-components";
import { useBluetooth } from "@systemic-games/react-native-pixels-connect";
import { configure } from "mobx";
import { Center, NativeBaseProvider, Text } from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { LogBox } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { persistor, store } from "./app/store";
import { TabBarNavigator } from "./components/TabBarNavigator";
import AppSettings from "./screens/AppSettings";
import PatternsNavigator from "./screens/animations/AnimationsNavigator";
import ProfilesNavigator from "./screens/profiles/ProfilesNavigator";

import HomeNavigator from "~/screens/home/HomeNavigator";

configure({
  enforceActions: "never",
});

LogBox.ignoreLogs([
  // From NativeBase
  "We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320",
  // From Three.js
  "THREE.FileLoader: HTTP Status 0 received.",
  /SerializableStateInvariantMiddleware took */,
  /ImmutableStateInvariantMiddleware took */,
]);

export default function App() {
  useBluetooth();
  return (
    <Provider store={store}>
      <NativeBaseProvider theme={PixelTheme}>
        <PersistGate
          loading={
            <Center>
              <Text>Loading...</Text>
            </Center>
          }
          persistor={persistor}
        >
          <NavigationContainer>
            <TabBarNavigator
              theme={PixelTheme}
              height={65}
              items={[
                {
                  screen: { name: "DiceBag", component: HomeNavigator },
                  imageRequirePath: require("!/UI_Icons/D10.png"),
                  selectedColor: "pixelColors.red",
                  iconSize: 9,
                },
                {
                  screen: { name: "Profiles", component: ProfilesNavigator },
                  imageRequirePath: require("!/UI_Icons/id-card.png"),
                  selectedColor: "pixelColors.purple",
                  iconSize: 10,
                },
                {
                  screen: { name: "Patterns", component: PatternsNavigator },
                  imageRequirePath: require("!/UI_Icons/pixels-fill.png"),
                  selectedColor: "pixelColors.green",
                  iconSize: 9,
                },
                {
                  screen: { name: "Settings", component: AppSettings },
                  imageRequirePath: require("!/UI_Icons/diagram.png"),
                  selectedColor: "pixelColors.yellow",
                  iconSize: 9,
                },
              ]}
            />
          </NavigationContainer>
        </PersistGate>
      </NativeBaseProvider>
    </Provider>
  );
}
