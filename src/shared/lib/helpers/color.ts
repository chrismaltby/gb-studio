import {
  ColorCorrectionSetting,
  MonoOBJPalette,
} from "shared/lib/resources/types";
import { clampN } from "shared/lib/helpers/clamp";
import { hexDec, wrap8Bit } from "shared/lib/helpers/8bit";
import { Branded } from "shared/types";

/**
 * Color space overview:
 *
 * - RawHex: linear RGB hex used for storage ("RRGGBB")
 * - CorrectedHex: GBC color-corrected hex for display only
 * - CanonicalRawHex: raw hex that maps exactly to a valid GBC 5-bit color
 *
 * Rules:
 * - Only CanonicalRawHex values should be stored
 * - CorrectedHex values are for preview/display only
 * - Conversion between spaces must be explicit
 */

export type RawHex = string;
export type CorrectedHex = Branded<string, "CorrectedHex">;
export type CanonicalRawHex = Branded<string, "CanonicalRawHex">;
export type RGB8 = {
  r: number;
  g: number;
  b: number;
};
export type CorrectedRGB8 = Branded<RGB8, "CorrectedRGB8">;

const clamp31 = clampN(31);

/**
 * Convert 8-bit RGB channel values to a 24-bit raw hex string.
 *
 * @param r Red   (0–255)
 * @param g Green (0–255)
 * @param b Blue  (0–255)
 * @returns Raw RGB hex string ("RRGGBB")
 */
export const rgb2hex = (r: number, g: number, b: number): RawHex => {
  const hexR = wrap8Bit(r).toString(16).padStart(2, "0");
  const hexG = wrap8Bit(g).toString(16).padStart(2, "0");
  const hexB = wrap8Bit(b).toString(16).padStart(2, "0");
  return `${hexR}${hexG}${hexB}` as RawHex;
};

/**
 * Create a color mapping function that converts raw hex colors into
 * GBC-corrected RGB values for display.
 */
export const hex2GBCrgb =
  (colorCorrection: ColorCorrectionSetting) =>
  (hex: RawHex): CorrectedRGB8 => {
    const gbcHex = hex2GBChex(hex, colorCorrection);
    const r = Math.floor(hexDec(gbcHex.substring(0, 2)));
    const g = Math.floor(hexDec(gbcHex.substring(2, 4)));
    const b = Math.floor(hexDec(gbcHex.substring(4)));
    return {
      r,
      g,
      b,
    } as CorrectedRGB8;
  };

/**
 * Convert a raw hex color into a GBC-corrected hex color to preview how color would appear on GBC
 *
 * @param hex  24-bit raw hex string ("RRGGBB", linear RGB)
 * @returns corrected hex ("RRGGBB", GBC display space)
 *
 * NOTE:
 * - This performs 8-bit → 5-bit quantisation.
 * - Output is *not* suitable for storage as a raw color.
 */
export const hex2GBChex = (
  hex: RawHex,
  colorCorrection: ColorCorrectionSetting,
): CorrectedHex => {
  if (colorCorrection === "none") {
    return hex as CorrectedHex;
  }
  const r = clamp31(Math.floor(hexDec(hex.substring(0, 2)) / 8));
  const g = clamp31(Math.floor(hexDec(hex.substring(2, 4)) / 8));
  const b = clamp31(Math.floor(hexDec(hex.substring(4)) / 8));
  return rgb5BitToGBCHex(r, g, b);
};

/**
 * Convert a raw 5-bit rgb color into a GBC-corrected hex color to preview how color would appear on GBC
 *
 * @param r  5-bit red channel value (0–31)
 * @param g  5-bit green channel value (0–31)
 * @param b  5-bit blue channel value (0–31)
 * @returns corrected hex ("RRGGBB", GBC display space)
 *
 * NOTE:
 * - Output is *not* suitable for storage as a raw color.
 */
export const rgb5BitToGBCHex = (
  red5: number,
  green5: number,
  blue5: number,
): CorrectedHex => {
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
    .padStart(6, "0")
    .toLowerCase() as CorrectedHex;
};

/**
 * Index sprite colour from green channel value and mono OBJ palette
 * @param g
 * @param objPalette
 * @returns
 */
const indexSpriteColour = (g: number, objPalette: MonoOBJPalette) => {
  if (g < 130) return objPalette[2];
  if (g < 205) return objPalette[1];
  return objPalette[0];
};

/**
 * Apply a GBC palette to sprite pixel data in-place.
 *
 * @param mutData raw sprite pixel data
 * @param objPalette mono OBJ palette
 * @param palette color palette
 * @param colorCorrection color correction setting
 */
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

/**
 * Apply a green-screen chroma key to pixel data.
 */
export const chromaKeyData = (mutData: Uint8ClampedArray) => {
  for (let index = 0; index < mutData.length; index += 4) {
    if (mutData[index + 1] === 255) {
      // Set transparent background on pure green
      mutData[index + 3] = 0;
    }
  }
};

/**
 * Convert a raw hex color into its color-corrected display hex.
 *
 * @param hex Raw hex color ("RRGGBB", linear RGB)
 * @returns Corrected hex color ("RRGGBB", GBC display space)
 */
export const rawHexToCorrectedHex = (hex: RawHex): CorrectedHex => {
  return hex2GBChex(rawHexToClosestRepresentableRawHex(hex), "default");
};

/**
 * Convert an 8-bit channel to nearest 5-bit GBC channel.
 */
const channel8To5 = (c8: number) => clamp31(Math.round((c8 * 31) / 255));

/**
 * Convert a 5-bit GBC channel to its canonical 8-bit representation.
 */
const channel5To8 = (c5: number) => Math.round((c5 * 255) / 31);

/**
 * Snap any raw hex color to the closest *representable* raw hex color.
 *
 * @param hex Raw hex color ("RRGGBB", arbitrary linear RGB)
 * @returns Raw hex color ("RRGGBB", canonical GBC-representable space)
 *
 * @remarks
 * Use this when storing user-provided raw colors.
 */
export const rawHexToClosestRepresentableRawHex = (
  hex: RawHex,
): CanonicalRawHex => {
  const r8 = Math.floor(hexDec(hex.substring(0, 2)));
  const g8 = Math.floor(hexDec(hex.substring(2, 4)));
  const b8 = Math.floor(hexDec(hex.substring(4)));

  const r5 = channel8To5(r8);
  const g5 = channel8To5(g8);
  const b5 = channel8To5(b8);

  const r = channel5To8(r5);
  const g = channel5To8(g5);
  const b = channel5To8(b5);

  return ((r << 16) | (g << 8) | b)
    .toString(16)
    .padStart(6, "0")
    .toLowerCase() as CanonicalRawHex;
};
