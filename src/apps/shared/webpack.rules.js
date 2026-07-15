module.exports = [
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
    test: /\.(png|jpe?g|gif|mp4|woff2)$/i,
    exclude: /(node_modules|.webpack)/,
    type: "asset/resource",
    generator: {
      publicPath: "../", // move up from 'main_window'
    },
  },
  {
    test: /[\\/]appData[\\/]wasm[\\/](.*)[\\/](.*).wasm$/,
    type: "asset/resource",
    generator: {
      filename: "[name].[contenthash][ext]",
      publicPath: "../wasm/",
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
