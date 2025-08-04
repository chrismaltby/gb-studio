/* eslint-disable @typescript-eslint/no-var-requires */
const { notarize } = require("@electron/notarize");
const Path = require("path");

module.exports = (_config, { outputPaths }) => {
  if (process.platform !== "darwin") {
    console.log("Not a Mac; skipping notarization");
    return Promise.resolve();
  }

  console.log("Notarizing...");

  if (!process.env.APPLE_ID) {
    console.log(
      "Missing APPLE_ID and APPLE_ID_PASSWORD environment variables required for notorizing.",
    );
    return Promise.resolve();
  }

  const buildOutput = Path.join(outputPaths[0], "GB Studio.app");

  return notarize({
    appBundleId: "dev.gbstudio.gbstudio",
    appPath: buildOutput,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  }).catch((e) => {
    console.error(e);
    throw e;
  });
};
