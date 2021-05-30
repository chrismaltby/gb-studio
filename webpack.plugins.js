const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const { GitRevisionPlugin } = require("git-revision-webpack-plugin");
const pkg = require("./package.json");

const gitRevisionPlugin = new GitRevisionPlugin({
  commithashCommand: "rev-list --max-count=1 --no-merges --abbrev-commit HEAD",
});

const docsUrl = pkg.version.includes("beta")
  ? "https://develop.gbstudio.dev/docs/"
  : "https://www.gbstudio.dev/docs/";

const plugins = [
  new webpack.DefinePlugin({
    GIT_VERSION: JSON.stringify(gitRevisionPlugin.version()),
    COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
    VERSION: JSON.stringify(pkg.version),
    DOCS_URL: JSON.stringify(docsUrl),
  }),
  new ForkTsCheckerWebpackPlugin({
    async: false,
    typescript: {
      memoryLimit: 4096,
    },
  }),
];

if (process.env.ANALYZE_BUNDLE) {
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = plugins;
