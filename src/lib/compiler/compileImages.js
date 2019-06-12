import { assetFilename } from "../helpers/gbstudio";

const ggbgfx = require("./ggbgfx");

const MAX_SIZE = 9999999999;
const MAX_TILESET_TILES = 16 * 12;

const compileImages = async (imgs, projectPath, tmpPath, { warnings }) => {
  const tilesetLookups = [];
  const tilesetIndexes = [];
  const output = {
    tilesets: {},
    tilemaps: {},
    tilemapsTileset: {}
  };

  // Build lookups
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const tilesetLookup = await ggbgfx.imageToTilesetLookup(
      assetFilename(projectPath, "backgrounds", img)
    );
    const tilesetLength = Object.keys(tilesetLookup).length;
    tilesetIndexes[i] = i;
    if (tilesetLength > MAX_TILESET_TILES) {
      warnings(
        `Background '${
          img.filename
        }' contains too many unique 8x8px tiles (${tilesetLength} where limit is ${MAX_TILESET_TILES}) meaning it may not display correctly. ` +
          `Consider reducing the amount of detail in this image.`
      );
    }
    tilesetLookups.push(tilesetLookup);
  }

  // Find smallest overlapping lookups
  for (let i = 0; i < imgs.length - 1; i++) {
    let minDiffLength = MAX_SIZE;
    let minLookup = null;
    let minIndex = null;

    for (let j = i + 1; j < imgs.length; j++) {
      const mergedLookup = await ggbgfx.mergeTileLookups([
        tilesetLookups[i],
        tilesetLookups[j]
      ]);
      const mergedLength = Object.keys(mergedLookup).length;
      const diffLength =
        Object.keys(mergedLookup).length -
        Object.keys(tilesetLookups[j]).length;

      if (mergedLength <= MAX_TILESET_TILES && diffLength < minDiffLength) {
        minLookup = mergedLookup;
        minIndex = j;
        minDiffLength = diffLength;
        if (minDiffLength === 0) {
          break;
        }
      }
    }

    if (minIndex) {
      for (let k = 0; k <= i; k++) {
        if (
          tilesetLookups[k] === tilesetLookups[i] ||
          tilesetLookups[k] === tilesetLookups[minIndex]
        ) {
          tilesetLookups[k] = minLookup;
        }
      }
      tilesetLookups[minIndex] = minLookup;
    }
  }

  // Remove unneeded tilesets
  for (let i = 0; i < imgs.length - 1; i++) {
    for (let j = imgs.length - 1; j >= i + 1; j--) {
      if (tilesetLookups[i] === tilesetLookups[j]) {
        tilesetIndexes[i] = j;
        tilesetLookups[i] = null;
        break;
      }
    }
  }

  // Output lookups to files
  for (let i = 0; i < imgs.length; i++) {
    if (tilesetLookups[i]) {
      await ggbgfx.tileLookupToImage(
        tilesetLookups[i],
        `${tmpPath}/tileset_${i}.png`
      );

      // output.tilesets[i] = ggbgfx.tilesLookupToTilesString(tilesetLookups[i]);
      output.tilesets[i] = ggbgfx.tilesLookupToTilesIntArray(tilesetLookups[i]);
    }
  }

  for (let i = 0; i < imgs.length; i++) {
    const tilemap = await ggbgfx.imageAndTilesetToTilemapIntArray(
      assetFilename(projectPath, "backgrounds", imgs[i]),
      `${tmpPath}/tileset_${tilesetIndexes[i]}.png`
    );
    output.tilemaps[imgs[i].id] = tilemap;
    output.tilemapsTileset[imgs[i].id] = tilesetIndexes[i];
  }

  return output;
};

module.exports = compileImages;
