import { TILE_SIZE } from "consts";
import { readFileToIndexedImage } from "lib/tiles/readFileToTiles";
import {
  OptimisedTile,
  blitIndexedImageData,
  indexedImageTo2bppSpriteData,
  indexedUnknownToTransparent,
  isBlankIndexedImage,
  isIndexedImageEqual,
  mergeIndexedImages,
  removeIndexedImageMask,
  spriteDataIndexFn,
} from "shared/lib/sprites/spriteData";
import {
  IndexedImage,
  flipIndexedImageX,
  flipIndexedImageY,
  makeIndexedImage,
  sliceIndexedImage,
} from "shared/lib/tiles/indexedImage";
import type { MetaspriteTile } from "shared/lib/entities/entitiesTypes";
import { SpriteModeSetting } from "shared/lib/resources/types";

/**
 * Read an image filename into a GB 2bpp data array
 * @param filename Tiles image filename
 * @returns Uint8Array of 2bpp tile data
 */
export const readFileToSpriteTilesData = async (
  filename: string,
): Promise<Uint8Array> => {
  const img = await readFileToIndexedImage(filename, spriteDataIndexFn);
  const xTiles = Math.floor(img.width / TILE_SIZE);
  const yTiles = Math.floor(img.height / TILE_SIZE);
  const size = xTiles * yTiles * 16;
  const output = new Uint8Array(size);
  let index = 0;
  for (let txi = 0; txi < xTiles; txi++) {
    for (let tyi = 0; tyi < yTiles; tyi++) {
      const tileData = indexedImageTo2bppSpriteData(
        sliceIndexedImage(
          img,
          txi * TILE_SIZE,
          tyi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        ),
      );
      output.set(tileData, index);
      index += tileData.length;
    }
  }
  return output;
};

export const optimiseTiles = async (
  filename: string,
  spriteWidth: number,
  spriteHeight: number,
  metasprites: MetaspriteTile[][],
  spriteMode: SpriteModeSetting,
): Promise<{
  tiles: IndexedImage[];
  lookup: Record<string, OptimisedTile | undefined>;
}> => {
  const tileLookup: Record<string, number> = {};
  const allTiles: IndexedImage[] = [];
  const uniqTiles: IndexedImage[] = [];
  const uniqTileData: IndexedImage[] = [];
  const tileIds: string[] = [];
  const optimisedLookup2: Record<string, OptimisedTile | undefined> = {};
  const indexedImage = await readFileToIndexedImage(
    filename,
    spriteDataIndexFn,
  );

  for (const myTiles of metasprites) {
    let mask = makeIndexedImage(spriteWidth, spriteHeight);
    for (let ti = myTiles.length - 1; ti >= 0; ti--) {
      const tileDef = myTiles[ti];
      let slicedTile = sliceIndexedImage(
        indexedImage,
        tileDef.sliceX,
        tileDef.sliceY,
        8,
        spriteMode === "8x8" ? 8 : 16,
      );
      if (tileDef.flipX) {
        slicedTile = flipIndexedImageX(slicedTile);
      }
      if (tileDef.flipY) {
        slicedTile = flipIndexedImageY(slicedTile);
      }

      const visibleTile = removeIndexedImageMask(
        slicedTile,
        mask,
        spriteWidth / 2 - 8 + tileDef.x,
        spriteHeight - (spriteMode === "8x8" ? 8 : 16) - tileDef.y,
      );

      mask = blitIndexedImageData(
        mask,
        slicedTile,
        spriteWidth / 2 - 8 + tileDef.x,
        spriteHeight - (spriteMode === "8x8" ? 8 : 16) - tileDef.y,
      );

      tileLookup[tileDef.id] = allTiles.length;
      allTiles.push(visibleTile);
      tileIds.push(tileDef.id);
    }
  }

  for (let i = 0; i < allTiles.length; i++) {
    let found = false;
    const tile = allTiles[i];

    if (isBlankIndexedImage(tile)) {
      // If tile is empty (e.g. completely obscured)
      // then don't add to unique tiles
      const id = tileIds[i];
      optimisedLookup2[id] = undefined;
      continue;
    }

    for (let ui = 0; ui < uniqTiles.length; ui++) {
      const uniqTile = uniqTiles[ui];
      const tileFX = flipIndexedImageX(tile);
      const tileFY = flipIndexedImageY(tile);
      const tileFXY = flipIndexedImageX(flipIndexedImageY(tile));

      if (isIndexedImageEqual(tile, uniqTile)) {
        found = true;
        const id = tileIds[i];
        uniqTiles[ui] = mergeIndexedImages(uniqTile, tile);
        optimisedLookup2[id] = {
          tile: ui * (spriteMode === "8x8" ? 1 : 2),
          flipX: false,
          flipY: false,
        };
        break;
      } else if (isIndexedImageEqual(tileFX, uniqTile)) {
        found = true;
        const id = tileIds[i];
        uniqTiles[ui] = mergeIndexedImages(uniqTile, tileFX);
        optimisedLookup2[id] = {
          tile: ui * (spriteMode === "8x8" ? 1 : 2),
          flipX: true,
          flipY: false,
        };
        break;
      } else if (isIndexedImageEqual(tileFY, uniqTile)) {
        found = true;
        const id = tileIds[i];
        uniqTiles[ui] = mergeIndexedImages(uniqTile, tileFY);
        optimisedLookup2[id] = {
          tile: ui * (spriteMode === "8x8" ? 1 : 2),
          flipX: false,
          flipY: true,
        };
        break;
      } else if (isIndexedImageEqual(tileFXY, uniqTile)) {
        found = true;
        const id = tileIds[i];
        uniqTiles[ui] = mergeIndexedImages(uniqTile, tileFXY);
        optimisedLookup2[id] = {
          tile: ui * (spriteMode === "8x8" ? 1 : 2),
          flipX: true,
          flipY: true,
        };
        break;
      }
    }

    if (!found) {
      const id = tileIds[i];
      optimisedLookup2[id] = {
        tile: uniqTiles.length * (spriteMode === "8x8" ? 1 : 2),
        flipX: false,
        flipY: false,
      };
      uniqTiles.push(tile);
    }
  }

  for (const tile of uniqTiles) {
    uniqTileData.push(
      indexedUnknownToTransparent(sliceIndexedImage(tile, 0, 0, 8, 8)),
    );
    if (spriteMode !== "8x8") {
      uniqTileData.push(
        indexedUnknownToTransparent(sliceIndexedImage(tile, 0, 8, 8, 8)),
      );
    }
  }

  return {
    tiles: uniqTileData,
    lookup: optimisedLookup2,
  };
};
