import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  getFocusedRouteNameFromRoute,
  NavigationContainer,
  RouteProp,
} from "@react-navigation/native";
import {
  getPixel,
  Pixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
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
  useTheme,
} from "react-native-paper";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ErrorFallback } from "./components/ErrorFallback";
import { TabBar } from "./components/TabBar";
import {
  createScannedPixel,
  getDefaultAnimations,
  getDefaultColorDesigns,
  getDefaultProfiles,
} from "./data";
import { dieTypes } from "./dieTypes";
import {
  ActiveProfile,
  ActiveProfilesContext,
  AnimationsContext,
  PairedPixelsContext,
  ProfilesContext,
  ScannedPixelsContext,
} from "./hooks";
import { ColorDesignsContext } from "./hooks/useColorDesigns";
import { SettingsContext } from "./hooks/useSettings";
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
import { PixelAnimation, PixelProfile } from "@/temp";

LogBox.ignoreLogs(["THREE.WebGLProgram: Program Info Log:"]);

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

function createAndConnect(sp: ScannedPixel): Pixel {
  // Pair all initially scanned dice
  const pixel = getPixel(sp.pixelId);
  // Auto connect to dice
  pixel.connect().catch((e) => console.log(`Connection error: ${e}`));
  return pixel;
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

function AppDataProviders({ children }: React.PropsWithChildren) {
  // Settings
  const [showIntro, setShowIntro] = React.useState(false);
  const [showPromo, setShowPromo] = React.useState(true);

  // Fake Pixels management
  const [allScannedPixels, setScannedPixels] = React.useState<ScannedPixel[]>(
    dieTypes.map(() => createScannedPixel())
  );
  const newScannedPixel = React.useCallback(
    () =>
      setScannedPixels((scannedPixels) => [
        ...scannedPixels,
        createScannedPixel(),
      ]),
    []
  );
  const [pixels, setPixels] = React.useState<Pixel[]>(() =>
    allScannedPixels.map((sp) => createAndConnect(sp))
  );
  const resetScannedList = React.useCallback(
    () =>
      setScannedPixels((scannedPixels) =>
        scannedPixels.filter(
          (sp) => !pixels.every((p) => p.pixelId !== sp.pixelId)
        )
      ),
    [pixels]
  );
  const pairDie = React.useCallback((sp: ScannedPixel) => {
    setPixels((pixels) =>
      pixels.every((p) => sp.systemId !== p.systemId)
        ? [...pixels, createAndConnect(sp)]
        : pixels
    );
  }, []);
  const unpairDie = React.useCallback((p: Pixel) => {
    setPixels((pixels) =>
      pixels.includes(p) ? pixels.filter((p2) => p2 !== p) : pixels
    );
  }, []);
  const scannedPixels = React.useMemo(
    () =>
      allScannedPixels.filter((sp) =>
        pixels.every((p) => p.systemId !== sp.systemId)
      ),
    [allScannedPixels, pixels]
  );
  const [activeProfiles, setActiveProfiles] = React.useState<ActiveProfile[]>(
    []
  );
  const changeProfile = React.useCallback(
    (pixel: Pixel, profile: PixelProfile) => {
      setActiveProfiles((profiles) => {
        const i = profiles.findIndex((p) => p.pixel === pixel);
        if (i >= 0) {
          const copy = [...profiles];
          copy[i] = { pixel, profile };
          return copy;
        } else {
          return [...profiles, { pixel, profile }];
        }
      });
    },
    []
  );
  // Profiles management
  const [profiles, setProfiles] = React.useState(() => getDefaultProfiles());
  const addProfile = React.useCallback(
    (p: PixelProfile) =>
      setProfiles((profiles) =>
        profiles.find((p2) => p.uuid === p2.uuid) ? profiles : [...profiles, p]
      ),
    []
  );
  const removeProfile = React.useCallback(
    (uuid: string) =>
      setProfiles((profiles) =>
        profiles.find((p) => p.uuid === uuid)
          ? profiles.filter((p) => p.uuid !== uuid)
          : profiles
      ),
    []
  );
  // Animations management
  const [animations, setAnimations] = React.useState(() =>
    getDefaultAnimations()
  );
  const addAnimation = React.useCallback(
    (a: PixelAnimation) =>
      setAnimations((animations) =>
        animations.find((a2) => a.uuid === a2.uuid)
          ? animations
          : [...animations, a]
      ),
    []
  );
  const removeAnimation = React.useCallback(
    (uuid: string) =>
      setAnimations((animations) =>
        animations.find((a) => a.uuid !== uuid)
          ? animations.filter((a) => a.uuid === uuid)
          : animations
      ),
    []
  );
  // Color designs management
  const colorDesigns = React.useMemo(() => getDefaultColorDesigns(), []);

  return (
    <SettingsContext.Provider
      value={React.useMemo(
        () => ({ showIntro, setShowIntro, showPromo, setShowPromo }),
        [showIntro, showPromo]
      )}
    >
      <ScannedPixelsContext.Provider
        value={React.useMemo(
          () => ({ scannedPixels, newScannedPixel, resetScannedList }),
          [newScannedPixel, resetScannedList, scannedPixels]
        )}
      >
        <PairedPixelsContext.Provider
          value={React.useMemo(
            () => ({ pairedPixels: pixels, pairDie, unpairDie }),
            [pairDie, pixels, unpairDie]
          )}
        >
          <ActiveProfilesContext.Provider
            value={React.useMemo(
              () => ({ activeProfiles, changeProfile }),
              [activeProfiles, changeProfile]
            )}
          >
            <ProfilesContext.Provider
              value={React.useMemo(
                () => ({ profiles, addProfile, removeProfile }),
                [addProfile, profiles, removeProfile]
              )}
            >
              <AnimationsContext.Provider
                value={React.useMemo(
                  () => ({ animations, addAnimation, removeAnimation }),
                  [addAnimation, animations, removeAnimation]
                )}
              >
                <ColorDesignsContext.Provider
                  value={React.useMemo(
                    () => ({ colorDesigns }),
                    [colorDesigns]
                  )}
                >
                  {children}
                </ColorDesignsContext.Provider>
              </AnimationsContext.Provider>
            </ProfilesContext.Provider>
          </ActiveProfilesContext.Provider>
        </PairedPixelsContext.Provider>
      </ScannedPixelsContext.Provider>
    </SettingsContext.Provider>
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
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppDataProviders>
        <SafeAreaProvider>
          <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            <PaperProvider theme={AppDarkTheme}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <ActionSheetProvider>
                  <BottomSheetModalProvider>
                    <NavigationContainer theme={AppDarkTheme}>
                      <StatusBar style="light" />
                      <AppPage />
                    </NavigationContainer>
                  </BottomSheetModalProvider>
                </ActionSheetProvider>
              </ErrorBoundary>
            </PaperProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </AppDataProviders>
    </View>
  );
}
