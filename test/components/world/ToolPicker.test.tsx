/** @jest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "../../react-utils";
import ToolPicker from "components/world/toolbar/ToolPicker";
import { dummyRootState, dummySceneNormalized } from "../../dummydata";
import { RootState } from "store/storeTypes";

const mockDispatch = jest.fn();
let mockState: RootState;

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: RootState) => unknown) =>
    selector(mockState),
}));

jest.mock("ui/buttons/DropdownButton", () => ({
  DropdownButton: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

jest.mock("ui/menu/Menu", () => ({
  MenuDivider: () => null,
  MenuItem: ({
    children,
    onClick,
    subMenu,
  }: React.PropsWithChildren<{
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    subMenu?: React.ReactNode;
  }>) => (
    <div>
      <button onClick={onClick}>{children}</button>
      {subMenu}
    </div>
  ),
}));

const stateWithScene = (tilemap: boolean, tool = "select"): RootState => ({
  ...dummyRootState,
  editor: {
    ...dummyRootState.editor,
    scene: "scene1",
    tool: tool as RootState["editor"]["tool"],
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
      },
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockState = stateWithScene(true);
});

test("scene subtype menu selects the add type before the scene tool", () => {
  render(<ToolPicker hasFocusForKeyboardShortcuts={() => true} />);

  fireEvent.click(screen.getByText("FIELD_TILEMAP_SCENE"));

  expect(mockDispatch.mock.calls).toEqual([
    [
      {
        type: "editor/setSceneAddType",
        payload: "tilemap",
      },
    ],
    [
      {
        type: "editor/setTool",
        payload: { tool: "scene" },
      },
    ],
  ]);
});

test("shows the tile tool only for a tilemap scene", () => {
  const { rerender } = render(
    <ToolPicker hasFocusForKeyboardShortcuts={() => true} />,
  );

  expect(screen.getByTitle("FIELD_TILES (x)")).toBeInTheDocument();

  mockState = stateWithScene(false);
  rerender(<ToolPicker hasFocusForKeyboardShortcuts={() => true} />);

  expect(screen.queryByTitle("FIELD_TILES (x)")).not.toBeInTheDocument();
});

test("X selects the tile tool only when it is available", () => {
  const { rerender } = render(
    <ToolPicker hasFocusForKeyboardShortcuts={() => true} />,
  );

  fireEvent.keyDown(window, { code: "KeyX" });
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setTool",
    payload: { tool: "tiles" },
  });

  mockDispatch.mockClear();
  mockState = stateWithScene(false);
  rerender(<ToolPicker hasFocusForKeyboardShortcuts={() => true} />);
  fireEvent.keyDown(window, { code: "KeyX" });

  expect(mockDispatch).not.toHaveBeenCalled();
});

test("leaves the tile tool when the selected scene has no tilemap", () => {
  mockState = stateWithScene(false, "tiles");

  render(<ToolPicker hasFocusForKeyboardShortcuts={() => true} />);

  expect(mockDispatch).toHaveBeenCalledWith({
    type: "editor/setTool",
    payload: { tool: "select" },
  });
});
