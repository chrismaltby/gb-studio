import glob from "glob";
import Path from "path";
import { promisify } from "util";
import { ensureDir, copyFile, pathExists } from "fs-extra";
import {
  checksumFile,
  mergeChecksums,
  checksumString,
} from "../helpers/checksum";

const globAsync = promisify(glob);

export const objCache = {};

export const cacheObjData = async (buildRoot, tmpPath, env) => {
  const cacheRoot = Path.normalize(`${tmpPath}/_gbscache/obj`);
  const buildObjRoot = Path.normalize(`${buildRoot}/obj`);
  const buildSrcRoot = Path.normalize(`${buildRoot}/src`);
  const buildIncludeRoot = Path.normalize(`${buildRoot}/include`);

  await ensureDir(cacheRoot);

  const objFiles = await globAsync(`${buildObjRoot}/*.o`);
  const srcFiles = await globAsync(`${buildSrcRoot}/**/*.{c,s}`);
  const includeFiles = await globAsync(`${buildIncludeRoot}/**/*.h`, {
    ignore: `${buildIncludeRoot}/data/*.h`,
  });
  includeFiles.push(`${buildIncludeRoot}/data/data_bootstrap.h`);
  const globalsFile = `${buildIncludeRoot}/data/game_globals.i`;

  const includeChecksums = await Promise.all(includeFiles.map(checksumFile));
  const includeChecksum = mergeChecksums(includeChecksums);

  const envChecksum = checksumString(JSON.stringify(env));
  const globalsChecksum = await checksumFile(globalsFile);

  for (let i = 0; i < objFiles.length; i++) {
    const objFilePath = objFiles[i];
    const fileName = Path.basename(objFilePath, ".o");
    if (
      fileName.indexOf("bank_") !== 0 &&
      fileName.indexOf("music_bank_") !== 0
    ) {
      const matchingSrc = srcFiles.find((file) => {
        const baseName = Path.basename(file);
        return baseName === `${fileName}.c` || baseName === `${fileName}.s`;
      });

      if (matchingSrc) {
        const checksum = await checksumFile(matchingSrc);
        const includesGlobals =
          !!Path.basename(matchingSrc).match(/(script_.*\.s)/);
        const cacheFilename = checksumString(
          `${envChecksum}_${
            includeChecksum + (includesGlobals ? globalsChecksum : "")
          }_${checksum}`
        );
        const outFile = `${cacheRoot}/${cacheFilename}`;
        await copyFile(objFilePath, outFile);
      }
    }
  }
};

export const fetchCachedObjData = async (buildRoot, tmpPath, env) => {
  const cacheRoot = Path.normalize(`${tmpPath}/_gbscache/obj`);
  const buildObjRoot = Path.normalize(`${buildRoot}/obj`);
  const buildSrcRoot = Path.normalize(`${buildRoot}/src`);
  const buildIncludeRoot = Path.normalize(`${buildRoot}/include`);

  const srcFiles = await globAsync(`${buildSrcRoot}/**/*.{c,s}`);
  const includeFiles = await globAsync(`${buildIncludeRoot}/**/*.h`, {
    ignore: `${buildIncludeRoot}/data/*.h`,
  });
  includeFiles.push(`${buildIncludeRoot}/data/data_bootstrap.h`);
  const globalsFile = `${buildIncludeRoot}/data/game_globals.i`;

  const includeChecksums = await Promise.all(includeFiles.map(checksumFile));
  const includeChecksum = mergeChecksums(includeChecksums);

  const envChecksum = checksumString(JSON.stringify(env));
  const globalsChecksum = await checksumFile(globalsFile);

  for (let i = 0; i < srcFiles.length; i++) {
    const srcFilePath = srcFiles[i];
    const fileName = Path.basename(srcFilePath).replace(/\.(s|c)$/, "");
    const checksum = await checksumFile(srcFilePath);
    const includesGlobals =
      !!Path.basename(srcFilePath).match(/(script_.*\.s)/);
    const cacheFilename = checksumString(
      `${envChecksum}_${
        includeChecksum + (includesGlobals ? globalsChecksum : "")
      }_${checksum}`
    );
    const cacheFile = `${cacheRoot}/${cacheFilename}`;

    if (await pathExists(cacheFile)) {
      const outFile = `${buildObjRoot}/${fileName}.o`;
      await copyFile(cacheFile, outFile);
    }
  }
};
