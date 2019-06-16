import { normalize, schema } from "normalizr";
import { createSelector } from "reselect";
import deepmerge from "deepmerge";
import {
  PROJECT_LOAD_SUCCESS,
  SPRITE_LOAD_SUCCESS,
  BACKGROUND_LOAD_SUCCESS,
  SPRITE_REMOVE,
  EDIT_PROJECT,
  EDIT_PROJECT_SETTINGS,
  ADD_SCENE,
  MOVE_SCENE,
  EDIT_SCENE,
  EDIT_ACTOR,
  MOVE_ACTOR,
  MOVE_TRIGGER,
  EDIT_TRIGGER
} from "../actions/actionTypes";
import clamp from "../lib/helpers/clamp";
import { patchEvents, regenerateEventIds } from "../lib/helpers/eventSystem";
import initialState from "./initialState";

const addEntity = (state, type, data) => {
  return {
    ...state,
    entities: {
      ...state.entities,
      [type]: {
        ...state.entities[type],
        [data.id]: data
      }
    },
    result: {
      ...state.result,
      [type]: [].concat(state.result[type], data.id)
    }
  };
};

const editEntity = (state, type, id, data) => {
  return {
    ...state,
    entities: {
      ...state.entities,
      [type]: {
        ...state.entities[type],
        [id]: {
          ...state.entities[type][id],
          ...data
        }
      }
    },
    result: state.result
  };
};

const removeEntity = (state, type, id) => {
  return {
    ...state,
    entities: {
      ...state.entities,
      [type]: {
        ...state.entities[type],
        [id]: null
      }
    },
    result: {
      ...state.result,
      [type]: [].filter(entity => entity.id !== data.id)
    }
  };
};

const matchAsset = assetA => assetB => {
  return assetA.filename === assetB.filename && assetA.plugin === assetB.plugin;
};

const notMatchAsset = assetA => assetB => {
  return assetA.filename !== assetB.filename || assetA.plugin !== assetB.plugin;
};

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;

// const eventSchema = new schema.Entity("event");
const backgroundSchema = new schema.Entity("backgrounds");
const musicSchema = new schema.Entity("music");
const actorSchema = new schema.Entity("actors", {
  // script: [eventSchema]
});
const triggerSchema = new schema.Entity("triggers", {
  // script: [eventSchema]
});
const spriteSheetsSchema = new schema.Entity("spriteSheets");
const variablesSchema = new schema.Entity("variables");
const sceneSchema = new schema.Entity("scenes", {
  actors: [actorSchema],
  triggers: [triggerSchema]
  // script: [eventSchema]
});
const projectSchema = {
  scenes: [sceneSchema],
  backgrounds: [backgroundSchema],
  music: [musicSchema],
  spriteSheets: [spriteSheetsSchema],
  variables: [variablesSchema]
};

const loadProject = (state, action) => {
  const data = normalize(action.data, projectSchema);
  const indexes = {
    // sceneIdForActor: Object.values(data.entities.scenes).reduce(
    //   (memo, scene) => {
    //     for (let i = 0; i < scene.actors.length; i++) {
    //       // eslint-disable-next-line no-param-reassign
    //       memo[scene.actors[i]] = scene.id;
    //     }
    //     return memo;
    //   },
    //   {}
    // )
  };
  return deepmerge(state, data);
};

const editProject = (state, action) => {
  return {
    ...state,
    result: {
      ...state.result,
      ...action.values
    }
  };
};

const editProjectSettings = (state, action) => {
  return {
    ...state,
    result: {
      ...state.result,
      settings: {
        ...state.result.settings,
        ...action.values
      }
    }
  };
};

const loadSprite = (state, action) => {
  const existingAsset = Object.values(state.entities.spriteSheets).find(
    matchAsset(action.data)
  );
  if (existingAsset) {
    return editEntity(state, "spriteSheets", existingAsset.id, {
      ...action.data,
      id: existingAsset.id
    });
  }
  return addEntity(state, "spriteSheets", action.data);
};

const removeSprite = (state, action) => {
  const existingAsset = Object.values(state.entities.spriteSheets).find(
    matchAsset(action.data)
  );
  return removeEntity(state, "spriteSheets", existingAsset.id);
};

const loadBackground = (state, action) => {
  const existingAsset = Object.values(state.entities.backgrounds).find(
    matchAsset(action.data)
  );
  if (existingAsset) {
    return fixSceneCollisions(
      editEntity(state, "backgrounds", existingAsset.id, {
        ...action.data,
        id: existingAsset.id
      })
    );
  }
  return addEntity(state, "backgrounds", action.data);
};

