import { MetaspriteTile } from "store/features/entities/entitiesTypes";
import {
  cloneIndexedImage,
  flipIndexedImageX,
  flipIndexedImageY,
  ImageIndexFunction,
  IndexedImage,
  makeIndexedImage,
  readFileToIndexedImage,
  sliceIndexedImage,
  toIndex,
} from "../tiles/indexedImage";

const TILE_SIZE = 8;

export type OptimisedTile = {
  tile: number;
  flipX: boolean;
  flipY: boolean;
};

export type Position = { x: number; y: number };

export type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type SliceDef = {
  data: IndexedImage;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type TileLocation = {
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
};
export type SpriteTileLocation = TileLocation & {
  spriteIndex: number;
};

export type SpriteCluster = {
  minY: number;
  maxY: number;
  sprites: SliceDef[];
};

enum Color {
  Transparent = 0,
  Light = 1,
  Mid = 2,
  Dark = 3,
  Divider = 254,
  Unknown = 255,
}

export const spriteDataIndexFn: ImageIndexFunction = (r, g, b, _a) => {
  if ((g > 249 && r < 180 && b < 20) || (b >= 200 && g < 20)) {
    return Color.Transparent;
  } else if (g >= 205) {
    return Color.Light;
  } else if (g >= 130) {
    return Color.Mid;
  } else {
    return Color.Dark;
  }
};

export const spriteDataWithDividerIndexFn: ImageIndexFunction = (
  r,
  g,
  b,
  a
) => {
  if (b >= 200 && g < 20) {
    return Color.Divider;
  }
  return spriteDataIndexFn(r, g, b, a);
};

const removeIndexedImageMask = (
  inData: IndexedImage,
  maskData: IndexedImage,
  offsetX: number,
  offsetY: number
): IndexedImage => {
  const output = cloneIndexedImage(inData);
  const inWidth = inData.width;
  const inHeight = inData.height;

  for (let y = 0; y < inHeight; y++) {
    for (let x = 0; x < inWidth; x++) {
      const drawIndex = toIndex(x, y, inData);
      const maskIndex = toIndex(x + offsetX, y + offsetY, maskData);
      if (maskData.data[maskIndex] !== Color.Transparent) {
        output.data[drawIndex] = Color.Unknown;
      }
    }
  }

  return output;
};

const blitIndexedImageData = (
  canvasData: IndexedImage,
  inData: IndexedImage,
  offsetX: number,
  offsetY: number
): IndexedImage => {
  const output = cloneIndexedImage(canvasData);
  const drawWidth = inData.width;
  const drawHeight = inData.height;
  for (let y = 0; y < drawHeight; y++) {
    for (let x = 0; x < drawWidth; x++) {
      const drawIndex = toIndex(x, y, inData);
      if (inData.data[drawIndex] !== Color.Transparent) {
        const canvasIndex = toIndex(x + offsetX, y + offsetY, canvasData);
        output.data[canvasIndex] = inData.data[drawIndex];
      }
    }
  }

  return output;
};

const isIndexedImageEqual = (
  dataA: IndexedImage,
  dataB: IndexedImage
): boolean => {
  if (
    dataA.width !== dataB.width ||
    dataA.height !== dataB.height ||
    dataA.data.length !== dataB.data.length
  ) {
    return false;
  }
  for (let i = 0; i < dataA.data.length; i++) {
    if (
      dataA.data[i] !== dataB.data[i] &&
      dataA.data[i] !== Color.Unknown &&
      dataB.data[i] !== Color.Unknown
    ) {
      return false;
    }
  }
  return true;
};

const isIndexedImageStrictEqual = (
  dataA: IndexedImage,
  dataB: IndexedImage
): boolean => {
  if (
    dataA.width !== dataB.width ||
    dataA.height !== dataB.height ||
    dataA.data.length !== dataB.data.length
  ) {
    return false;
  }
  for (let i = 0; i < dataA.data.length; i++) {
    if (dataA.data[i] !== dataB.data[i]) {
      return false;
    }
  }
  return true;
};

const isBlankIndexedImage = (image: IndexedImage): boolean => {
  for (let i = 0; i < image.data.length; i++) {
    if (
      image.data[i] !== Color.Transparent &&
      image.data[i] !== Color.Unknown
    ) {
      return false;
    }
  }
  return true;
};

const fillIndexedImage = (
  inData: IndexedImage,
  startX: number,
  startY: number,
  width: number,
  height: number,
  value: number
): IndexedImage => {
  const output = cloneIndexedImage(inData);
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      const i = toIndex(x, y, inData);
      output.data[i] = value;
    }
  }
  return output;
};

