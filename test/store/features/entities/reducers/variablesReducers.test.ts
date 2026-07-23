import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";

test("Should be able to set a variable's name", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.renameVariable({
    variableId: "1",
    name: "Var Name",
  });

  const newState = reducer(state, action);

  expect(newState.variables.entities["1"]?.name).toBe("Var Name");
});

test("Should keep defined global variable when name is set to blank value", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      entities: {
        "1": {
          id: "1",
          name: "Var Name",
          symbol: "VAR_1",
        },
      },
      ids: ["1"],
    },
  };

  const action = actions.renameVariable({
    variableId: "1",
    name: "",
  });

  const newState = reducer(state, action);

  expect(newState.variables.entities["1"]).toMatchObject({
    id: "1",
    name: "",
  });
});

test("Should remove local variable name when set to blank value", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      entities: {
        entity1__L0: {
          id: "entity1__L0",
          name: "Local Name",
          symbol: "var_local_name",
        },
      },
      ids: ["entity1__L0"],
    },
  };

  const action = actions.renameVariable({
    variableId: "entity1__L0",
    name: "",
  });

  const newState = reducer(state, action);

  expect(newState.variables.entities["entity1__L0"]).toBeUndefined();
});

test("Should be able to add flags to existing named variable", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["11"],
      entities: {
        "11": {
          id: "11",
          name: "Powers",
          symbol: "var_powers",
        },
      },
    },
  };

  const action = actions.renameVariableFlags({
    variableId: "11",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["11"]).toMatchObject({
    id: "11",
    name: "Powers",
    symbol: "var_powers",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should be able to add flags to unnamed variable", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {},
    },
  };

  const action = actions.renameVariableFlags({
    variableId: "12",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["12"]).toMatchObject({
    id: "12",
    name: "",
    symbol: "",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should keep global variable when name is empty and doesn't have flags", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["13"],
      entities: {
        "13": {
          id: "13",
          name: "Powers",
          symbol: "var_powers",
        },
      },
    },
  };
  const action = actions.renameVariable({
    variableId: "13",
    name: "",
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["13"]).toMatchObject({
    id: "13",
    name: "",
  });
});

test("Should not remove variable when name is empty but has named flags", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["14"],
      entities: {
        "14": {
          id: "14",
          name: "Powers",
          symbol: "var_powers",
          flags: {
            flag1: "Crouch Ball",
            flag2: "Cannon",
            flag3: "Big Beam",
            flag4: "Spin Jump",
          },
        },
      },
    },
  };
  const action = actions.renameVariable({
    variableId: "14",
    name: "",
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["14"]).toMatchObject({
    id: "14",
    name: "",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should keep global variable when all flags removed and was unnamed", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["15"],
      entities: {
        "15": {
          id: "15",
          name: "",
          symbol: "",
          flags: {
            flag1: "Crouch Ball",
            flag2: "Cannon",
            flag3: "Big Beam",
            flag4: "Spin Jump",
          },
        },
      },
    },
  };
  const action = actions.renameVariableFlags({
    variableId: "15",
    flags: {},
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["15"]).toMatchObject({
    id: "15",
    name: "",
    flags: {},
  });
});

test("Should be able to add a variable", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addVariable({ variableId: "0" });
  const newState = reducer(state, action);

  expect(newState.variables.entities["0"]).toMatchObject({
    id: "0",
    name: "",
  });
  expect(newState.variables.entities["0"]?.symbol).toBeTruthy();
  expect(newState.variables.ids).toEqual(["0"]);
});

test("Should not replace an existing variable when adding with same id", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0"],
      entities: {
        "0": {
          id: "0",
          name: "Existing",
          symbol: "var_existing",
        },
      },
    },
  };

  const action = actions.addVariable({ variableId: "0" });
  const newState = reducer(state, action);

  expect(newState.variables.entities["0"]?.name).toBe("Existing");
});

