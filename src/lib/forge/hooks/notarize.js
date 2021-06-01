/* eslint-disable @typescript-eslint/no-var-requires */
const { notarize } = require("electron-notarize");

// Path from here to your build app executable:
const buildOutput = require("path").resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "out",
  "GB Studio-darwin-x64",
  "GB Studio.app"
);

module.exports = () => {
  if (process.platform !== "darwin") {
    console.log("Not a Mac; skipping notarization");
    return Promise.resolve();
  }

  console.log("Notarizing...");

  if (!process.env.APPLE_ID) {
    console.log(
      "Missing APPLE_ID and APPLE_ID_PASSWORD environment variables required for notorizing."
    );
    return Promise.resolve();
  }

  // eslint-disable-next-line consistent-return
  return notarize({
    appBundleId: "dev.gbstudio.gbstudio",
    appPath: buildOutput,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  }).catch((e) => {
    console.error(e);
    throw e;
  });
};
