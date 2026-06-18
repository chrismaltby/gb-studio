// GBA Studio - GBA make step (devkitARM / Butano).
//
// Counterpart to makeBuild.ts for the GBA target. Builds the gbavm engine tree
// (with the game_script.c written by ejectGbaBuild) into a .gba and copies it to
// <buildRoot>/build/gba/<romFilename> for the CLI/UI copy-out to collect.
//
// M2: builds in-place in the gbavm engine tree (gbaEngineRoot) so Butano's
// relative LIBBUTANO path and warm build cache are reused. On Windows the build
// runs through the devkitPro msys2 login shell (which sets up DEVKITPRO + PATH),
// matching the proven manual build. Isolated/vendored build dirs are a later
// packaging concern.

import os from "os";
import Path from "path";
import { copyFile, ensureDir, pathExists, readdir } from "fs-extra";
import type { SpawnOptions } from "child_process";
import spawn, { ChildProcess } from "lib/helpers/cli/spawn";
import { envWith } from "lib/helpers/cli/env";
import { gbaEngineRoot } from "consts";

type MakeGbaOptions = {
  buildRoot: string;
  romFilename: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

const cpuCount = os.cpus().length;
const childSet = new Set<ChildProcess>();
let cancelling = false;

// C:\foo\bar -> /c/foo/bar  (msys2 path form)
const toUnixPath = (p: string): string =>
  p
    .replace(/\\/g, "/")
    .replace(/^([A-Za-z]):\//, (_m, drive: string) => `/${drive.toLowerCase()}/`);

const makeGbaBuild = async ({
  buildRoot,
  romFilename,
  progress = (_msg) => {},
  warnings = (_msg) => {},
}: MakeGbaOptions) => {
  cancelling = false;
  const envDkp = process.env.DEVKITPRO?.replace(/\\/g, "/");

  let command: string;
  let args: string[];
  let options: SpawnOptions;

  if (process.platform === "win32") {
    // On Windows, DEVKITPRO is the msys2 *mount* path (e.g. /opt/devkitpro), not
    // a usable Win32 path - use the env value only if it's a drive-letter path,
    // else the standard install location. The msys2 login shell (-l) then sources
    // the profile that exports DEVKITPRO/DEVKITARM and puts make + toolchain on PATH.
    const dkpWin = envDkp && /^[A-Za-z]:/.test(envDkp) ? envDkp : "C:/devkitPro";
    const bash = `${dkpWin}/msys2/usr/bin/bash.exe`;
    if (!(await pathExists(bash))) {
      throw new Error(
        `GBA build: devkitPro msys2 bash not found at ${bash}. Install devkitPro (Windows) or set DEVKITPRO to its Windows path.`,
      );
    }
    command = bash;
    args = ["-lc", `cd '${toUnixPath(gbaEngineRoot)}' && make -j${cpuCount}`];
    options = { env: process.env, shell: false };
  } else {
    const devkitPro = envDkp ?? "/opt/devkitpro";
    const devkitArm = `${devkitPro}/devkitARM`;
    command = "make";
    args = [`-j${cpuCount}`];
    options = {
      cwd: gbaEngineRoot,
      shell: true,
      env: {
        ...process.env,
        DEVKITPRO: devkitPro,
        DEVKITARM: devkitArm,
        PATH: envWith([`${devkitArm}/bin`, `${devkitPro}/tools/bin`]),
      },
    };
  }

  progress("Building GBA ROM (devkitARM/Butano)...");
  const { child, completed } = spawn(command, args, options, {
    onLog: (msg) => progress(msg),
    onError: (msg) => warnings(msg),
  });
  childSet.add(child);
  try {
    await completed;
  } catch (code) {
    throw new Error(`GBA build: devkitARM make failed (exit ${code})`);
  } finally {
    childSet.delete(child);
  }

  if (cancelling) {
    throw new Error("BUILD_CANCELLED");
  }

  // Butano emits $(TARGET).gba in the project root (CURDIR), where
  // TARGET = $(notdir $(CURDIR)); build/ holds only intermediates.
  const target = Path.basename(gbaEngineRoot);
  let romPath = Path.join(gbaEngineRoot, `${target}.gba`);
  if (!(await pathExists(romPath))) {
    const gbas = (await readdir(gbaEngineRoot).catch(() => [])).filter((f) =>
      f.endsWith(".gba"),
    );
    if (gbas.length === 0) {
      throw new Error(`GBA build: no .gba produced in ${gbaEngineRoot}`);
    }
    romPath = Path.join(gbaEngineRoot, gbas[0]);
  }

  const outDir = Path.join(buildRoot, "build", "gba");
  await ensureDir(outDir);
  await copyFile(romPath, Path.join(outDir, romFilename));
  progress(`GBA ROM built: ${romFilename}`);
};

export const cancelGbaBuildCommandsInProgress = async () => {
  cancelling = true;
  for (const child of childSet) {
    try {
      child.kill();
    } catch (e) {}
  }
};

export default makeGbaBuild;
