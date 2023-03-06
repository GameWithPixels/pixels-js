import { createDrawerNavigator } from "@react-navigation/drawer";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { useBluetooth } from "@systemic-games/react-native-pixels-connect";
import { StatusBar } from "expo-status-bar";
import { NativeBaseProvider, themeTools } from "native-base";
import { StrictMode } from "react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line import/namespace
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import * as Sentry from "sentry-expo";

import { store } from "./app/store";
import AnimationsScreen from "./screens/AnimationsScreen";
import DiceRenderer from "./screens/DiceRenderer";
import FirmwareUpdateNavigator from "./screens/FirmwareUpdateNavigator";
import HomeNavigator from "./screens/HomeNavigator";
import theme from "./theme";

import { type RootScreensParamList } from "~/navigation";
import RollScreen from "~/screens/RollScreen";
import ValidationScreen from "~/screens/ValidationScreen";
import { sr } from "~/styles";

// Import internationalization file so it's initialized
import "~/i18n";

LogBox.ignoreLogs([
  // Ignore Sentry warnings
  "Sentry Logger [warn]:",
]);

// Use Sentry for crash reporting
Sentry.init({
  dsn: "https://cc730e3207d64053b222cede5599338d@o1258420.ingest.sentry.io/6512529",
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

const Drawer = createDrawerNavigator<RootScreensParamList>();

function App() {
  useBluetooth();
  const { t } = useTranslation();
  const drawerBackground = themeTools.getColor(theme, "coolGray.700"); // TODO dark/light
  return (
    <StrictMode>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <NativeBaseProvider theme={theme} config={{ strictMode: "error" }}>
            <NavigationContainer theme={DarkTheme}>
              <Drawer.Navigator
                screenOptions={{
                  headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: sr(26),
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
                <Drawer.Screen name="DiceRenderer" component={DiceRenderer} />
              </Drawer.Navigator>
            </NavigationContainer>
          </NativeBaseProvider>
        </SafeAreaProvider>
      </Provider>
    </StrictMode>
  );
}

export default Sentry.Native.wrap(App);
