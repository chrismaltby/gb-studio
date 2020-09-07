import reducer, {
  initialState,
} from "../../../../src/store/features/entities/entitiesState";
import {
  EntitiesState,
  SceneData,
  Background,
} from "../../../../src/store/features/entities/entitiesTypes";
import projectActions, {
  ProjectData,
} from "../../../../src/store/features/project/projectActions";

const defaultScene: SceneData = {
  id: "",
  name: "Scene",
  backgroundId: "",
  x: 0,
  y: 0,
  width: 20,
  height: 18,
  collisions: [0],
  tileColors: [0],
  actors: [],
  triggers: [],
  script: [],
  playerHit1Script: [],
  playerHit2Script: [],
  playerHit3Script: [],
};

const defaultBackground: Background = {
  id: "",
  name: "",
  filename: "",
  width: 1,
  height: 1,
  imageWidth: 1,
  imageHeight: 1,
  _v: 0,
};

const defaultProjectData: ProjectData = {
  name: "",
  _version: "2.0.0",
  _release: "1",
  author: "",
  notes: "",
  scenes: [],
  backgrounds: [],
  spriteSheets: [],
  palettes: [],
  customEvents: [],
  variables: [],
  music: [],
  settings: {
    startSceneId: "",
    startX: 0,
    startY: 0,
    showCollisions: true,
    showConnections: true,
    worldScrollX: 0,
    worldScrollY: 0,
    zoom: 100,
    customColorsEnabled: false,
    defaultBackgroundPaletteIds: ["", "", "", "", "", ""],
    defaultSpritePaletteId: "",
    defaultUIPaletteId: "",
  },
};

test("Should fix scene widths if backgrounds has been removed since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: ProjectData = {
    ...defaultProjectData,
    scenes: [
      {
        ...defaultScene,
        id: "scene1",
        backgroundId: "missingbg",
        width: 20,
        height: 18,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      data: loadData,
      path: "project.gbsproj",
    },
    "randomid",
    "project.gbsproj"
  );
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(32);
  expect(newState.scenes.entities["scene1"]?.height).toBe(32);
});

test("Should fix scene widths if backgrounds have changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: ProjectData = {
    ...defaultProjectData,
    scenes: [
      {
        ...defaultScene,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...defaultBackground,
        id: "bg1",
        width: 64,
        height: 40,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      data: loadData,
      path: "project.gbsproj",
    },
    "randomid",
    "project.gbsproj"
  );
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(64);
  expect(newState.scenes.entities["scene1"]?.height).toBe(40);
});

test("Should keep scene widths if backgrounds have NOT changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: ProjectData = {
    ...defaultProjectData,
    scenes: [
      {
        ...defaultScene,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...defaultBackground,
        id: "bg1",
        width: 20,
        height: 18,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      data: loadData,
      path: "project.gbsproj",
    },
    "randomid",
    "project.gbsproj"
  );
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(20);
  expect(newState.scenes.entities["scene1"]?.height).toBe(18);
});

test("Should fix scene widths if background has changed while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...defaultScene,
          id: "scene1",
          backgroundId: "bg1",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...defaultBackground,
          id: "bg1",
          width: 20,
          height: 18,
        },
      },
      ids: ["bg1"],
    },
  };

  const loadBackground: Background = {
    ...defaultBackground,
    id: "bg1",
    width: 64,
    height: 40,
  };

  const action = projectActions.loadBackground.fulfilled(
    {
      data: loadBackground,
    },
    "randomid",
    "bg1.png"
  );

  expect(state.scenes.entities["scene1"]?.width).toBe(20);
  expect(state.scenes.entities["scene1"]?.height).toBe(18);
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(64);
  expect(newState.scenes.entities["scene1"]?.height).toBe(40);
});

test("Should add new background if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadBackground: Background = {
    ...defaultBackground,
    id: "bg1",
    width: 20,
    height: 18,
  };

  const action = projectActions.loadBackground.fulfilled(
    {
      data: loadBackground,
    },
    "randomid",
    "bg1.png"
  );

  expect(state.backgrounds.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.backgrounds.ids.length).toBe(1);
  expect(newState.backgrounds.entities["bg1"]?.width).toBe(20);
  expect(newState.backgrounds.entities["bg1"]?.height).toBe(18);
});

test("Should remove backgrounds that are deleted while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    backgrounds: {
      entities: {
        bg1: {
          ...defaultBackground,
          id: "bg1",
          filename: "bg1.png",
        },
      },
      ids: ["bg1"],
    },
  };

  const action = projectActions.removeBackground.fulfilled(
    {
      filename: "bg1.png",
      plugin: undefined
    },
    "randomid",
    "bg1.png"
  );

  expect(state.backgrounds.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.backgrounds.ids.length).toBe(0);
});
