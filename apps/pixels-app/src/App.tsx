import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  getFocusedRouteNameFromRoute,
  NavigationContainer,
  RouteProp,
} from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import { initBluetooth } from "@systemic-games/react-native-pixels-connect";
import Constants from "expo-constants";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LogBox, Platform, StyleSheet, ViewStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  configureFonts,
  MD3LightTheme,
  MD3Theme,
  PaperProvider,
  useTheme,
} from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { AnimatedSplashScreen } from "./app/AnimatedSplashScreen";
import { AppDfuFiles } from "./app/AppDfuFiles";
import { AppInit } from "./app/AppInit";
import { AppPixelsCentral } from "./app/AppPixelsCentral";
import { useAppSelector } from "./app/hooks";
import {
  BottomTabParamList,
  HomeStackParamList,
  ProfilesStackParamList,
} from "./app/navigation";
import { persistor, store } from "./app/store";
import { AppDarkTheme, AppThemes } from "./app/themes";
import { ErrorFallback } from "./components/ErrorFallback";
import { TabBar } from "./components/TabBar";
import { UpdateProfileProvider } from "./components/UpdateProfileProvider";
import { HomeStack } from "./screens/home";
import { OnboardingScreen } from "./screens/onboarding";
import { ProfilesStack } from "./screens/profiles";
import { SettingsStack } from "./screens/settings";

import DiceBagIcon from "#/icons/navigation/dice-bag";
import MoreIcon from "#/icons/navigation/more";
import ProfilesIcon from "#/icons/navigation/profiles";

if (__DEV__) {
  // https://gist.github.com/mikelehen/5398652
  const timeStart = new Date().getTime();
  console.log = (function () {
    const console_log = console.log;
    return function (...args): void {
      const delta = Date.now() - timeStart;
      const secs = Math.floor(delta / 1000);
      const ms = delta % 1000;
      const timestamp = `${secs.toString().padStart(3, "0")}.${ms.toString().padStart(3, "0")}:`;
      console_log.apply(console, [timestamp, ...args]);
    };
  })();
}

LogBox.ignoreLogs([
  "THREE.WebGLProgram: Program Info Log:",
  "Sentry Logger [warn]:",
  "ImmutableStateInvariantMiddleware",
  // Ignore warning caused by AnimatedComponent/ExponentGLView & TouchableNativeFeedback using findNodeHandle & findHostInstance_DEPRECATED respectively
  "Warning: findNodeHandle is deprecated in StrictMode.",
]);

const routingInstrumentation = !__DEV__
  ? new Sentry.ReactNavigationInstrumentation()
  : undefined;
if (routingInstrumentation) {
  const loggingUri = Constants.expoConfig?.hostUri
    ? `http://${Constants.expoConfig.hostUri}/logs`
    : undefined;
  // Construct a new instrumentation instance. This is needed to communicate between the integration and React
  Sentry.init({
    dsn: __DEV__
      ? "https://4b7872190c6f2fb2c5ae87721f0e550d@o1258420.ingest.sentry.io/4506547864666112"
      : "https://0a1c5f5b8bc2d93b005d30e6254e0681@o1258420.ingest.sentry.io/4506415846588416",
    tracesSampleRate: 1.0, // TODO Set to a lower value in production
    debug: __DEV__,
    integrations: [
      new Sentry.ReactNativeTracing({
        enableUserInteractionTracing: true,
        idleTimeoutMs: 5000,
        routingInstrumentation,
        // https://docs.expo.dev/guides/using-sentry/#expo-dev-client-transactions-never-finish
        shouldCreateSpanForRequest: (url) => {
          return !__DEV__ || !loggingUri || !url.startsWith(loggingUri);
        },
      }),
    ],
  });
}

// Initialize Bluetooth globally
initBluetooth();

const Tab = createBottomTabNavigator<BottomTabParamList>();

function getTabBarStyle<T extends object>(
  route: RouteProp<BottomTabParamList>,
  name: Extract<keyof T, string>
): ViewStyle | undefined {
  // Returns undefined until we navigate to a sub screen
  const routeName =
    Platform.OS === "ios"
      ? // Hiding the tab bar creates issues on iOS
        undefined
      : (getFocusedRouteNameFromRoute(route) as keyof HomeStackParamList);
  return routeName && routeName !== name ? { display: "none" } : undefined;
}

