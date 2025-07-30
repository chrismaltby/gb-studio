/* eslint-disable camelcase */
import reducer, {
  initialState,
} from "../../../../src/store/features/entities/entitiesState";
import {
  EntitiesState,
  MetaspriteTile,
} from "../../../../src/shared/lib/entities/entitiesTypes";
import actions from "../../../../src/store/features/entities/entitiesActions";
import projectActions from "../../../../src/store/features/project/projectActions";
import {
  dummySceneNormalized,
  dummyBackground,
  dummySpriteSheet,
  dummyMusic,
  dummyActorNormalized,
  dummyTriggerNormalized,
  dummyPalette,
  dummyCompressedSceneResource,
  dummyCompressedProjectResources,
  dummyCompressedBackgroundResource,
  dummyActorPrefabNormalized,
  dummyVariable,
  dummyTriggerPrefabNormalized,
  dummyCustomEventNormalized,
  dummyMusicResource,
} from "../../../dummydata";
import { DMG_PALETTE } from "../../../../src/consts";
import entitiesActions from "../../../../src/store/features/entities/entitiesActions";
import {
  CompressedBackgroundResourceAsset,
  CompressedProjectResources,
  MusicResourceAsset,
  SpriteResourceAsset,
} from "shared/lib/resources/types";
import { v4 as uuid } from "uuid";

jest.mock("uuid");

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

test("Should remove backgrounds that are deleted while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          filename: "bg1.png",
        },
      },
      ids: ["bg1"],
    },
  };

  const action = entitiesActions.removedAsset({
    assetType: "backgrounds",
    asset: {
      filename: "bg1.png",
      plugin: undefined,
    },
  });

  expect(state.backgrounds.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.backgrounds.ids.length).toBe(0);
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

test("Should remove sprite sheets that are deleted while project is open", () => {
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

  const action = entitiesActions.removedAsset({
    assetType: "sprites",
    asset: {
      filename: "sprite1.png",
      plugin: undefined,
    },
  });

  expect(state.spriteSheets.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.spriteSheets.ids.length).toBe(0);
});

test("Should add new music track if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadMusic: MusicResourceAsset = {
    ...dummyMusicResource,
    id: "track1",
    filename: "track1.mod",
    inode: "50",
    _v: 0,
  };

  const action = entitiesActions.loadMusic({
    data: loadMusic,
  });

  expect(state.music.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.music.ids.length).toBe(1);
  expect(newState.music.entities["track1"]?.filename).toBe("track1.mod");
});

test("Should update music track if modified while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    music: {
      entities: {
        track1: {
          ...dummyMusic,
          id: "track1",
          filename: "track1.mod",
          _v: 0,
        },
      },
      ids: ["track1"],
    },
  };

  const loadMusic: MusicResourceAsset = {
    ...dummyMusicResource,
    id: "track1",
    filename: "track1.mod",
    inode: "0",
    _v: 1,
  };

  const action = entitiesActions.loadMusic({
    data: loadMusic,
  });

  expect(state.music.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.music.ids.length).toBe(1);
  expect(newState.music.entities["track1"]?._v).toBe(1);
});

test("Should remove music tracks that are deleted while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    music: {
      entities: {
        track1: {
          ...dummyMusic,
          id: "track1",
          filename: "track1.mod",
        },
      },
      ids: ["track1"],
    },
  };

  const action = entitiesActions.removedAsset({
    assetType: "music",
    asset: {
      filename: "track1.mod",
      plugin: undefined,
    },
  });

  expect(state.music.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.music.ids.length).toBe(0);
});

test("Should be able to add a scene", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addScene({
    x: 110,
    y: 220,
  });

  expect(state.scenes.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.scenes.ids.length).toBe(1);
  expect(newState.scenes.entities[newState.scenes.ids[0]]?.x).toBe(110);
  expect(newState.scenes.entities[newState.scenes.ids[0]]?.y).toBe(220);
});

test("Should be able to move a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
  };

  const action = actions.moveScene({
    sceneId: "scene1",
    x: 310,
    y: 520,
    additionalSceneIds: [],
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.x).toBe(310);
  expect(newState.scenes.entities["scene1"]?.y).toBe(520);
});

test("Should update scene dimensions to match new background", () => {
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
          collisions: [1, 2, 3],
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
        bg2: {
          ...dummyBackground,
          id: "bg2",
          width: 32,
          height: 28,
        },
      },
      ids: ["bg1", "bg2"],
    },
  };

  const action = actions.editScene({
    sceneId: "scene1",
    changes: {
      backgroundId: "bg2",
    },
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toEqual(32);
  expect(newState.scenes.entities["scene1"]?.height).toEqual(28);
});

test("Should discard collisions if switched to use different background of different width", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          actors: [],
          triggers: [],
          collisions: [1, 2, 3],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 3,
        },
        bg2: {
          ...dummyBackground,
          id: "bg2",
          width: 4,
          height: 2,
        },
      },
      ids: ["bg1", "bg2"],
    },
  };

  const action = actions.editScene({
    sceneId: "scene1",
    changes: {
      backgroundId: "bg2",
    },
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual([
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);
});

test("Should be able to remove a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
  };

  const action = actions.removeScene({
    sceneId: "scene1",
  });

  expect(state.scenes.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.scenes.ids.length).toBe(0);
});

