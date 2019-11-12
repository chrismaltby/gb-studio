/* eslint-disable global-require */
module.exports = {
  make_targets: {
    win32: ["squirrel", "zip"],
    darwin: ["zip"],
    linux: ["deb", "rpm"]
  },
  electronPackagerConfig: {
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
    },
    ignore: [
      "/.vscode($|/)",
      "/coverage($|/)",
      "/test($|/)",
      "/appData($|/)",
      "/buildTools($|/)"
    ]
  },
  electronWinstallerConfig: {
    name: "gb_studio",
    exe: "gb-studio.exe",
    loadingGif: "src/assets/app/install.gif"
  },
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  github_repository: {
    owner: "",
    name: ""
  },
  electronInstallerDMG: {
    background: "src/assets/app/dmg/background.tiff",
    format: "ULFO"
  },
  windowsStoreConfig: {
    packageName: "",
    name: "gbstudio"
  },
  hooks: {
    postPackage: require("./src/hooks/notarize.js")
  }
};
