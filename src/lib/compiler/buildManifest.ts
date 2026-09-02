import Path from "path";
import { glob } from "lib/helpers/glob";
import { pathToPosix } from "shared/lib/helpers/path";
import type { CartType } from "shared/lib/resources/types";

export type BuildSource = {
  sourcePath: string;
  objectPath: string;
  packedObjectPath: string;
};

type BuildArtifacts = {
  romPath: string;
  mapPath: string;
  noiPath: string;
};

export type BuildManifest = {
  buildRoot: string;
  artifacts: BuildArtifacts;
  sources: BuildSource[];
  cartType: CartType;
};

export const resolveBuildSources = async (
  buildRoot: string,
): Promise<BuildSource[]> => {
  const sourceFiles = await glob("src/**/*.@(c|s)", { cwd: buildRoot });

  const sources = sourceFiles.map((sourceFile) => {
    const sourcePath = pathToPosix(sourceFile);
    const sourceName = Path.basename(sourcePath, Path.extname(sourcePath));
    return {
      sourcePath,
      objectPath: Path.join(buildRoot, "obj", `${sourceName}.o`),
      packedObjectPath: Path.join(buildRoot, "obj", `${sourceName}.rel`),
    };
  });

  const objectOwners = new Map<string, string>();
  for (const source of sources) {
    const existing = objectOwners.get(source.objectPath);
    if (existing) {
      throw new Error(
        `Build sources ${existing} and ${source.sourcePath} produce the same object ${source.objectPath}`,
      );
    }
    objectOwners.set(source.objectPath, source.sourcePath);
  }

  return sources;
};

export const createBuildManifest = ({
  buildRoot,
  romFilename,
  cartType,
  sources,
}: {
  buildRoot: string;
  romFilename: string;
  cartType: CartType;
  sources: BuildSource[];
}): BuildManifest => {
  const romStem = Path.parse(romFilename).name;
  const romRoot = Path.join(buildRoot, "build", "rom");
  return {
    buildRoot,
    cartType,
    sources,
    artifacts: {
      romPath: Path.join(romRoot, romFilename),
      mapPath: Path.join(romRoot, `${romStem}.map`),
      noiPath: Path.join(romRoot, `${romStem}.noi`),
    },
  };
};
