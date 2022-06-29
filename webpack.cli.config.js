const plugins = require("./webpack.plugins");
const Path = require("path");

const srcPath = (subdir) => {
  return Path.join(__dirname, "src", subdir);
};

const { IgnorePlugin } = require('webpack');

const optionalPlugins = [];
if (process.platform !== "darwin") { // don't ignore on OSX
  optionalPlugins.push(new IgnorePlugin({ resourceRegExp: /^fsevents$/ }));
}


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
    ...optionalPlugins,
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
