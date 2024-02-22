/* eslint-disable @typescript-eslint/no-var-requires */
const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");
const CopyPlugin = require("copy-webpack-plugin");
const Path = require("path");

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

const rendererPlugins = [].concat(
  plugins,
  new CopyPlugin({
    patterns: [{ from: "node_modules/vm2", to: "node_modules/vm2" }],
  })
);

const srcPath = (subdir) => {
  return Path.join(__dirname, "src", subdir);
};

module.exports = {
  // Put your normal webpack config below here
  target: "electron-renderer",
  module: {
    rules,
  },
  optimization: {
    minimize: false,
    splitChunks: {
      cacheGroups: {
        "vendor-react": {
          name: "vendor-react",
          test: /[\\/]node_modules[\\/](react.*?|redux.*?)[\\/]/,
          chunks: "initial",
          priority: 2,
        },
        "vendor-scriptracker": {
          name: "vendor-scriptracker",
          test: /[\\/]src[\\/]lib[\\/]vendor[\\/]scriptracker[\\/]/,
          chunks: "all",
          priority: 2,
        },
        "vendor-hotloader": {
          name: "vendor-hotloader",
          test: /[\\/]node_modules[\\/]@hot-loader[\\/]/,
          chunks: "all",
          priority: 2,
        },
        "vendor-lodash": {
          name: "vendor-lodash",
          test: /[\\/]node_modules[\\/]lodash[\\/]/,
          chunks: "all",
          priority: 2,
        },
        "vendor-chokidar": {
          name: "vendor-chokidar",
          test: /[\\/]node_modules[\\/]chokidar[\\/]/,
          chunks: "all",
          priority: 2,
        },
      },
    },
  },
  plugins: rendererPlugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".wasm", ".css"],
    alias: {
      "react-dom": "@hot-loader/react-dom",
      store: srcPath("store"),
      components: srcPath("components"),
      lang: srcPath("lang"),
      lib: srcPath("lib"),
      ui: srcPath("components/ui"),
      renderer: srcPath("renderer"),
      shared: srcPath("shared"),
      assets: srcPath("assets"),
      consts: srcPath("consts.ts"),
      wasm: Path.join(__dirname, "appData/wasm"),
      "contributors.json": Path.join(__dirname, "contributors.json"),
    },
  },
  externals: {
    vm2: "vm2",
    fsevents: "require('fsevents')",
  },
};
