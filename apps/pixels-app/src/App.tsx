import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { PixelTheme } from "@systemic-games/react-native-pixels-components";
import { NativeBaseProvider } from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace
import { LogBox } from "react-native";
import { Provider } from "react-redux";

import { store } from "./app/store";
import { TabBarNavigator } from "./components/TabBarNavigator";
import PatternsNavigator from "./screens/MainScreens/Patterns/PatternsNavigator";
import ProfilesNavigator from "./screens/MainScreens/Profiles/ProfilesNavigator";

import HomeNavigator from "~/screens/MainScreens/Home/HomeNavigator";

LogBox.ignoreLogs([
  // From NativeBase
  "We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320",
  // From Three.js
  "THREE.FileLoader: HTTP Status 0 received.",
]);

export default function App() {
  return (
    <Provider store={store}>
      <NativeBaseProvider theme={PixelTheme}>
        <NavigationContainer>
          <TabBarNavigator
            theme={PixelTheme}
            height={65}
            items={[
              {
                screen: { name: "Dice Bag", component: HomeNavigator },
                imageRequirePath: require("../assets/UI_Icons/D10.png"),
                TabSelectedColor: "pixelColors.red",
                TabUnselectedColor: "pixelColors.red",
                iconSize: 9,
              },
              {
                screen: { name: "Profiles", component: ProfilesNavigator },
                imageRequirePath: require("../assets/UI_Icons/id-card.png"),
                TabSelectedColor: "pixelColors.purple",
                TabUnselectedColor: "pixelColors.purple",
                iconSize: 10,
              },
              {
                screen: { name: "Patterns", component: PatternsNavigator },
                imageRequirePath: require("../assets/UI_Icons/pixels-fill.png"),
                TabSelectedColor: "pixelColors.green",
                TabUnselectedColor: "pixelColors.green",
                iconSize: 9,
              },
              {
                screen: { name: "Settings", component: PatternsNavigator },
                imageRequirePath: require("../assets/UI_Icons/diagram.png"),
                TabSelectedColor: "pixelColors.yellow",
                TabUnselectedColor: "pixelColors.yellow",
                iconSize: 9,
              },
            ]}
          />
        </NavigationContainer>
      </NativeBaseProvider>
    </Provider>
  );
}
