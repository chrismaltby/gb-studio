/* eslint-disable @typescript-eslint/no-var-requires */
const plugins = require("../shared/webpack.plugins");
const { appPath, repoPath, srcPath } = require("../shared/webpack.paths");
const webpack = require("webpack");

module.exports = {
  target: "electron-main",
  mode: "development",
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: {
    index: appPath("gb-studio-cli", "gb-studio-cli.ts"),
    buildWorker: srcPath("lib", "compiler", "buildWorker.ts"),
  },
  output: {
    filename: (pathData) => {
      if (pathData.chunk.name === "index") {
        return "gb-studio-cli.js";
      }
      return "[name].js";
    },
    path: repoPath("out", "cli"),
    publicPath: __dirname,
  },
  // Put your normal webpack config below here
  module: {
    rules: require("../shared/webpack.rules"),
  },
  plugins: [].concat(
    plugins,
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
  ),
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      store: srcPath("store"),
      components: srcPath("components"),
      lang: srcPath("lang"),
      lib: srcPath("lib"),
      ui: srcPath("components", "ui"),
      shared: srcPath("shared"),
      consts: srcPath("consts.ts"),
      "#my-quickjs-variant": require.resolve(
        "@jitl/quickjs-singlefile-cjs-release-sync",
      ),
    },
  },
};
