/**
 * @jest-environment jsdom
 */

import type { Store, UnknownAction } from "@reduxjs/toolkit";
import ValueSelect from "components/forms/ValueSelect";
import React from "react";
import type { RootState } from "store/storeTypes";
import { fireEvent, render, screen } from "../../react-utils";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";

jest.mock("react-dnd", () => ({
  useDrag: () => [{}, jest.fn(), jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
}));

jest.mock("components/forms/PropertySelect", () => ({
  PropertySelect: () => null,
}));

jest.mock("store/features/clipboard/clipboardActions", () => ({
  __esModule: true,
  default: { fetchClipboard: jest.fn() },
}));

jest.mock("store/features/clipboard/clipboardHelpers", () => ({
  copy: jest.fn(),
  paste: jest.fn(),
}));

test("limits a fixed array index to the valid element range", () => {
  const state = {
    editor: { type: "actor" },
    clipboard: {},
    project: {
      present: {
        entities: {
          constants: { entities: {}, ids: [] },
          customEvents: { entities: {}, ids: [] },
          variables: {
            entities: {
              array: {
                id: "array",
                name: "Array",
                symbol: "var_array",
                type: "array",
                length: 10,
              },
            },
            ids: ["array"],
          },
        },
      },
    },
  };
  const store = {
    getState: () => state,
    dispatch: () => {},
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <ValueSelect
      name="variable"
      entityId="actor-1"
      value={{
        type: "variable",
        value: "array",
        index: { type: "number", value: 9 },
      }}
      onChange={jest.fn()}
    />,
    store,
  );

  expect(screen.getByRole("spinbutton")).toHaveAttribute("min", "0");
  expect(screen.getByRole("spinbutton")).toHaveAttribute("max", "9");
});

test("array length only allows selecting an array reference", () => {
  const state = {
    editor: { type: "customEvent" },
    clipboard: {},
    project: {
      present: {
        entities: {
          constants: { entities: {}, ids: [] },
          customEvents: {
            entities: {
              customEvent1: {
                id: "customEvent1",
                variables: {},
              },
            },
            ids: ["customEvent1"],
          },
          variables: {
            entities: {
              scalar: {
                id: "scalar",
                name: "Scalar",
                symbol: "var_scalar",
                type: "number",
              },
              array: {
                id: "array",
                name: "Array",
                symbol: "var_array",
                type: "array",
                length: 10,
              },
            },
            ids: ["scalar", "array"],
          },
        },
      },
    },
  };
  const store = {
    getState: () => state,
    dispatch: () => {},
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <ScriptEditorContext.Provider
      value={{
        type: "script",
        entityType: "customEvent",
        entityId: "customEvent1",
        sceneId: "",
        scriptKey: "script",
      }}
    >
      <ValueSelect
        name="length"
        entityId="customEvent1"
        value={{
          type: "len",
          value: { type: "variable", value: "array" },
        }}
        onChange={jest.fn()}
      />
    </ScriptEditorContext.Provider>,
    store,
  );

  expect(screen.getByTitle("FIELD_ARRAY_LENGTH")).toHaveAttribute(
    "data-variant",
    "transparent",
  );
  const combobox = screen.getByRole("combobox");
  expect(screen.getByText("$Array")).toBeInTheDocument();
  fireEvent.keyDown(combobox, { key: "ArrowDown" });
  expect(screen.getByRole("option", { name: "Array[10]" })).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "Variable A" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Scalar" }),
  ).not.toBeInTheDocument();
});
