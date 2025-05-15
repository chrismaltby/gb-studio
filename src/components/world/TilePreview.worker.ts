import { TILE_SIZE } from "consts";
import { hex2GBCrgb } from "shared/lib/helpers/color";

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

const indexColour = (g: number) => {
  if (g < 65) {
    return 3;
  }
  if (g < 130) {
    return 2;
  }
  if (g < 205) {
    return 1;
  }
  return 0;
};

interface CacheRecord {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;
  img: ImageBitmap;
}

export interface TilePreviewResult {
  id: number;
  canvasImage: ImageBitmap;
}

const cache: Record<string, CacheRecord> = {};

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const src = evt.data.src;
  const tileIndex = evt.data.tileIndex ?? 0;
  const tileSize = evt.data.tileSize === "16px" ? TILE_SIZE * 2 : TILE_SIZE;
  const palette = evt.data.palette;
  const paletteRGB = palette.map(hex2GBCrgb);

  let canvas: OffscreenCanvas;
  let ctx: OffscreenCanvasRenderingContext2D;
  let img: ImageBitmap;

  if (cache[src]) {
    // Using Cached Data
    canvas = cache[src].canvas;
    ctx = cache[src].ctx;
    img = cache[src].img;
  } else {
    // Fetch New Data
    const imgblob = await fetch(src).then((r) => r.blob());
    img = await createImageBitmap(imgblob);

    canvas = new OffscreenCanvas(tileSize, tileSize);

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

  const tileWidth = Math.floor(img.width / TILE_SIZE);

  const offsetX = TILE_SIZE * (tileIndex % tileWidth);
  const offsetY = TILE_SIZE * Math.floor(tileIndex / tileWidth);

  canvas.width = tileSize;
  canvas.height = tileSize;

  ctx.drawImage(
    img,
    offsetX,
    offsetY,
    tileSize,
    tileSize,
    0,
    0,
    tileSize,
    tileSize
  );

  const imageData = ctx.getImageData(0, 0, tileSize, tileSize);
  const data = imageData.data;

  const p1X = 0;
  const p2X = tileSize;
  const p1Y = 0;
  const p2Y = tileSize;
  for (let pX = p1X; pX < p2X; pX++) {
    for (let pY = p1Y; pY < p2Y; pY++) {
      const index = (pX + pY * tileSize) * 4;
      const colorIndex = indexColour(data[index + 1]);
      const color = paletteRGB[colorIndex];
      data[index] = color.r;
      data[index + 1] = color.g;
      data[index + 2] = color.b;
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  workerCtx.postMessage({ id, canvasImage }, [canvasImage]);
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
