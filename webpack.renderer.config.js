const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");
const CopyPlugin = require("copy-webpack-plugin");

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

const rendererPlugins = [].concat(
  plugins,
  new CopyPlugin([{ from: "node_modules/vm2", to: "node_modules/vm2" }])
);

module.exports = {
  // Put your normal webpack config below here
  target: "electron-renderer",
  module: {
    rules,
  },
  optimization: {
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
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      "react-dom": "@hot-loader/react-dom",
    },
  },
  externals: {
    vm2: "vm2",
  },
};
