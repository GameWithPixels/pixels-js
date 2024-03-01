const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withAndroidAsyncStorageDbSize(config) {
  const newGraddleProperties = [
    {
      type: "property",
      key: "AsyncStorage_db_size_in_MB",
      value: "50",
    },
  ];
  return withGradleProperties(config, (config) => {
    newGraddleProperties.map((gradleProperty) =>
      config.modResults.push(gradleProperty)
    );

    return config;
  });
};
