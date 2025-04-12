const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidFeatures(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!Array.isArray(androidManifest["uses-feature"])) {
      androidManifest["uses-feature"] = [];
    }

    androidManifest["uses-feature"].push(
      // Request background BLE support
      {
        $: {
          "android:name": "android.hardware.bluetooth_le",
          "android:required": "true",
        },
      }
    );
    return config;
  });
};
