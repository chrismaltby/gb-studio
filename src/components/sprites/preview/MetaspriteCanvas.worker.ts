import { colorizeSpriteData, chromaKeyData } from "../../../lib/helpers/color";
import { ObjPalette } from "../../../store/features/entities/entitiesTypes";

const workerCtx: Worker = self as any;

interface CacheRecord {
  img: ImageBitmap;
  tilesCanvases: Record<ObjPalette, OffscreenCanvas>;
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
  let tilesCanvas: OffscreenCanvas;
  let tilesCanvases: Record<ObjPalette, OffscreenCanvas>;

  if (cache[src]) {
    // Using Cached Data
    img = cache[src].img;
    tilesCanvases = cache[src].tilesCanvases;
  } else {
    const imgblob = await fetch(src).then((r) => r.blob());
    img = await createImageBitmap(imgblob);
   tilesCanvas = new OffscreenCanvas(img.width, img.height);
    const tilesCanvasCtx = tilesCanvas.getContext("2d");
    if (!tilesCanvasCtx) {
      return;
    }
   tilesCanvasCtx.drawImage(img, 0, 0);
    // Remove transparency
    const tileImageData = tilesCanvasCtx.getImageData(
      0,
      0,
      img.width,
      img.height
    );
    chromaKeyData(tileImageData.data););

    tilesCanvases = {
      OBP0: new OffscreenCanvas(img.width, img.height),
      OBP1: new OffscreenCanvas(img.width, img.height),
    };

    (["OBP0", "OBP1"] as ObjPalette[]).forEach((objPalette) => {
      const canvas = tilesCanvases[objPalette];
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const imageDataCopy = new ImageData(
        new Uint8ClampedArray(tileImageData.data),
        tileImageData.width,
        tileImageData.height
      );
      colorizeSpriteData(imageDataCopy.data, objPalette, palette);
      ctx.putImageData(imageDataCopy, 0, 0);
    });

    cache[src] = {
      img,
      tilesCanvases,
    };
  }

  // Fetch New Data
  canvas = new OffscreenCanvas(width, height);
  const tmpCtx = canvas.getContext("2d");
  if (!tmpCtx) {
    return;
  }
  ctx = tmpCtx;

  if (flipX) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  // Draw Tiles
  for (let tile of tiles) {
    ctx.save();
    if (tile.flipX) {
      ctx.translate((width - 8) / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-((width - 8) / 2), 0);
    }
    if (tile.flipY) {
      ctx.translate(0, height - 8);
      ctx.scale(1, -1);
      ctx.translate(0, -(height - 8));
    }
    ctx.drawImage(
      tilesCanvases[(tile.objPalette || "OBP0") as ObjPalette],
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

  const canvasImage = canvas.transferToImageBitmap();
  workerCtx.postMessage({ id, canvasImage }, [canvasImage]);
};

export {};
