/**
 * @jest-environment jsdom
 */

import React from "react";
import { UnknownAction, Store } from "@reduxjs/toolkit";
import { VariableElementSelect } from "components/forms/VariableElementSelect";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import { fireEvent, render, screen } from "../../react-utils";
import { RootState } from "store/storeTypes";

test("Should list fixed array elements as individual options", () => {
  const state = {
    editor: { type: "actor" },
    project: {
      present: {
        entities: {
          customEvents: { entities: {}, ids: [] },
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
                size: 3,
              },
            },
            ids: ["scalar", "array"],
          },
        },
      },
    },
  };
  const onChange = jest.fn();
  const store = {
    getState: () => state,
    dispatch: () => {},
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <VariableElementSelect
      name="test"
      entityId=""
      value={{ type: "variable", value: "scalar" }}
      onChange={onChange}
      menuIsOpen
      menuPortalTarget={null}
    />,
    store,
    {},
  );

  expect(screen.getByRole("option", { name: "Scalar" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Array[0]" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Array[1]" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Array[2]" })).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Array[3]" }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("option", { name: "Array[1]" }));
  expect(onChange).toHaveBeenCalledWith({
    type: "variable",
    value: "array",
    index: { type: "number", value: 1 },
  });
});

test("Should use index zero for custom event array parameters", () => {
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
                    name: "Array A",
                    passByReference: "array",
                  },
                  V1: {
                    id: "V1",
                    name: "Array B",
                    passByReference: "array",
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
  const onChange = jest.fn();
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
      <VariableElementSelect
        name="test"
        entityId="customEvent1"
        value={{
          type: "variable",
          value: "V0",
          index: { type: "number", value: 2 },
        }}
        onChange={onChange}
        menuIsOpen
        menuPortalTarget={null}
      />
    </ScriptEditorContext.Provider>,
    store,
    {},
  );

  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("option", { name: "Array B[]" }));
  expect(onChange).toHaveBeenCalledWith({
    type: "variable",
    value: "V1",
    index: { type: "number", value: 0 },
  });
});
