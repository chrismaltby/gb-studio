import reducer, {
  initialState,
} from "../../../../src/store/features/document/documentState";
import actions from "../../../../src/store/features/project/projectActions";

test("Should not change the path and root if saving existing project", () => {
  const state = {
    ...initialState,
    saving: true,
    path: "initial_test_root/project.gbsproj",
    root: "initial_test_root/",
    modified: true,
  };
  const action = actions.saveProject.fulfilled(
    undefined,
    "randomid",
    undefined
  );
  const newState = reducer(state, action);
  expect(newState.saving).toBe(false);
  expect(newState.path).toBe("initial_test_root/project.gbsproj");
  expect(newState.root).toBe("initial_test_root/");
  expect(newState.modified).toBe(false);
});
