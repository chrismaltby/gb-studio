import childProcess from "child_process";
import Path from "path";
import { checksumFile, checksumString } from "../helpers/checksum";
import { assetFilename } from "../helpers/gbstudio";
import { readFile, ensureDir, pathExists, writeFile, unlink } from "fs-extra";
import ensureBuildTools from "./ensureBuildTools";

export interface PrecompiledMusicTrack {
  id: string;
  name: string;
  dataName: string;
  filename: string;
  settings: {
    disableSpeedConversion: boolean;
  };
}

interface CompileMusicOptions {
  tmpPath: string;
  projectRoot: string;
  engine: "gbt" | "huge";
  output: Record<string, string>;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
}

interface CompileModTrackOptions {
  projectRoot: string;
  buildToolsPath: string;
  buildToolsVersion: string;
  cacheRoot: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
}

interface CompileHugeTrackOptions {
  projectRoot: string;
  buildToolsPath: string;
  buildToolsVersion: string;
  cacheRoot: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
}

const compileModTrack = async (
  track: PrecompiledMusicTrack,
  {
    projectRoot,
    buildToolsPath,
    buildToolsVersion,
    cacheRoot,
    progress = (_msg) => {},
    warnings = (_msg) => {},
  }: CompileModTrackOptions
): Promise<string> => {
  const env = Object.create(process.env);
  env.PATH = [`${buildToolsPath}/mod2gbt`, env.PATH].join(":");

  const command =
    process.platform === "win32"
      ? `"${buildToolsPath}\\mod2gbt\\mod2gbt.exe"`
      : "mod2gbt";

  const modPath = assetFilename(projectRoot, "music", track);

  const checksum = await checksumFile(modPath);
  const buildChecksum = checksumString(
    checksum + buildToolsVersion + JSON.stringify(track.settings)
  );
  const cachedFilePath = `${cacheRoot}/${buildChecksum}`;

  if (await pathExists(cachedFilePath)) {
    return readFile(cachedFilePath, "utf8");
  }

  const outputFile = "output.c";
  const tmpFilePath = `${cacheRoot}/${outputFile}`;

  const args = [`"${modPath}"`, track.dataName, "255"];

  if (track.settings.disableSpeedConversion) {
    args.push("-speed");
  }

  progress(`${command} ${args.join(" ")}`);

  const options = {
    cwd: cacheRoot,
    env,
    shell: true,
  };

  await new Promise<void>((resolve, reject) => {
    const child = childProcess.spawn(command, args, options);

    child.on("error", (err) => {
      warnings(err.toString());
    });

    child.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach((line: string) => {
        progress(line);
      });
    });

    child.stderr.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach((line: string) => {
        warnings(line);
      });
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(code);
    });
  });

  const output = (await readFile(tmpFilePath, "utf8")).replace(
    /#pragma bank=255/,
    `#pragma bank 255\n\nconst void __at(255) __bank_${track.dataName}_Data;\n`
  );

  await writeFile(cachedFilePath, output);
  await unlink(tmpFilePath);

  return output;
};

const compileModTracks = async (
  tracks: PrecompiledMusicTrack[],
  {
    tmpPath,
    projectRoot,
    output,
    progress = (_msg) => {},
    warnings = (_msg) => {},
  }: CompileMusicOptions
): Promise<void> => {
  const buildToolsPath = await ensureBuildTools(tmpPath);
  const cacheRoot = Path.normalize(`${tmpPath}/_gbscache/music`);
  ensureDir(cacheRoot);
  const buildToolsVersion = await readFile(
    `${buildToolsPath}/tools_version`,
    "utf8"
  );

  for (const track of tracks) {
    output[`GBT_PLAYER/${track.dataName}_Data.c`] = await compileModTrack(
      track,
      {
        projectRoot,
        buildToolsPath,
        buildToolsVersion,
        cacheRoot,
        progress,
        warnings,
      }
    );
  }
};

const compileUgeTrack = async (
  track: PrecompiledMusicTrack,
  {
    projectRoot,
    progress = (_msg) => {},
    warnings = (_msg) => {},
  }: CompileHugeTrackOptions
): Promise<string> => {
  return "// Not implemented";
};

const compileUgeTracks = async (
  tracks: PrecompiledMusicTrack[],
  {
    tmpPath,
    projectRoot,
    output,
    progress = (_msg) => {},
    warnings = (_msg) => {},
  }: CompileMusicOptions
): Promise<void> => {
  const buildToolsPath = await ensureBuildTools(tmpPath);
  const cacheRoot = Path.normalize(`${tmpPath}/_gbscache/music`);
  ensureDir(cacheRoot);
  const buildToolsVersion = await readFile(
    `${buildToolsPath}/tools_version`,
    "utf8"
  );

  for (const track of tracks) {
    output[`HUGE_TRACKER/${track.dataName}_Data.c`] = await compileUgeTrack(
      track,
      {
        projectRoot,
        buildToolsPath,
        buildToolsVersion,
        cacheRoot,
        progress,
        warnings,
      }
    );
  }
};

export const compileMusicHeader = (tracks: PrecompiledMusicTrack[]) => {
  return `#ifndef MUSIC_DATA_H
#define MUSIC_DATA_H

${tracks
  .map(
    (track) => `extern const void __bank_${track.dataName}_Data;
extern const void ${track.dataName}_Data;`
  )
  .join("\n")}

#endif
`;
};

export const compileMusicTracks = (
  tracks: PrecompiledMusicTrack[],
  options: CompileMusicOptions
) => {
  if (options.engine === "gbt") {
    return compileModTracks(tracks, options);
  } else {
    return compileUgeTracks(tracks, options);
  }
};
