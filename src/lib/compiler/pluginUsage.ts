import fs from "fs-extra";
import Path from "path";
import { glob } from "lib/helpers/glob";
import l10n from "shared/lib/lang/l10n";
import { pathToPosix } from "shared/lib/helpers/path";
import type { CartType } from "shared/lib/resources/types";
import type { PluginFileAttribution } from "lib/compiler/enginePlugins";
import {
  RESERVED_WRAM_BYTES,
  STACK_RESERVE_BYTES,
} from "lib/compiler/buildMakeScript";

export type MemoryRegion =
  "bank0" | "bankedRom" | "wram" | "hram" | "sram" | "vram" | "other";

export type ModuleUsage = {
  /** Object module name, matches the source file basename */
  module: string;
  /** Source file, posix and relative to the build root */
  sourceFile: string;
  bank0: number;
  wram: number;
  bankedRom: number;
};

export type PluginUsage = {
  pluginName: string;
  bank0: number;
  wram: number;
  bankedRom: number;
  modules: (ModuleUsage & { overridesStock: boolean })[];
};

export type PatchedModuleUsage = ModuleUsage & {
  /** Plugins that patched this stock engine file */
  plugins: string[];
};

export type RegionUsage = { bank0: number; wram: number; bankedRom: number };

export type PluginUsageReport = {
  plugins: PluginUsage[];
  patched: PatchedModuleUsage[];
  /** Total across every plugin */
  totals: RegionUsage;
  /** Stock GB Studio engine sources, including any patched by plugins */
  baseEngine: RegionUsage;
  /** Compiled project data (scenes, backgrounds, sprites, music...) */
  projectData: RegionUsage;
  /**
   * Everything the linker placed that has no object module in the build,
   * the GBDK library and runtime. Only known once a map file exists.
   */
  library?: RegionUsage;
  /** Everything the linker placed, only known once a map file exists */
  linked?: RegionUsage;
  /**
   * Memory the engine claims at fixed addresses plus the stack reserve.
   * None of it is in the map file, but a game cannot use it either.
   */
  reserved: RegionUsage;
  /** Linked output plus reserved memory, what the game really costs */
  total?: RegionUsage;
  /** How much space each region has in total. Banked ROM depends on the cart */
  capacity: RegionUsage;
  cartType: CartType;
  /**
   * Capacity minus what is in use. Positive is space left,
   * negative means the region has been overrun.
   */
  remaining?: RegionUsage;
  /** True when area regions came from the map rather than the fallback table */
  fromMap: boolean;
};

export const BANK_0_SIZE = 16 * 1024;
/** WRAM_LO + WRAM_HI_0. The extra Game Boy Color banks are never switched in */
export const WRAM_SIZE = 8 * 1024;
export const ROM_BANK_SIZE = 16 * 1024;

/**
 * Highest ROM bank each cart type can address, as enforced by bankpack.
 * Bank 0 is fixed, so this is also the number of switchable banks.
 */
export const MAX_ROM_BANK: Record<CartType, number> = {
  mbc5: 255,
  mbc3: 127,
};

export const capacityForCartType = (cartType: CartType): RegionUsage => ({
  bank0: BANK_0_SIZE,
  wram: WRAM_SIZE,
  bankedRom: MAX_ROM_BANK[cartType] * ROM_BANK_SIZE,
});

/**
 * Areas whose region can be derived from the name alone, used when no map
 * file was produced (for example when the link step failed).
 */
const FALLBACK_AREA_REGIONS: Record<string, MemoryRegion> = {
  _CODE: "bank0",
  _HOME: "bank0",
  _GSINIT: "bank0",
  _GSFINAL: "bank0",
  _INITIALIZER: "bank0",
  _LIT: "bank0",
  _DATA: "wram",
  _BSS: "wram",
  _INITIALIZED: "wram",
  _HRAM: "hram",
};

/**
 * Classifies an area by the address the linker placed it at.
 * Banked areas are reported as (bank << 16) | offset by sdld.
 */
