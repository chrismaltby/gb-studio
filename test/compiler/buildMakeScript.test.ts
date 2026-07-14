import Path from "path";
import { pathExists } from "fs-extra";
import { glob } from "lib/helpers/glob";
import {
  buildLinkFile,
  getBuildCommands,
  objectPathForSource,
} from "lib/compiler/buildMakeScript";

jest.mock("fs-extra");
jest.mock("lib/helpers/glob");
jest.mock("shared/lib/lang/l10n", () => (key: string) => key);

const mockedGlob = glob as jest.MockedFunction<typeof glob>;
const mockedPathExists = pathExists as jest.MockedFunction<typeof pathExists>;

const defaultBuildOptions = {
  colorEnabled: false,
  sgb: false,
  debug: false,
  platform: "win32",
  batteryless: false,
  targetPlatform: "gb" as const,
  cartType: "mbc5" as const,
  compilerPreset: 3000,
};

describe("buildMakeScript", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("objectPathForSource should flatten Windows source paths into build obj", () => {
    expect(objectPathForSource("C:\\build", "C:/build/src/core/foo.c")).toEqual(
      Path.join("C:\\build", "obj", "foo.o"),
    );
  });

  test("getBuildCommands should compile Windows source paths into obj paths", async () => {
    mockedGlob.mockResolvedValue(["C:/build/src/core/foo.c"]);
    mockedPathExists.mockResolvedValue(false as never);

    const commands = await getBuildCommands("C:\\build", defaultBuildOptions);

    expect(commands[0]?.args).toContain(Path.join("obj", "foo.o"));
  });

  test("buildLinkFile should list object paths for Windows source paths", async () => {
    mockedGlob.mockResolvedValue(["C:/build/src/core/foo.c"]);

    await expect(buildLinkFile("C:\\build")).resolves.toBe(
      Path.join("C:\\build", "obj", "foo.o"),
    );
  });
});
