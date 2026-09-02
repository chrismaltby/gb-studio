import { pathExists, readFile, writeFile } from "fs-extra";
import type { BuildManifest } from "lib/compiler/buildManifest";
import Path from "path";
import l10n from "shared/lib/lang/l10n";

type BuildOptions = {
  colorEnabled: boolean;
  sgb: boolean;
  debug: boolean;
  platform: string;
  batteryless: boolean;
  targetPlatform: "gb" | "pocket";
  compilerPreset: number;
};

export const getBuildCommands = async (
  manifest: BuildManifest,
  {
    colorEnabled,
    sgb,
    debug,
    platform,
    batteryless,
    targetPlatform,
    compilerPreset,
  }: BuildOptions,
) => {
  const output = [];

  const CC =
    platform === "win32"
      ? `..\\_gbstools\\gbdk\\bin\\lcc`
      : `../_gbstools/gbdk/bin/lcc`;

  const { sources, buildRoot, cartType } = manifest;

  for (const source of sources) {
    const file = Path.join(buildRoot, source.sourcePath);
    const objFile = source.objectPath;

    if (!(await pathExists(objFile))) {
      const buildArgs = [
        `-Iinclude`,
        `-Wa-Iinclude`,
        `-Wa-I../_gbstools/gbdk/lib/small/asxxxx`,
        `-Wl-a`,
        `-Wf-MMD`,
        `-c`,
      ];

      buildArgs.push(`-Wf"--max-allocs-per-node ${compilerPreset ?? 3000}"`);

      if (colorEnabled) {
        buildArgs.push("-DCGB");
      }

      if (sgb) {
        buildArgs.push("-DSGB");
      }

      buildArgs.push("-DHUGE_TRACKER");

      if (batteryless) {
        buildArgs.push("-DBATTERYLESS");
      }

      const rumbleBit = cartType === "mbc3" ? "0x20u" : "0x08u";
      buildArgs.push(`-DRUMBLE_ENABLE=${rumbleBit}`);

      if (debug) {
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
        Path.relative(buildRoot, file),
      );

      output.push({
        label: `${l10n("COMPILER_COMPILING")}: ${Path.relative(
          buildRoot,
          file,
        )}`,
        command: CC,
        args: buildArgs,
      });
    }
  }
  return output;
};

export const buildLinkFile = (manifest: BuildManifest) =>
  manifest.sources.map((source) => source.objectPath).join("\n");

export const buildLinkFlags = (
  linkFile: string,
  romFilename: string,
  name = "GBSTUDIO",
  cartType: string,
  color = false,
  sgb = false,
  colorOnly = false,
  batteryless = false,
  debug = false,
  targetPlatform = "gb",
) => {
  const validName =
    name
      .toUpperCase()
      .replace(/[^A-Z]*/g, "")
      .substring(0, 15) || "GBSTUDIO";
  const cart = cartType === "mbc3" ? "0x10" : "0x1E";
  return ([] as Array<string>).concat(
    // General
    [
      // Cart
      `-Wm-yt${cart}`,
      // Banks
      "-autobank",
      "-Wb-ext=.rel",
      "-Wm-yoA",
      "-Wm-ya4",
      // Symbols
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
    colorOnly ? ["-Wm-yC"] : color ? ["-Wm-yc"] : [],
    // SGB
    sgb ? ["-Wm-ys"] : [],
    // Pocket
    targetPlatform === "pocket" ? ["-msm83:ap"] : [],
    // Debug emulicious
    debug ? ["-Wf--debug", "-Wl-m", "-Wl-w", "-Wl-y"] : [],
    // Music Driver hugetracker
    ["-Wl-lhUGEDriver.lib"],
    // Batteryless cart
    batteryless
      ? [
          "-Wb-reserve=15:4000",
          "-Wb-reserve=14:4000",
          "-Wb-reserve=13:4000",
          "-Wb-reserve=12:4000",
          "-Wl-g__start_save=12",
        ]
      : ["-Wl-g__start_save=0"],
    // Output
    ["-o", `"build/rom/${romFilename}"`],
    [`-Wl-f${linkFile}`],
  );
};

export const makefileInjectToolsPath = async (
  filename: string,
  buildToolsPath: string,
) => {
  const makefile = await readFile(filename, "utf8");
  const updatedMakefile = makefile.replace(
    /GBSTOOLS_DIR =.*/,
    `GBSTOOLS_DIR = ${Path.normalize(buildToolsPath)}`,
  );
  await writeFile(filename, updatedMakefile);
};

export const buildMakeDotBuildFile = ({
  cartType = "mbc5",
  color = false,
  sgb = false,
  batteryless = false,
}) => {
  return (
    `settings: ` +
    ([] as Array<string>)
      .concat(
        color ? ["CGB"] : ["DMG"],
        sgb ? ["SGB"] : [],
        ["hUGE"],
        cartType === "mbc3" ? ["MBC3"] : ["MBC5"],
        batteryless ? ["batteryless"] : [],
      )
      .join(" ")
  );
};
