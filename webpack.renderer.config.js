const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }]
});

module.exports = {
  // Put your normal webpack config below here
  target: "electron-renderer",
  module: {
    rules
  },
  plugins: plugins,
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
