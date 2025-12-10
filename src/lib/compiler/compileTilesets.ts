import promiseLimit from "lib/helpers/promiseLimit";
import getFileModifiedTime from "lib/helpers/fs/getModifiedTime";
import { assetFilename } from "shared/lib/helpers/assets";
import { readFileToTilesDataArray } from "lib/tiles/readFileToTiles";
import { tileArrayToTileData } from "shared/lib/tiles/tileData";
import { Tileset } from "shared/lib/resources/types";

type CompileTilesetOptions = {
  warnings: (msg: string) => void;
};

type PrecompiledTilesetData = Tileset & {
  id: string;
  data: Uint8Array;
};

const tilesetBuildCache: Record<
  string,
  {
    timestamp: number;
    data: Uint8Array;
  }
> = {};

const compileTilesets = async (
  tilesets: Tileset[],
  projectRoot: string,
  { warnings: _ }: CompileTilesetOptions,
): Promise<PrecompiledTilesetData[]> => {
  const tilesetData = await promiseLimit(
    10,
    tilesets.map((tileset) => {
      return async (): Promise<PrecompiledTilesetData> => {
        const filename = assetFilename(projectRoot, "tilesets", tileset);
        const modifiedTime = await getFileModifiedTime(filename);
        let data;

        if (
          tilesetBuildCache[tileset.id] &&
          tilesetBuildCache[tileset.id].timestamp >= modifiedTime
        ) {
          data = tilesetBuildCache[tileset.id].data;
        } else {
          const tileData = await readFileToTilesDataArray(filename);
          data = tileArrayToTileData(tileData);
          tilesetBuildCache[tileset.id] = {
            data,
            timestamp: modifiedTime,
          };
        }

        return {
          ...tileset,
          data,
        };
      };
    }),
  );

  return tilesetData;
};

export default compileTilesets;