test("Should be able to flood fill collisions", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 10,
          height: 5,
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
          width: 10,
          height: 5,
        },
      },
      ids: ["bg1"],
    },
  };

  const action = actions.paintCollision({
    sceneId: "scene1",
    x: 0,
    y: 0,
    value: 2,
    brush: "fill",
    mask: 0x0F,
    drawLine: false,
    tileLookup: [],
  });

  const newState = reducer(state, action);

  const expectedCols = Array.from(Array(50)).map((_i) => 2);

  expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
});

test("Should be able to paint collisions", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 10,
          height: 5,
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
          width: 10,
          height: 5,
        },
      },
      ids: ["bg1"],
    },
  };

  const action = actions.paintCollision({
    sceneId: "scene1",
    x: 5,
    y: 0,
    value: 2,
    brush: "8px",
    mask: 0x0F,
    drawLine: false,
    tileLookup: [],
  });

  const newState = reducer(state, action);

  const expectedCols = Array.from(Array(50)).map((i, index) => {
    if (index === 5) {
      return 2;
    }
    return 0;
  });

  expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
});

test("Should be able to paint collision line", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 10,
          height: 5,
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
          width: 10,
          height: 5,
        },
      },
      ids: ["bg1"],
    },
  };

  const action = actions.paintCollision({
    sceneId: "scene1",
    x: 0,
    y: 0,
    endX: 5,
    endY: 5,
    value: 2,
    brush: "8px",
    mask: 0x0F,
    drawLine: true,
    tileLookup: [],
  });

  const newState = reducer(state, action);

  const expectedCols = Array.from(Array(50)).map((i, index) => {
    if (index % 10 === Math.floor(index / 10)) {
      return 2;
    }
    return 0;
  });

  expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
});

test("Should be able to set a variable's name", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.renameVariable({
    variableId: "1",
    name: "Var Name",
  });

  const newState = reducer(state, action);

  expect(newState.variables.entities["1"]?.name).toBe("Var Name");
});

test("Should be able to delete a variable name by setting blank value", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      entities: {
        "1": {
          id: "1",
          name: "Var Name",
          symbol: "VAR_1",
        },
      },
      ids: ["1"],
    },
  };

  const action = actions.renameVariable({
    variableId: "1",
    name: "",
  });

  expect(state.variables.entities["1"]).toBeTruthy();

  const newState = reducer(state, action);

  expect(newState.variables.entities["1"]).toBeUndefined();
});

test("Should be able to add an actor to a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
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

  const action = actions.addActor({ sceneId: "scene1", x: 2, y: 4 });

  const newState = reducer(state, action);

  const newActorId = action.payload.actorId;

  expect(state.actors.ids.length).toBe(0);
  expect(newState.actors.ids.length).toBe(1);
  expect(newState.scenes.entities["scene1"]?.actors).toEqual([newActorId]);
  expect(newState.actors.entities[newActorId]?.x).toBe(2);
  expect(newState.actors.entities[newActorId]?.y).toBe(4);
  expect(newState.actors.entities[newActorId]?.spriteSheetId).toBe("sprite1");
});

test("Should be able to add an actor to a scene with default values and variables", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
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

  const action = actions.addActor({
    sceneId: "scene1",
    x: 2,
    y: 4,
    defaults: {
      id: "clipboard_id",
      name: "Clipboard Actor Name",
    },
    variables: [
      {
        id: "clipboard_id__L0",
        name: "Clipboard Variable Name",
        symbol: "VAR_clipboard_id__L0",
      },
    ],
  });

  const newState = reducer(state, action);

  const newActorId = action.payload.actorId;

  expect(newState.scenes.entities["scene1"]?.actors).toEqual([newActorId]);
  expect(newState.actors.entities[newActorId]?.name).toBe(
    "Clipboard Actor Name",
  );
  expect(newState.variables.entities[`${newActorId}__L0`]?.name).toBe(
    "Clipboard Variable Name",
  );
});

test("Should be able to move an actor with a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 5,
          y: 2,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.moveActor({
    actorId: "actor1",
    sceneId: "scene1",
    newSceneId: "scene1",
    x: 1,
    y: 3,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.actors).toEqual(["actor1"]);
  expect(newState.actors.entities["actor1"]?.x).toBe(1);
  expect(newState.actors.entities["actor1"]?.y).toBe(3);
});

test("Should be able to move an actor between scenes", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: ["actor1"],
          triggers: [],
        },
        scene2: {
          ...dummySceneNormalized,
          id: "scene2",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1", "scene2"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 5,
          y: 2,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.moveActor({
    actorId: "actor1",
    sceneId: "scene1",
    newSceneId: "scene2",
    x: 4,
    y: 1,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.actors).toEqual([]);
  expect(newState.scenes.entities["scene2"]?.actors).toEqual(["actor1"]);
  expect(newState.actors.entities["actor1"]?.x).toBe(4);
  expect(newState.actors.entities["actor1"]?.y).toBe(1);
});

