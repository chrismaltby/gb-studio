import Solver from "3x3-equation-solver";
import { hexDec } from "shared/lib/helpers/8bit";
import clamp from "shared/lib/helpers/clamp";

const rgbToGBCCache: Record<string, string> = {};

/**
 * Convert hex to closest GBC compatible hex
 */
export const GBCHexToColorCorrectedHex = (hex: string) => {
  if (hex.toLowerCase() === "ff0000") return hex; // otherwise comes back as 31,3,0
  const r = Math.floor(hexDec(hex.substring(0, 2)));
  const g = Math.floor(hexDec(hex.substring(2, 4)));
  const b = Math.floor(hexDec(hex.substring(4)));
  return rgbToColorCorrectedHex(r, g, b);
};

/**
 * Convert rgb values to closest GBC compatible hex
 */
export const rgbToColorCorrectedHex = (
  r: number,
  g: number,
  b: number
): string => {
  const key = `${r}_${g}_${b}`;
  if (rgbToGBCCache[key]) {
    return rgbToGBCCache[key];
  }
  const clamp31 = (value: number) => {
    return clamp(value, 0, 31);
  };
  const [r2, g2, b2] = Solver([
    [13, 2, 1, r << 1],
    [0, 3, 1, g >> 1],
    [3, 2, 11, b << 1],
  ]);
  const hex = (
    (Math.round(255 * (clamp31(r2) / 31)) << 16) +
    (Math.round(255 * (clamp31(g2) / 31)) << 8) +
    Math.round(255 * (clamp31(b2) / 31))
  )
    .toString(16)
    .padStart(6, "0");
  rgbToGBCCache[key] = hex;
  return hex;
};
