import { Worker } from "worker_threads";
import { buildRunner } from "lib/compiler/buildRunner";
import { dummyProjectResources } from "../dummydata";
import type { BuildTaskResponse } from "lib/compiler/buildWorker";

type WorkerHandlers = {
  message?: (message: BuildTaskResponse) => void;
  error?: (error: Error) => void;
  exit?: (code: number) => void;
};

let mockWorkerHandlers: WorkerHandlers = {};
const mockPostMessage = jest.fn();

jest.mock("worker_threads", () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: (event: keyof WorkerHandlers, handler: never) => {
      mockWorkerHandlers[event] = handler;
    },
    postMessage: mockPostMessage,
  })),
}));
jest.mock("shared/lib/lang/l10n", () => ({
  getL10NData: jest.fn(() => ({})),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockWorkerHandlers = {};
});

test.each([0, 1])(
  "resolves cancellation when the worker exits with code %d",
  async (exitCode) => {
    const { result, kill } = buildRunner({
      project: dummyProjectResources,
      buildType: "rom",
      projectRoot: "/project",
      tmpPath: "/tmp",
      engineSchema: {} as never,
      outputRoot: "/build",
      romFilename: "game.gb",
      make: true,
      progress: jest.fn(),
      warnings: jest.fn(),
    });

    expect(Worker).toHaveBeenCalledTimes(1);
    kill();
    expect(mockPostMessage).toHaveBeenCalledWith({ action: "terminate" });

    mockWorkerHandlers.exit?.(exitCode);

    await expect(result).resolves.toEqual({ status: "cancelled" });
  },
);

test("resolves cancellation when the worker completes after cancellation", async () => {
  const { result, kill } = buildRunner({
    project: dummyProjectResources,
    buildType: "rom",
    projectRoot: "/project",
    tmpPath: "/tmp",
    engineSchema: {} as never,
    outputRoot: "/build",
    romFilename: "game.gb",
    make: true,
    progress: jest.fn(),
    warnings: jest.fn(),
  });

  kill();
  mockWorkerHandlers.message?.({
    action: "complete",
    threadId: 1,
    payload: {
      status: "failed",
      error: "BUILD_CANCELLED",
    },
  });

  await expect(result).resolves.toEqual({ status: "cancelled" });
});
