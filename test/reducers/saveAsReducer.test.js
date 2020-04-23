import documentReducer from "../../src/reducers/documentReducer";
import { PROJECT_SAVE_AS_REQUEST, PROJECT_SAVE_AS_SUCCESS, PROJECT_SAVE_AS_FAILURE } from "../../src/actions/actionTypes";


test("Should cause the project to enter saving state", () => {
  const state = {
    saving: false
  };
  const action = {
    type: PROJECT_SAVE_AS_REQUEST,
  };
  const newState = documentReducer(state, action);
  expect(newState.saving).toBe(true);
});

test("Should cause project to exit saving state without changing anything", () => {
  const state = {
    saving: true
  };
  const action = {
    type: PROJECT_SAVE_AS_FAILURE
  };
  const newState = documentReducer(state, action);
  expect(newState.saving).toBe(false);
});

test("Should change the path and root to new path and root and update modified state", () => {
  const state = {
    saving: true,
    path: "initial_test_root/project.gbsproj",
    root: "initial_test_root/",
    modified: true,
  };
  const action = {
    type: PROJECT_SAVE_AS_SUCCESS,
    path: "new_test_root/project_copy.gbsproj"
  };
  const newState = documentReducer(state, action);
  expect(newState.saving).toBe(false);
  expect(newState.path).toBe("new_test_root/project_copy.gbsproj");
  expect(newState.root).toBe("new_test_root");
  expect(newState.modified).toBe(false);
});

test("Should change the path and root to new path and root and keep modified state off", () => {
  const state = {
    saving: true,
    path: "initial_test_root/project.gbsproj",
    root: "initial_test_root/",
    modified: false,
  };
  const action = {
    type: PROJECT_SAVE_AS_SUCCESS,
    path: "new_test_root/project_copy.gbsproj"
  };
  const newState = documentReducer(state, action);
  expect(newState.saving).toBe(false);
  expect(newState.path).toBe("new_test_root/project_copy.gbsproj");
  expect(newState.root).toBe("new_test_root");
  expect(newState.modified).toBe(false);
});
