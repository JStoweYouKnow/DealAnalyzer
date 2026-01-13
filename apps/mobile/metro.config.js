// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Get paths for monorepo structure
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Configure for monorepo: prefer local node_modules and exclude problematic directories
config.watchFolders = [projectRoot];
config.resolver = {
  ...config.resolver,
  // Block problematic directories from file watching
  blockList: [
    ...(config.resolver.blockList || []),
    /\.turbo\/.*/,
    // Don't traverse into root node_modules to avoid permission issues
    new RegExp(`${monorepoRoot}/node_modules/.*`),
  ],
  // Prioritize local node_modules
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
  ],
};

module.exports = config;

