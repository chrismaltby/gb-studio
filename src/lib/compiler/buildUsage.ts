import romUsage, { type RomUsageBank, type RomUsageData } from "./romUsage";
import type { CartType } from "shared/lib/resources/types";
import type { BuildManifest } from "lib/compiler/buildManifest";

const ROM_BANK_SIZE = 16 * 1024;

const ROM_SIZES = [
  128 * 1024,
  256 * 1024,
  512 * 1024,
  1 * 1024 * 1024,
  2 * 1024 * 1024,
  4 * 1024 * 1024,
];

export type MemoryRegionUsage = {
  used: number;
  size: number;
};

export type RomMemoryUsage = MemoryRegionUsage & {
  requiredSize: number;
  nextSize?: number;
  usedPercent: number;
  maxUsedPercent: number;
};

export type BuildUsageMemory = {
  rom: RomMemoryUsage;
  bank0: MemoryRegionUsage;
  wram: MemoryRegionUsage;
};

export type UsageData =
  | {
      status: "complete";
      memory: BuildUsageMemory;
    }
  | {
      status: "failed";
    };

const MAX_ROM_BANK: Record<CartType, number> = {
  mbc5: 255,
  mbc3: 127,
};

export const romCapacityForCartType = (cartType: CartType): number =>
  (MAX_ROM_BANK[cartType] + 1) * ROM_BANK_SIZE;

const isRomBank = (bank: RomUsageBank) => bank.name.startsWith("ROM_");

const isRomBank0 = (bank: RomUsageBank) => bank.name === "ROM_0";

const isWramBank = (bank: RomUsageBank) =>
  bank.name === "WRAM_LO" || bank.name === "WRAM_HI_0";

const sumUsage = (
  banks: RomUsageBank[],
  filter: (bank: RomUsageBank) => boolean,
): MemoryRegionUsage => {
  let used = 0;
  let size = 0;
  for (const bank of banks) {
    if (filter(bank)) {
      used += bank.used;
      size += bank.size;
    }
  }
  return { used, size };
};

const calculateRomUsage = (
  used: number,
  maxRomSize: number,
): RomMemoryUsage => {
  const requiredSize =
    ROM_SIZES.find((size) => size >= used && size <= maxRomSize) ?? maxRomSize;

  const nextSize = ROM_SIZES.find(
    (size) => size > requiredSize && size <= maxRomSize,
  );

  return {
    used,
    size: maxRomSize,
    requiredSize,
    ...(nextSize !== undefined ? { nextSize } : {}),
    usedPercent: Math.min(100, (used * 100) / requiredSize),
    maxUsedPercent: Math.min(100, (used * 100) / maxRomSize),
  };
};

export const calculateMemoryUsage = (
  usageData: RomUsageData,
  romCapacity: number,
): BuildUsageMemory => ({
  rom: calculateRomUsage(
    sumUsage(usageData.banks, isRomBank).used,
    romCapacity,
  ),
  bank0: sumUsage(usageData.banks, isRomBank0),
  wram: sumUsage(usageData.banks, isWramBank),
});

export const collectBuildUsage = async ({
  manifest,
  tmpPath,
  progress,
  warnings,
}: {
  manifest: BuildManifest;
  tmpPath: string;
  progress: (message: string) => void;
  warnings: (message: string) => void;
}): Promise<UsageData> => {
  try {
    const usageData = await romUsage({
      manifest,
      tmpPath,
      progress,
      warnings,
    });

    return {
      status: "complete",
      memory: calculateMemoryUsage(
        usageData,
        romCapacityForCartType(manifest.cartType),
      ),
    };
  } catch (error) {
    warnings(error instanceof Error ? error.message : String(error));
    return {
      status: "failed",
    };
  }
};
