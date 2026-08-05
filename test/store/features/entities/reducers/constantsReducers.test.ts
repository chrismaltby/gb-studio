import reducer, { initialState } from "store/features/entities/entitiesState";
import type { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";

test("Should create a default constant", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addConstant({ constantId: "constant-1" });
  const newState = reducer(state, action);

  expect(newState.constants.entities["constant-1"]).toEqual({
    id: "constant-1",
    name: "",
    symbol: "const_constant_1",
    value: 0,
  });
});

test("Should create a complete named constant atomically", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addConstant({
    constantId: "constant-1",
    name: "Maximum Health",
    value: 20,
  });
  const newState = reducer(state, action);

  expect(newState.constants.entities["constant-1"]).toEqual({
    id: "constant-1",
    name: "Maximum Health",
    symbol: "const_maximum_health",
    value: 20,
  });
});

test("Should preserve an explicitly provided zero value", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addConstant({
    constantId: "constant-1",
    name: "Zero",
    value: 0,
  });
  const newState = reducer(state, action);

  expect(newState.constants.entities["constant-1"]?.value).toBe(0);
});

test("Should preserve the symbol when the constant name is unchanged", () => {
  const state = reducer(
    initialState,
    actions.addConstant({
      constantId: "constant-1",
      name: "Maximum Health",
    }),
  );

  const newState = reducer(
    state,
    actions.renameConstant({
      constantId: "constant-1",
      name: "Maximum Health",
    }),
  );

  expect(newState.constants.entities["constant-1"]).toEqual({
    id: "constant-1",
    name: "Maximum Health",
    symbol: "const_maximum_health",
    value: 0,
  });
});
