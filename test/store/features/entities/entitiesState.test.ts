import reducer, {
  initialState,
} from "../../../../src/store/features/entities/entitiesState";
import {
  EntitiesState,
  SceneData,
  Background,
  SpriteSheet,
  Music,
} from "../../../../src/store/features/entities/entitiesTypes";
import actions from "../../../../src/store/features/entities/entitiesActions";
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

const defaultSpriteSheet: SpriteSheet = {
  id: "",
  name: "",
  filename: "",
  numFrames: 1,
  type: "static",
  _v: 0,
};

const defaultMusic: Music = {
  id: "",
  name: "",
  filename: "",
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
    ...defaultSpriteSheet,
    id: "sprite1",
    numFrames: 6,
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
  expect(newState.spriteSheets.entities["sprite1"]?.numFrames).toBe(6);
});

test("Should update sprite sheet if modified while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    spriteSheets: {
      entities: {
        sprite1: {
          ...defaultSpriteSheet,
          id: "sprite1",
          filename: "sprite1.png",
        },
      },
      ids: ["sprite1"],
    },
  };

  const loadSpriteSheet: SpriteSheet = {
    ...defaultSpriteSheet,
    id: "sprite1",
    filename: "sprite1.png",
    numFrames: 8,
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
  expect(newState.spriteSheets.entities["sprite1"]?.numFrames).toBe(8);
});

test("Should remove sprite sheets that are deleted while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    spriteSheets: {
      entities: {
        sprite1: {
          ...defaultSpriteSheet,
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
    ...defaultMusic,
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
          ...defaultMusic,
          id: "track1",
          filename: "track1.mod",
          _v: 0,
        },
      },
      ids: ["track1"],
    },
  };

  const loadMusic: Music = {
    ...defaultMusic,
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
          ...defaultMusic,
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
          ...defaultScene,
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

test("Should use collisions and colors from other scene if switched to use same background", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...defaultScene,
          id: "scene1",
          backgroundId: "bg1",
          actors: [],
          triggers: [],
          collisions: [1, 2, 3],
          tileColors: [4, 5, 6],
        },
        scene2: {
          ...defaultScene,
          id: "scene2",
          backgroundId: "bg2",
          actors: [],
          triggers: [],
          collisions: [],
          tileColors: [],
        },
      },
      ids: ["scene1", "scene2"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...defaultBackground,
          id: "bg1",
        },
        bg2: {
          ...defaultBackground,
          id: "bg2",
        },
      },
      ids: ["bg1", "bg2"],
    },
  };

  const action = actions.editScene({
    sceneId: "scene2",
    changes: {
      backgroundId: "bg1",
    },
  });

  expect(state.scenes.entities["scene2"]?.collisions).toEqual([]);
  expect(state.scenes.entities["scene2"]?.tileColors).toEqual([]);
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene2"]?.collisions).toEqual([1, 2, 3]);
  expect(newState.scenes.entities["scene2"]?.tileColors).toEqual([4, 5, 6]);
});

test("Should be able to remove a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...defaultScene,
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
          ...defaultScene,
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
          ...defaultBackground,
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

  const expectedCols = Array.from(Array(50)).map((i) => 2);

  expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
});

test("Should be able to paint collisions", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...defaultScene,
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
          ...defaultBackground,
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
            ...defaultScene,
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
            ...defaultBackground,
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
      if ((index%10) === Math.floor(index/10)) {
        return 2;
      }
      return 0;
    });
  
    expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
    expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
  });
  