/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen, waitFor } from "../../react-utils";
import { UnknownAction, Store } from "@reduxjs/toolkit";
import { RootState } from "store/storeTypes";
import { DataTableInput } from "../../../src/components/forms/DataTableInput";
import API from "renderer/lib/api";

jest.mock("components/forms/VariableSelect", () => ({
  VariableSelectWrapper: "div",
}));

jest.mock("components/forms/VariableElementSelect", () => ({
  VariableElementSelect: ({
    value,
    colIndex,
    onChange,
  }: {
    value: {
      type: "variable";
      value: string;
      index?: { type: "number"; value: number };
    };
    colIndex?: number;
    onChange: (nextValue: {
      type: "variable";
      value: string;
      index?: { type: "number"; value: number };
    }) => void;
  }) => (
    <button
      type="button"
      data-testid={`variable-select-${colIndex ?? 0}`}
      onClick={() => onChange({ ...value, value: `${value.value}_updated` })}
    >
      {`${value.value}${value.index ? `[${value.index.value}]` : ""}`}
    </button>
  ),
}));

jest.mock("components/forms/ConstantValueSelect", () => ({
  __esModule: true,
  default: ({
    value,
    name,
    onChange,
  }: {
    value?: { type: string; value: string | number };
    name: string;
    onChange: (value: { type: "number"; value: number }) => void;
  }) => (
    <button
      type="button"
      data-testid={name}
      onClick={() => onChange({ type: "number", value: 99 })}
    >
      {String(value?.value ?? "")}
    </button>
  ),
}));

jest.mock("components/script/fields/useVariableFieldContext", () => ({
  useVariableFieldContext: () => ({
    candidates: [
      { id: "variable-1", type: "number" },
      { id: "variable-2", type: "number" },
      { id: "array-1", type: "array" },
    ],
    variables: [
      {
        id: "variable-1",
        name: "Variable One",
        displayName: "Variable One",
      },
      {
        id: "variable-2",
        name: "Variable Two",
        displayName: "Variable Two",
      },
      { id: "array-1", name: "MyArray", displayName: "MyArray[5]" },
    ],
    customEvent: undefined,
    variablesLookup: {
      "variable-1": {
        id: "variable-1",
        name: "Variable One",
        symbol: "var_one",
        type: "number",
      },
      "variable-2": {
        id: "variable-2",
        name: "Variable Two",
        symbol: "var_two",
        type: "number",
      },
      "array-1": {
        id: "array-1",
        name: "MyArray",
        symbol: "var_my_array",
        type: "array",
        size: 5,
      },
    },
  }),
}));

jest.mock("ui/layout/Portal", () => ({
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("ui/menu/Menu", () => ({
  MenuOverlay: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Overlay
    </button>
  ),
}));

jest.mock("renderer/lib/api", () => ({
  __esModule: true,
  default: {
    theme: {
      onChange: jest.fn(),
    },
    dataTable: {
      importCSV: jest.fn(),
      exportCSV: jest.fn(),
    },
  },
}));

const mockedAPI = jest.mocked(API);

const dispatch = jest.fn();
const store = {
  getState: () => ({
    project: {
      present: {
        entities: {
          constants: {
            ids: ["constant-1"],
            entities: {
              "constant-1": {
                id: "constant-1",
                name: "PLAYER_MAX_HP",
              },
            },
          },
        },
      },
    },
  }),
  dispatch,
  subscribe: () => {},
} as unknown as Store<RootState, UnknownAction>;

beforeEach(() => {
  mockedAPI.theme.onChange.mockReset();
  mockedAPI.dataTable.importCSV.mockReset();
  mockedAPI.dataTable.exportCSV.mockReset();
  dispatch.mockReset();
  HTMLElement.prototype.scrollTo = jest.fn();
});

test("Should add a column using the first unused scalar variable", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        label: "Scores",
        variables: [{ type: "variable", value: "variable-1" }],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 1 }],
          },
        ],
      }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByTitle("FIELD_ADD_COLUMN"));

  expect(onChange).toHaveBeenCalledWith({
    label: "Scores",
    variables: [
      { type: "variable", value: "variable-1" },
      { type: "variable", value: "variable-2" },
    ],
    rows: [
      {
        label: "Row 1",
        values: [
          { type: "number", value: 1 },
          { type: "number", value: 0 },
        ],
      },
    ],
  });
});

test("Should preserve fixed array offsets selected for a column", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        variables: [
          {
            type: "variable",
            value: "array-1",
            index: { type: "number", value: 2 },
          },
        ],
        rows: [{ values: [{ type: "number", value: 7 }] }],
      }}
      onChange={onChange}
    />,
    store,
  );

  const select = screen.getByTestId("variable-select-0");
  expect(select).toHaveTextContent("array-1[2]");

  fireEvent.click(select);
  expect(onChange).toHaveBeenCalledWith({
    variables: [
      {
        type: "variable",
        value: "array-1_updated",
        index: { type: "number", value: 2 },
      },
    ],
    rows: [{ values: [{ type: "number", value: 7 }] }],
  });
});

