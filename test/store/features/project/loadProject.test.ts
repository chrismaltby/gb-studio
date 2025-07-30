import reducer, {
  initialState,
} from "../../../../src/store/features/document/documentState";
import actions from "../../../../src/store/features/project/projectActions";
import { dummyCompressedProjectResources } from "../../../dummydata";

test("Should set loaded state to false while loading project", () => {
  const state = {
    ...initialState,
    loaded: true,
  };
  const action = actions.loadProject.pending("newfile.gbsproj", "randomid");
  const newState = reducer(state, action);
  expect(newState.loaded).toBe(false);
});

test("Should change the path and root to new path and root and set loaded to true after loading is finished", () => {
  const state = {
    ...initialState,
    loaded: false,
    path: "initial_test_root/project.gbsproj",
    root: "initial_test_root/",
    modified: true,
  };
  const action = actions.loadProject.fulfilled(
    {
      resources: dummyCompressedProjectResources,
      path: "new_test_root/project_copy.gbsproj",
      scriptEventDefs: {},
      engineSchema: {
        fields: [],
        sceneTypes: [],
        consts: {},
      },
      modifiedSpriteIds: [],
      isMigrated: false,
    },
    "randomid",
    "new_test_root/project_copy.gbsproj",
  );
  const newState = reducer(state, action);
  expect(newState.loaded).toBe(true);
  expect(newState.modified).toBe(false);
});
