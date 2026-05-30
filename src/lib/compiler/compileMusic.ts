import { readFile } from "fs-extra";
import { exportToC, loadUGESong } from "shared/lib/uge/ugeHelper";
import { assetFilename } from "shared/lib/helpers/assets";
import { convertMODDataToUGESong } from "shared/lib/uge/mod2uge/import";

export interface PrecompiledMusicTrack {
  id: string;
  name: string;
  dataName: string;
  filename: string;
  type?: string;
  settings: {
    disableSpeedConversion?: boolean;
  };
}

interface CompileMusicOptions {
  tmpPath: string;
  projectRoot: string;
  output: Record<string, string>;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
}

interface CompileHugeTrackOptions {
  projectRoot: string;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
}

const compileUgeTrack = async (
  track: PrecompiledMusicTrack,
  { projectRoot }: CompileHugeTrackOptions,
): Promise<string> => {
  const filePath = assetFilename(projectRoot, "music", track);
  const data = await readFile(filePath);

  const song =
    track.type === "uge"
      ? loadUGESong(data)
      : convertMODDataToUGESong(data, !track.settings.disableSpeedConversion);

  if (song) {
    return exportToC(song, track.dataName);
  } else {
    return "// No song found";
  }
};

const compileUgeTracks = async (
  tracks: PrecompiledMusicTrack[],
  {
    projectRoot,
    output,
    progress = (_msg) => {},
    warnings = (_msg) => {},
  }: CompileMusicOptions,
): Promise<void> => {
  for (const track of tracks) {
    output[`music/${track.dataName}_Data.c`] = await compileUgeTrack(track, {
      projectRoot,
      progress,
      warnings,
    });
  }
};

export const compileMusicHeader = (tracks: PrecompiledMusicTrack[]) => {
  return `#ifndef MUSIC_DATA_H
#define MUSIC_DATA_H

${tracks
  .map(
    (track) => `extern const void __bank_${track.dataName}_Data;
extern const void ${track.dataName}_Data;`,
  )
  .join("\n")}

#endif
`;
};

export const compileMusicTracks = (
  tracks: PrecompiledMusicTrack[],
  options: CompileMusicOptions,
) => {
  return compileUgeTracks(tracks, options);
};
