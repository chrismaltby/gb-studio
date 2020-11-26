import glob from "glob";
import { promisify } from "util";
import { pathExists } from "fs-extra";
import Path from "path";
import l10n from "../helpers/l10n";

const globAsync = promisify(glob);

export default async (
  buildRoot,
  { CART_TYPE, CART_SIZE, customColorsEnabled, profile, platform }
) => {
  const cmds = platform === "win32" ? [""] : ["#!/bin/bash", "set -e"];
  const objFiles = [];

  const CC = platform === "win32"
    ? `..\\_gbstools\\gbdk\\bin\\lcc`
    : `../_gbstools/gbdk/bin/lcc`;
  const PACK = platform === "win32"
    ? `..\\_gbstools\\gbspack\\gbspack`
    : `../_gbstools/gbspack/gbspack`;    
  let CFLAGS = `-Wa-l -Iinclude`;
  let LFLAGS = `-Wa-l -Wl-m -Wl-j -Wl-yt${CART_TYPE} -Wl-ya4`;

  if (customColorsEnabled) {
    CFLAGS += " -DCGB";
    LFLAGS += " -Wm-yC";
  }

  if (profile) {
    CFLAGS += " -Wf--profile";
  }

  const srcRoot = `${buildRoot}/src/**/*.@(c|s)`;
  const buildFiles = await globAsync(srcRoot);

  const addCommand = (label, cmd) => {
    if (platform === "win32") {
      cmds.push(`@echo ${label}`);
      cmds.push(`@${cmd}`);
    } else {
      cmds.push(`echo "${label}"`);
      cmds.push(cmd);
    }
  }

  const getValue = (label, variable, cmd) => {
    if (platform === "win32") {
      cmds.push(`@echo ${label}`);
      cmds.push(`FOR /F "tokens=*" %%g IN ('${cmd}') do (SET VAR=%%g)`);
    } else {
      cmds.push(`echo "${label}"`);
      cmds.push(`${variable}=$(${cmd})`);
      cmds.push(`echo "VALUE of ${variable} WAS $${variable}"`);
    }
  }

  for (const file of buildFiles) {
    const objFile = `${file
      .replace(/src.*\//, "obj/")
      .replace(/\.[cs]$/, "")}.o`;

      if (!(await pathExists(objFile))) {
        addCommand(
          `${l10n("COMPILER_COMPILING")}: ${Path.relative(buildRoot, file)}`,
          `${CC} ${CFLAGS} -c -o ${objFile} ${file}`
        );
    }
    objFiles.push(objFile);
  }

  getValue(
    `${l10n("COMPILER_PACKING")}`,
    "CART_SIZE",
    `${PACK} -b 12 -c ${objFiles
      .filter(
        (f) =>
          f.indexOf("font_image") > -1 ||
          f.indexOf("tileset_") > -1 ||
          f.indexOf("palette_") > -1 ||
          f.indexOf("background_") > -1 ||
          f.indexOf("spritesheet_") > -1 ||
          f.indexOf("avatar_") > -1 ||
          f.indexOf("scene_") > -1
        )
      .join(" ")}`
  );

  addCommand(
    `${l10n("COMPILER_LINKING")}: game.gb`,
    `${CC} ${LFLAGS} -Wl-yo\${CART_SIZE} -o build/rom/game.gb ${objFiles.join(" ")}`
  );

  return cmds.join("\n")
};
