/**
 * @jest-environment jsdom
 */

import React from "react";
import { UnknownAction, Store } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "../../react-utils";
import { VariableIndexSelect } from "components/forms/VariableIndexSelect";
import { RootState } from "store/storeTypes";

jest.mock("shared/lib/lang/l10n", () => ({
  __esModule: true,
  default: (key: string) => key,
}));

jest.mock("ui/buttons/DropdownButton", () => ({
  DropdownButton: ({
    label,
    children,
    variant,
    onKeyDown,
  }: {
    label: React.ReactNode;
    children: React.ReactNode;
    variant: string;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => boolean;
  }) => (
    <button
      type="button"
      data-testid="index-type-button"
      data-variant={variant}
      onKeyDown={onKeyDown}
    >
      <span>{label}</span>
      {children}
    </button>
  ),
}));

jest.mock("components/forms/VariableSelect", () => ({
  VariableSelect: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onChange("variable-2")}>
      Variable {value}
    </button>
  ),
}));

jest.mock("components/forms/ConstantSelect", () => ({
  ConstantSelect: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onChange("constant-2")}>
      Constant {value}
    </button>
  ),
}));

const state = {
  project: {
    present: {
      entities: {
        variables: {
          ids: ["variable-1"],
          entities: {
            "variable-1": {
              id: "variable-1",
              name: "Index",
              symbol: "index",
              type: "number",
            },
          },
        },
        constants: {
          ids: ["constant-1"],
          entities: {
            "constant-1": {
              id: "constant-1",
              name: "Start",
              symbol: "start",
              value: 1,
            },
          },
        },
        customEvents: {
          ids: [],
          entities: {},
        },
      },
    },
  },
  engine: {
    consts: {},
  },
} as unknown as RootState;

const store = {
  getState: () => state,
  dispatch: () => {},
  subscribe: () => {},
} as unknown as Store<RootState, UnknownAction>;

test("switches an array index to the first available constant", () => {
  const onChange = jest.fn();

  render(
    <VariableIndexSelect
      name="index"
      entityId="entity-1"
      value={{ type: "number", value: 0 }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByText("FIELD_CONSTANT"));

  expect(onChange).toHaveBeenCalledWith({
    type: "constant",
    value: "constant-1",
  });
  expect(screen.getByTestId("index-type-button")).toHaveAttribute(
    "data-variant",
    "normal",
  );
  expect(screen.getByText("n")).toBeInTheDocument();
  expect(screen.getByText("$")).toBeInTheDocument();
  expect(screen.getByText("c")).toBeInTheDocument();
});

test("updates a selected constant index", () => {
  const onChange = jest.fn();

  render(
    <VariableIndexSelect
      name="index"
      entityId="entity-1"
      value={{ type: "constant", value: "constant-1" }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByText("Constant constant-1"));

  expect(onChange).toHaveBeenCalledWith({
    type: "constant",
    value: "constant-2",
  });
});

test.each([
  ["n", false, { type: "number", value: 0 }],
  ["$", true, { type: "variable", value: "L0" }],
  ["c", false, { type: "constant", value: "constant-1" }],
] as const)(
  "changes the array index type using the %s accelerator",
  (key, shiftKey, expectedValue) => {
    const onChange = jest.fn();

    render(
      <VariableIndexSelect
        name="index"
        entityId="entity-1"
        value={{ type: "number", value: 0 }}
        onChange={onChange}
      />,
      store,
    );

    fireEvent.keyDown(screen.getByTestId("index-type-button"), {
      key,
      shiftKey,
    });

    expect(onChange).toHaveBeenCalledWith(expectedValue);
  },
);
