// import uniqWith from "lodash/uniqWith";

export type Position = { x: number; y: number };
export type SliceDef = {
  data: Uint16Array;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
export type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
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

// imgdata.js -----------------------------------------------------------------

export const imageToData = (img: ImageBitmap): Uint16Array => {
  const data = new Uint16Array(2 + img.width * img.height);
  data[0] = img.width;
  data[1] = img.height;

  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return data;
  }
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let ii = 2;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 1] >= 249) {
      data[ii] = 0;
    } else if (imageData.data[i + 1] > 200) {
      data[ii] = 1;
    } else if (imageData.data[i + 1] > 100) {
      data[ii] = 2;
    } else {
      data[ii] = 3;
    }
    ii++;
  }

  return data;
};

const sliceData = (
  inData: Uint16Array,
  startX: number,
  startY: number,
  width: number,
  height: number
): Uint16Array => {
  const inWidth = inData[0];
  const inHeight = inData[1];
  const data = new Uint16Array(2 + width * height);

  data[0] = width;
  data[1] = height;

  let ii = 2;
  for (var y = startY; y < startY + height; y++) {
    for (var x = startX; x < startX + width; x++) {
      if (x < inWidth && y < inHeight && x >= 0 && y >= 0) {
        const i = toIndex(x, y, inWidth);
        data[ii] = inData[i];
      } else {
        data[ii] = 0;
      }
      ii++;
    }
  }
  return data;
};

const flipX = (inData: Uint16Array): Uint16Array => {
  const width = inData[0];
  const height = inData[1];

  const data = new Uint16Array(2 + width * height);
  data[0] = width;
  data[1] = height;

  let ii = 2;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      const i = toIndex(width - x - 1, y, width);
      data[ii] = inData[i];
      ii++;
    }
  }
  return data;
};

const flipY = (inData: Uint16Array): Uint16Array => {
  const width = inData[0];
  const height = inData[1];

  const data = new Uint16Array(2 + width * height);
  data[0] = width;
  data[1] = height;

  let ii = 2;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      const i = toIndex(x, height - y - 1, width);
      data[ii] = inData[i];
      ii++;
    }
  }
  return data;
};

const subtractData = (
  inData: Uint16Array,
  removeData: Uint16Array,
  offsetX: number,
  offsetY: number
): Uint16Array => {
  const width = removeData[0];
  const height = removeData[1];
  const data = new Uint16Array(inData);
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      const i = toIndex(x, y, width);
      const ii = toIndex(x + offsetX, y + offsetY, inData[0]);
      if (removeData[i]) {
        data[ii] = -1;
      } else {
        data[ii] = inData[ii];
      }
    }
  }
  return data;
};

const fillData = (
  inData: Uint16Array,
  startX: number,
  startY: number,
  width: number,
  height: number,
  value: number
): Uint16Array => {
  const inWidth = inData[0];
  const data = new Uint16Array(inData);
  for (var y = startY; y < startY + height; y++) {
    for (var x = startX; x < startX + width; x++) {
      const i = toIndex(x, y, inWidth);
      data[i] = value;
    }
  }
  return data;
};

const isBlankData = (data: Uint16Array): boolean => {
  for (let i = 2; i < data.length; i++) {
    if (data[i] !== 0 && data[i] !== -1) {
      return false;
    }
  }
  return true;
};

const pixelCount = (data: Uint16Array): number => {
  let count = 0;
  for (let i = 2; i < data.length; i++) {
    if (data[i] !== 0 && data[i] !== -1) {
      count++;
    }
  }
  return count;
};

const unknownToTransparent = (inData: Uint16Array): Uint16Array => {
  const data = new Uint16Array(inData);
  for (let i = 2; i < data.length; i++) {
    if (data[i] === -1) {
      data[i] = 0;
    }
  }
  return data;
};

const isEquivalent = (dataA: Uint16Array, dataB: Uint16Array): boolean => {
  return (
    isEqualSize(dataA, dataB) &&
    (isEqual(dataA, dataB) ||
      isEqual(flipX(dataA), dataB) ||
      isEqual(flipY(dataA), dataB) ||
      isEqual(flipX(flipY(dataA)), dataB))
  );
};

