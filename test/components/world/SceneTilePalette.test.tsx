/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "../../react-utils";
import SceneTilePalette from "components/world/inspector/scenes/tilemap/SceneTilePalette";
import { TILE_COLOR_PROP_PRIORITY } from "consts";

const mockDispatch: jest.Mock<unknown, [unknown]> = jest.fn(
  (action: unknown): unknown =>
    typeof action === "function"
      ? (
          action as (
            dispatch: typeof mockDispatch,
            getState: () => typeof mockState,
            extra: undefined,
          ) => unknown
        )(mockDispatch, () => mockState, undefined)
      : action,
);
const mockScene = {
  id: "scene1",
  type: "TOPDOWN",
  paletteIds: [],
  tilemap: {
    layers: [
      { id: "layer1", name: "Layer 1", visible: true },
      { id: "layer2", name: "Layer 2", visible: true },
    ],
  },
};
const mockTilesets = [
  {
    id: "tileset1",
    name: "Tileset 1",
    filename: "tileset1.png",
    width: 10,
    height: 5,
    tileColors: new Array(50).fill(-1),
    tileCollisions: new Array(50).fill(-1),
  },
  {
    id: "tileset2",
    name: "Tileset 2",
    filename: "tileset2.png",
    width: 8,
    height: 4,
    tileColors: new Array(32).fill(-1),
    tileCollisions: new Array(32).fill(-1),
  },
];
const mockState = {
  editor: {
    selectedSceneTile: {
      tilesetId: "tileset1",
      tileIndex: 0,
      width: 1,
      height: 1,
      tilesetWidth: 10,
      autotile: false,
    },
    selectedTilemapLayerId: "layer2",
    selectedPalette: 0,
    selectedTileType: 1,
    selectedTileMask: 0x0f,
    scenePaintEraser: false,
  },
  project: {
    present: {
      settings: {
        selectedSceneTilesetId: "tileset1",
        defaultBackgroundPaletteIds: [],
      },
    },
  },
  engine: { sceneTypes: [] },
};

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
  useAppSelectorPick: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
  useAppSelectorPickArray: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
}));

jest.mock("store/features/entities/entitiesSelectors", () => ({
  sceneSelectors: { selectById: () => mockScene },
  tilesetSelectors: {
    selectAll: () => mockTilesets,
    selectById: (_state: unknown, id: string) =>
      mockTilesets.find((tileset) => tileset.id === id),
  },
  paletteSelectors: { selectEntities: () => ({}) },
}));

jest.mock("components/forms/TilesetSelect", () => ({
  TilesetSelect: ({ onChange }: { onChange: (id: string) => void }) => (
    <button data-testid="select-tileset" onClick={() => onChange("tileset2")} />
  ),
}));

jest.mock("ui/lists/FlatList", () => ({
  FlatList: ({
    items,
    setSelectedId,
    children,
  }: {
    items: typeof mockScene.tilemap.layers;
    setSelectedId: (id: string) => void;
    children: (props: {
      item: (typeof mockScene.tilemap.layers)[number];
    }) => React.ReactNode;
  }) => (
    <>
      {items.map((item) => (
        <div key={item.id}>
          <button
            data-testid={`select-${item.id}`}
            onClick={() => setSelectedId(item.id)}
          />
          {children({ item })}
        </div>
      ))}
    </>
  ),
}));

jest.mock("ui/lists/EntityListItem", () => ({
  EntityListItem: ({
    item,
    icon,
    onRename,
  }: {
    item: { id: string };
    icon: React.ReactNode;
    onRename: (name: string) => void;
  }) => (
    <div>
      {icon}
      <button
        data-testid={`rename-${item.id}`}
        onClick={() => onRename("Renamed Layer")}
      />
    </div>
  ),
}));

jest.mock("ui/splitpane/SplitPaneHeader", () => ({
  SplitPaneHeader: ({
    buttons,
    children,
  }: React.PropsWithChildren<{ buttons?: React.ReactNode }>) => (
    <div>
      {buttons}
      {children}
    </div>
  ),
}));

