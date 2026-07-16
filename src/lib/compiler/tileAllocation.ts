import { SpriteModeSetting } from "shared/lib/resources/types";

type ImageTileAllocationStrategy = (
  tileIndex: number,
  numTiles: number,
) => { tileIndex: number; inVRAM2: boolean };

type SpriteTileAllocationStrategy = (
  tileIndex: number,
  numTiles: number,
  spriteMode: SpriteModeSetting,
) => { tileIndex: number; inVRAM2: boolean };

/**
 * Allocates an image tile for to default DMG location.
 *
 * @param {number} tileIndex - The index of the tile to allocate.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const imageTileAllocationDefault: ImageTileAllocationStrategy = (
  tileIndex,
) => {
  return {
    tileIndex,
    inVRAM2: false,
  };
};

/**
 * Allocates an image tile for color-only mode and adjusts the tile index based on VRAM bank allocation.
 *
 * @param {number} tileIndex - The index of the tile to allocate.
 * @returns {{ tileIndex: number, inVRAM2: boolean }} Updated tile index and flag which is set if tile has been reallocated to VRAM bank2.
 */
export const imageTileAllocationColorOnly: ImageTileAllocationStrategy = (
  tileIndex: number,
): { tileIndex: number; inVRAM2: boolean } => {
  // First 128 tiles go into vram bank 1
  if (tileIndex < 128) {
    return {
      tileIndex,
      inVRAM2: false,
    };
    // Next 128 tiles go into vram bank 2
  } else if (tileIndex < 256) {
    return {
      tileIndex: tileIndex - 128,
      inVRAM2: true,
    };
  }
  // After that split evenly between bank 1 and 2
  return {
    tileIndex: 128 + Math.floor((tileIndex - 256) / 2),
    inVRAM2: tileIndex % 2 !== 0,
  };
};

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
  spriteMode,
) => {
  const bank1NumTiles =
    spriteMode === "8x16"
      ? Math.ceil(numTiles / 4) * 2
      : Math.ceil(numTiles / 2);
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
