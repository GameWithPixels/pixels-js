import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { initBluetooth } from "@systemic-games/react-native-pixels-connect";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { Appearance, LogBox } from "react-native";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
// import * as Sentry from "sentry-expo";

import { useAppSelector } from "~/app/hooks";
import { store } from "~/app/store";
import { type RootScreensParamList } from "~/navigation";
import { AnimationsScreen } from "~/screens/AnimationsScreen";
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

// Use Sentry for crash reporting
// Sentry.init({
//   dsn: "https://cc730e3207d64053b222cede5599338d@o1258420.ingest.sentry.io/6512529",
//   // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
//   // We recommend adjusting this value in production.
//   tracesSampleRate: 1.0,
//   enableInExpoDevelopment: true,
//   debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
// });

// Initialize Bluetooth globally
initBluetooth();

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

const Drawer = createDrawerNavigator<RootScreensParamList>();

function AppContent() {
  const themeMode = useAppSelector((state) => state.displaySettings.themeMode);
  const darkOrLight =
    themeMode === "system" ? Appearance.getColorScheme() : themeMode;
  const theme = darkOrLight === "dark" ? DarkTheme : LightTheme;

  const { t } = useTranslation();

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <Drawer.Navigator
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
            name="FirmwareUpdateNavigator"
            component={FirmwareUpdateNavigator}
            options={{ title: t("firmwareUpdate") }}
          />
          <Drawer.Screen name="Roll" component={RollScreen} />
          <Drawer.Screen name="Animations" component={AnimationsScreen} />
          <Drawer.Screen name="Settings" component={SettingsScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    // <StrictMode> Disabled because of warnings caused by AnimatedComponent <StrictMode>
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ActionSheetProvider>
          <AppContent />
        </ActionSheetProvider>
      </SafeAreaProvider>
    </ReduxProvider>
    // </StrictMode>
  );
}

// export default Sentry.Native.wrap(App);
