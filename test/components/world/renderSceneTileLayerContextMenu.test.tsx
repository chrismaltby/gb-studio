import React from "react";
import renderTilemapLayerContextMenu from "components/world/contextMenus/renderTilemapLayerContextMenu";
import entitiesActions from "store/features/entities/entitiesActions";
import { MenuItemDisabled } from "ui/menu/Menu";

type MenuElement = React.ReactElement<{ onClick?: () => void }>;

const findMenuItem = (menu: React.ReactElement[], key: string) =>
  menu.find((item) => item.key === key) as MenuElement;

test("renames a layer using the supplied callback", () => {
  const onRename = jest.fn();
  const menu = renderTilemapLayerContextMenu({
    dispatch: jest.fn(),
    sceneId: "scene1",
    layerId: "layer2",
    layerIndex: 1,
    layerCount: 3,
    visible: true,
    onRename,
  });

  findMenuItem(menu, "rename").props.onClick?.();

  expect(onRename).toHaveBeenCalledTimes(1);
});

test("moves a layer to the top or bottom with one action", () => {
  const dispatch = jest.fn();
  const menu = renderTilemapLayerContextMenu({
    dispatch,
    sceneId: "scene1",
    layerId: "layer2",
    layerIndex: 1,
    layerCount: 4,
    visible: true,
    onRename: jest.fn(),
  });

  findMenuItem(menu, "move-top").props.onClick?.();
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(
    entitiesActions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      direction: "top",
    }),
  );

  dispatch.mockClear();
  findMenuItem(menu, "move-bottom").props.onClick?.();
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(
    entitiesActions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      direction: "bottom",
    }),
  );
});

test("moves a layer up or down one position", () => {
  const dispatch = jest.fn();
  const menu = renderTilemapLayerContextMenu({
    dispatch,
    sceneId: "scene1",
    layerId: "layer2",
    layerIndex: 1,
    layerCount: 3,
    visible: true,
    onRename: jest.fn(),
  });

  findMenuItem(menu, "move-up").props.onClick?.();
  expect(dispatch).toHaveBeenLastCalledWith(
    entitiesActions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      direction: 1,
    }),
  );

  findMenuItem(menu, "move-down").props.onClick?.();
  expect(dispatch).toHaveBeenLastCalledWith(
    entitiesActions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      direction: -1,
    }),
  );
});

test("toggles visibility and deletes a layer", () => {
  const dispatch = jest.fn();
  const menu = renderTilemapLayerContextMenu({
    dispatch,
    sceneId: "scene1",
    layerId: "layer2",
    layerIndex: 1,
    layerCount: 2,
    visible: true,
    onRename: jest.fn(),
  });

  findMenuItem(menu, "visibility").props.onClick?.();
  expect(dispatch).toHaveBeenCalledWith(
    entitiesActions.editTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      changes: { visible: false },
    }),
  );

  findMenuItem(menu, "delete").props.onClick?.();
  expect(dispatch).toHaveBeenCalledWith(
    entitiesActions.removeTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
    }),
  );
});

test("shows a hidden layer", () => {
  const dispatch = jest.fn();
  const menu = renderTilemapLayerContextMenu({
    dispatch,
    sceneId: "scene1",
    layerId: "layer2",
    layerIndex: 1,
    layerCount: 2,
    visible: false,
    onRename: jest.fn(),
  });

  findMenuItem(menu, "visibility").props.onClick?.();

  expect(dispatch).toHaveBeenCalledWith(
    entitiesActions.editTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      changes: { visible: true },
    }),
  );
});

test("disables invalid movement and deletion actions", () => {
  const menu = renderTilemapLayerContextMenu({
    dispatch: jest.fn(),
    sceneId: "scene1",
    layerId: "layer1",
    layerIndex: 0,
    layerCount: 1,
    visible: true,
    onRename: jest.fn(),
  });

  expect(findMenuItem(menu, "move-top").type).toBe(MenuItemDisabled);
  expect(findMenuItem(menu, "move-up").type).toBe(MenuItemDisabled);
  expect(findMenuItem(menu, "move-down").type).toBe(MenuItemDisabled);
  expect(findMenuItem(menu, "move-bottom").type).toBe(MenuItemDisabled);
  expect(findMenuItem(menu, "delete").type).toBe(MenuItemDisabled);
});
