import type { UsageData } from "lib/compiler/romUsage";

export const ROM_SIZES = [
  128 * 1024, // 128 KiB
  256 * 1024, // 256 KiB
  512 * 1024, // 512 KiB
  1 * 1024 * 1024, // 1 MiB
  2 * 1024 * 1024, // 2 MiB
  4 * 1024 * 1024, // 4 MiB
];

export const MAX_ROM_SIZE = ROM_SIZES[ROM_SIZES.length - 1];

export interface RomUsageStats {
  used: number;
  requiredSize: number;
  nextSize: number | undefined;
  romUsedPercent: number;
  maxRomUsedPercent: number;
}

export const calculateRomUsageStats = (
  usageData: Pick<UsageData, "banks">,
): RomUsageStats => {
  const used = usageData.banks.reduce(
    (total, bank) => total + Number(bank.used),
    0,
  );

  const requiredSizeIndex = ROM_SIZES.findIndex((size) => used <= size);
  const fitsAvailableSize = requiredSizeIndex !== -1;

  const requiredSize = fitsAvailableSize
    ? ROM_SIZES[requiredSizeIndex]
    : MAX_ROM_SIZE;

  const nextSize =
    fitsAvailableSize && requiredSizeIndex < ROM_SIZES.length - 1
      ? ROM_SIZES[requiredSizeIndex + 1]
      : undefined;

  return {
    used,
    requiredSize,
    nextSize,
    romUsedPercent: Math.min(100, (used * 100) / requiredSize),
    maxRomUsedPercent: Math.min(100, (used * 100) / MAX_ROM_SIZE),
  };
};

export const bytesToHumanReadable = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${parseFloat(kb.toFixed(2))} KiB`;
  }

  const mb = bytes / (1024 * 1024);
  return `${parseFloat(mb.toFixed(2))} MiB`;
};
