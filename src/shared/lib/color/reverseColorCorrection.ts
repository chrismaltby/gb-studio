import {
  CanonicalRawHex,
  CorrectedHex,
  rgb2hex,
  rgb5BitToGBCHex,
} from "shared/lib/helpers/color";

const correctedHexToCanonicalHexCache: Record<string, CanonicalRawHex> = {};

let GBC_LUT: Map<number, number> | null = null;

/**
 * Lookup table mapping:
 *
 * corrected hex (display space) → raw hex (canonical representable space)
 */
const getLut = () => {
  if (GBC_LUT) return GBC_LUT;

  const lut = new Map<number, number>();
  for (let r = 0; r < 32; r++) {
    for (let g = 0; g < 32; g++) {
      for (let b = 0; b < 32; b++) {
        const raw =
          ((Math.round((r / 31) * 255) << 16) |
            (Math.round((g / 31) * 255) << 8) |
            Math.round((b / 31) * 255)) >>>
          0;

        const corrected = parseInt(rgb5BitToGBCHex(r, g, b), 16) >>> 0;

        lut.set(corrected, raw);
      }
    }
  }

  GBC_LUT = lut;

  return lut;
};

/**
 * Squared RGB distance between two 24-bit hex colors.
 * @param a  24-bit hex color integer
 * @param b  24-bit hex color integer
 * @returns squared distance
 */
const distSq = (a: number, b: number) => {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;

  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;

  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;

  return dr * dr + dg * dg + db * db;
};

/**
 * Convert a corrected hex color back into a canonical raw hex color.
 *
 * @param hex Corrected hex color ("RRGGBB", GBC display space)
 * @returns Raw hex color ("RRGGBB", canonical representable space)
 */
export const correctedHexToCanonicalHex = (
  hex: CorrectedHex,
): CanonicalRawHex => {
  if (correctedHexToCanonicalHexCache[hex]) {
    return correctedHexToCanonicalHexCache[hex];
  }

  const lut = getLut();
  const corrected = parseInt(hex, 16) >>> 0;

  const exact = lut.get(corrected);
  if (exact !== undefined) {
    return exact.toString(16).padStart(6, "0").toLowerCase() as CanonicalRawHex;
  }

  let bestRaw = 0;
  let bestDist = Infinity;

  for (const [c, r] of lut) {
    const d = distSq(corrected, c);
    if (d < bestDist) {
      bestDist = d;
      bestRaw = r;
      if (d === 0) break;
    }
  }

  const result = bestRaw
    .toString(16)
    .padStart(6, "0")
    .toLowerCase() as CanonicalRawHex;

  correctedHexToCanonicalHexCache[hex] = result;

  return result;
};

/**
 * Convert an RGB pixel value (already in display / corrected space)
 * into the canonical raw hex color whose GBC-corrected appearance
 * best matches that pixel.
 *
 * @param r Red   (0–255)
 * @param g Green (0–255)
 * @param b Blue  (0–255)
 * @returns Raw hex color ("RRGGBB", canonical representable space)
 */
export const correctedRGBToCanonicalHex = (
  r: number,
  g: number,
  b: number,
): CanonicalRawHex => {
  return correctedHexToCanonicalHex(rgb2hex(r, g, b) as CorrectedHex);
};
