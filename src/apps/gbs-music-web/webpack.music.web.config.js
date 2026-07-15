/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require("webpack");
const zlib = require("zlib");
const { promisify } = require("util");
const CopyPlugin = require("copy-webpack-plugin");
const { GitRevisionPlugin } = require("git-revision-webpack-plugin");
const { GenerateSW } = require("workbox-webpack-plugin");
const baseRules = require("../shared/webpack.rules");
const { repoPath, srcPath } = require("../shared/webpack.paths");
const MusicWebLocalesPlugin = require("./lang/musicWebLocalesPlugin");
const {
  defaultOutputDir: musicWebLocalesDir,
} = require("./lang/musicWebLocales");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ReactRefreshTypeScript = require("react-refresh-typescript");
const pkg = require("../../../package.json");

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);
const isProduction = process.env.NODE_ENV !== "development";
const styledComponentsPlugin = [
  require.resolve("babel-plugin-styled-components"),
  {
    displayName: !isProduction,
    minify: isProduction,
    pure: isProduction,
    transpileTemplateLiterals: isProduction,
  },
];

const gitRevisionPlugin = new GitRevisionPlugin({
  commithashCommand: "rev-list --max-count=1 --no-merges --abbrev-commit HEAD",
});

const docsUrl = "https://www.gbstudio.dev/docs/";

const getPublicUrl = () => {
  const { PUBLIC_URL } = process.env;

  if (!PUBLIC_URL) {
    return ".";
  }

  let normalizedBaseUrl;
  try {
    normalizedBaseUrl = new URL(
      PUBLIC_URL.endsWith("/") ? PUBLIC_URL.slice(0, -1) : PUBLIC_URL,
    );
  } catch {
    throw new Error(
      `PUBLIC_URL must be an absolute URL, received "${PUBLIC_URL}"`,
    );
  }

  return normalizedBaseUrl.toString().replace(/\/$/, "");
};

class PrecompressAssetsPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      "PrecompressAssetsPlugin",
      (compilation) => {
        compilation.hooks.processAssets.tapPromise(
          {
            name: "PrecompressAssetsPlugin",
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER,
          },
          async () => {
            const assets = compilation
              .getAssets()
              .filter((asset) => /\.(js|html|css|wasm|uge)$/i.test(asset.name));

            await Promise.all(
              assets.map(async (asset) => {
                const source = asset.source.source();
                const buffer = Buffer.isBuffer(source)
                  ? source
                  : Buffer.from(source);
                const gzipBuffer = await gzip(buffer, { level: 9 });
                if (gzipBuffer.length < buffer.length) {
                  compilation.emitAsset(
                    `${asset.name}.gz`,
                    new webpack.sources.RawSource(gzipBuffer),
                  );
                }
                const brotliBuffer = await brotliCompress(buffer, {
                  params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                  },
                });
                if (brotliBuffer.length < buffer.length) {
                  compilation.emitAsset(
                    `${asset.name}.br`,
                    new webpack.sources.RawSource(brotliBuffer),
                  );
                }
              }),
            );
          },
        );
      },
    );
  }
}

const rules = baseRules.map((rule) => {
  if (!rule.rules) {
    return rule;
  }

  const tsLoaderRule = rule.rules.find(
    (nestedRule) => nestedRule.loader === "ts-loader",
  );

  if (!tsLoaderRule) {
    return rule;
  }

  return {
    ...rule,
    rules: undefined,
    use: [
      {
        loader: "babel-loader",
        options: {
          babelrc: false,
          configFile: false,
          plugins: [styledComponentsPlugin],
        },
      },
      {
        loader: tsLoaderRule.loader,
        options: {
          ...tsLoaderRule.options,
          getCustomTransformers: () => ({
            before: [!isProduction && ReactRefreshTypeScript()].filter(Boolean),
          }),
          compilerOptions: {
            ...(tsLoaderRule.options?.compilerOptions || {}),
            module: "esnext",
          },
        },
      },
    ],
  };
});

