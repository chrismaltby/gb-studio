import Path from "path";
import romUsage, { type RomUsageBank, type RomUsageData } from "./romUsage";
import type { CompiledScriptSource } from "./compileData";
import type { CartType } from "shared/lib/resources/types";
import type { BuildManifest } from "lib/compiler/buildManifest";
import {
  analyseBuildObjects,
  analyseMusicDriverUsage,
  type BuildModuleUsage,
} from "lib/compiler/buildModuleUsage";
import {
  capacityForCartType,
  type RegionUsage,
} from "lib/compiler/buildArtifactParsers";
import { RESERVED_WRAM_BYTES } from "shared/lib/compiler/memoryLayout";

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
  maxSize: number;
  nextSize?: number;
};

export type BuildUsageMemory = {
  rom: RomMemoryUsage;
  bank0: MemoryRegionUsage;
  wram: MemoryRegionUsage;
};

export type BuildUsageScript = {
  symbol: string;
  size: number;
  sources: CompiledScriptSource[];
};

export type BuildUsageSource = {
  sourceFile: string;
  usage: RegionUsage;
};

export type BuildUsageOverview = {
  cartType: CartType;
  engine: RegionUsage;
  musicDriver: RegionUsage;
  gbdkRuntime: RegionUsage;
  project: RegionUsage;
  plugins: RegionUsage;
  reserved: RegionUsage;
  total: RegionUsage;
  maximum: RegionUsage;
  remaining: RegionUsage;
};

export type BuildUsagePluginFile = {
  sourceFile: string;
  usage: RegionUsage;
  replacesDefault: boolean;
};

export type BuildUsagePlugin = {
  pluginName: string;
  usage: RegionUsage;
  files: BuildUsagePluginFile[];
};

export type UsageData =
  | {
      status: "complete";
      memory: BuildUsageMemory;
      overview: BuildUsageOverview;
      plugins: BuildUsagePlugin[];
      scripts: BuildUsageScript[];
      sources: BuildUsageSource[];
    }
  | {
      status: "partial";
      plugins: BuildUsagePlugin[];
      scripts: BuildUsageScript[];
      sources: BuildUsageSource[];
    }
  | {
      status: "unavailable";
    };

export const romCapacityForCartType = (cartType: CartType): number => {
  const capacity = capacityForCartType(cartType);
  return capacity.bank0 + capacity.bankedRom;
};

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

const calculateRomUsage = (used: number, maxSize: number): RomMemoryUsage => {
  const size =
    ROM_SIZES.find((romSize) => romSize >= used && romSize <= maxSize) ??
    maxSize;

  const nextSize = ROM_SIZES.find(
    (romSize) => romSize > size && romSize <= maxSize,
  );

  return {
    used,
    size,
    maxSize,
    ...(nextSize !== undefined ? { nextSize } : {}),
  };
};

const emptyRegionUsage = (): RegionUsage => ({
  bank0: 0,
  wram: 0,
  bankedRom: 0,
});

const addRegionUsage = (
  left: RegionUsage,
  right: RegionUsage,
): RegionUsage => ({
  bank0: left.bank0 + right.bank0,
  wram: left.wram + right.wram,
  bankedRom: left.bankedRom + right.bankedRom,
});

const subtractRegionUsage = (
  left: RegionUsage,
  right: RegionUsage,
): RegionUsage => ({
  bank0: left.bank0 - right.bank0,
  wram: left.wram - right.wram,
  bankedRom: left.bankedRom - right.bankedRom,
});

const usageForOrigin = (
  modules: BuildModuleUsage[],
  origin: "engine" | "project" | "plugin",
): RegionUsage =>
  modules
    .filter((module) => module.origin.type === origin)
    .reduce(
      (total, module) => addRegionUsage(total, module.usage),
      emptyRegionUsage(),
    );

