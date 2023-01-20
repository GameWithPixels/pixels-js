module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
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
      "react-native-reanimated/plugin",
    ],
  };
};
