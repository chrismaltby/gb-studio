import Path from "path";
import { Worker } from "worker_threads";
import {
  BuildTaskResponse,
  BuildWorkerData,
  type BuildResult,
} from "./buildWorker";
import { getL10NData } from "shared/lib/lang/l10n";

type BuilderRunnerResult = {
  kill: () => void;
  result: Promise<BuildResult>;
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

  const buildResult = new Promise<BuildResult>((resolve, reject) => {
    const workerPath = Path.resolve(__dirname, "./buildWorker.js");
    const workerData: BuildWorkerData = {
      ...options,
      l10nData: getL10NData(),
    };

    worker = new Worker(workerPath, {
      workerData,
    });

    worker.on("message", (message: BuildTaskResponse) => {
      if (cancelling) {
        if (message.action === "complete") {
          resolve({ status: "cancelled" });
        }
        return;
      }
      if (message.action === "progress") {
        progress(message.payload.message);
      } else if (message.action === "warning") {
        warnings(message.payload.message);
      } else if (message.action === "complete") {
        resolve(message.payload);
      }
    });
    worker.on("error", (error) => {
      reject(error);
    });
    worker.on("exit", (code) => {
      if (cancelling) {
        resolve({ status: "cancelled" });
      } else if (code !== 0) {
        reject(code ?? 1);
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
