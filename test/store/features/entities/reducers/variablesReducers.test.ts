/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";

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

test("Should be able to delete a variable name by setting blank value", () => {
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

  expect(state.variables.entities["1"]).toBeTruthy();

  const newState = reducer(state, action);

  expect(newState.variables.entities["1"]).toBeUndefined();
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

test("Should remove variable when name is empty and doesn't have flags", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
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
  expect(newState.variables.entities["13"]).toBeUndefined();
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
    symbol: "",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should remove variable when all flags removed and was unnamed", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
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
  expect(newState.variables.entities["15"]).toBeUndefined();
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