const analysePluginUsage = (
  modules: BuildModuleUsage[],
): BuildUsagePlugin[] => {
  const pluginsByName = new Map<string, BuildUsagePlugin>();

  for (const module of modules) {
    if (module.origin.type !== "plugin") {
      continue;
    }

    const plugin = pluginsByName.get(module.origin.pluginName) ?? {
      pluginName: module.origin.pluginName,
      usage: emptyRegionUsage(),
      files: [],
    };
    plugin.usage = addRegionUsage(plugin.usage, module.usage);
    plugin.files.push({
      sourceFile: module.sourceFile,
      usage: module.usage,
      replacesDefault: module.origin.replacesDefault,
    });
    pluginsByName.set(plugin.pluginName, plugin);
  }

  return [...pluginsByName.values()]
    .sort((left, right) => left.pluginName.localeCompare(right.pluginName))
    .map((plugin) => ({
      ...plugin,
      files: plugin.files.sort((left, right) =>
        left.sourceFile.localeCompare(right.sourceFile),
      ),
    }));
};

const buildUsageOverview = (
  modules: BuildModuleUsage[],
  musicDriver: RegionUsage,
  cartType: CartType,
  total: RegionUsage,
): BuildUsageOverview => {
  const engine = usageForOrigin(modules, "engine");
  const project = usageForOrigin(modules, "project");
  const plugins = usageForOrigin(modules, "plugin");
  const reserved = { bank0: 0, wram: RESERVED_WRAM_BYTES, bankedRom: 0 };
  const capacity = capacityForCartType(cartType);
  const attributed = [engine, project, plugins, musicDriver, reserved].reduce(
    addRegionUsage,
    emptyRegionUsage(),
  );
  const gbdkRuntime = subtractRegionUsage(total, attributed);

  const invalidRegion = (["bank0", "wram", "bankedRom"] as const).find(
    (region) => gbdkRuntime[region] < 0,
  );

  if (invalidRegion) {
    throw new Error(
      `Attributed module usage exceeds linked ${invalidRegion} usage ` +
        `(attributed ${attributed[invalidRegion]}, linked ${total[invalidRegion]})`,
    );
  }

  return {
    cartType,
    engine,
    musicDriver,
    gbdkRuntime,
    project,
    plugins,
    reserved,
    total,
    maximum: capacity,
    remaining: subtractRegionUsage(capacity, total),
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
  scriptMap,
  mode,
  tmpPath,
  progress,
  warnings,
}: {
  manifest: BuildManifest;
  scriptMap: Record<string, CompiledScriptSource[]>;
  mode: "complete" | "partial";
  tmpPath: string;
  progress: (message: string) => void;
  warnings: (message: string) => void;
}): Promise<UsageData> => {
  try {
    const modules = await analyseBuildObjects({
      manifest,
      allowMissing: mode === "partial",
    });
    const plugins = analysePluginUsage(modules);
    const usageSources: BuildUsageSource[] = modules.map((module) => ({
      sourceFile: module.sourceFile,
      usage: module.usage,
    }));
    const scripts: BuildUsageScript[] = usageSources
      .map((source) => {
        const symbol = Path.basename(
          source.sourceFile,
          Path.extname(source.sourceFile),
        );
        return {
          symbol,
          size: source.usage.bank0 + source.usage.bankedRom,
          sources: scriptMap[symbol] ?? [],
        };
      })
      .filter((script) => script.sources.length > 0)
      .sort((left, right) => right.size - left.size);

    if (mode === "partial") {
      return { status: "partial", plugins, scripts, sources: usageSources };
    }

    const usageData = await romUsage({
      manifest,
      tmpPath,
      progress,
      warnings,
    });

    const memory = calculateMemoryUsage(
      usageData,
      romCapacityForCartType(manifest.cartType),
    );

    const musicDriver = await analyseMusicDriverUsage({ manifest });

    const total: RegionUsage = {
      bank0: memory.bank0.used,
      wram: memory.wram.used,
      bankedRom: memory.rom.used - memory.bank0.used,
    };

    return {
      status: "complete",
      memory,
      overview: buildUsageOverview(
        modules,
        musicDriver,
        manifest.cartType,
        total,
      ),
      plugins,
      scripts,
      sources: usageSources,
    };
  } catch (error) {
    warnings(error instanceof Error ? error.message : String(error));
    return {
      status: "unavailable",
    };
  }
};
