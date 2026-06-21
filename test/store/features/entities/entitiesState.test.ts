/* eslint-disable camelcase */
import reducer, {
  initialState,
} from "../../../../src/store/features/entities/entitiesState";
import { EntitiesState } from "../../../../src/shared/lib/entities/entitiesTypes";
import projectActions from "../../../../src/store/features/project/projectActions";
import {
  dummySceneNormalized,
  dummyBackground,
  dummySpriteSheet,
  dummyCompressedSceneResource,
  dummyCompressedProjectResources,
  dummyCompressedBackgroundResource,
} from "../../../dummydata";
import entitiesActions from "../../../../src/store/features/entities/entitiesActions";
import {
  CompressedBackgroundResourceAsset,
  CompressedProjectResources,
  SpriteResourceAsset,
} from "shared/lib/resources/types";
import { v4 as uuid } from "uuid";

jest.mock("uuid");

const mockUuid = uuid as jest.MockedFunction<typeof uuid>;

beforeEach(() => {
  let id = 0;

  mockUuid.mockImplementation(() => {
    id += 1;
    return `uuid-${id}`;
  });
});

afterEach(() => {
  mockUuid.mockReset();
});

test("Should fix scene widths if backgrounds has been removed since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "missingbg",
        width: 20,
        height: 18,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
      path: "project.gbsproj",
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
    "project.gbsproj",
  );
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(32);
  expect(newState.scenes.entities["scene1"]?.height).toBe(32);
});

test("Should fix scene widths if backgrounds have changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyCompressedBackgroundResource,
        id: "bg1",
        width: 64,
        height: 40,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
      path: "project.gbsproj",
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
    "project.gbsproj",
  );
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(64);
  expect(newState.scenes.entities["scene1"]?.height).toBe(40);
});

test("Should keep scene widths if backgrounds have NOT changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyCompressedBackgroundResource,
        id: "bg1",
        width: 20,
        height: 18,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
      path: "project.gbsproj",
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
    "project.gbsproj",
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
          ...dummySceneNormalized,
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
          ...dummyBackground,
          id: "bg1",
          width: 20,
          height: 18,
        },
      },
      ids: ["bg1"],
    },
  };

  const loadBackground: CompressedBackgroundResourceAsset = {
    ...dummyCompressedBackgroundResource,
    _v: 0,
    inode: "0",
    id: "bg1",
    width: 64,
    height: 40,
  };

  const action = entitiesActions.loadBackground({
    data: loadBackground,
  });

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

  const loadBackground: CompressedBackgroundResourceAsset = {
    ...dummyCompressedBackgroundResource,
    _v: 0,
    inode: "0",
    id: "bg1",
    width: 20,
    height: 18,
  };

  const action = entitiesActions.loadBackground({
    data: loadBackground,
  });

  expect(state.backgrounds.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.backgrounds.ids.length).toBe(1);
  expect(newState.backgrounds.entities["bg1"]?.width).toBe(20);
  expect(newState.backgrounds.entities["bg1"]?.height).toBe(18);
});

test("Should add new sprite sheet if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadSpriteSheet: SpriteResourceAsset = {
    ...dummySpriteSheet,
    id: "sprite1",
    _resourceType: "sprite",
    states: [],
  };

  const action = entitiesActions.loadSprite({
    data: loadSpriteSheet,
  });

  expect(state.spriteSheets.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.spriteSheets.ids.length).toBe(1);
});

test("Should update sprite sheet if modified while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    spriteSheets: {
      entities: {
        sprite1: {
          ...dummySpriteSheet,
          id: "sprite1",
          filename: "sprite1.png",
        },
      },
      ids: ["sprite1"],
    },
  };

  const loadSpriteSheet: SpriteResourceAsset = {
    ...dummySpriteSheet,
    id: "sprite1",
    filename: "sprite1.png",
    _resourceType: "sprite",
    states: [],
  };

  const action = entitiesActions.loadSprite({
    data: loadSpriteSheet,
  });

  expect(state.spriteSheets.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.spriteSheets.ids.length).toBe(1);
});
