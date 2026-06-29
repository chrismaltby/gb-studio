import {
  TILE_COLOR_PROP_FLIP_VERTICAL,
  TILE_COLOR_PROP_FLIP_HORIZONTAL,
  TILE_SIZE,
} from "consts";
import {
  IndexedImage,
  indexedImageTo2bppTileData,
  sliceIndexedImage,
} from "shared/lib/tiles/indexedImage";
import { TileLookup, hashTileData } from "shared/lib/tiles/tileData";

interface AutoFlipResult {
  tileData: Uint8Array[];
  tileAttrs: number[];
  tilesetData: Uint8Array[];
}

const reverseByte = (value: number): number => {
  let output = value;
  output = ((output & 0xf0) >> 4) | ((output & 0x0f) << 4);
  output = ((output & 0xcc) >> 2) | ((output & 0x33) << 2);
  return ((output & 0xaa) >> 1) | ((output & 0x55) << 1);
};

const flipTileDataX = (tile: Uint8Array): Uint8Array =>
  Uint8Array.from(tile, reverseByte);

const flipTileDataY = (tile: Uint8Array): Uint8Array => {
  const output = new Uint8Array(tile.length);
  for (let row = 0; row < 8; row++) {
    output[row * 2] = tile[(7 - row) * 2] ?? 0;
    output[row * 2 + 1] = tile[(7 - row) * 2 + 1] ?? 0;
  }
  return output;
};

export const autoFlipTileData = ({
  tileData,
  tileColors,
  commonTileData,
}: {
  tileData: Uint8Array[];
  tileColors: readonly number[];
  commonTileData: Uint8Array[];
}): AutoFlipResult => {
  const newTileData: Uint8Array[] = [];
  const newTileColors = [...tileColors];
  const tileLookup: TileLookup = commonTileData.reduce((memo, data) => {
    memo[hashTileData(data)] = data;
    return memo;
  }, {} as TileLookup);

  tileData.forEach((origData, index) => {
    const attr = tileColors[index] ?? 0;
    const clearedAttr =
      attr & ~(TILE_COLOR_PROP_FLIP_VERTICAL | TILE_COLOR_PROP_FLIP_HORIZONTAL);
    const flipX = flipTileDataX(origData);
    const flipY = flipTileDataY(origData);
    const flipXY = flipTileDataX(flipY);
    const variants = [
      { data: origData, hash: hashTileData(origData), mask: 0 },
      {
        data: flipX,
        hash: hashTileData(flipX),
        mask: TILE_COLOR_PROP_FLIP_HORIZONTAL,
      },
      {
        data: flipY,
        hash: hashTileData(flipY),
        mask: TILE_COLOR_PROP_FLIP_VERTICAL,
      },
      {
        data: flipXY,
        hash: hashTileData(flipXY),
        mask: TILE_COLOR_PROP_FLIP_HORIZONTAL | TILE_COLOR_PROP_FLIP_VERTICAL,
      },
    ];
    const matched = variants.find((variant) => tileLookup[variant.hash]);
    if (matched) {
      newTileData.push(matched.data);
      newTileColors[index] = clearedAttr | matched.mask;
    } else {
      tileLookup[variants[0].hash] = origData;
      newTileColors[index] = clearedAttr;
      newTileData.push(origData);
    }
  });

  return {
    tileData: newTileData,
    tileAttrs: newTileColors,
    tilesetData: [...commonTileData, ...newTileData],
  };
};

export const autoFlipTiles = ({
  indexedImage,
  tileColors,
  commonTileData,
}: {
  indexedImage: IndexedImage;
  tileColors: readonly number[];
  commonTileData: Uint8Array[];
}): AutoFlipResult => {
  const tileData: Uint8Array[] = [];
  const width = Math.floor(indexedImage.width / TILE_SIZE);
  const height = Math.floor(indexedImage.height / TILE_SIZE);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tileData.push(
        indexedImageTo2bppTileData(
          sliceIndexedImage(
            indexedImage,
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE,
          ),
        ),
      );
    }
  }
  return autoFlipTileData({
    tileData,
    tileColors,
    commonTileData,
  });
};
