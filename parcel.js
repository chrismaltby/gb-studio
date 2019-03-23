const Bundler = require("parcel-bundler");
const Path = require("path");

console.log("ENV=" + process.env.NODE_ENV);

// Single entrypoint file location:
const entryFiles = [Path.join(__dirname, "./src/index.js")];
const entryFilesWin = [Path.join(__dirname, "./src/windows/*.html")];
const entryFilesHelp = [Path.join(__dirname, "./src/windows/help/*.html")];
const entryFilesStyles = [Path.join(__dirname, "./src/styles/theme*.css")];

// Bundler options
const options = {
  outDir: "./dist", // The out directory to put the build files in, defaults to dist
  // outFile: 'index.html', // The name of the outputFile
  publicUrl: "./", // The url to serve on, defaults to '/'
  watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching, defaults to true
  cacheDir: ".parcelCache", // The directory cache gets put in, defaults to .cache
  contentHash: false, // Disable content hash from being included on the filename
  target: "electron", // Browser/node/electron, defaults to browser
  // logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors
  hmr: true, // Enable or disable HMR while watching
  hmrPort: 0, // The port the HMR socket runs on, defaults to a random free port (0 in node.js resolves to a random free port)
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  hmrHostname: "" // A hostname for hot module reload, default to ''
  // detailedReport: false // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
};

// Bundler options
const optionsWin = {
  outDir: "./dist/windows", // The out directory to put the build files in, defaults to dist
  // outFile: 'index.html', // The name of the outputFile
  publicUrl: "./", // The url to serve on, defaults to '/'
  watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching, defaults to true
  cacheDir: ".parcelCache", // The directory cache gets put in, defaults to .cache
  contentHash: false, // Disable content hash from being included on the filename
  target: "electron", // Browser/node/electron, defaults to browser
  // logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors
  hmr: true, // Enable or disable HMR while watching
  hmrPort: 0, // The port the HMR socket runs on, defaults to a random free port (0 in node.js resolves to a random free port)
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  hmrHostname: "" // A hostname for hot module reload, default to ''
  // detailedReport: false // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
};

// Bundler options
const optionsHelp = {
  outDir: "./dist/windows/help", // The out directory to put the build files in, defaults to dist
  // outFile: 'index.html', // The name of the outputFile
  publicUrl: "./", // The url to serve on, defaults to '/'
  watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching, defaults to true
  cacheDir: ".parcelCache", // The directory cache gets put in, defaults to .cache
  contentHash: false, // Disable content hash from being included on the filename
  target: "electron", // Browser/node/electron, defaults to browser
  // logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors
  hmr: true, // Enable or disable HMR while watching
  hmrPort: 0, // The port the HMR socket runs on, defaults to a random free port (0 in node.js resolves to a random free port)
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  hmrHostname: "" // A hostname for hot module reload, default to ''
  // detailedReport: false // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
};

// Bundler options
const optionsStyles = {
  outDir: "./dist/styles", // The out directory to put the build files in, defaults to dist
  // outFile: 'index.html', // The name of the outputFile
  publicUrl: "./", // The url to serve on, defaults to '/'
  watch: true, // Whether to watch the files and rebuild them on change, defaults to process.env.NODE_ENV !== 'production'
  cache: true, // Enabled or disables caching, defaults to true
  cacheDir: ".parcelCache", // The directory cache gets put in, defaults to .cache
  contentHash: false, // Disable content hash from being included on the filename
  target: "electron", // Browser/node/electron, defaults to browser
  // logLevel: 3, // 5 = save everything to a file, 4 = like 3, but with timestamps and additionally log http requests to dev server, 3 = log info, warnings & errors, 2 = log warnings & errors, 1 = log errors
  hmr: true, // Enable or disable HMR while watching
  hmrPort: 0, // The port the HMR socket runs on, defaults to a random free port (0 in node.js resolves to a random free port)
  sourceMaps: true, // Enable or disable sourcemaps, defaults to enabled (minified builds currently always create sourcemaps)
  hmrHostname: "" // A hostname for hot module reload, default to ''
  // detailedReport: false // Prints a detailed report of the bundles, assets, filesizes and times, defaults to false, reports are only printed if watch is disabled
};

(async function() {
  // Initializes a bundler using the entrypoint location and options provided
  const bundler = new Bundler(entryFiles, options);
  const bundlerWin = new Bundler(entryFilesWin, optionsWin);
  const bundlerHelp = new Bundler(entryFilesHelp, optionsHelp);
  const bundlerStyles = new Bundler(entryFilesStyles, optionsStyles);

  // Run the bundler, this returns the main bundle
  // Use the events if you're using watch mode as this promise will only trigger once and not for every rebuild
  const bundle = await bundler.bundle();
  const bundleWin = await bundlerWin.bundle();
  const bundleHelp = await bundlerHelp.bundle();
  const bundleStyles = await bundlerStyles.bundle();
})();

/*
parcel build src/index.js
  --target=electron
  --no-content-hash
  --out-dir dist
  --cache-dir .parcelCache
  --no-source-maps;

parcel build src/windows/*.html
  --target=electron
  --no-content-hash
  --public-url ./
  --out-dir dist/windows
  --cache-dir .parcelCache
  --no-source-maps;

parcel build src/windows/help/*.html
  --target=electron
  --no-content-hash
  --public-url ./
  --out-dir dist/windows/help
  --cache-dir .parcelCache
  --no-source-maps;

mkdir -p dist/styles; cp -r src/styles/theme* dist/styles/",
*/
