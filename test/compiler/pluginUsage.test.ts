import fs from "fs-extra";
import os from "os";
import Path from "path";
import {
  analyzePluginUsage,
  classifyAreaAddress,
  classifyAreaName,
  formatPluginUsageReport,
  moduleNameForSource,
  parseMapAreas,
  parseObjectAreaSizes,
  WRAM_SIZE,
} from "lib/compiler/pluginUsage";
import type { PluginFileAttribution } from "lib/compiler/enginePlugins";
import { RESERVED_WRAM_BYTES } from "lib/compiler/buildMakeScript";
import en from "lang/en.json";
import {
  clearL10NData,
  setL10NData,
  type L10NLookup,
} from "shared/lib/lang/l10n";

const emptyAttribution = (): PluginFileAttribution => ({
  ownedFiles: {},
  overridesStock: [],
  patchedFiles: {},
});

describe("parseObjectAreaSizes", () => {
  test("It should read area sizes as hexadecimal", () => {
    const source = [
      "XL4",
      "H B areas 5C global symbols",
      "M actor",
      "S _actor_ref Def00000003",
      "A _CODE size 0 flags 0 addr 0",
      "A _HRAM size 3 flags 0 addr 0",
      "A _DATA size 59C flags 0 addr 0",
      "A _CODE_3 size EE6 flags 0 addr 0",
    ].join("\n");

    expect(parseObjectAreaSizes(source)).toEqual({
      _HRAM: 3,
      _DATA: 0x59c,
      _CODE_3: 0xee6,
    });
  });

  test("It should sum areas listed more than once", () => {
    const source = [
      "A _HOME size 10 flags 0 addr 0",
      "A _HOME size 20 flags 0 addr 0",
    ].join("\n");

    expect(parseObjectAreaSizes(source)).toEqual({ _HOME: 0x30 });
  });

  test("It should ignore lines that are not area records", () => {
    expect(parseObjectAreaSizes("S _foo Ref00000000\nT 00 00\n")).toEqual({});
  });
});

describe("parseMapAreas", () => {
  test("It should read area name, address and size", () => {
    const source = [
      "Area                                    Addr        Size        Decimal Bytes (Attributes)",
      "--------------------------------        ----        ----        ------- ----- ------------",
      "_CODE                               00000200    00000EB3 =        3763. bytes (REL,CON)",
      "_DATA                               0000C0A0    00001977 =        6519. bytes (REL,CON)",
      "_CODE_2                             00024000    00003FFA =       16378. bytes (REL,CON)",
    ].join("\n");

    expect(parseMapAreas(source)).toEqual([
      { name: "_CODE", addr: 0x200, size: 3763, isAbsolute: false },
      { name: "_DATA", addr: 0xc0a0, size: 6519, isAbsolute: false },
      { name: "_CODE_2", addr: 0x24000, size: 16378, isAbsolute: false },
    ]);
  });

  test("It should flag absolute areas, their address is always zero", () => {
    const source =
      "_HEADER11                           00000000    000000AB =         171. bytes (ABS,CON)";
    expect(parseMapAreas(source)).toEqual([
      { name: "_HEADER11", addr: 0, size: 171, isAbsolute: true },
    ]);
  });

  test("It should only count each area once when repeated across map pages", () => {
    const line =
      "_CODE                               00000200    00000EB3 =        3763. bytes (REL,CON)";
    expect(parseMapAreas([line, line, line].join("\n"))).toHaveLength(1);
  });

  test("It should ignore the absolute area header line", () => {
    const source =
      ".  .ABS.                            00000000    00000000 =           0. bytes (ABS,CON)";
    expect(parseMapAreas(source)).toEqual([]);
  });
});

describe("classifyAreaAddress", () => {
  test.each([
    [0x0000, "bank0"],
    [0x0200, "bank0"],
    [0x3fff, "bank0"],
    [0x4000, "bankedRom"],
    [0x14000, "bankedRom"],
    [0xff4000, "bankedRom"],
    [0x8000, "vram"],
    [0xa000, "sram"],
    [0xc0a0, "wram"],
    [0xdfff, "wram"],
    [0xff80, "hram"],
  ])("It should classify 0x%s as %s", (addr, expected) => {
    expect(classifyAreaAddress(addr)).toBe(expected);
  });

  test("It should count WRAM overflowing into echo RAM as WRAM", () => {
    expect(classifyAreaAddress(0xe3d8)).toBe("wram");
  });
});

