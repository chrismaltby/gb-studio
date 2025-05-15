/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");
const Path = require("path");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ReactRefreshTypeScript = require("react-refresh-typescript");

const isDevelopment = process.env.NODE_ENV !== "production";

const rendererRules = [
  {
    test: /\.worker\.(ts|js)$/,
    exclude: /(node_modules|.webpack)/,
    rules: [
      // {
      //   loader: "worker-loader",
      //   options: { publicPath: "../" },
      // },
      {
        loader: "ts-loader",
        options: {
          getCustomTransformers: isDevelopment
            ? () => ({
                before: [ReactRefreshTypeScript()],
              })
            : undefined,
          transpileOnly: true,
        },
      },
    ],
  },
  {
    test: /^(?!.*\.worker\.ts$).*\.(ts|tsx|js|jsx)$/,
    exclude: /(node_modules|.webpack)/,
    use: [
      {
        loader: require.resolve("ts-loader"),
        options: {
          getCustomTransformers: isDevelopment
            ? () => ({
                before: [ReactRefreshTypeScript()],
              })
            : undefined,
          transpileOnly: true,
        },
      },
    ],
  },
  ...rules.slice(1), // Remove global ts-loader rule replaced with ReactRefreshTypeScript version defined above
  {
    test: /\.css$/,
    use: [{ loader: "style-loader" }, { loader: "css-loader" }],
  },
];

const rendererPlugins = [
  ...plugins,
  new webpack.ProvidePlugin({
    Buffer: ["buffer", "Buffer"],
  }),
];

if (isDevelopment) {
  rendererPlugins.push(new ReactRefreshWebpackPlugin());
}

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
      "contributors-external.json": Path.join(
        __dirname,
        "contributors-external.json"
      ),
      "patrons.json": Path.join(__dirname, "patrons.json"),
    },
    fallback: {
      path: require.resolve("path-browserify"),
      buffer: require.resolve("buffer"),
    },
  },
};