test("Should be able to add a trigger to a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
  };

  const action = actions.addTrigger({
    sceneId: "scene1",
    x: 1,
    y: 3,
    width: 4,
    height: 2,
  });

  const newState = reducer(state, action);

  const newTriggerId = action.payload.triggerId;

  expect(state.triggers.ids.length).toBe(0);
  expect(newState.triggers.ids.length).toBe(1);
  expect(newState.scenes.entities["scene1"]?.triggers).toEqual([newTriggerId]);
  expect(newState.triggers.entities[newTriggerId]?.x).toBe(1);
  expect(newState.triggers.entities[newTriggerId]?.y).toBe(3);
  expect(newState.triggers.entities[newTriggerId]?.width).toBe(4);
  expect(newState.triggers.entities[newTriggerId]?.height).toBe(2);
});

test("Should be able to add a trigger to a scene with defaults", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
  };

  const action = actions.addTrigger({
    sceneId: "scene1",
    x: 1,
    y: 3,
    width: 4,
    height: 2,
    defaults: {
      id: "trigger1",
      name: "Clipboard Trigger",
    },
  });

  const newState = reducer(state, action);

  const newTriggerId = action.payload.triggerId;

  expect(newState.triggers.ids.length).toBe(1);
  expect(newState.triggers.entities[newTriggerId]?.id).not.toBe("trigger1");
});

test("Should be able to move a trigger with a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 5,
          y: 2,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.moveTrigger({
    triggerId: "trigger1",
    sceneId: "scene1",
    newSceneId: "scene1",
    x: 1,
    y: 3,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.triggers).toEqual(["trigger1"]);
  expect(newState.triggers.entities["trigger1"]?.x).toBe(1);
  expect(newState.triggers.entities["trigger1"]?.y).toBe(3);
});

test("Should be able to move a trigger between scenes", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: ["trigger1"],
        },
        scene2: {
          ...dummySceneNormalized,
          id: "scene2",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1", "scene2"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 5,
          y: 2,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.moveTrigger({
    triggerId: "trigger1",
    sceneId: "scene1",
    newSceneId: "scene2",
    x: 4,
    y: 1,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.triggers).toEqual([]);
  expect(newState.scenes.entities["scene2"]?.triggers).toEqual(["trigger1"]);
  expect(newState.triggers.entities["trigger1"]?.x).toBe(4);
  expect(newState.triggers.entities["trigger1"]?.y).toBe(1);
});

test("Should be able to remove an actor by id", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.removeActor({
    actorId: "actor1",
    sceneId: "scene1",
  });

  const newState = reducer(state, action);
  expect(newState.actors.ids.length).toBe(0);
  expect(newState.actors.entities["actor1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.actors?.length).toBe(0);
});

test("Should be able to remove an actor at location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 5,
          y: 6,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.removeActorAt({
    sceneId: "scene1",
    x: 5,
    y: 6,
  });

  const newState = reducer(state, action);
  expect(newState.actors.ids.length).toBe(0);
  expect(newState.actors.entities["actor1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.actors?.length).toBe(0);
});

test("Should not remove actor outside of delete location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 10,
          y: 6,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.removeActorAt({
    sceneId: "scene1",
    x: 5,
    y: 6,
  });

  const newState = reducer(state, action);
  expect(newState.actors.ids.length).toBe(1);
  expect(newState.actors.entities["actor1"]).toBe(state.actors.entities.actor1);
  expect(newState.scenes.entities["scene1"]?.actors?.length).toBe(1);
});

test("Should be able to remove a trigger by id", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.removeTrigger({
    triggerId: "trigger1",
    sceneId: "scene1",
  });

  const newState = reducer(state, action);
  expect(newState.triggers.ids.length).toBe(0);
  expect(newState.triggers.entities["trigger1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.triggers?.length).toBe(0);
});

test("Should be able to remove a trigger at location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 2,
          y: 3,
          width: 5,
          height: 1,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.removeTriggerAt({
    sceneId: "scene1",
    x: 4,
    y: 3,
  });

  const newState = reducer(state, action);
  expect(newState.triggers.ids.length).toBe(0);
  expect(newState.triggers.entities["trigger1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.triggers?.length).toBe(0);
});

test("Should not remove trigger outside of delete location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 2,
          y: 3,
          width: 5,
          height: 1,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.removeTriggerAt({
    sceneId: "scene1",
    x: 4,
    y: 4,
  });

  const newState = reducer(state, action);
  expect(newState.triggers.ids.length).toBe(1);
  expect(newState.triggers.entities["trigger1"]).toBe(
    state.triggers.entities.trigger1,
  );
  expect(newState.scenes.entities["scene1"]?.triggers?.length).toBe(1);
});

test("Should be able to add a palette", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addPalette();

  expect(state.palettes.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.palettes.ids.length).toBe(1);
  expect(newState.palettes.entities[action.payload.paletteId]?.id).toBe(
    action.payload.paletteId,
  );
  expect(newState.palettes.entities[action.payload.paletteId]?.colors).toEqual(
    DMG_PALETTE.colors,
  );
});

test("Should be able to edit a palette", () => {
  const state: EntitiesState = {
    ...initialState,
    palettes: {
      entities: {
        palette1: {
          ...dummyPalette,
          id: "palette1",
        },
      },
      ids: ["palette1"],
    },
  };

  const action = actions.editPalette({
    paletteId: "palette1",
    changes: {
      colors: ["ff0000", "00ff00", "0000ff", "ffffff"],
    },
  });

  const newState = reducer(state, action);
  expect(newState.palettes.entities[action.payload.paletteId]?.colors).toEqual([
    "ff0000",
    "00ff00",
    "0000ff",
    "ffffff",
  ]);
});

test("Should be able to remove a palette", () => {
  const state: EntitiesState = {
    ...initialState,
    palettes: {
      entities: {
        palette1: {
          ...dummyPalette,
          id: "palette1",
        },
      },
      ids: ["palette1"],
    },
  };

  const action = actions.removePalette({
    paletteId: "palette1",
  });

  expect(state.palettes.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.palettes.ids.length).toBe(0);
});

test("Should be able to add custom event", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addCustomEvent();

  expect(state.customEvents.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.customEvents.ids.length).toBe(1);
  expect(
    newState.customEvents.entities[action.payload.customEventId]?.name,
  ).toBe("CUSTOM_EVENT 1");
  expect(
    newState.customEvents.entities[action.payload.customEventId]?.script,
  ).toEqual([]);
});

