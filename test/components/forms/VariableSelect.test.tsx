/**
 * @jest-environment jsdom
 */

import React from "react";
import { VariableSelect } from "../../../src/components/forms/VariableSelect";
import { render, screen, fireEvent } from "../../react-utils";
import { AnyAction, Store } from "@reduxjs/toolkit";
import { RootState } from "../../../src/store/configureStore";

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
  } as unknown as Store<RootState, AnyAction>;

  render(
    <VariableSelect
      name="test"
      type="8bit"
      entityId=""
      value="0"
      onChange={() => {}}
    />,
    store,
    {}
  );
  expect(screen.getByText("Variable 0")).toBeInTheDocument();
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
  } as unknown as Store<RootState, AnyAction>;

  render(
    <VariableSelect
      name="test"
      type="8bit"
      entityId="customEvent1"
      value="0"
      onChange={() => {}}
    />,
    store,
    {}
  );
  expect(screen.getByText("Variable A")).toBeInTheDocument();
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
  } as unknown as Store<RootState, AnyAction>;

  render(
    <VariableSelect
      name="test"
      type="8bit"
      entityId=""
      value="0"
      onChange={() => {}}
    />,
    store,
    {}
  );
  expect(screen.getByText("My Variable Name")).toBeInTheDocument();
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
                  "0": {
                    id: "0",
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
  } as unknown as Store<RootState, AnyAction>;

  render(
    <VariableSelect
      name="test"
      type="8bit"
      entityId="customEvent1"
      value="0"
      onChange={() => {}}
    />,
    store,
    {}
  );
  expect(screen.getByText("My Custom Event Variable")).toBeInTheDocument();
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
  } as unknown as Store<RootState, AnyAction>;

  render(
    <VariableSelect
      name="test"
      type="8bit"
      entityId=""
      value="0"
      onChange={() => {}}
      allowRename
    />,
    store,
    {}
  );

  fireEvent.click(screen.getByTitle("Rename"));

  const renameInput: HTMLInputElement = screen.getByRole(
    "textbox"
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
  } as unknown as Store<RootState, AnyAction>;

  render(
    <VariableSelect
      name="test"
      type="8bit"
      entityId=""
      value="0"
      onChange={() => {}}
      allowRename
    />,
    store,
    {}
  );

  fireEvent.click(screen.getByTitle("Rename"));

  const renameInput: HTMLInputElement = screen.getByRole(
    "textbox"
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
  } as unknown as Store<RootState, AnyAction>;

  render(
    <VariableSelect
      name="test"
      type="8bit"
      entityId=""
      value="0"
      onChange={() => {}}
      allowRename
    />,
    store,
    {}
  );

  fireEvent.click(screen.getByTitle("Rename"));

  const renameInput: HTMLInputElement = screen.getByRole(
    "textbox"
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
