import { delay } from "@systemic-games/pixels-core-utils";
import Constants from "expo-constants";
import * as SplashScreen from "expo-splash-screen";
import * as React from "react";
import { Animated, Platform, StyleSheet, useAnimatedValue } from "react-native";

import { AppDarkTheme } from "~/themes";

// TODO use Constants.expoConfig?.splash?.image
const splashImage = __DEV__
  ? require("#/images/splash-dev.png")
  : require("#/images/splash.png");

// https://github.com/expo/examples/blob/master/with-splash-screen/App.js
// export function AnimatedAppLoader({ children }: React.PropsWithChildren) {
//   const [isSplashReady, setSplashReady] = React.useState(false);

//   React.useEffect(() => {
//     const task = async () => {
//       //   if (image.uri) {
//       //     await Asset.fromURI(image.uri).downloadAsync();
//       //   }
//       setSplashReady(true);
//     };
//     task();
//   }, []);

//   if (!isSplashReady) {
//     return null;
//   }

//   return <AnimatedSplashScreen children={children} />;
// }

export function AnimatedSplashScreen({ children }: React.PropsWithChildren) {
  const animation = useAnimatedValue(1);
  const [isAppReady, setAppReady] = React.useState(false);
  const [hideSplash, setHideSplash] = React.useState(false);

  const onImageLoaded = React.useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
      // Load stuff
      // await Promise.all([]);
      await delay(1000);
    } catch (e) {
      // handle errors
    } finally {
      setAppReady(true);
    }
  }, []);

  React.useEffect(() => {
    if (isAppReady) {
      Animated.timing(animation, {
        toValue: 0,
        duration: Platform.OS === "ios" ? 1500 : 2000, // TODO let some time for the dice to connect
        useNativeDriver: true,
      }).start(() => {
        setHideSplash(true);
      });
    }
  }, [animation, isAppReady]);

  return (
    <>
      {isAppReady && children}
      {!hideSplash && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                Constants.expoConfig?.splash?.backgroundColor ??
                AppDarkTheme.colors.background,
              opacity: animation,
            },
          ]}
        >
          <Animated.Image
            style={{
              width: "100%",
              height: "100%",
              resizeMode: Constants.expoConfig?.splash?.resizeMode ?? "contain",
            }}
            source={splashImage}
            onLoadEnd={onImageLoaded}
            fadeDuration={0}
          />
        </Animated.View>
      )}
    </>
  );
}
