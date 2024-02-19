const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const findWorkspaceRoot = require("find-yarn-workspace-root");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = findWorkspaceRoot(__dirname);

const config = {
  projectRoot,
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(workspaceRoot, "node_modules"),
    ],
    disableHierarchicalLookup: true,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
