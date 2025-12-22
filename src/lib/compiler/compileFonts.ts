import { CompiledFontData, readFileToFontData } from "lib/fonts/fontData";
import { assetFilename } from "shared/lib/helpers/assets";
import { Font } from "shared/lib/resources/types";

export type PrecompiledFontData = Font & CompiledFontData;

const compileFonts = async (
  fonts: Font[],
  projectRoot: string,
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
