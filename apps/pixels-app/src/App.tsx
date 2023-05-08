import "react-native-gesture-handler";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import {
  BaseStyles,
  PixelColors,
} from "@systemic-games/react-native-pixels-components";
import { initBluetooth } from "@systemic-games/react-native-pixels-connect";
import { StatusBar } from "expo-status-bar";
import { configure } from "mobx";
import React from "react";
import { Image, ImageSourcePropType, LogBox, View } from "react-native";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Text,
} from "react-native-paper";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { persistor, store } from "~/app/store";
import { RootStackParamList } from "~/navigation";
import { AppSettings } from "~/screens/AppSettings";
import { PatternsNavigator } from "~/screens/animations/AnimationsNavigator";
import { HomeNavigator } from "~/screens/home/HomeNavigator";
import { ProfilesNavigator } from "~/screens/profiles/ProfilesNavigator";

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

// Theming
const navThemes = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  reactNavigationDark: NavDarkTheme,
});

const LightTheme = {
  ...MD3LightTheme,
  ...navThemes.LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...navThemes.LightTheme.colors,
  },
};
const DarkTheme = {
  ...MD3DarkTheme,
  ...navThemes.DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...navThemes.DarkTheme.colors,
  },
};

// Initialize Bluetooth globally
initBluetooth();

const Tab = createBottomTabNavigator<RootStackParamList>();

function createTabScreenOptions(opt: {
  title?: string;
  imageSource: ImageSourcePropType;
  iconSize: number;
  color: string;
  inactiveColor?: string;
}): React.ComponentPropsWithoutRef<typeof Tab.Screen>["options"] {
  return {
    title: opt.title,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Image
        alt="item"
        source={opt.imageSource}
        style={{
          width: opt.iconSize,
          height: opt.iconSize,
          tintColor: focused ? opt.color : opt.inactiveColor,
        }}
      />
    ),
    tabBarActiveTintColor: opt.color,
    tabBarInactiveTintColor: opt.inactiveColor,
  };
}

function App() {
  const darkOrLight = "dark"; // TODO add option to select theme
  const insets = useSafeAreaInsets();
  const theme = darkOrLight === "dark" ? DarkTheme : LightTheme;
  return (
    <View style={{ flex: 1, marginBottom: insets.bottom }}>
      <PaperProvider theme={theme}>
        <StatusBar style={darkOrLight} />
        <NavigationContainer theme={theme}>
          <Tab.Navigator
            screenOptions={{
              // headerShown: false, // This option causes a flicker, instead we're giving it an empty header component
              header: () => <View style={{ marginTop: insets.top }} />,
              tabBarStyle: {
                borderTopWidth: 0, // Override default border top width
              },
              tabBarHideOnKeyboard: true,
            }}
          >
            <Tab.Screen
              name="HomeNav"
              component={HomeNavigator}
              options={createTabScreenOptions({
                title: "Dice Bag",
                imageSource: require("!/UI_Icons/D10.png"),
                color: PixelColors.red,
                iconSize: 30,
              })}
            />
            <Tab.Screen
              name="ProfilesNav"
              component={ProfilesNavigator}
              options={createTabScreenOptions({
                title: "Library",
                imageSource: require("!/UI_Icons/id-card.png"),
                color: PixelColors.purple,
                iconSize: 30,
              })}
            />
            <Tab.Screen
              name="AnimationsNav"
              component={PatternsNavigator}
              options={createTabScreenOptions({
                title: "Animations",
                imageSource: require("!/UI_Icons/pixels-fill.png"),
                color: PixelColors.green,
                iconSize: 30,
              })}
            />
            <Tab.Screen
              name="Settings"
              component={AppSettings}
              options={createTabScreenOptions({
                title: "Settings",
                imageSource: require("!/UI_Icons/diagram.png"),
                color: PixelColors.yellow,
                iconSize: 30,
              })}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </View>
  );
}

export default function () {
  return (
    // <StrictMode> Disabled because of warnings caused by AnimatedComponent <StrictMode>
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PersistGate
          loading={
            <View style={BaseStyles.centeredFlex}>
              <Text>Loading...</Text>
            </View>
          }
          persistor={persistor}
        >
          <ActionSheetProvider>
            <App />
          </ActionSheetProvider>
        </PersistGate>
      </ReduxProvider>
    </SafeAreaProvider>
    // </StrictMode>
  );
}