describe("classifyAreaName", () => {
  test.each([
    ["_CODE", "bank0"],
    ["_HOME", "bank0"],
    ["_GSINIT", "bank0"],
    ["_CODE_0", "bank0"],
    ["_HEADER11", "bank0"],
    ["_CRASH_SCRATCH", "bank0"],
    ["_CODE_3", "bankedRom"],
    ["_CODE_255", "bankedRom"],
    ["_DATA", "wram"],
    ["_BSS", "wram"],
    ["_INITIALIZED", "wram"],
    ["_HRAM", "hram"],
    ["_SOMETHING_ELSE", "other"],
  ])("It should classify %s as %s", (name, expected) => {
    expect(classifyAreaName(name)).toBe(expected);
  });
});

describe("moduleNameForSource", () => {
  test("It should use the source basename, matching how objects are named", () => {
    expect(moduleNameForSource("src/core/meta_tiles.c")).toBe("meta_tiles");
    expect(moduleNameForSource("src/core/scroll.s")).toBe("scroll");
  });
});

describe("analyzePluginUsage", () => {
  let buildRoot = "";

  const writeObj = async (module: string, areas: string[], ext = ".rel") => {
    await fs.ensureDir(Path.join(buildRoot, "obj"));
    await fs.writeFile(
      Path.join(buildRoot, "obj", `${module}${ext}`),
      `M ${module}\n${areas.join("\n")}\n`,
    );
  };

  const writeMap = async (lines: string[]) => {
    await fs.ensureDir(Path.join(buildRoot, "build", "rom"));
    await fs.writeFile(
      Path.join(buildRoot, "build", "rom", "game.map"),
      lines.join("\n"),
    );
  };

  const writeSource = async (sourceFile: string) => {
    const fullPath = Path.join(buildRoot, sourceFile);
    await fs.ensureDir(Path.dirname(fullPath));
    await fs.writeFile(fullPath, "");
  };

  beforeEach(async () => {
    buildRoot = await fs.mkdtemp(Path.join(os.tmpdir(), "gbs-plugin-usage-"));
  });

  afterEach(async () => {
    await fs.remove(buildRoot);
  });

  test("It should attribute bank 0, WRAM and banked ROM per plugin", async () => {
    await writeObj("my_plugin", [
      "A _HOME size 100 flags 0 addr 0",
      "A _DATA size 20 flags 0 addr 0",
      "A _CODE_3 size 400 flags 0 addr 0",
    ]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: { "src/core/my_plugin.c": "MyPlugin" },
      },
    });

    expect(report.plugins).toHaveLength(1);
    expect(report.plugins[0]).toMatchObject({
      pluginName: "MyPlugin",
      bank0: 0x100,
      wram: 0x20,
      bankedRom: 0x400,
    });
    expect(report.totals).toEqual({
      bank0: 0x100,
      wram: 0x20,
      bankedRom: 0x400,
    });
  });

  test("It should sum multiple source files belonging to one plugin", async () => {
    await writeObj("part_one", ["A _HOME size 10 flags 0 addr 0"]);
    await writeObj("part_two", ["A _HOME size 20 flags 0 addr 0"]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: {
          "src/part_one.c": "MyPlugin",
          "src/part_two.c": "MyPlugin",
        },
      },
    });

    expect(report.plugins).toHaveLength(1);
    expect(report.plugins[0].bank0).toBe(0x30);
    expect(report.plugins[0].modules).toHaveLength(2);
  });

  test("It should mark modules that replace a stock engine file", async () => {
    await writeObj("scroll", ["A _HOME size 10 flags 0 addr 0"]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: { "src/core/scroll.c": "MyPlugin" },
        overridesStock: ["src/core/scroll.c"],
      },
    });

    expect(report.plugins[0].modules[0].overridesStock).toBe(true);
  });

  test("It should report patched stock files separately from plugin totals", async () => {
    await writeObj("core", [
      "A _HOME size 200 flags 0 addr 0",
      "A _DATA size 8 flags 0 addr 0",
    ]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        patchedFiles: { "src/core/core.c": ["PluginA", "PluginB"] },
      },
    });

    expect(report.plugins).toHaveLength(0);
    expect(report.totals).toEqual({ bank0: 0, wram: 0, bankedRom: 0 });
    expect(report.patched).toEqual([
      {
        module: "core",
        sourceFile: "src/core/core.c",
        plugins: ["PluginA", "PluginB"],
        bank0: 0x200,
        wram: 8,
        bankedRom: 0,
      },
    ]);
  });

  test("It should classify areas using the map file when one exists", async () => {
    // _CUSTOM_AREA is unknown by name, only the map says where it landed
    await writeObj("my_plugin", ["A _CUSTOM_AREA size 40 flags 0 addr 0"]);
    await writeMap([
      "_CUSTOM_AREA                        0000C500    00000040 =          64. bytes (REL,CON)",
    ]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: { "src/my_plugin.c": "MyPlugin" },
      },
    });

    expect(report.fromMap).toBe(true);
    expect(report.plugins[0].wram).toBe(0x40);
  });

  test("It should split base engine and project data from plugin usage", async () => {
    await writeObj("my_plugin", ["A _HOME size 10 flags 0 addr 0"]);
    await writeObj("core", ["A _HOME size 100 flags 0 addr 0"]);
    await writeObj("scene_0", ["A _CODE_3 size 500 flags 0 addr 0"]);
    await writeSource("src/my_plugin.c");
    await writeSource("src/core/core.c");
    await writeSource("src/data/scene_0.c");

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: { "src/my_plugin.c": "MyPlugin" },
      },
    });

    expect(report.totals.bank0).toBe(0x10);
    expect(report.baseEngine.bank0).toBe(0x100);
    expect(report.projectData.bankedRom).toBe(0x500);
    // Project data must not be double counted as engine code
    expect(report.baseEngine.bankedRom).toBe(0);
  });

  test("It should treat patched stock files as base engine usage", async () => {
    await writeObj("core", ["A _HOME size 100 flags 0 addr 0"]);
    await writeSource("src/core/core.c");

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        patchedFiles: { "src/core/core.c": ["PluginA"] },
      },
    });

    expect(report.baseEngine.bank0).toBe(0x100);
    expect(report.totals.bank0).toBe(0);
    expect(report.patched[0].bank0).toBe(0x100);
  });

  test("It should report remaining space, negative once a region is overrun", async () => {
    await writeMap([
      // Bank 0 has room left, WRAM has been overrun
      "_HOME                               00001121    00003000 =       12288. bytes (REL,CON)",
      "_DATA                               0000C0A0    00002100 =        8448. bytes (REL,CON)",
    ]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: emptyAttribution(),
      cartType: "mbc5",
    });

    expect(report.capacity).toEqual({
      bank0: 16384,
      wram: 8192,
      bankedRom: 255 * 16384,
    });
    // Reserved WRAM counts against the total, a game cannot use it
    expect(report.reserved).toEqual({
      bank0: 0,
      wram: RESERVED_WRAM_BYTES,
      bankedRom: 0,
    });
    expect(report.total).toEqual({
      bank0: 12288,
      wram: 8448 + RESERVED_WRAM_BYTES,
      bankedRom: 0,
    });
    expect(report.remaining).toEqual({
      bank0: 16384 - 12288,
      wram: 8192 - (8448 + RESERVED_WRAM_BYTES),
      bankedRom: 255 * 16384,
    });
    expect(report.remaining?.wram).toBeLessThan(0);
  });

  test("It should count reserved WRAM even when the linked total fits", async () => {
    await writeMap([
      // Inside the 8192 bytes of WRAM as far as the map is concerned
      "_DATA                               0000C0A0    00001E00 =        7680. bytes (REL,CON)",
    ]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: emptyAttribution(),
    });

    // Measured against the map alone this looks like it fits
    expect(report.linked?.wram).toBe(7680);
    expect(report.linked?.wram).toBeLessThan(WRAM_SIZE);
    // Once the engine's own reserve is counted it does not
    expect(report.total?.wram).toBe(7680 + RESERVED_WRAM_BYTES);
    expect(report.remaining?.wram).toBeLessThan(0);
  });

  test("It should size banked ROM capacity from the cart type", async () => {
    await writeMap([
      "_HOME                               00001121    00000100 =         256. bytes (REL,CON)",
    ]);

    const mbc3 = await analyzePluginUsage({
      buildRoot,
      attribution: emptyAttribution(),
      cartType: "mbc3",
    });

    expect(mbc3.capacity.bankedRom).toBe(127 * 16384);
    expect(mbc3.cartType).toBe("mbc3");
  });

  test("It should not report remaining space with no map file", async () => {
    const report = await analyzePluginUsage({
      buildRoot,
      attribution: emptyAttribution(),
    });

    expect(report.remaining).toBeUndefined();
    expect(report.capacity.bank0).toBe(16384);
  });

  test("It should attribute the rest of the linked output to the GBDK library", async () => {
    await writeObj("core", ["A _HOME size 100 flags 0 addr 0"]);
    await writeSource("src/core/core.c");
    await writeMap([
      "_HOME                               00001121    00000300 =         768. bytes (REL,CON)",
      "_HEADER11                           00000000    000000AB =         171. bytes (ABS,CON)",
    ]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: emptyAttribution(),
    });

    // Absolute areas are excluded, so the linked total is _HOME alone
    expect(report.linked).toEqual({ bank0: 768, wram: 0, bankedRom: 0 });
    expect(report.baseEngine.bank0).toBe(0x100);
    expect(report.library).toEqual({
      bank0: 768 - 0x100,
      wram: 0,
      bankedRom: 0,
    });
  });

  test("It should fall back to classifying by area name with no map file", async () => {
    await writeObj("my_plugin", ["A _DATA size 40 flags 0 addr 0"]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: { "src/my_plugin.c": "MyPlugin" },
      },
    });

    expect(report.fromMap).toBe(false);
    expect(report.plugins[0].wram).toBe(0x40);
  });

  test("It should read the .o when bankpack has not written a .rel", async () => {
    await writeObj("my_plugin", ["A _HOME size 12 flags 0 addr 0"], ".o");

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: { "src/my_plugin.c": "MyPlugin" },
      },
    });

    expect(report.plugins[0].bank0).toBe(0x12);
  });

  test("It should skip sources that were never compiled", async () => {
    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: { "src/never_built.c": "MyPlugin" },
      },
    });

    expect(report.plugins).toHaveLength(0);
  });

  test("It should order plugins by bank 0 usage", async () => {
    await writeObj("small", ["A _HOME size 10 flags 0 addr 0"]);
    await writeObj("large", ["A _HOME size 500 flags 0 addr 0"]);

    const report = await analyzePluginUsage({
      buildRoot,
      attribution: {
        ...emptyAttribution(),
        ownedFiles: {
          "src/small.c": "SmallPlugin",
          "src/large.c": "LargePlugin",
        },
      },
    });

    expect(report.plugins.map((p) => p.pluginName)).toEqual([
      "LargePlugin",
      "SmallPlugin",
    ]);
  });
});

