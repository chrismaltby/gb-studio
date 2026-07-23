/**
 * @jest-environment jsdom
 */

import React from "react";
import { UnknownAction, Store } from "@reduxjs/toolkit";
import entitiesReducer, {
  initialState as entitiesInitialState,
} from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import editorReducer, {
  initialState as editorInitialState,
} from "store/features/editor/editorState";
import { initialState as settingsInitialState } from "store/features/settings/settingsState";
import { RootState } from "store/storeTypes";
import CustomPalettePicker from "components/forms/CustomPalettePicker";
import { render, waitFor, act, fireEvent, screen } from "../../react-utils";
import { dummyPalette } from "../../dummydata";
import API from "renderer/lib/api";
import { Palette } from "shared/lib/resources/types";

type TestStore = Store<RootState, UnknownAction> & {
  setState: (state: RootState) => void;
};

const makeState = (
  selectedColor: string,
  paletteChanges: Partial<Palette> = {},
) =>
  ({
    editor: {
      ...editorInitialState,
      paletteEditorTab: "rgb",
    },
    project: {
      present: {
        entities: {
          ...entitiesInitialState,
          palettes: {
            entities: {
              palette1: {
                ...dummyPalette,
                id: "palette1",
                name: "Test Palette",
                colors: [
                  selectedColor,
                  dummyPalette.colors[1],
                  dummyPalette.colors[2],
                  dummyPalette.colors[3],
                ],
                ...paletteChanges,
              },
            },
            ids: ["palette1"],
          },
        },
        settings: {
          ...settingsInitialState,
          colorCorrection: "none",
        },
      },
    },
  }) as unknown as RootState;

const makeStore = (initialState: RootState): TestStore => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    dispatch: (action: UnknownAction) => {
      if (
        action.type === entitiesActions.editPaletteColor.type ||
        action.type === entitiesActions.editPalette.type
      ) {
        state = {
          ...state,
          project: {
            ...state.project,
            present: {
              ...state.project.present,
              entities: entitiesReducer(state.project.present.entities, action),
            },
          },
        };
        listeners.forEach((listener) => listener());
      } else if (action.type.startsWith("editor/")) {
        state = {
          ...state,
          editor: editorReducer(state.editor, action),
        };
        listeners.forEach((listener) => listener());
      }
      return action;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    replaceReducer: () => undefined,
    [Symbol.observable]: () => ({
      subscribe: () => ({
        unsubscribe: () => undefined,
      }),
      [Symbol.observable]() {
        return this;
      },
    }),
    setState: (nextState: RootState) => {
      state = nextState;
      listeners.forEach((listener) => listener());
    },
  } as TestStore;
};

test("Should resync slider and hex state when palette color changes without palette id changing", async () => {
  const store = makeStore(makeState("080808"));

  render(<CustomPalettePicker paletteId="palette1" />, store, {});

  const colorHexInput = document.getElementById("colorHex") as HTMLInputElement;
  const colorRInput = document.getElementById("colorR") as HTMLInputElement;

  await waitFor(() => expect(colorHexInput.value).toBe("#080808"));
  expect(colorRInput.value).toBe("1");

  act(() => {
    store.setState(makeState("ffffff"));
  });

  await waitFor(() => expect(colorHexInput.value).toBe("#ffffff"));
  expect(colorRInput.value).toBe("31");
});

test("Should keep local saturation value after updating selected color through the store", async () => {
  const store = makeStore(makeState("ff0000"));

  render(<CustomPalettePicker paletteId="palette1" />, store, {});

  const colorSaturationInput = document.getElementById(
    "colorSaturation",
  ) as HTMLInputElement;

  await waitFor(() => expect(colorSaturationInput.value).toBe("100"));

  act(() => {
    fireEvent.change(colorSaturationInput, {
      currentTarget: { value: "50" },
      target: { value: "50" },
    });
  });

  await waitFor(() => expect(colorSaturationInput.value).toBe("50"));
});

test("updates the controls when selecting a different swatch", async () => {
  const store = makeStore(
    makeState("080808", {
      colors: ["080808", "404040", "808080", "f8f8f8"],
    }),
  );

  render(<CustomPalettePicker paletteId="palette1" />, store, {});

  const colorHexInput = document.getElementById("colorHex");
  await waitFor(() => expect(colorHexInput).toHaveValue("#080808"));

  fireEvent.click(
    screen.getByRole("button", {
      name: "Test Palette 2",
    }),
  );

  expect(colorHexInput).toHaveValue("#424242");
});

test("small size shares palette renaming and compact color controls", async () => {
  const store = makeStore(makeState("080808", { name: "Characters/Hero" }));

  render(<CustomPalettePicker paletteId="palette1" size="small" />, store, {});

  expect(screen.getByText("Hero")).toBeInTheDocument();
  const nameInput = screen.getByDisplayValue("Characters/Hero");
  nameInput.focus();
  fireEvent.change(nameInput, { target: { value: "Characters/Player" } });
  fireEvent.keyDown(nameInput, { key: "Enter" });

  await waitFor(() =>
    expect(screen.getByDisplayValue("Characters/Player")).toBeInTheDocument(),
  );
  expect(nameInput).not.toHaveFocus();

  expect(document.getElementById("colorR")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "HSB" }));
  await waitFor(() =>
    expect(document.getElementById("colorHue")).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Hex" }));
  await waitFor(() =>
    expect(document.getElementById("colorHex")).toBeInTheDocument(),
  );
});

test("small size does not allow default palettes to be renamed", () => {
  const store = makeStore(
    makeState("080808", {
      name: "Defaults/Background",
      defaultColors: dummyPalette.colors,
    }),
  );

  render(<CustomPalettePicker paletteId="palette1" size="small" />, store, {});

  expect(screen.getByText("Background")).toBeInTheDocument();
  expect(screen.getByDisplayValue("Defaults/Background")).toHaveAttribute(
    "readonly",
  );
});

test("normal size uses the shared palette rename UI", async () => {
  const store = makeStore(makeState("080808"));

  render(<CustomPalettePicker paletteId="palette1" />, store, {});

  const nameInput = screen.getByDisplayValue("Test Palette");
  fireEvent.change(nameInput, { target: { value: "" } });
  fireEvent.blur(nameInput);

  await waitFor(() =>
    expect(screen.getByDisplayValue("Palette")).toBeInTheDocument(),
  );
});

test("small size supports copying and pasting the selected color", async () => {
  const store = makeStore(makeState("080808"));
  const writeText = jest.spyOn(API.clipboard, "writeText");
  const readText = jest
    .spyOn(API.clipboard, "readText")
    .mockResolvedValue("#ffffff");

  render(<CustomPalettePicker paletteId="palette1" size="small" />, store, {});

  const selectedSwatch = screen.getByRole("button", {
    name: "Test Palette 1",
  });
  selectedSwatch.focus();
  fireEvent.click(selectedSwatch);
  expect(selectedSwatch).toHaveFocus();

  fireEvent.copy(selectedSwatch);
  expect(writeText).toHaveBeenCalledWith("080808");

  fireEvent.paste(selectedSwatch);
  await waitFor(() =>
    expect(document.getElementById("colorR")).toHaveValue(31),
  );

  writeText.mockRestore();
  readText.mockRestore();
});