test("Should be able to add flags to existing named variable ", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["11"],
      entities: {
        "11": {
          id: "11",
          name: "Powers",
          symbol: "var_powers",
        },
      },
    },
  };

  const action = actions.renameVariableFlags({
    variableId: "11",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["11"]).toMatchObject({
    id: "11",
    name: "Powers",
    symbol: "var_powers",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should be able to add flags to unnamed variable ", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {},
    },
  };

  const action = actions.renameVariableFlags({
    variableId: "12",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["12"]).toMatchObject({
    id: "12",
    name: "",
    symbol: "",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should remove variable when name is empty and doesn't have flags ", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {
        "13": {
          id: "13",
          name: "Powers",
          symbol: "var_powers",
        },
      },
    },
  };
  const action = actions.renameVariable({
    variableId: "13",
    name: "",
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["13"]).toBeUndefined();
});

test("Should not remove variable when name is empty but has named flags", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: ["14"],
      entities: {
        "14": {
          id: "14",
          name: "Powers",
          symbol: "var_powers",
          flags: {
            flag1: "Crouch Ball",
            flag2: "Cannon",
            flag3: "Big Beam",
            flag4: "Spin Jump",
          },
        },
      },
    },
  };
  const action = actions.renameVariable({
    variableId: "14",
    name: "",
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["14"]).toMatchObject({
    id: "14",
    name: "",
    symbol: "",
    flags: {
      flag1: "Crouch Ball",
      flag2: "Cannon",
      flag3: "Big Beam",
      flag4: "Spin Jump",
    },
  });
});

test("Should remove variable when all flags removed and was unnamed", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {
        "15": {
          id: "15",
          name: "",
          symbol: "",
          flags: {
            flag1: "Crouch Ball",
            flag2: "Cannon",
            flag3: "Big Beam",
            flag4: "Spin Jump",
          },
        },
      },
    },
  };
  const action = actions.renameVariableFlags({
    variableId: "15",
    flags: {},
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["15"]).toBeUndefined();
});

test("Should not remove variable when all flags removed but variable was named", () => {
  const state: EntitiesState = {
    ...initialState,
    variables: {
      ids: [],
      entities: {
        "16": {
          id: "16",
          name: "Powers",
          symbol: "var_powers",
          flags: {
            flag1: "Crouch Ball",
            flag2: "Cannon",
            flag3: "Big Beam",
            flag4: "Spin Jump",
          },
        },
      },
    },
  };
  const action = actions.renameVariableFlags({
    variableId: "16",
    flags: {},
  });

  const newState = reducer(state, action);
  expect(newState.variables.entities["16"]).toMatchObject({
    id: "16",
    name: "Powers",
    symbol: "var_powers",
    flags: {},
  });
});

