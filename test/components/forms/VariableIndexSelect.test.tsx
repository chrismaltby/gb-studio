/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen } from "../../react-utils";
import { VariableIndexSelect } from "components/forms/VariableIndexSelect";

jest.mock("components/forms/ValueSelect", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    innerValue,
  }: {
    value: unknown;
    onChange: (value: unknown) => void;
    innerValue: boolean;
  }) => (
    <button
      type="button"
      data-testid="index-value"
      data-value={JSON.stringify(value)}
      data-inner-value={String(innerValue)}
      onClick={() =>
        onChange({
          type: "add",
          valueA: { type: "variable", value: "index" },
          valueB: { type: "number", value: 1 },
        })
      }
    >
      Index
    </button>
  ),
}));

test("renders the index using the ScriptValue editor", () => {
  render(
    <VariableIndexSelect
      name="index"
      entityId="entity-1"
      value={{ type: "constant", value: "constant-1" }}
      onChange={jest.fn()}
    />,
  );

  expect(screen.getByTestId("index-value")).toHaveAttribute(
    "data-value",
    JSON.stringify({ type: "constant", value: "constant-1" }),
  );
  expect(screen.getByTestId("index-value")).toHaveAttribute(
    "data-inner-value",
    "true",
  );
});

test("accepts a complex ScriptValue index", () => {
  const onChange = jest.fn();
  render(
    <VariableIndexSelect
      name="index"
      entityId="entity-1"
      onChange={onChange}
    />,
  );

  fireEvent.click(screen.getByTestId("index-value"));

  expect(onChange).toHaveBeenCalledWith({
    type: "add",
    valueA: { type: "variable", value: "index" },
    valueB: { type: "number", value: 1 },
  });
});
