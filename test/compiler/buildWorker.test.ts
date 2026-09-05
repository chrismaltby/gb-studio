import type { ProjectResources } from "shared/lib/resources/types";
import type { BuildManifest } from "lib/compiler/buildManifest";
import loadAllScriptEventHandlers from "lib/project/loadScriptEventHandlers";
import compileData from "lib/compiler/compileData";
import ejectBuild from "lib/compiler/ejectBuild";
import { validateEjectedBuild } from "lib/compiler/validate/validateEjectedBuild";
import makeBuild from "lib/compiler/makeBuild";
import {
  createBuildManifest,
  resolveBuildSources,
} from "lib/compiler/buildManifest";
import { buildProject } from "lib/compiler/buildWorker";

jest.mock("worker_threads", () => ({
  parentPort: { postMessage: jest.fn(), on: jest.fn() },
  workerData: {},
  isMainThread: true,
  threadId: 1,
}));
jest.mock("lib/project/loadScriptEventHandlers");
jest.mock("lib/compiler/compileData");
jest.mock("lib/compiler/ejectBuild");
jest.mock("lib/compiler/validate/validateEjectedBuild");
jest.mock("lib/compiler/makeBuild", () => ({
  __esModule: true,
  default: jest.fn(),
  cancelBuildCommandsInProgress: jest.fn(),
}));
jest.mock("lib/compiler/buildManifest");
jest.mock("shared/lib/lang/l10n", () => ({
  setL10NData: jest.fn(),
}));

const mockedLoadScriptEventHandlers =
  loadAllScriptEventHandlers as jest.MockedFunction<
    typeof loadAllScriptEventHandlers
  >;
const mockedCompileData = compileData as jest.MockedFunction<
  typeof compileData
>;
const mockedEjectBuild = ejectBuild as jest.MockedFunction<typeof ejectBuild>;
const mockedValidateEjectedBuild = validateEjectedBuild as jest.MockedFunction<
  typeof validateEjectedBuild
>;
const mockedMakeBuild = makeBuild as jest.MockedFunction<typeof makeBuild>;
const mockedCreateBuildManifest = createBuildManifest as jest.MockedFunction<
  typeof createBuildManifest
>;
const mockedResolveBuildSources = resolveBuildSources as jest.MockedFunction<
  typeof resolveBuildSources
>;

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

const options = {
  project: {
    settings: {
      cartType: "mbc5",
      generateDebugFilesEnabled: false,
    },
  } as ProjectResources,
  buildType: "rom" as const,
  projectRoot: "/project",
  tmpPath: "/tmp",
  engineSchema: {} as never,
  outputRoot: "/build",
  romFilename: "game.gb",
  make: true,
  l10nData: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoadScriptEventHandlers.mockResolvedValue({});
  mockedCompileData.mockResolvedValue({} as never);
  mockedEjectBuild.mockResolvedValue(undefined);
  mockedValidateEjectedBuild.mockResolvedValue(undefined);
  mockedResolveBuildSources.mockResolvedValue([]);
  mockedCreateBuildManifest.mockReturnValue(manifest);
  mockedMakeBuild.mockResolvedValue(undefined);
});

test("returns compiled data after a successful build", async () => {
  const result = await buildProject(options);

  expect(result).toEqual({
    status: "success",
    compiledData: {},
    manifest,
  });
});

test("returns make failures instead of throwing", async () => {
  const buildError = new Error("link failed");
  mockedMakeBuild.mockRejectedValue(buildError);

  await expect(buildProject(options)).resolves.toEqual({
    status: "failed",
    error: buildError.toString(),
  });
});

test("returns a manifest without running make when make is disabled", async () => {
  await expect(buildProject({ ...options, make: false })).resolves.toEqual({
    status: "success",
    compiledData: {},
    manifest,
  });

  expect(mockedResolveBuildSources).toHaveBeenCalledWith("/build");
  expect(mockedCreateBuildManifest).toHaveBeenCalledWith({
    buildRoot: "/build",
    romFilename: "game.gb",
    cartType: "mbc5",
    sources: [],
  });
  expect(mockedMakeBuild).not.toHaveBeenCalled();
});
