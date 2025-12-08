import {
  TILE_SIZE,
  TILE_COLOR_PROP_FLIP_VERTICAL,
  TILE_COLOR_PROP_FLIP_HORIZONTAL,
} from "consts";
import {
  IndexedImage,
  sliceIndexedImage,
  indexedImageTo2bppTileData,
  flipIndexedImageX,
  flipIndexedImageY,
} from "shared/lib/tiles/indexedImage";
import { TileLookup, hashTileData } from "shared/lib/tiles/tileData";

interface AutoFlipResult {
  tileData: Uint8Array[];
  tileAttrs: number[];
}

export function autoFlipTiles({
  indexedImage,
  tileColors,
}: {
  indexedImage: IndexedImage;
  tileColors: readonly number[];
}): AutoFlipResult {
  const xTiles = Math.floor(indexedImage.width / TILE_SIZE);
  const yTiles = Math.floor(indexedImage.height / TILE_SIZE);

  const newTileData: Uint8Array[] = [];
  const newTileColors = [...tileColors];
  const tileLookup: TileLookup = {};

  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const index = tyi * xTiles + txi;
      const attr = tileColors[index];
      const clearedAttr =
        attr &
        ~(TILE_COLOR_PROP_FLIP_VERTICAL | TILE_COLOR_PROP_FLIP_HORIZONTAL);

      const slicedTile = sliceIndexedImage(
        indexedImage,
        txi * TILE_SIZE,
        tyi * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );

      const origData = indexedImageTo2bppTileData(slicedTile);
      const origHash = hashTileData(origData);

      const slicedTileFlipX = flipIndexedImageX(slicedTile);
      const slicedTileFlipY = flipIndexedImageY(slicedTile);
      const slicedTileFlipXY = flipIndexedImageX(slicedTileFlipY);

      const flipX = indexedImageTo2bppTileData(slicedTileFlipX);
      const flipY = indexedImageTo2bppTileData(slicedTileFlipY);
      const flipXY = indexedImageTo2bppTileData(slicedTileFlipXY);

      const variants = [
        { data: origData, hash: origHash, mask: 0 },
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

      // Check if any variant already exists
      const matched = variants.find((v) => tileLookup[v.hash]);

      if (matched) {
        // If we found a match, use it and set flip attributes
        newTileData.push(matched.data);
        newTileColors[index] = clearedAttr | matched.mask;
      } else {
        // Otherwise, add the original
        tileLookup[origHash] = origData;
        newTileColors[index] = clearedAttr;
        newTileData.push(origData);
      }
    }
  }

  return {
    tileData: newTileData,
    tileAttrs: newTileColors,
  };
}
