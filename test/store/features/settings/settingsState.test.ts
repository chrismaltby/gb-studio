import reducer, {
  initialState,
  SettingsState,
  getSettings,
} from "../../../../src/store/features/settings/settingsState";
import actions from "../../../../src/store/features/settings/settingsActions";
import projectActions, {
  ProjectData,
} from "../../../../src/store/features/project/projectActions";
import { dummyProjectData, dummyRootState } from "../../../dummydata";
import { RootState } from "../../../../src/store/configureStore";

test("Should be able to change settings", () => {
  const state: SettingsState = {
    ...initialState,
    showCollisions: false,
  };
  const action = actions.editSettings({ showCollisions: true });
  const newState = reducer(state, action);
  expect(state.showCollisions).toBe(false);
  expect(newState.showCollisions).toBe(true);
});

test("Should be able to set player starting position", () => {
  const state: SettingsState = {
    ...initialState,
    startSceneId: "",
    startX: 0,
    startY: 0,
  };
  const action = actions.editPlayerStartAt({ sceneId: "scene1", x: 5, y: 6 });
  const newState = reducer(state, action);
  expect(newState.startSceneId).toBe("scene1");
  expect(newState.startX).toBe(5);
  expect(newState.startY).toBe(6);
});

test("Should fetch settings from loaded project", () => {
  const state: SettingsState = {
    ...initialState,
    worldScrollX: 0,
    worldScrollY: 0,
  };

  const loadData: ProjectData = {
    ...dummyProjectData,
    settings: {
      ...dummyProjectData.settings,
      worldScrollX: 50,
      worldScrollY: 60,
    },
  };

  const action = projectActions.loadProject.fulfilled(
    {
      data: loadData,
      path: "project.gbsproj",
      modifiedSpriteIds: [],
    },
    "randomid",
    "project.gbsproj"
  );
  const newState = reducer(state, action);

  expect(newState.worldScrollX).toBe(50);
  expect(newState.worldScrollY).toBe(60);
});

test("Should be able to select settings from root state", () => {
  const state: RootState = {
    ...dummyRootState,
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        settings: {
          ...initialState,
          zoom: 50,
        },
      },
    },
  };
  expect(getSettings(state).zoom).toBe(50);
});
