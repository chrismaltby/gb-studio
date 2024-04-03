import promiseLimit from "lib/helpers/promiseLimit";
import getFileModifiedTime from "lib/helpers/fs/getModifiedTime";
import { assetFilename } from "shared/lib/helpers/assets";
import { readFileToSpriteTilesData } from "lib/sprites/readSpriteData";
import { TilesetData } from "shared/lib/entities/entitiesTypes";
import { readFileToTilesDataArray } from "lib/tiles/readFileToTiles";
import { tileArrayToTileData } from "shared/lib/tiles/tileData";

type CompileTilesetOptions = {
  warnings: (msg: string) => void;
};

export type PrecompiledTilesetData = TilesetData & {
  data: Uint8Array;
  size: number;
  frames: number;
};

const tilesetBuildCache: Record<
  string,
  {
    timestamp: number;
    data: Uint8Array;
  }
> = {};

const compileTilesets = async (
  tilesets: TilesetData[],
  projectRoot: string,
  { warnings }: CompileTilesetOptions
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

        const size = data.length;
        const frames = Math.ceil(size / 64);
        if (Math.ceil(size / 64) !== Math.floor(size / 64)) {
          warnings(
            `Tileset '${tileset.filename}' has invalid dimensions and may not appear correctly. Must be 16px tall and a multiple of 16px wide.`
          );
        }

        return {
          ...tileset,
          data,
          size,
          frames,
        };
      };
    })
  );

  return tilesetData;
};

export default compileTilesets;