describe("Actor Prefabs", () => {
  describe("unpackActorPrefab", () => {
    test("Should unpack actor prefab when prefab exists", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
              spriteSheetId: "sprite1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
              spriteSheetId: "sprite2",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabId).toBe("");
      expect(newState.actors.entities["actor1"]?.spriteSheetId).toEqual(
        "sprite2",
      );
    });

    test("Should not unpack actor prefab when actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not unpack actor prefab when prefab does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "nonexistent_prefab",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should unpack actor prefab and duplicate local variables", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            prefab1__L0: {
              ...dummyVariable,
              id: "prefab1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["prefab1__L0"],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["actor1__L0"]).toBeTruthy();
      expect(newState.variables.entities["actor1__L0"]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["prefab1__L0"]).toBeTruthy();
      expect(newState.variables.entities["prefab1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });

    test("Should remove unused local variables when unpacking prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            actor1__L0: {
              ...dummyVariable,
              id: "actor1__L0",
              name: "Local Variable 0",
            },
            actor1__L1: {
              ...dummyVariable,
              id: "actor1__L1",
              name: "Local Variable 1",
            },
            prefab1__L2: {
              ...dummyVariable,
              id: "prefab1__L2",
              name: "Local Variable 2",
            },
          },
          ids: ["actor1__L0", "actor1__L1"],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["actor1__L0"]).toBeUndefined();
      expect(newState.variables.entities["actor1__L1"]).toBeUndefined();
      expect(newState.variables.entities["actor1__L2"]).toBeTruthy();
      expect(newState.variables.entities["actor1__L2"]?.name).toBe(
        "Local Variable 2",
      );
    });

    test("Should keep unpack script when unpacking actor prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.actors.entities["actor1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "bar",
          hello: "world",
        },
        children: {},
      });
    });

    test("Should keep script overrides when unpacking actor prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
              prefabScriptOverrides: {
                script1: {
                  id: "script1",
                  args: {
                    foo: "baz",
                  },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.actors.entities["actor1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "baz",
          hello: "world",
        },
        children: {},
      });
    });
  });

  describe("convertActorToPrefab", () => {
    let uuidCount = 0;
    (uuid as jest.Mock).mockImplementation(() => "uuid_" + uuidCount++);

    test("Should convert actor to prefab and update actor's prefabId", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "",
              spriteSheetId: "sprite1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      const newPrefabId = newState.actors.entities["actor1"]?.prefabId ?? "";
      expect(newPrefabId).toBeTruthy();
      expect(newState.actorPrefabs.entities[newPrefabId]).toBeTruthy();
      expect(
        newState.actorPrefabs.entities[newPrefabId]?.spriteSheetId,
      ).toEqual("sprite1");
    });

    test("Should not convert actor to prefab if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        actorPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not convert actor to prefab if actor is already a prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actorPrefabs.ids.length).toBe(1);
      expect(newState.actors.entities["actor1"]?.prefabId).toBe("prefab1");
    });

    test("Should duplicate local variables when converting actor to prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {
            actor1__L0: {
              ...dummyVariable,
              id: "actor1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["actor1__L0"],
        },
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      const newPrefabId = newState.actors.entities["actor1"]?.prefabId;
      expect(newState.variables.entities[`${newPrefabId}__L0`]).toBeTruthy();
      expect(newState.variables.entities[`${newPrefabId}__L0`]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["actor1__L0"]).toBeTruthy();
      expect(newState.variables.entities["actor1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });
  });

  describe("editActorPrefabScriptEventOverride", () => {
    test("Should add a new script event override if none exists", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event1");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides?.event1.args,
      ).toEqual({
        arg1: "value1",
      });
    });

    test("Should update an existing script event override with new args", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "oldValue" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
        args: { arg1: "newValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides?.event1.args,
      ).toEqual({
        arg1: "newValue",
      });
    });

    test("Should add new args to an existing script event override", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
        args: { arg2: "value2" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides?.event1.args,
      ).toEqual({
        arg1: "value1",
        arg2: "value2",
      });
    });

    test("Should not modify the state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "nonexistent_actor",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not modify the state if script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "nonexistent_event",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });
  });

  describe("revertActorPrefabScriptEventOverrides", () => {
    test("Should clear all script event overrides for an actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverrides({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when actor has no overrides initially", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });
  });

  describe("revertActorPrefabScriptEventOverride", () => {
    test("Should remove a specific script event override for an actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "nonexistent_actor",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when specific script event override does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
    });

    test("Should remove the override and leave others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
                event3: {
                  id: "event3",
                  args: { arg3: "value3" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event2",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {
          event1: { id: "event1", args: { arg1: "value1" } },
          event3: { id: "event3", args: { arg3: "value3" } },
        },
      );
    });
  });

  describe("applyActorPrefabScriptEventOverrides", () => {
    test("Should apply script event overrides and clear them from the actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "newValue2",
        arg4: "value4",
      });
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });

    test("Should apply overrides correctly even if there are no existing args", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
      });
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });
  });

  describe("applyActorPrefabScriptEventOverride", () => {
    test("Should apply a specific script event override and remove it from the actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "nonexistent_actor",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "nonexistentEvent",
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("nonexistentEvent");
    });

    test("Should apply override correctly and remove it, leaving others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "oldValue2",
        arg4: "value4",
      });
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {
          event2: { id: "event2", args: { arg2: "newValue2" } },
        },
      );
    });
  });
});