test("Should use the next array element for a new column", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        variables: [
          {
            type: "variable",
            value: "array-1",
            index: { type: "number", value: 0 },
          },
        ],
        rows: [{ values: [{ type: "number", value: 7 }] }],
      }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByTitle("FIELD_ADD_COLUMN"));

  expect(onChange).toHaveBeenCalledWith({
    variables: [
      {
        type: "variable",
        value: "array-1",
        index: { type: "number", value: 0 },
      },
      {
        type: "variable",
        value: "array-1",
        index: { type: "number", value: 1 },
      },
    ],
    rows: [
      {
        values: [
          { type: "number", value: 7 },
          { type: "number", value: 0 },
        ],
      },
    ],
  });
});

test("Should continue through consecutive array elements", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        variables: [
          {
            type: "variable",
            value: "array-1",
            index: { type: "number", value: 0 },
          },
          {
            type: "variable",
            value: "array-1",
            index: { type: "number", value: 1 },
          },
        ],
        rows: [
          {
            values: [
              { type: "number", value: 7 },
              { type: "number", value: 8 },
            ],
          },
        ],
      }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByTitle("FIELD_ADD_COLUMN"));

  expect(onChange.mock.calls[0][0].variables[2]).toEqual({
    type: "variable",
    value: "array-1",
    index: { type: "number", value: 2 },
  });
});

test("Should reuse the first variable when all scalar variables are used", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        variables: [
          { type: "variable", value: "variable-1" },
          { type: "variable", value: "variable-2" },
        ],
        rows: [
          {
            values: [
              { type: "number", value: 1 },
              { type: "number", value: 2 },
            ],
          },
        ],
      }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByTitle("FIELD_ADD_COLUMN"));

  expect(onChange).toHaveBeenCalledWith({
    variables: [
      { type: "variable", value: "variable-1" },
      { type: "variable", value: "variable-2" },
      { type: "variable", value: "variable-1" },
    ],
    rows: [
      {
        values: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 0 },
        ],
      },
    ],
  });
});

test("Should persist the first available scalar variable for a default table", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput entityId="entity1" value={undefined} onChange={onChange} />,
    store,
  );

  expect(onChange).toHaveBeenCalledWith({
    variables: [{ type: "variable", value: "variable-1" }],
    rows: [
      {
        label: "",
        values: [{ type: "number", value: 0 }],
      },
    ],
  });
});

test("Should add a row and disable the row limit", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        label: "Scores",
        variables: [
          { type: "variable", value: "0" },
          { type: "variable", value: "1" },
        ],
        rows: Array.from({ length: 6 }, (_, index) => ({
          label: `Row ${index + 1}`,
          values: [
            { type: "number", value: index },
            { type: "number", value: index + 1 },
          ],
        })),
      }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByTitle("FIELD_ADD_ROW"));

  expect(onChange).toHaveBeenCalledWith({
    label: "Scores",
    variables: [
      { type: "variable", value: "0" },
      { type: "variable", value: "1" },
    ],
    rows: [
      ...Array.from({ length: 6 }, (_, index) => ({
        label: `Row ${index + 1}`,
        values: [
          { type: "number", value: index },
          { type: "number", value: index + 1 },
        ],
      })),
      {
        label: "",
        values: [
          { type: "number", value: 0 },
          { type: "number", value: 0 },
        ],
      },
    ],
  });
});

test("Should import CSV tables through the renderer API", async () => {
  const onChange = jest.fn();
  mockedAPI.dataTable.importCSV.mockResolvedValueOnce({
    dataTable: {
      label: "Imported",
      variables: [{ type: "variable", value: "variable-1" }],
      rows: [
        {
          label: "Imported Row",
          values: [{ type: "number", value: 7 }],
        },
      ],
    },
    newVariables: [],
  });

  render(
    <DataTableInput entityId="entity1" value={undefined} onChange={onChange} />,
    store,
  );

  fireEvent.click(screen.getByText("FIELD_IMPORT_CSV"));

  await waitFor(() => {
    expect(mockedAPI.dataTable.importCSV).toHaveBeenCalledWith(
      [{ id: "constant-1", name: "PLAYER_MAX_HP" }],
      expect.arrayContaining([
        {
          id: "variable-1",
          name: "Variable One",
          type: "number",
          size: undefined,
        },
      ]),
    );
  });

  expect(onChange).toHaveBeenCalledWith({
    label: "Imported",
    variables: [{ type: "variable", value: "variable-1" }],
    rows: [
      {
        label: "Imported Row",
        values: [{ type: "number", value: 7 }],
      },
    ],
  });
});

