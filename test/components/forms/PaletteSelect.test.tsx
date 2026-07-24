/**
 * @jest-environment jsdom
 */

import React from "react";
import { PaletteSelect } from "components/forms/PaletteSelect";
import { Palette } from "shared/lib/resources/types";
import { dummyPalette } from "../../dummydata";
import { fireEvent, render, screen, waitFor } from "../../react-utils";
import entitiesActions from "store/features/entities/entitiesActions";

const mockDispatch = jest.fn();
const mockPaletteEditorBlur = jest.fn();
const defaultMockPalettes: Palette[] = [
  {
    ...dummyPalette,
    id: "palette1",
    name: "Test Palette",
    colors: ["080808", "404040", "808080", "f8f8f8"],
  },
];
let mockPalettesLookup: Record<string, Palette> = {};

const setMockPalettes = (palettes: Palette[]) => {
  mockPalettesLookup = Object.fromEntries(
    palettes.map((palette) => [palette.id, palette]),
  );
};

const mockRect = (left: number, width = 0): DOMRect =>
  ({
    bottom: 0,
    height: 0,
    left,
    right: left + width,
    top: 0,
    width,
    x: left,
    y: 0,
    toJSON: () => ({}),
  }) as DOMRect;

jest.mock("store/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => mockPalettesLookup,
}));

jest.mock("components/forms/PaletteBlock", () => () => null);

jest.mock("components/forms/CustomPalettePicker", () => ({
  __esModule: true,
  default: ({ paletteId }: { paletteId: string }) => (
    <input
      aria-label="Palette editor"
      data-palette-name={mockPalettesLookup[paletteId]?.name}
      onBlur={mockPaletteEditorBlur}
    />
  ),
}));

jest.mock("ui/layout/Portal", () => ({
  Portal: ({ children }: React.PropsWithChildren) => children,
}));

jest.mock("ui/menu/Menu", () => ({
  MenuOverlay: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="palette-editor-overlay" {...props} />
  ),
}));

beforeEach(() => {
  setMockPalettes(defaultMockPalettes);
  mockDispatch.mockReset();
  mockPaletteEditorBlur.mockReset();
  mockDispatch.mockImplementation((action) => {
    if (entitiesActions.addPalette.match(action)) {
      mockPalettesLookup = {
        ...mockPalettesLookup,
        [action.payload.paletteId]: {
          ...dummyPalette,
          id: action.payload.paletteId,
          name: action.payload.name || "New Palette",
        },
      };
    }
    return action;
  });
});

test("scrolls a selected palette near the end of a windowed menu into view", async () => {
  setMockPalettes(
    Array.from({ length: 120 }, (_, index): Palette => ({
      ...dummyPalette,
      id: `palette${index}`,
      name: `Palette ${index}`,
      colors: ["080808", "404040", "808080", "f8f8f8"],
    })),
  );

  const { container } = render(
    <PaletteSelect
      name="palette"
      menuIsOpen
      menuPortalTarget={null}
      value="palette119"
    />,
  );
  await waitFor(() =>
    expect(container.querySelector('[aria-selected="true"]')).toHaveTextContent(
      "Palette 119",
    ),
  );
  expect(screen.getAllByRole("option").length).toBeLessThan(121);
});

test("keeps the search and restores its focus when the editor closes", () => {
  const onBlur = jest.fn();
  render(
    <PaletteSelect
      name="palette"
      menuIsOpen
      menuPortalTarget={null}
      value="palette1"
      onBlur={onBlur}
    />,
  );

  const searchInput = screen.getByRole("combobox") as HTMLInputElement;
  fireEvent.change(searchInput, { target: { value: "Test" } });

  fireEvent.click(
    screen.getByRole("button", {
      name: "FIELD_EDIT_PALETTES: Test Palette",
    }),
  );
  screen.getByLabelText("Palette editor").focus();

  expect(searchInput.value).toBe("Test");
  expect(onBlur).not.toHaveBeenCalled();

  expect(
    fireEvent.mouseDown(screen.getByTestId("palette-editor-overlay")),
  ).toBe(false);

  expect(searchInput).toHaveFocus();
  expect(searchInput.value).toBe("Test");
  expect(onBlur).not.toHaveBeenCalled();
  expect(mockPaletteEditorBlur).toHaveBeenCalledTimes(1);
});

test("closes the palette editor with Escape", () => {
  render(
    <PaletteSelect
      name="palette"
      menuIsOpen
      menuPortalTarget={null}
      value="palette1"
    />,
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "FIELD_EDIT_PALETTES: Test Palette",
    }),
  );
  const paletteEditor = screen.getByLabelText("Palette editor");
  paletteEditor.focus();
  expect(paletteEditor).toHaveFocus();

  fireEvent.keyDown(window, { key: "Escape" });

  expect(mockPaletteEditorBlur).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText("Palette editor")).not.toBeInTheDocument();
});

test("edits the default palette shown by the optional option", () => {
  render(
    <PaletteSelect
      name="palette"
      menuIsOpen
      menuPortalTarget={null}
      optional
      optionalDefaultPaletteId="palette1"
      optionalLabel="None"
    />,
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "FIELD_EDIT_PALETTES: None",
    }),
  );

  expect(screen.getByLabelText("Palette editor")).toBeInTheDocument();
});

test("positions the editor to the left of a wide menu and above it", async () => {
  setMockPalettes([
    {
      ...defaultMockPalettes[0],
      name: "A very long palette name that expands the select menu",
    },
  ]);
  const getBoundingClientRect = jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue(mockRect(700));

  const { container } = render(
    <PaletteSelect
      name="palette"
      menuIsOpen
      menuPortalTarget={null}
      value="palette1"
    />,
  );
  jest
    .spyOn(
      container.querySelector(".CustomSelect__menu") as HTMLElement,
      "getBoundingClientRect",
    )
    .mockReturnValue(mockRect(400, 500));
  fireEvent.click(
    screen.getByRole("button", {
      name: "FIELD_EDIT_PALETTES: A very long palette name that expands the select menu",
    }),
  );

  await waitFor(() => {
    const editorPortal = screen
      .getByLabelText("Palette editor")
      .closest('div[style*="z-index: 1001"]');
    expect(editorPortal).toHaveStyle({ left: "104px", zIndex: 1001 });
  });

  getBoundingClientRect.mockRestore();
});

test("creates, selects, scrolls to, and opens the editor for a new palette", async () => {
  const onChange = jest.fn();
  const onBlur = jest.fn();
  render(
    <PaletteSelect
      name="palette"
      menuIsOpen
      menuPortalTarget={null}
      value="palette1"
      onChange={onChange}
      onBlur={onBlur}
    />,
  );

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "Characters/Hero" },
  });
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });

  const addAction = mockDispatch.mock.calls
    .map(([action]) => action)
    .find(entitiesActions.addPalette.match);
  if (!addAction) {
    throw new Error("Expected addPalette to be dispatched");
  }
  expect(addAction.payload.name).toBe("Characters/Hero");
  expect(onChange).toHaveBeenCalledWith(addAction.payload.paletteId);
  expect(onBlur).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Palette editor")).toHaveAttribute(
    "data-palette-name",
    "Characters/Hero",
  );
  await waitFor(() =>
    expect(
      document.querySelector(".CustomSelect__option--is-focused"),
    ).toHaveTextContent("Characters/Hero"),
  );
});
