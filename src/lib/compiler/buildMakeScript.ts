import glob from "glob";
import { promisify } from "util";
import { pathExists, readFile, writeFile } from "fs-extra";
import Path from "path";
import l10n from "shared/lib/lang/l10n";

const globAsync = promisify(glob);

type BuildOptions = {
  colorEnabled: boolean;
  sgb: boolean;
  musicDriver: string;
  profile: boolean;
  platform: string;
  batteryless: boolean;
  targetPlatform: "gb" | "pocket";
};

const buildMakeScript = async (
  buildRoot: string,
  {
    colorEnabled,
    sgb,
    musicDriver,
    profile,
    platform,
    batteryless,
    targetPlatform,
  }: BuildOptions
) => {
  const cmds = platform === "win32" ? [""] : ["#!/bin/bash", "set -e"];
  const objFiles = [];

  const CC =
    platform === "win32"
      ? `..\\_gbstools\\gbdk\\bin\\lcc`
      : `../_gbstools/gbdk/bin/lcc`;
  let CFLAGS = `-Iinclude -Wa-Iinclude -Wa-I../_gbstools/gbdk/lib/small/asxxxx -Wl-a -c`;

  if (colorEnabled) {
    CFLAGS += " -DCGB";
  }

  if (sgb) {
    CFLAGS += " -DSGB";
  }

  if (musicDriver === "huge") {
    CFLAGS += " -DHUGE_TRACKER";
  } else {
    CFLAGS += " -DGBT_PLAYER";
  }

  if (batteryless) {
    CFLAGS += " -DBATTERYLESS";
  }

  if (profile) {
    CFLAGS += " -Wf--debug -Wl-y";
  }

  if (targetPlatform === "pocket") {
    CFLAGS += " -msm83:ap";
  }

  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);

  const addCommand = (label: string, cmd: string) => {
    if (platform === "win32") {
      cmds.push(`@echo ${label}`);
      cmds.push(`@${cmd}`);
    } else {
      cmds.push(`echo "${label}"`);
      cmds.push(cmd);
    }
  };

  for (const file of buildFiles) {
    if (musicDriver === "huge" && file.indexOf("GBT_PLAYER") !== -1) {
      continue;
    }
    if (musicDriver !== "huge" && file.indexOf("HUGE_TRACKER") !== -1) {
      continue;
    }

    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.o`;

    if (!(await pathExists(objFile))) {
      addCommand(
        `${l10n("COMPILER_COMPILING")}: ${Path.relative(buildRoot, file)}`,
        `${CC} ${CFLAGS} -c -o ${Path.relative(
          buildRoot,
          objFile
        )} ${Path.relative(buildRoot, file)}`
      );
    }
    objFiles.push(objFile);
  }

  return cmds.join("\n");
};

export const getBuildCommands = async (
  buildRoot: string,
  {
    colorEnabled,
    sgb,
    musicDriver,
    profile,
    platform,
    batteryless,
    targetPlatform,
  }: BuildOptions
) => {
  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);
  const output = [];

  const CC =
    platform === "win32"
      ? `..\\_gbstools\\gbdk\\bin\\lcc`
      : `../_gbstools/gbdk/bin/lcc`;

  for (const file of buildFiles) {
    if (musicDriver === "huge" && file.indexOf("GBT_PLAYER") !== -1) {
      continue;
    }
    if (musicDriver !== "huge" && file.indexOf("HUGE_TRACKER") !== -1) {
      continue;
    }

    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.o`;

    if (!(await pathExists(objFile))) {
      const buildArgs = [
        `-Iinclude`,
        `-Wa-Iinclude`,
        `-Wa-I../_gbstools/gbdk/lib/small/asxxxx`,
        `-Wl-a`,
        `-Wf-MMD`,
        `-c`,
      ];

      if (colorEnabled) {
        buildArgs.push("-DCGB");
      }

      if (sgb) {
        buildArgs.push("-DSGB");
      }

      if (musicDriver === "huge") {
        buildArgs.push("-DHUGE_TRACKER");
      } else {
        buildArgs.push("-DGBT_PLAYER");
      }

      if (batteryless) {
        buildArgs.push("-DBATTERYLESS");
      }

      if (profile) {
        buildArgs.push("-Wf--fverbose-asm");
        buildArgs.push("-Wf--debug");
        buildArgs.push("-Wl-m");
        buildArgs.push("-Wl-w");
        buildArgs.push("-Wl-y");
        buildArgs.push("-DVM_DEBUG_OUTPUT");
        buildArgs.push("-Wf--nolospre");
        buildArgs.push("-Wf--nogcse");
      }

      if (targetPlatform === "pocket") {
        buildArgs.push("-msm83:ap");
      }

      buildArgs.push(
        "-c",
        "-o",
        Path.relative(buildRoot, objFile),
        Path.relative(buildRoot, file)
      );

      output.push({
        label: `${l10n("COMPILER_COMPILING")}: ${Path.relative(
          buildRoot,
          file
        )}`,
        command: CC,
        args: buildArgs,
      });
    }
  }
  return output;
};

