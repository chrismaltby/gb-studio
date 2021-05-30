const plugins = require("./webpack.plugins");
const Path = require("path");
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
  watch: true,
  watchOptions: {
    poll: true,
    ignored: /node_modules/
  },
  entry: Path.resolve(__dirname, "./src/bin/gb-studio-cli.ts"),
  output: {
    filename: 'gb-studio-cli.js',
    path: Path.resolve(__dirname, './out/cli'),
    publicPath: __dirname
  },
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.rules")
  },
//   plugins: [].concat(plugins, new webpack.DefinePlugin({
//     $dirname: '__dirname',
//   })),
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"]
  }
};
