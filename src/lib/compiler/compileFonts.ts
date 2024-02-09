import { FontAssetData } from "lib/project/loadFontData";
import { FontData, readFileToFontData } from "lib/fonts/fontData";
import { assetFilename } from "shared/lib/helpers/assets";

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
