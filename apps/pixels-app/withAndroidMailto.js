const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidMailto(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest.queries = [
      {
        intent: [
          {
            action: [{ $: { "android:name": "android.intent.action.SENDTO" } }],
            data: [{ $: { "android:scheme": "mailto" } }],
          },
        ],
      },
    ];

    return config;
  });
};
