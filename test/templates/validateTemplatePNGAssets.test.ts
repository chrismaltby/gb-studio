import { projectTemplatesRoot } from "consts";
import { globSync } from "lib/helpers/glob";
import { join, normalize, sep } from "path";
import { PNG } from "pngjs";
import { readFileSync } from "fs";
import { rgb2hex } from "shared/lib/helpers/color";

const COLOR_0 = "071821";
const COLOR_1 = "306850";
const COLOR_2 = "86c06c";
const COLOR_3 = "e0f8cf";
const COLOR_ALPHA = "65ff00";
const COLOR_FONT_EDGE = "ff00ff";

const validImageColors = [COLOR_0, COLOR_1, COLOR_2, COLOR_3];
const validSpriteColors = [COLOR_0, COLOR_2, COLOR_3, COLOR_ALPHA];
const validFontColors = [COLOR_0, COLOR_1, COLOR_2, COLOR_3, COLOR_FONT_EDGE];

const templatePNGAssets = globSync("**/assets/**/*.png", {
  cwd: projectTemplatesRoot,
  absolute: true,
}).map((filePath) => {
  const fileData = readFileSync(filePath);
  const normalizedPath = normalize(filePath);
  const pathParts = normalizedPath.split(sep);
  const assetType = pathParts[pathParts.indexOf("assets") + 1];
  const png = PNG.sync.read(fileData);
  const palette = new Set<string>();
  let containsAlpha = false;
  const { width, height, data } = png;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const alpha = data[idx + 3] ?? 0;
      if (alpha < 255) {
        containsAlpha = true;
      }
      const hex = rgb2hex(
        data[idx] ?? 0,
        data[idx + 1] ?? 0,
        data[idx + 2] ?? 0,
      );
      palette.add(hex);
    }
  }
  return {
    filePath,
    png,
    palette,
    containsAlpha,
    assetType,
  };
});

test.each(templatePNGAssets)(
  "Template asset is indexed PNG : $filePath",
  ({ png }) => {
    expect(png.palette).toBeTruthy();
  },
);

test.each(templatePNGAssets)(
  "Template asset contains correct number of colors : $filePath",
  ({ palette, assetType }) => {
    let maxColors = 4;
    if (assetType === "sgb") {
      // SGB images have no color requirements, will be matched to nearest
      // valid colors at compile time
      return;
    }
    if (assetType === "font") {
      maxColors = 5;
    }
    expect(palette.size).toBeLessThanOrEqual(maxColors);
  },
);

test.each(templatePNGAssets)(
  "Template asset contains only valid colors : $filePath",
  ({ assetType, palette }) => {
    let validColors = validImageColors;
    if (assetType === "sprites" || assetType === "emotes") {
      validColors = validSpriteColors;
    }
    if (assetType === "fonts") {
      validColors = validFontColors;
    }
    if (assetType === "sgb") {
      // SGB images have no color requirements, will be matched to nearest
      // valid colors at compile time
      return;
    }
    const extraColors = [...palette].filter(
      (item) => !validColors.includes(item),
    );
    expect(extraColors).toEqual([]);
  },
);

test.each(templatePNGAssets)(
  "Template asset is index palette is correct : $filePath",
  ({ png, assetType }) => {
    let validPalette = validImageColors.join("-");
    if (assetType === "sprites" || assetType === "emotes") {
      validPalette = validSpriteColors.join("-");
    }
    if (assetType === "fonts") {
      validPalette = validFontColors.join("-");
    }
    if (assetType === "sgb") {
      // SGB images have no color requirements, will be matched to nearest
      // valid colors at compile time
      return;
    }

    const pngPalette = png.palette as unknown as Array<Array<number>> | false;
    const indexPalette =
      (pngPalette &&
        pngPalette
          .map((color) => {
            const [r, g, b] = color;
            return r !== undefined && g !== undefined && b !== undefined
              ? rgb2hex(r, g, b)
              : "FAIL";
          })
          .join("-")) ||
      "";
    expect(Array.isArray(pngPalette));
    expect(indexPalette).toEqual(validPalette);
  },
);
