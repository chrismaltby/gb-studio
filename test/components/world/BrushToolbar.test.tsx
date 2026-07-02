/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "../../react-utils";
import BrushToolbar from "components/world/toolbar/BrushToolbar";
import {
  dummyBackground,
  dummyRootState,
  dummySceneNormalized,
  dummyTilesetResource,
} from "../../dummydata";
import { RootState } from "store/storeTypes";
import { BRUSH_8PX, BRUSH_SELECTION, TOOL_COLORS, TOOL_TILES } from "consts";

const mockDispatch = jest.fn();
let mockState: RootState;

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: RootState) => unknown) =>
    selector(mockState),
  useAppSelectorPick: (selector: (state: RootState) => unknown) =>
    selector(mockState),
}));

jest.mock("components/forms/PaletteBlock", () => () => null);
jest.mock("components/forms/PaletteSelect", () => ({
  PaletteSelect: () => null,
}));
jest.mock("components/collisions/CollisionTileIcon", () => ({
  CollisionTileIcon: () => null,
}));
jest.mock("ui/layout/RelativePortal", () => ({
  RelativePortal: ({ children }: React.PropsWithChildren) => children,
}));

const createState = ({
  tool = TOOL_TILES,
  brush = BRUSH_8PX,
  eraser = false,
  autotile = false,
  validAutotile = true,
  tilemap = true,
}: {
  tool?: RootState["editor"]["tool"];
  brush?: RootState["editor"]["selectedBrush"];
  eraser?: boolean;
  autotile?: boolean;
  validAutotile?: boolean;
  tilemap?: boolean;
} = {}): RootState =>
  ({
    ...dummyRootState,
    editor: {
      ...dummyRootState.editor,
      scene: "scene1",
      tool,
      selectedBrush: brush,
      scenePaintEraser: eraser,
      selectedSceneTile: {
        tilesetId: "tileset1",
        tileIndex: 0,
        width: 1,
        height: 1,
        tilesetWidth: 32,
        autotile,
      },
    },
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        entities: {
          ...dummyRootState.project.present.entities,
          scenes: {
            ids: ["scene1"],
            entities: {
              scene1: {
                ...dummySceneNormalized,
                id: "scene1",
                backgroundId: "background1",
                ...(tilemap
                  ? {
                      tilemap: {
                        tilesets: [],
                        layers: [],
                        tileColors: [],
                      },
                    }
                  : {}),
              },
            },
          },
          backgrounds: {
            ids: ["background1"],
            entities: {
              background1: {
                ...dummyBackground,
                id: "background1",
                autoColor: true,
              },
            },
          },
          tilesets: {
            ids: ["tileset1"],
            entities: {
              tileset1: {
                ...dummyTilesetResource,
                inode: "tileset1",
                _v: 0,
                autotileGroups: validAutotile ? [0] : [],
              },
            },
          },
        },
      },
    },
  }) as RootState;

beforeEach(() => {
  jest.clearAllMocks();
  mockState = createState();
});

test("tile eraser toggles scenePaintEraser and disables autotile", () => {
  render(<BrushToolbar hasFocusForKeyboardShortcuts={() => true} />);

  fireEvent.click(screen.getByTitle("TOOL_ERASER_LABEL"));

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setScenePaintEraser",
    payload: true,
  });
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setSelectedSceneTileAutotile",
    payload: false,
  });
});

test("choosing the eraser leaves the selection brush", () => {
  mockState = createState({ brush: BRUSH_SELECTION });

  render(<BrushToolbar hasFocusForKeyboardShortcuts={() => true} />);
  fireEvent.click(screen.getByTitle("TOOL_ERASER_LABEL"));

  expect(mockDispatch.mock.calls[0][0]).toEqual({
    type: "editor/setBrush",
    payload: { brush: BRUSH_8PX },
  });
});

test("invalid autotile selection is disabled", () => {
  mockState = createState({ autotile: true, validAutotile: false });

  render(<BrushToolbar hasFocusForKeyboardShortcuts={() => true} />);

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setSelectedSceneTileAutotile",
    payload: false,
  });
});

test("tilemap scenes hide image background autocolor controls", () => {
  mockState = createState({ tool: TOOL_COLORS, tilemap: true });

  render(<BrushToolbar hasFocusForKeyboardShortcuts={() => true} />);

  expect(screen.queryByTitle("FIELD_AUTO_COLOR")).not.toBeInTheDocument();
});

test("image scenes retain background autocolor controls", () => {
  mockState = createState({ tool: TOOL_COLORS, tilemap: false });

  render(<BrushToolbar hasFocusForKeyboardShortcuts={() => true} />);

  expect(screen.getByTitle("FIELD_AUTO_COLOR")).toBeInTheDocument();
});
