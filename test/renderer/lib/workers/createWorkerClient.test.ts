import {
  createWorkerClient,
  createWorkerRequestHandler,
  isWorkerRequestAbortError,
  WorkerRequestMessage,
  WorkerResponseMessage,
} from "renderer/lib/workers/createWorkerClient";

type Input = { value: string };
type Output = { result: string };

class FakeWorker {
  postMessage = jest.fn();
  terminate = jest.fn();
  private messageListeners = new Set<
    (event: MessageEvent<WorkerResponseMessage<Output>>) => void
  >();
  private errorListeners = new Set<(event: ErrorEvent) => void>();

  addEventListener(
    type: string,
    listener:
      | ((event: MessageEvent<WorkerResponseMessage<Output>>) => void)
      | ((event: ErrorEvent) => void),
  ) {
    if (type === "message") {
      this.messageListeners.add(
        listener as (
          event: MessageEvent<WorkerResponseMessage<Output>>,
        ) => void,
      );
    } else if (type === "error") {
      this.errorListeners.add(listener as (event: ErrorEvent) => void);
    }
  }

  removeEventListener(
    type: string,
    listener:
      | ((event: MessageEvent<WorkerResponseMessage<Output>>) => void)
      | ((event: ErrorEvent) => void),
  ) {
    if (type === "message") {
      this.messageListeners.delete(
        listener as (
          event: MessageEvent<WorkerResponseMessage<Output>>,
        ) => void,
      );
    } else if (type === "error") {
      this.errorListeners.delete(listener as (event: ErrorEvent) => void);
    }
  }

  respond(response: WorkerResponseMessage<Output>) {
    this.messageListeners.forEach((listener) =>
      listener({ data: response } as MessageEvent),
    );
  }

  fail(message: string) {
    this.errorListeners.forEach((listener) =>
      listener({ message } as ErrorEvent),
    );
  }
}

const postedRequest = (
  worker: FakeWorker,
  index: number,
): WorkerRequestMessage<Input> =>
  worker.postMessage.mock.calls[index]?.[0] as WorkerRequestMessage<Input>;

describe("createWorkerClient", () => {
  it("posts typed request envelopes and resolves their response", async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient<Input, Output>(
      worker as unknown as Worker,
    );

    const resultPromise = client.request({ value: "hello" });
    expect(postedRequest(worker, 0)).toEqual({
      requestId: 1,
      input: { value: "hello" },
    });

    worker.respond({
      requestId: 1,
      success: true,
      output: { result: "world" },
    });

    await expect(resultPromise).resolves.toEqual({ result: "world" });
  });

  it("correlates concurrent responses by request ID", async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient<Input, Output>(
      worker as unknown as Worker,
    );

    const first = client.request({ value: "first" });
    const second = client.request({ value: "second" });

    worker.respond({
      requestId: 2,
      success: true,
      output: { result: "second result" },
    });
    worker.respond({
      requestId: 999,
      success: true,
      output: { result: "unrelated" },
    });
    worker.respond({
      requestId: 1,
      success: true,
      output: { result: "first result" },
    });

    await expect(first).resolves.toEqual({ result: "first result" });
    await expect(second).resolves.toEqual({ result: "second result" });
  });

  it("rejects an aborted request and ignores its eventual response", async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient<Input, Output>(
      worker as unknown as Worker,
    );
    const abortController = new AbortController();

    const resultPromise = client.request(
      { value: "cancel me" },
      { signal: abortController.signal },
    );
    abortController.abort();
    worker.respond({
      requestId: 1,
      success: true,
      output: { result: "too late" },
    });

    await expect(resultPromise).rejects.toSatisfy(isWorkerRequestAbortError);
  });

  it("rejects every pending request if the worker fails", async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient<Input, Output>(
      worker as unknown as Worker,
    );

    const first = client.request({ value: "first" });
    const second = client.request({ value: "second" });
    worker.fail("worker exploded");

    await expect(first).rejects.toThrow("worker exploded");
    await expect(second).rejects.toThrow("worker exploded");
  });

  it("rejects only the request identified by an error response", async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient<Input, Output>(
      worker as unknown as Worker,
    );

    const first = client.request({ value: "first" });
    const second = client.request({ value: "second" });
    worker.respond({
      requestId: 1,
      success: false,
      error: "first request failed",
    });
    worker.respond({
      requestId: 2,
      success: true,
      output: { result: "second result" },
    });

    await expect(first).rejects.toThrow("first request failed");
    await expect(second).resolves.toEqual({ result: "second result" });
  });

  it("rejects pending and future requests when disposed", async () => {
    const worker = new FakeWorker();
    const client = createWorkerClient<Input, Output>(
      worker as unknown as Worker,
    );
    const pending = client.request({ value: "pending" });

    client.dispose();

    await expect(pending).rejects.toThrow("disposed");
    await expect(client.request({ value: "future" })).rejects.toThrow(
      "disposed",
    );
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
});

describe("createWorkerRequestHandler", () => {
  it("returns a correlated error response when a handler rejects", async () => {
    const worker = {
      postMessage: jest.fn(),
    };
    const handler = createWorkerRequestHandler<Input, Output>(
      worker,
      async () => {
        throw new Error("scan failed");
      },
    );

    await handler({
      data: {
        requestId: 42,
        input: { value: "hello" },
      },
    } as MessageEvent<WorkerRequestMessage<Input>>);

    expect(worker.postMessage).toHaveBeenCalledWith({
      requestId: 42,
      success: false,
      error: "scan failed",
    });
  });
});
