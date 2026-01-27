import { Background, ColorCorrectionSetting } from "shared/lib/resources/types";
import { assetFilename } from "shared/lib/helpers/assets";
import { readFileToPalettes } from "lib/tiles/readFileToPalettes";
import { HexPalette } from "shared/lib/tiles/autoColor";
import { IndexedImage } from "shared/lib/tiles/indexedImage";

export const getMonoTilesImage = async (
  img: Background,
  uiPalette: HexPalette | undefined,
  colorCorrection: ColorCorrectionSetting,
  projectPath: string,
): Promise<IndexedImage> => {
  const filename = assetFilename(projectPath, "backgrounds", img);
  const paletteData = await readFileToPalettes(
    filename,
    colorCorrection,
    uiPalette,
  );
  return paletteData.indexedImage;
};