const subtractData = (
  inData: IndexedImage,
  removeData: IndexedImage,
  offsetX: number,
  offsetY: number
): IndexedImage => {
  const output = cloneIndexedImage(inData);
  const width = removeData.width;
  const height = removeData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, y, removeData);
      const ii = toIndex(x + offsetX, y + offsetY, inData);
      if (removeData.data[i]) {
        output.data[ii] = Color.Unknown;
      } else {
        output.data[ii] = inData.data[ii];
      }
    }
  }
  return output;
};

const mergeIndexedImages = (
  dataA: IndexedImage,
  dataB: IndexedImage
): IndexedImage => {
  const output = cloneIndexedImage(dataA);
  for (let i = 0; i < output.data.length; i++) {
    if (output.data[i] === Color.Unknown) {
      output.data[i] = dataB.data[i];
    }
  }
  return output;
};

const indexedUnknownToTransparent = (inData: IndexedImage): IndexedImage => {
  const output = cloneIndexedImage(inData);
  for (let i = 0; i < output.data.length; i++) {
    if (output.data[i] === Color.Unknown) {
      output.data[i] = Color.Transparent;
    }
  }
  return output;
};

const isEquivalent = (dataA: IndexedImage, dataB: IndexedImage): boolean => {
  return (
    isEqualSize(dataA, dataB) &&
    (isIndexedImageEqual(dataA, dataB) ||
      isIndexedImageEqual(flipIndexedImageX(dataA), dataB) ||
      isIndexedImageEqual(flipIndexedImageY(dataA), dataB) ||
      isIndexedImageEqual(flipIndexedImageX(flipIndexedImageY(dataA)), dataB))
  );
};

const isEqualSize = (dataA: IndexedImage, dataB: IndexedImage): boolean => {
  return dataA.width === dataB.width && dataA.height === dataB.height;
};

const trimWhitespace = (inData: IndexedImage): SliceDef => {
  const width = inData.width;
  const height = inData.height;
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, y, inData);
      if (inData.data[i] > 0 && inData.data[i] < 10) {
        if (x < minX) {
          minX = x;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (y > maxY) {
          maxY = y;
        }
      }
    }
  }
  const sliceW = Math.max(0, maxX - minX + 1);
  const sliceH = Math.max(0, maxY - minY + 1);
  return {
    data: sliceIndexedImage(inData, minX, minY, sliceW, sliceH),
    coordinates: { x: minX, y: minY, width: sliceW, height: sliceH },
  };
};

const toNumNonEmptyTiles = (inData: IndexedImage): number => {
  let count = 0;
  const tW = 8;
  const tH = 16;
  const width = inData.width;
  const height = inData.height;
  const tileWidth = Math.ceil(width / tW);
  const tileHeight = Math.ceil(height / tH);
  for (let ty = 0; ty < tileHeight; ty++) {
    for (let tx = 0; tx < tileWidth; tx++) {
      let tileUsed = false;
      for (let px = 0; px < tW; px++) {
        for (let py = 0; py < tH; py++) {
          const i = toIndex(tx * tW + px, ty * tH + py, inData);
          if (inData.data[i] > 0 && inData.data[i] < 10) {
            tileUsed = true;
            break;
          }
        }
        if (tileUsed) {
          break;
        }
      }

      if (tileUsed) {
        count++;
      }
    }
  }
  return count;
};

const isContained = (dataA: IndexedImage, dataB: IndexedImage): boolean => {
  if (dataA.data.length !== dataB.data.length) {
    return false;
  }
  for (let i = 0; i < dataA.data.length; i++) {
    if (dataA.data[i] !== 0 && dataA.data[i] !== dataB.data[i]) {
      return false;
    }
  }
  return true;
};

