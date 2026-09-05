import buildProject, {
  cancelCompileStepsInProgress,
} from "lib/compiler/buildProject";
import { buildRunner } from "lib/compiler/buildRunner";
import { exportWebBuild } from "lib/compiler/webBuild";
import { dummyProjectResources } from "../dummydata";
import type { BuildManifest } from "lib/compiler/buildManifest";

jest.mock("lib/compiler/buildRunner");
jest.mock("lib/compiler/webBuild");

const mockedBuildRunner = buildRunner as jest.MockedFunction<
  typeof buildRunner
>;
const mockedExportWebBuild = exportWebBuild as jest.MockedFunction<
  typeof exportWebBuild
>;

const options = {
  buildType: "rom" as const,
  projectRoot: "/project",
  tmpPath: "/tmp/build",
  engineSchema: {} as never,
  romFilename: "game.gb",
  outputRoot: "/project/build",
  progress: jest.fn(),
  warnings: jest.fn(),
};

const manifest: BuildManifest = {
  buildRoot: "/project/build",
  cartType: "mbc5",
  sources: [],
  artifacts: {
    romPath: "/project/build/build/rom/game.gb",
    mapPath: "/project/build/build/rom/game.map",
    noiPath: "/project/build/build/rom/game.noi",
  },
};

describe("buildProject outcomes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns the build manifest with compiled data", async () => {
    mockedBuildRunner.mockReturnValue({
      result: Promise.resolve({
        status: "success",
        compiledData: {} as never,
        manifest,
      }),
      kill: jest.fn(),
    });

    await expect(buildProject(dummyProjectResources, options)).resolves.toEqual(
      {
        status: "success",
        compiledData: {},
        manifest,
      },
    );
  });

  test("returns worker failures instead of throwing", async () => {
    mockedBuildRunner.mockReturnValue({
      result: Promise.resolve({
        status: "failed",
        error: "link failed",
      }),
      kill: jest.fn(),
    });

    await expect(buildProject(dummyProjectResources, options)).resolves.toEqual(
      {
        status: "failed",
        error: "link failed",
      },
    );
  });

  test("converts worker process errors into failed outcomes", async () => {
    mockedBuildRunner.mockReturnValue({
      result: Promise.reject(new Error("worker exited")),
      kill: jest.fn(),
    });

    await expect(buildProject(dummyProjectResources, options)).resolves.toEqual(
      {
        status: "failed",
        error: "Error: worker exited",
      },
    );
  });

  test("returns an export failure without successful build data", async () => {
    mockedBuildRunner.mockReturnValue({
      result: Promise.resolve({
        status: "success",
        compiledData: {} as never,
        manifest: {} as never,
      }),
      kill: jest.fn(),
    });
    mockedExportWebBuild.mockRejectedValue(new Error("export failed"));

    await expect(
      buildProject(dummyProjectResources, { ...options, buildType: "web" }),
    ).resolves.toEqual({
      status: "failed",
      error: "Error: export failed",
    });
  });

  test("returns cancellation instead of throwing", async () => {
    let rejectBuild: (reason: Error) => void = () => {};
    const result = new Promise<never>((_resolve, reject) => {
      rejectBuild = reject;
    });
    const kill = jest.fn();
    mockedBuildRunner.mockReturnValue({ result, kill });

    const build = buildProject(dummyProjectResources, options);
    cancelCompileStepsInProgress();
    rejectBuild(new Error("worker exited"));

    await expect(build).resolves.toEqual({ status: "cancelled" });
    expect(kill).toHaveBeenCalledTimes(1);
  });
});
