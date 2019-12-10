const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = [
  new ForkTsCheckerWebpackPlugin({
    async: false
  }),
  new webpack.DefinePlugin({
    VERSION: JSON.stringify(require("./package.json").version)
  }),
  new CopyPlugin([
    { from: "node_modules/vm2", to: "node_modules/vm2" },
    { from: "node_modules/about-window", to: "node_modules/about-window" }
  ])
];