describe("formatPluginUsageReport", () => {
  beforeAll(() => {
    // Load the real strings so the numbers substituted into them are checked
    setL10NData(en as L10NLookup);
  });

  afterAll(() => {
    clearL10NData();
  });

  test("It should list each plugin with its byte counts", () => {
    const lines = formatPluginUsageReport({
      plugins: [
        {
          pluginName: "MyPlugin",
          bank0: 128,
          wram: 32,
          bankedRom: 1024,
          modules: [
            {
              module: "my_plugin",
              sourceFile: "src/my_plugin.c",
              overridesStock: false,
              bank0: 128,
              wram: 32,
              bankedRom: 1024,
            },
          ],
        },
      ],
      patched: [],
      totals: { bank0: 128, wram: 32, bankedRom: 1024 },
      baseEngine: { bank0: 9000, wram: 6000, bankedRom: 40000 },
      projectData: { bank0: 0, wram: 100, bankedRom: 90000 },
      library: { bank0: 3000, wram: 200, bankedRom: 0 },
      linked: { bank0: 12128, wram: 6332, bankedRom: 131024 },
      reserved: { bank0: 0, wram: 672, bankedRom: 0 },
      capacity: { bank0: 16384, wram: 8192, bankedRom: 4177920 },
      cartType: "mbc5",
      remaining: { bank0: 4256, wram: 1860, bankedRom: 4046896 },
      fromMap: true,
    });

    const output = lines.join("\n");
    expect(output).toContain("MyPlugin");
    expect(output).toContain("src/my_plugin.c");
    expect(output).toContain("128 b");
    expect(output).toContain("32 b");
    expect(output).toContain("1024 b");
    // Nothing patched or replaced, so the engine row is plain
    expect(output).toContain("GB Studio engine ");
    expect(output).not.toContain("Modified by plugins");
    expect(output).toContain("9000 b");
    expect(output).toContain("Project data");
    expect(output).toContain("GBDK library and runtime");
    expect(output).toContain("Total compiled modules");
    expect(output).toContain("12128 b");
    expect(output).toContain("Maximum (MBC5)");
    expect(output).toContain("4177920 b");
    expect(output).toContain("Remaining");
    expect(output).toContain("4256 b");
    expect(output).toContain(
      "ROM bank 0 holds 16384 bytes, WRAM holds 8192 bytes",
    );
  });

  test("It should flag the engine row as inflated when a file is patched", () => {
    const lines = formatPluginUsageReport({
      plugins: [],
      patched: [
        {
          module: "core",
          sourceFile: "src/core/core.c",
          plugins: ["PluginA"],
          bank0: 986,
          wram: 1,
          bankedRom: 1144,
        },
      ],
      totals: { bank0: 0, wram: 0, bankedRom: 0 },
      baseEngine: { bank0: 10158, wram: 6725, bankedRom: 47412 },
      projectData: { bank0: 0, wram: 0, bankedRom: 0 },
      reserved: { bank0: 0, wram: 672, bankedRom: 0 },
      capacity: { bank0: 16384, wram: 8192, bankedRom: 4177920 },
      cartType: "mbc5",
      fromMap: false,
    });

    const output = lines.join("\n");
    expect(output).toContain(
      "GB Studio engine (Modified by plugins, see list below)",
    );
    expect(output).toContain("Stock engine files modified by plugins");
    expect(output).toContain("src/core/core.c");
    expect(output).toContain("patched by PluginA");
  });

  test("It should flag the engine row as inflated when a file is replaced", () => {
    const lines = formatPluginUsageReport({
      plugins: [
        {
          pluginName: "MyPlugin",
          bank0: 0,
          wram: 42,
          bankedRom: 2782,
          modules: [
            {
              module: "scene_transition",
              sourceFile: "src/core/scene_transition.c",
              overridesStock: true,
              bank0: 0,
              wram: 42,
              bankedRom: 2782,
            },
          ],
        },
      ],
      patched: [],
      totals: { bank0: 0, wram: 42, bankedRom: 2782 },
      baseEngine: { bank0: 10158, wram: 6725, bankedRom: 47412 },
      projectData: { bank0: 0, wram: 0, bankedRom: 0 },
      reserved: { bank0: 0, wram: 672, bankedRom: 0 },
      capacity: { bank0: 16384, wram: 8192, bankedRom: 4177920 },
      cartType: "mbc5",
      fromMap: false,
    });

    const output = lines.join("\n");
    expect(output).toContain(
      "GB Studio engine (Modified by plugins, see list below)",
    );
    // The list below must exist, otherwise the label points at nothing
    expect(output).toContain("Stock engine files modified by plugins");
    expect(output).toContain("replaced by MyPlugin");
  });

  test("It should warn when a region has been overrun", () => {
    const lines = formatPluginUsageReport({
      plugins: [],
      patched: [],
      totals: { bank0: 0, wram: 0, bankedRom: 0 },
      baseEngine: { bank0: 0, wram: 8465, bankedRom: 0 },
      projectData: { bank0: 0, wram: 0, bankedRom: 0 },
      linked: { bank0: 0, wram: 8465, bankedRom: 0 },
      reserved: { bank0: 0, wram: 672, bankedRom: 0 },
      capacity: { bank0: 16384, wram: 8192, bankedRom: 4177920 },
      cartType: "mbc5",
      remaining: { bank0: 16384, wram: -273, bankedRom: 4177920 },
      fromMap: true,
    });

    const output = lines.join("\n");
    expect(output).toContain("-273 b");
    expect(output).toContain("has been overrun");
  });

  test("It should not warn about overrun when every region fits", () => {
    const lines = formatPluginUsageReport({
      plugins: [],
      patched: [],
      totals: { bank0: 0, wram: 0, bankedRom: 0 },
      baseEngine: { bank0: 100, wram: 100, bankedRom: 100 },
      projectData: { bank0: 0, wram: 0, bankedRom: 0 },
      linked: { bank0: 100, wram: 100, bankedRom: 100 },
      reserved: { bank0: 0, wram: 672, bankedRom: 0 },
      capacity: { bank0: 16384, wram: 8192, bankedRom: 4177920 },
      cartType: "mbc5",
      remaining: { bank0: 16284, wram: 8092, bankedRom: 4177820 },
      fromMap: true,
    });

    expect(lines.join("\n")).not.toContain("has been overrun");
  });

  test("It should still report engine totals when no plugin contributed code", () => {
    const lines = formatPluginUsageReport({
      plugins: [],
      patched: [],
      totals: { bank0: 0, wram: 0, bankedRom: 0 },
      baseEngine: { bank0: 0, wram: 0, bankedRom: 0 },
      projectData: { bank0: 0, wram: 0, bankedRom: 0 },
      reserved: { bank0: 0, wram: 672, bankedRom: 0 },
      capacity: { bank0: 16384, wram: 8192, bankedRom: 4177920 },
      cartType: "mbc5",
      fromMap: false,
    });

    const output = lines.join("\n");
    expect(output).toContain("No engine plugins contributed compiled code.");
    // The engine and capacity totals are useful with or without plugins
    expect(output).toContain("GB Studio engine");
    expect(output).toContain("Maximum (MBC5)");
  });
});
