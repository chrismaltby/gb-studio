import type { ScriptUse, ScriptUsesInput } from "./ScriptUses.worker";
import {
  createWorkerClient,
  WorkerRequestOptions,
} from "renderer/lib/workers/createWorkerClient";

let client:
  | ReturnType<typeof createWorkerClient<ScriptUsesInput, ScriptUse[]>>
  | undefined;

const getClient = () => {
  if (!client) {
    client = createWorkerClient<ScriptUsesInput, ScriptUse[]>(
      new Worker(new URL("./ScriptUses.worker.ts", import.meta.url)),
    );
  }
  return client;
};

export const findScriptUses = (
  input: ScriptUsesInput,
  options?: WorkerRequestOptions,
) => getClient().request(input, options);
