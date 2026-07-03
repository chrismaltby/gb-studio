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

jest.mock("components/rendering/TilemapLayersCanvas.worker", () => ({
  __esModule: true,
  default: class MockWorker implements MockWorkerInstance {
    listeners: Array<(event: MessageEvent) => void> = [];
    postMessage = jest.fn();

    constructor() {
      (mockWorkers ??= []).push(this);
    }

    addEventListener(_type: string, listener: (event: MessageEvent) => void) {
      this.listeners.push(listener);
    }

    removeEventListener(
      _type: string,
      listener: (event: MessageEvent) => void,
    ) {
      this.listeners = this.listeners.filter((item) => item !== listener);
    }

    emit(data: unknown) {
      this.listeners.forEach((listener) => listener({ data } as MessageEvent));
    }
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
  expect(worker?.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({
      width: 1,
      height: 1,
      tileColors: [0],
      tilesets: [expect.objectContaining({ id: "tiles1", width: 1 })],
      palettes: [dummyPalette.colors],
      colorCorrection: "none",
    }),
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

  worker?.emit({ id: request.id, width: 8, height: 8, canvasImage });

  expect(bitmapContext.transferFromImageBitmap).toHaveBeenCalledWith(
    canvasImage,
  );
  expect(canvasContext.drawImage).toHaveBeenCalled();
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
  await waitFor(() => expect(worker?.postMessage).toHaveBeenCalledTimes(2));
  worker?.emit({
    id: staleRequest.id,
    width: 8,
    height: 8,
    canvasImage: {} as ImageBitmap,
  });

  expect(bitmapContext.transferFromImageBitmap).not.toHaveBeenCalled();
});
