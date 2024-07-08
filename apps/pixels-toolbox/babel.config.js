module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    env: {
      production: {
        plugins: ["react-native-paper/babel", "transform-remove-console"],
      },
    },
    plugins: [
      ["react-native-worklets-core/plugin"],
      [
        "babel-plugin-root-import",
        {
          paths: [
            {
              rootPathSuffix: "./src",
              rootPathPrefix: "~",
            },
            {
              rootPathSuffix: "./assets",
              rootPathPrefix: "!",
            },
          ],
        },
      ],
      [
        // Reanimated plugin has to be listed last.
        "react-native-reanimated/plugin",
        {
          globals: ["__getImageRgbAverages"],
        },
      ],
    ],
  };
};