export const classifyAreaAddress = (addr: number): MemoryRegion => {
  if (addr >= 0x10000) {
    return "bankedRom";
  }
  if (addr < 0x4000) {
    return "bank0";
  }
  if (addr < 0x8000) {
    return "bankedRom";
  }
  if (addr < 0xa000) {
    return "vram";
  }
  if (addr < 0xc000) {
    return "sram";
  }
  // Echo RAM is included so that WRAM overflowing past 0xDFFF still counts
  if (addr < 0xfe00) {
    return "wram";
  }
  if (addr >= 0xff80 && addr < 0xffff) {
    return "hram";
  }
  return "other";
};

export const classifyAreaName = (name: string): MemoryRegion => {
  const banked = /^_CODE_(\d+)$/.exec(name);
  if (banked) {
    return banked[1] === "0" ? "bank0" : "bankedRom";
  }
  if (name.startsWith("_HEADER") || name.startsWith("_CRASH")) {
    return "bank0";
  }
  return FALLBACK_AREA_REGIONS[name] ?? "other";
};

/**
 * Reads the per area sizes an object module contributes.
 * Sizes are exact, the linker keeps each module's contribution contiguous.
 */
export const parseObjectAreaSizes = (
  source: string,
): Record<string, number> => {
  const sizes: Record<string, number> = {};
  for (const line of source.split(/\r?\n/)) {
    const match = /^A (\S+) size ([0-9A-Fa-f]+) flags/.exec(line);
    if (!match) {
      continue;
    }
    const size = parseInt(match[2], 16);
    if (size > 0) {
      sizes[match[1]] = (sizes[match[1]] ?? 0) + size;
    }
  }
  return sizes;
};

export type MapArea = {
  name: string;
  addr: number;
  size: number;
  /**
   * Absolute areas (headers, crash handler scratch) are listed with an
   * address of zero, so their address says nothing about where they live.
   */
  isAbsolute: boolean;
};

/**
 * Reads area name, address and size from a linker map file.
 */
export const parseMapAreas = (source: string): MapArea[] => {
  const areas: MapArea[] = [];
  const seen = new Set<string>();
  for (const line of source.split(/\r?\n/)) {
    const match =
      /^(\S+)\s+([0-9A-Fa-f]{8})\s+([0-9A-Fa-f]{8})\s*=\s*(\d+)\.\s+bytes\s*\(([^)]*)\)/.exec(
        line,
      );
    if (!match) {
      continue;
    }
    // Each area is listed once per page of the map file
    if (seen.has(match[1])) {
      continue;
    }
    seen.add(match[1]);
    areas.push({
      name: match[1],
      addr: parseInt(match[2], 16),
      size: Number(match[4]),
      isAbsolute: match[5].split(",").includes("ABS"),
    });
  }
  return areas;
};

const emptyUsage = () => ({ bank0: 0, wram: 0, bankedRom: 0 });

const addAreaSizes = (
  target: { bank0: number; wram: number; bankedRom: number },
  sizes: Record<string, number>,
  regionOfArea: (name: string) => MemoryRegion,
) => {
  for (const [area, size] of Object.entries(sizes)) {
    const region = regionOfArea(area);
    if (region === "bank0") {
      target.bank0 += size;
    } else if (region === "wram") {
      target.wram += size;
    } else if (region === "bankedRom") {
      target.bankedRom += size;
    }
  }
};

export const moduleNameForSource = (sourceFile: string): string =>
  Path.basename(sourceFile, Path.extname(sourceFile));

/**
 * Reads the object file for a module. Prefers the .rel written by bankpack,
 * which records the final bank each area was assigned to, and falls back to
 * the .o so that a failed link still reports bank 0 and WRAM usage.
 */
const readModuleAreaSizes = async (
  buildRoot: string,
  module: string,
): Promise<Record<string, number> | undefined> => {
  for (const ext of [".rel", ".o"]) {
    const objPath = Path.join(buildRoot, "obj", `${module}${ext}`);
    try {
      return parseObjectAreaSizes(await fs.readFile(objPath, "utf8"));
    } catch {
      // Try the next extension
    }
  }
  return undefined;
};

