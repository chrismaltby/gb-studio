import promiseLimit from "../helpers/promiseLimit2";
import { assetFilename } from "../helpers/gbstudio";
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
} from "store/features/entities/entitiesTypes";
import { IndexedImage } from "../tiles/indexedImage";

const S_PALETTE = 0x10;
const S_FLIPX = 0x20;
const S_FLIPY = 0x40;
const S_PRIORITY = 0x80;
const S_GBC_PALETTE_MASK = 0x7;

interface SpriteSheetFrameData {
  id: string;
  tiles: MetaspriteTile[];
}

interface SpriteSheetAnimationData {
  id: string;
  frames: SpriteSheetFrameData[];
}

interface SpriteSheetStateData {
  id: string;
  name: string;
  animationType: SpriteAnimationType;
  flipLeft: boolean;
  animations: SpriteSheetAnimationData[];
}

export interface SpriteSheetData {
  id: string;
  name: string;
  filename: string;
  canvasWidth: number;
  canvasHeight: number;
  states: SpriteSheetStateData[];
  boundsX: number;
  boundsY: number;
  boundsWidth: number;
  boundsHeight: number;
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
  flipY: boolean,
  priority: boolean
): number => {
  return (
    (objPalette === "OBP1" ? S_PALETTE : 0) +
    (flipX ? S_FLIPX : 0) +
    (flipY ? S_FLIPY : 0) +
    (priority ? S_PRIORITY : 0) +
    (paletteIndex & S_GBC_PALETTE_MASK)
  );
};

export const compileSprite = async (
  spriteSheet: SpriteSheetData,
  projectRoot: string
): Promise<PrecompiledSpriteSheetData> => {
  const filename = assetFilename(projectRoot, "sprites", spriteSheet);

  const metasprites = spriteSheet.states
    .map((state) => state.animations)
    .flat()
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

  const animationDefs: SpriteTileData[][][] = spriteSheet.states
    .map((state) =>
      toEngineOrder(
        animationMapBySpriteType(
          state.animations,
          state.animationType,
          state.flipLeft,
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
                        optimisedTile.flipY,
                        tile.priority
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
                      optimisedTile.flipY,
                      tile.priority
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
      )
    )
    .flat();

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

const compileSprites = async (
  spriteSheets: SpriteSheetData[],
  projectRoot: string
): Promise<{
  spritesData: PrecompiledSpriteSheetData[];
  statesOrder: string[];
  stateReferences: string[];
}> => {
  const spritesData = await promiseLimit(
    10,
    spriteSheets.map(
      (spriteSheet) => () => compileSprite(spriteSheet, projectRoot)
    )
  );
  const stateNames = spritesData
    .map((sprite) => sprite.states)
    .flat()
    .map((state) => state.name)
    .filter((name) => name.length > 0);

  const stateCounts = stateNames.reduce((memo, name) => {
    name in memo ? (memo[name] += 1) : (memo[name] = 1);
    return memo;
  }, {} as Record<string, number>);

  const statesOrder = Object.keys(stateCounts).sort((a, b) => {
    if (stateCounts[a] === stateCounts[b]) {
      return 0;
    }
    return stateCounts[a] < stateCounts[b] ? 1 : -1;
  });

  statesOrder.unshift("");

  // Build reference names for states
  const stateReferences: string[] = [];
  statesOrder.forEach((name) => {
    const refName =
      (name || "Default")
        .replace(/ /g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .toUpperCase() || "S";

    let insertName = `STATE_${refName}`;
    let insNum = 1;
    while (stateReferences.includes(insertName)) {
      insertName = `STATE_${refName}_${insNum++}`;
    }
    stateReferences.push(insertName);
  });

  return { spritesData, statesOrder, stateReferences };
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