const fixSceneCollisions = state => {
  return {
    ...state,
    entities: {
      ...state.entities,
      scenes: Object.keys(state.entities.scenes).reduce((memo, sceneId) => {
        const scene = state.entities.scenes[sceneId];
        const background = state.entities.backgrounds[scene.backgroundId];
        const collisionsSize =
          background && Math.ceil((background.width * background.height) / 8);

        if (!background || scene.collisions.length !== collisionsSize) {
          // eslint-disable-next-line no-param-reassign
          memo[sceneId] = {
            ...scene,
            collisions: []
          };
        } else {
          // eslint-disable-next-line no-param-reassign
          memo[sceneId] = scene;
        }
        return memo;
      }, {})
    }
  };
};

const addScene = (state, action) => {
  const script =
    action.defaults &&
    action.defaults.script &&
    action.defaults.script.map(regenerateEventIds);

  const backgroundId = state.result.backgrounds[0];
  const background = state.entities.backgrounds[backgroundId];

  const newScene = Object.assign(
    {
      name: `Scene ${state.result.scenes.length + 1}`,
      backgroundId,
      width: background.width,
      height: background.height,
      actors: [],
      triggers: [],
      collisions: []
    },
    action.defaults || {},
    script && {
      script
    },
    {
      id: action.id,
      x: Math.max(MIN_SCENE_X, action.x),
      y: Math.max(MIN_SCENE_Y, action.y)
    }
  );
  return addEntity(state, "scenes", newScene);
};

const moveScene = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];
  return editEntity(state, "scenes", action.sceneId, {
    x: Math.max(MIN_SCENE_X, scene.x + action.moveX),
    y: Math.max(MIN_SCENE_Y, scene.y + action.moveY)
  });
};

const editScene = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];

  // If switched background use collisions from another
  // scene using the background already if available
  // otherwise make empty collisions array of
  // the correct size
  let newCollisions;
  let newActors;
  let newTriggers;
  let newBackground;

  if (action.values.backgroundId) {
    const otherScene = Object.values(state.entities.scenes).find(s => {
      return s.backgroundId === action.values.backgroundId;
    });
    const background = state.entities.backgrounds[action.values.backgroundId];

    if (otherScene) {
      newCollisions = otherScene.collisions;
    } else {
      const collisionsSize = Math.ceil(
        (background.width * background.height) / 8
      );
      newCollisions = [];
      for (let i = 0; i < collisionsSize; i++) {
        newCollisions[i] = 0;
      }
    }

    newActors = scene.actors.map(actor => {
      return {
        ...actor,
        x: Math.min(actor.x, background.width - 2),
        y: Math.min(actor.y, background.height - 1)
      };
    });

    newTriggers = scene.triggers.map(trigger => {
      const x = Math.min(trigger.x, background.width - 1);
      const y = Math.min(trigger.y, background.height - 1);
      return {
        ...trigger,
        x,
        y,
        width: Math.min(trigger.width, background.width - x),
        height: Math.min(trigger.height, background.height - y)
      };
    });

    newBackground = background;
  }

  return editEntity(
    state,
    "scenes",
    action.sceneId,
    Object.assign(
      {},
      action.values,
      action.values.backgroundId && {
        collisions: newCollisions || [],
        actors: newActors,
        triggers: newTriggers,
        width: newBackground.width,
        height: newBackground.height
      }
    )
  );
};

const moveActor = (state, action) => {
  const newScene = state.entities.scenes[action.newSceneId];

  let nextState = state;

  // If changed scene
  if (action.sceneId !== action.newSceneId) {
    const prevScene = state.entities.scenes[action.sceneId];

    // Remove from previous scene
    nextState = editEntity(nextState, "scenes", action.sceneId, {
      actors: prevScene.actors.filter(actorId => {
        return actorId !== action.id;
      })
    });

    // Add to new scene
    nextState = editEntity(nextState, "scenes", action.newSceneId, {
      actors: [].concat(newScene.actors, action.id)
    });
  }

  return editEntity(nextState, "actors", action.id, {
    x: clamp(action.x, 0, newScene.width - 2),
    y: clamp(action.y, 0, newScene.height - 1)
  });
};

const moveTrigger = (state, action) => {
  const newScene = state.entities.scenes[action.newSceneId];
  const trigger = state.entities.triggers[action.id];

  console.log("MOVE TRIGGER!!!!!!!!!");

  let nextState = state;

  // If changed scene
  if (action.sceneId !== action.newSceneId) {
    const prevScene = state.entities.scenes[action.sceneId];

    // Remove from previous scene
    nextState = editEntity(nextState, "scenes", action.sceneId, {
      triggers: prevScene.triggers.filter(actorId => {
        return actorId !== action.id;
      })
    });

    // Add to new scene
    nextState = editEntity(nextState, "scenes", action.newSceneId, {
      triggers: [].concat(newScene.triggers, action.id)
    });
  }

  return editEntity(nextState, "triggers", action.id, {
    x: clamp(action.x, 0, newScene.width - trigger.width),
    y: clamp(action.y, 0, newScene.height - trigger.height)
  });
};

