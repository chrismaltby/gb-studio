import reducer, {
  initialState,
  getMetadata,
} from "../../../../src/store/features/metadata/metadataState";
import projectActions from "../../../../src/store/features/project/projectActions";
import actions from "../../../../src/store/features/metadata/metadataActions";
import { dummyProjectData, dummyRootState } from "../../../dummydata";
import { RootState } from "../../../../src/store/configureStore";

test("Should change the path and root to new path and root and set loaded to true after loading is finished", () => {
  const state = {
    ...initialState,
  };
  const action = projectActions.loadProject.fulfilled(
    {
      data: {
        ...dummyProjectData,
        name: "Testing Project",
        author: "Chris",
      },
      path: "new_test_root/project_copy.gbsproj",
      modifiedSpriteIds: [],
    },
    "randomid",
    "new_test_root/project_copy.gbsproj"
  );
  const newState = reducer(state, action);
  expect(newState.name).toBe("Testing Project");
  expect(newState.author).toBe("Chris");
});

test("Should be able to edit metadata", () => {
  const state = {
    ...initialState,
    name: "Test Project 1",
  };
  const action = actions.editMetadata({
    name: "Test Project 2",
  });
  expect(state.name).toBe("Test Project 1");
  const newState = reducer(state, action);
  expect(newState.name).toBe("Test Project 2");
});

test("Should be able to select metadata from root state", () => {
  const state: RootState = {
    ...dummyRootState,
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        metadata: {
          ...initialState,
          name: "Selected Project",
          author: "GB Studio",
        },
      },
    },
  };
  expect(getMetadata(state).name).toBe("Selected Project");
  expect(getMetadata(state).author).toBe("GB Studio");
});
