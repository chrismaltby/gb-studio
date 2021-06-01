/* eslint-disable global-require */
module.exports = {
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "gb_studio",
        exe: "gb-studio.exe",
        loadingGif: "src/assets/app/install.gif",
        setupIcon: "src/assets/app/icon/app_icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  packagerConfig: {
    name: "GB Studio",
    executableName: "gb-studio",
    packageManager: "yarn",
    icon: "src/assets/app/icon/app_icon",
    darwinDarkModeSupport: true,
    extendInfo: "src/assets/app/Info.plist",
    extraResource: ["src/assets/app/icon/gbsproj.icns"],
    afterCopy: ["./src/lib/forge/hooks/after-copy"],
    asar: true,
    appBundleId: "dev.gbstudio.gbstudio",
    osxSign: {
      "hardened-runtime": true,
      "gatekeeper-assess": false,
      entitlements: "./entitlements.plist",
      "entitlements-inherit": "./entitlements.plist",
    },
  },
  hooks: {
    postPackage: require("./src/lib/forge/hooks/notarize"),
  },
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/app/project/project.html",
              js: "./src/app/project/ProjectRoot.js",
              name: "main_window",
              additionalChunks: [
                "vendor-react",
                "vendor-scriptracker",
                "vendor-hotloader",
                "vendor-lodash",
                "vendor-chokidar",
              ],
            },
            {
              html: "./src/app/splash/splash.html",
              js: "./src/app/splash/SplashRoot.js",
              name: "splash_window",
              additionalChunks: [
                "vendor-react",
                "vendor-hotloader",
                "vendor-lodash",
              ],
            },
            {
              html: "./src/app/preferences/preferences.html",
              js: "./src/app/preferences/PreferencesRoot.js",
              name: "preferences_window",
              additionalChunks: [
                "vendor-react",
                "vendor-hotloader",
                "vendor-lodash",
              ],
            },
            {
              html: "./src/app/music/music.html",
              js: "./src/app/music/MusicRoot.js",
              name: "music_window",
              additionalChunks: [
                "vendor-react",
                "vendor-hotloader",
                "vendor-lodash",
              ],
            },
          ],
        },
      },
    ],
  ],
};
