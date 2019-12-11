/* eslint-disable global-require */
module.exports = {
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "gb_studio",
        exe: "gb-studio.exe",
        loadingGif: "src/assets/app/install.gif",
        setupIcon: "src/assets/app/icon/app_icon.ico"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ],
  packagerConfig: {
    name: "GB Studio",
    executableName: "gb-studio",
    packageManager: "yarn",
    icon: "src/assets/app/icon/app_icon",
    darwinDarkModeSupport: true,
    extendInfo: "src/assets/app/Info.plist",
    extraResource: ["src/assets/app/icon/gbsproj.icns"],
    afterCopy: ["./after-copy"],
    asar: true,
    appBundleId: "dev.gbstudio.gbstudio",
    osxSign: {
      "hardened-runtime": true,
      "gatekeeper-assess": false,
      entitlements: "./entitlements.plist",
      "entitlements-inherit": "./entitlements.plist"
    }
  },
  hooks: {
    postPackage: require("./src/hooks/notarize.js")
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
              html: "./src/project.html",
              js: "./src/ProjectRoot.js",
              name: "main_window"
            },
            {
              html: "./src/splash.html",
              js: "./src/SplashRoot.js",
              name: "splash_window"
            }
          ]
        }
      }
    ]
  ]
};