const findMapFile = async (buildRoot: string): Promise<string | undefined> => {
  const maps = await glob("build/rom/*.map", {
    cwd: buildRoot,
    absolute: true,
  });
  return maps[0];
};

/**
 * Every source the build compiles, keyed by the object module it becomes.
 * Mirrors how objectPathForSource names objects, by source basename.
 */
const findBuildSources = async (
  buildRoot: string,
): Promise<Map<string, string>> => {
  const sources = await glob("src/**/*.@(c|s)", { cwd: buildRoot });
  const byModule = new Map<string, string>();
  for (const source of sources) {
    if (source.includes("GBT_PLAYER")) {
      continue;
    }
    const posix = pathToPosix(source);
    byModule.set(moduleNameForSource(posix), posix);
  }
  return byModule;
};

/** Compiled project data lives alongside the engine sources in src/data */
const isProjectDataSource = (sourceFile: string) =>
  sourceFile.startsWith("src/data/");

const subtractUsage = (a: RegionUsage, b: RegionUsage): RegionUsage => ({
  bank0: a.bank0 - b.bank0,
  wram: a.wram - b.wram,
  bankedRom: a.bankedRom - b.bankedRom,
});

const addUsage = (a: RegionUsage, b: RegionUsage): RegionUsage => ({
  bank0: a.bank0 + b.bank0,
  wram: a.wram + b.wram,
  bankedRom: a.bankedRom + b.bankedRom,
});

