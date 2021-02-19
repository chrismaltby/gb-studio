import { colorizeData, chromaKeyData } from "../../../lib/helpers/color";

const workerCtx: Worker = self as any;

interface CacheRecord {
  img: ImageBitmap;
  imgCanvas: OffscreenCanvas;
}

const cache: Record<string, CacheRecord> = {};

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const src = evt.data.src;
  const offsetX = evt.data.offsetX || 0;
  const offsetY = evt.data.offsetY || 0;
  const width = evt.data.width;
  const height = evt.data.height;
  const tiles = evt.data.tiles;
  const flipX = evt.data.flipX;
  const flipY = evt.data.flipY;
  const palette = evt.data.palette;

  let canvas: OffscreenCanvas;
  let ctx: OffscreenCanvasRenderingContext2D;
  let img: ImageBitmap;
  let imgCanvas: OffscreenCanvas;

  if (cache[src]) {
    // Using Cached Data
    img = cache[src].img;
    imgCanvas = cache[src].imgCanvas;
  } else {
    const imgblob = await fetch(src).then((r) => r.blob());
    img = await createImageBitmap(imgblob);
    imgCanvas = new OffscreenCanvas(img.width, img.height);
    const imgCanvasCtx = imgCanvas.getContext("2d");
    if (!imgCanvasCtx) {
      return;
    }
    imgCanvasCtx.drawImage(img, 0, 0);
    // Remove transparency
    const tileImageData = imgCanvasCtx.getImageData(
      0,
      0,
      img.width,
      img.height
    );
    chromaKeyData(tileImageData.data);
    imgCanvasCtx.putImageData(tileImageData, 0, 0);
    cache[src] = {
      img,
      imgCanvas,
    };
  }

  // Fetch New Data
  canvas = new OffscreenCanvas(width, height);
  const tmpCtx = canvas.getContext("2d");
  if (!tmpCtx) {
    return;
  }
  ctx = tmpCtx;

  // Draw Tiles
  for (let tile of tiles) {
    ctx.save();
    if (tile.flipX) {
      ctx.translate(8, 0);
      ctx.scale(-1, 1);
    }
    if (tile.flipY) {
      ctx.translate(0, 16);
      ctx.scale(1, -1);
    }
    ctx.drawImage(
      imgCanvas,
      tile.sliceX,
      tile.sliceY,
      8,
      16,
      width / 2 - 8 + tile.x * (tile.flipX ? -1 : 1),
      height - 16 - tile.y * (tile.flipY ? -1 : 1),
      8,
      16
    );
    ctx.restore();
  }

  // Colorize
  const imageData = ctx.getImageData(0, 0, width, height);
  colorizeData(imageData.data, palette);
  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  workerCtx.postMessage({ id, canvasImage }, [canvasImage]);
};

export {};
