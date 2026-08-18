/**
 * @jest-environment jsdom
 */

import React from "react";
import { VariableFieldInput } from "components/script/fields/VariableFieldInput";
import { fireEvent, render, screen } from "../../../react-utils";
import type { UnknownAction, Store } from "@reduxjs/toolkit";
import type { RootState } from "store/storeTypes";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import { clearL10NData, setL10NData } from "shared/lib/lang/l10n";

jest.mock("components/forms/VariableIndexSelect", () => ({
  IndexedVariableInputGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  VariableInputGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  VariableIndexSelect: () => <div data-testid="variable-index" />,
}));

afterEach(() => {
  clearL10NData();
});

test("allows unused custom event variables in array reference fields", () => {
  const onChange = jest.fn();
  const state = {
    editor: { type: "customEvent" },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {
              customEvent1: {
                id: "customEvent1",
                variables: {
                  V0: {
                    id: "V0",
                    name: "Existing Scalar",
                    passByReference: true,
                  },
                  V1: {
                    id: "V1",
                    name: "Existing Array",
                    passByReference: "array",
                    size: 3,
                  },
                },
              },
            },
            ids: ["customEvent1"],
          },
          variables: { entities: {}, ids: [] },
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
      <VariableFieldInput
        id="array"
        entityId="customEvent1"
        field={{ type: "variable", variableType: "arrayReference" }}
        value={undefined}
        allowRename
        onChange={onChange}
      />
    </ScriptEditorContext.Provider>,
    store,
    {},
  );

  fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });

  expect(
    screen.getByRole("option", { name: "Existing Array[3]" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Existing Scalar" }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("option", { name: "Variable C" }));
  expect(onChange).toHaveBeenCalledWith({
    type: "variable",
    value: "V2",
  });
});

test("does not display an unpersisted fallback array", () => {
  const state = {
    editor: { type: "actor" },
    project: {
      present: {
        entities: {
          customEvents: { entities: {}, ids: [] },
          variables: {
            entities: {
              array: {
                id: "array",
                name: "Array",
                symbol: "var_array",
                type: "array",
                size: 4,
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
    <ScriptEditorContext.Provider
      value={{
        type: "entity",
        entityType: "actor",
        entityId: "actor1",
        sceneId: "scene1",
        scriptKey: "script",
      }}
    >
      <VariableFieldInput
        id="variable"
        entityId="actor1"
        field={{ type: "variable", variableType: "arrayReference" }}
        value={undefined}
        allowRename
        onChange={() => {}}
      />
    </ScriptEditorContext.Provider>,
    store,
    {},
  );

  expect(screen.queryByText("$Array")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveValue("");
});

test("warns when an array reference is smaller than the required size", () => {
  setL10NData({
    WARNING_ARRAY_TOO_SMALL:
      "Requires {expectedSize} elements, selected array has {actualSize}.",
  });
  const state = {
    editor: { type: "actor" },
    project: {
      present: {
        entities: {
          customEvents: { entities: {}, ids: [] },
          variables: {
            entities: {
              array: {
                id: "array",
                name: "Array",
                symbol: "var_array",
                type: "array",
                size: 4,
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
    <ScriptEditorContext.Provider
      value={{
        type: "entity",
        entityType: "actor",
        entityId: "actor1",
        sceneId: "scene1",
        scriptKey: "script",
      }}
    >
      <VariableFieldInput
        id="variable"
        entityId="actor1"
        field={{
          type: "variable",
          variableType: "arrayReference",
          arraySize: 5,
        }}
        value={{ type: "variable", value: "array" }}
        allowRename
        onChange={() => {}}
      />
    </ScriptEditorContext.Provider>,
    store,
    {},
  );

  expect(
    screen.getByText("Requires 5 elements, selected array has 4."),
  ).toBeInTheDocument();
});
