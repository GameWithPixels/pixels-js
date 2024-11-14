// Assume production build by default
const prod =
  !process.env.SYSTEMIC_TB_DEV &&
  process.env.EAS_BUILD_PROFILE !== "development";

const config = {
  expo: {
    name: prod ? "Pixels Toolbox" : "Dev Toolbox",
    slug: prod ? "pixels-toolbox" : "pixels-toolbox-dev",
    owner: "gamewithpixels",
    runtimeVersion: "51.5", // Major is Expo version, minor is native code revision
    version: "6.2.0", // Version number must have 3 parts
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
      "expo-font",
      "react-native-vision-camera",
      [
        "@sentry/react-native/expo",
        {
          organization: "systemic-games",
          project: prod ? "pixels-toolbox" : "pixels-toolbox-dev",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 26,
          },
        },
      ],
    ],
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
