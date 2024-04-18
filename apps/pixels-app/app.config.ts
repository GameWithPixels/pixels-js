// Assume production build by default
const prod =
  !process.env.SYSTEMIC_PX_DEV &&
  process.env.EAS_BUILD_PROFILE !== "development";

const version = "2.2.1"; // Version number must have 3 parts
const buildNumber = 2201;

const config = {
  expo: {
    name: prod ? "Pixels" : "Pixels Dev",
    slug: prod ? "pixels-app" : "pixels-app-dev",
    owner: "gamewithpixels",
    runtimeVersion: "49.3", // Major is Expo version, minor is native code revision
    version,
    platforms: ["ios", "android"],
    orientation: "portrait",
    icon: prod ? "./assets/images/icon.png" : "./assets/images/icon-dev.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: prod
        ? "./assets/images/splash.png"
        : "./assets/images/splash-dev.png",
      resizeMode: "contain",
      backgroundColor: "#222222",
    },
    updates: {
      url: "https://u.expo.dev/34c3f779-76ea-4e69-a434-540652c32c79",
    },
    assetBundlePatterns: ["assets/**/*"],
    ios: {
      bundleIdentifier: prod
        ? "com.systemic-games.pixels"
        : "com.systemicgames.pixelsappdev",
      buildNumber: String(buildNumber),
      supportsTablet: false,
      infoPlist: {
        // NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera",
        NSBluetoothPeripheralUsageDescription:
          "Allow $(PRODUCT_NAME) to use Bluetooth to connect to Pixels dice",
        NSBluetoothAlwaysUsageDescription:
          "Allow $(PRODUCT_NAME) to use Bluetooth to connect to Pixels dice",
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    android: {
      package: prod
        ? "com.SystemicGames.Pixels"
        : "com.systemicgames.pixelsappdev",
      versionCode: buildNumber,
      adaptiveIcon: {
        foregroundImage: prod
          ? "./assets/images/adaptive-icon.png"
          : "./assets/images/adaptive-icon-dev.png",
        backgroundColor: "#222222",
      },
      blockedPermissions: ["android.permission.SYSTEM_ALERT_WINDOW"],
    },
    plugins: [
      "./withAndroidPermissions",
      "./withAndroidAsyncStorageDbSize",
      "./withAndroidMailto",
      "expo-localization",
      "expo-font",
      [
        "@sentry/react-native/expo",
        {
          organization: "systemic-games",
          project: prod ? "pixels-app" : "pixels-app-dev",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            // flipper: "0.182.0",
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
    // Getting an error with Expo 49
    // TypeError: [android.gradleProperties]: withAndroidGradlePropertiesBaseMod: nextMod is not a function
    // mods: {
    //   android: {
    //     gradleProperties: [
    //       {
    //         key: "AsyncStorage_db_size_in_MB",
    //         value: "50",
    //       },
    //     ],
    //   },
    // },
    extra: {
      eas: {
        projectId: prod
          ? "34c3f779-76ea-4e69-a434-540652c32c79"
          : "18974074-8dc3-41c4-94b2-437c86fa503c",
      },
    },
    jsEngine: "hermes",
    experiments: {
      tsconfigPaths: true,
    },
  },
};

export default config;
