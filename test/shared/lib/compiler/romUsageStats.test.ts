import type { UsageData } from "lib/compiler/romUsage";
import {
  calculateRomUsageStats,
  bytesToHumanReadable,
  MAX_ROM_SIZE,
} from "shared/lib/compiler/romUsageStats";

const KB = 1024;
const MB = 1024 * 1024;

const usageData = (...bankUsage: number[]) =>
  ({
    banks: bankUsage.map((used) => ({
      used: String(used),
    })),
  }) as UsageData;

describe("calculateRomUsageStats", () => {
  it("uses the smallest ROM size that can contain the build", () => {
    const stats = calculateRomUsageStats(usageData(100 * KB));

    expect(stats.used).toBe(100 * KB);
    expect(stats.requiredSize).toBe(128 * KB);
    expect(stats.nextSize).toBe(256 * KB);
    expect(stats.romUsedPercent).toBeCloseTo(78.125);
    expect(stats.maxRomUsedPercent).toBeCloseTo(2.44140625);
  });

  it("does not move to the next ROM size when exactly at a size boundary", () => {
    const stats = calculateRomUsageStats(usageData(128 * KB));

    expect(stats.requiredSize).toBe(128 * KB);
    expect(stats.nextSize).toBe(256 * KB);
    expect(stats.romUsedPercent).toBe(100);
  });

  it("moves to the next ROM size when one byte over a size boundary", () => {
    const stats = calculateRomUsageStats(usageData(128 * KB + 1));

    expect(stats.requiredSize).toBe(256 * KB);
    expect(stats.nextSize).toBe(512 * KB);
    expect(stats.romUsedPercent).toBeCloseTo(
      ((128 * KB + 1) * 100) / (256 * KB),
    );
  });

  it("sums usage across all ROM banks", () => {
    const stats = calculateRomUsageStats(
      usageData(16 * KB, 32 * KB, 64 * KB, 16 * KB),
    );

    expect(stats.used).toBe(128 * KB);
    expect(stats.requiredSize).toBe(128 * KB);
    expect(stats.romUsedPercent).toBe(100);
  });

  it("reports 4 MiB as the maximum ROM size", () => {
    const stats = calculateRomUsageStats(usageData(4 * MB));

    expect(stats.used).toBe(4 * MB);
    expect(stats.requiredSize).toBe(MAX_ROM_SIZE);
    expect(stats.requiredSize).toBe(4 * MB);
    expect(stats.nextSize).toBeUndefined();
    expect(stats.romUsedPercent).toBe(100);
    expect(stats.maxRomUsedPercent).toBe(100);
  });

  it("caps percentages at 100 when usage exceeds the maximum ROM size", () => {
    const stats = calculateRomUsageStats(usageData(4 * MB + 1));

    expect(stats.used).toBe(4 * MB + 1);
    expect(stats.requiredSize).toBe(4 * MB);
    expect(stats.nextSize).toBeUndefined();
    expect(stats.romUsedPercent).toBe(100);
    expect(stats.maxRomUsedPercent).toBe(100);
  });
});

describe("bytesToHumanReadable", () => {
  it("renders values below 1 KiB as bytes", () => {
    expect(bytesToHumanReadable(512)).toBe("512 bytes");
  });

  it("renders KiB values", () => {
    expect(bytesToHumanReadable(128 * KB)).toBe("128 KiB");
    expect(bytesToHumanReadable(1536)).toBe("1.5 KiB");
  });

  it("renders MiB values", () => {
    expect(bytesToHumanReadable(4 * MB)).toBe("4 MiB");
    expect(bytesToHumanReadable(1.5 * MB)).toBe("1.5 MiB");
  });
});
