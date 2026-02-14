import fs from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";
import { buildToolsRoot } from "consts";
import copy from "lib/helpers/fsCopy";

const rmdir = promisify(rimraf);

let inFlightPromise: Promise<string> | null = null;
let cachedPath: string | null = null;
let cacheExpiresAt = 0;

const CACHE_TTL_MS = 60_000; // 1 minute

const ensureBuildTools = async (tmpPath: string): Promise<string> => {
  const now = Date.now();

  // If cached and valid, return immediately
  if (cachedPath && now < cacheExpiresAt) {
    return cachedPath;
  }

  // If a build is already in progress, reuse it
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const result = await ensureBuildToolsInner(tmpPath);

      cachedPath = result;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;

      return result;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};

const ensureBuildToolsInner = async (tmpPath: string): Promise<string> => {
  const buildToolsPath = `${buildToolsRoot}/${process.platform}-${process.arch}`;
  const expectedVersionPath = `${buildToolsPath}/tools_version`;

  const tmpBuildToolsPath = `${tmpPath}/_gbstools`;
  const tmpVersionPath = `${tmpBuildToolsPath}/tools_version`;

  const expectedVersion = await fs.readFile(expectedVersionPath, "utf8");

  let needsCopy = false;

  try {
    const currentVersion = await fs.readFile(tmpVersionPath, "utf8");
    if (currentVersion !== expectedVersion) {
      needsCopy = true;
    }
  } catch {
    // No engine.json found
    needsCopy = true;
  }

  if (needsCopy) {
    await rmdir(tmpBuildToolsPath);
    await copy(buildToolsPath, tmpBuildToolsPath, {
      overwrite: true,
      mode: 0o755,
    });
  }

  return tmpBuildToolsPath;
};

export default ensureBuildTools;
