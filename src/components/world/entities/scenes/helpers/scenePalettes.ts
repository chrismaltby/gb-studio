import { DMG_PALETTE } from "consts";
import { Palette } from "shared/lib/resources/types";

const PALETTE_COUNT = 8;

type PaletteLookup<Palette> = Record<string, Palette | undefined>;

export const dmgPalettes = [
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
  DMG_PALETTE,
];

const resolvePalette = (
  paletteIds: readonly (string | undefined)[] | undefined,
  defaultPaletteIds: readonly (string | undefined)[],
  palettesLookup: PaletteLookup<Palette>,
  paletteIndex: number,
): Palette => {
  const paletteId = paletteIds?.[paletteIndex];

  if (paletteId === "dmg") {
    return DMG_PALETTE;
  }

  return (
    palettesLookup[paletteId ?? ""] ||
    palettesLookup[defaultPaletteIds[paletteIndex] ?? ""] ||
    DMG_PALETTE
  );
};

export const resolveScenePalettes = (
  paletteIds: readonly (string | undefined)[] | undefined,
  defaultPaletteIds: readonly (string | undefined)[],
  palettesLookup: PaletteLookup<Palette>,
  colorsEnabled: boolean,
): Palette[] => {
  return colorsEnabled
    ? Array.from({ length: PALETTE_COUNT }, (_, index) =>
        resolvePalette(paletteIds, defaultPaletteIds, palettesLookup, index),
      )
    : dmgPalettes;
};