function AppPage() {
  const showOnboarding = useAppSelector(
    (state) => state.appSettings.showOnboarding
  );

  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
        initialRouteName={showOnboarding ? "onboarding" : "home"}
        backBehavior="none"
      >
        <Tab.Screen
          name="home"
          component={HomeStack}
          options={({ route }) => ({
            title: "Dice Bag",
            tabBarIcon: DiceBagIcon,
            tabBarStyle: getTabBarStyle<HomeStackParamList>(route, "diceList"),
          })}
        />
        <Tab.Screen
          name="profiles"
          component={ProfilesStack}
          options={({ route }) => ({
            title: "Library",
            tabBarIcon: ProfilesIcon,
            tabBarStyle: getTabBarStyle<ProfilesStackParamList>(
              route,
              "profilesList"
            ),
          })}
        />
        {/* <Tab.Screen
          name="animations"
          component={AnimationsStack}
          options={({ route }) => ({
            title: "Animations",
            tabBarIcon: AnimationsIcon,
            tabBarStyle: getTabBarStyle<AnimationsStackParamList>(
              route,
              "animationsList"
            ),
          })}
        /> */}
        <Tab.Screen
          name="settings"
          component={SettingsStack}
          options={{ title: "More", tabBarIcon: MoreIcon }}
        />
        <Tab.Screen
          name="onboarding"
          component={OnboardingScreen}
          options={{
            tabBarItemStyle: { display: "none" },
            tabBarStyle: { display: "none" },
            unmountOnBlur: true,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

let themeFontsUpdated = false;
function updateThemesFonts() {
  function setupThemeFont(theme: MD3Theme): void {
    const fontConfig = {
      bold: {
        ...MD3LightTheme.fonts.bodySmall,
        fontFamily: "LTInternet-Bold",
      },
    };
    // @ts-ignore
    const fonts = configureFonts({ config: fontConfig });
    theme.fonts = Object.fromEntries(
      Object.entries(fonts).map(([name, variant]) => {
        const newVariant = { ...variant };
        if (name !== "bold") {
          newVariant.fontFamily = "LTInternet-Regular";
        } else {
          newVariant.letterSpacing = 0;
        }
        // @ts-ignore
        if (typeof newVariant.fontSize === "number") newVariant.fontSize *= 1.2;
        return [name, newVariant];
      })
    ) as MD3Theme["fonts"];
  }
  if (!themeFontsUpdated) {
    Object.values(AppThemes).forEach(setupThemeFont);
    themeFontsUpdated = true;
  }
}

// We'll hide the splash screen when everything has loaded
SplashScreen.preventAutoHideAsync().catch(() => {
  //reloading the app might trigger some race conditions, ignore them
});

function App() {
  // Instrument React Navigation
  const navigation = React.useRef(null);
  const onReady = React.useCallback(
    () => routingInstrumentation?.registerNavigationContainer(navigation),
    []
  );

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    "LTInternet-Regular": require("#/fonts/LTInternet-Regular.ttf"),
    "LTInternet-Bold": require("#/fonts/LTInternet-Bold.ttf"),
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  updateThemesFonts();

  return (
    // <React.StrictMode>
    <Sentry.TouchEventBoundary>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            <PaperProvider theme={AppDarkTheme}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <NavigationContainer
                  ref={navigation}
                  theme={AppDarkTheme}
                  onReady={onReady}
                >
                  <StatusBar style="light" />
                  <PersistGate persistor={persistor}>
                    <AppInit>
                      <AppPixelsCentral>
                        <AppDfuFiles>
                          <AnimatedSplashScreen>
                            <RootSiblingParent>
                              <ActionSheetProvider>
                                <BottomSheetModalProvider>
                                  <UpdateProfileProvider>
                                    <AppPage />
                                  </UpdateProfileProvider>
                                </BottomSheetModalProvider>
                              </ActionSheetProvider>
                            </RootSiblingParent>
                          </AnimatedSplashScreen>
                        </AppDfuFiles>
                      </AppPixelsCentral>
                    </AppInit>
                  </PersistGate>
                </NavigationContainer>
              </ErrorBoundary>
            </PaperProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ReduxProvider>
    </Sentry.TouchEventBoundary>
    // </React.StrictMode>
  );
}

// For instrumentation
export default routingInstrumentation ? Sentry.wrap(App) : App;
