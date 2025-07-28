import promiseLimit from "lib/helpers/promiseLimit";
import { indexedImageTo2bppSpriteData } from "shared/lib/sprites/spriteData";
import {
  animationMapBySpriteType,
  toEngineOrder,
} from "shared/lib/sprites/helpers";
import type {
  ObjPalette,
  SpriteSheetData,
} from "shared/lib/entities/entitiesTypes";
import { IndexedImage } from "shared/lib/tiles/indexedImage";
import { assetFilename } from "shared/lib/helpers/assets";
import { optimiseTiles } from "lib/sprites/readSpriteData";
import { ReferencedSprite } from "./precompile/determineUsedAssets";
import {
  ColorModeSetting,
  SpriteModeSetting,
} from "shared/lib/resources/types";

const S_PALETTE = 0x10;
const S_FLIPX = 0x20;
const S_FLIPY = 0x40;
const S_PRIORITY = 0x80;
const S_GBC_PALETTE_MASK = 0x7;
const S_VRAM2 = 0x8;

export type SpriteTileAllocationStrategy = (
  tileIndex: number,
  numTiles: number,
  sprite: SpriteSheetData,
) => { tileIndex: number; inVRAM2: boolean };

interface AnimationOffset {
  start: number;
  end: number;
}

export type PrecompiledSpriteSheetData = SpriteSheetData & {
  vramData: [number[], number[]];
  tiles: IndexedImage[];
  metasprites: SpriteTileData[][];
  animationOffsets: AnimationOffset[];
  metaspritesOrder: number[];
  colorMode: ColorModeSetting;
};

interface SpriteTileData {
  tile: number;
  x: number;
  y: number;
  props: number;
}

