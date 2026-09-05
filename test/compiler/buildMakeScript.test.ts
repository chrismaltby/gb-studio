import Path from "path";
import { pathExists } from "fs-extra";
import { buildLinkFile, getBuildCommands } from "lib/compiler/buildMakeScript";
import type { BuildManifest } from "lib/compiler/buildManifest";

jest.mock("fs-extra");
jest.mock("shared/lib/lang/l10n", () => (key: string) => key);

const mockedPathExists = pathExists as jest.MockedFunction<typeof pathExists>;

const defaultBuildOptions = {
  colorEnabled: false,
  sgb: false,
  debug: false,
  platform: "win32" as const,
  batteryless: false,
  targetPlatform: "gb" as const,
  compilerPreset: 3000,
};

const makeManifest = (
  buildRoot: string,
  sourcePaths: string[],
): BuildManifest => ({
  buildRoot,
  cartType: "mbc5",
  artifacts: {
    romPath: Path.join(buildRoot, "build", "rom", "game.gb"),
    mapPath: Path.join(buildRoot, "build", "rom", "game.map"),
    noiPath: Path.join(buildRoot, "build", "rom", "game.noi"),
  },
  sources: sourcePaths.map((sourcePath) => {
    const filename = Path.basename(sourcePath, Path.extname(sourcePath));

    return {
      sourcePath,
      objectPath: Path.join(buildRoot, "obj", `${filename}.o`),
      origin: { type: "engine" as const },
    };
  }),
});

describe("buildMakeScript", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getBuildCommands should compile Windows source paths into obj paths", async () => {
    mockedPathExists.mockResolvedValue(false as never);

    const manifest = makeManifest("C:\\build", ["src/core/foo.c"]);
    const commands = await getBuildCommands(manifest, defaultBuildOptions);

    expect(commands[0]?.args).toContain(Path.join("obj", "foo.o"));
  });

  test("getBuildCommands should use the object path from the manifest", async () => {
    mockedPathExists.mockResolvedValue(false as never);

    const manifest = makeManifest("C:\\build", ["src/core/foo.c"]);
    manifest.sources[0] = {
      ...manifest.sources[0],
      objectPath: Path.join("C:\\build", "obj", "custom.o"),
    };

    const commands = await getBuildCommands(manifest, defaultBuildOptions);

    expect(commands[0]?.args).toContain(Path.join("obj", "custom.o"));
  });

  test("buildLinkFile should use exact manifest object paths", () => {
    const manifest = makeManifest("C:\\build", [
      "src/core/foo.c",
      "src/core/bar.c",
    ]);

    expect(buildLinkFile(manifest)).toBe(
      [
        Path.join("C:\\build", "obj", "foo.o"),
        Path.join("C:\\build", "obj", "bar.o"),
      ].join("\n"),
    );
  });
});
