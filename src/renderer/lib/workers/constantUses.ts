import type { ConstantUse, ConstantUsesInput } from "./ConstantUses.worker";
import {
  createWorkerClient,
  WorkerRequestOptions,
} from "renderer/lib/workers/createWorkerClient";

let client:
  | ReturnType<typeof createWorkerClient<ConstantUsesInput, ConstantUse[]>>
  | undefined;

const getClient = () => {
  if (!client) {
    client = createWorkerClient<ConstantUsesInput, ConstantUse[]>(
      new Worker(new URL("./ConstantUses.worker.ts", import.meta.url)),
    );
  }
  return client;
};

export const findConstantUses = (
  input: ConstantUsesInput,
  options?: WorkerRequestOptions,
) => getClient().request(input, options);
