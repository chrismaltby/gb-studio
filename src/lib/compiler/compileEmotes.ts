import promiseLimit from "../helpers/promiseLimit2";
import { assetFilename } from "../helpers/gbstudio";
import getFileModifiedTime from "../helpers/fs/getModifiedTime";
import { readFileToSpriteTilesData } from "../sprite/spriteData";
import { EmoteAssetData } from "../project/loadEmoteData";

type CompileEmoteOptions = {
  warnings: (msg: string) => void;
};

export type PrecompiledEmoteData = EmoteAssetData & {
  data: Uint8Array;
  size: number;
  frames: number;
};

const emoteBuildCache: Record<
  string,
  {
    timestamp: number;
    data: Uint8Array;
  }
> = {};

const compileEmotes = async (
  emotes: EmoteAssetData[],
  projectRoot: string,
  { warnings }: CompileEmoteOptions
): Promise<PrecompiledEmoteData[]> => {
  const emoteData = await promiseLimit(
    10,
    emotes.map((emote) => {
      return async (): Promise<PrecompiledEmoteData> => {
        const filename = assetFilename(projectRoot, "emotes", emote);
        const modifiedTime = await getFileModifiedTime(filename);
        let data;

        if (
          emoteBuildCache[emote.id] &&
          emoteBuildCache[emote.id].timestamp >= modifiedTime
        ) {
          data = emoteBuildCache[emote.id].data;
        } else {
          data = await readFileToSpriteTilesData(filename);
          emoteBuildCache[emote.id] = {
            data,
            timestamp: modifiedTime,
          };
        }

        const size = data.length;
        const frames = Math.ceil(size / 64);
        if (Math.ceil(size / 64) !== Math.floor(size / 64)) {
          warnings(
            `Emote '${emote.filename}' has invalid dimensions and may not appear correctly. Must be 16px tall and a multiple of 16px wide.`
          );
        }

        return {
          ...emote,
          data,
          size,
          frames,
        };
      };
    })
  );

  return emoteData;
};

export default compileEmotes;
