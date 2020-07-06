const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const GitRevisionPlugin = require('git-revision-webpack-plugin');

const gitRevisionPlugin = new GitRevisionPlugin({
  commithashCommand: 'rev-list --max-count=1 --no-merges --abbrev-commit HEAD'
});

const plugins = [
  new webpack.DefinePlugin({
    'VERSION': JSON.stringify(gitRevisionPlugin.version()),
    'COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
  }),
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
