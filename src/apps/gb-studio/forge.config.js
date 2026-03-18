/* eslint-disable @typescript-eslint/no-var-requires */
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const rendererConfig = require("./webpack.renderer.config.js");

const rendererPreloadConfig = {
  ...rendererConfig,
  plugins: [],
};

module.exports = async () => {
  const { MakerAppImage } = await import("@reforged/maker-appimage");

  return {
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
        platforms: ["darwin", "win32", "linux"],
      },
      new MakerAppImage({}),
      {
        name: "@electron-forge/maker-deb",
        config: {
          options: {
            icon: "src/assets/app/icon/app_icon.png",
          },
        },
      },
      {
        name: "@electron-forge/maker-rpm",
        config: {
          options: {
            icon: "src/assets/app/icon/app_icon.png",
          },
        },
      },
    ],
    packagerConfig: {
      name: "GB Studio",
      executableName: "gb-studio",
      packageManager: "yarn",
      icon: "src/assets/app/icon/app_icon",
      darwinDarkModeSupport: true,
      extendInfo: "src/assets/app/Info.plist",
      extraResource: [
        "src/assets/app/icon/gbsproj.icns",
        "src/assets/app/icon/Assets.car",
      ],
      afterCopy: ["./src/lib/forge/hooks/after-copy"],
      asar: true,
      appBundleId: "dev.gbstudio.gbstudio",
      osxSign: {
        "hardened-runtime": true,
        entitlements: "./entitlements.plist",
      },
    },
    hooks: {
      postPackage: require("../../../src/lib/forge/hooks/notarize"),
    },
    plugins: [
      {
        name: "@electron-forge/plugin-auto-unpack-natives",
        config: {},
      },
      {
        name: "@electron-forge/plugin-webpack",
        config: {
          devContentSecurityPolicy:
            "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:; worker-src 'self' blob:;",
          devServer: { liveReload: false },
          mainConfig: "./src/apps/gb-studio/webpack.main.config.js",
          renderer: {
            config: "./src/apps/gb-studio/webpack.renderer.config.js",
            nodeIntegration: false,
            entryPoints: [
              {
                html: "./src/apps/gb-studio/project/project.html",
                js: "./src/apps/gb-studio/project/ProjectRoot.tsx",
                preload: {
                  js: "./src/apps/gb-studio/project/preload.ts",
                  config: rendererPreloadConfig,
                },
                name: "main_window",
                additionalChunks: [
                  "vendor-react",
                  "vendor-scriptracker",
                  "vendor-hotloader",
                  "vendor-lodash",
                ],
              },
              {
                html: "./src/apps/gb-studio/splash/splash.html",
                js: "./src/apps/gb-studio/splash/SplashRoot.tsx",
                preload: {
                  js: "./src/apps/gb-studio/splash/preload.ts",
                  config: rendererPreloadConfig,
                },
                name: "splash_window",
                additionalChunks: [
                  "vendor-react",
                  "vendor-hotloader",
                  "vendor-lodash",
                ],
              },
              {
                html: "./src/apps/gb-studio/preferences/preferences.html",
                js: "./src/apps/gb-studio/preferences/PreferencesRoot.tsx",
                preload: {
                  js: "./src/apps/gb-studio/project/preload.ts",
                  config: rendererPreloadConfig,
                },
                name: "preferences_window",
                additionalChunks: [
                  "vendor-react",
                  "vendor-hotloader",
                  "vendor-lodash",
                ],
              },
              {
                html: "./src/apps/gb-studio/plugins/plugins.html",
                js: "./src/apps/gb-studio/plugins/PluginsRoot.tsx",
                preload: {
                  js: "./src/apps/gb-studio/plugins/preload.ts",
                  config: rendererPreloadConfig,
                },
                name: "plugins_window",
              },
              {
                html: "./src/apps/gb-studio/music/music.html",
                js: "./src/apps/gb-studio/music/MusicRoot.tsx",
                preload: {
                  js: "./src/apps/gb-studio/project/preload.ts",
                  config: rendererPreloadConfig,
                },
                name: "music_window",
                additionalChunks: [
                  "vendor-react",
                  "vendor-hotloader",
                  "vendor-lodash",
                ],
              },
              {
                name: "game_window",
                preload: {
                  js: "./src/apps/gb-studio/game/preload.ts",
                  config: rendererPreloadConfig,
                },
              },
            ],
          },
        },
      },
      // Fuses are used to enable/disable various Electron functionality
      // at package time, before code signing the application
      new FusesPlugin({
        version: FuseVersion.V1,
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableCookieEncryption]: true,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
      }),
    ],
  };
};
