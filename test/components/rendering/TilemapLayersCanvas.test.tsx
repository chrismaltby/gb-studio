/** @jest-environment jsdom */

import React from "react";
import { render, waitFor } from "../../react-utils";
import TilemapLayersCanvas from "components/rendering/TilemapLayersCanvas";
import { dummyPalette, dummyTilesetResource } from "../../dummydata";
import { MonoBGPPalette } from "shared/lib/resources/types";

interface MockWorkerInstance {
  listeners: Array<(event: MessageEvent) => void>;
  postMessage: jest.Mock;
  emit: (data: unknown) => void;
}

// `var` is intentional: Jest evaluates the mock factory before module imports.
// eslint-disable-next-line no-var
var mockWorkers: MockWorkerInstance[];

jest.mock("components/rendering/tilemapLayersWorkerPool", () => ({
  __esModule: true,
  createTilemapLayersWorkerHandle: () => {
    const worker: MockWorkerInstance = {
      listeners: [],
      postMessage: jest.fn(),
      emit(data: unknown) {
        this.listeners.forEach((listener) =>
          listener({ data } as MessageEvent),
        );
      },
    };
    (mockWorkers ??= []).push(worker);

    return {
      subscribe: (listener: (event: MessageEvent) => void) => {
        worker.listeners.push(listener);
        return () => {
          worker.listeners = worker.listeners.filter(
            (item) => item !== listener,
          );
        };
      },
      request: (data: unknown, transfer: Transferable[]) => {
        worker.postMessage(data, transfer);
      },
    };
  },
}));

const mockState = {
  project: {
    present: {
      settings: { colorCorrection: "none" },
      entities: { tilesets: { entities: {} as Record<string, unknown> } },
    },
  },
};

jest.mock("store/hooks", () => ({
  useAppSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
  shallowEqualArray: (a: unknown[], b: unknown[]) => a === b,
}));

const bitmapContext = { transferFromImageBitmap: jest.fn() };
const canvasContext = {
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  imageSmoothingEnabled: true,
};

const baseProps = {
  width: 1,
  height: 1,
  tilemap: { tilesets: [], tileColors: [0], layers: [] },
  tileColors: [0],
  palettes: [dummyPalette],
  monoBGP: [0, 1, 2, 3] as MonoBGPPalette,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockState.project.present.entities.tilesets.entities = {};
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(
      (contextId: string) =>
        (contextId === "bitmaprenderer"
          ? bitmapContext
          : canvasContext) as unknown as RenderingContext,
    );
});

afterEach(() => {
  mockWorkers.forEach((worker) => {
    const request = worker.postMessage.mock.calls.at(-1)?.[0];
    if (request) {
      worker.emit({
        canvasId: request.canvasId,
        sequence: request.sequence,
        width: 8,
        height: 8,
        canvasImage: { close: jest.fn() } as unknown as ImageBitmap,
      });
    }
  });
  jest.restoreAllMocks();
});

test("sends tilemap rendering data to a worker", async () => {
  mockState.project.present.entities.tilesets.entities.tiles1 = {
    ...dummyTilesetResource,
    id: "tiles1",
    filename: "tiles1.png",
    width: 1,
    height: 1,
  };

  render(
    <TilemapLayersCanvas
      {...baseProps}
      tilemap={{
        ...baseProps.tilemap,
        tilesets: [{ id: "tiles1", width: 1, height: 1 }],
      }}
    />,
  );

  await waitFor(() =>
    expect(
      mockWorkers.some((worker) => worker.postMessage.mock.calls.length > 0),
    ).toBe(true),
  );
  const worker = mockWorkers.find(
    (item) => item.postMessage.mock.calls.length > 0,
  );
  expect(worker?.postMessage.mock.calls.at(-1)?.[0]).not.toHaveProperty(
    "tilemap",
  );
  expect(worker?.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      width: 1,
      height: 1,
      tiles: Uint32Array.from([0]),
      tileColors: Uint8Array.from([0]),
      tilesets: [expect.objectContaining({ id: "tiles1", width: 1 })],
      palettes: [dummyPalette.colors],
      colorCorrection: "none",
    }),
    expect.any(Array),
  );
});

test("draws the latest worker bitmap onto the visible canvas", async () => {
  render(<TilemapLayersCanvas {...baseProps} />);
  await waitFor(() =>
    expect(
      mockWorkers.some((worker) => worker.postMessage.mock.calls.length > 0),
    ).toBe(true),
  );
  const worker = mockWorkers.find(
    (item) => item.postMessage.mock.calls.length > 0,
  );
  const request = worker?.postMessage.mock.calls[0]?.[0];
  const canvasImage = {} as ImageBitmap;

  worker?.emit({
    canvasId: request.canvasId,
    sequence: request.sequence,
    width: 8,
    height: 8,
    canvasImage,
  });

  expect(canvasContext.clearRect).toHaveBeenCalledWith(0, 0, 8, 8);
  expect(canvasContext.imageSmoothingEnabled).toBe(false);
  expect(canvasContext.drawImage).toHaveBeenCalledWith(canvasImage, 0, 0);
  expect(bitmapContext.transferFromImageBitmap).not.toHaveBeenCalled();
});

test("ignores stale worker responses", async () => {
  const view = render(<TilemapLayersCanvas {...baseProps} />);
  await waitFor(() =>
    expect(
      mockWorkers.some((worker) => worker.postMessage.mock.calls.length === 1),
    ).toBe(true),
  );
  const worker = mockWorkers.find(
    (item) => item.postMessage.mock.calls.length === 1,
  );
  const staleRequest = worker?.postMessage.mock.calls[0]?.[0];

  view.rerender(
    <TilemapLayersCanvas
      {...baseProps}
      tilemap={{
        ...baseProps.tilemap,
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: [1],
          },
        ],
      }}
    />,
  );
  worker?.emit({
    canvasId: staleRequest.canvasId,
    sequence: staleRequest.sequence,
    width: 8,
    height: 8,
    canvasImage: {} as ImageBitmap,
  });
  await waitFor(() => expect(worker?.postMessage).toHaveBeenCalledTimes(2));
  const latestRequest = worker?.postMessage.mock.calls[1]?.[0];
  worker?.emit({
    canvasId: latestRequest.canvasId,
    sequence: latestRequest.sequence,
    width: 8,
    height: 8,
    canvasImage: {} as ImageBitmap,
  });
  canvasContext.drawImage.mockClear();
  worker?.emit({
    canvasId: staleRequest.canvasId,
    sequence: staleRequest.sequence,
    width: 8,
    height: 8,
    canvasImage: {} as ImageBitmap,
  });

  expect(canvasContext.drawImage).not.toHaveBeenCalled();
});
