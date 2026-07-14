import { glob as globMatch, globSync as globMatchSync } from "glob";
import { glob, globSync } from "lib/helpers/glob";

jest.mock("glob", () => ({
  glob: jest.fn(),
  globSync: jest.fn(),
}));

const mockedGlobMatch = globMatch as jest.MockedFunction<typeof globMatch>;
const mockedGlobMatchSync = globMatchSync as jest.MockedFunction<
  typeof globMatchSync
>;

describe("glob helper", () => {
  const platform = process.platform;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, "platform", {
      value: platform,
    });
  });

  afterAll(() => {
    Object.defineProperty(process, "platform", {
      value: platform,
    });
  });

  test("It should use relative slash patterns with cwd and return normalized sorted async results", async () => {
    Object.defineProperty(process, "platform", {
      value: "win32",
    });

    mockedGlobMatch.mockResolvedValue([
      "C:\\project\\plugins\\plugin2\\plugin.json",
      "C:\\project\\plugins\\plugin10\\plugin.json",
    ]);

    const results = await glob("**/plugin.json", {
      cwd: "C:\\project\\plugins",
      absolute: true,
    });

    expect(mockedGlobMatch).toHaveBeenCalledWith("**/plugin.json", {
      cwd: "C:\\project\\plugins",
      absolute: true,
    });
    expect(results).toEqual([
      "C:/project/plugins/plugin10/plugin.json",
      "C:/project/plugins/plugin2/plugin.json",
    ]);
  });

  test("It should return sorted sync results", () => {
    mockedGlobMatchSync.mockReturnValue([
      "/project/src/lang/fr.json",
      "/project/src/lang/en.json",
    ]);

    const results = globSync("*.json", {
      cwd: "/project/src/lang",
      absolute: true,
    });

    expect(results).toEqual([
      "/project/src/lang/en.json",
      "/project/src/lang/fr.json",
    ]);
  });
});