const isContainedWithin = (dataA: Uint16Array, dataB: Uint16Array): boolean => {
  return (
    isEqualSize(dataA, dataB) &&
    (isContained(dataA, dataB) ||
      isContained(flipX(dataA), dataB) ||
      isContained(flipY(dataA), dataB) ||
      isContained(flipX(flipY(dataA)), dataB))
  );
};

const isEqualSize = (dataA: Uint16Array, dataB: Uint16Array): boolean => {
  return dataA[0] === dataB[0] && dataA[1] === dataB[1];
};

const isEqual = (dataA: Uint16Array, dataB: Uint16Array): boolean => {
  if (dataA.length !== dataB.length) {
    return false;
  }
  for (let i = 0; i < dataA.length; i++) {
    if (dataA[i] !== dataB[i] && dataA[i] !== -1 && dataB[i] !== -1) {
      return false;
    }
  }
  return true;
};

const mergeData = (dataA: Uint16Array, dataB: Uint16Array): Uint16Array => {
  const data = new Uint16Array(dataA);
  for (let i = 0; i < dataA.length; i++) {
    if (dataA[i] === -1) {
      data[i] = dataB[i];
    }
  }
  return data;
};

const isStrictEqual = (dataA: Uint16Array, dataB: Uint16Array): boolean => {
  if (dataA.length !== dataB.length) {
    return false;
  }
  for (let i = 0; i < dataA.length; i++) {
    if (dataA[i] !== dataB[i]) {
      return false;
    }
  }
  return true;
};

const isContained = (dataA: Uint16Array, dataB: Uint16Array): boolean => {
  if (dataA.length !== dataB.length) {
    return false;
  }
  for (let i = 2; i < dataA.length; i++) {
    if (dataA[i] !== 0 && dataA[i] !== dataB[i]) {
      return false;
    }
  }
  return true;
};

const trimWhitespace = (inData: Uint16Array): SliceDef => {
  const width = inData[0];
  const height = inData[1];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, y, width);
      if (inData[i] > 0) {
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
    data: sliceData(inData, minX, minY, sliceW, sliceH),
    coordinates: { x: minX, y: minY, width: sliceW, height: sliceH },
  };
};

const numPixels = (data: Uint16Array): number => {
  let count = 0;
  for (let i = 2; i < data.length; i++) {
    if (data[i] > 0) {
      count++;
    }
  }
  return count;
};

const toArea = (inData: Uint16Array): number => {
  const width = inData[0];
  const height = inData[1];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, y, width);
      if (inData[i] > 0) {
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
  const sliceW = maxX - minX + 1;
  const sliceH = maxY - minY + 1;
  return sliceW * sliceH;
};

const toNumTiles = (inData: Uint16Array): number => {
  const width = inData[0];
  const height = inData[1];
  const tileWidth = Math.ceil(width / 8);
  const tileHeight = Math.ceil(height / 16);
  return tileWidth * tileHeight;
};

