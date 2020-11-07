import reducer, {
  initialState,
  EngineState,
  EngineFieldSchema,
} from "../../../../src/store/features/engine/engineState";
import actions from "../../../../src/store/features/engine/engineActions";

test("Should be able to set section", () => {
  const state: EngineState = {
    ...initialState,
    fields: [],
  };
  const newEngineFields: EngineFieldSchema[] = [
    {
      key: "test_field",
      label: "Test Field",
      group: "Global",
      type: "number",
      cType: "UBYTE",
      defaultValue: 1,
    },
  ];
  const action = actions.setEngineFields(newEngineFields);
  const newState = reducer(state, action);
  expect(newState.fields).toEqual(newEngineFields);
});