describe("Trigger Prefabs", () => {
  describe("unpackTriggerPrefab", () => {
    test("Should keep unpack script when unpacking trigger prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.triggers.entities["trigger1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.triggers.entities["trigger1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "bar",
          hello: "world",
        },
        children: {},
      });
    });

    test("Should not unpack trigger prefab when trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not unpack trigger prefab when prefab does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "nonexistent_prefab",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should unpack trigger prefab and duplicate local variables", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            prefab1__L0: {
              ...dummyVariable,
              id: "prefab1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["prefab1__L0"],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["trigger1__L0"]).toBeTruthy();
      expect(newState.variables.entities["trigger1__L0"]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["prefab1__L0"]).toBeTruthy();
      expect(newState.variables.entities["prefab1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });

    test("Should remove unused local variables when unpacking prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            trigger1__L0: {
              ...dummyVariable,
              id: "trigger1__L0",
              name: "Local Variable 0",
            },
            trigger1__L1: {
              ...dummyVariable,
              id: "trigger1__L1",
              name: "Local Variable 1",
            },
            prefab1__L2: {
              ...dummyVariable,
              id: "prefab1__L2",
              name: "Local Variable 2",
            },
          },
          ids: ["trigger1__L0", "trigger1__L1"],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["trigger1__L0"]).toBeUndefined();
      expect(newState.variables.entities["trigger1__L1"]).toBeUndefined();
      expect(newState.variables.entities["trigger1__L2"]).toBeTruthy();
      expect(newState.variables.entities["trigger1__L2"]?.name).toBe(
        "Local Variable 2",
      );
    });

    test("Should keep script overrides when unpacking trigger prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
              prefabScriptOverrides: {
                script1: {
                  id: "script1",
                  args: {
                    foo: "baz",
                  },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.triggers.entities["trigger1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.triggers.entities["trigger1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "baz",
          hello: "world",
        },
        children: {},
      });
    });
  });

  describe("convertTriggerToPrefab", () => {
    let uuidCount = 0;
    (uuid as jest.Mock).mockImplementation(() => "uuid_" + uuidCount++);

    test("Should convert trigger to prefab and update trigger's prefabId", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      const newPrefabId =
        newState.triggers.entities["trigger1"]?.prefabId ?? "";
      expect(newPrefabId).toBeTruthy();
      expect(newState.triggerPrefabs.entities[newPrefabId]).toBeTruthy();
    });

    test("Should not convert trigger to prefab if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not convert trigger to prefab if trigger is already a prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.triggerPrefabs.ids.length).toBe(1);
      expect(newState.triggers.entities["trigger1"]?.prefabId).toBe("prefab1");
    });

    test("Should duplicate local variables when converting trigger to prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {
            trigger1__L0: {
              ...dummyVariable,
              id: "trigger1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["trigger1__L0"],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      const newPrefabId = newState.triggers.entities["trigger1"]?.prefabId;
      expect(newState.variables.entities[`${newPrefabId}__L0`]).toBeTruthy();
      expect(newState.variables.entities[`${newPrefabId}__L0`]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["trigger1__L0"]).toBeTruthy();
      expect(newState.variables.entities["trigger1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });
  });

  describe("editTriggerPrefabScriptEventOverride", () => {
    test("Should add a new script event override if none exists", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event1");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides?.event1
          .args,
      ).toEqual({
        arg1: "value1",
      });
    });

    test("Should update an existing script event override with new args", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "oldValue" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
        args: { arg1: "newValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides?.event1
          .args,
      ).toEqual({
        arg1: "newValue",
      });
    });

    test("Should add new args to an existing script event override", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
        args: { arg2: "value2" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides?.event1
          .args,
      ).toEqual({
        arg1: "value1",
        arg2: "value2",
      });
    });

    test("Should not modify the state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "nonexistent_trigger",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not modify the state if script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "nonexistent_event",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });
  });

  describe("revertTriggerPrefabScriptEventOverrides", () => {
    test("Should clear all script event overrides for an trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverrides({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when trigger has no overrides initially", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });
  });

  describe("revertTriggerPrefabScriptEventOverride", () => {
    test("Should remove a specific script event override for an trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "nonexistent_trigger",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when specific script event override does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
    });

    test("Should remove the override and leave others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
                event3: {
                  id: "event3",
                  args: { arg3: "value3" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event2",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({
        event1: { id: "event1", args: { arg1: "value1" } },
        event3: { id: "event3", args: { arg3: "value3" } },
      });
    });
  });

  describe("applyTriggerPrefabScriptEventOverrides", () => {
    test("Should apply script event overrides and clear them from the trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "newValue2",
        arg4: "value4",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });

    test("Should apply overrides correctly even if there are no existing args", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });
  });

  describe("applyTriggerPrefabScriptEventOverride", () => {
    test("Should apply a specific script event override and remove it from the trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "nonexistent_trigger",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "nonexistentEvent",
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("nonexistentEvent");
    });

    test("Should apply override correctly and remove it, leaving others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "oldValue2",
        arg4: "value4",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({
        event2: { id: "event2", args: { arg2: "newValue2" } },
      });
    });
  });
});

describe("Custom Events", () => {
  describe("removeCustomEvent", () => {
    test("Should remove a custom event and clear references when deleteReferences is false", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent3: {
              id: "scriptEvent3",
              command: "SOME_OTHER_EVENT",
              args: {},
            },
          },
          ids: ["scriptEvent1", "scriptEvent2", "scriptEvent3"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent1"]?.id).toEqual(
        "scriptEvent1",
      );
      expect(newState.scriptEvents.entities["scriptEvent2"]?.id).toEqual(
        "scriptEvent2",
      );
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent3"]?.args).toEqual({});
    });

    test("Should remove a custom event and delete references when deleteReferences is true", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent3: {
              id: "scriptEvent3",
              command: "SOME_OTHER_EVENT",
              args: {},
            },
          },
          ids: ["scriptEvent1", "scriptEvent2", "scriptEvent3"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: true,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent2"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent3"]).toBeDefined();
    });

    test("Should handle case when custom event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
          },
          ids: ["scriptEvent1", "scriptEvent2"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "nonexistent_custom_event",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeDefined();
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBe("customEvent1");
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBe("customEvent1");
    });

    test("Should not modify script events that do not reference the removed custom event", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "someOtherCustomEvent" },
            },
          },
          ids: ["scriptEvent1", "scriptEvent2"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBe("someOtherCustomEvent");
    });
  });
});

