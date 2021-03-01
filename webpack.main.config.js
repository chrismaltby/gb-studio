const plugins = require("./webpack.plugins");
const CopyPlugin = require("copy-webpack-plugin");

const mainPlugins = [].concat(
  plugins,
  new CopyPlugin([
    { from: "node_modules/about-window", to: "node_modules/about-window" }
  ]) 
);

module.exports = {
  target: "electron-main",
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/main.ts",
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.rules")
  },
  plugins: mainPlugins,
  resolve: {
    extensions: [".wasm", ".js", ".ts", ".jsx", ".tsx", ".css"]
  },
  externals: {
    "about-window": "about-window"
  }
};
