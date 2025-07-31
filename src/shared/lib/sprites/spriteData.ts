import {
  cloneIndexedImage,
  ImageIndexFunction,
  IndexedImage,
  toIndex,
} from "shared/lib/tiles/indexedImage";

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
  if ((g > 249 && r < 180 && b < 20) || (b >= 200 && g < 20) || _a < 200) {
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
  a,
) => {
  if (b >= 200 && g < 20) {
    return Color.Divider;
  }
  return spriteDataIndexFn(r, g, b, a);
};

export const removeIndexedImageMask = (
  inData: IndexedImage,
  maskData: IndexedImage,
  offsetX: number,
  offsetY: number,
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

export const blitIndexedImageData = (
  canvasData: IndexedImage,
  inData: IndexedImage,
  offsetX: number,
  offsetY: number,
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

export const isIndexedImageEqual = (
  dataA: IndexedImage,
  dataB: IndexedImage,
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

export const isBlankIndexedImage = (image: IndexedImage): boolean => {
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

export const mergeIndexedImages = (
  dataA: IndexedImage,
  dataB: IndexedImage,
): IndexedImage => {
  const output = cloneIndexedImage(dataA);
  for (let i = 0; i < output.data.length; i++) {
    if (output.data[i] === Color.Unknown) {
      output.data[i] = dataB.data[i];
    }
  }
  return output;
};

export const indexedUnknownToTransparent = (
  inData: IndexedImage,
): IndexedImage => {
  const output = cloneIndexedImage(inData);
  for (let i = 0; i < output.data.length; i++) {
    if (output.data[i] === Color.Unknown) {
      output.data[i] = Color.Transparent;
    }
  }
  return output;
};

// ------------
// To 2bpp

export const indexedImageTo2bppSpriteData = (
  image: IndexedImage,
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

// ------------

export const roundDown8 = (v: number): number => Math.floor(v / 8) * 8;
export const roundUp16 = (x: number): number => Math.ceil(x / 16) * 16;
export const roundUp8 = (x: number): number => Math.ceil(x / 8) * 8;

const bin2 = (value: Color) => value.toString(2).padStart(2, "0");
const binDec = (binary: string) => parseInt(binary, 2);
