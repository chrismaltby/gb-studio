import { readFile } from "fs-extra";
import { readFileToIndexedImage } from "lib/tiles/readFileToTiles";
import { PNG } from "pngjs";
import { ColorCorrectionSetting } from "shared/lib/resources/types";
import {
  AutoPaletteResult,
  autoPalette,
  autoPaletteUsingTiles,
} from "shared/lib/tiles/autoColor";
import { tileDataIndexFn } from "shared/lib/tiles/tileData";

type HexPalette = [string, string, string, string];

export const readFileToPalettes = async (
  filename: string,
  colorCorrection: ColorCorrectionSetting,
  uiPalette: HexPalette | undefined,
): Promise<AutoPaletteResult> => {
  const colorPNG = await readPNG(filename);
  return autoPalette(
    colorPNG.width,
    colorPNG.height,
    colorPNG.data,
    colorCorrection,
    uiPalette,
  );
};

export const readFileToPalettesUsingTiles = async (
  filename: string,
  tilesFileName: string,
  colorCorrection: ColorCorrectionSetting,
  uiPalette: HexPalette | undefined,
): Promise<AutoPaletteResult> => {
  const colorPNG = await readPNG(filename);
  const indexedImage = await readFileToIndexedImage(
    tilesFileName,
    tileDataIndexFn,
  );
  return autoPaletteUsingTiles(
    colorPNG.width,
    colorPNG.height,
    colorPNG.data,
    indexedImage,
    colorCorrection,
    uiPalette,
  );
};

const readPNG = async (filename: string): Promise<PNG> => {
  const fileData = await readFile(filename);
  return new Promise((resolve, reject) => {
    new PNG().parse(fileData, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};
