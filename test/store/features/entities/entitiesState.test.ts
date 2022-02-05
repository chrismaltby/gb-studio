import reducer, {
  initialState,
} from "../../../../src/store/features/entities/entitiesState";
import {
  EntitiesState,
  Background,
  SpriteSheet,
  Music,
} from "../../../../src/store/features/entities/entitiesTypes";
import actions from "../../../../src/store/features/entities/entitiesActions";
import projectActions, {
  ProjectData,
} from "../../../../src/store/features/project/projectActions";
import {
  dummyProjectData,
  dummyScene,
  dummySceneDenormalized,
  dummyBackground,
  dummySpriteSheet,
  dummyMusic,
  dummyActor,
  dummyTrigger,
  dummyPalette,
} from "../../../dummydata";
import { DMG_PALETTE } from "../../../../src/consts";

test("Should fix scene widths if backgrounds has been removed since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: ProjectData = {
    ...dummyProjectData,
    scenes: [
      {
        ...dummySceneDenormalized,
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
      modifiedSpriteIds: [],
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
    ...dummyProjectData,
    scenes: [
      {
        ...dummySceneDenormalized,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyBackground,
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
      modifiedSpriteIds: [],
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
    ...dummyProjectData,
    scenes: [
      {
        ...dummySceneDenormalized,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyBackground,
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
      modifiedSpriteIds: [],
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
          ...dummyScene,
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

  const loadBackground: Background = {
    ...dummyBackground,
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
    ...dummyBackground,
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
          ...dummyBackground,
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
      plugin: undefined,
    },
    "randomid",
    "bg1.png"
  );

  expect(state.backgrounds.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.backgrounds.ids.length).toBe(0);
});

test("Should add new sprite sheet if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadSpriteSheet: SpriteSheet = {
    ...dummySpriteSheet,
    id: "sprite1",
  };

  const action = projectActions.loadSprite.fulfilled(
    {
      data: loadSpriteSheet,
    },
    "randomid",
    "sprite1.png"
  );

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

  const loadSpriteSheet: SpriteSheet = {
    ...dummySpriteSheet,
    id: "sprite1",
    filename: "sprite1.png",
  };

  const action = projectActions.loadSprite.fulfilled(
    {
      data: loadSpriteSheet,
    },
    "randomid",
    "sprite1.png"
  );

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

  const action = projectActions.removeSprite.fulfilled(
    {
      filename: "sprite1.png",
      plugin: undefined,
    },
    "randomid",
    "sprite1.png"
  );

  expect(state.spriteSheets.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.spriteSheets.ids.length).toBe(0);
});

test("Should add new music track if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadMusic: Music = {
    ...dummyMusic,
    id: "track1",
    filename: "track1.mod",
  };

  const action = projectActions.loadMusic.fulfilled(
    {
      data: loadMusic,
    },
    "randomid",
    "track1.mod"
  );

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

  const loadMusic: Music = {
    ...dummyMusic,
    id: "track1",
    filename: "track1.mod",
    _v: 1,
  };

  const action = projectActions.loadMusic.fulfilled(
    {
      data: loadMusic,
    },
    "randomid",
    "track1.mod"
  );

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

  const action = projectActions.removeMusic.fulfilled(
    {
      filename: "track1.mod",
      plugin: undefined,
    },
    "randomid",
    "track1.mod"
  );

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
          ...dummyScene,
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
          ...dummyScene,
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
          ...dummyScene,
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
          ...dummyScene,
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
          ...dummyScene,
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
    isTileProp: false,
    drawLine: false,
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
          ...dummyScene,
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
    isTileProp: false,
    drawLine: false,
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
          ...dummyScene,
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
    isTileProp: false,
    drawLine: true,
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
          ...dummyScene,
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
          ...dummyScene,
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
    "Clipboard Actor Name"
  );
  expect(newState.variables.entities[`${newActorId}__L0`]?.name).toBe(
    "Clipboard Variable Name"
  );
});

test("Should be able to move an actor with a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
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
          ...dummyActor,
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
          ...dummyScene,
          id: "scene1",
          width: 10,
          height: 5,
          actors: ["actor1"],
          triggers: [],
        },
        scene2: {
          ...dummyScene,
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
          ...dummyActor,
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
          ...dummyScene,
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
          ...dummyScene,
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
          ...dummyScene,
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
          ...dummyTrigger,
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
          ...dummyScene,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: ["trigger1"],
        },
        scene2: {
          ...dummyScene,
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
          ...dummyTrigger,
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
          ...dummyScene,
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
          ...dummyActor,
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
          ...dummyScene,
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
          ...dummyActor,
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
          ...dummyScene,
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
          ...dummyActor,
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
          ...dummyScene,
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
          ...dummyTrigger,
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
          ...dummyScene,
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
          ...dummyTrigger,
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
          ...dummyScene,
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
          ...dummyTrigger,
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
    state.triggers.entities.trigger1
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
    action.payload.paletteId
  );
  expect(newState.palettes.entities[action.payload.paletteId]?.colors).toEqual(
    DMG_PALETTE.colors
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
    newState.customEvents.entities[action.payload.customEventId]?.name
  ).toBe("");
  expect(
    newState.customEvents.entities[action.payload.customEventId]?.script
  ).toEqual([]);
});