export const optimiseTiles = async (
  filename: string,
  spriteWidth: number,
  spriteHeight: number,
  metasprites: MetaspriteTile[][]
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
    spriteDataIndexFn
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
        16
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
        spriteHeight - 16 - tileDef.y
      );

      mask = blitIndexedImageData(
        mask,
        slicedTile,
        spriteWidth / 2 - 8 + tileDef.x,
        spriteHeight - 16 - tileDef.y
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
          tile: ui * 2,
          flipX: false,
          flipY: false,
        };
        break;
      } else if (isIndexedImageEqual(tileFX, uniqTile)) {
        found = true;
        const id = tileIds[i];
        uniqTiles[ui] = mergeIndexedImages(uniqTile, tileFX);
        optimisedLookup2[id] = {
          tile: ui * 2,
          flipX: true,
          flipY: false,
        };
        break;
      } else if (isIndexedImageEqual(tileFY, uniqTile)) {
        found = true;
        const id = tileIds[i];
        uniqTiles[ui] = mergeIndexedImages(uniqTile, tileFY);
        optimisedLookup2[id] = {
          tile: ui * 2,
          flipX: false,
          flipY: true,
        };
        break;
      } else if (isIndexedImageEqual(tileFXY, uniqTile)) {
        found = true;
        const id = tileIds[i];
        uniqTiles[ui] = mergeIndexedImages(uniqTile, tileFXY);
        optimisedLookup2[id] = {
          tile: ui * 2,
          flipX: true,
          flipY: true,
        };
        break;
      }
    }

    if (!found) {
      const id = tileIds[i];
      optimisedLookup2[id] = {
        tile: uniqTiles.length * 2,
        flipX: false,
        flipY: false,
      };
      uniqTiles.push(tile);
    }
  }

  for (const tile of uniqTiles) {
    uniqTileData.push(
      indexedUnknownToTransparent(sliceIndexedImage(tile, 0, 0, 8, 8))
    );
    uniqTileData.push(
      indexedUnknownToTransparent(sliceIndexedImage(tile, 0, 8, 8, 8))
    );
  }

  return {
    tiles: uniqTileData,
    lookup: optimisedLookup2,
  };
};

// ------------

export const indexedImageToSprites = (data: IndexedImage): SliceDef[] => {
  const sprites = [];
  const tileSize = 2;
  const tileData = indexedImageToUsedTileImage(data, tileSize);
  const output: SliceDef[] = [];

  const boxes = indexedImageToBoundingBoxes(tileData).map((box) => {
    return {
      left: box.left * tileSize,
      right: (box.right + 1) * tileSize,
      top: box.top * tileSize,
      bottom: (box.bottom + 1) * tileSize,
    };
  });

  const snappedBoxes = boxes.map((box) => {
    const boxHeight = box.bottom - box.top;
    const roundedHeight = roundUp16(boxHeight);
    return {
      left: roundDown8(box.left),
      right: roundUp8(box.right),
      top: roundUp8(box.bottom) - roundedHeight,
      bottom: roundUp8(box.bottom),
    };
  });

  for (const bi in snappedBoxes) {
    const snappedBox = snappedBoxes[bi];
    const box = boxes[bi];
    const snappedWidth = snappedBox.right - snappedBox.left;
    const snappedHeight = snappedBox.bottom - snappedBox.top;

    let sc = sliceIndexedImage(
      data,
      snappedBox.left,
      snappedBox.top,
      snappedWidth,
      snappedHeight
    );
    const bl = box.left - snappedBox.left;
    const br = snappedBox.right - box.right;
    const bt = box.top - snappedBox.top;
    const bb = snappedBox.bottom - box.bottom;

    sc = fillIndexedImage(sc, 0, 0, bl, snappedHeight, 0);
    sc = fillIndexedImage(sc, snappedWidth - br, 0, br, snappedHeight, 0);
    sc = fillIndexedImage(sc, 0, 0, snappedWidth, bt, 0);
    sc = fillIndexedImage(sc, 0, snappedHeight - bb, snappedWidth, bb, 0);

    sprites.push(sc);

    output.push({
      data: sc,
      coordinates: {
        x: snappedBox.left,
        y: snappedBox.top,
        width: snappedWidth,
        height: snappedHeight,
      },
    });
  }

  return output;
};

