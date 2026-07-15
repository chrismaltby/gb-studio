import {
  DMG_PALETTE,
  TILE_COLOR_PALETTE,
  TILE_COLOR_PROP_FLIP_HORIZONTAL,
  TILE_COLOR_PROP_FLIP_VERTICAL,
  TILE_SIZE,
} from "consts";
import { hex2GBCrgb } from "shared/lib/helpers/color";
import {
  buildSceneTilesetReferenceLookup,
  decodeSceneTileReference,
} from "shared/lib/tiles/sceneTilemapReferences";
import type {
  ColorCorrectionSetting,
  MonoBGPPalette,
  TilesetSnapshot,
} from "shared/lib/resources/types";

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

export interface TilemapLayersWorkerTileset {
  id: string;
  width: number;
  src: string;
}

export interface TilemapLayersCanvasData {
  canvasId: string;
  sequence: number;
  width: number;
  height: number;
  tiles: Uint32Array;
  tileColors: Uint8Array;
  tilesetSnapshots: TilesetSnapshot[];
  tilesets: Array<TilemapLayersWorkerTileset | undefined>;
  palettes: string[][];
  previewAsMono?: boolean;
  monoBGP: MonoBGPPalette;
  colorCorrection: ColorCorrectionSetting;
}

export interface TilemapLayersCanvasResult {
  canvasId: string;
  sequence: number;
  width: number;
  height: number;
  canvasImage: ImageBitmap;
}

const imageCache = new Map<string, Promise<ImageBitmap | undefined>>();
const colorizedTileCache = new Map<string, OffscreenCanvas>();

const loadImage = (src: string): Promise<ImageBitmap | undefined> => {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const image = fetch(src)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load tileset: ${src}`);
      return response.blob();
    })
    .then(createImageBitmap)
    .catch(() => undefined);
  imageCache.set(src, image);
  return image;
};

const indexColour = (green: number) => {
  if (green < 65) return 3;
  if (green < 130) return 2;
  if (green < 205) return 1;
  return 0;
};

export const renderTilemapLayers = async (
  data: TilemapLayersCanvasData,
): Promise<TilemapLayersCanvasResult | undefined> => {
  const {
    canvasId,
    sequence,
    width,
    height,
    tiles,
    tileColors,
    tilesetSnapshots,
    tilesets,
    palettes,
    previewAsMono,
    monoBGP,
    colorCorrection,
  } = data;
  const canvas = new OffscreenCanvas(width * TILE_SIZE, height * TILE_SIZE);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const loadedImages = await Promise.all(
    tilesets.map((tileset) =>
      tileset ? loadImage(tileset.src) : Promise.resolve(undefined),
    ),
  );
  const correctColor = hex2GBCrgb(colorCorrection);
  const palettesRGB = palettes.map((palette) => palette.map(correctColor));
  const dmgPalette = DMG_PALETTE.colors.map(correctColor);
  const colorizationKey = JSON.stringify([
    colorCorrection,
    previewAsMono,
    monoBGP,
    palettes,
  ]);

  ctx.imageSmoothingEnabled = false;
  const emptyColor = dmgPalette[0];
  ctx.fillStyle = `rgb(${emptyColor.r}, ${emptyColor.g}, ${emptyColor.b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tilesetLookup = buildSceneTilesetReferenceLookup({
    tilesets: tilesetSnapshots,
  });
  const tilesetsLookup = Object.fromEntries(
    tilesets
      .filter((tileset): tileset is TilemapLayersWorkerTileset => !!tileset)
      .map((tileset) => [tileset.id, tileset]),
  );

  const colorizedTile = (
    image: ImageBitmap,
    sourceX: number,
    sourceY: number,
    cacheKey: string,
    attr: number,
  ) => {
    const cached = colorizedTileCache.get(cacheKey);
    if (cached) return cached;

    const tileCanvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const tileCtx = tileCanvas.getContext("2d", { willReadFrequently: true });
    if (!tileCtx) return undefined;
    tileCtx.drawImage(
      image,
      sourceX,
      sourceY,
      TILE_SIZE,
      TILE_SIZE,
      0,
      0,
      TILE_SIZE,
      TILE_SIZE,
    );
    const imageData = tileCtx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const palette = palettesRGB[attr & TILE_COLOR_PALETTE] ?? palettesRGB[0];
    for (let index = 0; index < imageData.data.length; index += 4) {
      const colorIndex = indexColour(imageData.data[index + 1]);
      const color = previewAsMono
        ? dmgPalette[monoBGP[colorIndex]]
        : (palette?.[colorIndex] ?? dmgPalette[colorIndex]);
      imageData.data[index] = color.r;
      imageData.data[index + 1] = color.g;
      imageData.data[index + 2] = color.b;
      imageData.data[index + 3] = 255;
    }
    tileCtx.putImageData(imageData, 0, 0);
    colorizedTileCache.set(cacheKey, tileCanvas);
    return tileCanvas;
  };

  const fillEmptyTile = (cellIndex: number, attr: number) => {
    const palette = palettesRGB[attr & TILE_COLOR_PALETTE] ?? palettesRGB[0];
    const color = previewAsMono
      ? dmgPalette[monoBGP[0]]
      : (palette?.[0] ?? dmgPalette[0]);
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(
      (cellIndex % width) * TILE_SIZE,
      Math.floor(cellIndex / width) * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
    );
  };

  tiles.forEach((value, cellIndex) => {
    const ref = decodeSceneTileReference(value, tilesetLookup);
    const tileset = ref && tilesetsLookup[ref.tilesetId];
    const image = ref && loadedImages[ref.tilesetIndex];
    const attr = tileColors[cellIndex] ?? 0;
    if (!ref || !tileset || !image) {
      fillEmptyTile(cellIndex, attr);
      return;
    }

    const sourceX = (ref.tileIndex % Math.max(1, tileset.width)) * TILE_SIZE;
    const sourceY =
      Math.floor(ref.tileIndex / Math.max(1, tileset.width)) * TILE_SIZE;
    const destX = (cellIndex % width) * TILE_SIZE;
    const destY = Math.floor(cellIndex / width) * TILE_SIZE;
    const tileCanvas = colorizedTile(
      image,
      sourceX,
      sourceY,
      `${colorizationKey}:${tileset.src}:${tileset.width}:${ref.tileIndex}:${
        attr & TILE_COLOR_PALETTE
      }`,
      attr,
    );
    if (!tileCanvas) return;

    const flipX = !!(attr & TILE_COLOR_PROP_FLIP_HORIZONTAL);
    const flipY = !!(attr & TILE_COLOR_PROP_FLIP_VERTICAL);
    ctx.save();
    ctx.translate(
      destX + (flipX ? TILE_SIZE : 0),
      destY + (flipY ? TILE_SIZE : 0),
    );
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(tileCanvas, 0, 0);
    ctx.restore();
  });

  const canvasImage = canvas.transferToImageBitmap();
  return {
    canvasId,
    sequence,
    width: canvas.width,
    height: canvas.height,
    canvasImage,
  };
};

workerCtx.onmessage = async (evt: MessageEvent<TilemapLayersCanvasData>) => {
  const result = await renderTilemapLayers(evt.data);
  if (result) {
    workerCtx.postMessage(result, [result.canvasImage]);
  }
};
