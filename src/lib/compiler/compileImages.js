import { assetFilename } from "../helpers/gbstudio";
import getFileModifiedTime from "../helpers/fs/getModifiedTime";
import { getBackgroundInfo } from "../helpers/validation";
import {
  mergeTileLookups,
  readFileToTilesDataArray,
  tileLookupToTileData,
  tileArrayToTileData,
  tilesAndLookupToTilemap,
  toTileLookup,
} from "../tiles/tileData";

const MAX_SIZE = 9999999999;
const MAX_TILESET_TILES = 16 * 12;

const imageBuildCache = {};

let lastOutput = null;
let lastOutputIds = "";

const compileImages = async (
  imgs,
  generate360Ids,
  projectPath,
  tmpPath,
  { warnings }
) => {
  const tilesetLookups = [];
  const tilesetIndexes = [];
  const imgTiles = [];
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

    const is360 = generate360Ids.includes(img.id);
    const cacheKey = `${img.id}${is360 ? "_360" : ""}`;

    if (
      imageBuildCache[cacheKey] &&
      imageBuildCache[cacheKey].timestamp >= imageModifiedTime
    ) {
      tilesetLookup = imageBuildCache[cacheKey].data;
      imgTiles.push(imageBuildCache[cacheKey].tileData);
    } else {
      const tileData = await readFileToTilesDataArray(filename);
      tilesetLookup = toTileLookup(tileData);
      imageBuildCache[cacheKey] = {
        data: tilesetLookup,
        tileData,
        timestamp: imageModifiedTime,
      };
      imgTiles.push(tileData);
      uncachedCount++;
    }

    const tilesetLength = Object.keys(tilesetLookup).length;
    tilesetIndexes[i] = i;

    const backgroundInfo = await getBackgroundInfo(
      img,
      is360,
      projectPath,
      tilesetLength
    );
    const backgroundWarnings = backgroundInfo.warnings;
    if (backgroundWarnings.length > 0) {
      backgroundWarnings.forEach((warning) => {
        warnings(`${img.filename}: ${warning}`);
      });
    }

    if (is360) {
      // Skip lookups for 360 images (generated later)
      tilesetLookups.push(null);
      continue;
    }
    tilesetLookups.push(tilesetLookup);
  }

  // If previous build generated the same images all unmodified
  // no need to recalculate image tiles and tile lookups,
  // just reuse last compile
  const ids = imgs.map((img) => img.id).join();
  if (uncachedCount === 0 && ids === lastOutputIds) {
    return lastOutput;
  }

  // Find smallest overlapping lookups
  for (let i = 0; i < imgs.length - 1; i++) {
    if (!tilesetLookups[i]) {
      continue;
    }
    let minDiffLength = MAX_SIZE;
    let minLookup = null;
    let minIndex = null;

    for (let j = i + 1; j < imgs.length; j++) {
      if (!tilesetLookups[j]) {
        continue;
      }

      const mergedLookup = mergeTileLookups([
        tilesetLookups[i],
        tilesetLookups[j],
      ]);

      const mergedLength = Object.keys(mergedLookup).length;
      const aLength = Object.keys(tilesetLookups[i]).length;
      const bLength = Object.keys(tilesetLookups[j]).length;

      const diffLength = mergedLength - Math.max(aLength, bLength);

      const maxAllowedDiff = Math.min(aLength, bLength) / 2;

      if (
        mergedLength <= MAX_TILESET_TILES &&
        diffLength < minDiffLength &&
        diffLength < maxAllowedDiff
      ) {
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
    if (generate360Ids.includes(imgs[i].id)) {
      // Generate 360 tiles
      output.tilesets[i] = tileArrayToTileData(imgTiles[i]);
    } else if (tilesetLookups[i]) {
      output.tilesets[i] = tileLookupToTileData(tilesetLookups[i]);
    }
  }

  for (let i = 0; i < imgs.length; i++) {
    if (generate360Ids.includes(imgs[i].id)) {
      // Generate 360 tilemap
      output.tilemaps[imgs[i].id] = Array.from(Array(360)).map((_, i) => i);
      output.tilemapsTileset[imgs[i].id] = i;
    } else {
      const tilemap = tilesAndLookupToTilemap(
        imgTiles[i],
        tilesetLookups[tilesetIndexes[i]]
      );
      output.tilemaps[imgs[i].id] = tilemap;
      output.tilemapsTileset[imgs[i].id] = tilesetIndexes[i];
    }
  }

  lastOutput = output;
  lastOutputIds = ids;

  return output;
};

export default compileImages;
