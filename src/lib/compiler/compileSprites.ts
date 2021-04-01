import promiseLimit from "../helpers/promiseLimit";
import { assetFilename } from "../helpers/gbstudio";
import getFileModifiedTime from "../helpers/fs/getModifiedTime";
import {
  optimiseTiles,
  indexedImageTo2bppSpriteData,
} from "../sprite/spriteData";
import {
  animationMapBySpriteType,
  toEngineOrder,
} from "../../components/sprites/helpers";
import {
  MetaspriteTile,
  ObjPalette,
  SpriteAnimationType,
} from "../../store/features/entities/entitiesTypes";
import { IndexedImage } from "../tiles/indexedImage";

const S_PALETTE = 0x10;
const S_FLIPX = 0x20;
const S_FLIPY = 0x40;
const S_GBC_PALETTE_MASK = 0x7;

interface SpriteSheetFrameData {
  id: string;
  tiles: MetaspriteTile[];
}

interface SpriteSheetAnimationData {
  id: string;
  frames: SpriteSheetFrameData[];
}

interface SpriteSheetData {
  id: string;
  name: string;
  filename: string;
  canvasWidth: number;
  canvasHeight: number;
  animationType: SpriteAnimationType;
  flipLeft: boolean;
  animations: SpriteSheetAnimationData[];
  _v: string;
}

interface AnimationOffset {
  start: number;
  end: number;
}

export type PrecompiledSpriteSheetData = SpriteSheetData & {
  data: number[];
  tiles: IndexedImage[];
  tilesetIndex: number;
  metasprites: SpriteTileData[][];
  animationOffsets: AnimationOffset[];
  metaspritesOrder: number[];
};

type CompileSpriteOptions = {
  warnings: (msg: string) => void;
};

interface SpriteTileData {
  tile: number;
  x: number;
  y: number;
  props: number;
}

const makeProps = (
  objPalette: ObjPalette,
  paletteIndex: number,
  flipX: boolean,
  flipY: boolean
): number => {
  return (
    (objPalette === "OBP1" ? S_PALETTE : 0) +
    (flipX ? S_FLIPX : 0) +
    (flipY ? S_FLIPY : 0) +
    (paletteIndex & S_GBC_PALETTE_MASK)
  );
};

const compileSprites = async (
  spriteSheets: SpriteSheetData[],
  projectRoot: string,
  { warnings }: CompileSpriteOptions
): Promise<PrecompiledSpriteSheetData[]> => {
  const spriteData = await promiseLimit(
    10,
    spriteSheets.map((spriteSheet) => {
      return async () => {
        const filename = assetFilename(projectRoot, "sprites", spriteSheet);

        const metasprites = spriteSheet.animations
          .map((animation) => {
            return animation.frames.map((frame) => frame.tiles);
          })
          .flat();

        const { tiles, lookup } = await optimiseTiles(
          filename,
          spriteSheet.canvasWidth,
          spriteSheet.canvasHeight,
          metasprites
        );

        const animationDefs: SpriteTileData[][][] = toEngineOrder(
          animationMapBySpriteType(
            spriteSheet.animations,
            spriteSheet.animationType,
            spriteSheet.flipLeft,
            (animation, flip) => {
              return animation.frames.map((frame) => {
                let currentX = 0;
                let currentY = 0;
                return [...frame.tiles]
                  .reverse()
                  .map((tile) => {
                    const optimisedTile = lookup[tile.id];
                    if (!optimisedTile) {
                      return null;
                    }
                    if (flip) {
                      const data: SpriteTileData = {
                        tile: optimisedTile.tile,
                        x: 8 - tile.x - currentX,
                        y: -tile.y - currentY,
                        props: makeProps(
                          tile.objPalette,
                          tile.paletteIndex,
                          !optimisedTile.flipX,
                          optimisedTile.flipY
                        ),
                      };
                      currentX = 8 - tile.x;
                      currentY = -tile.y;
                      return data;
                    }
                    const data: SpriteTileData = {
                      tile: optimisedTile.tile,
                      x: tile.x - currentX,
                      y: -tile.y - currentY,
                      props: makeProps(
                        tile.objPalette,
                        tile.paletteIndex,
                        optimisedTile.flipX,
                        optimisedTile.flipY
                      ),
                    };
                    currentX = tile.x;
                    currentY = -tile.y;
                    return data;
                  })
                  .filter((tile) => tile) as SpriteTileData[];
              });
            }
          )
        );

        // const uniqFrames: SpriteTileData[][] = [];
        const uniqFramesLookup: Record<string, number> = {};
        const uniqFrames: SpriteTileData[][] = [];
        const uniqMap = animationDefs.map((animationDef) => {
          return animationDef.map((frame) => {
            const key = JSON.stringify(frame); // Any hash function can work here
            if (uniqFramesLookup[key] === undefined) {
              uniqFramesLookup[key] = uniqFrames.length;
              uniqFrames.push(frame);
            }
            return uniqFramesLookup[key];
          });
        });

        const orderedFrames: number[] = [];
        const animationOffsets = uniqMap.map((uniqIndexes) => {
          let start = 0;
          const matchIndex = firstIndexOfMatch(orderedFrames, uniqIndexes);
          if (matchIndex > -1) {
            start = matchIndex;
          } else {
            start = orderedFrames.length;
            orderedFrames.push(...uniqIndexes);
          }
          return {
            start,
            end: start + Math.max(0, uniqIndexes.length - 1),
          };
        });

        const data = Array.from(
          tiles
            .map(indexedImageTo2bppSpriteData)
            .reduce((a, b) => [...a, ...Array.from(b)], [] as number[])
        );

        const precompiled: PrecompiledSpriteSheetData = {
          ...spriteSheet,
          data,
          tiles,
          tilesetIndex: 0,
          metasprites: uniqFrames,
          animationOffsets,
          metaspritesOrder: orderedFrames,
        };

        return precompiled;
      };
    })
  );

  return spriteData;
};

const firstIndexOfMatch = <T>(arr: T[], pattern: T[]): number => {
  for (
    let i = 0;
    i < arr.length && i < arr.length - (pattern.length - 1);
    i++
  ) {
    let found = true;
    for (let j = 0; j < pattern.length; j++) {
      if (arr[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      return i;
    }
  }
  return -1;
};

export default compileSprites;
