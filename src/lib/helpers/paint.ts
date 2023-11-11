import { floodFill } from "ts-flood-fill";
import { assetFilename } from "./gbstudio";
import { readFileToTilesDataArray, toTileLookup, tilesAndLookupToTilemap } from "../tiles/tileData";
import { Background } from "store/features/entities/entitiesTypes";

type SetValueFn<T> = (x: number, y: number, value: T) => void;
type InBoundsFn = (x: number, y: number) => boolean;

const paint = <T>(
  x: number,
  y: number,
  size: number,
  value: T,
  setValue: SetValueFn<T>,
  isInBounds: InBoundsFn
) => {
  for (let xi = x; xi < x + size; xi++) {
    for (let yi = y; yi < y + size; yi++) {
      if (isInBounds(xi, yi)) {
        setValue(xi, yi, value);
      }
    }
  }
};

const paintLine = <T>(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  size: number,
  value: T,
  setValue: SetValueFn<T>,
  isInBounds: InBoundsFn
) => {
  let x1 = startX;
  let y1 = startY;
  const x2 = endX;
  const y2 = endY;

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  paint(x1, y1, size, value, setValue, isInBounds);

  while (!(x1 === x2 && y1 === y2)) {
    const e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
    paint(x1, y1, size, value, setValue, isInBounds);
  }
};

const paintMagic = <T>(
  background: Background,
  projectRoot: string,
  x: number,
  y: number,
  value: T,
  setValue: SetValueFn<T>,
  isInBounds: InBoundsFn
) => {
  //const projectRoot = String("C:/Users/Richard/Documents/GBProjects/SlopesDemo");//useSelector((state: RootState) => state.document.root);

    const filename = assetFilename(projectRoot, "backgrounds", background);
    const tileindex = (background.width * y + x);
    const width = background.width;
    asyncCall(background, filename, tileindex, x, y, value, width, setValue, isInBounds);
    console.log(tileindex);

}

  function resolveAfter2Seconds(filename: string) {
    return new Promise<Uint8Array[]>((output) => {
      const tileData = readFileToTilesDataArray(filename);
      output(tileData);
      //tilesetLookup.forEach((element) => {
    });
}
  
  async function asyncCall<T>(background: Background, filename: string, tileindex: number, x: number, y: number, value: T, width: number, setValue: SetValueFn<T>,
    isInBounds: InBoundsFn){
    const tileData = await resolveAfter2Seconds(filename);
    const tilesetLookup = toTileLookup(tileData);
    const tilesets = tilesAndLookupToTilemap(tileData, tilesetLookup);
    const targetTileID = tilesets[tileindex];
    let x1 = x;
    let y1 = y;
    tilesets.forEach((element, index) => {
      if (element == targetTileID)
      {
        x1 = index % width;
        y1 = (index / width >> 0);
        paint(x1, y1, 1, value, setValue, isInBounds);
        console.log("paint", x1, y1);
      }
    });
    console.log(tilesets, x, y, value, tileindex, targetTileID);
    // Expected output: "resolved"

}

  
  
  
export { paint, paintLine, floodFill, paintMagic };
