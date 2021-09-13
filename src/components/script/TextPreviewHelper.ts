import { Font } from "store/features/entities/entitiesTypes";
import { lexText } from "lib/fonts/lexText";
import { encodeChar } from "lib/helpers/encodings";
import { assetFilename } from "lib/helpers/gbstudio";

export interface FontData {
  id: string;
  img: HTMLImageElement;
  isMono: boolean;
  widths: number[];
  mapping: Record<string, number>;
}

const DOLLAR_CHAR = 4;
const HASH_CHAR = 3;

export const isTransparent = (r: number, g: number, b: number): boolean => {
  return (
    (r === 255 && b === 255 && g === 0) || (g === 255 && r === 0 && b === 0)
  );
};

export const drawFrame = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) => {
  ctx.drawImage(img, 0, 0, 8, 8, 0, 0, 8, 8); // TL
  ctx.drawImage(img, 16, 0, 8, 8, (width - 1) * 8, 0, 8, 8); // TR
  ctx.drawImage(img, 0, 16, 8, 8, 0, (height - 1) * 8, 8, 8); // BL
  ctx.drawImage(img, 16, 16, 8, 8, (width - 1) * 8, (height - 1) * 8, 8, 8); // BR
  for (let i = 0; i < height - 2; i++) {
    ctx.drawImage(img, 0, 8, 8, 8, 0, (i + 1) * 8, 8, 8); // L
    ctx.drawImage(img, 16, 8, 8, 8, (width - 1) * 8, (i + 1) * 8, 8, 8); // R
  }
  for (let i = 0; i < width - 2; i++) {
    ctx.drawImage(img, 8, 0, 8, 8, (i + 1) * 8, 0, 8, 8); // T
    ctx.drawImage(img, 8, 16, 8, 8, (i + 1) * 8, (height - 1) * 8, 8, 8); // B
  }
  for (let i = 0; i < height - 2; i++) {
    for (let j = 0; j < width - 2; j++) {
      ctx.drawImage(img, 8, 8, 8, 8, (j + 1) * 8, (i + 1) * 8, 8, 8); // C
    }
  }
};

const loadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
};

export const loadFont = async (
  projectRoot: string,
  font: Font
): Promise<FontData> => {
  const fontFilename = `file:///${assetFilename(
    projectRoot,
    "fonts",
    font
  )}?_v=${font._v || 0}`;
  const img = await loadImage(fontFilename);
  const widths: number[] = [];
  let isMono = true;

  // Make green background color transparent
  const tmpCanvas = document.createElement("canvas");
  const tmpCtx = tmpCanvas.getContext("2d");
  if (!tmpCtx) {
    throw new Error("Unable to get canvas context while loading font");
  }
  tmpCtx.drawImage(img, 0, 0);
  const imgData = tmpCtx?.getImageData(0, 0, img.width, img.height);
  if (imgData) {
    const charsX = Math.floor(img.width / 8);
    const charsY = Math.floor(img.height / 8);

    for (let yi = 0; yi < charsY; yi++) {
      for (let xi = 0; xi < charsX; xi++) {
        let width = 0;
        while (width < 8) {
          const i = 4 * (yi * 8 * img.width + xi * 8 + width);
          const r = imgData.data[i];
          const g = imgData.data[i + 1];
          const b = imgData.data[i + 2];
          if (isTransparent(r, g, b)) {
            isMono = false;
            break;
          }
          width++;
        }
        widths.push(width);
      }
    }
  }

  return {
    id: font.id,
    img,
    isMono,
    widths,
    mapping: font.mapping,
  };
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  xOffset: number,
  yOffset: number,
  fontsData: Record<string, FontData>,
  defaultFontId: string,
  fallbackFontId: string
) => {
  let drawX = 0;
  let drawY = 0;

  let font = fontsData[defaultFontId];

  if (!font) {
    font = fontsData[fallbackFontId];
  }

  if (!font) {
    return;
  }

  const drawCharCode = (char: number) => {
    const lookupX = char % 16;
    const lookupY = Math.floor(char / 16);
    ctx.drawImage(
      font.img,
      lookupX * 8,
      lookupY * 8,
      font.widths[char],
      8,
      drawX + xOffset,
      drawY + yOffset,
      font.widths[char],
      8
    );
    drawX += font.widths[char];
  };

  const textTokens = lexText(text);
  textTokens.forEach((token) => {
    if (token.type === "text") {
      const string = token.value;
      for (let i = 0; i < string.length; i++) {
        if (string[i] === "\n") {
          drawX = 0;
          drawY += 8;
          continue;
        }
        const char =
          (encodeChar(string[i], font.mapping) - 32) % font.widths.length;
        drawCharCode(char);
      }
    } else if (token.type === "variable") {
      drawCharCode(DOLLAR_CHAR);
      drawCharCode(DOLLAR_CHAR);
      drawCharCode(DOLLAR_CHAR);
    } else if (token.type === "char") {
      drawCharCode(HASH_CHAR);
      drawCharCode(HASH_CHAR);
      drawCharCode(HASH_CHAR);
    } else if (token.type === "font") {
      const newFont = fontsData[token.fontId];
      if (newFont) {
        font = newFont;
      }
    }
  });
};
