export type WorkerRequestMessage<TInput> = {
  requestId: number;
  input: TInput;
};

export type WorkerResponseMessage<TOutput> =
  | {
      requestId: number;
      success: true;
      output: TOutput;
    }
  | {
      requestId: number;
      success: false;
      error: string;
    };

type PendingRequest<TOutput> = {
  resolve: (output: TOutput) => void;
  reject: (error: Error) => void;
  removeAbortListener?: () => void;
};

export type WorkerRequestOptions = {
  signal?: AbortSignal;
};

export type WorkerClient<TInput, TOutput> = {
  request: (input: TInput, options?: WorkerRequestOptions) => Promise<TOutput>;
  dispose: () => void;
};

export const isWorkerRequestAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const abortError = () => {
  const error = new Error("Worker request aborted");
  error.name = "AbortError";
  return error;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const createWorkerRequestHandler =
  <TInput, TOutput>(
    worker: Pick<Worker, "postMessage">,
    handler: (input: TInput) => TOutput | Promise<TOutput>,
  ) =>
  async (event: MessageEvent<WorkerRequestMessage<TInput>>): Promise<void> => {
    const { requestId, input } = event.data;
    try {
      const output = await handler(input);
      worker.postMessage({
        requestId,
        success: true,
        output,
      } satisfies WorkerResponseMessage<TOutput>);
    } catch (error) {
      worker.postMessage({
        requestId,
        success: false,
        error: errorMessage(error),
      } satisfies WorkerResponseMessage<TOutput>);
    }
  };

export const createWorkerClient = <TInput, TOutput>(
  worker: Worker,
): WorkerClient<TInput, TOutput> => {
  let nextRequestId = 0;
  let disposed = false;
  const pending = new Map<number, PendingRequest<TOutput>>();

  const rejectAll = (error: Error) => {
    pending.forEach((request) => {
      request.removeAbortListener?.();
      request.reject(error);
    });
    pending.clear();
  };

  const onMessage = (event: MessageEvent<WorkerResponseMessage<TOutput>>) => {
    const request = pending.get(event.data.requestId);
    if (!request) {
      return;
    }
    pending.delete(event.data.requestId);
    request.removeAbortListener?.();
    if (event.data.success) {
      request.resolve(event.data.output);
    } else {
      request.reject(new Error(event.data.error));
    }
  };

  const onError = (event: ErrorEvent) => {
    rejectAll(new Error(event.message || "Worker request failed"));
  };

  worker.addEventListener("message", onMessage);
  worker.addEventListener("error", onError);

  return {
    request: (input, options = {}) =>
      new Promise<TOutput>((resolve, reject) => {
        if (disposed) {
          reject(new Error("Worker client has been disposed"));
          return;
        }
        if (options.signal?.aborted) {
          reject(abortError());
          return;
        }

        nextRequestId += 1;
        const requestId = nextRequestId;
        const onAbort = () => {
          const request = pending.get(requestId);
          if (!request) {
            return;
          }
          pending.delete(requestId);
          request.reject(abortError());
        };
        const removeAbortListener = options.signal
          ? () => options.signal?.removeEventListener("abort", onAbort)
          : undefined;

        pending.set(requestId, {
          resolve,
          reject,
          removeAbortListener,
        });
        options.signal?.addEventListener("abort", onAbort, { once: true });

        try {
          worker.postMessage({
            requestId,
            input,
          } satisfies WorkerRequestMessage<TInput>);
        } catch (error) {
          pending.delete(requestId);
          removeAbortListener?.();
          reject(
            error instanceof Error
              ? error
              : new Error("Unable to start worker request"),
          );
        }
      }),
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      rejectAll(new Error("Worker client has been disposed"));
      worker.terminate();
    },
  };
};
