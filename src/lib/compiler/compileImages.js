import { assetFilename } from "../helpers/gbstudio";
import getFileModifiedTime from "../helpers/fs/getModifiedTime";
import { getBackgroundWarnings } from "../helpers/validation";

const ggbgfx = require("./ggbgfx");

const MAX_SIZE = 9999999999;
const MAX_TILESET_TILES = 16 * 12;

const imageBuildCache = {};

let lastOutput = null;
let lastOutputIds = "";

const compileImages = async (imgs, projectPath, tmpPath, { warnings }) => {
  const tilesetLookups = [];
  const tilesetIndexes = [];
  const output = {
    tilesets: {},
    tilemaps: {},
    tilemapsTileset: {},
  };
  let uncachedCount = 0;

  // Build lookups
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const filename = assetFilename(projectPath, "backgrounds", img);
    let tilesetLookup;

    const imageModifiedTime = await getFileModifiedTime(filename);

    if(imageBuildCache[img.id] && imageBuildCache[img.id].timestamp >= imageModifiedTime) {
      tilesetLookup = imageBuildCache[img.id].data;
    } else {
      tilesetLookup = await ggbgfx.imageToTilesetLookup(filename);
      imageBuildCache[img.id] = {
        data: tilesetLookup,
        timestamp: imageModifiedTime
      }
      uncachedCount++;
    }

    const tilesetLength = Object.keys(tilesetLookup).length;
    tilesetIndexes[i] = i;

    const backgroundWarnings = await getBackgroundWarnings(img, projectPath, tilesetLength);
    if (backgroundWarnings.length > 0) {
      backgroundWarnings.forEach((warning) => {
        warnings(`${img.filename}: ${warning}`)
      })
    }    

    tilesetLookups.push(tilesetLookup);
  }

  // If previous build generated the same images all unmodified
  // no need to recalculate image tiles and tile lookups,
  // just reuse last compile
  const ids = imgs.map((img) => img.id).join();
  if(uncachedCount === 0 && ids === lastOutputIds) {
    return lastOutput;
  }

  // Find smallest overlapping lookups
  for (let i = 0; i < imgs.length - 1; i++) {
    let minDiffLength = MAX_SIZE;
    let minLookup = null;
    let minIndex = null;

    for (let j = i + 1; j < imgs.length; j++) {
      const mergedLookup = await ggbgfx.mergeTileLookups([
        tilesetLookups[i],
        tilesetLookups[j],
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

  lastOutput = output;
  lastOutputIds = ids;

  return output;
};

export default compileImages;