describe("Script Event Presets", () => {
  describe("applyScriptEventPresetChanges", () => {
    test("Should update script event arguments based on preset changes", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_SOME_COMMAND",
              args: {
                __presetId: "preset1",
                someArg: "initialValue",
                otherArg: "toRemain",
              },
            },
          },
          ids: ["scriptEvent1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.someArg,
      ).toBe("newValue");
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.otherArg,
      ).toBe("toRemain");
    });

    test("Should not update script event arguments if preset ID does not match", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_SOME_COMMAND",
              args: {
                __presetId: "preset1",
                someArg: "initialValue",
              },
            },
          },
          ids: ["scriptEvent1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset2", // Different preset ID
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.someArg,
      ).toBe("initialValue");
    });

    test("Should update actor prefab script overrides based on preset changes", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                override1: {
                  id: "event1",
                  args: {
                    __presetId: "preset1",
                    someArg: "initialValue",
                  },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides.override1.args
          ?.someArg,
      ).toBe("newValue");
    });

    test("Should update trigger prefab script overrides based on preset changes", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                override1: {
                  id: "event1",
                  args: {
                    __presetId: "preset1",
                    someArg: "initialValue",
                  },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides.override1
          .args?.someArg,
      ).toBe("newValue");
    });

    test("Should only update arguments that match previous values", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_SOME_COMMAND",
              args: {
                __presetId: "preset1",
                someArg: "unchangedValue",
                otherArg: "initialValue",
              },
            },
          },
          ids: ["scriptEvent1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { otherArg: "newValue" },
        previousArgs: { otherArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.someArg,
      ).toBe("unchangedValue");
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.otherArg,
      ).toBe("newValue");
    });

    test("Should handle cases where no script events, actors, or triggers exist", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {},
          ids: [],
        },
        actors: {
          entities: {},
          ids: [],
        },
        triggers: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      // No updates should be made since no entities exist
      expect(newState.scriptEvents.entities).toEqual({});
      expect(newState.actors.entities).toEqual({});
      expect(newState.triggers.entities).toEqual({});
    });
  });
});

