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
  VariableSelect: ({
    value,
    colIndex,
    onChange,
  }: {
    value: string;
    colIndex?: number;
    onChange: (value: string) => void;
  }) => (
    <button
      type="button"
      data-testid={`variable-select-${colIndex ?? 0}`}
      onClick={() => onChange(`${value}_updated`)}
    >
      {value}
    </button>
  ),
  VariableSelectWrapper: "div",
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
  dispatch: () => {},
  subscribe: () => {},
} as unknown as Store<RootState, UnknownAction>;

beforeEach(() => {
  mockedAPI.theme.onChange.mockReset();
  mockedAPI.dataTable.importCSV.mockReset();
  mockedAPI.dataTable.exportCSV.mockReset();
  HTMLElement.prototype.scrollTo = jest.fn();
});

test("Should add a column using the next variable id", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        label: "Scores",
        variables: ["0"],
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
    variables: ["0", "1"],
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

test("Should add a row and disable the row limit", () => {
  const onChange = jest.fn();

  render(
    <DataTableInput
      entityId="entity1"
      value={{
        label: "Scores",
        variables: ["0", "1"],
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
    variables: ["0", "1"],
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
    label: "Imported",
    variables: ["V0"],
    rows: [
      {
        label: "Imported Row",
        values: [{ type: "number", value: 7 }],
      },
    ],
  });

  render(
    <DataTableInput entityId="entity1" value={undefined} onChange={onChange} />,
    store,
  );

  fireEvent.click(screen.getByText("FIELD_IMPORT_CSV"));

  await waitFor(() => {
    expect(mockedAPI.dataTable.importCSV).toHaveBeenCalledWith([
      {
        id: "constant-1",
        name: "PLAYER_MAX_HP",
      },
    ]);
  });

  expect(onChange).toHaveBeenCalledWith({
    label: "Imported",
    variables: ["V0"],
    rows: [
      {
        label: "Imported Row",
        values: [{ type: "number", value: 7 }],
      },
    ],
  });
});

test("Should export CSV tables through the renderer API", () => {
  render(
    <DataTableInput
      entityId="entity1"
      value={{
        label: "Scores",
        variables: ["0"],
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
      variables: ["0"],
      rows: [
        {
          label: "Row 1",
          values: [{ type: "number", value: 10 }],
        },
      ],
    },
    [
      {
        id: "constant-1",
        name: "PLAYER_MAX_HP",
      },
    ],
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
        variables: ["0"],
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