export const buildPackFile = async (buildRoot: string) => {
  const output = [];
  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);
  for (const file of buildFiles) {
    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.o`;

    output.push(objFile);
  }
  return output.join("\n");
};

export const getPackFiles = async (buildRoot: string) => {
  const output = [];
  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);
  for (const file of buildFiles) {
    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.o`;

    output.push(objFile);
  }
  return output;
};

export const buildLinkFile = async (buildRoot: string, cartSize: number) => {
  const output = [`-g __start_save=${cartSize - 4}`];
  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);
  for (const file of buildFiles) {
    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.rel`;

    output.push(objFile);
  }
  return output.join("\n");
};

export const buildPackFlags = (packFilePath: string, batteryless = false) => {
  return ([] as Array<string | number>).concat(
    // General
    ["-b", 5, "-f", 255, "-e", "rel", "-c"],
    // Batteryless
    batteryless ? ["-a 4"] : [],
    // Input
    ["-i", packFilePath]
  );
};

export const buildLinkFlags = (
  linkFile: string,
  name = "GBSTUDIO",
  cartType: string,
  color = false,
  sgb = false,
  musicDriver = "gbtplayer",
  profile = false,
  targetPlatform = "gb"
) => {
  const validName = name
    .toUpperCase()
    .replace(/[^A-Z]*/g, "")
    .substring(0, 15);
  const cart = cartType === "mbc3" ? "0x10" : "0x1B";
  return ([] as Array<string>).concat(
    // General
    [
      `-Wm-yt${cart}`,
      "-Wm-yoA",
      "-Wm-ya4",
      "-Wl-j",
      "-Wl-m",
      "-Wl-w",
      "-Wm-yS",
      "-Wl-klib",
      "-Wl-g.STACK=0xDF00",
      "-Wi-e",
      `-Wm-yn"${validName}"`,
    ],
    // Color
    color ? ["-Wm-yC"] : [],
    // SGB
    sgb ? ["-Wm-ys"] : [],
    // Pocket
    targetPlatform === "pocket" ? ["-msm83:ap"] : [],
    // Debug emulicious
    profile ? ["-Wf--debug", "-Wl-m", "-Wl-w", "-Wl-y"] : [],
    // Music Driver
    musicDriver === "huge"
      ? // hugetracker
        ["-Wl-lhUGEDriver.lib"]
      : // gbtplayer
        ["-Wl-lgbt_player.lib"],
    // Output
    targetPlatform === "gb" ? ["-o", "build/rom/game.gb"] : [],
    targetPlatform === "pocket" ? ["-o", "build/rom/game.pocket"] : [],
    [`-Wl-f${linkFile}`]
  );
};

export const makefileInjectToolsPath = async (
  filename: string,
  buildToolsPath: string
) => {
  const makefile = await readFile(filename, "utf8");
  const updatedMakefile = makefile.replace(
    /GBSTOOLS_DIR =.*/,
    `GBSTOOLS_DIR = ${Path.normalize(buildToolsPath)}`
  );
  await writeFile(filename, updatedMakefile);
};

export const buildMakeDotBuildFile = ({
  cartType = "mbc5",
  color = false,
  sgb = false,
  batteryless = false,
  musicDriver = "gbtplayer",
}) => {
  return (
    `settings: ` +
    ([] as Array<string>)
      .concat(
        color ? ["CGB"] : ["DMG"],
        sgb ? ["SGB"] : [],
        musicDriver === "huge" ? ["hUGE"] : ["GBT"],
        cartType === "mbc3" ? ["MBC3"] : ["MBC5"],
        batteryless ? ["batteryless"] : []
      )
      .join(" ")
  );
};

export default buildMakeScript;
