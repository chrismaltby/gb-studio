import { normalize, denormalize, schema } from "normalizr";
import { createSelector } from "reselect";
import deepmerge from "deepmerge";
import mapValues from "lodash/mapValues";
import {
  PROJECT_LOAD_SUCCESS,
  PROJECT_SAVE_AS_SUCCESS,
  SPRITE_LOAD_SUCCESS,
  BACKGROUND_LOAD_SUCCESS,
  SPRITE_REMOVE,
  EDIT_PROJECT,
  REMOVE_ACTOR_AT,
  REMOVE_TRIGGER_AT,  
  BACKGROUND_REMOVE,
  MUSIC_LOAD_SUCCESS,
  MUSIC_REMOVE,
} from "../actions/actionTypes";
import clamp from "../lib/helpers/clamp";
import {
  patchEvents,
  regenerateEventIds,
} from "../lib/helpers/eventSystem";
import initialState from "./initialState";
import { DMG_PALETTE, SPRITE_TYPE_STATIC, SPRITE_TYPE_ACTOR } from "../consts";

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
    result: Object.assign(
      {},
      state.result,
      state.result[type] && {
        [type]: [].concat(state.result[type], data.id)
      }
    )
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
        [id]: undefined
      }
    },
    result: Object.assign(
      {},
      state.result,
      state.result[type] && {
        [type]: state.result[type].filter(entityId => entityId !== id)
      }
    )
  };
};

const sortEntities = (state, type, sortFn) => {
  return {
    ...state,
    result: {
      ...state.result,
      [type]: [].concat(state.result[type]).sort((a, b) => {
        return sortFn(state.entities[type][a], state.entities[type][b]);
      })
    }
  };
};

const matchAsset = assetA => assetB => {
  return assetA.filename === assetB.filename && assetA.plugin === assetB.plugin;
};

const sortByFilename = (a, b) => {
  if (a.filename > b.filename) return 1;
  if (a.filename < b.filename) return -1;
  return 0;
};

// const notMatchAsset = assetA => assetB => {
//   return assetA.filename !== assetB.filename || assetA.plugin !== assetB.plugin;
// };

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;

// Schema ----------------------------------------------------------------------

const backgroundSchema = new schema.Entity("backgrounds");
const musicSchema = new schema.Entity("music");
const actorSchema = new schema.Entity("actors");
const triggerSchema = new schema.Entity("triggers");
const spriteSheetsSchema = new schema.Entity("spriteSheets");
const variablesSchema = new schema.Entity("variables");
const sceneSchema = new schema.Entity("scenes", {
  actors: [actorSchema],
  triggers: [triggerSchema]
});
const customEventsSchema = new schema.Entity("customEvents");
const palettesSchema = new schema.Entity("palettes");
const projectSchema = {
  scenes: [sceneSchema],
  backgrounds: [backgroundSchema],
  music: [musicSchema],
  spriteSheets: [spriteSheetsSchema],
  variables: [variablesSchema],
  customEvents: [customEventsSchema],
  palettes: [palettesSchema]
};

export const normalizeProject = projectData => {
  return normalize(projectData, projectSchema);
};

export const denormalizeProject = projectData => {
  return denormalize(projectData.result, projectSchema, projectData.entities);
};

// Mutations -------------------------------------------------------------------

const loadProject = (state, action) => {
  const data = normalizeProject(action.data);
  return fixDefaultPalettes(fixSceneCollisions(deepmerge(state, data)));
};

const saveAsProject = (state, action) => {
  const data = normalizeProject(action.data);
  return deepmerge({}, data);
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
  const existingAsset = state.result.spriteSheets
    .map(spriteSheetId => {
      return state.entities.spriteSheets[spriteSheetId];
    })
    .find(matchAsset(action.data));
  if (existingAsset) {
    return editEntity(state, "spriteSheets", existingAsset.id, {
      ...action.data,
      id: existingAsset.id
    });
  }
  return sortEntities(
    addEntity(state, "spriteSheets", action.data),
    "spriteSheets",
    sortByFilename
  );
};

const removeSprite = (state, action) => {
  const existingAsset = state.result.spriteSheets
    .map(spriteSheetId => {
      return state.entities.spriteSheets[spriteSheetId];
    })
    .find(matchAsset(action.data));
  return removeEntity(state, "spriteSheets", existingAsset.id);
};

const loadBackground = (state, action) => {
  const existingAsset = state.result.backgrounds
    .map(backgroundId => {
      return state.entities.backgrounds[backgroundId];
    })
    .find(matchAsset(action.data));
  if (existingAsset) {
    return fixSceneCollisions(
      editEntity(state, "backgrounds", existingAsset.id, {
        ...action.data,
        id: existingAsset.id
      })
    );
  }
  return sortEntities(
    addEntity(state, "backgrounds", action.data),
    "backgrounds",
    sortByFilename
  );
};

