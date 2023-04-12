import { createDrawerNavigator } from "@react-navigation/drawer";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { initBluetooth } from "@systemic-games/react-native-pixels-connect";
import { StatusBar } from "expo-status-bar";
import { NativeBaseProvider, themeTools } from "native-base";
import React from "react";
import { useTranslation } from "react-i18next";
import { Appearance, LogBox } from "react-native";
import {
  MD3DarkTheme as PaperDarkTheme,
  MD3LightTheme as PaperLightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
// import * as Sentry from "sentry-expo";

import { useAppSelector } from "~/app/hooks";
import { store } from "~/app/store";
import { type RootScreensParamList } from "~/navigation";
import AnimationsScreen from "~/screens/AnimationsScreen";
import FirmwareUpdateNavigator from "~/screens/FirmwareUpdateNavigator";
import HomeNavigator from "~/screens/HomeNavigator";
import RollScreen from "~/screens/RollScreen";
import { SettingsScreen } from "~/screens/SettingsScreen";
import ValidationScreen from "~/screens/ValidationScreen";
import theme from "~/theme";
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

const Drawer = createDrawerNavigator<RootScreensParamList>();

function MyApp() {
  const themeMode = useAppSelector((state) => state.displaySettings.themeMode);
  const darkOrLight =
    themeMode === "system" ? Appearance.getColorScheme() : themeMode;
  const paperTheme = darkOrLight === "dark" ? PaperDarkTheme : PaperLightTheme;
  const drawerBackground = themeTools.getColor(theme, "coolGray.700"); // TODO dark/light

  const { t } = useTranslation();

  return (
    <PaperProvider theme={paperTheme}>
      <NativeBaseProvider theme={theme} config={{ strictMode: "error" }}>
        <NavigationContainer theme={DarkTheme}>
          <Drawer.Navigator
            screenOptions={{
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 26,
              },
              headerTitleAlign: "center",
              drawerStyle: {
                backgroundColor: drawerBackground,
              },
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
      </NativeBaseProvider>
    </PaperProvider>
  );
}

export default function () {
  return (
    // <StrictMode> Disabled because of warnings caused by AnimatedComponent <StrictMode>
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <MyApp />
      </SafeAreaProvider>
    </ReduxProvider>
    // </StrictMode>
  );
}

// export default Sentry.Native.wrap(App);
