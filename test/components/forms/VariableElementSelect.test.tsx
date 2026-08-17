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
      value={{ type: "variable", value: "array" }}
      onChange={onChange}
      menuIsOpen
      menuPortalTarget={null}
    />,
    store,
    {},
  );

  expect(screen.getByRole("option", { name: "Scalar" })).toBeInTheDocument();
  expect(screen.getByText("$Array[0]")).toBeInTheDocument();
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

test("Should list custom event array parameter elements as individual options", () => {
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
                    size: 3,
                  },
                  V1: {
                    id: "V1",
                    name: "Array B",
                    passByReference: "array",
                    size: 2,
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
  expect(screen.getByText("$Array A[2]")).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "Array A[0]" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "Array A[1]" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("option", { name: "Array A[2]" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Array A[3]" }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("option", { name: "Array B[1]" }));
  expect(onChange).toHaveBeenCalledWith({
    type: "variable",
    value: "V1",
    index: { type: "number", value: 1 },
  });
});

test("Should exclude custom event parameters when disabled", () => {
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
                    name: "Array Reference",
                    passByReference: "array",
                    size: 3,
                  },
                  V1: {
                    id: "V1",
                    name: "Variable Reference",
                    passByReference: true,
                  },
                  V2: {
                    id: "V2",
                    name: "Value Parameter",
                    passByReference: false,
                  },
                },
              },
            },
            ids: ["customEvent1"],
          },
          variables: {
            entities: {
              global: {
                id: "global",
                name: "Global",
                symbol: "var_global",
                type: "number",
              },
            },
            ids: ["global"],
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
      <VariableElementSelect
        name="test"
        entityId="customEvent1"
        value={undefined}
        onChange={() => {}}
        allowCustomEventParameters={false}
        menuIsOpen
        menuPortalTarget={null}
      />
    </ScriptEditorContext.Provider>,
    store,
    {},
  );

  expect(
    screen.queryByRole("option", { name: "Array Reference[0]" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Variable Reference" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("option", { name: "Value Parameter" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Global" })).toBeInTheDocument();
});
