import { DMG_PALETTE } from "consts";
import { hex2GBCrgb } from "shared/lib/helpers/color";
import { autoPalette, autoPaletteUsingTiles } from "shared/lib/tiles/autoColor";
import { pixelDataToIndexedImage } from "shared/lib/tiles/indexedImage";
import { tileDataIndexFn } from "shared/lib/tiles/tileData";

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

interface CacheRecord {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;
  img: ImageBitmap;
}

export interface AutoColorizedImageResult {
  id: number;
  width: number;
  height: number;
  canvasImage: ImageBitmap;
}

const cache: Record<string, CacheRecord> = {};
const TILE_COLOR_PALETTE = 0x7;

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const src = evt.data.src;
  const tilesSrc = evt.data.tilesSrc as string | undefined;
  const previewAsMono = evt.data.previewAsMono;
  const colorCorrectionFn = hex2GBCrgb(evt.data.colorCorrection);

  let canvas: OffscreenCanvas;
  let ctx: OffscreenCanvasRenderingContext2D;
  let img: ImageBitmap;

  let tilesCanvas: OffscreenCanvas | undefined;
  let tilesCtx: OffscreenCanvasRenderingContext2D | undefined;
  let tilesImg: ImageBitmap | undefined;

  if (cache[src]) {
    // Using Cached Data
    canvas = cache[src].canvas;
    ctx = cache[src].ctx;
    img = cache[src].img;
  } else {
    // Fetch New Data
    const imgblob = await fetch(src).then((r) => r.blob());
    img = await createImageBitmap(imgblob);

    canvas = new OffscreenCanvas(img.width, img.height);

    const tmpCtx = canvas.getContext("2d");
    if (!tmpCtx) {
      return;
    }
    ctx = tmpCtx;

    cache[src] = {
      canvas,
      ctx,
      img,
    };
  }

  // If DMG tiles override provided, load second image
  if (tilesSrc) {
    if (cache[tilesSrc]) {
      // Using Cached Data
      tilesCanvas = cache[tilesSrc].canvas;
      tilesCtx = cache[tilesSrc].ctx;
      tilesImg = cache[tilesSrc].img;
    } else {
      // Fetch New Data
      const imgblob = await fetch(tilesSrc).then((r) => r.blob());
      tilesImg = await createImageBitmap(imgblob);

      tilesCanvas = new OffscreenCanvas(img.width, img.height);

      const tmpCtx = tilesCanvas.getContext("2d");
      if (!tmpCtx) {
        return;
      }
      tilesCtx = tmpCtx;

      cache[tilesSrc] = {
        canvas: tilesCanvas,
        ctx: tilesCtx,
        img: tilesImg,
      };
    }
  }

  const width = img.width;
  const height = img.height;
  const tileWidth = Math.floor(width / 8);
  const tileHeight = Math.floor(height / 8);
  const tilesLength = tileWidth * tileHeight;

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let paletteData;

  if (tilesSrc && tilesCanvas && tilesCtx && tilesImg) {
    // If DMG tiles override provided get tiles from second image and color using tiles + first image
    tilesCtx.drawImage(tilesImg, 0, 0, width, height);
    const tilesImageData = tilesCtx.getImageData(0, 0, width, height);
    const tilesData = tilesImageData.data;
    const indexedImage = pixelDataToIndexedImage(
      width,
      height,
      tilesData,
      tileDataIndexFn,
    );
    paletteData = autoPaletteUsingTiles(width, height, data, indexedImage);
  } else {
    // If only one image provided extract tiles and color from same image
    paletteData = autoPalette(width, height, data, evt.data.colorCorrection);
  }

  const palettesRGB = paletteData.palettes.map((colors: string[]) =>
    colors.map(colorCorrectionFn),
  );
  const dmgPalette = DMG_PALETTE.colors.map(colorCorrectionFn);

  const tiles = paletteData.map;
  const indexedImage = paletteData.indexedImage;

  for (let t = 0; t < tilesLength; t++) {
    const tX = t % tileWidth;
    const tY = Math.floor(t / tileWidth);
    const palette =
      palettesRGB[tiles[t] & TILE_COLOR_PALETTE] || palettesRGB[0];
    const p1X = tX * 8;
    const p2X = p1X + 8;
    const p1Y = tY * 8;
    const p2Y = p1Y + 8;
    for (let pX = p1X; pX < p2X; pX++) {
      for (let pY = p1Y; pY < p2Y; pY++) {
        const ii = pX + pY * width;
        const index = ii * 4;
        const colorIndex = indexedImage.data[ii];
        const color = previewAsMono
          ? dmgPalette[colorIndex]
          : palette[colorIndex];
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  workerCtx.postMessage({ id, width, height, canvasImage }, [canvasImage]);
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
