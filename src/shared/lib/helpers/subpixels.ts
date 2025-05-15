import { NUM_SUBPIXEL_BITS } from "consts";
import type { DistanceUnitType } from "shared/lib/entities/entitiesTypes";

export const tileToSubpx = (x: number) =>
  Math.floor(x * (1 << (3 + NUM_SUBPIXEL_BITS)));

export const pxToSubpx = (x: number) =>
  Math.floor(x * (1 << NUM_SUBPIXEL_BITS));

export const subpxShiftForUnits = (units: DistanceUnitType) => {
  return units === "tiles" ? NUM_SUBPIXEL_BITS + 3 : NUM_SUBPIXEL_BITS;
};

export const unitsValueToSubpx = (x: number, units: DistanceUnitType) => {
  if (units === "tiles") {
    return tileToSubpx(x);
  }
  return pxToSubpx(x);
};