// Emit the default template song as a separate file so it only loads
// when the user creates a new song or opens an empty workspace.
rules.push({
  test: /\.uge$/i,
  include: srcPath("apps/gbs-music-web/data/template.uge"),
  type: "asset/resource",
  generator: {
    filename: "template/[name][ext]",
  },
});

// Example .uge songs emitted as separate files so they don't bloat
// the main bundle and are loaded on demand
rules.push({
  test: /\.uge$/i,
  exclude: srcPath("apps/gbs-music-web/data"),
  type: "asset/resource",
  generator: {
    filename: "examples/[name][ext]",
  },
});

module.exports = {
  mode: isProduction ? "production" : "development",
  target: "web",
  entry: {
    bundle: "./src/apps/gbs-music-web/MusicWebRoot.tsx",
  },
  output: {
    path: repoPath("out", "music-web"),
    filename: "[name].js",
    chunkFilename: isProduction ? "[name].[contenthash:8].js" : "[name].js",
    clean: true,
  },
  module: {
    rules,
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      store: srcPath("store"),
      components: srcPath("components"),
      lang: musicWebLocalesDir,
      lib: srcPath("lib"),
      ui: srcPath("components/ui"),
      renderer: srcPath("renderer"),
      shared: srcPath("shared"),
      assets: srcPath("assets"),
      consts: srcPath("consts.ts"),
      "gbs-music-web": srcPath("apps/gbs-music-web"),
      wasm: repoPath("appData", "wasm"),
      "contributors.json": repoPath("contributors.json"),
      "contributors-external.json": repoPath("contributors-external.json"),
      "patrons.json": repoPath("patrons.json"),
      "#my-quickjs-variant":
        require.resolve("@jitl/quickjs-singlefile-browser-release-sync"),
    },
    fallback: {
      path: require.resolve("path-browserify"),
      buffer: require.resolve("buffer"),
    },
  },
  plugins: [
    new MusicWebLocalesPlugin(),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "src/apps/gbs-music-web/index.html",
          to: "index.html",
          transform(content) {
            return content.toString().replace(/%PUBLIC_URL%/g, getPublicUrl);
          },
        },
        { from: "src/apps/gbs-music-web/manifest.json", to: "manifest.json" },
        {
          from: "src/apps/gbs-music-web/static",
          to: ".",
        },
      ],
    }),
    new webpack.DefinePlugin({
      GIT_VERSION: JSON.stringify(gitRevisionPlugin.version()),
      COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
      VERSION: JSON.stringify(pkg.version),
      RELEASE_VERSION: JSON.stringify(pkg.version.replace(/-rc.*/, "")),
      DOCS_URL: JSON.stringify(docsUrl),
    }),
    ...(isProduction ? [] : [new ReactRefreshWebpackPlugin()]),
    ...(isProduction ? [new PrecompressAssetsPlugin()] : []),
    ...(isProduction
      ? [
          new GenerateSW({
            swDest: "service-worker.js",
            // Keep updates waiting until the running app explicitly asks the
            // new service worker to activate.
            skipWaiting: false,
            clientsClaim: true,
            // Serve the cached shell for all navigation requests when offline.
            navigateFallback: "index.html",
            // Exclude pre-compressed variants and source maps — the browser
            // never requests these URLs directly.
            exclude: [/\.gz$/, /\.br$/, /\.map$/, /\.DS_Store$/],
          }),
        ]
      : []),
  ],
  optimization: {
    splitChunks: {
      chunks: "async",
    },
  },
  watchOptions: {
    ignored: [musicWebLocalesDir],
  },
  devServer: {
    static: {
      directory: repoPath("out", "music-web"),
    },
    compress: true,
    port: 3200,
    host: "127.0.0.1",
    hot: true,
    liveReload: false,
    historyApiFallback: true,
    client: {
      overlay: true,
    },
    devMiddleware: {
      writeToDisk: false,
    },
  },
};
