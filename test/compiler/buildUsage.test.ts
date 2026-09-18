import Path from "path";
import {
  collectBuildUsage,
  romCapacityForCartType,
  calculateMemoryUsage,
} from "lib/compiler/buildUsage";
import romUsage, { parseRomUsage } from "lib/compiler/romUsage";
import type { BuildManifest } from "lib/compiler/buildManifest";
import {
  analyseBuildObjects,
  analyseMusicDriverUsage,
  type BuildModuleUsage,
} from "lib/compiler/buildModuleUsage";
import { readFileSync } from "fs";

jest.mock("lib/compiler/romUsage", () => ({
  ...jest.requireActual("lib/compiler/romUsage"),
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("lib/compiler/buildModuleUsage", () => ({
  analyseBuildObjects: jest.fn(),
  analyseMusicDriverUsage: jest.fn(),
}));

const mockedRomUsage = romUsage as jest.MockedFunction<typeof romUsage>;
const mockedAnalyseBuildObjects = analyseBuildObjects as jest.MockedFunction<
  typeof analyseBuildObjects
>;
const mockedAnalyseMusicDriverUsage =
  analyseMusicDriverUsage as jest.MockedFunction<
    typeof analyseMusicDriverUsage
  >;

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

const scriptMap = {
  project: [
    {
      sceneId: "",
      entityId: "custom-event-1",
      entityType: "customEvent" as const,
      scriptKey: "script",
    },
  ],
};

const modules: BuildModuleUsage[] = [
  {
    sourceFile: "src/core/engine.c",
    origin: { type: "engine" },
    usage: { bank0: 6000, wram: 1000, bankedRom: 3000 },
  },
  {
    sourceFile: "src/data/project.c",
    origin: { type: "project" },
    usage: { bank0: 100, wram: 0, bankedRom: 2000 },
  },
  {
    sourceFile: "src/plugin.c",
    origin: {
      type: "plugin",
      pluginName: "ExamplePlugin",
      replacesDefault: false,
    },
    usage: { bank0: 0, wram: 0, bankedRom: 100 },
  },
];

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
    mockedAnalyseBuildObjects.mockResolvedValue(modules);
    mockedAnalyseMusicDriverUsage.mockResolvedValue({
      bank0: 500,
      wram: 100,
      bankedRom: 0,
    });
  });

  test("returns complete aggregate memory after a successful build", async () => {
    await expect(
      collectBuildUsage({
        manifest,
        scriptMap,
        mode: "complete",
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
      overview: {
        cartType: "mbc3",
        engine: { bank0: 6000, wram: 1000, bankedRom: 3000 },
        musicDriver: { bank0: 500, wram: 100, bankedRom: 0 },
        gbdkRuntime: { bank0: 5400, wram: 1228, bankedRom: 2900 },
        project: { bank0: 100, wram: 0, bankedRom: 2000 },
        plugins: { bank0: 0, wram: 0, bankedRom: 100 },
        reserved: { bank0: 0, wram: 672, bankedRom: 0 },
        total: { bank0: 12000, wram: 3000, bankedRom: 8000 },
        maximum: { bank0: 16384, wram: 8192, bankedRom: 127 * 16384 },
        remaining: {
          bank0: 4384,
          wram: 5192,
          bankedRom: 126 * 16384 + 8384,
        },
      },
      plugins: [
        {
          pluginName: "ExamplePlugin",
          usage: { bank0: 0, wram: 0, bankedRom: 100 },
          files: [
            {
              sourceFile: "src/plugin.c",
              usage: { bank0: 0, wram: 0, bankedRom: 100 },
              replacesDefault: false,
            },
          ],
        },
      ],
      scripts: [
        {
          symbol: "project",
          size: 2100,
          sources: scriptMap.project,
        },
      ],
      sources: [
        {
          sourceFile: "src/core/engine.c",
          usage: { bank0: 6000, wram: 1000, bankedRom: 3000 },
        },
        {
          sourceFile: "src/data/project.c",
          usage: { bank0: 100, wram: 0, bankedRom: 2000 },
        },
        {
          sourceFile: "src/plugin.c",
          usage: { bank0: 0, wram: 0, bankedRom: 100 },
        },
      ],
    });
    expect(mockedRomUsage).toHaveBeenCalledWith({
      manifest,
      tmpPath: "/tmp",
      progress,
      warnings,
    });
    expect(mockedAnalyseBuildObjects).toHaveBeenCalledWith({
      manifest,
      allowMissing: false,
    });
    expect(mockedAnalyseMusicDriverUsage).toHaveBeenCalledWith({
      manifest,
    });
  });

  test("returns current object usage without reading linked artifacts in partial mode", async () => {
    mockedAnalyseBuildObjects.mockResolvedValue([
      {
        sourceFile: "src/data/project.s",
        origin: { type: "project" },
        usage: { bank0: 0, wram: 4, bankedRom: 20682 },
      },
    ]);

    await expect(
      collectBuildUsage({
        manifest,
        scriptMap,
        mode: "partial",
        tmpPath: "/tmp",
        progress,
        warnings,
      }),
    ).resolves.toEqual({
      status: "partial",
      plugins: [],
      scripts: [{ symbol: "project", size: 20682, sources: scriptMap.project }],
      sources: [
        {
          sourceFile: "src/data/project.s",
          usage: { bank0: 0, wram: 4, bankedRom: 20682 },
        },
      ],
    });
    expect(mockedAnalyseBuildObjects).toHaveBeenCalledWith({
      manifest,
      allowMissing: true,
    });
    expect(mockedRomUsage).not.toHaveBeenCalled();
    expect(mockedAnalyseMusicDriverUsage).not.toHaveBeenCalled();
  });

  test("groups plugin files, preserves replacements, and sorts deterministically", async () => {
    mockedAnalyseBuildObjects.mockResolvedValue([
      {
        sourceFile: "src/z-added.c",
        origin: {
          type: "plugin",
          pluginName: "ExamplePlugin",
          replacesDefault: false,
        },
        usage: { bank0: 10, wram: 20, bankedRom: 30 },
      },
      {
        sourceFile: "src/core/actor.c",
        origin: {
          type: "plugin",
          pluginName: "ExamplePlugin",
          replacesDefault: true,
        },
        usage: { bank0: 40, wram: 50, bankedRom: 60 },
      },
      {
        sourceFile: "src/another.c",
        origin: {
          type: "plugin",
          pluginName: "AnotherPlugin",
          replacesDefault: false,
        },
        usage: { bank0: 1, wram: 2, bankedRom: 3 },
      },
    ]);

    const result = await collectBuildUsage({
      manifest,
      scriptMap,
      mode: "complete",
      tmpPath: "/tmp",
      progress,
      warnings,
    });

    expect(result.status).toBe("complete");
    if (result.status !== "complete") {
      return;
    }
    expect(result.plugins).toEqual([
      {
        pluginName: "AnotherPlugin",
        usage: { bank0: 1, wram: 2, bankedRom: 3 },
        files: [
          {
            sourceFile: "src/another.c",
            usage: { bank0: 1, wram: 2, bankedRom: 3 },
            replacesDefault: false,
          },
        ],
      },
      {
        pluginName: "ExamplePlugin",
        usage: { bank0: 50, wram: 70, bankedRom: 90 },
        files: [
          {
            sourceFile: "src/core/actor.c",
            usage: { bank0: 40, wram: 50, bankedRom: 60 },
            replacesDefault: true,
          },
          {
            sourceFile: "src/z-added.c",
            usage: { bank0: 10, wram: 20, bankedRom: 30 },
            replacesDefault: false,
          },
        ],
      },
    ]);
  });

  test("reports unavailable usage rather than a negative runtime", async () => {
    mockedAnalyseBuildObjects.mockResolvedValue([
      {
        sourceFile: "src/core/too-large.c",
        origin: { type: "engine" },
        usage: { bank0: 12001, wram: 0, bankedRom: 0 },
      },
    ]);
    mockedAnalyseMusicDriverUsage.mockResolvedValue({
      bank0: 0,
      wram: 0,
      bankedRom: 0,
    });

    await expect(
      collectBuildUsage({
        manifest,
        scriptMap,
        mode: "complete",
        tmpPath: "/tmp",
        progress,
        warnings,
      }),
    ).resolves.toEqual({ status: "unavailable" });
    expect(warnings).toHaveBeenCalledWith(
      expect.stringContaining("exceeds linked bank0 usage"),
    );
  });

  test("reports analysis failure when romusage fails after a successful build", async () => {
    mockedRomUsage.mockRejectedValue(new Error("romusage failed"));

    await expect(
      collectBuildUsage({
        manifest,
        scriptMap,
        mode: "complete",
        tmpPath: "/tmp",
        progress,
        warnings,
      }),
    ).resolves.toEqual({ status: "unavailable" });
    expect(warnings).toHaveBeenCalledWith("romusage failed");
  });
});