test("Should be able to add a variable array grouped in a folder", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addVariableArray({
    variableIds: ["0", "1", "2", "3"],
    name: "Coins",
  });
  const newState = reducer(state, action);

  expect(newState.variables.ids).toEqual(["0", "1", "2", "3"]);
  expect(newState.variables.entities["0"]?.name).toBe("Coins/Coins 0");
  expect(newState.variables.entities["3"]?.name).toBe("Coins/Coins 3");
});

test("Should be able to remove a variable", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["5"],
      entities: {
        "5": {
          id: "5",
          name: "Var",
          symbol: "var_var",
        },
      },
    },
  };

  const action = actions.removeVariable({ variableId: "5" });
  const newState = reducer(state, action);

  expect(newState.variables.entities["5"]).toBeUndefined();
  expect(newState.variables.ids).toEqual([]);
});

test("Should be able to move a variable up among its siblings", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0", "1", "2"],
      entities: {
        "0": { id: "0", name: "A", symbol: "var_a" },
        "1": { id: "1", name: "B", symbol: "var_b" },
        "2": { id: "2", name: "C", symbol: "var_c" },
      },
    },
  };

  const action = actions.moveVariable({ variableId: "2", direction: "up" });
  const newState = reducer(state, action);

  expect(newState.variables.ids).toEqual(["0", "2", "1"]);
});

test("Should be able to move a variable down among its siblings", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0", "1", "2"],
      entities: {
        "0": { id: "0", name: "A", symbol: "var_a" },
        "1": { id: "1", name: "B", symbol: "var_b" },
        "2": { id: "2", name: "C", symbol: "var_c" },
      },
    },
  };

  const action = actions.moveVariable({ variableId: "0", direction: "down" });
  const newState = reducer(state, action);

  expect(newState.variables.ids).toEqual(["1", "0", "2"]);
});

test("Should only move variables within the same folder", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0", "1", "2"],
      entities: {
        "0": { id: "0", name: "Folder/A", symbol: "var_a" },
        "1": { id: "1", name: "Folder/B", symbol: "var_b" },
        "2": { id: "2", name: "C", symbol: "var_c" },
      },
    },
  };

  // "1" is last in its folder so moving down does nothing
  const action = actions.moveVariable({ variableId: "1", direction: "down" });
  const newState = reducer(state, action);

  expect(newState.variables.ids).toEqual(["0", "1", "2"]);
});

test("Should reparent a variable into a folder and keep folder block contiguous", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0", "1", "2"],
      entities: {
        "0": { id: "0", name: "Folder/A", symbol: "var_a" },
        "1": { id: "1", name: "B", symbol: "var_b" },
        "2": { id: "2", name: "Folder/C", symbol: "var_c" },
      },
    },
  };

  const action = actions.reparentVariable({ variableId: "1", toPath: "Folder" });
  const newState = reducer(state, action);

  expect(newState.variables.entities["1"]?.name).toBe("Folder/B");
  // All folder members grouped together in original relative order
  expect(newState.variables.ids).toEqual(["0", "1", "2"]);
});

test("Should be able to rename a variables folder", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0", "1", "2"],
      entities: {
        "0": { id: "0", name: "Old/A", symbol: "var_a" },
        "1": { id: "1", name: "Old/B", symbol: "var_b" },
        "2": { id: "2", name: "Other", symbol: "var_c" },
      },
    },
  };

  const action = actions.renameVariablesFolder({
    fromPath: "Old",
    toPath: "New",
  });
  const newState = reducer(state, action);

  expect(newState.variables.entities["0"]?.name).toBe("New/A");
  expect(newState.variables.entities["1"]?.name).toBe("New/B");
  expect(newState.variables.entities["2"]?.name).toBe("Other");
});

const arrayScriptEventDefs = {
  EVENT_ARRAY_SET_VALUE: {
    fieldsLookup: {
      array: { key: "array", type: "variableArray" },
    },
  },
  EVENT_VARIABLE_MATH_EVALUATE: {
    fieldsLookup: {
      expression: { key: "expression", type: "matharea" },
    },
  },
} as unknown as ScriptEventDefs;

