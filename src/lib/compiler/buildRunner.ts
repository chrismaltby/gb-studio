import Path from "path";
import { Worker } from "worker_threads";
import { BuildTaskResponse, BuildWorkerData } from "./buildWorker";
import type { BuildWorkerResult } from "./buildResult";
import { getL10NData } from "shared/lib/lang/l10n";

type BuilderRunnerResult = {
  kill: () => void;
  result: Promise<BuildWorkerResult>;
};

type BuildRunnerOptions = Omit<BuildWorkerData, "l10nData"> & {
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

export const buildRunner = ({
  progress,
  warnings,
  ...options
}: BuildRunnerOptions): BuilderRunnerResult => {
  let worker: Worker | undefined;
  let cancelling = false;

  const buildResult = new Promise<BuildWorkerResult>((resolve) => {
    let settled = false;
    const resolveResult = (result: BuildWorkerResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const workerPath = Path.resolve(__dirname, "./buildWorker.js");
    const workerData: BuildWorkerData = {
      ...options,
      l10nData: getL10NData(),
    };

    try {
      worker = new Worker(workerPath, {
        workerData,
      });
    } catch (error) {
      resolveResult({
        status: "failed",
        stage: "prepare",
        error: error instanceof Error ? error.toString() : String(error),
      });
      return;
    }

    worker.on("message", (message: BuildTaskResponse) => {
      if (cancelling) {
        if (message.action === "complete") {
          resolveResult({ status: "cancelled" });
        }
        return;
      }
      if (message.action === "progress") {
        progress(message.payload.message);
      } else if (message.action === "warning") {
        warnings(message.payload.message);
      } else if (message.action === "complete") {
        resolveResult(message.payload);
      }
    });
    worker.on("error", (error) => {
      resolveResult(
        cancelling
          ? { status: "cancelled" }
          : {
              status: "failed",
              stage: "prepare",
              error: error.toString(),
            },
      );
    });
    worker.on("exit", (code) => {
      if (cancelling) {
        resolveResult({ status: "cancelled" });
      } else if (code !== 0) {
        resolveResult({
          status: "failed",
          stage: "prepare",
          error: `Build worker exited with code ${code ?? 1}`,
        });
      } else {
        resolveResult({
          status: "failed",
          stage: "prepare",
          error: "Build worker exited before returning a result",
        });
      }
    });
  });

  const kill = () => {
    if (cancelling) {
      return;
    }
    cancelling = true;
    if (worker) {
      worker.postMessage({ action: "terminate" });
    }
  };

  return {
    kill,
    result: buildResult,
  };
};
