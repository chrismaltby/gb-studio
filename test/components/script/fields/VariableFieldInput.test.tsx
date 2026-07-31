/**
 * @jest-environment jsdom
 */

import React from "react";
import { VariableFieldInput } from "components/script/fields/VariableFieldInput";
import { render, screen } from "../../../react-utils";
import type { UnknownAction, Store } from "@reduxjs/toolkit";
import type { RootState } from "store/storeTypes";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";

jest.mock("components/forms/VariableIndexSelect", () => ({
  IndexedVariableInputGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  VariableInputGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  VariableIndexSelect: () => <div data-testid="variable-index" />,
}));

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