test("Should create missing variables with the required array size", async () => {
  const onChange = jest.fn();
  mockedAPI.dataTable.importCSV.mockResolvedValueOnce({
    dataTable: {
      label: "Imported",
      variables: [
        {
          type: "variable",
          value: "__new_variable_0",
          index: { type: "number", value: 0 },
        },
        {
          type: "variable",
          value: "__new_variable_0",
          index: { type: "number", value: 4 },
        },
        { type: "variable", value: "__new_variable_1" },
      ],
      rows: [
        {
          label: "Imported Row",
          values: [
            { type: "number", value: 1 },
            { type: "number", value: 2 },
            { type: "number", value: 3 },
          ],
        },
      ],
    },
    newVariables: [
      {
        placeholder: "__new_variable_0",
        name: "NewArr",
        type: "array",
        size: 5,
      },
      {
        placeholder: "__new_variable_1",
        name: "NewScalar",
        type: "number",
      },
    ],
  });

  render(
    <DataTableInput entityId="entity1" value={undefined} onChange={onChange} />,
    store,
  );

  fireEvent.click(screen.getByText("FIELD_IMPORT_CSV"));

  await waitFor(() => {
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "entities/addVariable",
        payload: expect.objectContaining({
          name: "NewArr",
          type: "array",
          size: 5,
        }),
      }),
    );
  });

  const addActions = dispatch.mock.calls
    .map(([action]) => action)
    .filter(({ type }) => type === "entities/addVariable");
  const arrayId = addActions.find(({ payload }) => payload.name === "NewArr")
    ?.payload.variableId;
  const scalarId = addActions.find(
    ({ payload }) => payload.name === "NewScalar",
  )?.payload.variableId;

  expect(addActions).toHaveLength(2);

  expect(onChange).toHaveBeenCalledWith({
    label: "Imported",
    variables: [
      {
        type: "variable",
        value: arrayId,
        index: { type: "number", value: 0 },
      },
      {
        type: "variable",
        value: arrayId,
        index: { type: "number", value: 4 },
      },
      { type: "variable", value: scalarId },
    ],
    rows: [
      {
        label: "Imported Row",
        values: [
          { type: "number", value: 1 },
          { type: "number", value: 2 },
          { type: "number", value: 3 },
        ],
      },
    ],
  });
});

test("Should cancel import when a variable has the wrong type", async () => {
  const onChange = jest.fn();
  mockedAPI.dataTable.importCSV.mockRejectedValueOnce(
    new Error("ERROR_DATA_TABLE_CSV_VARIABLE_TYPE"),
  );

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        variables: [{ type: "variable", value: "variable-1" }],
        rows: [{ values: [{ type: "number", value: 0 }] }],
      }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByText("FIELD_IMPORT_CSV"));

  expect(
    await screen.findByText("ERROR_DATA_TABLE_CSV_VARIABLE_TYPE"),
  ).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
});

test("Should export CSV tables through the renderer API", () => {
  render(
    <DataTableInput
      entityId="entity1"
      value={{
        label: "Scores",
        variables: [{ type: "variable", value: "variable-1" }],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 10 }],
          },
        ],
      }}
      onChange={() => {}}
    />,
    store,
  );

  fireEvent.click(screen.getByText("FIELD_EXPORT_CSV"));

  expect(mockedAPI.dataTable.exportCSV).toHaveBeenCalledWith(
    {
      label: "Scores",
      variables: [{ type: "variable", value: "variable-1" }],
      rows: [
        {
          label: "Row 1",
          values: [{ type: "number", value: 10 }],
        },
      ],
    },
    [{ id: "constant-1", name: "PLAYER_MAX_HP" }],
    expect.arrayContaining([
      {
        id: "variable-1",
        name: "Variable One",
        type: "number",
        size: undefined,
      },
    ]),
  );
});

test("Should show CSV import errors and clear them after editing", async () => {
  const onChange = jest.fn();
  mockedAPI.dataTable.importCSV.mockRejectedValueOnce(new Error("Bad CSV"));

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        label: "Scores",
        variables: [{ type: "variable", value: "0" }],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 10 }],
          },
        ],
      }}
      onChange={onChange}
    />,
    store,
  );

  fireEvent.click(screen.getByText("FIELD_IMPORT_CSV"));

  expect(await screen.findByText("Bad CSV")).toBeInTheDocument();

  fireEvent.click(screen.getByTitle("FIELD_ADD_COLUMN"));

  await waitFor(() => {
    expect(screen.queryByText("Bad CSV")).not.toBeInTheDocument();
  });
});