const indexedImageToUsedTileImage = (
  inData: IndexedImage,
  tileSize: number
): IndexedImage => {
  const width = inData.width;
  const height = inData.height;

  const tileWidth = Math.ceil(width / tileSize);
  const tileHeight = Math.ceil(height / tileSize);

  const output = makeIndexedImage(tileWidth, tileHeight);

  let ii = 0;
  let dividerY = Infinity;
  for (let ty = 0; ty < tileHeight; ty++) {
    for (let tx = 0; tx < tileWidth; tx++) {
      let tileUsed = false;
      for (let px = 0; px < tileSize; px++) {
        for (let py = 0; py < tileSize; py++) {
          const i = toIndex(tx * tileSize + px, ty * tileSize + py, inData);
          if (inData.data[i] === Color.Divider) {
            dividerY = Math.min(dividerY, ty);
          }
          if (inData.data[i] > 0) {
            tileUsed = true;
            break;
          }
        }
        if (tileUsed) {
          break;
        }
      }
      output.data[ii] = tileUsed ? Color.Dark : Color.Transparent;
      ii++;
    }
  }

  if (dividerY !== Infinity) {
    // Fill below this line with Transparent
    return fillIndexedImage(
      output,
      0,
      dividerY,
      tileWidth,
      tileHeight - dividerY,
      Color.Transparent
    );
  }

  return output;
};

const indexedImageToBoundingBoxes = (inData: IndexedImage): Bounds[] => {
  const width = inData.width;
  const height = inData.height;
  const boxes: Bounds[] = [];
  const seen: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, y, inData);
      if (inData.data[i] !== 0 && seen.indexOf(i) === -1) {
        const bounds = findBoundingBoxAt(x, y, inData, seen);
        for (let xi = bounds.left; xi <= bounds.right; xi++) {
          for (let yi = bounds.top; yi <= bounds.bottom; yi++) {
            const ii = toIndex(xi, yi, inData);
            seen.push(ii);
          }
        }
        boxes.push(bounds);
      }
    }
  }
  return boxes;
};

const findBoundingBoxAt = (
  startX: number,
  startY: number,
  imageData: IndexedImage,
  seen: number[] = []
): Bounds => {
  const width = imageData.width;
  const height = imageData.height;

  const queue = [[startX, startY]];

  const bounds = {
    left: startX,
    right: startX,
    top: startY,
    bottom: startY,
  };

  const isConnected = (x: number, y: number): boolean => {
    const i = toIndex(x, y, imageData);
    return imageData.data[i] !== 0;
  };

  while (queue.length > 0) {
    const [x, y] = queue.pop() as number[];
    if (x < 0 || x >= width || y < 0 || y >= height) {
      continue;
    }

    const i = toIndex(x, y, imageData);
    if (seen.indexOf(i) === -1) {
      // Not seen this pixel
      seen.push(i);

      if (x < bounds.left) bounds.left = x;
      if (x > bounds.right) bounds.right = x;
      if (y < bounds.top) bounds.top = y;
      if (y > bounds.bottom) bounds.bottom = y;

      for (let xi = -1; xi <= 1; xi++) {
        for (let yi = -1; yi <= 1; yi++) {
          if (isConnected(x + xi, y + yi)) {
            queue.push([x + xi, y + yi]);
          }
        }
      }
    }
  }

  return bounds;
};

// Sprite Alignment -----------------------------------------------------

const spriteAlignmentOffset = (
  sprite: IndexedImage,
  baseSprite: IndexedImage
): Position => {
  type OffsetSimilarity = { tx: number; ty: number; similarity: number };

  const width = sprite.width;
  const height = sprite.height;
  const baseWidth = baseSprite.width;
  const tileWidth = Math.ceil(width / 8 / 2);
  const offsets: OffsetSimilarity[] = [];

  // For every tile offset
  const ty = 0;
  // for(let ty = -tileHeight; ty < tileHeight; ty += 1) {
  for (let tx = -tileWidth; tx < tileWidth; tx += 1) {
    let similarity = 0;
    // For every pixel in sprite
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = toIndex(x + tx * 8, y + ty * 8, sprite);
        const ii = toIndex(x, y, baseSprite);
        if (sprite.data[i] === baseSprite.data[ii]) {
          similarity++;
        }
      }
    }
    offsets.push({ tx, ty, similarity });
  }
  // }

  offsets.sort((a, b) => {
    if (a.similarity < b.similarity) {
      return 1;
    }
    if (a.similarity > b.similarity) {
      return -1;
    }
    return 0;
  });

  if (offsets[0]) {
    return {
      x: -offsets[0].tx * 8 - roundDown8(baseWidth / 2) + 8,
      y: -offsets[0].ty * 8,
    };
  }

  return {
    x: 0,
    y: 0,
  };
};

