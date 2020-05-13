const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");
const CopyPlugin = require("copy-webpack-plugin");

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }]
});

const rendererPlugins = [].concat(
  plugins,
  new CopyPlugin([
    { from: "node_modules/vm2", to: "node_modules/vm2" }
  ])  
);

module.exports = {
  // Put your normal webpack config below here
  target: "electron-renderer",
  module: {
    rules
  },
  plugins: rendererPlugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      'react-dom': '@hot-loader/react-dom',
    }    
  },
  externals: {
    vm2: "vm2"
  }  
};
