// Assume production build by default
const prod =
  !process.env.SYSTEMIC_TB_DEV &&
  process.env.EAS_BUILD_PROFILE !== "development";

const config = {
  expo: {
    name: prod ? "Pixels Toolbox" : "Dev Toolbox",
    slug: prod ? "pixels-toolbox" : "pixels-toolbox-dev",
    owner: "gamewithpixels",
    runtimeVersion: "48.8",
    version: "4.5.0", // Version number must have 3 parts
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
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/deab8983-a21f-4c31-9861-41762637a793",
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
        ? "com.systemicgames.pixelstoolbox"
        : "com.systemicgames.pixelstoolboxdev",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: prod
          ? "./assets/images/adaptive-icon.png"
          : "./assets/images/adaptive-icon-dev.png",
        backgroundColor: "#222222",
      },
      package: prod
        ? "com.systemicgames.pixelstoolbox"
        : "com.systemicgames.pixelstoolboxdev",
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
            project: prod ? "pixels-toolbox" : "pixels-toolbox-dev",
          },
        },
      ],
    },
    extra: {
      eas: {
        projectId: prod
          ? "deab8983-a21f-4c31-9861-41762637a793"
          : "bcce78a7-e015-431f-9724-184ae61a2b01",
      },
    },
    jsEngine: "hermes",
  },
};

export default config;
