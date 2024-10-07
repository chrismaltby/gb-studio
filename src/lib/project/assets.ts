import Path from "path";
import sizeOf from "image-size";
import { promisify } from "util";
import { sliceIndexedImage, toIndex } from "shared/lib/tiles/indexedImage";
import { readFileToIndexedImage } from "lib/tiles/readFileToTiles";
import { Static, TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { readJson } from "lib/helpers/fs/readJson";

export type AssetFolder =
  | "backgrounds"
  | "fonts"
  | "music"
  | "sprites"
  | "sounds";

export const sizeOfAsync = promisify(sizeOf);

export const potentialAssetFolders = async (
  filename: string
): Promise<AssetFolder[]> => {
  const ext = Path.extname(filename.toLowerCase());

  if (ext === ".uge" || ext === ".mod") {
    return ["music"];
  }

  if (ext === ".wav" || ext === ".vgm" || ext === ".sav") {
    return ["sounds"];
  }

  if (ext !== ".png") {
    return [];
  }

  const folders: AssetFolder[] = [];

  const size = await sizeOfAsync(filename);
  if (!size || !size.width || !size.height) {
    return [];
  }

  if (size.width % 8 !== 0 && size.height % 8 !== 0) {
    // Images must be multiples of 8 in dimension
    return [];
  }

  if (size.width > 2040 || size.height > 2040) {
    // Image is too large
    return [];
  }

  const imageData = await readFileToIndexedImage(filename, (r, g, b) => {
    // Blue divider
    if (b >= 200 && g < 20) {
      return 0;
    }
    // Green or Magenta transparent color
    if ((g > 249 && r < 180 && b < 20) || (r > 249 && b > 249)) {
      return 0;
    }
    return 1;
  });

  let hasTransparency = false;
  for (let i = 0; i < imageData.data.length; i++) {
    if (!imageData.data[i]) {
      hasTransparency = true;
      break;
    }
  }

  // Is Sprite?
  if (hasTransparency) {
    folders.push("sprites");
  }

  // Is Background?
  if (size.width >= 160 && size.height >= 144 && !hasTransparency) {
    folders.push("backgrounds");
  }

  // Is Font?
  if (size.width === 128) {
    if (!hasTransparency) {
      folders.push("fonts");
    } else {
      // Check each tile has either a pixel in top left or is fully transparent
      const tilesX = size.width / 8;
      const tilesY = size.height / 8;
      let isFont = true;
      for (let ty = 0; ty < tilesY && isFont; ty++) {
        for (let tx = 0; tx < tilesX && isFont; tx++) {
          const topLeftPixelIndex = toIndex(tx * 8, ty * 8, imageData);
          const topLeftPixel = imageData.data[topLeftPixelIndex];
          if (topLeftPixel) {
            // Tile tx,ty is okay
            continue;
          }
          // Check if tile is fully transparent
          const tileData = sliceIndexedImage(imageData, tx * 8, ty * 8, 8, 8);
          for (let i = 0; i < tileData.data.length; i++) {
            if (tileData.data[i]) {
              isFont = false;
              break;
            }
          }
        }
      }
      if (isFont) {
        folders.push("fonts");
      }
    }
  }

  return folders;
};

export const getAssetResource = async <T extends TSchema>(
  resourceType: T,
  filename: string
): Promise<Static<T> | undefined> => {
  let resource: Static<T> | undefined = undefined;

  try {
    const resourcePath = filename + ".gbsres";
    const resourceData = await readJson(resourcePath);

    if (Value.Check(resourceType, resourceData)) {
      resource = resourceData;
    }
  } catch (e) {
    console.log("No .gbsres exists yet for file: " + filename);
  }

  return resource;
};
