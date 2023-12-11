import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  getFocusedRouteNameFromRoute,
  NavigationContainer,
  RouteProp,
} from "@react-navigation/native";
import { initBluetooth } from "@systemic-games/react-native-pixels-connect";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LogBox, StyleSheet, View, ViewStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  configureFonts,
  MD3LightTheme,
  MD3Theme,
  PaperProvider,
  Text,
  useTheme,
} from "react-native-paper";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { persistor, store } from "./app/store";
import { ErrorFallback } from "./components/ErrorFallback";
import { TabBar } from "./components/TabBar";
import {
  AnimationsStackParamList,
  BottomTabParamList,
  HomeStackParamList,
  ProfilesStackParamList,
} from "./navigation";
import { AnimationsStack } from "./screens/animations";
import { HomeStack } from "./screens/home";
import { ProfilesStack } from "./screens/profiles";
import { SettingsStack } from "./screens/settings";
import { AppDarkTheme, PixelThemes } from "./themes";

import AnimationsIcon from "#/icons/navigation/animations";
import DiceBagIcon from "#/icons/navigation/dice-bag";
import MoreIcon from "#/icons/navigation/more";
import ProfilesIcon from "#/icons/navigation/profiles";

LogBox.ignoreLogs(["THREE.WebGLProgram: Program Info Log:"]);

// Initialize Bluetooth globally
initBluetooth();

const Tab = createBottomTabNavigator<BottomTabParamList>();

function getTabBarStyle<T extends object>(
  route: RouteProp<BottomTabParamList>,
  name: Extract<keyof T, string>
): ViewStyle | undefined {
  // Returns undefined until we navigate to a sub screen
  const routeName = getFocusedRouteNameFromRoute(
    route
  ) as keyof HomeStackParamList;
  return routeName && routeName !== name ? { display: "none" } : undefined;
}

function AppPage() {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: top,
        backgroundColor: theme.colors.background,
      }}
    >
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
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
            title: "Profiles",
            tabBarIcon: ProfilesIcon,
            tabBarStyle: getTabBarStyle<ProfilesStackParamList>(
              route,
              "profilesList"
            ),
          })}
        />
        <Tab.Screen
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
        />
        <Tab.Screen
          name="settings"
          component={SettingsStack}
          options={{ title: "More", tabBarIcon: MoreIcon }}
        />
      </Tab.Navigator>
    </View>
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
    Object.values(PixelThemes).forEach(setupThemeFont);
    themeFontsUpdated = true;
  }
}

// Let fonts time to load before hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function App() {
  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    "LTInternet-Regular": require("#/fonts/LTInternet-Regular.ttf"),
    "LTInternet-Bold": require("#/fonts/LTInternet-Bold.ttf"),
  });

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  updateThemesFonts();

  return (
    // TODO enable with reanimated 3.6
    // <React.StrictMode>
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            <PaperProvider theme={AppDarkTheme}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <ActionSheetProvider>
                  <BottomSheetModalProvider>
                    <StatusBar style="light" />
                    <PersistGate
                      loading={
                        <View
                          style={{
                            flex: 1,
                            alignContent: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text>Loading...</Text>
                        </View>
                      }
                      persistor={persistor}
                    >
                      <NavigationContainer theme={AppDarkTheme}>
                        <AppPage />
                      </NavigationContainer>
                    </PersistGate>
                  </BottomSheetModalProvider>
                </ActionSheetProvider>
              </ErrorBoundary>
            </PaperProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ReduxProvider>
    </View>
    // </React.StrictMode>
  );
}
