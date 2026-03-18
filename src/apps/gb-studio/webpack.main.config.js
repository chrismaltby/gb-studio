/* eslint-disable @typescript-eslint/no-var-requires */
const plugins = require("../shared/webpack.plugins");
const rules = require("../shared/webpack.rules");
const CopyPlugin = require("copy-webpack-plugin");
const { appPath, repoPath, srcPath } = require("../shared/webpack.paths");

// Add support for native node modules
const mainRules = [
  ...rules,
  {
    test: /\.node$/,
    use: "node-loader",
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: "@vercel/webpack-asset-relocator-loader",
      options: {
        outputAssetBase: "native_modules",
      },
    },
  },
];

const mainPlugins = [
  ...plugins,
  new CopyPlugin({
    patterns: [
      { from: "node_modules/about-window", to: "node_modules/about-window" },
      {
        from: "node_modules/acorn",
        to: "node_modules/acorn",
      },
      {
        from: "node_modules/acorn-walk",
        to: "node_modules/acorn-walk",
      },
    ],
  }),
];

module.exports = {
  target: "electron-main",
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    index: appPath("gb-studio", "main.ts"),
    buildWorker: srcPath("lib", "compiler", "buildWorker.ts"),
  },
  output: {
    path: repoPath(".webpack", "main"),
    filename: "[name].js",
  },
  // Put your normal webpack config below here
  module: {
    rules: mainRules,
  },
  plugins: mainPlugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".wasm", ".css"],
    alias: {
      store: srcPath("store"),
      components: srcPath("components"),
      lang: srcPath("lang"),
      lib: srcPath("lib"),
      ui: srcPath("components", "ui"),
      shared: srcPath("shared"),
      consts: srcPath("consts.ts"),
      "patrons.json": repoPath("patrons.json"),
      "#my-quickjs-variant": require.resolve(
        "@jitl/quickjs-singlefile-cjs-release-sync",
      ),
    },
  },
  externals: {
    "about-window": "about-window",
    acorn: "acorn",
    "acorn-walk": "acorn-walk",
  },
};
