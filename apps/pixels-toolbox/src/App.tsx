import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { BaseVStack } from "@systemic-games/react-native-base-components";
import { initBluetooth } from "@systemic-games/react-native-pixels-connect";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { LogBox, useColorScheme } from "react-native";
import {
  adaptNavigationTheme,
  configureFonts,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Text,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import * as Sentry from "sentry-expo";

import { useAppSelector } from "~/app/hooks";
import { persistor, store } from "~/app/store";
import { type RootScreensParamList } from "~/navigation";
import { AnimationsScreen } from "~/screens/AnimationsScreen";
import { BatchScreen } from "~/screens/BatchScreen";
import { CartonLabelScreen } from "~/screens/CartonLabelScreen";
import { FirmwareUpdateNavigator } from "~/screens/FirmwareUpdateNavigator";
import { HomeNavigator } from "~/screens/HomeNavigator";
import { RollScreen } from "~/screens/RollScreen";
import { SettingsScreen } from "~/screens/SettingsScreen";
import { ValidationScreen } from "~/screens/ValidationScreen";

import "~/i18n"; // Import internationalization file so it's initialized

LogBox.ignoreLogs([
  // Ignore Sentry warnings
  "Sentry Logger [warn]:",
  // Ignore warning caused by AnimatedComponent using findNodeHandle
  "Warning: findNodeHandle is deprecated in StrictMode.",
  // More from reanimated
  "Warning: Using UNSAFE_componentWillMount in strict mode is not recommended",
  "Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended",
]);

if (!__DEV__) {
  // Use Sentry for crash reporting
  Sentry.init({
    dsn: "https://86c162a0a3ba5bcec55c0ba4f23439c2@o1258420.ingest.sentry.io/6512529",
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,
    enableInExpoDevelopment: true,
    // Getting a lot of spam messages in the console... debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  });
}

// Initialize Bluetooth globally
initBluetooth();

// Theming
const navThemes = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  reactNavigationDark: NavDarkTheme,
});

const fontConfig = {
  emojiButton: {
    fontFamily: "Font",
    fontWeight: "400",
    letterSpacing: 0,
    lineHeight: 30,
    fontSize: 26,
  },
} as const;

const LightTheme = {
  ...MD3LightTheme,
  ...navThemes.LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    ...navThemes.LightTheme.colors,
  },
};
const DarkTheme = {
  ...MD3DarkTheme,
  ...navThemes.DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    ...navThemes.DarkTheme.colors,
  },
};

const Drawer = createDrawerNavigator<RootScreensParamList>();

function AppContent() {
  const themeMode = useAppSelector((state) => state.displaySettings.themeMode);
  const colorScheme = useColorScheme();
  const darkOrLight = themeMode === "system" ? colorScheme : themeMode;
  const theme = darkOrLight === "dark" ? DarkTheme : LightTheme;

  const { t } = useTranslation();
  return (
    <PaperProvider theme={theme}>
      <StatusBar style={darkOrLight ? "dark" : "light"} />
      <PersistGate
        loading={
          <BaseVStack alignContent="center" justifyContent="center">
            <Text>Loading...</Text>
          </BaseVStack>
        }
        persistor={persistor}
      >
        <NavigationContainer theme={theme}>
          <Drawer.Navigator
            initialRouteName={
              store.getState().validationSettings.openOnStart
                ? "Validation"
                : undefined
            }
            screenOptions={{
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 26,
              },
              headerTitleAlign: "center",
            }}
          >
            <Drawer.Screen
              name="HomeNavigator"
              component={HomeNavigator}
              options={{ title: t("pixelsScanner") }}
            />
            <Drawer.Screen
              name="Validation"
              component={ValidationScreen}
              options={{ title: t("factoryValidation") }}
            />
            <Drawer.Screen
              name="CartonLabel"
              component={CartonLabelScreen}
              options={{ title: t("cartonLabel") }}
            />
            <Drawer.Screen
              name="FirmwareUpdateNavigator"
              component={FirmwareUpdateNavigator}
              options={{ title: t("firmwareUpdate") }}
            />
            <Drawer.Screen name="Roll" component={RollScreen} />
            <Drawer.Screen name="Animations" component={AnimationsScreen} />
            <Drawer.Screen name="Batch" component={BatchScreen} />
            <Drawer.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: t("settings") }}
            />
          </Drawer.Navigator>
        </NavigationContainer>
      </PersistGate>
    </PaperProvider>
  );
}

function App() {
  return (
    // <StrictMode> Disabled because of warnings caused by AnimatedComponent <StrictMode>
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <AppContent />
        </ActionSheetProvider>
      </SafeAreaProvider>
    </ReduxProvider>
    // </StrictMode>
  );
}

export default Sentry.Native.wrap(App);
