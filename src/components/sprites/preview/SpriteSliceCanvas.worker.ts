import { colorizeData } from "../../../lib/helpers/color";

const workerCtx: Worker = self as any;

interface CacheRecord {
  // canvas: OffscreenCanvas;
  // ctx: OffscreenCanvasRenderingContext2D;
  img: ImageBitmap;
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
  const palette = evt.data.palette;

  let canvas: OffscreenCanvas;
  let ctx: OffscreenCanvasRenderingContext2D;
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
  canvas = new OffscreenCanvas(width, height);
  const tmpCtx = canvas.getContext("2d");
  if (!tmpCtx) {
    return;
  }
  ctx = tmpCtx;

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
  colorizeData(imageData.data, palette);
  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  workerCtx.postMessage({ id, canvasImage }, [canvasImage]);
};

export {};
