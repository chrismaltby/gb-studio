import glob from "glob";
import Path from "path";
import { promisify } from "util";
import { ensureDir, copyFile, pathExists } from "fs-extra";
import getTmp from "../helpers/getTmp";
import { checksumFile, mergeChecksums, checksumString } from "../helpers/checksum";

const globAsync = promisify(glob);

export const objCache = {};

export const cacheObjData = async (buildRoot, env) => {
  const cacheRoot = Path.normalize(`${getTmp()}/_gbscache/obj`);
  const buildObjRoot = Path.normalize(`${buildRoot}/obj`);
  const buildSrcRoot = Path.normalize(`${buildRoot}/src`);
  const buildIncludeRoot = Path.normalize(`${buildRoot}/include`);

  await ensureDir(cacheRoot);

  const objFiles = await globAsync(`${buildObjRoot}/*.o`);
  const srcFiles = await globAsync(`${buildSrcRoot}/**/*.{c,s}`);
  const includeFiles = await globAsync(`${buildIncludeRoot}/**/*.h`);

  const includeChecksums = await Promise.all(includeFiles.map(checksumFile));
  const includeChecksum = mergeChecksums(includeChecksums);

  const envChecksum = checksumString(JSON.stringify(env));

  for (let i = 0; i < objFiles.length; i++) {
    const objFilePath = objFiles[i];
    const fileName = Path.basename(objFilePath, ".o");
    if (
      fileName.indexOf("bank_") !== 0 &&
      fileName.indexOf("music_bank_") !== 0
    ) {
        
      const matchingSrc = srcFiles.find(
        (file) =>
          file.endsWith(`${fileName}.c`) || file.endsWith(`${fileName}.s`)
      );

      if (matchingSrc) {
        const checksum = await checksumFile(matchingSrc);
        const cacheFilename = checksumString(`${envChecksum}_${includeChecksum}_${checksum}`);
        const outFile = `${cacheRoot}/${cacheFilename}`;
        await copyFile(objFilePath, outFile);
      }
    }
  }
};

export const fetchCachedObjData = async (buildRoot, env) => {
  const cacheRoot = Path.normalize(`${getTmp()}/_gbscache/obj`);
  const buildObjRoot = Path.normalize(`${buildRoot}/obj`);
  const buildSrcRoot = Path.normalize(`${buildRoot}/src`);
  const buildIncludeRoot = Path.normalize(`${buildRoot}/include`);

  const srcFiles = await globAsync(`${buildSrcRoot}/**/*.{c,s}`);
  const includeFiles = await globAsync(`${buildIncludeRoot}/**/*.h`);

  const includeChecksums = await Promise.all(includeFiles.map(checksumFile));
  const includeChecksum = mergeChecksums(includeChecksums);

  const envChecksum = checksumString(JSON.stringify(env));

  for (let i = 0; i < srcFiles.length; i++) {
    const srcFilePath = srcFiles[i];
    const fileName = Path.basename(srcFilePath).replace(/\.(s|c)$/, "");
    const checksum = await checksumFile(srcFilePath);
    const cacheFilename = checksumString(`${envChecksum}_${includeChecksum}_${checksum}`);
    const cacheFile = `${cacheRoot}/${cacheFilename}`;

    if (await pathExists(cacheFile)) {
      const outFile = `${buildObjRoot}/${fileName}.o`;
      await copyFile(cacheFile, outFile);
    }
  }
};
