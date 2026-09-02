import buildProject, {
  cancelCompileStepsInProgress,
} from "lib/compiler/buildProject";
import { buildRunner } from "lib/compiler/buildRunner";
import { dummyProjectResources } from "../dummydata";

jest.mock("lib/compiler/buildRunner");

const mockedBuildRunner = buildRunner as jest.MockedFunction<
  typeof buildRunner
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

describe("buildProject outcomes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns worker failures instead of throwing", async () => {
    mockedBuildRunner.mockReturnValue({
      result: Promise.resolve({
        buildStatus: "failed",
        error: "link failed",
      }),
      kill: jest.fn(),
    });

    await expect(buildProject(dummyProjectResources, options)).resolves.toEqual(
      {
        buildStatus: "failed",
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
        buildStatus: "failed",
        error: "Error: worker exited",
      },
    );
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

    await expect(build).resolves.toEqual({ buildStatus: "cancelled" });
    expect(kill).toHaveBeenCalledTimes(1);
  });
});
