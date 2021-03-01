module.exports = [
  // Add support for native node modules
  {
    test: /\.node$/,
    use: "node-loader"
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: "@marshallofsound/webpack-asset-relocator-loader",
      options: {
        outputAssetBase: "native_modules"
      }
    }
  },
  {
    test: /\.worker\.(ts|js)$/,
    exclude: /(node_modules|.webpack)/,
    loaders: [
      {
        loader: 'worker-loader',
        options: { publicPath: '../' }
      },
      {
        loader: "ts-loader",
        options: {
          transpileOnly: true
        }
      }      
    ]
  },
  {
    test: /\.(ts|tsx|js|jsx)?$/,
    exclude: /(node_modules|.webpack)/,
    loaders: [
      {
        loader: "ts-loader",
        options: {
          transpileOnly: true
        }
      }
    ]
  },
  {
    test: /\.(png|jpe?g|gif|mp4)$/i,
    exclude: /(node_modules|.webpack)/,
    loader: "file-loader",
    options: {
      publicPath: "..", // move up from 'main_window'
    },
  },
  {
    test: /\.wasm$/,
    type: "javascript/auto",
    loader: "file-loader",
  }
  // Put your webpack loader rules in this array.  This is where you would put
  // your ts-loader configuration for instance:
  /**
   * Typescript Example:
   *
   * {
   *   test: /\.tsx?$/,
   *   exclude: /(node_modules|.webpack)/,
   *   loaders: [{
   *     loader: 'ts-loader',
   *     options: {
   *       transpileOnly: true
   *     }
   *   }]
   * }
   */
];