const editActor = (state, action) => {
  const actor = state.entities.actors[action.id];
  const patch = { ...action.values };

  // If changed spriteSheetId
  if (patch.spriteSheetId) {
    const newSprite = state.entities.spriteSheets[patch.spriteSheetId];
    // If new sprite not an actor then reset movement type back to static
    if (newSprite.numFrames !== 3 && newSprite.numFrames !== 6) {
      patch.movementType = "static";
    }
    const oldSprite = state.entities.spriteSheets[actor.spriteSheetId];
    // If new sprite is an actor and old one wasn't reset movement type to face interaction
    if (
      oldSprite &&
      newSprite &&
      oldSprite.id !== newSprite.id &&
      (oldSprite.numFrames !== 3 && oldSprite.numFrames !== 6) &&
      (newSprite.numFrames === 3 || newSprite.numFrames === 6)
    ) {
      patch.movementType = "faceInteraction";
    }

    if (newSprite && newSprite.numFrames <= actor.frame) {
      patch.frame = 0;
    }
  }
  // If static and cycling frames start from frame 1 (facing downwards)
  if (
    (patch.animate && actor.movementType === "static") ||
    patch.movementType === "static"
  ) {
    patch.direction = "down";
  }
  return editEntity(state, "actors", actor.id, patch);
};

const editTrigger = (state, action) => {
  const trigger = state.entities.triggers[action.id];
  const patch = { ...action.values };
  return editEntity(state, "triggers", trigger.id, patch);
};

export default function project(state = initialState.entities, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS:
      return loadProject(state, action);
    case EDIT_PROJECT:
      return editProject(state, action);
    case EDIT_PROJECT_SETTINGS:
      return editProjectSettings(state, action);
    case SPRITE_LOAD_SUCCESS:
      return loadSprite(state, action);
    case SPRITE_REMOVE:
      return removeSprite(state, action);
    case BACKGROUND_LOAD_SUCCESS:
      return loadBackground(state, action);
    case ADD_SCENE:
      return addScene(state, action);
    case MOVE_SCENE:
      return moveScene(state, action);
    case EDIT_SCENE:
      return editScene(state, action);
    case EDIT_ACTOR:
      return editActor(state, action);
    case MOVE_ACTOR:
      return moveActor(state, action);
    case EDIT_TRIGGER:
      return editTrigger(state, action);
    case MOVE_TRIGGER:
      return moveTrigger(state, action);
    default:
      return state;
  }
}

// Selectors -------------------------------------------------------------------

const getScenes = state => state.entities.present.entities.scenes;
const getSceneIds = state => state.entities.present.result.scenes;
const getActors = state => state.entities.present.entities.actors;
const getSpriteSheets = state => state.entities.present.entities.spriteSheets;
const getSceneActorIds = (state, props) =>
  state.entities.present.entities.scenes[props.id].actors;

export const getMaxSceneRight = createSelector(
  [getScenes, getSceneIds],
  (scenes, sceneIds) =>
    sceneIds.reduce((memo, sceneId) => {
      const scene = scenes[sceneId];
      const sceneRight = scene.x + scene.width * 8;
      if (sceneRight > memo) {
        return sceneRight;
      }
      return memo;
    }, 0)
);

export const getMaxSceneBottom = createSelector(
  [getScenes, getSceneIds],
  (scenes, sceneIds) =>
    sceneIds.reduce((memo, sceneId) => {
      const scene = scenes[sceneId];
      const sceneBottom = scene.y + scene.height * 8;
      if (sceneBottom > memo) {
        return sceneBottom;
      }
      return memo;
    }, 0)
);

export const getSceneUniqueSpriteSheets = createSelector(
  [getSceneActorIds, getActors, getSpriteSheets],
  (actorIds, actors, spriteSheets) =>
    actorIds.reduce((memo, actorId) => {
      const spriteSheet = spriteSheets[actors[actorId].spriteSheetId];
      if (memo.indexOf(spriteSheet) === -1) {
        memo.push(spriteSheet);
      }
      return memo;
    }, [])
);

export const getSceneFrameCount = createSelector(
  [getSceneUniqueSpriteSheets],
  spriteSheets =>
    spriteSheets.reduce((memo, spriteSheet) => {
      return memo + (spriteSheet ? spriteSheet.numFrames : 0);
    }, 0)
);

export const getSceneActors = createSelector(
  [getSceneActorIds, getActors],
  (actorIds, actors) => actorIds.map(actorId => actors[actorId])
);
