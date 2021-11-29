import { imageToIndexedImage } from "../tiles/indexedImage";
import {
  indexedImageToSprites,
  spriteAlignmentOffsets,
  autoHint2,
  spritesToTiles2,
  clusterSprites,
  spriteDataWithDividerIndexFn,
  SliceDef,
  SpriteTileLocation,
  Position,
  SpriteCluster,
} from "./spriteData";

declare const self: Worker;
const workerCtx: Worker = self;

export interface DetectSpriteResult {
  tileDefs: SliceDef[];
  spriteTileLocations: SpriteTileLocation[][];
  spriteDefs: SliceDef[];
  alignmentOffsets: Position[];
  spriteClusters: SpriteCluster[];
}

workerCtx.onmessage = async (evt) => {
  const src = evt.data as string;
  const imgblob = await fetch(src).then((r) => r.blob());
  const img = await createImageBitmap(imgblob);
  const indexedImage = imageToIndexedImage(img, spriteDataWithDividerIndexFn);
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