export const analyzePluginUsage = async ({
  buildRoot,
  attribution,
  cartType = "mbc5",
}: {
  buildRoot: string;
  attribution: PluginFileAttribution;
  cartType?: CartType;
}): Promise<PluginUsageReport> => {
  let regionOfArea = classifyAreaName;
  let linked: RegionUsage | undefined;
  let fromMap = false;

  const mapPath = await findMapFile(buildRoot);
  if (mapPath) {
    try {
      const areas = parseMapAreas(await fs.readFile(mapPath, "utf8"));
      const areaRegions: Record<string, MemoryRegion> = {};
      const linkedTotals = emptyUsage();
      for (const area of areas) {
        // Absolute areas carry no usable address and overlap each other,
        // leave them out rather than counting them at the wrong place
        const region = area.isAbsolute
          ? "other"
          : classifyAreaAddress(area.addr);
        areaRegions[area.name] = region;
        if (region === "bank0") {
          linkedTotals.bank0 += area.size;
        } else if (region === "wram") {
          linkedTotals.wram += area.size;
        } else if (region === "bankedRom") {
          linkedTotals.bankedRom += area.size;
        }
      }
      regionOfArea = (name) => areaRegions[name] ?? classifyAreaName(name);
      linked = linkedTotals;
      fromMap = true;
    } catch {
      // Fall back to classifying areas by name
    }
  }

  const overridesStock = new Set(attribution.overridesStock);
  const byPlugin = new Map<string, PluginUsage>();

  for (const [sourceFile, pluginName] of Object.entries(
    attribution.ownedFiles,
  )) {
    const module = moduleNameForSource(sourceFile);
    const sizes = await readModuleAreaSizes(buildRoot, module);
    if (!sizes) {
      continue;
    }
    const usage: ModuleUsage = { module, sourceFile, ...emptyUsage() };
    addAreaSizes(usage, sizes, regionOfArea);

    const plugin = byPlugin.get(pluginName) ?? {
      pluginName,
      ...emptyUsage(),
      modules: [],
    };
    plugin.bank0 += usage.bank0;
    plugin.wram += usage.wram;
    plugin.bankedRom += usage.bankedRom;
    plugin.modules.push({
      ...usage,
      overridesStock: overridesStock.has(sourceFile),
    });
    byPlugin.set(pluginName, plugin);
  }

  const patched: PatchedModuleUsage[] = [];
  for (const [sourceFile, plugins] of Object.entries(
    attribution.patchedFiles,
  )) {
    const module = moduleNameForSource(sourceFile);
    const sizes = await readModuleAreaSizes(buildRoot, module);
    if (!sizes) {
      continue;
    }
    const usage: PatchedModuleUsage = {
      module,
      sourceFile,
      plugins,
      ...emptyUsage(),
    };
    addAreaSizes(usage, sizes, regionOfArea);
    patched.push(usage);
  }

  const plugins = [...byPlugin.values()].sort(
    (a, b) =>
      b.bank0 - a.bank0 ||
      b.wram - a.wram ||
      a.pluginName.localeCompare(b.pluginName, "en"),
  );
  for (const plugin of plugins) {
    plugin.modules.sort((a, b) => b.bank0 - a.bank0 || b.wram - a.wram);
  }
  patched.sort(
    (a, b) => b.bank0 - a.bank0 || a.module.localeCompare(b.module, "en"),
  );

  const totals = emptyUsage();
  for (const plugin of plugins) {
    totals.bank0 += plugin.bank0;
    totals.wram += plugin.wram;
    totals.bankedRom += plugin.bankedRom;
  }

  // Split every remaining compiled module into stock engine and project data,
  // so the plugin numbers can be read against the rest of the ROM
  const baseEngine = emptyUsage();
  const projectData = emptyUsage();
  const buildSources = await findBuildSources(buildRoot);
  for (const [module, sourceFile] of buildSources) {
    if (attribution.ownedFiles[sourceFile]) {
      continue;
    }
    const sizes = await readModuleAreaSizes(buildRoot, module);
    if (!sizes) {
      continue;
    }
    addAreaSizes(
      isProjectDataSource(sourceFile) ? projectData : baseEngine,
      sizes,
      regionOfArea,
    );
  }

  const library = linked
    ? subtractUsage(
        subtractUsage(subtractUsage(linked, totals), baseEngine),
        projectData,
      )
    : undefined;

  const capacity = capacityForCartType(cartType);
  const reserved = {
    bank0: 0,
    wram: RESERVED_WRAM_BYTES,
    bankedRom: 0,
  };
  const total = linked ? addUsage(linked, reserved) : undefined;

  return {
    plugins,
    patched,
    totals,
    baseEngine,
    projectData,
    library,
    linked,
    reserved,
    total,
    capacity,
    cartType,
    remaining: total ? subtractUsage(capacity, total) : undefined,
    fromMap,
  };
};

const bytes = (value: number) => `${value} b`;

// Wide enough for the longest label, so every column stays aligned
const LABEL_WIDTH = 56;

const row = (label: string, bank0: string, wram: string, banked: string) =>
  `  ${label.padEnd(LABEL_WIDTH)}${bank0.padStart(9)}${wram.padStart(9)}${banked.padStart(11)}`;

