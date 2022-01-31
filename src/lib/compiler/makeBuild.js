import fs from "fs-extra";
import os from "os";

import {
  buildLinkFile,
  buildLinkFlags,
  getBuildCommands,
  getPackFiles,
} from "./buildMakeScript";
import { cacheObjData, fetchCachedObjData } from "./objCache";
import ensureBuildTools from "./ensureBuildTools";
import spawn from "../helpers/cli/spawn";
import l10n from "../helpers/l10n";
import { gbspack } from "./gbspack";

const cpuCount = os.cpus().length;

const makeBuild = async ({
  buildRoot = "/tmp",
  tmpPath = "/tmp",
  data = {},
  profile = false,
  buildType = "rom",
  progress = (_msg) => {},
  warnings = (_msg) => {},
} = {}) => {
  const env = Object.create(process.env);
  const { settings } = data;

  const targetPlatform = buildType === "pocket" ? "pocket" : "gb";

  const buildToolsPath = await ensureBuildTools(tmpPath);
  const buildToolsVersion = await fs.readFile(
    `${buildToolsPath}/tools_version`,
    "utf8"
  );

  env.PATH = [`${buildToolsPath}/gbdk/bin`, env.PATH].join(":");
  env.GBDKDIR = `${buildToolsPath}/gbdk/`;
  env.GBS_TOOLS_VERSION = buildToolsVersion;
  env.TARGET_PLATFORM = targetPlatform;

  env.CART_TYPE = settings.cartType || "mbc5";
  env.TMP = tmpPath;
  env.TEMP = tmpPath;
  if (settings.customColorsEnabled) {
    env.COLOR = true;
  }
  if (settings.sgbEnabled) {
    env.SGB = true;
  }
  if (settings.batterylessEnabled) {
    env.BATTERYLESS = true;
  }
  env.MUSIC_DRIVER = settings.musicDriver;
  if (profile) {
    env.PROFILE = true;
  }
  if (settings.musicDriver === "huge") {
    env.MUSIC_DRIVER = "HUGE_TRACKER";
  } else {
    env.MUSIC_DRIVER = "GBT_PLAYER";
  }

  // Populate /obj with cached data
  await fetchCachedObjData(buildRoot, tmpPath, env);

  // Compile Source Files
  const makeCommands = await getBuildCommands(buildRoot, {
    CART_TYPE: env.CART_TYPE,
    CART_SIZE: env.CART_SIZE,
    customColorsEnabled: settings.customColorsEnabled,
    sgb: settings.sgbEnabled,
    gbcFastCPUEnabled: settings.gbcFastCPUEnabled,
    musicDriver: settings.musicDriver,
    batteryless: settings.batterylessEnabled,
    profile,
    platform: process.platform,
    targetPlatform,
  });

  const options = {
    cwd: buildRoot,
    env,
    shell: true,
  };

  // Build source files in parallel
  const childSet = new Set();
  const concurrency = cpuCount;
  await Promise.all(
    Array(concurrency)
      .fill(makeCommands.entries())
      .map(async (cursor) => {
        for (let [_, makeCommand] of cursor) {
          try {
            progress(makeCommand.label);
          } catch (e) {
            for (let child of childSet) {
              child.kill();
            }
            throw e;
          }
          const { child, completed } = spawn(
            makeCommand.command,
            makeCommand.args,
            options,
            {
              onLog: (msg) => warnings(msg), // LCC writes errors to stdout
              onError: (msg) => warnings(msg),
            }
          );
          childSet.add(child);
          await completed;
          childSet.delete(child);
        }
      })
  );

  // GBSPack ---

  progress(`${l10n("COMPILER_PACKING")}...`);
  const { cartSize } = await gbspack(await getPackFiles(buildRoot), {
    bankOffset: 5,
    filter: 255,
    extension: "rel",
    additional: settings.batterylessEnabled ? 4 : 0,
  });

  // Link ROM ---

  progress(`${l10n("COMPILER_LINKING")}...`);
  const linkFile = await buildLinkFile(buildRoot, parseInt(cartSize, 10));
  const linkFilePath = `${buildRoot}/obj/linkfile.lk`;
  await fs.writeFile(linkFilePath, linkFile);

  const linkCommand =
    process.platform === "win32"
      ? `..\\_gbstools\\gbdk\\bin\\lcc.exe`
      : `../_gbstools/gbdk/bin/lcc`;
  const linkArgs = buildLinkFlags(
    linkFilePath,
    data.name || "GBStudio",
    settings.cartType,
    settings.customColorsEnabled,
    settings.sgbEnabled,
    settings.musicDriver,
    targetPlatform
  );

  const { completed: linkCompleted } = spawn(linkCommand, linkArgs, options, {
    onLog: (msg) => progress(msg),
    onError: (msg) => {
      if (msg.indexOf("Converted build") > -1) {
        return;
      }
      warnings(msg);
    },
  });
  await linkCompleted;

  // Store /obj in cache
  await cacheObjData(buildRoot, tmpPath, env);
};

export default makeBuild;