export const spriteAlignmentOffsets = (sprites: SliceDef[]): Position[] => {
  return sprites.map((s) => spriteAlignmentOffset(s.data, sprites[0].data));
};

// Hints ----------------------------------------------------------------------

const removeHint = (
  inData: IndexedImage,
  hintData: IndexedImage
): { data: IndexedImage; locations: TileLocation[] } => {
  const width = inData.width;
  const height = inData.height;
  const scanWidth = width;
  const scanHeight = height;
  const hintDataFX = flipIndexedImageX(hintData);
  const hintDataFY = flipIndexedImageY(hintData);
  const hintDataFXY = flipIndexedImageX(flipIndexedImageY(hintData));
  const locations: TileLocation[] = [];

  let data = cloneIndexedImage(inData);

  for (let y = 0; y <= scanHeight; y++) {
    for (let x = 0; x <= scanWidth; x++) {
      const subImage = sliceIndexedImage(data, x, y, 8, 16);
      if (isContained(hintData, subImage)) {
        data = subtractData(data, hintData, x, y);
        locations.push({ x, y, flipX: false, flipY: false });
      } else if (isContained(hintDataFX, subImage)) {
        data = subtractData(data, hintDataFX, x, y);
        locations.push({ x, y, flipX: true, flipY: false });
      } else if (isContained(hintDataFY, subImage)) {
        data = subtractData(data, hintDataFY, x, y);
        locations.push({ x, y, flipX: false, flipY: true });
      } else if (isContained(hintDataFXY, subImage)) {
        data = subtractData(data, hintDataFXY, x, y);
        locations.push({ x, y, flipX: true, flipY: true });
      }
    }
  }
  return {
    data,
    locations,
  };
};

export const autoHint2 = (inData: IndexedImage): SliceDef[] => {
  const hintDefs: SliceDef[] = [];
  const width = inData.width;
  const height = inData.height;
  const tileWidth = Math.ceil(width / 8);
  const tileHeight = Math.ceil(height / 8);
  // Merge horizontal
  for (let y = 0; y <= tileHeight - 2; y++) {
    for (let x = 0; x <= tileWidth - 2; x++) {
      const sliced = sliceIndexedImage(inData, x * 8, y * 8, 16, 16);
      const numTiles = toNumNonEmptyTiles(sliced);
      const trimmed = trimWhitespace(sliced);
      const trimmedNumTiles = toNumNonEmptyTiles(trimmed.data);
      if (trimmedNumTiles < numTiles) {
        const hint = sliceIndexedImage(trimmed.data, 0, 0, 8, 16);
        hintDefs.push({
          data: hint,
          coordinates: {
            x: x * 8 + trimmed.coordinates.x,
            y: y * 8 + trimmed.coordinates.y,
            width: 8,
            height: 16,
          },
        });
      }
    }
  }
  // Merge vertical
  for (let y = 0; y <= tileHeight - 4; y++) {
    for (let x = 0; x <= tileWidth - 1; x++) {
      const sliced = sliceIndexedImage(inData, x * 8, y * 8, 8, 32);
      const numTiles = toNumNonEmptyTiles(sliced);
      const trimmed = trimWhitespace(sliced);
      const trimmedNumTiles = toNumNonEmptyTiles(trimmed.data);
      if (trimmedNumTiles < numTiles) {
        const hint = sliceIndexedImage(trimmed.data, 0, 0, 8, 16);
        hintDefs.push({
          data: hint,
          coordinates: {
            x: x * 8 + trimmed.coordinates.x,
            y: y * 8 + trimmed.coordinates.y,
            width: 8,
            height: 16,
          },
        });
      }
    }
  }

  const dividerY = getHintDividerY(inData);

  if (dividerY) {
    for (let y = dividerY; y < height; y += 16) {
      for (let x = 0; x < width; x += 8) {
        const sliced = sliceIndexedImage(inData, x, y, 8, 16);
        if (!isBlankIndexedImage(sliced)) {
          hintDefs.push({
            data: sliced,
            coordinates: {
              x,
              y,
              width: 8,
              height: 16,
            },
          });
        }
      }
    }
  }

  const uniqDefs = uniqWith(hintDefs, (a, b) => {
    return isEquivalent(a.data, b.data);
  });

  return uniqDefs;
};