describe("Metasprites", () => {
  let state: EntitiesState;

  beforeEach(() => {
    // Initialize a default state before each test
    state = {
      metasprites: {
        entities: {},
        ids: [],
      },
      metaspriteTiles: {
        entities: {},
        ids: [],
      },
      spriteAnimations: {
        entities: {},
        ids: [],
      },
    } as unknown as EntitiesState;

    jest.resetAllMocks();
  });

  describe("addMetasprite", () => {
    test("should add a new metasprite after the specified metasprite ID", () => {
      const spriteAnimationId = "animation_1";
      const afterMetaspriteId = "metasprite_1";
      const newMetaspriteId = "metasprite_2";

      // Mock uuid to return a specific ID
      (uuid as jest.Mock).mockReturnValue(newMetaspriteId);

      // Set up initial state
      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [afterMetaspriteId],
      };

      const action = entitiesActions.addMetasprite({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        afterMetaspriteId,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[newMetaspriteId]).toEqual({
        id: newMetaspriteId,
        tiles: [],
      });
      expect(
        newState.spriteAnimations.entities[spriteAnimationId].frames,
      ).toEqual([afterMetaspriteId, newMetaspriteId]);
    });

    test("should add a new metasprite at the end if afterMetaspriteId is not found", () => {
      const spriteAnimationId = "animation_1";
      const afterMetaspriteId = "non_existing_id";
      const newMetaspriteId = "metasprite_2";

      // Mock uuid to return a specific ID
      (uuid as jest.Mock).mockReturnValue(newMetaspriteId);

      // Set up initial state
      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: ["metasprite_1"],
      };

      const action = entitiesActions.addMetasprite({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        afterMetaspriteId,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[newMetaspriteId]).toEqual({
        id: newMetaspriteId,
        tiles: [],
      });
      expect(
        newState.spriteAnimations.entities[spriteAnimationId].frames,
      ).toEqual(["metasprite_1", newMetaspriteId]);
    });

    test("should do nothing if spriteAnimation does not exist", () => {
      const newMetaspriteId = "metasprite_2";

      // Mock uuid to return a specific ID
      (uuid as jest.Mock).mockReturnValue(newMetaspriteId);

      const action = entitiesActions.addMetasprite({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId: "non_existing_animation",
        afterMetaspriteId: "metasprite_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });

  describe("cloneMetasprites", () => {
    test("should clone metasprites and insert them after the originals", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteId1 = "metasprite_1";
      const metaspriteId2 = "metasprite_2";
      const newMetaspriteId1 = "new_metasprite_1";
      const newMetaspriteId2 = "new_metasprite_2";

      let uuidCount = 0;

      // Mock uuid to return specific IDs in sequence
      (uuid as jest.Mock)
        .mockReturnValueOnce(newMetaspriteId1)
        .mockReturnValueOnce(newMetaspriteId2)
        .mockImplementation(() => "uuid_" + uuidCount++);

      // Set up initial state
      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [metaspriteId1, metaspriteId2],
      };

      state.metasprites.entities[metaspriteId1] = {
        id: metaspriteId1,
        tiles: ["tile_1"],
      };

      state.metasprites.entities[metaspriteId2] = {
        id: metaspriteId2,
        tiles: ["tile_2"],
      };

      state.metaspriteTiles.entities["tile_1"] = {
        id: "tile_1",
        x: 0,
        y: 0,
      } as MetaspriteTile;

      state.metaspriteTiles.entities["tile_2"] = {
        id: "tile_2",
        x: 1,
        y: 1,
      } as MetaspriteTile;

      const action = entitiesActions.cloneMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        metaspriteIds: [metaspriteId1, metaspriteId2],
      });

      const newState = reducer(state, action);

      // Check if new metasprites are added
      expect(newState.metasprites.entities[newMetaspriteId1]).toBeDefined();
      expect(newState.metasprites.entities[newMetaspriteId2]).toBeDefined();

      // Check if new tiles are created
      const newTiles = Object.values(newState.metaspriteTiles.entities).filter(
        (tile) => tile.id !== "tile_1" && tile.id !== "tile_2",
      );
      expect(newTiles.length).toBe(2);

      // Check if frames are updated correctly
      expect(
        newState.spriteAnimations.entities[spriteAnimationId].frames,
      ).toEqual([
        metaspriteId1,
        metaspriteId2,
        newMetaspriteId1,
        newMetaspriteId2,
      ]);
    });

    test("should skip cloning if spriteAnimation does not exist", () => {
      // Mock uuid
      (uuid as jest.Mock).mockReturnValue("new_metasprite_1");

      const action = entitiesActions.cloneMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId: "non_existing_animation",
        metaspriteIds: ["metasprite_1"],
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });

  describe("removeMetasprite", () => {
    test("should remove metasprite and its tiles if more than one frame exists", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteId = "metasprite_1";

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [metaspriteId, "metasprite_2"],
      };

      state.metasprites.entities[metaspriteId] = {
        id: metaspriteId,
        tiles: ["tile_1", "tile_2"],
      };

      const action = entitiesActions.removeMetasprite({
        metaspriteId,
        spriteAnimationId,
        spriteSheetId: "spriteSheet_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[metaspriteId]).toBeUndefined();
      expect(
        newState.spriteAnimations.entities[spriteAnimationId].frames,
      ).toEqual(["metasprite_2"]);
    });

    test("should clear tiles if it's the only frame in the animation", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteId = "metasprite_1";

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [metaspriteId],
      };

      state.metasprites.entities[metaspriteId] = {
        id: metaspriteId,
        tiles: ["tile_1", "tile_2"],
      };

      const action = entitiesActions.removeMetasprite({
        metaspriteId,
        spriteAnimationId,
        spriteSheetId: "spriteSheet_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[metaspriteId].tiles).toEqual([]);
      expect(
        newState.spriteAnimations.entities[spriteAnimationId].frames,
      ).toEqual([metaspriteId]);
    });

    test("should do nothing if spriteAnimation does not exist", () => {
      const action = entitiesActions.removeMetasprite({
        metaspriteId: "metasprite_1",
        spriteAnimationId: "non_existing_animation",
        spriteSheetId: "spriteSheet_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });

  describe("removeMetasprites", () => {
    test("should remove multiple metasprites if frames remain", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteIds = ["metasprite_1", "metasprite_2"];

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: ["metasprite_1", "metasprite_2", "metasprite_3"],
      };

      state.metasprites.entities["metasprite_1"] = {
        id: "metasprite_1",
        tiles: ["tile_1"],
      };

      state.metasprites.entities["metasprite_2"] = {
        id: "metasprite_2",
        tiles: ["tile_2"],
      };

      state.metasprites.entities["metasprite_3"] = {
        id: "metasprite_3",
        tiles: ["tile_3"],
      };

      const action = entitiesActions.removeMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        metaspriteIds,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities["metasprite_1"]).toBeUndefined();
      expect(newState.metasprites.entities["metasprite_2"]).toBeUndefined();
      expect(
        newState.spriteAnimations.entities[spriteAnimationId].frames,
      ).toEqual(["metasprite_3"]);
    });

    test("should clear tiles of the first frame if no frames remain after removal", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteIds = ["metasprite_1", "metasprite_2"];

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: ["metasprite_1", "metasprite_2"],
      };

      state.metasprites.entities["metasprite_1"] = {
        id: "metasprite_1",
        tiles: ["tile_1"],
      };

      state.metasprites.entities["metasprite_2"] = {
        id: "metasprite_2",
        tiles: ["tile_2"],
      };

      const action = entitiesActions.removeMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        metaspriteIds,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities["metasprite_2"]).toBeUndefined();
      expect(newState.metasprites.entities["metasprite_1"].tiles).toEqual([]);
      expect(
        newState.spriteAnimations.entities[spriteAnimationId].frames,
      ).toEqual(["metasprite_1"]);
    });

    test("should do nothing if spriteAnimation does not exist", () => {
      const action = entitiesActions.removeMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId: "non_existing_animation",
        metaspriteIds: ["metasprite_1"],
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });
});
