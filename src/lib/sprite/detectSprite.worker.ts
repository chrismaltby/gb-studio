import { imageToData, dataToSprites } from "./spriteDetection";

const workerCtx: Worker = self as any;

workerCtx.onmessage = async (evt) => {
  const src = evt.data as string;
  const imgblob = await fetch(src).then((r) => r.blob());
  const img = await createImageBitmap(imgblob);
  const d1 = imageToData(img);
  const spriteDefs = dataToSprites(d1);

  console.log("d1", d1);
  console.log("spriteDefs", spriteDefs);
  //   workerCtx.postMessage("OUTPUT" + evt.data);
};

// -----------------------------------------------------------------

export default class W extends Worker {
  constructor() {
    super("");
  }
}