const getHintDividerY = (inData: IndexedImage): number => {
  const width = inData.width;
  const height = inData.height;
  for (let y = height - 1; y > 0; y--) {
    for (let x = 0; x <= width - 2; x++) {
      const i = toIndex(x, y, inData);
      if (inData.data[i] === Color.Divider) {
        return roundUp8(y);
      }
    }
  }
  return 0;
};

// Tile detection -----

export const spritesToTiles2 = (
  spriteDefs: SliceDef[],
  hintDefs: SliceDef[] = []
): {
  tileDefs: SliceDef[];
  spriteTileLocations: SpriteTileLocation[][];
} => {
  const locations: SpriteTileLocation[][] = [];
  const tileDefs: SliceDef[] = [];
  const hintRemovedSprites = [];

  // Remove hint tiles
  for (let si = 0; si < spriteDefs.length; si++) {
    const sprite = spriteDefs[si].data;
    let hintRemovedSprite = sprite;
    for (let ht = 0; ht < hintDefs.length; ht++) {
      const hintTile = hintDefs[ht].data;
      // for (const hintTile of hints) {
      const { data: dtmp, locations: loc } = removeHint(
        hintRemovedSprite,
        hintTile
      );
      if (!isIndexedImageStrictEqual(dtmp, hintRemovedSprite)) {
        const loc2: SpriteTileLocation[] = loc.map((tileLocation) => ({
          ...tileLocation,
          spriteIndex: si,
        }));
        let tileIndex = tileDefs.findIndex((t) => t.data === hintTile);
        if (tileIndex === -1) {
          tileIndex = tileDefs.length;
          tileDefs.push(hintDefs[ht]);
          locations.push(loc2);
        } else {
          locations[tileIndex] = ([] as SpriteTileLocation[]).concat(
            locations[tileIndex],
            loc2
          );
        }
        hintRemovedSprite = dtmp;
      }
    }
    hintRemovedSprites.push(hintRemovedSprite);
  }

  // Create remaining tiles
  for (let si = 0; si < hintRemovedSprites.length; si++) {
    const inData = hintRemovedSprites[si];
    const tileWidth = Math.max(inData.width / 8);
    const tileHeight = Math.max(inData.height / 16) + 1;
    for (let ty = 0; ty < tileHeight; ty++) {
      for (let tx = 0; tx < tileWidth; tx++) {
        const slice = sliceIndexedImage(inData, tx * 8, ty * 16, 8, 16);
        if (!isBlankIndexedImage(slice)) {
          let found = false;
          for (const tileDef of tileDefs) {
            const tile = tileDef.data;
            const sliceFX = flipIndexedImageX(slice);
            const sliceFY = flipIndexedImageY(slice);
            const sliceFXY = flipIndexedImageX(flipIndexedImageY(slice));
            if (isIndexedImageEqual(slice, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeIndexedImages(tile, slice);
              locations[tileIndex].push({
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: false,
                flipY: false,
              });
              break;
            } else if (isIndexedImageEqual(sliceFX, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeIndexedImages(tile, sliceFX);
              locations[tileIndex].push({
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: true,
                flipY: false,
              });
              break;
            } else if (isIndexedImageEqual(sliceFY, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeIndexedImages(tile, sliceFY);
              locations[tileIndex].push({
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: false,
                flipY: true,
              });
              break;
            } else if (isIndexedImageEqual(sliceFXY, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeIndexedImages(tile, sliceFXY);
              locations[tileIndex].push({
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: true,
                flipY: true,
              });
              break;
            }
          }
          if (!found) {
            locations.push([
              {
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: false,
                flipY: false,
              },
            ]);
            tileDefs.push({
              data: slice,
              coordinates: {
                x: spriteDefs[si].coordinates.x + tx * 8,
                y: spriteDefs[si].coordinates.y + ty * 16,
                width: 8,
                height: 16,
              },
            });
          }
        }
      }
    }
  }

  return {
    tileDefs,
    spriteTileLocations: locations,
  };
};

// ------------
// Cluster Detection

export const clusterSprites = (spriteDefs: SliceDef[]): SpriteCluster[] => {
  const clusters: SpriteCluster[] = [];

  if (spriteDefs.length === 0) {
    return clusters;
  }

  const sortedSpriteDefs = [...spriteDefs].sort((a, b) => {
    if (a.coordinates.y < b.coordinates.y) {
      return -1;
    }
    if (a.coordinates.y > b.coordinates.y) {
      return 1;
    }
    return 0;
  });

  for (const spriteDef of sortedSpriteDefs) {
    let clusterFound = false;
    for (const cluster of clusters) {
      if (
        rangeOverlap(
          cluster.minY,
          cluster.maxY,
          spriteDef.coordinates.y,
          spriteDef.coordinates.y + spriteDef.coordinates.height
        )
      ) {
        clusterFound = true;
        cluster.minY = Math.min(cluster.minY, spriteDef.coordinates.y);
        cluster.maxY = Math.max(
          cluster.maxY,
          spriteDef.coordinates.y + spriteDef.coordinates.height
        );
        cluster.sprites.push(spriteDef);
        break;
      }
    }
    if (!clusterFound) {
      clusters.push({
        minY: spriteDef.coordinates.y,
        maxY: spriteDef.coordinates.y + spriteDef.coordinates.height,
        sprites: [spriteDef],
      });
    }
  }

  // Merge any overlapping clusters
  const mergedClusters = clusters.reduce((memo, cluster) => {
    let overlap = false;
    for (const otherCluster of memo) {
      if (
        rangeOverlap(
          cluster.minY,
          cluster.maxY,
          otherCluster.minY,
          otherCluster.maxY
        )
      ) {
        // Merge
        otherCluster.minY = Math.min(cluster.minY, otherCluster.minY);
        otherCluster.maxY = Math.max(cluster.maxY, otherCluster.maxY);
        otherCluster.sprites = otherCluster.sprites.concat(cluster.sprites);
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      memo.push(cluster);
    }

    return memo;
  }, [] as SpriteCluster[]);

  return mergedClusters;
};

const rangeOverlap = (minA: number, maxA: number, minB: number, maxB: number) =>
  minA < maxB && maxA > minB;

// ------------
// To 2bpp

export const indexedImageTo2bppSpriteData = (
  image: IndexedImage
): Uint8Array => {
  const output = new Uint8Array(roundUp8((image.width * image.height) / 4));
  let i = 0;
  for (let y = 0; y < 8; y++) {
    let row1 = "";
    let row2 = "";
    for (let x = 0; x < 8; x++) {
      const index = toIndex(x, y, image);
      const binary = bin2(image.data[index]);
      row1 += binary[1];
      row2 += binary[0];
    }
    output[i] = binDec(row1);
    i++;
    output[i] = binDec(row2);
    i++;
  }

  return output;
};

/**
 * Read an image filename into a GB 2bpp data array
 * @param filename Tiles image filename
 * @returns Uint8Array of 2bpp tile data
 */
export const readFileToSpriteTilesData = async (
  filename: string
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
          TILE_SIZE
        )
      );
      output.set(tileData, index);
      index += tileData.length;
    }
  }
  return output;
};

// ------------

export const roundDown8 = (v: number): number => Math.floor(v / 8) * 8;
export const roundUp16 = (x: number): number => Math.ceil(x / 16) * 16;
export const roundUp8 = (x: number): number => Math.ceil(x / 8) * 8;

const uniqWith = <T extends unknown>(
  arr: T[],
  comparator: (a: T, b: T) => boolean
) => {
  const uniques = [];
  for (const a of arr) {
    if (uniques.findIndex((u) => comparator(a, u)) === -1) {
      uniques.push(a);
    }
  }
  return uniques;
};

const bin2 = (value: Color) => value.toString(2).padStart(2, "0");
const binDec = (binary: string) => parseInt(binary, 2);
