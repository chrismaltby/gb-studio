/**
 * @jest-environment jsdom
 */

import React from "react";
import { VariableSelect } from "../../../src/components/forms/VariableSelect";
import { render, screen, fireEvent, waitFor } from "../../react-utils";
import { UnknownAction, Store } from "@reduxjs/toolkit";
import { RootState } from "store/storeTypes";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import entitiesActions from "store/features/entities/entitiesActions";
import { clearL10NData, setL10NData } from "shared/lib/lang/l10n";

test("Should use default variable name with not renamed", () => {
  const state = {
    editor: {
      type: "actor",
    },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {},
            ids: [],
          },
          variables: {
            entities: {
              "0": {
                id: "0",
                name: "",
                symbol: "var_1",
              },
            },
            ids: ["0"],
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
    <VariableSelect name="test" entityId="" value="0" onChange={() => {}} />,
    store,
    {},
  );
  expect(screen.getByText("$Variable 0")).toBeInTheDocument();
});

test("Should use default custom event variable name with not renamed", () => {
  const state = {
    editor: {
      type: "customEvent",
    },
    project: {
      present: {
        entities: {
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
            entities: {},
            ids: [],
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
      <VariableSelect
        name="test"
        entityId="customEvent1"
        value="V0"
        onChange={() => {}}
      />
    </ScriptEditorContext.Provider>,
    store,
    {},
  );
  expect(screen.getByText("$Variable A")).toBeInTheDocument();
});

test("Should use renamed variable", () => {
  const state = {
    editor: {
      type: "actor",
    },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {},
            ids: [],
          },
          variables: {
            entities: {
              "0": {
                id: "0",
                name: "My Variable Name",
              },
            },
            ids: ["0"],
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
    <VariableSelect name="test" entityId="" value="0" onChange={() => {}} />,
    store,
    {},
  );
  expect(screen.getByText("$My Variable Name")).toBeInTheDocument();
});

test("Should scroll a selected variable into view in a windowed menu", async () => {
  const variables = Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => {
      const id = `variable${index}`;
      return [
        id,
        {
          id,
          name: `Variable ${String(index).padStart(2, "0")}`,
          symbol: `var_${index}`,
        },
      ];
    }),
  );
  const state = {
    editor: {
      type: "actor",
    },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {},
            ids: [],
          },
          variables: {
            entities: variables,
            ids: Object.keys(variables),
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

  const { container } = render(
    <VariableSelect
      name="test"
      entityId=""
      value="variable19"
      onChange={() => {}}
      menuIsOpen
      menuPortalTarget={null}
    />,
    store,
    {},
  );

  await waitFor(() =>
    expect(container.querySelector('[aria-selected="true"]')).toHaveTextContent(
      "Variable 19",
    ),
  );
  expect(screen.getAllByRole("option").length).toBeLessThan(28);
});

test("Should use renamed variable for custom event", () => {
  const state = {
    editor: {
      type: "customEvent",
    },
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
                    name: "My Custom Event Variable",
                  },
                },
              },
            },
            ids: ["customEvent1"],
          },
          variables: {
            entities: {},
            ids: [],
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
      <VariableSelect
        name="test"
        entityId="customEvent1"
        value="V0"
        onChange={() => {}}
      />
    </ScriptEditorContext.Provider>,
    store,
    {},
  );
  expect(screen.getByText("$My Custom Event Variable")).toBeInTheDocument();
});

test("Should create and select a named variable", () => {
  setL10NData({
    FIELD_CREATE_NAMED: 'Create localized "{name}"',
  });
  const state = {
    editor: {
      type: "actor",
    },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {},
            ids: [],
          },
          variables: {
            entities: {},
            ids: [],
          },
        },
      },
    },
  };
  const dispatch = jest.fn();
  const onChange = jest.fn();

  const store = {
    getState: () => state,
    dispatch,
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <VariableSelect
      name="test"
      entityId=""
      value="0"
      onChange={onChange}
      menuIsOpen
      menuPortalTarget={null}
    />,
    store,
    {},
  );

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "Player Health" },
  });
  expect(
    screen.getByRole("option", {
      name: 'Create localized "Player Health"',
    }),
  ).toBeInTheDocument();
  clearL10NData();
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });

  const addAction = dispatch.mock.calls
    .map(([action]) => action)
    .find(entitiesActions.addVariable.match);
  if (!addAction) {
    throw new Error("Expected addVariable to be dispatched");
  }
  expect(dispatch).toHaveBeenCalledWith(
    entitiesActions.renameVariable({
      variableId: addAction.payload.variableId,
      name: "Player Health",
    }),
  );
  expect(onChange).toHaveBeenCalledWith(addAction.payload.variableId);
});

