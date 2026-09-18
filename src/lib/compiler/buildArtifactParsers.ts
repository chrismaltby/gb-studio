import type { CartType } from "shared/lib/resources/types";
import { ROM_BANK_SIZE } from "shared/lib/compiler/memoryLayout";

export type MemoryRegion = "bank0" | "bankedRom" | "wram" | "other";

export type RegionUsage = {
  bank0: number;
  wram: number;
  bankedRom: number;
};

export const BANK_0_SIZE = ROM_BANK_SIZE;
export const WRAM_SIZE = 8 * 1024;

const MAX_ROM_BANK: Record<CartType, number> = {
  mbc5: 255,
  mbc3: 127,
};

export const capacityForCartType = (cartType: CartType): RegionUsage => ({
  bank0: BANK_0_SIZE,
  wram: WRAM_SIZE,
  bankedRom: MAX_ROM_BANK[cartType] * BANK_0_SIZE,
});

const NAMED_AREA_REGIONS: Record<string, MemoryRegion> = {
  _CODE: "bank0",
  _HOME: "bank0",
  _GSINIT: "bank0",
  _GSFINAL: "bank0",
  _INITIALIZER: "bank0",
  _LIT: "bank0",
  _DATA: "wram",
  _BSS: "wram",
  _INITIALIZED: "wram",
};

export const classifyAreaName = (name: string): MemoryRegion => {
  const banked = /^_CODE_(\d+)$/.exec(name);
  if (banked) {
    return banked[1] === "0" ? "bank0" : "bankedRom";
  }
  if (name.startsWith("_HEADER") || name.startsWith("_CRASH")) {
    return "bank0";
  }
  return NAMED_AREA_REGIONS[name] ?? "other";
};

export const parseObjectAreaSizes = (
  source: string,
): Record<string, number> => {
  const sizes: Record<string, number> = {};
  let areaCount = 0;
  for (const line of source.split(/\r?\n/)) {
    if (!line.startsWith("A ")) continue;
    const match = /^A (\S+) size ([0-9A-Fa-f]+) flags/.exec(line);
    if (!match) {
      throw new Error(`Invalid object area: "${line}"`);
    }
    areaCount++;
    const size = parseInt(match[2], 16);
    if (size > 0) sizes[match[1]] = (sizes[match[1]] ?? 0) + size;
  }
  if (areaCount === 0) {
    throw new Error("Build artifact contains no area records");
  }
  return sizes;
};
