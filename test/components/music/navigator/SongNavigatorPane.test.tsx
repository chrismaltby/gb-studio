/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen } from "../../../react-utils";
import { SongNavigatorPane } from "../../../../src/components/music/navigator/SongNavigatorPane";

const mockDispatch = jest.fn();
const mockSetSelectedId = jest.fn();
const mockNavigatorItems = [
  {
    id: "song-1",
    name: "Song 1",
    filename: "song1.uge",
    type: "file",
    nestLevel: 0,
  },
  {
    id: "song-2",
    name: "Song 2",
    filename: "song2.uge",
    type: "file",
    nestLevel: 0,
  },
];

jest.mock("../../../../src/store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn((selector) =>
    selector({
      project: {
        present: {},
      },
      editor: {
        navigatorSearch: {
          songs: undefined,
        },
      },
    }),
  ),
}));

jest.mock("../../../../src/store/features/entities/entitiesSelectors", () => ({
  musicSelectors: {
    selectAll: () => [
      { id: "song-1", filename: "song1.uge", name: "Song 1" },
      { id: "song-2", filename: "song2.uge", name: "Song 2" },
    ],
  },
}));

jest.mock("../../../../src/shared/lib/assets/buildAssetNavigatorItems", () => ({
  buildAssetNavigatorItems: () => mockNavigatorItems,
}));

jest.mock("../../../../src/components/ui/lists/FlatList", () => ({
  FlatList: ({
    selectedId,
    items,
    setSelectedId,
  }: {
    selectedId: string;
    items: Array<{ id: string; filename: string; type: string }>;
    setSelectedId: (
      id: string,
      item: { id: string; filename: string; type: string },
    ) => void;
  }) => {
    mockSetSelectedId.mockImplementation(setSelectedId);
    return (
      <div>
        <div data-testid="selected-id">{selectedId}</div>
        {items.map((item) => (
          <button key={item.id} onClick={() => setSelectedId(item.id, item)}>
            {item.filename}
          </button>
        ))}
      </div>
    );
  },
}));

jest.mock("../../../../src/components/ui/lists/EntityListItem", () => ({
  EntityListItem: ({
    item,
  }: {
    item: { filename?: string; name?: string };
  }) => <div>{item.filename || item.name}</div>,
  EntityListSearch: () => null,
}));

jest.mock("../../../../src/components/ui/buttons/Button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

jest.mock("../../../../src/components/ui/buttons/DropdownButton", () => ({
  DropdownButton: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../../src/components/ui/splitpane/SplitPaneHeader", () => ({
  SplitPaneHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../../src/components/ui/splitpane/SplitPane", () => ({
  SplitPane: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../../src/components/ui/lists/ListItem", () => ({
  ListItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../../src/components/ui/spacing/Spacing", () => ({
  FixedSpacer: () => null,
}));

jest.mock("../../../../src/components/ui/menu/Menu", () => ({
  MenuDivider: () => null,
  MenuItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../../src/components/ui/icons/Icons", () => ({
  PlusIcon: () => <span>+</span>,
  SearchIcon: () => <span>s</span>,
}));

jest.mock(
  "../../../../src/components/ui/hooks/use-toggleable-list",
  () => () => ({
    values: [],
    isSet: () => false,
    toggle: jest.fn(),
    set: jest.fn(),
    unset: jest.fn(),
  }),
);

jest.mock("../../../../src/shared/lib/lang/l10n", () => (key: string) => key);

describe("SongNavigatorPane", () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockSetSelectedId.mockReset();
    mockNavigatorItems.splice(
      0,
      mockNavigatorItems.length,
      {
        id: "song-1",
        name: "Song 1",
        filename: "song1.uge",
        type: "file",
        nestLevel: 0,
      },
      {
        id: "song-2",
        name: "Song 2",
        filename: "song2.uge",
        type: "file",
        nestLevel: 0,
      },
    );
  });

  test("should keep the current selected song highlighted until file selection is accepted", () => {
    const onSelectSong = jest.fn();

    render(
      <SongNavigatorPane
        height={300}
        modified
        selectedSongId="song-1"
        onSelectSong={onSelectSong}
      />,
    );

    expect(screen.getByTestId("selected-id")).toHaveTextContent("song-1");

    fireEvent.click(screen.getByText("song2.uge"));

    expect(onSelectSong).toHaveBeenCalledWith("song-2");
    expect(screen.getByTestId("selected-id")).toHaveTextContent("song-1");
  });

  test("should reselect the current song after a folder is selected without reopening it", () => {
    const onSelectSong = jest.fn();

    mockNavigatorItems.splice(
      0,
      mockNavigatorItems.length,
      {
        id: "folder-1",
        name: "Folder 1",
        filename: "folder1",
        type: "folder",
        nestLevel: 0,
      },
      {
        id: "song-1",
        name: "Song 1",
        filename: "song1.uge",
        type: "file",
        nestLevel: 1,
      },
      {
        id: "song-2",
        name: "Song 2",
        filename: "song2.uge",
        type: "file",
        nestLevel: 1,
      },
    );

    render(
      <SongNavigatorPane
        height={300}
        modified={false}
        selectedSongId="song-1"
        onSelectSong={onSelectSong}
      />,
    );

    fireEvent.click(screen.getByText("folder1"));
    expect(screen.getByTestId("selected-id")).toHaveTextContent("folder-1");

    fireEvent.click(screen.getByText("song1.uge"));

    expect(onSelectSong).not.toHaveBeenCalled();
    expect(screen.getByTestId("selected-id")).toHaveTextContent("song-1");
  });
});
