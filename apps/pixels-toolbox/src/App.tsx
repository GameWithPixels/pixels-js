import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
// eslint-disable-next-line import/namespace
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Sentry from "sentry-expo";

import StatsScreen from "./screens/StatsScreen";
import ValidationScreen from "./screens/ValidationScreen";
import useBluetooth from "./useBluetooth";

import { type RootStackParamList } from "~/navigation";
import AnimationsScreen from "~/screens/AnimationsScreen";
import ConnectScreen from "~/screens/ConnectScreen";
import DfuScreen from "~/screens/DfuScreen";
import MenuScreen from "~/screens/MenuScreen";
import SelectDfuFileScreen from "~/screens/SelectDfuFileScreen";
import { sr } from "~/styles";
import "./i18n";

// Disable this warning that comes from NativeBase
LogBox.ignoreLogs(["EventEmitter.removeListener"]);

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
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
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
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="Connect" component={ConnectScreen} />
          <Stack.Screen name="SelectDfuFile" component={SelectDfuFileScreen} />
          <Stack.Screen name="Dfu" component={DfuScreen} />
          <Stack.Screen name="Animations" component={AnimationsScreen} />
          <Stack.Screen name="Validation" component={ValidationScreen} />
          <Stack.Screen name="Stats" component={StatsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default Sentry.Native.wrap(App);