const toNumNonEmptyTiles = (inData: Uint16Array): number => {
  let count = 0;
  const tW = 8;
  const tH = 16;
  const width = inData[0];
  const height = inData[1];
  const tileWidth = Math.ceil(width / tW);
  const tileHeight = Math.ceil(height / tH);
  for (let ty = 0; ty < tileHeight; ty++) {
    for (let tx = 0; tx < tileWidth; tx++) {
      let tileUsed = false;
      for (let px = 0; px < tW; px++) {
        for (let py = 0; py < tH; py++) {
          const i = toIndex(tx * tW + px, ty * tH + py, width);
          if (inData[i] > 0) {
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

const imageToTiles = (inData: Uint16Array): Uint16Array[] => {
  const tiles: Uint16Array[] = [];
  const tW = 8;
  const tH = 16;
  const width = inData[0];
  const height = inData[1];
  const tileWidth = Math.ceil(width / tW);
  const tileHeight = Math.ceil(height / tH);
  for (let ty = 0; ty < tileHeight; ty++) {
    for (let tx = 0; tx < tileWidth; tx++) {
      const tile = sliceData(inData, tW * tx, tH * ty, tW, tH);
      if (!isBlankData(tile)) {
        tiles.push(tile);
      }
    }
  }
  return tiles;
};

const toIndex = (x: number, y: number, width: number): number =>
  2 + (x + y * width);

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
      if (!isStrictEqual(dtmp, hintRemovedSprite)) {
        let loc2: SpriteTileLocation[] = loc.map((tileLocation) => ({
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
    const tileWidth = Math.max(inData[0] / 8);
    const tileHeight = Math.max(inData[1] / 16) + 1;
    for (let ty = 0; ty < tileHeight; ty++) {
      for (let tx = 0; tx < tileWidth; tx++) {
        const slice = sliceData(inData, tx * 8, ty * 16, 8, 16);
        if (!isBlankData(slice)) {
          let found = false;
          for (let tileDef of tileDefs) {
            const tile = tileDef.data;
            const sliceFX = flipX(slice);
            const sliceFY = flipY(slice);
            const sliceFXY = flipX(flipY(slice));
            if (isEqual(slice, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeData(tile, slice);
              locations[tileIndex].push({
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: false,
                flipY: false,
              });
              break;
            } else if (isEqual(sliceFX, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeData(tile, sliceFX);
              locations[tileIndex].push({
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: true,
                flipY: false,
              });
              break;
            } else if (isEqual(sliceFY, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeData(tile, sliceFY);
              locations[tileIndex].push({
                spriteIndex: si,
                x: tx * 8,
                y: ty * 16,
                flipX: false,
                flipY: true,
              });
              break;
            } else if (isEqual(sliceFXY, tile)) {
              found = true;
              const tileIndex = tileDefs.findIndex((t) => t.data === tile);
              tileDefs[tileIndex].data = mergeData(tile, sliceFXY);
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

// spriteDetection.js ---------------------------------------------------------

export const dataToSprites = (data: Uint16Array): SliceDef[] => {
  const sprites = [];
  const tileSize = 2;
  const tileData = imageToTileData(data, tileSize);
  const output: SliceDef[] = [];

  const boxes = dataToBoundingBoxes(tileData).map((box) => {
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
      left: snapDown8(box.left),
      right: snapUp8(box.right),
      top: snapUp8(box.bottom) - roundedHeight,
      bottom: snapUp8(box.bottom),
    };
  });

  for (const bi in snappedBoxes) {
    const snappedBox = snappedBoxes[bi];
    const box = boxes[bi];
    const snappedWidth = snappedBox.right - snappedBox.left;
    const snappedHeight = snappedBox.bottom - snappedBox.top;

    let sc = sliceData(
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

    sc = fillData(sc, 0, 0, bl, snappedHeight, 0);
    sc = fillData(sc, snappedWidth - br, 0, br, snappedHeight, 0);
    sc = fillData(sc, 0, 0, snappedWidth, bt, 0);
    sc = fillData(sc, 0, snappedHeight - bb, snappedWidth, bb, 0);

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

const snapDown8 = (v: number): number => 8 * Math.floor(v / 8);
const snapUp8 = (v: number): number => 8 * Math.ceil(v / 8);
export const roundUp16 = (x: number): number => Math.ceil(x / 16) * 16;
export const roundUp8 = (x: number): number => Math.ceil(x / 8) * 8;

const imageToTileData = (inData: Uint16Array, tileSize: number) => {
  const width = inData[0];
  const height = inData[1];

  const tileWidth = Math.ceil(width / tileSize);
  const tileHeight = Math.ceil(height / tileSize);

  const data = new Uint16Array(2 + tileWidth * tileHeight);
  data[0] = tileWidth;
  data[1] = tileHeight;

  let ii = 2;
  for (let ty = 0; ty < tileHeight; ty++) {
    for (let tx = 0; tx < tileWidth; tx++) {
      let tileUsed = false;
      for (let px = 0; px < tileSize; px++) {
        for (let py = 0; py < tileSize; py++) {
          const i = toIndex(tx * tileSize + px, ty * tileSize + py, width);
          if (inData[i] > 0) {
            tileUsed = true;
            break;
          }
        }
        if (tileUsed) {
          break;
        }
      }
      //   data.push(tileUsed ? 3 : 0);
      data[ii] = tileUsed ? 3 : 0;
      ii++;
    }
  }
  return data;
};

const dataToBoundingBoxes = (data: Uint16Array): Bounds[] => {
  const width = data[0];
  const height = data[1];
  const boxes: Bounds[] = [];
  const seen: number[] = [];
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      const i = toIndex(x, y, width);
      if (data[i] !== 0 && seen.indexOf(i) === -1) {
        const bounds = findBoundingBoxAt(x, y, data, seen);
        for (var xi = bounds.left; xi <= bounds.right; xi++) {
          for (var yi = bounds.top; yi <= bounds.bottom; yi++) {
            const ii = toIndex(xi, yi, width);
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
  imageData: Uint16Array,
  seen: number[] = []
): Bounds => {
  const width = imageData[0];
  const height = imageData[1];

  const queue = [[startX, startY]];

  const bounds = {
    left: startX,
    right: startX,
    top: startY,
    bottom: startY,
  };

  const isConnected = (x: number, y: number): boolean => {
    const i = toIndex(x, y, width);
    return imageData[i] !== 0;
  };

  while (queue.length > 0) {
    const [x, y] = queue.pop() as number[];
    if (x < 0 || x >= width || y < 0 || y >= height) {
      continue;
    }

    const i = toIndex(x, y, width);
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

// Helpers ------------------------------------------------------------------

const uniqWith = <T extends {}>(
  arr: T[],
  comparator: (a: T, b: T) => boolean
) => {
  let uniques = [];
  for (let a of arr) {
    if (uniques.findIndex((u) => comparator(a, u)) === -1) {
      uniques.push(a);
    }
  }
  return uniques;
};

// Sprite Alignment -----------------------------------------------------

const spriteAlignmentOffset = (
  sprite: Uint16Array,
  baseSprite: Uint16Array
): Position => {
  type OffsetSimilarity = { tx: number; ty: number; similarity: number };

  const width = sprite[0];
  const height = sprite[1];
  const baseWidth = baseSprite[0];
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
        const i = toIndex(x + tx * 8, y + ty * 8, width);
        const ii = toIndex(x, y, baseWidth);
        if (sprite[i] === baseSprite[ii]) {
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
      x: -offsets[0].tx * 8 - snapDown8(baseWidth / 2) + 8,
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
  inData: Uint16Array,
  hintData: Uint16Array
): { data: Uint16Array; locations: TileLocation[] } => {
  const width = inData[0];
  const height = inData[1];
  const scanWidth = width;
  const scanHeight = height;
  const hintDataFX = flipX(hintData);
  const hintDataFY = flipY(hintData);
  const hintDataFXY = flipX(flipY(hintData));
  const locations: TileLocation[] = [];

  let data = new Uint16Array(inData);
  for (var y = 0; y <= scanHeight; y++) {
    for (var x = 0; x <= scanWidth; x++) {
      const subImage = sliceData(data, x, y, 8, 16);
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

export const autoHint2 = (inData: Uint16Array): SliceDef[] => {
  const hintDefs: SliceDef[] = [];
  const width = inData[0];
  const height = inData[1];
  const tileWidth = Math.ceil(width / 8);
  const tileHeight = Math.ceil(height / 8);
  // Merge horizontal
  for (var y = 0; y <= tileHeight - 2; y++) {
    for (var x = 0; x <= tileWidth - 2; x++) {
      const sliced = sliceData(inData, x * 8, y * 8, 16, 16);
      const numTiles = toNumNonEmptyTiles(sliced);
      const trimmed = trimWhitespace(sliced);
      const trimmedNumTiles = toNumNonEmptyTiles(trimmed.data);
      if (trimmedNumTiles < numTiles) {
        const hint = sliceData(trimmed.data, 0, 0, 8, 16);
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
  for (var y = 0; y <= tileHeight - 4; y++) {
    for (var x = 0; x <= tileWidth - 1; x++) {
      const sliced = sliceData(inData, x * 8, y * 8, 8, 32);
      const numTiles = toNumNonEmptyTiles(sliced);
      const trimmed = trimWhitespace(sliced);
      const trimmedNumTiles = toNumNonEmptyTiles(trimmed.data);
      if (trimmedNumTiles < numTiles) {
        const hint = sliceData(trimmed.data, 0, 0, 8, 16);
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

  const uniqDefs = uniqWith(hintDefs, (a, b) => {
    return isEquivalent(a.data, b.data);
  });

  return uniqDefs;
};
