const findWorkspaceRoot = require("find-yarn-workspace-root");

const root = findWorkspaceRoot(__dirname);

module.exports = {
  projectRoot: __dirname,
  watchFolders: [root],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
