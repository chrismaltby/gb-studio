import {
  BackgroundResource,
  CompressedBackgroundResource,
  CompressedProjectResources,
  CompressedSceneResourceWithChildren,
  ProjectResources,
  SceneResource,
  TilesetResource,
  CompressedTilesetResource,
} from "shared/lib/resources/types";
import { pruneTilemapLayersTilesets } from "shared/lib/tiles/sceneTilemapData";

export const compress8bitNumberArray = (arr: number[] | undefined): string => {
  if (!arr) {
    return "";
  }
  let lastValue = -1;
  let output = "";
  let count = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== lastValue) {
      if (count === 1) {
        output += "!";
      } else if (count > 0) {
        output += `${count.toString(16)}+`;
      }
      count = 0;
      lastValue = arr[i];
      output += (lastValue % 256).toString(16).padStart(2, "0");
    }
    count++;
  }
  if (count === 1) {
    output += "!";
  } else if (count > 0) {
    output += `${count.toString(16)}+`;
  }

  return output;
};

export const decompress8bitNumberString = (str: string): number[] => {
  const arr: number[] = [];
  let i = 0;
  while (i < str.length) {
    // Read the value
    const value = parseInt(str.slice(i, i + 2), 16);
    i += 2;
    let count = 1;
    if (i < str.length) {
      if (str[i] === "!") {
        // Single occurrence
        count = 1;
        i++;
      } else {
        // Read the count
        const countStart = i;
        const countEnd = str.indexOf("+", countStart);
        if (countStart === countEnd || countEnd === -1) {
          // No count or no end of count marker found - string was invalid
          return [];
        }
        count = parseInt(str.slice(countStart, countEnd), 16);
        i = countEnd + 1;
      }
    } else {
      // value was missing count / markers - string was invalid
      return [];
    }
    // Add the value `count` times to the array
    for (let j = 0; j < count; j++) {
      arr.push(value);
    }
  }
  return arr;
};

export const compressNumberArray = (arr: number[] | undefined): string => {
  if (!arr?.length) {
    return "";
  }
  let lastValue = 0;
  let hasLastValue = false;
  let output = "";
  let count = 0;

  for (const value of arr) {
    if (!hasLastValue || value !== lastValue) {
      if (hasLastValue) {
        if (output) {
          output += ";";
        }
        output += lastValue.toString(36);
        if (count > 1) {
          output += `:${count.toString(36)}`;
        }
      }
      lastValue = value;
      hasLastValue = true;
      count = 0;
    }
    count++;
  }

  if (hasLastValue) {
    if (output) {
      output += ";";
    }
    output += lastValue.toString(36);
    if (count > 1) {
      output += `:${count.toString(36)}`;
    }
  }

  return output;
};

export const decompressNumberString = (str: string): number[] => {
  if (!str) {
    return [];
  }
  const arr: number[] = [];
  for (const part of str.split(";")) {
    const pieces = part.split(":");
    if (pieces.length > 2 || pieces[0] === "") {
      return [];
    }
    const value = Number.parseInt(pieces[0], 36);
    const count = pieces.length === 1 ? 1 : Number.parseInt(pieces[1], 36);
    if (
      !Number.isSafeInteger(value) ||
      !Number.isSafeInteger(count) ||
      count < 1
    ) {
      return [];
    }
    for (let j = 0; j < count; j++) {
      arr.push(value);
    }
  }
  return arr;
};

const decompressSceneResource = (
  scene: CompressedSceneResourceWithChildren,
): SceneResource => {
  return {
    ...scene,
    collisions: decompress8bitNumberString(scene.collisions),
    tilemap: scene.tilemap
      ? {
          ...scene.tilemap,
          tileColors: scene.tilemap.tileColors
            ? decompress8bitNumberString(scene.tilemap.tileColors)
            : undefined,
          layers: scene.tilemap.layers.map((layer) => ({
            ...layer,
            tiles: decompressNumberString(layer.tiles),
            autotiles: layer.autotiles
              ? decompressNumberString(layer.autotiles)
              : undefined,
          })),
        }
      : undefined,
  };
};

const decompressBackgroundResource = (
  background: CompressedBackgroundResource,
): BackgroundResource => {
  return {
    ...background,
    tileColors: decompress8bitNumberString(background.tileColors),
  };
};

const decompressTilesetResource = (
  tileset: CompressedTilesetResource,
): TilesetResource => ({
  ...tileset,
  tileColors: tileset.tileColors
    ? decompressNumberString(tileset.tileColors)
    : [],
  tileCollisions: tileset.tileCollisions
    ? decompressNumberString(tileset.tileCollisions)
    : [],
});

export const decompressProjectResources = (
  compressedResources: CompressedProjectResources,
): ProjectResources => {
  return {
    ...compressedResources,
    scenes: compressedResources.scenes.map(decompressSceneResource),
    backgrounds: compressedResources.backgrounds.map(
      decompressBackgroundResource,
    ),
    tilesets: compressedResources.tilesets.map(decompressTilesetResource),
  };
};

export const compressSceneResource = (
  scene: SceneResource,
): CompressedSceneResourceWithChildren => {
  const tilemap = scene.tilemap
    ? pruneTilemapLayersTilesets(scene.tilemap)
    : undefined;
  return {
    ...scene,
    collisions: compress8bitNumberArray(scene.collisions),
    tilemap: tilemap
      ? {
          ...tilemap,
          tileColors: tilemap.tileColors
            ? compress8bitNumberArray(tilemap.tileColors)
            : undefined,
          layers: tilemap.layers.map((layer) => ({
            ...layer,
            tiles: compressNumberArray(layer.tiles),
            autotiles: layer.autotiles
              ? compressNumberArray(layer.autotiles)
              : undefined,
          })),
        }
      : undefined,
  };
};

export const compressBackgroundResource = (
  background: BackgroundResource,
): CompressedBackgroundResource => {
  return {
    ...background,
    tileColors: compress8bitNumberArray(background.tileColors),
  };
};

export const compressTilesetResource = (
  tileset: TilesetResource,
): CompressedTilesetResource => ({
  ...tileset,
  tileColors: compressNumberArray(tileset.tileColors),
  tileCollisions: compressNumberArray(tileset.tileCollisions),
});

export const compressProjectResources = (
  resources: ProjectResources,
): CompressedProjectResources => {
  return {
    ...resources,
    scenes: resources.scenes.map(compressSceneResource),
    backgrounds: resources.backgrounds.map(compressBackgroundResource),
    tilesets: resources.tilesets.map(compressTilesetResource),
  };
};
