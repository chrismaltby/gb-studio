import reducer, {
  initialState,
} from "../../../../src/store/features/document/documentState";

test("Should set modified if any entity actions have fired", () => {
  const state = {
    ...initialState,
    modified: false,
  };
  const action = {
    type: "entities/xyz",
  };
  const newState = reducer(state, action);
  expect(newState.modified).toBe(true);
});

test("Should set modified if any metadata actions have fired", () => {
  const state = {
    ...initialState,
    modified: false,
  };
  const action = {
    type: "metadata/xyz",
  };
  const newState = reducer(state, action);
  expect(newState.modified).toBe(true);
});

test("Should set modified if any settings actions have fired", () => {
  const state = {
    ...initialState,
    modified: false,
  };
  const action = {
    type: "settings/xyz",
  };
  const newState = reducer(state, action);
  expect(newState.modified).toBe(true);
});

test("Should not set modified if any other actions have fired", () => {
  const state = {
    ...initialState,
    modified: false,
  };
  const action = {
    type: "editor/xyz",
  };
  const newState = reducer(state, action);
  expect(newState.modified).toBe(false);
});
