import { readFile } from "fs-extra";
import ensureBuildTools from "lib/compiler/ensureBuildTools";
import spawn from "lib/helpers/cli/spawn";
import romUsage, { parseRomUsage } from "lib/compiler/romUsage";
import type { BuildManifest } from "lib/compiler/buildManifest";

jest.mock("fs-extra");
jest.mock("lib/compiler/ensureBuildTools");
jest.mock("lib/helpers/cli/spawn");

const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockedEnsureBuildTools = ensureBuildTools as jest.MockedFunction<
  typeof ensureBuildTools
>;
const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>;

const manifest: BuildManifest = {
  buildRoot: "/build",
  cartType: "mbc5",
  sources: [],
  artifacts: {
    romPath: "/build/build/rom/game.gb",
    mapPath: "/build/build/rom/game.map",
    noiPath: "/build/build/rom/game.noi",
  },
};

describe("parseRomUsage", () => {
  test("normalizes numeric fields", () => {
    expect(
      parseRomUsage(
        JSON.stringify({
          banks: [{ name: "ROM_0", size: "16384", used: "15297" }],
        }),
      ),
    ).toEqual({ banks: [{ name: "ROM_0", size: 16384, used: 15297 }] });
  });

  test("rejects output without a bank list", () => {
    expect(() => parseRomUsage("{}")).toThrow();
  });

  test.each([
    null,
    "",
    "invalid",
    "-1",
    "1.5",
    "9007199254740992",
    -1,
    1.5,
    false,
    [],
  ])("rejects malformed numeric value %p", (value) => {
    expect(() =>
      parseRomUsage(
        JSON.stringify({
          banks: [{ name: "ROM_0", size: "16384", used: value }],
        }),
      ),
    ).toThrow();
  });
});

describe("romUsage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadFile.mockResolvedValue("1.3.2" as never);
    mockedEnsureBuildTools.mockResolvedValue("/tools");
  });

  test("uses quiet JSON output and forwards process errors", async () => {
    const warnings = jest.fn();
    mockedSpawn.mockImplementation((_command, _args, _options, handlers) => {
      handlers.onLog?.(
        JSON.stringify({
          banks: [{ name: "ROM_0", size: "16384", used: "12000" }],
        }),
      );
      handlers.onError?.("romusage failed");
      return { completed: Promise.resolve() } as never;
    });

    await expect(
      romUsage({
        manifest,
        tmpPath: "/tmp",
        progress: jest.fn(),
        warnings,
      }),
    ).resolves.toEqual({
      banks: [{ name: "ROM_0", size: 16384, used: 12000 }],
    });
    expect(warnings).toHaveBeenCalledWith("romusage failed");
    expect(mockedSpawn).toHaveBeenCalledWith(
      expect.stringContaining("romusage"),
      [
        '"/build/build/rom/game.map"',
        "-sJ",
        "-Q",
        "-e:SHADOW_OAM:C000:A0",
        "-e:STACK:DE00:100",
        "-e:ABSOLUTE_DATA:DF00:100",
      ],
      expect.anything(),
      expect.anything(),
    );
  });
});
