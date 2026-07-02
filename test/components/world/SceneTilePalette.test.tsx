/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "../../react-utils";
import SceneTilePalette from "components/world/inspector/scenes/tilemap/SceneTilePalette";

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
  },
  {
    id: "tileset2",
    name: "Tileset 2",
    filename: "tileset2.png",
    width: 8,
    height: 4,
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
  },
  project: {
    present: { settings: { selectedSceneTilesetId: "tileset1" } },
  },
};

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: typeof mockState) => unknown) =>
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
  mockState.project.present.settings.selectedSceneTilesetId = "tileset1";
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
