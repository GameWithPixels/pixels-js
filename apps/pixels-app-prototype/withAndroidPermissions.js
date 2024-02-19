const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidPermissions(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    androidManifest["uses-permission"].push(
      // Request legacy Bluetooth permissions on older devices
      {
        $: {
          "android:name": "android.permission.BLUETOOTH",
          "android:maxSdkVersion": "30",
        },
      },
      {
        $: {
          "android:name": "android.permission.BLUETOOTH_ADMIN",
          "android:maxSdkVersion": "30",
        },
      },
      // Needed for BLE scan on Android 11 (SDK 30)
      {
        $: {
          "android:name": "android.permission.ACCESS_FINE_LOCATION",
          "android:maxSdkVersion": "30",
        },
      },
      // Needed for BLE scan & connect on Android >= 12 (SDK 31)
      {
        $: {
          "android:name": "android.permission.BLUETOOTH_SCAN",
          "android:usesPermissionFlags": "neverForLocation",
        },
      },
      {
        $: {
          "android:name": "android.permission.BLUETOOTH_CONNECT",
        },
      },
      // Needed for DFU background service
      {
        $: {
          "android:name": "android.permission.FOREGROUND_SERVICE",
        },
      }
    );
    return config;
  });
};
