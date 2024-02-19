// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require("expo/metro-config");
const findWorkspaceRoot = require("find-yarn-workspace-root");
const path = require("path");

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = findWorkspaceRoot(__dirname);

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// Support more file extensions
config.resolver.assetExts.push("glb");

module.exports = config;
