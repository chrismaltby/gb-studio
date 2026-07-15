import type {
  TilemapLayersCanvasData,
  TilemapLayersCanvasResult,
} from "./TilemapLayersCanvas.worker";

type Listener = (event: MessageEvent<TilemapLayersCanvasResult>) => void;

interface PendingRequest {
  data: TilemapLayersCanvasData;
  transfer: Transferable[];
}

interface WorkerSlot {
  worker: Worker;
  busy: boolean;
  listeners: Map<string, Listener>;
  pending: Map<string, PendingRequest>;
}

const workerCount = Math.min(
  2,
  Math.max(1, navigator.hardwareConcurrency - 2 || 1),
);

const slots: WorkerSlot[] = [];
let nextSlot = 0;

const dispatchNext = (slot: WorkerSlot) => {
  if (slot.busy) {
    return;
  }
  const next = slot.pending.entries().next().value as
    [string, PendingRequest] | undefined;
  if (!next) {
    return;
  }

  const [canvasId, request] = next;
  slot.pending.delete(canvasId);
  slot.busy = true;
  slot.worker.postMessage(request.data, request.transfer);
};

for (let index = 0; index < workerCount; index++) {
  const worker = new Worker(
    new URL("./TilemapLayersCanvas.worker.ts", import.meta.url),
  );
  const slot: WorkerSlot = {
    worker,
    busy: false,
    listeners: new Map(),
    pending: new Map(),
  };
  worker.addEventListener(
    "message",
    (event: MessageEvent<TilemapLayersCanvasResult>) => {
      slot.busy = false;
      const listener = slot.listeners.get(event.data.canvasId);
      if (listener) {
        listener(event);
      } else {
        event.data.canvasImage.close?.();
      }
      dispatchNext(slot);
    },
  );
  worker.addEventListener("error", () => {
    slot.busy = false;
    dispatchNext(slot);
  });
  slots.push(slot);
}

export interface TilemapLayersWorkerHandle {
  subscribe: (listener: Listener) => () => void;
  request: (data: TilemapLayersCanvasData, transfer: Transferable[]) => void;
}

export const createTilemapLayersWorkerHandle = (
  canvasId: string,
): TilemapLayersWorkerHandle => {
  const slot = slots[nextSlot++ % slots.length];

  return {
    subscribe: (listener) => {
      slot.listeners.set(canvasId, listener);
      return () => {
        if (slot.listeners.get(canvasId) === listener) {
          slot.listeners.delete(canvasId);
          slot.pending.delete(canvasId);
        }
      };
    },
    request: (data, transfer) => {
      slot.pending.delete(canvasId);
      slot.pending.set(canvasId, { data, transfer });
      dispatchNext(slot);
    },
  };
};
