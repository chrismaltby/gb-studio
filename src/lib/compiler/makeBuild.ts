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
import spawn, { ChildProcess } from "lib/helpers/cli/spawn";
import { gbspack } from "./gbspack";
import l10n from "shared/lib/lang/l10n";
import { ProjectResources } from "shared/lib/resources/types";
import psTree from "ps-tree";
import { promisify } from "util";

const psTreeAsync = promisify(psTree);

type MakeOptions = {
  buildRoot: string;
  tmpPath: string;
  data: ProjectResources;
  buildType: "rom" | "web" | "pocket";
  debug: boolean;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

const cpuCount = os.cpus().length;
const childSet = new Set<ChildProcess>();
let cancelling = false;

const makeBuild = async ({
  buildRoot = "/tmp",
  tmpPath = "/tmp",
  data,
  debug = false,
  buildType = "rom",
  progress = (_msg) => {},
  warnings = (_msg) => {},
}: MakeOptions) => {
  cancelling = false;
  const env = Object.create(process.env);
  const { settings } = data;
  const colorEnabled = settings.colorMode !== "mono";
  const sgbEnabled = settings.sgbEnabled && settings.colorMode !== "color";
  const colorOnly = settings.colorMode === "color";
  const targetPlatform = buildType === "pocket" ? "pocket" : "gb";
  const batterylessEnabled = settings.batterylessEnabled && buildType !== "web";

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
  if (colorEnabled) {
    env.COLOR = true;
  }
  if (sgbEnabled) {
    env.SGB = true;
  }
  if (batterylessEnabled) {
    env.BATTERYLESS = true;
  }
  env.COLOR_MODE = settings.colorMode;
  env.MUSIC_DRIVER = settings.musicDriver;
  if (debug) {
    env.DEBUG = true;
  }
  if (settings.musicDriver === "huge") {
    env.MUSIC_DRIVER = "HUGE_TRACKER";
  } else {
    env.MUSIC_DRIVER = "GBT_PLAYER";
  }
  if (settings.cartType === "mbc3") {
    env.RUMBLE_ENABLE = 0x20;
  } else {
    env.RUMBLE_ENABLE = 0x08;
  }

  env.GBDK_COMPILER_PRESET = settings.compilerPreset;

  // Populate /obj with cached data
  await fetchCachedObjData(buildRoot, tmpPath, env);

  // Compile Source Files
  const makeCommands = await getBuildCommands(buildRoot, {
    colorEnabled,
    sgb: sgbEnabled,
    musicDriver: settings.musicDriver,
    batteryless: batterylessEnabled,
    debug,
    platform: process.platform,
    targetPlatform,
    cartType: settings.cartType,
    compilerPreset: settings.compilerPreset,
  });

  const options = {
    cwd: buildRoot,
    env,
    shell: true,
  };

  // Build source files in parallel
  const concurrency = cpuCount;
  await Promise.all(
    Array(concurrency)
      .fill(makeCommands.entries())
      .map(async (cursor) => {
        for (const [_, makeCommand] of cursor) {
          if (cancelling) {
            throw new Error("BUILD_CANCELLED");
          }
          try {
            progress(makeCommand.label);
          } catch (e) {
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

  if (cancelling) {
    throw new Error("BUILD_CANCELLED");
  }

  progress(`${l10n("COMPILER_PACKING")}...`);
  const { cartSize } = await gbspack(await getPackFiles(buildRoot), {
    bankOffset: 1,
    filter: 255,
    extension: "rel",
    additional: batterylessEnabled ? 4 : 0,
    reserve:
      settings.musicDriver !== "huge"
        ? {
            // Reserve space in bank1 for gbt_player.lib
            1: 0x800,
          }
        : {},
  });

  // Link ROM ---

  if (cancelling) {
    throw new Error("BUILD_CANCELLED");
  }

  progress(`${l10n("COMPILER_LINKING")}...`);
  const linkFile = await buildLinkFile(buildRoot, cartSize);
  const linkFilePath = `${buildRoot}/obj/linkfile.lk`;
  await fs.writeFile(linkFilePath, linkFile);

  const linkCommand =
    process.platform === "win32"
      ? `..\\_gbstools\\gbdk\\bin\\lcc.exe`
      : `../_gbstools/gbdk/bin/lcc`;
  const linkArgs = buildLinkFlags(
    linkFilePath,
    data.metadata.name || "GBStudio",
    settings.cartType,
    colorEnabled,
    sgbEnabled,
    colorOnly,
    settings.musicDriver,
    debug,
    targetPlatform
  );

  const { completed: linkCompleted, child } = spawn(
    linkCommand,
    linkArgs,
    options,
    {
      onLog: (msg) => progress(msg),
      onError: (msg) => {
        if (msg.indexOf("Converted build") > -1) {
          return;
        }
        warnings(msg);
      },
    }
  );

  childSet.add(child);
  await linkCompleted;
  childSet.delete(child);

  // Store /obj in cache
  await cacheObjData(buildRoot, tmpPath, env);
};

export const cancelBuildCommandsInProgress = async () => {
  cancelling = true;
  // Kill all spawned commands and any commands that were spawned by those
  // e.g lcc spawns sdcc, etc.
  for (const child of childSet) {
    const spawnedChildren = await psTreeAsync(child.pid);
    for (const childChild of spawnedChildren) {
      try {
        process.kill(Number(childChild.PID));
      } catch (e) {}
    }
    try {
      child.kill();
    } catch (e) {}
  }
};

export default makeBuild;
