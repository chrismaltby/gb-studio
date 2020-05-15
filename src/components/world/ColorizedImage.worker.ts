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

const cache: Record<string, CacheRecord> = {};

workerCtx.onmessage = async (evt) => {
  const id = evt.data.id;
  const src = evt.data.src;
  const tiles = evt.data.tiles;
  const palettes = evt.data.palettes;

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

  const width = img.width;
  const height = img.height;
  const tileWidth = Math.floor(width / 8);
  const tileHeight = Math.floor(width / 8);
  const tilesLength = tileWidth * tileHeight;

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let t = 0; t < tilesLength; t++) {
    const tX = t % tileWidth;
    const tY = Math.floor(t / tileWidth);
    const palette = palettes[tiles[t]] || DMGPalette;
    const p1X = tX * 8;
    const p2X = p1X + 8;
    const p1Y = tY * 8;
    const p2Y = p1Y + 8;
    for (let pX = p1X; pX < p2X; pX++) {
      for (let pY = p1Y; pY < p2Y; pY++) {
        const index = (pX + pY * width) * 4;
        const colorIndex = indexColour(data[index + 1]);
        const color = palette[colorIndex];
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const canvasImage = canvas.transferToImageBitmap();
  workerCtx.postMessage({ id, width, height, canvasImage }, [canvasImage]);
};

export { }
