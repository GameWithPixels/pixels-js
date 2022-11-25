module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "babel-plugin-root-import",
        {
          rootPathSuffix: "./src",
          rootPathPrefix: "~",
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
