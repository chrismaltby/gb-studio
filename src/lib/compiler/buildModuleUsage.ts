import fs from "fs-extra";
import Path from "path";
import type { BuildManifest, BuildSourceOrigin } from "./buildManifest";
import {
  classifyAreaName,
  parseObjectAreaSizes,
  type MemoryRegion,
  type RegionUsage,
} from "./buildArtifactParsers";

export type BuildModuleUsage = {
  sourceFile: string;
  usage: RegionUsage;
  origin: BuildSourceOrigin;
};

const emptyUsage = (): RegionUsage => ({ bank0: 0, wram: 0, bankedRom: 0 });

const usageForAreaSizes = (
  sizes: Record<string, number>,
  regionForArea: (name: string) => MemoryRegion,
): RegionUsage => {
  const usage = emptyUsage();
  for (const [area, size] of Object.entries(sizes)) {
    const region = regionForArea(area);
    if (region === "bank0" || region === "wram" || region === "bankedRom") {
      usage[region] += size;
    }
  }
  return usage;
};

export const analyseBuildObjects = async ({
  manifest,
  allowMissing,
}: {
  manifest: BuildManifest;
  allowMissing: boolean;
}): Promise<BuildModuleUsage[]> => {
  const modules: BuildModuleUsage[] = [];
  for (const source of manifest.sources) {
    try {
      const objectSource = await fs.readFile(source.objectPath, "utf8");
      modules.push({
        sourceFile: source.sourcePath,
        usage: usageForAreaSizes(
          parseObjectAreaSizes(objectSource),
          classifyAreaName,
        ),
        origin: source.origin,
      });
    } catch (error) {
      if (
        allowMissing &&
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw new Error(
        `Unable to read build artifact "${source.objectPath}" for source "${source.sourcePath}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  return modules;
};

export const analyseMusicDriverUsage = async ({
  manifest,
}: {
  manifest: BuildManifest;
}): Promise<RegionUsage> => {
  const musicDriverPath = Path.join(
    manifest.buildRoot,
    "lib",
    "hUGEDriver.lib",
  );
  let musicDriverSource: string;
  try {
    musicDriverSource = await fs.readFile(musicDriverPath, "utf8");
  } catch (error) {
    throw new Error(
      `Unable to read build artifact "${musicDriverPath}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return usageForAreaSizes(
    parseObjectAreaSizes(musicDriverSource),
    classifyAreaName,
  );
};