test("Should be able to rename variable", async () => {
  const state = {
    editor: {
      type: "actor",
    },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {},
            ids: [],
          },
          variables: {
            entities: {
              "0": {
                id: "0",
                name: "My Initial Variable Name",
              },
            },
            ids: ["0"],
          },
        },
      },
    },
  };
  const dispatch = jest.fn();

  const store = {
    getState: () => state,
    dispatch,
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <VariableSelect
      name="test"
      entityId=""
      value="0"
      onChange={() => {}}
      allowRename
    />,
    store,
    {},
  );

  fireEvent.click(screen.getByTitle("FIELD_RENAME"));

  const renameInput: HTMLInputElement = screen.getByRole(
    "textbox",
  ) as HTMLInputElement;

  expect(renameInput).toHaveValue("My Initial Variable Name");
  expect(renameInput).toHaveFocus();

  fireEvent.change(renameInput, {
    target: { value: "My New Variable Name" },
  });

  fireEvent.blur(renameInput);

  expect(dispatch).toHaveBeenCalledWith({
    payload: { name: "My New Variable Name", variableId: "0" },
    type: "entities/renameVariable",
  });
});

test("Should cancel rename when Escape is pressed", async () => {
  const state = {
    editor: {
      type: "actor",
    },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {},
            ids: [],
          },
          variables: {
            entities: {
              "0": {
                id: "0",
                name: "My Initial Variable Name",
              },
            },
            ids: ["0"],
          },
        },
      },
    },
  };
  const dispatch = jest.fn();

  const store = {
    getState: () => state,
    dispatch,
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <VariableSelect
      name="test"
      entityId=""
      value="0"
      onChange={() => {}}
      allowRename
    />,
    store,
    {},
  );

  fireEvent.click(screen.getByTitle("FIELD_RENAME"));

  const renameInput: HTMLInputElement = screen.getByRole(
    "textbox",
  ) as HTMLInputElement;

  fireEvent.change(renameInput, {
    target: { value: "My New Variable Name" },
  });

  fireEvent.keyDown(renameInput, { key: "Escape", code: "Escape" });

  expect(dispatch).not.toHaveBeenCalled();

  expect(renameInput).not.toBeInTheDocument();
});

test("Should complete rename when Escape is pressed", async () => {
  const state = {
    editor: {
      type: "actor",
    },
    project: {
      present: {
        entities: {
          customEvents: {
            entities: {},
            ids: [],
          },
          variables: {
            entities: {
              "0": {
                id: "0",
                name: "My Initial Variable Name",
              },
            },
            ids: ["0"],
          },
        },
      },
    },
  };
  const dispatch = jest.fn();

  const store = {
    getState: () => state,
    dispatch,
    subscribe: () => {},
  } as unknown as Store<RootState, UnknownAction>;

  render(
    <VariableSelect
      name="test"
      entityId=""
      value="0"
      onChange={() => {}}
      allowRename
    />,
    store,
    {},
  );

  fireEvent.click(screen.getByTitle("FIELD_RENAME"));

  const renameInput: HTMLInputElement = screen.getByRole(
    "textbox",
  ) as HTMLInputElement;

  fireEvent.change(renameInput, {
    target: { value: "My New Variable Name" },
  });

  fireEvent.keyDown(renameInput, { key: "Enter", code: "Enter" });

  expect(dispatch).toHaveBeenCalledWith({
    payload: { name: "My New Variable Name", variableId: "0" },
    type: "entities/renameVariable",
  });

  expect(renameInput).not.toBeInTheDocument();
});
