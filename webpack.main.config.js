/* eslint-disable @typescript-eslint/no-var-requires */
const plugins = require("./webpack.plugins");
const CopyPlugin = require("copy-webpack-plugin");
const Path = require("path");

const mainPlugins = [].concat(
  plugins,
  new CopyPlugin({
    patterns: [
      { from: "node_modules/about-window", to: "node_modules/about-window" },
      {
        from: "node_modules/vm2",
        to: "node_modules/vm2",
        info: { minimized: true },
      },
    ],
  })
);

const srcPath = (subdir) => {
  return Path.join(__dirname, "src", subdir);
};

module.exports = {
  target: "electron-main",
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/main.ts",
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.rules"),
  },
  plugins: mainPlugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".wasm", ".css"],
    alias: {
      store: srcPath("store"),
      components: srcPath("components"),
      lang: srcPath("lang"),
      lib: srcPath("lib"),
      ui: srcPath("components/ui"),
      shared: srcPath("shared"),
      consts: srcPath("consts.ts"),
    },
  },
  externals: {
    vm2: "vm2",
    "about-window": "about-window",
  },
};
