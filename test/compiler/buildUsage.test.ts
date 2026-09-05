import Path from "path";
import {
  collectBuildUsage,
  romCapacityForCartType,
  calculateMemoryUsage,
} from "lib/compiler/buildUsage";
import romUsage, { parseRomUsage } from "lib/compiler/romUsage";
import type { BuildManifest } from "lib/compiler/buildManifest";
import { readFileSync } from "fs";

jest.mock("lib/compiler/romUsage", () => ({
  ...jest.requireActual("lib/compiler/romUsage"),
  __esModule: true,
  default: jest.fn(),
}));

const mockedRomUsage = romUsage as jest.MockedFunction<typeof romUsage>;

const KB = 1024;
const MB = 1024 * 1024;
const romUsage132 = parseRomUsage(
  readFileSync(`${__dirname}/_files/romusage-1.3.2.json`, "utf8"),
);

const manifest: BuildManifest = {
  buildRoot: "/build",
  cartType: "mbc3",
  sources: [],
  artifacts: {
    romPath: Path.join("/build", "build", "rom", "game.gb"),
    mapPath: Path.join("/build", "build", "rom", "game.map"),
    noiPath: Path.join("/build", "build", "rom", "game.noi"),
  },
};

const usageData = {
  banks: [
    { name: "ROM_0", size: 16384, used: 12000 },
    { name: "ROM_1", size: 16384, used: 8000 },
    { name: "WRAM_LO", size: 4096, used: 2000 },
    { name: "WRAM_HI_0", size: 4096, used: 1000 },
  ],
};

describe("summariseBuildUsage", () => {
  test("classifies banks from bundled romusage 1.3.2 output", () => {
    const memory = calculateMemoryUsage(
      romUsage132,
      romCapacityForCartType("mbc5"),
    );

    expect(memory.rom.used).toBe(143343);
    expect(memory.bank0).toEqual({ used: 16092, size: 16384 });
    expect(memory.wram).toEqual({ used: 7349, size: 8192 });
  });

  test("calculates ROM, Bank 0, and WRAM totals", () => {
    const memory = calculateMemoryUsage(
      {
        banks: [...usageData.banks, { name: "VRAM", size: 8192, used: 4000 }],
      },
      romCapacityForCartType("mbc5"),
    );

    expect(memory.rom).toEqual({
      used: 20000,
      size: 4 * MB,
      requiredSize: 128 * KB,
      nextSize: 256 * KB,
      usedPercent: (20000 * 100) / (128 * KB),
      maxUsedPercent: (20000 * 100) / (4 * MB),
    });
    expect(memory.bank0).toEqual({ used: 12000, size: 16384 });
    expect(memory.wram).toEqual({ used: 3000, size: 8192 });
  });

  test("uses the cartridge capacity", () => {
    expect(romCapacityForCartType("mbc3")).toBe(2 * 1024 * 1024);
    expect(romCapacityForCartType("mbc5")).toBe(4 * 1024 * 1024);
  });
});

describe("ROM sizing", () => {
  const summariseRom = (used: number, cartType: "mbc3" | "mbc5" = "mbc5") =>
    calculateMemoryUsage(
      { banks: [{ name: "ROM_0", size: 16 * KB, used }] },
      romCapacityForCartType(cartType),
    ).rom;

  test("uses 128 KiB for usage below the smallest ROM size", () => {
    const rom = summariseRom(100 * KB);

    expect(rom.requiredSize).toBe(128 * KB);
    expect(rom.nextSize).toBe(256 * KB);
    expect(rom.usedPercent).toBeCloseTo(78.125);
    expect(rom.maxUsedPercent).toBeCloseTo(2.44140625);
  });

  test("does not move up when usage is exactly on a ROM-size boundary", () => {
    const rom = summariseRom(128 * KB);

    expect(rom.requiredSize).toBe(128 * KB);
    expect(rom.nextSize).toBe(256 * KB);
    expect(rom.usedPercent).toBe(100);
  });

  test("moves up when usage is one byte over a ROM-size boundary", () => {
    const rom = summariseRom(128 * KB + 1);

    expect(rom.requiredSize).toBe(256 * KB);
    expect(rom.nextSize).toBe(512 * KB);
    expect(rom.usedPercent).toBeCloseTo(((128 * KB + 1) * 100) / (256 * KB));
  });

  test("uses the MBC3 maximum capacity", () => {
    const rom = summariseRom(2 * MB, "mbc3");

    expect(rom.size).toBe(2 * MB);
    expect(rom.requiredSize).toBe(2 * MB);
    expect(rom.nextSize).toBeUndefined();
    expect(rom.maxUsedPercent).toBe(100);
  });

  test("uses the MBC5 maximum capacity", () => {
    const rom = summariseRom(4 * MB, "mbc5");

    expect(rom.size).toBe(4 * MB);
    expect(rom.requiredSize).toBe(4 * MB);
    expect(rom.nextSize).toBeUndefined();
    expect(rom.maxUsedPercent).toBe(100);
  });

  test("caps sizes and percentages when usage exceeds cartridge capacity", () => {
    const rom = summariseRom(2 * MB + 1, "mbc3");

    expect(rom.requiredSize).toBe(2 * MB);
    expect(rom.usedPercent).toBe(100);
    expect(rom.maxUsedPercent).toBe(100);
  });

  test("has no next size at maximum cartridge capacity", () => {
    const rom = summariseRom(2 * MB - 1, "mbc3");

    expect(rom.requiredSize).toBe(2 * MB);
    expect(rom.nextSize).toBeUndefined();
  });
});

describe("collectBuildUsage", () => {
  const progress = jest.fn();
  const warnings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedRomUsage.mockResolvedValue(usageData);
  });

  test("returns complete aggregate memory after a successful build", async () => {
    await expect(
      collectBuildUsage({
        manifest,
        tmpPath: "/tmp",
        progress,
        warnings,
      }),
    ).resolves.toEqual({
      status: "complete",
      memory: {
        rom: {
          used: 20000,
          size: 2 * MB,
          requiredSize: 128 * KB,
          nextSize: 256 * KB,
          usedPercent: (20000 * 100) / (128 * KB),
          maxUsedPercent: (20000 * 100) / (2 * MB),
        },
        bank0: { used: 12000, size: 16384 },
        wram: { used: 3000, size: 8192 },
      },
    });
    expect(mockedRomUsage).toHaveBeenCalledWith({
      manifest,
      tmpPath: "/tmp",
      progress,
      warnings,
    });
  });

  test("reports analysis failure when romusage fails after a successful build", async () => {
    mockedRomUsage.mockRejectedValue(new Error("romusage failed"));

    await expect(
      collectBuildUsage({
        manifest,
        tmpPath: "/tmp",
        progress,
        warnings,
      }),
    ).resolves.toEqual({ status: "failed" });
    expect(warnings).toHaveBeenCalledWith("romusage failed");
  });
});
