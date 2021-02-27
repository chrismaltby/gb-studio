import {
  imageToData,
  dataToSprites,
  spriteAlignmentOffsets,
  autoHint2,
  spritesToTiles2,
} from "./spriteDetection";

const workerCtx: Worker = self as any;

workerCtx.onmessage = async (evt) => {
  const src = evt.data as string;
  const imgblob = await fetch(src).then((r) => r.blob());
  const img = await createImageBitmap(imgblob);
  const d1 = imageToData(img);
  const spriteDefs = dataToSprites(d1);
  const alignmentOffsets = spriteAlignmentOffsets(spriteDefs);
  const hintTileDefs = autoHint2(d1);
  const { tileDefs, spriteTileLocations } = spritesToTiles2(
    spriteDefs,
    hintTileDefs
  );

  console.log("d1", d1);
  console.log("spriteDefs", spriteDefs);
  console.log("alignmentOffsets", alignmentOffsets);
  console.log("hintTileDefs", hintTileDefs);
  console.log("tileDefs", tileDefs);
  console.log("spriteTileLocations", spriteTileLocations);

  workerCtx.postMessage({
    tileDefs,
    spriteTileLocations,
    spriteDefs,
    alignmentOffsets,
  });
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
