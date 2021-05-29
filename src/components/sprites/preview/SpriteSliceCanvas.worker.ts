import { colorizeSpriteData } from "lib/helpers/color";

// eslint-disable-next-line no-restricted-globals
const workerCtx: Worker = self as unknown as Worker;

interface CacheRecord {
  // canvas: OffscreenCanvas;
  // ctx: OffscreenCanvasRenderingContext2D;
  img: ImageBitmap;
}

export interface SpriteSliceCanvasResult {
  id: number;
  canvasImage: ImageBitmap;
}

const cache: Record<string, CacheRecord> = {};

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const src = evt.data.src;
  const offsetX = evt.data.offsetX;
  const offsetY = evt.data.offsetY;
  const width = evt.data.width;
  const height = evt.data.height;
  const flipX = evt.data.flipX;
  const flipY = evt.data.flipY;
  const objPalette = evt.data.objPalette;
  const palette = evt.data.palette;

  let img: ImageBitmap;

  if (cache[src]) {
    // Using Cached Data
    img = cache[src].img;
  } else {
    const imgblob = await fetch(src).then((r) => r.blob());
    img = await createImageBitmap(imgblob);
    cache[src] = {
      img,
    };
  }

  // Fetch New Data
  const canvas = new OffscreenCanvas(width, height);
  const tmpCtx = canvas.getContext("2d");
  if (!tmpCtx) {
    return;
  }
  const ctx = tmpCtx;

  // Draw Sprite
  ctx.save();
  if (flipX) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  if (flipY) {
    ctx.translate(0, height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(img, -offsetX, -offsetY);
  ctx.restore();

  // Colorize
  const imageData = ctx.getImageData(0, 0, width, height);
  colorizeSpriteData(imageData.data, objPalette, palette);
  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  const res: SpriteSliceCanvasResult = { id, canvasImage };
  workerCtx.postMessage(res, [canvasImage]);
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
