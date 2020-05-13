const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const plugins = [
  new ForkTsCheckerWebpackPlugin({
    async: false,
    memoryLimit: 4096
  }),
  new webpack.DefinePlugin({
    VERSION: JSON.stringify(require("./package.json").version)
  })
];

if(process.env.ANALYZE_BUNDLE) {
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = plugins;
