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

describe("calculateMemoryUsage", () => {
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
      size: 128 * KB,
      maxSize: 4 * MB,
      nextSize: 256 * KB,
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

    expect(rom.size).toBe(128 * KB);
    expect(rom.maxSize).toBe(4 * MB);
    expect(rom.nextSize).toBe(256 * KB);
  });

  test("does not move up when usage is exactly on a ROM-size boundary", () => {
    const rom = summariseRom(128 * KB);

    expect(rom.size).toBe(128 * KB);
    expect(rom.nextSize).toBe(256 * KB);
  });

  test("moves up when usage is one byte over a ROM-size boundary", () => {
    const rom = summariseRom(128 * KB + 1);

    expect(rom.size).toBe(256 * KB);
    expect(rom.nextSize).toBe(512 * KB);
  });

  test("uses the MBC3 maximum capacity", () => {
    const rom = summariseRom(2 * MB, "mbc3");

    expect(rom.size).toBe(2 * MB);
    expect(rom.maxSize).toBe(2 * MB);
    expect(rom.nextSize).toBeUndefined();
  });

  test("uses the MBC5 maximum capacity", () => {
    const rom = summariseRom(4 * MB, "mbc5");

    expect(rom.size).toBe(4 * MB);
    expect(rom.maxSize).toBe(4 * MB);
    expect(rom.nextSize).toBeUndefined();
  });

  test("uses the maximum size when usage exceeds cartridge capacity", () => {
    const rom = summariseRom(2 * MB + 1, "mbc3");

    expect(rom.used).toBe(2 * MB + 1);
    expect(rom.size).toBe(2 * MB);
    expect(rom.maxSize).toBe(2 * MB);
    expect(rom.nextSize).toBeUndefined();
  });

  test("has no next size at maximum cartridge capacity", () => {
    const rom = summariseRom(2 * MB - 1, "mbc3");

    expect(rom.size).toBe(2 * MB);
    expect(rom.maxSize).toBe(2 * MB);
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
          size: 128 * KB,
          maxSize: 2 * MB,
          nextSize: 256 * KB,
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
