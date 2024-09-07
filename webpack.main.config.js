/* eslint-disable @typescript-eslint/no-var-requires */
const plugins = require("./webpack.plugins");
const rules = require("./webpack.rules");
const CopyPlugin = require("copy-webpack-plugin");
const Path = require("path");

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
        from: "node_modules/vm2",
        to: "node_modules/vm2",
        info: { minimized: true },
      },
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

const srcPath = (subdir) => {
  return Path.join(__dirname, "src", subdir);
};

module.exports = {
  target: "electron-main",
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    index: "./src/main.ts",
    buildWorker: "./src/lib/compiler/buildWorker.ts",
  },
  output: {
    path: __dirname + "/.webpack/main",
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
      ui: srcPath("components/ui"),
      shared: srcPath("shared"),
      consts: srcPath("consts.ts"),
      "patrons.json": Path.join(__dirname, "patrons.json"),
    },
  },
  externals: {
    vm2: "vm2",
    "about-window": "about-window",
    acorn: "acorn",
    "acorn-walk": "acorn-walk",
  },
};
