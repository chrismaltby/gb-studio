const plugins = require("./webpack.plugins");
const Path = require("path");
const webpack = require("webpack");

const srcPath = (subdir) => {
  return Path.join(__dirname, "src", subdir);
};

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
  entry: Path.resolve(__dirname, "./src/bin/gb-studio-cli.ts"),
  output: {
    filename: "gb-studio-cli.js",
    path: Path.resolve(__dirname, "./out/cli"),
    publicPath: __dirname,
  },
  // Put your normal webpack config below here
  module: {
    rules: require("./webpack.rules"),
  },
  plugins: [].concat(
    plugins,
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true })
  ),
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      store: srcPath("store"),
      components: srcPath("components"),
      lib: srcPath("lib"),
      ui: srcPath("components/ui"),
    },
  },
};
