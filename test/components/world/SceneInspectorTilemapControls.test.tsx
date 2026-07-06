/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "../../react-utils";
import { SceneBackgroundTypeDropdown } from "components/forms/SceneBackgroundTypeDropdown";
import { SceneTilemapSizeControls } from "components/world/inspector/scenes/SceneInspector";

const mockDispatch = jest.fn();

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(),
  useAppSelectorPick: jest.fn(),
}));

jest.mock(
  "components/world/inspector/scenes/tilemap/SceneTilemapLayersPane",
  () => () => null,
);
jest.mock(
  "components/world/inspector/scenes/tilemap/SceneTilemapPalettePane",
  () => () => null,
);
jest.mock("components/script/ScriptEditor", () => () => null);
jest.mock(
  "components/script/menus/ScriptEditorDropdownButton",
  () => () => null,
);
jest.mock("store/features/clipboard/clipboardActions", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("components/forms/SpriteSheetSelectButton", () => ({
  SpriteSheetSelectButton: () => null,
}));
jest.mock("components/forms/BackgroundSelectButton", () => ({
  BackgroundSelectButton: () => null,
}));
jest.mock("components/forms/TilesetSelect", () => ({
  TilesetSelect: () => null,
}));

jest.mock("ui/buttons/DropdownButton", () => ({
  InlineDropdownWrapper: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownButton: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

jest.mock("ui/menu/Menu", () => ({
  MenuDivider: () => null,
  MenuItem: ({
    children,
    onClick,
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock("ui/form/CoordinateInput", () => ({
  CoordinateInput: ({
    name,
    value,
    disabled,
    onChange,
  }: {
    name: string;
    value: number;
    disabled?: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
  }) => (
    <input
      data-testid={name}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("switching image to tilemap enables tilemap layers", () => {
  render(
    <SceneBackgroundTypeDropdown sceneId="scene1" tilemapEnabled={false} />,
  );

  fireEvent.click(screen.getByText("FIELD_TILEMAP"));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "entities/setTilemapLayersEnabled",
    payload: { sceneId: "scene1", enabled: true },
  });
});

test("switching tilemap to image disables tilemap layers", () => {
  render(
    <SceneBackgroundTypeDropdown sceneId="scene1" tilemapEnabled={true} />,
  );

  fireEvent.click(screen.getByText("FIELD_IMAGE"));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "entities/setTilemapLayersEnabled",
    payload: { sceneId: "scene1", enabled: false },
  });
});

test("width and height controls dispatch axis-specific resizes", () => {
  render(
    <SceneTilemapSizeControls
      sceneId="scene1"
      width={20}
      height={18}
      sceneType="TOPDOWN"
    />,
  );

  fireEvent.change(screen.getByTestId("tilemapWidth"), {
    target: { value: "30" },
  });
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "entities/resizeTilemapLayers",
    payload: {
      sceneId: "scene1",
      width: 30,
      height: 18,
      resizeAxis: "width",
    },
  });

  fireEvent.change(screen.getByTestId("tilemapHeight"), {
    target: { value: "24" },
  });
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "entities/resizeTilemapLayers",
    payload: {
      sceneId: "scene1",
      width: 20,
      height: 24,
      resizeAxis: "height",
    },
  });
});

test("logo scenes disable tilemap dimensions", () => {
  render(
    <SceneTilemapSizeControls
      sceneId="scene1"
      width={20}
      height={18}
      sceneType="LOGO"
    />,
  );

  expect(screen.getByTestId("tilemapWidth")).toBeDisabled();
  expect(screen.getByTestId("tilemapHeight")).toBeDisabled();
});

test("Edit Tiles switches to the tile tool", () => {
  render(
    <SceneTilemapSizeControls
      sceneId="scene1"
      width={20}
      height={18}
      sceneType="TOPDOWN"
    />,
  );

  fireEvent.click(screen.getByText("FIELD_EDIT_TILEMAP"));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setTool",
    payload: { tool: "tiles" },
  });
});
