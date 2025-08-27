import glob from "glob";
import Path from "path";
import { promisify } from "util";
import { ensureDir, copyFile, readFile, pathExists } from "fs-extra";
import { checksumString } from "lib/helpers/checksum";

const globAsync = promisify(glob);

interface ParsedInclude {
  contents: string;
  referencedFiles: string[];
  checksum: string;
}

type IncludesLookup = Record<string, ParsedInclude>;
type GameGlobalsLookup = Record<string, string>;

const objCache = {};

const GAME_GLOBALS_FILE = "data/game_globals.i";

const referencedFiles = (string: string): string[] => {
  return [...string.matchAll(/include "([^"]+)"/g)].map((m) => m[1]);
};

const fileChecksum = async (
  filename: string,
  includesLookup: IncludesLookup,
  gameGlobalsLookup: GameGlobalsLookup,
  envChecksum: string,
) => {
  const fileContents = await readFile(filename, "utf8");
  const fileChecksum = checksumString(fileContents);
  const headerFiles = referencedFiles(fileContents);
  let headerChecksums = "";
  // Add includes from headers
  for (const headerFilePath of headerFiles) {
    const header = includesLookup[headerFilePath];
    if (header) {
      for (const nestedHeader of header.referencedFiles) {
        if (!headerFiles.includes(nestedHeader)) {
          headerFiles.push(nestedHeader);
        }
      }
      if (headerFilePath === GAME_GLOBALS_FILE) {
        continue;
      }
      headerChecksums += header.checksum;
    }
  }
  // Only use addresses of globals that are used in file when generating checksum
  const usedGlobals = headerFiles.includes(GAME_GLOBALS_FILE)
    ? Object.keys(gameGlobalsLookup).filter((g) => {
        return fileContents.includes(g);
      })
    : [];
  const usedGlobalAddresses = usedGlobals.reduce(
    (memo, g) => (memo += `${gameGlobalsLookup[g]}_`),
    "",
  );
  return checksumString(
    `${fileChecksum}_${headerChecksums}_${usedGlobalAddresses}_${envChecksum}`,
  );
};

const generateIncludesLookup = async (buildIncludeRoot: string) => {
  const allIncludeFiles = await globAsync(`${buildIncludeRoot}/**/*.{h,i}`);
  const includesLookup: IncludesLookup = {};
  for (const filePath of allIncludeFiles) {
    const fileContents = await readFile(filePath, "utf8");
    const key = Path.relative(buildIncludeRoot, filePath)
      .split(Path.sep)
      .join(Path.posix.sep);
    includesLookup[key] = {
      contents: fileContents,
      referencedFiles: referencedFiles(fileContents),
      checksum: checksumString(fileContents),
    };
  }
  return includesLookup;
};

const generateGameGlobalsLookup = (gameGlobalsContents: string) => {
  const lookup: GameGlobalsLookup = {};
  const globalMatches = [
    ...gameGlobalsContents.matchAll(/([A-Za-z_0-9]+)[\s]*=[\s]*([0-9]+)/g),
  ];
  for (const globalMatch of globalMatches) {
    lookup[globalMatch[1]] = globalMatch[2];
  }
  return lookup;
};

export const cacheObjData = async (
  buildRoot: string,
  tmpPath: string,
  env: NodeJS.ProcessEnv,
) => {
  const cacheRoot = Path.normalize(`${tmpPath}/_gbscache/obj`);
  const buildObjRoot = Path.normalize(`${buildRoot}/obj`);
  const buildSrcRoot = Path.normalize(`${buildRoot}/src`);
  const buildIncludeRoot = Path.normalize(`${buildRoot}/include`);

  await ensureDir(cacheRoot);

  const includesLookup = await generateIncludesLookup(buildIncludeRoot);
  const gameGlobalsLookup = generateGameGlobalsLookup(
    includesLookup[GAME_GLOBALS_FILE]?.contents,
  );

  const objFiles = await globAsync(`${buildObjRoot}/*.o`);
  const srcFiles = await globAsync(`${buildSrcRoot}/**/*.{c,s}`);

  const envChecksum = checksumString(JSON.stringify(env));

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
        const cacheFilename = await fileChecksum(
          matchingSrc,
          includesLookup,
          gameGlobalsLookup,
          envChecksum,
        );

        const outFile = `${cacheRoot}/${cacheFilename}`;
        await copyFile(objFilePath, outFile);
      }
    }
  }
};

export const fetchCachedObjData = async (
  buildRoot: string,
  tmpPath: string,
  env: NodeJS.ProcessEnv,
) => {
  const cacheRoot = Path.normalize(`${tmpPath}/_gbscache/obj`);
  const buildObjRoot = Path.normalize(`${buildRoot}/obj`);
  const buildSrcRoot = Path.normalize(`${buildRoot}/src`);
  const buildIncludeRoot = Path.normalize(`${buildRoot}/include`);

  const envChecksum = checksumString(JSON.stringify(env));
  const includesLookup = await generateIncludesLookup(buildIncludeRoot);
  const gameGlobalsLookup = generateGameGlobalsLookup(
    includesLookup[GAME_GLOBALS_FILE]?.contents,
  );

  const srcFiles = await globAsync(`${buildSrcRoot}/**/*.{c,s}`);

  for (let i = 0; i < srcFiles.length; i++) {
    const srcFilePath = srcFiles[i];
    const fileName = Path.basename(srcFilePath).replace(/\.(s|c)$/, "");

    const cacheFilename = await fileChecksum(
      srcFilePath,
      includesLookup,
      gameGlobalsLookup,
      envChecksum,
    );

    const cacheFile = `${cacheRoot}/${cacheFilename}`;

    if (await pathExists(cacheFile)) {
      const outFile = `${buildObjRoot}/${fileName}.o`;
      await copyFile(cacheFile, outFile);
    }
  }
};
