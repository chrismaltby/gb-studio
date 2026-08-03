/**
 * @jest-environment jsdom
 */

import type { Store, UnknownAction } from "@reduxjs/toolkit";
import ValueSelect from "components/forms/ValueSelect";
import React from "react";
import type { RootState } from "store/storeTypes";
import { render, screen } from "../../react-utils";

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
                size: 10,
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
