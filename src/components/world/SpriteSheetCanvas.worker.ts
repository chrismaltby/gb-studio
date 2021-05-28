import { directionToFrame } from "../../lib/helpers/gbstudio";
import { hex2GBCrgb } from "../../lib/helpers/color";

const workerCtx: Worker = self as any;

const DMGPalette = [
  [233, 242, 228],
  [181, 214, 156],
  [91, 144, 116],
  [36, 50, 66],
];

const indexColour = (g: number) => {
  if (g < 65) {
    return 3;
  }
  if (g < 130) {
    return 3;
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

const cache: Record<string, CacheRecord> = {};

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const src = evt.data.src;
  const width = evt.data.width;
  const height = evt.data.height;
  const direction = evt.data.direction;
  const numFrames = evt.data.numFrames;
  const type = evt.data.type;
  const frame = evt.data.frame;
  const palette = evt.data.palette;
  const paletteRGB = palette.map(hex2GBCrgb);

  let canvas: OffscreenCanvas;
  let ctx: OffscreenCanvasRenderingContext2D;
  let img: ImageBitmap;

  const tileWidth = Math.floor(width / 8);
  const tileHeight = Math.floor(width / 8);
  const tilesLength = tileWidth * tileHeight;

  if (cache[src]) {
    // Using Cached Data
    canvas = cache[src].canvas;
    ctx = cache[src].ctx;
    img = cache[src].img;
  } else {
    // Fetch New Data
    canvas = new OffscreenCanvas(width, height);
    const tmpCtx = canvas.getContext("2d");
    if (!tmpCtx) {
      return;
    }
    ctx = tmpCtx;
    const imgblob = await fetch(src).then((r) => r.blob());
    img = await createImageBitmap(imgblob);

    cache[src] = {
      canvas,
      ctx,
      img,
    };
  }

  const directionFrame = directionToFrame(direction, numFrames);
  const spriteOffset = directionFrame + (frame || 0);

  // Draw Sprite
  ctx.save();
  if (direction === "left" && (type === "actor" || type === "actor_animated")) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(img, spriteOffset * -width, 0);
  ctx.restore();

  // Colorize
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let t = 0; t < tilesLength; t++) {
    const tX = t % tileWidth;
    const tY = Math.floor(t / tileWidth);
    const p1X = tX * 8;
    const p2X = p1X + 8;
    const p1Y = tY * 8;
    const p2Y = p1Y + 8;
    for (let pX = p1X; pX < p2X; pX++) {
      for (let pY = p1Y; pY < p2Y; pY++) {
        const index = (pX + pY * width) * 4;
        const colorIndex = indexColour(data[index + 1]);
        const color = paletteRGB[colorIndex];
        if (data[index + 1] === 255) {
          // Set transparent background on pure green
          data[index + 3] = 0;
        }
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  workerCtx.postMessage({ id, canvasImage }, [canvasImage]);
};

export {};
