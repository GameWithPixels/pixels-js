module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    [
      // Reanimated plugin has to be listed last.
      "react-native-reanimated/plugin",
      {
        globals: ["__getImageRgbAverages"],
      },
    ],
  ],
};
