import fs from "fs-extra";
import os from "os";
import Path from "path";
import {
  createBuildManifest,
  type BuildManifest,
} from "lib/compiler/buildManifest";
import {
  analyseBuildObjects,
  analyseMusicDriverUsage,
} from "lib/compiler/buildModuleUsage";

describe("build module usage", () => {
  let buildRoot = "";

  beforeEach(async () => {
    buildRoot = await fs.mkdtemp(Path.join(os.tmpdir(), "gbs-modules-"));
  });

  afterEach(async () => {
    await fs.remove(buildRoot);
  });

  const createManifest = (): BuildManifest =>
    createBuildManifest({
      buildRoot,
      romFilename: "game.gb",
      cartType: "mbc5",
      sources: [
        {
          sourcePath: "src/core/engine.c",
          objectPath: Path.join(buildRoot, "obj/engine.o"),
          origin: { type: "engine" },
        },
        {
          sourcePath: "src/data/project.c",
          objectPath: Path.join(buildRoot, "obj/project.o"),
          origin: { type: "project" },
        },
        {
          sourcePath: "src/plugin.c",
          objectPath: Path.join(buildRoot, "obj/plugin.o"),
          origin: {
            type: "plugin",
            pluginName: "ExamplePlugin",
            replacesDefault: false,
          },
        },
      ],
    });

  test("attributes source objects and music-driver areas by region", async () => {
    const manifest = createManifest();
    await Promise.all([
      fs.outputFile(
        manifest.sources[0].objectPath,
        [
          "A _HOME size 10 flags 0 addr 0",
          "A _CODE_3 size 20 flags 0 addr 0",
          "A _DATA size 30 flags 0 addr 0",
        ].join("\n"),
      ),
      fs.outputFile(
        manifest.sources[1].objectPath,
        "A _CODE_4 size 40 flags 0 addr 0",
      ),
      fs.outputFile(
        manifest.sources[2].objectPath,
        "A _HOME size 50 flags 0 addr 0",
      ),
      fs.outputFile(
        Path.join(buildRoot, "lib/hUGEDriver.lib"),
        [
          "M hUGEDriver_obj",
          "A _HOME size 60 flags 0 addr 0",
          "A _DATA size 70 flags 0 addr 0",
        ].join("\n"),
      ),
    ]);

    const modules = await analyseBuildObjects({
      manifest,
      allowMissing: false,
    });
    const musicDriver = await analyseMusicDriverUsage({ manifest });

    expect(modules).toEqual([
      {
        sourceFile: "src/core/engine.c",
        origin: { type: "engine" },
        usage: { bank0: 0x10, wram: 0x30, bankedRom: 0x20 },
      },
      {
        sourceFile: "src/data/project.c",
        origin: { type: "project" },
        usage: { bank0: 0, wram: 0, bankedRom: 0x40 },
      },
      {
        sourceFile: "src/plugin.c",
        origin: {
          type: "plugin",
          pluginName: "ExamplePlugin",
          replacesDefault: false,
        },
        usage: { bank0: 0x50, wram: 0, bankedRom: 0 },
      },
    ]);
    expect(musicDriver).toEqual({
      bank0: 0x60,
      wram: 0x70,
      bankedRom: 0,
    });
  });

  test("attributes current object files without reading packed or linked artifacts", async () => {
    const manifest = createManifest();
    await Promise.all([
      fs.outputFile(
        manifest.sources[0].objectPath,
        [
          "A _HOME size 10 flags 0 addr 0",
          "A _CODE_255 size 50CA flags 0 addr 0",
          "A _DATA size 30 flags 0 addr 0",
        ].join("\n"),
      ),
      fs.outputFile(
        manifest.sources[1].objectPath,
        "A _CODE_3 size 40 flags 0 addr 0",
      ),
      fs.outputFile(
        manifest.artifacts.mapPath,
        "this stale map must not be parsed",
      ),
    ]);

    await expect(
      analyseBuildObjects({ manifest, allowMissing: true }),
    ).resolves.toEqual([
      {
        sourceFile: "src/core/engine.c",
        origin: { type: "engine" },
        usage: { bank0: 0x10, wram: 0x30, bankedRom: 0x50ca },
      },
      {
        sourceFile: "src/data/project.c",
        origin: { type: "project" },
        usage: { bank0: 0, wram: 0, bankedRom: 0x40 },
      },
    ]);
  });

  test("rejects when the music-driver artifact is missing", async () => {
    const manifest = createBuildManifest({
      buildRoot,
      romFilename: "game.gb",
      cartType: "mbc5",
      sources: [],
    });
    await expect(analyseMusicDriverUsage({ manifest })).rejects.toThrow(
      Path.join(buildRoot, "lib/hUGEDriver.lib"),
    );
  });

  test("accounts for the single hUGEDriver module captured from the bundled toolchain", async () => {
    const objectPath = Path.join(buildRoot, "obj/core.o");
    const manifest = createBuildManifest({
      buildRoot,
      romFilename: "game.gb",
      cartType: "mbc5",
      sources: [
        {
          sourcePath: "src/core/core.c",
          objectPath,
          origin: { type: "engine" },
        },
      ],
    });
    const bundledLibraryPath = Path.join(
      __dirname,
      "../../appData/engine/gbvm/lib/hUGEDriver.lib",
    );
    const librarySource = await fs.readFile(bundledLibraryPath, "utf8");
    expect(librarySource.match(/^M .*$/gm)).toEqual(["M hUGEDriver_obj"]);
    await fs.outputFile(
      Path.join(buildRoot, "lib/hUGEDriver.lib"),
      librarySource,
    );
    await fs.copy(
      Path.join(__dirname, "_files/build-usage-example.o"),
      objectPath,
    );

    const modules = await analyseBuildObjects({
      manifest,
      allowMissing: false,
    });
    const musicDriver = await analyseMusicDriverUsage({ manifest });

    expect(modules[0]?.usage).toEqual({
      bank0: 0,
      wram: 0x1,
      bankedRom: 0x402,
    });
    expect(musicDriver).toEqual({
      bank0: 0x79b,
      wram: 0x64,
      bankedRom: 0,
    });
  });

  test("rejects a missing source object after a successful build", async () => {
    const objectPath = Path.join(buildRoot, "obj/missing.o");
    const manifest = createBuildManifest({
      buildRoot,
      romFilename: "game.gb",
      cartType: "mbc5",
      sources: [
        {
          sourcePath: "src/core/missing.c",
          objectPath,
          origin: { type: "engine" },
        },
      ],
    });

    await expect(
      analyseBuildObjects({ manifest, allowMissing: false }),
    ).rejects.toThrow(objectPath);
  });
});
