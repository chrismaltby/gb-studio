import { assetFilename } from "../helpers/gbstudio";
import { FontAssetData } from "../project/loadFontData";
import { FontData, readFileToFontData } from "../fonts/fontData";

export type PrecompiledFontData = FontAssetData & FontData;

const compileFonts = async (
  fonts: FontAssetData[],
  projectRoot: string
): Promise<PrecompiledFontData[]> => {
  const compiled: PrecompiledFontData[] = [];
  for (const font of fonts) {
    const filename = assetFilename(projectRoot, "fonts", font);
    const data = await readFileToFontData(filename);
    compiled.push({
      ...font,
      ...data,
    });
  }

  return compiled;
};

export default compileFonts;