const removeBackground = (state, action) => {
  const existingAsset = state.result.backgrounds
    .map(backgroundId => {
      return state.entities.backgrounds[backgroundId];
    })
    .find(matchAsset(action.data));
  return removeEntity(state, "backgrounds", existingAsset.id);
};

const loadMusic = (state, action) => {
  const existingAsset = state.result.music
    .map(trackId => {
      return state.entities.music[trackId];
    })
    .find(matchAsset(action.data));
  if (existingAsset) {
    return editEntity(state, "music", existingAsset.id, {
      ...action.data,
      id: existingAsset.id
    });
  }
  return sortEntities(
    addEntity(state, "music", action.data),
    "music",
    sortByFilename
  );
};

const removeMusic = (state, action) => {
  const existingAsset = state.result.music
    .map(trackId => {
      return state.entities.music[trackId];
    })
    .find(matchAsset(action.data));
  return removeEntity(state, "music", existingAsset.id);
};

const fixSceneCollisions = state => {
  return {
    ...state,
    entities: {
      ...state.entities,
      scenes: Object.keys(state.entities.scenes).reduce((memo, sceneId) => {
        const scene = state.entities.scenes[sceneId];
        const background = state.entities.backgrounds[scene.backgroundId];

        if (!background || scene.width !== background.width || scene.height !== background.height) {
          // eslint-disable-next-line no-param-reassign
          memo[sceneId] = {
            ...scene,
            width: background ? background.width : 32,
            height: background ? background.height: 32,
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

const fixDefaultPalettes = (state) => {
  return {
    ...state,
    result: {
      ...state.result,
      settings: {
        ...state.result.settings,
        defaultBackgroundPaletteIds: state.result.settings.defaultBackgroundPaletteIds
          ? state.result.settings.defaultBackgroundPaletteIds.slice(-6)
          : [],
      },
    }
  }
};

const removeActorAt = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];

  const removeActorId = scene.actors.find(actorId => {
    const actor = state.entities.actors[actorId];
    return (
      (actor.x === action.x || actor.x === action.x - 1) &&
      (actor.y === action.y || actor.y === action.y + 1)
    );
  });

  if (removeActorId) {
    // Remove from scene
    const nextState = editEntity(state, "scenes", action.sceneId, {
      actors: scene.actors.filter(actorId => {
        return actorId !== removeActorId;
      })
    });

    return removeEntity(nextState, "actors", removeActorId);
  }

  return state;
};

const removeTriggerAt = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];

  const removeTriggerId = scene.triggers.find(triggerId => {
    const trigger = state.entities.triggers[triggerId];
    return (
      action.x >= trigger.x &&
      action.x < trigger.x + trigger.width &&
      action.y >= trigger.y &&
      action.y < trigger.y + trigger.height
    );
  });

  if (removeTriggerId) {
    // Remove from scene
    const nextState = editEntity(state, "scenes", action.sceneId, {
      triggers: scene.triggers.filter(triggerId => {
        return triggerId !== removeTriggerId;
      })
    });

    return removeEntity(nextState, "triggers", removeTriggerId);
  }

  return state;
};

const editPlayerStartAt = (state, action) => {
  return editProjectSettings(state, {
    values: {
      startSceneId: action.sceneId,
      startX: action.x,
      startY: action.y
    }
  });
};

const editSceneEventDestinationPosition = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];
  return editEntity(state, "scenes", action.sceneId, {
    script: patchEvents(scene.script, action.eventId, {
      sceneId: action.destSceneId,
      x: action.x,
      y: action.y
    })
  });
};

const editActorEventDestinationPosition = (state, action) => {
  const actor = state.entities.actors[action.id];
  return editEntity(state, "actors", action.id, {
    script: patchEvents(actor.script, action.eventId, {
      sceneId: action.destSceneId,
      x: action.x,
      y: action.y
    })
  });
};

const editTriggerEventDestinationPosition = (state, action) => {
  const trigger = state.entities.triggers[action.id];
  return editEntity(state, "triggers", action.id, {
    script: patchEvents(trigger.script, action.eventId, {
      sceneId: action.destSceneId,
      x: action.x,
      y: action.y
    })
  });
};

const addPalette = (state, action) => {
  const newPalette = {
    id: action.id,
    name: `Palette ${state.result.palettes.length + 1}`,
    colors: DMG_PALETTE.colors
  }
  return addEntity(state, "palettes", newPalette);
};

const editPalette = (state, action) => {
  const palette = state.entities.palettes[action.paletteId];
  return editEntity(state, "palettes", action.paletteId, {
    ...palette, 
    ...action.colors
  })
};

const removePalette = (state, action) => {
  return removeEntity(state, "palettes", action.paletteId);
};

const reloadAssets = (state, action) => {
  const now = Date.now();
  return {
    ...state,
    entities: {
      ...state.entities,
      backgrounds: mapValues(state.entities.backgrounds, e => ({
        ...e,
        _v: now
      })),
      spriteSheets: mapValues(state.entities.spriteSheets, e => ({
        ...e,
        _v: now
      })),
      music: mapValues(state.entities.music, e => ({
        ...e,
        _v: now
      }))
    }
  };
};

// Selectors -------------------------------------------------------------------

export const getScenesLookup = state => state.entities.present.entities.scenes;
export const getSceneIds = state => state.entities.present.result.scenes;
export const getActorsLookup = state => state.entities.present.entities.actors;
export const getTriggersLookup = state =>
  state.entities.present.entities.triggers;
export const getCustomEventsLookup = state =>
  state.entities.present.entities.customEvents;
export const getCustomEventIds = state =>
  state.entities.present.result.customEvents;
export const getBackgroundsLookup = state =>
  state.entities.present.entities.backgrounds;
export const getBackgroundIds = state =>
  state.entities.present.result.backgrounds;
export const getMusicLookup = state => state.entities.present.entities.music;
export const getMusicIds = state => state.entities.present.result.music;
export const getSpriteSheetsLookup = state =>
  state.entities.present.entities.spriteSheets;
export const getSpriteSheetIds = state =>
  state.entities.present.result.spriteSheets;
export const getSceneTriggerIds = (state, props) =>
  state.entities.present.entities.scenes[props.id].triggers;  
export const getScene = (state, props) =>
  state.entities.present.entities.scenes[props.id];  
export const getSceneInitScript = (state, props) =>
  state.entities.present.entities.scenes[props.id].script;
export const getScenePlayerHit1Script = (state, props) =>
  state.entities.present.entities.scenes[props.id].playerHit1Script;
export const getScenePlayerHit2Script = (state, props) =>
  state.entities.present.entities.scenes[props.id].playerHit2Script;
export const getScenePlayerHit3Script = (state, props) =>
  state.entities.present.entities.scenes[props.id].playerHit3Script;        
export const getPalettesLookup = state =>
  state.entities.present.entities.palettes;
export const getPaletteIds = state =>
  state.entities.present.result.palettes;  
export const getSettings = state =>
  state.entities.present.result.settings

export const getMaxSceneRight = createSelector(
  [getScenesLookup, getSceneIds],
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
  [getScenesLookup, getSceneIds],
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

export const getMusic = createSelector(
  [getMusicIds, getMusicLookup],
  (musicIds, music) => musicIds.map(id => music[id])
);

export const getBackgrounds = createSelector(
  [getBackgroundIds, getBackgroundsLookup],
  (backgroundIds, backgrounds) => backgroundIds.map(id => backgrounds[id])
);

export const getSpriteSheets = createSelector(
  [getSpriteSheetIds, getSpriteSheetsLookup],
  (spriteSheetIds, spriteSheets) => spriteSheetIds.map(id => spriteSheets[id])
);

export const getScenes = createSelector(
  [getSceneIds, getScenesLookup],
  (sceneIds, scenes) => sceneIds.map(id => scenes[id])
);

export const getCustomEvents = createSelector(
  [getCustomEventIds, getCustomEventsLookup],
  (customEventIds, customEvents) => customEventIds.map(id => customEvents[id])
);

export const getPalettes = createSelector(
  [getPaletteIds, getPalettesLookup],
  (paletteIds, palettes) => paletteIds.map(id => palettes[id])
);

// Reducer ---------------------------------------------------------------------

export default function project(state = initialState.entities, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS:
      return loadProject(state, action);
    case PROJECT_SAVE_AS_SUCCESS:
      return saveAsProject(state, action);
    case EDIT_PROJECT:
      return editProject(state, action);
    case SPRITE_LOAD_SUCCESS:
      return loadSprite(state, action);
    case SPRITE_REMOVE:
      return removeSprite(state, action);
    case BACKGROUND_LOAD_SUCCESS:
      return loadBackground(state, action);
    case BACKGROUND_REMOVE:
      return removeBackground(state, action);
    case MUSIC_LOAD_SUCCESS:
      return loadMusic(state, action);
    case MUSIC_REMOVE:
      return removeMusic(state, action);
    case REMOVE_ACTOR_AT:
      return removeActorAt(state, action);
    case REMOVE_TRIGGER_AT:
      return removeTriggerAt(state, action);
    default:
      return state;
  }
}
