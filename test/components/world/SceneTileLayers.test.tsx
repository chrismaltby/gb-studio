/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "../../react-utils";
import { SceneTileLayers } from "components/world/entities/scenes/SceneTileLayers";
import { dummyBackground, dummySceneNormalized } from "../../dummydata";

const state = {
  scene: dummySceneNormalized,
  background: dummyBackground,
  editor: {
    scene: "",
    tool: "select",
    showLayers: false,
    selectedPalette: 0,
    selectedBrush: "8px",
    slopePreview: undefined,
    scenePaintSelection: undefined,
  },
  project: {
    present: {
      settings: {
        colorMode: "color",
        previewAsMono: false,
        defaultMonoBGP: [0, 1, 2, 3],
        defaultBackgroundPaletteIds: [],
        showCollisions: false,
      },
    },
  },
};

jest.mock("store/hooks", () => ({
  useAppSelector: (selector: (value: typeof state) => unknown) =>
    selector(state),
  useAppSelectorPick: (selector: (value: typeof state) => unknown) =>
    selector(state),
}));

jest.mock("store/features/entities/entitiesSelectors", () => ({
  sceneSelectors: { selectById: (value: typeof state) => value.scene },
  backgroundSelectors: {
    selectById: (value: typeof state) => value.background,
  },
  paletteSelectors: { selectEntities: () => ({}) },
}));

jest.mock("components/rendering/TilemapLayersCanvas", () => () => (
  <div data-testid="tilemap-canvas" />
));
jest.mock("components/rendering/ColorizedImage", () => () => (
  <div data-testid="image-background" />
));
jest.mock("components/rendering/AutoColorizedImage", () => () => (
  <div data-testid="auto-image-background" />
));
jest.mock("components/world/entities/scenes/SceneCollisions", () => () => null);
jest.mock(
  "components/world/entities/scenes/ScenePriorityMap",
  () => () => null,
);
jest.mock(
  "components/world/entities/scenes/SceneSlopePreview",
  () => () => null,
);

beforeEach(() => {
  state.scene = {
    ...dummySceneNormalized,
    id: "scene1",
    backgroundId: "background1",
    width: 1,
    height: 1,
  };
  state.background = {
    ...dummyBackground,
    id: "background1",
    width: 1,
    height: 1,
    autoColor: false,
  };
});

test("renders the tilemap canvas for tilemap scenes", () => {
  state.scene = {
    ...state.scene,
    tilemap: {
      tilesets: [],
      tileColors: [0],
      layers: [
        {
          id: "layer1",
          name: "Layer 1",
          visible: true,
          tiles: [0],
        },
      ],
    },
  };

  render(<SceneTileLayers sceneId="scene1" />);

  expect(screen.getByTestId("tilemap-canvas")).toBeInTheDocument();
  expect(screen.queryByTestId("image-background")).not.toBeInTheDocument();
});

test("renders the image background for non-tilemap scenes", () => {
  render(<SceneTileLayers sceneId="scene1" />);

  expect(screen.getByTestId("image-background")).toBeInTheDocument();
  expect(screen.queryByTestId("tilemap-canvas")).not.toBeInTheDocument();
});
