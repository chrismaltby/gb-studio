import {
  ColorCorrectionSetting,
  MonoOBJPalette,
} from "shared/lib/resources/types";

/* eslint-disable no-param-reassign */
const hexStringToDecimal = (str: string) => {
  return parseInt(str, 16);
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const clamp31 = (value: number) => {
  return clamp(value, 0, 31);
};

export const hex2rgb = (hex: string) => {
  const r = Math.floor(hexStringToDecimal(hex.substring(0, 2)));
  const g = Math.floor(hexStringToDecimal(hex.substring(2, 4)));
  const b = Math.floor(hexStringToDecimal(hex.substring(4)));
  return {
    r,
    g,
    b,
  };
};

export const rgb2hex = (r: number, g: number, b: number): string => {
  const hexR = r.toString(16).padStart(2, "0");
  const hexG = g.toString(16).padStart(2, "0");
  const hexB = b.toString(16).padStart(2, "0");
  return `${hexR}${hexG}${hexB}`;
};

export const hex2GBCrgb =
  (colorCorrection: ColorCorrectionSetting) => (hex: string) => {
    const gbcHex = hex2GBChex(hex, colorCorrection);
    const r = Math.floor(hexStringToDecimal(gbcHex.substring(0, 2)));
    const g = Math.floor(hexStringToDecimal(gbcHex.substring(2, 4)));
    const b = Math.floor(hexStringToDecimal(gbcHex.substring(4)));
    return {
      r,
      g,
      b,
    };
  };

export const hex2GBChex = (
  hex: string,
  colorCorrection: ColorCorrectionSetting,
): string => {
  if (colorCorrection === "none") {
    return hex;
  }
  const r = clamp31(Math.floor(hexStringToDecimal(hex.substring(0, 2)) / 8));
  const g = clamp31(Math.floor(hexStringToDecimal(hex.substring(2, 4)) / 8));
  const b = clamp31(Math.floor(hexStringToDecimal(hex.substring(4)) / 8));
  return rgb5BitToGBCHex(r, g, b).toUpperCase();
};

/* 5-bit rgb value => GBC representative hex value */
export const rgb5BitToGBCHex = (
  red5: number,
  green5: number,
  blue5: number,
) => {
  const value = (blue5 << 10) + (green5 << 5) + red5;
  const r = value & 0x1f;
  const g = (value >> 5) & 0x1f;
  const b = (value >> 10) & 0x1f;
  return (
    (((r * 13 + g * 2 + b) >> 1) << 16) |
    ((g * 3 + b) << 9) |
    ((r * 3 + g * 2 + b * 11) >> 1)
  )
    .toString(16)
    .padStart(6, "0");
};

const indexSpriteColour = (g: number, objPalette: MonoOBJPalette) => {
  if (g < 130) return objPalette[2];
  if (g < 205) return objPalette[1];
  return objPalette[0];
};

export const colorizeSpriteData = (
  mutData: Uint8ClampedArray,
  objPalette: MonoOBJPalette,
  palette: string[],
  colorCorrection: ColorCorrectionSetting,
) => {
  const colorCorrectionFn = hex2GBCrgb(colorCorrection);
  const paletteRGB = palette.map(colorCorrectionFn);
  for (let index = 0; index < mutData.length; index += 4) {
    const colorIndex = indexSpriteColour(mutData[index + 1], objPalette);
    const color = paletteRGB[colorIndex];
    const r = mutData[index];
    const g = mutData[index + 1];
    const b = mutData[index + 2];
    if ((g > 249 && r < 180 && b < 20) || (b >= 200 && g < 20)) {
      // Set transparent background on pure green & magenta
      mutData[index + 3] = 0;
    }
    mutData[index] = color.r;
    mutData[index + 1] = color.g;
    mutData[index + 2] = color.b;
  }
};

export const chromaKeyData = (mutData: Uint8ClampedArray) => {
  for (let index = 0; index < mutData.length; index += 4) {
    if (mutData[index + 1] === 255) {
      // Set transparent background on pure green
      mutData[index + 3] = 0;
    }
  }
};
