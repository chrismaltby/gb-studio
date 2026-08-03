import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";

test("Should add number variables without an array size", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const newState = reducer(state, actions.addVariable());
  const variable = Object.values(newState.variables.entities)[0];

  expect(variable).toMatchObject({
    type: "number",
  });
  expect(variable).not.toHaveProperty("size");
});

test("Should create a complete named number variable atomically", () => {
  const state: EntitiesState = {
    ...initialState,
  };
  const flags = { persistent: "true" };

  const newState = reducer(
    state,
    actions.addVariable({
      variableId: "variable-1",
      name: "Player Health",
      type: "number",
      size: 12,
      flags,
    }),
  );

  expect(newState.variables.entities["variable-1"]).toEqual({
    id: "variable-1",
    name: "Player Health",
    symbol: "var_player_health",
    type: "number",
    flags,
  });
});

test.each([
  [undefined, 1],
  [0, 1],
  [-4, 1],
  [3.9, 3],
])(
  "Should create an array atomically and clamp size %p to %p",
  (size, expected) => {
    const state: EntitiesState = {
      ...initialState,
    };

    const newState = reducer(
      state,
      actions.addVariable({
        variableId: "array-1",
        name: "Inventory",
        type: "array",
        size,
        flags: { persistent: "true" },
      }),
    );

    expect(newState.variables.entities["array-1"]).toEqual({
      id: "array-1",
      name: "Inventory",
      symbol: "var_inventory",
      type: "array",
      size: expected,
      flags: { persistent: "true" },
    });
  },
);

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

test("Should be able to clear a variable name without deleting it", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      entities: {
        "1": {
          id: "1",
          name: "Var Name",
          symbol: "VAR_1",
          type: "array",
          size: 4,
        },
      },
      ids: ["1"],
    },
  };

  const action = actions.renameVariable({
    variableId: "1",
    name: "",
  });

  expect(state.variables.entities["1"]).toBeTruthy();

  const newState = reducer(state, action);

  expect(newState.variables.entities["1"]).toEqual({
    id: "1",
    name: "",
    symbol: "VAR_1",
    type: "array",
    size: 4,
  });
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
          type: "number",
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

test("Should retain variable when name is empty and doesn't have flags", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {
        "13": {
          id: "13",
          name: "Powers",
          symbol: "var_powers",
          type: "number",
        },
      },
    },
  };
  const action = actions.renameVariable({
    variableId: "13",
    name: "",
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["13"]).toEqual({
    id: "13",
    name: "",
    symbol: "var_powers",
    type: "number",
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
          type: "number",
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
    symbol: "var_powers",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should retain unnamed variable when all flags are removed", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {
        "15": {
          id: "15",
          name: "",
          symbol: "",
          type: "number",
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
  expect(newState.variables.entities["15"]).toEqual({
    id: "15",
    name: "",
    symbol: "",
    type: "number",
    flags: {},
  });
});

test("Should explicitly remove a variable", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["array1"],
      entities: {
        array1: {
          id: "array1",
          name: "Inventory",
          symbol: "var_inventory",
          type: "array",
          size: 4,
        },
      },
    },
  };

  const newState = reducer(
    state,
    actions.removeVariable({ variableId: "array1" }),
  );

  expect(newState.variables.entities.array1).toBeUndefined();
  expect(newState.variables.ids).not.toContain("array1");
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
          type: "number",
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

test("Should be able to change a variable into an array", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["array1"],
      entities: {
        array1: {
          id: "array1",
          name: "Inventory",
          symbol: "var_inventory",
          type: "number",
        },
      },
    },
  };

  const newState = reducer(
    state,
    actions.setVariableType({
      variableId: "array1",
      type: "array",
    }),
  );

  expect(newState.variables.entities.array1).toMatchObject({
    type: "array",
    size: 1,
  });
});

test("Should clamp array variable size to at least one", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["array1"],
      entities: {
        array1: {
          id: "array1",
          name: "Inventory",
          symbol: "var_inventory",
          type: "array",
          size: 4,
        },
      },
    },
  };

  const resizedState = reducer(
    state,
    actions.setVariableSize({
      variableId: "array1",
      size: 12,
    }),
  );
  const clampedState = reducer(
    resizedState,
    actions.setVariableSize({
      variableId: "array1",
      size: 0,
    }),
  );

  expect(resizedState.variables.entities.array1).toMatchObject({ size: 12 });
  expect(clampedState.variables.entities.array1).toMatchObject({ size: 1 });
});

test("Should ignore size changes for number variables", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["number1"],
      entities: {
        number1: {
          id: "number1",
          name: "Score",
          symbol: "var_score",
          type: "number",
        },
      },
    },
  };

  const newState = reducer(
    state,
    actions.setVariableSize({
      variableId: "number1",
      size: 12,
    }),
  );

  expect(newState.variables.entities.number1).not.toHaveProperty("size");
});

test("Should reset array size when changing back to a number", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["array1"],
      entities: {
        array1: {
          id: "array1",
          name: "Inventory",
          symbol: "var_inventory",
          type: "array",
          size: 4,
        },
      },
    },
  };

  const newState = reducer(
    state,
    actions.setVariableType({
      variableId: "array1",
      type: "number",
    }),
  );

  expect(newState.variables.entities.array1).toMatchObject({
    type: "number",
  });
  expect(newState.variables.entities.array1).not.toHaveProperty("size");
});