test("Should update script references when renaming a variables folder", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0", "1"],
      entities: {
        "0": { id: "0", name: "Old/Old 0", symbol: "var_old_0" },
        "1": { id: "1", name: "Old/Old 1", symbol: "var_old_1" },
      },
    },
    scriptEvents: {
      ids: ["event1", "event2", "event3"],
      entities: {
        event1: {
          id: "event1",
          command: "EVENT_ARRAY_SET_VALUE",
          args: {
            array: "Old",
            index: { type: "number", value: 0 },
            value: { type: "number", value: 5 },
          },
        },
        event2: {
          id: "event2",
          command: "EVENT_VARIABLE_MATH_EVALUATE",
          args: {
            expression: "Old[0] + Other[1]",
          },
        },
        event3: {
          id: "event3",
          command: "EVENT_SET_VALUE",
          args: {
            variable: "0",
            value: {
              type: "add",
              valueA: {
                type: "arrayValue",
                name: "Old",
                index: { type: "number", value: 0 },
              },
              valueB: { type: "expression", value: "Old[1]" },
            },
          },
        },
      },
    },
  };

  const action = actions.renameVariablesFolder({
    fromPath: "Old",
    toPath: "New",
    scriptEventDefs: arrayScriptEventDefs,
  });
  const newState = reducer(state, action);

  expect(newState.variables.entities["0"]?.name).toBe("New/Old 0");
  expect(newState.scriptEvents.entities["event1"]?.args?.array).toBe("New");
  expect(newState.scriptEvents.entities["event2"]?.args?.expression).toBe(
    "New[0] + Other[1]",
  );
  expect(newState.scriptEvents.entities["event3"]?.args?.value).toEqual({
    type: "add",
    valueA: {
      type: "arrayValue",
      name: "New",
      index: { type: "number", value: 0 },
    },
    valueB: { type: "expression", value: "New[1]" },
  });
});

test("Should update full path script references when moving a variables folder", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0"],
      entities: {
        "0": { id: "0", name: "Arr/Arr 0", symbol: "var_arr_0" },
      },
    },
    scriptEvents: {
      ids: ["event1"],
      entities: {
        event1: {
          id: "event1",
          command: "EVENT_ARRAY_SET_VALUE",
          args: {
            array: "Arr",
            index: { type: "number", value: 0 },
            value: { type: "number", value: 5 },
          },
        },
      },
    },
  };

  const action = actions.reparentVariablesFolder({
    fromPath: "Arr",
    toPath: "Parent",
    scriptEventDefs: arrayScriptEventDefs,
  });
  const newState = reducer(state, action);

  expect(newState.variables.entities["0"]?.name).toBe("Parent/Arr/Arr 0");
  expect(newState.scriptEvents.entities["event1"]?.args?.array).toBe(
    "Parent/Arr",
  );
});

test("Should be able to remove all variables in a folder", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["0", "1", "2"],
      entities: {
        "0": { id: "0", name: "Arr/Arr 0", symbol: "var_arr_0" },
        "1": { id: "1", name: "Arr/Arr 1", symbol: "var_arr_1" },
        "2": { id: "2", name: "Other", symbol: "var_c" },
      },
    },
  };

  const action = actions.removeVariablesFolder({ path: "Arr" });
  const newState = reducer(state, action);

  expect(newState.variables.entities["0"]).toBeUndefined();
  expect(newState.variables.entities["1"]).toBeUndefined();
  expect(newState.variables.entities["2"]?.name).toBe("Other");
});

test("Should not remove variable when all flags removed but variable was named", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {
        "16": {
          id: "16",
          name: "Powers",
          symbol: "var_powers",
          flags: {
            flag1: "Crouch Ball",
            flag2: "Cannon",
            flag3: "Big Beam",
            flag4: "Spin Jump",
          },
        },
      },
    },
  };
  const action = actions.renameVariableFlags({
    variableId: "16",
    flags: {},
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["16"]).toMatchObject({
    id: "16",
    name: "Powers",
    symbol: "var_powers",
    flags: {},
  });
});
