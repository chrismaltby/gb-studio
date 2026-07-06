/** @jest-environment jsdom */

import { encodeSceneTileRef } from "shared/lib/tiles/sceneTilemapData";
import {
  TILE_COLOR_PROP_FLIP_HORIZONTAL,
  TILE_COLOR_PROP_FLIP_VERTICAL,
} from "consts";
import { MonoBGPPalette } from "shared/lib/resources/types";
import { dummyPalette } from "../../dummydata";
import type {
  TilemapLayersCanvasData,
  TilemapLayersCanvasResult,
} from "components/rendering/TilemapLayersCanvas.worker";

const mockCanvases: MockOffscreenCanvas[] = [];

const createContext = () => ({
  fillRect: jest.fn(),
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(8 * 8 * 4).fill(255),
  })),
  putImageData: jest.fn(),
  save: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  restore: jest.fn(),
  fillStyle: "",
  imageSmoothingEnabled: true,
});

class MockOffscreenCanvas {
  context = createContext();

  constructor(
    public width: number,
    public height: number,
  ) {
    mockCanvases.push(this);
  }

  getContext() {
    return this.context;
  }

  transferToImageBitmap() {
    return {} as ImageBitmap;
  }
}

let renderTilemapLayers: (
  data: TilemapLayersCanvasData,
) => Promise<TilemapLayersCanvasResult | undefined>;

beforeAll(async () => {
  Object.defineProperty(global, "Worker", {
    configurable: true,
    value: class {},
  });
  Object.defineProperty(global, "OffscreenCanvas", {
    configurable: true,
    value: MockOffscreenCanvas,
  });
  Object.defineProperty(global, "createImageBitmap", {
    configurable: true,
    value: jest.fn(async () => ({}) as ImageBitmap),
  });
  Object.defineProperty(global, "fetch", {
    configurable: true,
    value: jest.fn(),
  });
  ({ renderTilemapLayers } = await import(
    "components/rendering/TilemapLayersCanvas.worker"
  ));
});

beforeEach(() => {
  mockCanvases.length = 0;
  jest.clearAllMocks();
});

const data = (
  overrides: Partial<TilemapLayersCanvasData> = {},
): TilemapLayersCanvasData => ({
  canvasId: "1",
  sequence: 1,
  width: 1,
  height: 1,
  tiles: Uint32Array.from([encodeSceneTileRef(0, 0)]),
  tileColors: Uint8Array.from([0]),
  tilesetSnapshots: [{ id: "tiles1", width: 1, height: 1 }],
  tilesets: [undefined],
  palettes: [dummyPalette.colors],
  previewAsMono: false,
  monoBGP: [0, 1, 2, 3] as MonoBGPPalette,
  colorCorrection: "none",
  ...overrides,
});

test("fills cells whose tileset image is unavailable", async () => {
  const result = await renderTilemapLayers(data({ tilesets: [undefined] }));

  expect(result).toEqual(
    expect.objectContaining({
      canvasId: "1",
      sequence: 1,
      width: 8,
      height: 8,
    }),
  );
  expect(mockCanvases[0]?.context.fillRect).toHaveBeenCalledWith(0, 0, 8, 8);
  expect(mockCanvases[0]?.context.drawImage).not.toHaveBeenCalled();
});

test.each([
  ["horizontal", TILE_COLOR_PROP_FLIP_HORIZONTAL, -1, 1],
  ["vertical", TILE_COLOR_PROP_FLIP_VERTICAL, 1, -1],
  [
    "horizontal and vertical",
    TILE_COLOR_PROP_FLIP_HORIZONTAL | TILE_COLOR_PROP_FLIP_VERTICAL,
    -1,
    -1,
  ],
])("renders %s tile flips", async (_name, attributes, scaleX, scaleY) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    blob: async () => new Blob(),
  } as Response);

  await renderTilemapLayers(
    data({
      tileColors: Uint8Array.from([attributes]),
      tilesets: [{ id: "tiles1", width: 1, src: `tiles-${attributes}.png` }],
    }),
  );

  expect(mockCanvases[0]?.context.scale).toHaveBeenCalledWith(scaleX, scaleY);
  expect(mockCanvases[0]?.context.save).toHaveBeenCalled();
  expect(mockCanvases[0]?.context.restore).toHaveBeenCalled();
});

test("renders the provided flattened tile data", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    blob: async () => new Blob(),
  } as Response);

  await renderTilemapLayers(
    data({
      tiles: Uint32Array.from([encodeSceneTileRef(0, 2)]),
      tilesetSnapshots: [{ id: "tiles1", width: 3, height: 1 }],
      tilesets: [{ id: "tiles1", width: 3, src: "flatten-layers.png" }],
    }),
  );

  expect(mockCanvases[1]?.context.drawImage).toHaveBeenCalledWith(
    expect.anything(),
    16,
    0,
    8,
    8,
    0,
    0,
    8,
    8,
  );
});
