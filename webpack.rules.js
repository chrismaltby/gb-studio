module.exports = [
  // Add support for native node modules
  {
    test: /\.node$/,
    use: "node-loader",
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: "@vercel/webpack-asset-relocator-loader",
      options: {
        outputAssetBase: "native_modules",
      },
    },
  },
  {
    test: /\.worker\.(ts|js)$/,
    exclude: /(node_modules|.webpack)/,
    rules: [
      {
        loader: "worker-loader",
        options: { publicPath: "../" },
      },
      {
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  {
    test: /\.(ts|tsx|js|jsx)?$/,
    exclude: /(node_modules|.webpack)/,
    rules: [
      {
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
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
    test: /[\\/]appData[\\/]wasm[\\/](.*)[\\/](.*).wasm$/,
    type: "javascript/auto",
    loader: "file-loader",
    options: {
      name: "[name].[contenthash].[ext]",
      publicPath: "../wasm",
      outputPath: "wasm",
    },
  },
  // Put your webpack loader rules in this array.  This is where you would put
  // your ts-loader configuration for instance:
  /**
   * Typescript Example:
   *
   * {
   *   test: /\.tsx?$/,
   *   exclude: /(node_modules|.webpack)/,
   *   rules: [{
   *     loader: 'ts-loader',
   *     options: {
   *       transpileOnly: true
   *     }
   *   }]
   * }
   */
];
