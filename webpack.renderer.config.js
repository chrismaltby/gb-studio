/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");
const Path = require("path");

const rendererRules = [
  ...rules,
  {
    test: /\.css$/,
    use: [{ loader: "style-loader" }, { loader: "css-loader" }],
  }
]

const rendererPlugins = [
  ...plugins,
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
  })
];

const srcPath = (subdir) => {
  return Path.join(__dirname, "src", subdir);
};

module.exports = {
  // Put your normal webpack config below here
  target: "web",
  node: {
    __dirname: true,
    __filename: true,
  },
  module: {
    rules: rendererRules,
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
    fallback: {
      path: require.resolve("path-browserify"),
      buffer: require.resolve("buffer"),
    },
  },
};