export const formatPluginUsageReport = (
  report: PluginUsageReport,
): string[] => {
  const lines: string[] = [];
  lines.push(l10n("COMPILER_PLUGIN_USAGE"));
  lines.push("");
  lines.push(
    row(
      l10n("COMPILER_PLUGIN_USAGE_PLUGIN"),
      l10n("COMPILER_PLUGIN_USAGE_BANK_0"),
      "WRAM",
      l10n("COMPILER_PLUGIN_USAGE_BANKED"),
    ),
  );

  // The totals below are still worth reporting with no plugins installed
  if (report.plugins.length === 0) {
    lines.push(`  ${l10n("COMPILER_PLUGIN_USAGE_NO_PLUGINS")}`);
  }

  for (const plugin of report.plugins) {
    lines.push(
      row(
        plugin.pluginName,
        bytes(plugin.bank0),
        bytes(plugin.wram),
        bytes(plugin.bankedRom),
      ),
    );
    for (const module of plugin.modules) {
      const label = module.overridesStock
        ? `${module.sourceFile} ${l10n("COMPILER_PLUGIN_USAGE_REPLACES_STOCK")}`
        : module.sourceFile;
      lines.push(
        row(
          `  ${label}`,
          bytes(module.bank0),
          bytes(module.wram),
          bytes(module.bankedRom),
        ),
      );
    }
  }
  const usageRow = (label: string, usage: RegionUsage) =>
    row(label, bytes(usage.bank0), bytes(usage.wram), bytes(usage.bankedRom));

  if (report.plugins.length > 0) {
    lines.push(usageRow(l10n("COMPILER_PLUGIN_USAGE_TOTAL"), report.totals));
  }

  // Patching or replacing a stock file means this row is no longer vanilla
  const replacedModules = report.plugins.flatMap((plugin) =>
    plugin.modules
      .filter((module) => module.overridesStock)
      .map((module) => ({ module, pluginName: plugin.pluginName })),
  );
  const engineModifiedByPlugins =
    report.patched.length > 0 || replacedModules.length > 0;

  lines.push("");
  lines.push(
    usageRow(
      engineModifiedByPlugins
        ? l10n("COMPILER_PLUGIN_USAGE_BASE_ENGINE_MODIFIED")
        : l10n("COMPILER_PLUGIN_USAGE_BASE_ENGINE"),
      report.baseEngine,
    ),
  );
  lines.push(
    usageRow(l10n("COMPILER_PLUGIN_USAGE_PROJECT_DATA"), report.projectData),
  );
  if (report.library) {
    lines.push(usageRow(l10n("COMPILER_PLUGIN_USAGE_LIBRARY"), report.library));
  }
  if (report.linked) {
    lines.push(usageRow(l10n("COMPILER_PLUGIN_USAGE_LINKED"), report.linked));
  }
  lines.push(usageRow(l10n("COMPILER_PLUGIN_USAGE_RESERVED"), report.reserved));
  if (report.total) {
    lines.push(
      usageRow(l10n("COMPILER_PLUGIN_USAGE_GRAND_TOTAL"), report.total),
    );
  }

  lines.push("");
  lines.push(
    usageRow(
      l10n("COMPILER_PLUGIN_USAGE_MAXIMUM", {
        cartType: report.cartType.toUpperCase(),
      }),
      report.capacity,
    ),
  );
  if (report.remaining) {
    lines.push(
      usageRow(l10n("COMPILER_PLUGIN_USAGE_REMAINING"), report.remaining),
    );
    const overrun = (["bank0", "wram", "bankedRom"] as const).some(
      (region) => (report.remaining?.[region] ?? 0) < 0,
    );
    if (overrun) {
      lines.push(`  ${l10n("COMPILER_PLUGIN_USAGE_OVERRUN")}`);
    }
  }
  lines.push(
    `  ${l10n("COMPILER_PLUGIN_USAGE_CAPACITY", {
      bank0Size: String(BANK_0_SIZE),
      wramSize: String(WRAM_SIZE),
      stackReserve: String(STACK_RESERVE_BYTES),
    })}`,
  );

  if (engineModifiedByPlugins) {
    lines.push("");
    lines.push(`  ${l10n("COMPILER_PLUGIN_USAGE_MODIFIED")}`);
    for (const entry of report.patched) {
      lines.push(
        row(
          `  ${entry.sourceFile}`,
          bytes(entry.bank0),
          bytes(entry.wram),
          bytes(entry.bankedRom),
        ),
      );
      lines.push(
        `      ${l10n("COMPILER_PLUGIN_USAGE_PATCHED_BY", {
          plugins: entry.plugins.join(", "),
        })}`,
      );
    }
    for (const { module, pluginName } of replacedModules) {
      lines.push(
        row(
          `  ${module.sourceFile}`,
          bytes(module.bank0),
          bytes(module.wram),
          bytes(module.bankedRom),
        ),
      );
      // Replaced files are counted under the plugin, not the engine
      lines.push(
        `      ${l10n("COMPILER_PLUGIN_USAGE_REPLACED_BY", {
          plugins: pluginName,
        })}`,
      );
    }
  }

  return lines;
};