jest.mock("ui/buttons/ZoomButton", () => ({ ZoomButton: () => null }));
jest.mock("ui/icons/Icons", () => ({
  EyeClosedIcon: () => null,
  EyeOpenIcon: () => null,
  PlusIcon: () => null,
  PencilIcon: () => null,
  EraserIcon: () => null,
  PriorityTileIcon: () => null,
  ShieldIcon: () => null,
}));
jest.mock("components/forms/PaletteBlock", () => () => null);
jest.mock("components/collisions/CollisionTileIcon", () => ({
  CollisionTileIcon: () => null,
}));
jest.mock("components/rendering/ColorizedImage", () => () => <canvas />);
jest.mock(
  "components/world/entities/scenes/ScenePriorityMap",
  () => () => null,
);
jest.mock("components/world/entities/scenes/SceneCollisions", () => () => null);
jest.mock(
  "components/world/inspector/scenes/tilemap/TilesetUnsetDefaultsOverlay",
  () => () => <div data-testid="unset-defaults-overlay" />,
);
jest.mock("ui/tabs/Tabs", () => ({
  TabBar: ({
    onChange,
  }: {
    onChange: (value: "colors" | "collisions") => void;
  }) => (
    <div>
      <button
        data-testid="defaults-colors"
        onClick={() => onChange("colors")}
      />
      <button
        data-testid="defaults-collisions"
        onClick={() => onChange("collisions")}
      />
    </div>
  ),
}));
jest.mock(
  "components/world/contextMenus/renderTilemapLayerContextMenu",
  () => () => [],
);

const dispatched = (type: string) =>
  mockDispatch.mock.calls
    .map(
      ([action]) =>
        action as { type?: string; payload?: Record<string, unknown> },
    )
    .filter((action) => action.type === type);

beforeEach(() => {
  jest.clearAllMocks();
  mockState.editor.selectedSceneTile = {
    tilesetId: "tileset1",
    tileIndex: 0,
    width: 1,
    height: 1,
    tilesetWidth: 10,
    autotile: false,
  };
  mockState.editor.selectedTilemapLayerId = "layer2";
  mockState.editor.selectedPalette = 0;
  mockState.editor.selectedTileType = 1;
  mockState.editor.selectedTileMask = 0x0f;
  mockState.editor.scenePaintEraser = false;
  mockState.project.present.settings.selectedSceneTilesetId = "tileset1";
  mockTilesets[0].tileColors.fill(-1);
  mockTilesets[0].tileCollisions.fill(-1);
});

const setPaletteBounds = (width = 80, height = 40) => {
  const surface = screen.getByTestId("scene-tile-palette-surface");
  jest.spyOn(surface, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  });
  return surface;
};

test("selecting a tile dispatches selectSceneTileForPainting", () => {
  render(<SceneTilePalette sceneId="scene1" />);
  mockDispatch.mockClear();
  const surface = setPaletteBounds();

  fireEvent.mouseDown(surface, { clientX: 20, clientY: 20 });

  expect(dispatched("editor/setSelectedSceneTile")[0]?.payload).toEqual(
    expect.objectContaining({
      tilesetId: "tileset1",
      tileIndex: 22,
      width: 1,
      height: 1,
      tilesetWidth: 10,
    }),
  );
});

test("drag selection sets tile index, width, height and tileset width", () => {
  render(<SceneTilePalette sceneId="scene1" />);
  mockDispatch.mockClear();
  const surface = setPaletteBounds();

  fireEvent.mouseDown(surface, { clientX: 8, clientY: 8 });
  fireEvent.mouseMove(surface, { clientX: 32, clientY: 24, buttons: 1 });

  expect(dispatched("editor/setSelectedSceneTile").at(-1)?.payload).toEqual(
    expect.objectContaining({
      tilesetId: "tileset1",
      tileIndex: 11,
      width: 4,
      height: 3,
      tilesetWidth: 10,
    }),
  );
});

test("add layer selects the new layer", () => {
  render(<SceneTilePalette sceneId="scene1" />);
  mockDispatch.mockClear();

  fireEvent.click(screen.getByTitle("FIELD_ADD_LAYER"));

  const addAction = dispatched("entities/addTilemapLayer")[0];
  expect(addAction).toBeDefined();
  const newLayerId = addAction?.payload?.layerId;
  expect(newLayerId).toEqual(expect.any(String));
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setSelectedTilemapLayerId",
    payload: newLayerId,
  });
});