/**
 * Allocates a sprite tile for to default DMG location.
 *
 * @param {number} tileIndex - The index of the sprite tile to allocate.
 * @param {number} numTiles - The total number of tiles available for allocation.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const spriteTileAllocationDefault: SpriteTileAllocationStrategy = (
  tileIndex,
) => {
  return {
    tileIndex,
    inVRAM2: false,
  };
};

/**
 * Allocates a sprite tile for color-only sprites and adjusts the tile index based on VRAM bank allocation.
 *
 * @param {number} tileIndex - The index of the sprite tile to allocate.
 * @param {number} numTiles - The total number of tiles available for allocation.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const spriteTileAllocationColorOnly: SpriteTileAllocationStrategy = (
  tileIndex,
  numTiles,
) => {
  const bank1NumTiles = Math.ceil(numTiles / 4) * 2;
  const inVRAM2 = tileIndex >= bank1NumTiles;
  return {
    tileIndex: inVRAM2 ? tileIndex - bank1NumTiles : tileIndex,
    inVRAM2: tileIndex >= bank1NumTiles,
  };
};

/**
 * Dummy sprite tile allocation strategy for testing purposes only allocates all sprite tiles to VRAM bank 2.
 *
 * @param {number} tileIndex - The index of the sprite tile to allocate.
 * @param {number} numTiles - The total number of tiles available for allocation.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const spriteTileAllocationVRAM2Only = (tileIndex: number) => {
  return {
    tileIndex,
    inVRAM2: true,
  };
};

const makeProps = (
  objPalette: ObjPalette,
  paletteIndex: number,
  flipX: boolean,
  flipY: boolean,
  priority: boolean,
  inVRAM2: boolean,
): number => {
  return (
    (objPalette === "OBP1" ? S_PALETTE : 0) +
    (flipX ? S_FLIPX : 0) +
    (flipY ? S_FLIPY : 0) +
    (priority ? S_PRIORITY : 0) +
    (paletteIndex & S_GBC_PALETTE_MASK) +
    (inVRAM2 ? S_VRAM2 : 0)
  );
};

export const compileSprite = async (
  spriteSheet: ReferencedSprite,
  cgbOnly: boolean,
  projectRoot: string,
  defaultSpriteMode: SpriteModeSetting,
): Promise<PrecompiledSpriteSheetData> => {
  const filename = assetFilename(projectRoot, "sprites", spriteSheet);

  const spriteMode: SpriteModeSetting =
    spriteSheet.spriteMode ?? defaultSpriteMode ?? "8x16";

  const tileAllocationStrategy = cgbOnly
    ? spriteTileAllocationColorOnly
    : spriteTileAllocationDefault;

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
    metasprites,
    spriteMode,
  );

  const animationDefs: SpriteTileData[][][] = spriteSheet.states
    .map((state) =>
      toEngineOrder(
        animationMapBySpriteType(
          state.animations,
          state.animationType,
          state.flipLeft,
          (animation, flip) => {
            if (!animation) {
              return [];
            }
            return animation.frames.map((frame) => {
              let currentX = 0;
              let currentY = spriteMode === "8x16" ? 0 : -8;
              return [...frame.tiles]
                .reverse()
                .map((tile) => {
                  const optimisedTile = lookup[tile.id];
                  if (!optimisedTile) {
                    return null;
                  }
                  const { tileIndex, inVRAM2 } = tileAllocationStrategy(
                    optimisedTile.tile,
                    tiles.length,
                    spriteSheet,
                  );
                  if (flip) {
                    const data: SpriteTileData = {
                      tile: tileIndex,
                      x: 8 - tile.x - currentX,
                      y: -tile.y - currentY,
                      props: makeProps(
                        tile.objPalette,
                        tile.paletteIndex,
                        !optimisedTile.flipX,
                        optimisedTile.flipY,
                        tile.priority,
                        inVRAM2,
                      ),
                    };
                    currentX = 8 - tile.x;
                    currentY = -tile.y;
                    return data;
                  }
                  const data: SpriteTileData = {
                    tile: tileIndex,
                    x: tile.x - currentX,
                    y: -tile.y - currentY,
                    props: makeProps(
                      tile.objPalette,
                      tile.paletteIndex,
                      optimisedTile.flipX,
                      optimisedTile.flipY,
                      tile.priority,
                      inVRAM2,
                    ),
                  };
                  currentX = tile.x;
                  currentY = -tile.y;
                  return data;
                })
                .filter((tile) => tile) as SpriteTileData[];
            });
          },
        ),
      ),
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

  const vramData: [number[], number[]] = [[], []];

  // Split tiles into VRAM banks based on allocation strategy
  tiles.map(indexedImageTo2bppSpriteData).forEach((tile, i) => {
    const { inVRAM2 } = tileAllocationStrategy(i, tiles.length, spriteSheet);
    vramData[inVRAM2 ? 1 : 0].push(...tile);
  });

  const precompiled: PrecompiledSpriteSheetData = {
    ...spriteSheet,
    vramData,
    tiles,
    metasprites: uniqFrames,
    animationOffsets,
    metaspritesOrder: orderedFrames,
  };

  return precompiled;
};

const compileSprites = async (
  spriteSheets: ReferencedSprite[],
  projectRoot: string,
  defaultSpriteMode: SpriteModeSetting,
): Promise<{
  spritesData: PrecompiledSpriteSheetData[];
  statesOrder: string[];
  stateReferences: string[];
}> => {
  const spritesData = await promiseLimit(
    10,
    spriteSheets.map(
      (spriteSheet) => () =>
        compileSprite(
          spriteSheet,
          spriteSheet.colorMode === "color",
          projectRoot,
          defaultSpriteMode,
        ),
    ),
  );
  const stateNames = spritesData
    .map((sprite) => sprite.states)
    .flat()
    .map((state) => state.name)
    .filter((name) => name.length > 0);

  const stateCounts = stateNames.reduce(
    (memo, name) => {
      name in memo ? (memo[name] += 1) : (memo[name] = 1);
      return memo;
    },
    {} as Record<string, number>,
  );

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
