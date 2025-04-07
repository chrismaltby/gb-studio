import { Font } from "shared/lib/entities/entitiesTypes";
import { lexText } from "shared/lib/compiler/lexText";
import { resolveMapping } from "shared/lib/helpers/fonts";
import { assetURL } from "shared/lib/helpers/assets";
import { TILE_SIZE } from "consts";

export interface FontData {
  id: string;
  img: HTMLImageElement;
  isMono: boolean;
  widths: number[];
  mapping: Record<string, number | number[]>;
}

const DOLLAR_CHAR = 4;
const HASH_CHAR = 3;
const ZERO_CHAR = 16;

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
  ctx.drawImage(img, 0, 16, 8, 8, 0, (height - 1) * 8, 8, 8); // BL
  ctx.drawImage(img, 16, 16, 8, 8, (width - 1) * 8, (height - 1) * 8, 8, 8); // BR
  for (let i = 0; i < height - 2; i++) {
    ctx.drawImage(img, 0, 8, 8, 8, 0, (i + 1) * 8, 8, 8); // L
    ctx.drawImage(img, 16, 8, 8, 8, (width - 1) * 8, (i + 1) * 8, 8, 8); // R
  }
  for (let i = 0; i < width - 2; i++) {
    ctx.drawImage(img, 8, 16, 8, 8, (i + 1) * 8, (height - 1) * 8, 8, 8); // B
    ctx.drawImage(img, 8, 0, 8, 8, (i + 1) * 8, 0, 8, 8); // T
  }
  ctx.drawImage(img, 0, 0, 8, 8, 0, 0, 8, 8); // TL
  ctx.drawImage(img, 16, 0, 8, 8, (width - 1) * 8, 0, 8, 8); // TR
  for (let i = 0; i < height - 2; i++) {
    for (let j = 0; j < width - 2; j++) {
      ctx.drawImage(img, 8, 8, 8, 8, (j + 1) * 8, (i + 1) * 8, 8, 8); // C
    }
  }
};

export const drawFill = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
) => {
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      ctx.drawImage(img, 8, 8, 8, 8, j * 8, i * 8, 8, 8); // C
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

export const loadFont = async (font: Font): Promise<FontData> => {
  const fontFilename = assetURL("fonts", font);
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
  maxHeight: number,
  fontsData: Record<string, FontData>,
  defaultFontId: string,
  fallbackFontId: string
) => {
  let drawX = 0;
  let drawY = 0;
  let leftX = 0;

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
    if (drawY >= maxHeight * 8) {
      return;
    }
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
    if (token.type === "text" && !token.hideInPreview) {
      const string = token.value;
      let i = 0;
      while (i < string.length) {
        const slice = string.slice(i);

        if (slice[0] === "\n") {
          drawX = leftX;
          drawY += 8;
          i++;
          continue;
        }
        if (slice[0] === "\\" && slice[1] === "n") {
          drawX = leftX;
          drawY += 8;
          i += 2;
          continue;
        }

        const { codes, length } = resolveMapping(slice, font.mapping);

        for (const code of codes) {
          const char = (code - 32) % font.widths.length;
          drawCharCode(char);
        }

        i += length;
      }
    } else if (token.type === "variable" && token.fixedLength !== undefined) {
      for (let c = 0; c < token.fixedLength - 1; c++) {
        drawCharCode(ZERO_CHAR);
      }
      drawCharCode(DOLLAR_CHAR);
    } else if (token.type === "variable") {
      drawCharCode(DOLLAR_CHAR);
      drawCharCode(DOLLAR_CHAR);
      drawCharCode(DOLLAR_CHAR);
    } else if (token.type === "char") {
      drawCharCode(HASH_CHAR);
    } else if (token.type === "font") {
      const newFont = fontsData[token.fontId];
      if (newFont) {
        font = newFont;
      }
    } else if (token.type === "gotoxy" && token.relative) {
      if (token.x > 0) {
        drawX = (Math.floor(drawX / TILE_SIZE) + (token.x - 1)) * TILE_SIZE;
      } else if (token.x < 0) {
        drawX = (Math.floor(drawX / TILE_SIZE) + token.x) * TILE_SIZE;
      }
      if (token.y > 0) {
        drawY = (Math.floor(drawY / TILE_SIZE) + (token.y - 1)) * TILE_SIZE;
      } else if (token.y < 0) {
        drawY = (Math.floor(drawY / TILE_SIZE) + token.y) * TILE_SIZE;
      }
      leftX = drawX;
    } else if (token.type === "gotoxy" && !token.relative) {
      drawX = (token.x - 1) * TILE_SIZE - xOffset;
      drawY = (token.y - 1) * TILE_SIZE - yOffset;
      leftX = drawX;
    }
  });
};