test("rename dispatches editTilemapLayer", () => {
  render(<SceneTilePalette sceneId="scene1" />);
  mockDispatch.mockClear();

  fireEvent.click(screen.getByTestId("rename-layer1"));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "entities/editTilemapLayer",
    payload: {
      sceneId: "scene1",
      layerId: "layer1",
      changes: { name: "Renamed Layer" },
    },
  });
});

test("changing tileset persists and selects the first tile", () => {
  render(<SceneTilePalette sceneId="scene1" />);
  mockDispatch.mockClear();

  fireEvent.click(screen.getByTestId("select-tileset"));

  expect(dispatched("editor/setSelectedSceneTile")[0]?.payload).toEqual(
    expect.objectContaining({
      tilesetId: "tileset2",
      tileIndex: 0,
      tilesetWidth: 8,
    }),
  );
  expect(dispatched("settings/editSettings")[0]?.payload).toEqual({
    selectedSceneTilesetId: "tileset2",
  });
});

test("restores the preferred tileset without writing settings again", () => {
  mockState.project.present.settings.selectedSceneTilesetId = "tileset2";

  render(<SceneTilePalette sceneId="scene1" />);

  expect(dispatched("editor/setSelectedSceneTile")[0]?.payload).toEqual(
    expect.objectContaining({
      tilesetId: "tileset2",
      tileIndex: 0,
      tilesetWidth: 8,
    }),
  );
  expect(dispatched("settings/editSettings")).toHaveLength(0);
  expect(dispatched("editor/setTool")).toHaveLength(0);
});

const enterDefaultsMode = () => {
  fireEvent.click(screen.getByTitle("FIELD_EDIT_TILE_DEFAULTS"));
  mockDispatch.mockClear();
  return setPaletteBounds();
};

test("paintTilesetColor dispatches the selected palette value", () => {
  mockState.editor.selectedPalette = 3;
  render(<SceneTilePalette sceneId="scene1" />);
  const surface = enterDefaultsMode();
  fireEvent.click(screen.getByTestId("defaults-colors"));
  mockDispatch.mockClear();

  fireEvent.mouseDown(surface, { clientX: 20, clientY: 20 });

  expect(dispatched("entities/paintTilesetColor")[0]?.payload).toEqual({
    tilesetId: "tileset1",
    x: 2,
    y: 2,
    value: 3,
    isTileProp: false,
    clear: false,
  });
});

test("paintTilesetCollision dispatches the expected value and mask", () => {
  render(<SceneTilePalette sceneId="scene1" />);
  const surface = enterDefaultsMode();

  fireEvent.mouseDown(surface, { clientX: 20, clientY: 20 });

  expect(dispatched("entities/paintTilesetCollision")[0]?.payload).toEqual({
    tilesetId: "tileset1",
    x: 2,
    y: 2,
    value: 1,
    mask: 0x0f,
    clear: false,
  });
});

test("keep mode clears the tile default back to unset", () => {
  mockState.editor.scenePaintEraser = true;
  render(<SceneTilePalette sceneId="scene1" />);
  const surface = enterDefaultsMode();

  fireEvent.mouseDown(surface, { clientX: 20, clientY: 20 });

  expect(dispatched("entities/paintTilesetCollision")[0]?.payload).toEqual(
    expect.objectContaining({
      value: 0,
      mask: 0xff,
      clear: true,
    }),
  );
});

test("property defaults dispatch the priority flag", () => {
  mockState.editor.selectedPalette = TILE_COLOR_PROP_PRIORITY;
  render(<SceneTilePalette sceneId="scene1" />);
  const surface = enterDefaultsMode();
  fireEvent.click(screen.getByTestId("defaults-colors"));
  mockDispatch.mockClear();

  fireEvent.mouseDown(surface, { clientX: 20, clientY: 20 });

  expect(dispatched("entities/paintTilesetColor")[0]?.payload).toEqual(
    expect.objectContaining({
      value: TILE_COLOR_PROP_PRIORITY,
      isTileProp: true,
      clear: false,
    }),
  );
});
