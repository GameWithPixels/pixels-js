import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { NativeBaseProvider } from "native-base";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import * as Sentry from "sentry-expo";

import { store } from "./app/store";
import AnimationsScreen from "./screens/AnimationsScreen";
import DiceRenderer from "./screens/DiceRenderer";
import theme from "./theme";

import useBluetooth from "~/features/pixels/hooks/useBluetooth";
import { type RootStackParamList } from "~/navigation";
import HomeScreen from "~/screens/HomeScreen";
import RollScreen from "~/screens/RollScreen";
import SelectDfuFilesScreen from "~/screens/SelectDfuFilesScreen";
import ValidationScreen from "~/screens/ValidationScreen";
import { sr } from "~/styles";

// Import internationalization file so it's initialized
import "~/i18n";

// Use Sentry for crash reporting
Sentry.init({
  dsn: "https://cc730e3207d64053b222cede5599338d@o1258420.ingest.sentry.io/6512529",
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  useBluetooth();
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NativeBaseProvider theme={theme} config={{ strictMode: "error" }}>
          <NavigationContainer theme={DarkTheme}>
            <Stack.Navigator
              screenOptions={{
                headerTitleStyle: {
                  fontWeight: "bold",
                  fontSize: sr(26),
                  alignSelf: "center",
                },
                headerTitleAlign: "center",
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="SelectDfuFiles"
                component={SelectDfuFilesScreen}
              />
              <Stack.Screen name="Validation" component={ValidationScreen} />
              <Stack.Screen name="Roll" component={RollScreen} />
              <Stack.Screen name="Animations" component={AnimationsScreen} />
              <Stack.Screen name="DiceRenderer" component={DiceRenderer} />
            </Stack.Navigator>
          </NavigationContainer>
        </NativeBaseProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

export default Sentry.Native.wrap(App);
