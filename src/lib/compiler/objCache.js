import glob from "glob";
import Path from "path";
import crypto from "crypto";
import { promisify } from "util";
import { ensureDir, createReadStream, copyFile, pathExists } from "fs-extra";
import getTmp from "../helpers/getTmp";

const globAsync = promisify(glob);

export const objCache = {};

export const cacheObjData = async (buildRoot) => {
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
        const outFile = `${cacheRoot}/${includeChecksum}_${checksum}`;
        await copyFile(objFilePath, outFile);
      }
    }
  }
};

export const fetchCachedObjData = async (buildRoot) => {
  const cacheRoot = Path.normalize(`${getTmp()}/_gbscache/obj`);
  const buildObjRoot = Path.normalize(`${buildRoot}/obj`);
  const buildSrcRoot = Path.normalize(`${buildRoot}/src`);
  const buildIncludeRoot = Path.normalize(`${buildRoot}/include`);

  const srcFiles = await globAsync(`${buildSrcRoot}/**/*.{c,s}`);
  const includeFiles = await globAsync(`${buildIncludeRoot}/**/*.h`);

  const includeChecksums = await Promise.all(includeFiles.map(checksumFile));
  const includeChecksum = mergeChecksums(includeChecksums);

  for (let i = 0; i < srcFiles.length; i++) {
    const srcFilePath = srcFiles[i];
    const fileName = Path.basename(srcFilePath).replace(/\.(s|c)$/, "");
    const checksum = await checksumFile(srcFilePath);
    const cacheFile = `${cacheRoot}/${includeChecksum}_${checksum}`;

    if (await pathExists(cacheFile)) {
      const outFile = `${buildObjRoot}/${fileName}.o`;
      await copyFile(cacheFile, outFile);
    }
  }
};

const checksumFile = (path) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const stream = createReadStream(path);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

const mergeChecksums = (checksums) => {
  const hash = crypto.createHash("sha1");

  for (let i = 0; i < checksums.length; i++) {
    hash.update(checksums[i]);
  }

  return hash.digest("hex");
};
