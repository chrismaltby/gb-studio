import type { VariableUse, VariableUsesInput } from "./VariableUses.worker";
import { createWorkerClient, WorkerRequestOptions } from "./createWorkerClient";

let client:
  | ReturnType<typeof createWorkerClient<VariableUsesInput, VariableUse[]>>
  | undefined;

const getClient = () => {
  if (!client) {
    client = createWorkerClient<VariableUsesInput, VariableUse[]>(
      new Worker(new URL("./VariableUses.worker.ts", import.meta.url)),
    );
  }
  return client;
};

export const findVariableUses = (
  input: VariableUsesInput,
  options?: WorkerRequestOptions,
) => getClient().request(input, options);
