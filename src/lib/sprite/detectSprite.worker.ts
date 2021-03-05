import { imageToIndexedImage } from "../tiles/indexedImage";
import {
  indexedImageToSprites,
  spriteAlignmentOffsets,
  autoHint2,
  spritesToTiles2,
  clusterSprites,
  spriteDataIndexFn,
} from "./spriteData";

declare const self: Worker;
const workerCtx: Worker = self;

workerCtx.onmessage = async (evt) => {
  const src = evt.data as string;
  const imgblob = await fetch(src).then((r) => r.blob());
  const img = await createImageBitmap(imgblob);
  const indexedImage = imageToIndexedImage(img, spriteDataIndexFn);
  const spriteDefs = indexedImageToSprites(indexedImage);
  const alignmentOffsets = spriteAlignmentOffsets(spriteDefs);
  const hintTileDefs = autoHint2(indexedImage);
  const { tileDefs, spriteTileLocations } = spritesToTiles2(
    spriteDefs,
    hintTileDefs
  );
  const spriteClusters = clusterSprites(spriteDefs);

  workerCtx.postMessage({
    tileDefs,
    spriteTileLocations,
    spriteDefs,
    alignmentOffsets,
    spriteClusters,
  });
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
