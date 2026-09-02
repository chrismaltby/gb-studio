import fs from "fs-extra";
import os from "os";
import Path from "path";
import {
  createBuildManifest,
  resolveBuildSources,
} from "lib/compiler/buildManifest";

describe("BuildManifest", () => {
  let buildRoot = "";

  beforeEach(async () => {
    buildRoot = await fs.mkdtemp(Path.join(os.tmpdir(), "gbs-manifest-"));
  });

  afterEach(async () => {
    await fs.remove(buildRoot);
  });

  test("records exact object/packed object paths for every buildable source", async () => {
    await fs.outputFile(Path.join(buildRoot, "src/core/core.c"), "");
    await fs.outputFile(Path.join(buildRoot, "src/data/scene.c"), "");

    const sources = await resolveBuildSources(buildRoot);

    expect(sources).toEqual([
      {
        sourcePath: "src/core/core.c",
        objectPath: Path.join(buildRoot, "obj", "core.o"),
        packedObjectPath: Path.join(buildRoot, "obj", "core.rel"),
      },
      {
        sourcePath: "src/data/scene.c",
        objectPath: Path.join(buildRoot, "obj", "scene.o"),
        packedObjectPath: Path.join(buildRoot, "obj", "scene.rel"),
      },
    ]);
  });

  test("returns source paths using posix separators", async () => {
    await fs.outputFile(Path.join(buildRoot, "src/data/scene.c"), "");

    const sources = await resolveBuildSources(buildRoot);

    expect(sources[0]?.sourcePath).toBe("src/data/scene.c");
  });

  test("rejects source basenames that would overwrite the same object", async () => {
    await fs.outputFile(Path.join(buildRoot, "src/core/shared.c"), "");
    await fs.outputFile(Path.join(buildRoot, "src/data/shared.c"), "");

    await expect(resolveBuildSources(buildRoot)).rejects.toThrow(
      "produce the same object",
    );
  });

  test("creates a manifest with the exact ROM/map/NOI artifact paths for the ROM filename", () => {
    const manifest = createBuildManifest({
      buildRoot,
      romFilename: "game.gb",
      cartType: "mbc5",
      sources: [],
    });

    expect(manifest.artifacts).toEqual({
      romPath: Path.join(buildRoot, "build", "rom", "game.gb"),
      mapPath: Path.join(buildRoot, "build", "rom", "game.map"),
      noiPath: Path.join(buildRoot, "build", "rom", "game.noi"),
    });
    expect(manifest.buildRoot).toBe(buildRoot);
    expect(manifest.cartType).toBe("mbc5");
  });

  test("manifest carries the exact sources it was given", () => {
    const sources = [
      {
        sourcePath: "src/core/core.c",
        objectPath: Path.join(buildRoot, "obj/core.o"),
        packedObjectPath: Path.join(buildRoot, "obj/core.rel"),
      },
    ];

    const manifest = createBuildManifest({
      buildRoot,
      romFilename: "game.gb",
      cartType: "mbc3",
      sources,
    });

    expect(manifest.sources).toBe(sources);
  });
});
