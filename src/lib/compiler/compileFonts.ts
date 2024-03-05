import { CompiledFontData, readFileToFontData } from "lib/fonts/fontData";
import { assetFilename } from "shared/lib/helpers/assets";
import { FontData } from "shared/lib/entities/entitiesTypes";

export type PrecompiledFontData = FontData & CompiledFontData;

const compileFonts = async (
  fonts: FontData[],
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
