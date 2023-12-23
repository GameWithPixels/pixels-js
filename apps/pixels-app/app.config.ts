// Assume production build by default
const prod =
  !process.env.SYSTEMIC_PX_DEV &&
  process.env.EAS_BUILD_PROFILE !== "development";

const config = {
  expo: {
    name: prod ? "Pixels Beta" : "Dev Pixels Beta",
    slug: prod ? "pixels-app" : "pixels-app-dev",
    owner: "gamewithpixels",
    runtimeVersion: "49.0", // Major is Expo version, minor is native code revision
    version: "0.99.0", // Version number must have 3 parts
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
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera",
        NSBluetoothPeripheralUsageDescription:
          "Allow $(PRODUCT_NAME) to use Bluetooth",
        NSBluetoothAlwaysUsageDescription:
          "Allow $(PRODUCT_NAME) to use Bluetooth",
      },
      bundleIdentifier: prod
        ? "com.systemicgames.pixelsapp"
        : "com.systemicgames.pixelsappdev",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: prod
          ? "./assets/images/adaptive-icon.png"
          : "./assets/images/adaptive-icon-dev.png",
        backgroundColor: "#222222",
      },
      package: prod
        ? "com.systemicgames.pixelsapp"
        : "com.systemicgames.pixelsappdev",
      permissions: ["android.permission.CAMERA"],
    },
    plugins: [
      "./withAndroidPermissions",
      "expo-localization",
      "react-native-vision-camera",
      "sentry-expo",
      [
        "expo-build-properties",
        {
          android: {
            kotlinVersion: "1.7.0",
            flipper: "0.182.0",
          },
        },
      ],
    ],
    hooks: {
      postPublish: [
        {
          file: "sentry-expo/upload-sourcemaps",
          config: {
            organization: "systemic-games",
            project: prod ? "pixels-app" : "pixels-app-dev",
          },
        },
      ],
    },
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
