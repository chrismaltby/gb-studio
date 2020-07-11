import uuid from "uuid/v4";
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
  EDIT_PROJECT_SETTINGS,
  EDIT_CUSTOM_EVENT,
  ADD_SCENE,
  MOVE_SCENE,
  EDIT_SCENE,
  REMOVE_SCENE,
  ADD_ACTOR,
  EDIT_ACTOR,
  MOVE_ACTOR,
  REMOVE_ACTOR,
  REMOVE_ACTOR_AT,
  MOVE_TRIGGER,
  EDIT_TRIGGER,
  REMOVE_TRIGGER,
  REMOVE_TRIGGER_AT,
  PAINT_COLLISION_TILE,
  PAINT_COLLISION_LINE,
  PAINT_COLLISION_FILL,  
  PAINT_COLOR_TILE,
  PAINT_COLOR_LINE,
  PAINT_COLOR_FILL,    
  EDIT_PLAYER_START_AT,
  EDIT_SCENE_EVENT_DESTINATION_POSITION,
  EDIT_TRIGGER_EVENT_DESTINATION_POSITION,
  EDIT_ACTOR_EVENT_DESTINATION_POSITION,
  ADD_TRIGGER,
  RESIZE_TRIGGER,
  RENAME_VARIABLE,
  BACKGROUND_REMOVE,
  MUSIC_LOAD_SUCCESS,
  MUSIC_REMOVE,
  ADD_CUSTOM_EVENT,
  REMOVE_CUSTOM_EVENT,
  RELOAD_ASSETS,
  ADD_PALETTE,
  EDIT_PALETTE,
  REMOVE_PALETTE
} from "../actions/actionTypes";
import clamp from "../lib/helpers/clamp";
import {
  patchEvents,
  regenerateEventIds,
  mapEvents,
  walkEvents,
  isVariableField
} from "../lib/helpers/eventSystem";
import initialState from "./initialState";
import { EVENT_CALL_CUSTOM_EVENT } from "../lib/compiler/eventTypes";
import { replaceInvalidCustomEventVariables, replaceInvalidCustomEventActors } from "../lib/compiler/helpers";
import { paint, paintLine, floodFill } from "../lib/helpers/paint";
import { DMG_PALETTE, SPRITE_TYPE_STATIC, SPRITE_TYPE_ACTOR, TILE_PROPS, COLLISION_ALL } from "../consts";

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
            collisions: [],
            tileColors: []
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

const addScene = (state, action) => {
  const defaults = action.defaults || {};
  const defaultActors = defaults.actors || [];
  const defaultTriggers = defaults.triggers || [];

  const actorNewIdLookup = defaultActors.reduce((memo, actor) => {
    return { ...memo, [actor.id]: uuid() };
  }, {});
  const triggerNewIdLookup = defaultTriggers.reduce((memo, actor) => {
    return { ...memo, [actor.id]: uuid() };
  }, {});
  const newIdsLookup = Object.assign({}, actorNewIdLookup, triggerNewIdLookup);

  const fixScript = script =>
    script &&
    mapEvents(script.map(regenerateEventIds), event => {
      return {
        ...event,
        args: mapValues(event.args, arg => {
          if (newIdsLookup[arg]) {
            return newIdsLookup[arg];
          }
          return arg;
        })
      };
    });

  const script = fixScript(defaults.script);
  const backgroundId = state.result.backgrounds[0];
  const background = state.entities.backgrounds[backgroundId];

  const newActorIds = [];
  const newTriggerIds = [];

  let nextState = state;

  // Copy default/prefab actors to new scene
  for (let i = 0; i < defaultActors.length; i++) {
    const actorData = defaultActors[i];
    const actorId = actorNewIdLookup[actorData.id];
    const actorScript = fixScript(actorData.script);
    newActorIds.push(actorId);
    nextState = addEntity(
      nextState,
      "actors",
      Object.assign(
        {},
        actorData,
        actorScript && {
          script: actorScript
        },
        {
          id: actorId
        }
      )
    );
  }

  // Copy default/prefab triggers to new scene
  for (let i = 0; i < defaultTriggers.length; i++) {
    const triggerData = defaultTriggers[i];
    const triggerId = triggerNewIdLookup[triggerData.id];
    const triggerScript = fixScript(triggerData.script);
    newTriggerIds.push(triggerId);
    nextState = addEntity(
      nextState,
      "triggers",
      Object.assign(
        {},
        triggerData,
        triggerScript && {
          script: triggerScript
        },
        {
          id: triggerId
        }
      )
    );
  }

  const newScene = Object.assign(
    {
      name: `Scene ${state.result.scenes.length + 1}`,
      backgroundId,
      width: background.width,
      height: background.height,
      collisions: [],
      tileColors: []
    },
    action.defaults || {},
    script && { script },
    {
      id: action.id,
      x: Math.max(MIN_SCENE_X, action.x),
      y: Math.max(MIN_SCENE_Y, action.y),
      actors: newActorIds,
      triggers: newTriggerIds
    }
  );
  return addEntity(nextState, "scenes", newScene);
};

const moveScene = (state, action) => {
  return editEntity(state, "scenes", action.sceneId, {
    x: Math.max(MIN_SCENE_X, action.x),
    y: Math.max(MIN_SCENE_Y, action.y)
  });
};

const editScene = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];
  const actors = state.entities.actors;
  const triggers = state.entities.triggers;

  // If switched background use collisions from another
  // scene using the background already if available
  // otherwise keep old collisions if same width
  // otherwise make empty collisions array of
  // the correct size
  let newState = state;
  let newCollisions;
  let newTileColors;
  let newBackground;

  if (action.values.backgroundId) {
    const sceneIds = state.result.scenes;
    const scenesLookup = state.entities.scenes;
    const scenes = sceneIds.map(id => scenesLookup[id]);
    const otherScene = scenes.find(s => {
      return s.backgroundId === action.values.backgroundId;
    });
    const oldBackground = state.entities.backgrounds[scene.backgroundId];
    const background = state.entities.backgrounds[action.values.backgroundId];

    if (otherScene) {
      newCollisions = otherScene.collisions;
      newTileColors = otherScene.tileColors;
    } else if (oldBackground.width == background.width){
      const collisionsSize = Math.ceil(
        (background.width * background.height)
      );
      newCollisions = (scene.collisions.slice(0,collisionsSize));
      newTileColors = [];
    } else {
      const collisionsSize = Math.ceil(
        (background.width * background.height)
      );
      newCollisions = [];
      newTileColors = [];
      for (let i = 0; i < collisionsSize; i++) {
        newCollisions[i] = 0;
      }
    }

    scene.actors.forEach(actorId => {
      const actor = actors[actorId];
      const x = Math.min(actor.x, background.width - 2);
      const y = Math.min(actor.y, background.height - 1);
      if (actor.x !== x || actor.y !== y) {
        newState = editEntity(newState, "actors", actor.id, { x, y });
      }
    });

    scene.triggers.forEach(triggerId => {
      const trigger = triggers[triggerId];
      const x = Math.min(trigger.x, background.width - 1);
      const y = Math.min(trigger.y, background.height - 1);
      const width = Math.min(trigger.width, background.width - x);
      const height = Math.min(trigger.height, background.height - y);
      if (
        trigger.x !== x ||
        trigger.y !== y ||
        trigger.width !== width ||
        trigger.height !== height
      ) {
        newState = editEntity(newState, "triggers", trigger.id, {
          x,
          y,
          width,
          height
        });
      }
    });

    newBackground = background;
  }

  return editEntity(
    newState,
    "scenes",
    action.sceneId,
    Object.assign(
      {},
      action.values,
      action.values.backgroundId && {
        collisions: newCollisions || [],
        tileColors: newTileColors || [],
        width: newBackground.width,
        height: newBackground.height
      }
    )
  );
};

const removeScene = (state, action) => {
  return removeEntity(state, "scenes", action.sceneId);
};

const addCustomEvent = (state, action) => {
  const newCustomEvent = Object.assign(
    {
      id: action.id,
      variables: {},
      actors: {}
    },
    action.script && {
      script: action.script
    }
  );
  return addEntity(state, "customEvents", newCustomEvent);
};

const editCustomEvent = (state, action) => {
  const patch = { ...action.values };
  let newState = state;

  const oldEvent = newState.entities.customEvents[action.id];

  if (!oldEvent) {
    newState = addCustomEvent(state, action);
  }

  if (patch.script) {
    // Fix invalid variables in script
    const fix = replaceInvalidCustomEventVariables;
    const fixActor = replaceInvalidCustomEventActors;
    patch.script = mapEvents(patch.script, event => {
      if (event.args) {
        const fixedEventVariableArgs = Object.keys(event.args).reduce((memo, arg) => {
          const fixedVarArgs = memo;
          if (isVariableField(event.command, arg, event.args[arg])) {
            fixedVarArgs[arg] = fix(event.args[arg]);
          } else {
            fixedVarArgs[arg] = event.args[arg];
          }
          return fixedVarArgs;
        }, {});

        return {
          ...event,
          args: {
            ...event.args,
            ...fixedEventVariableArgs,
            actorId: event.args.actorId && fixActor(event.args.actorId),
            otherActorId: event.args.otherActorId && fixActor(event.args.otherActorId)
          }
        };
      }
      return event;
    });

    const variables = {};
    const actors = {};

    const oldVariables = newState.entities.customEvents[action.id].variables;
    const oldActors = newState.entities.customEvents[action.id].actors;

    walkEvents(patch.script, e => {
      const args = e.args;

      if (!args) return;

      if (args.actorId && args.actorId !== "player") {
        const letter = String.fromCharCode(
          "A".charCodeAt(0) + parseInt(args.actorId)
        );
        actors[args.actorId] = {
          id: args.actorId,
          name: oldActors[args.actorId]
            ? oldActors[args.actorId].name
            : `Actor ${letter}`
        };
      }

      if (args.otherActorId && args.otherActorId !== "player") {
        const letter = String.fromCharCode(
          "A".charCodeAt(0) + parseInt(args.otherActorId)
        );
        actors[args.otherActorId] = {
          id: args.otherActorId,
          name: oldActors[args.otherActorId]
            ? oldActors[args.otherActorId].name
            : `Actor ${letter}`
        };
      }

      Object.keys(args).forEach(arg => {
        if (isVariableField(e.command, arg, args[arg])) {
          const addVariable = (variable) => {
            const letter = String.fromCharCode(
              "A".charCodeAt(0) + parseInt(variable)
            );
            variables[variable] = {
              id: variable,
              name: oldVariables[variable]
                ? oldVariables[variable].name
                : `Variable ${letter}`
            };  
          }
          const variable = args[arg][1];
          if (variable != null && variable.type === "variable") {
            addVariable(variable.value);
          } else {
            addVariable(variable);
          }
        }
      });

      if (args.text) {
        const text = Array.isArray(args.text) ? args.text.join() : args.text;
        const variablePtrs = text.match(/\$V[0-9]\$/g);
        if (variablePtrs) {
          variablePtrs.forEach(variablePtr => {
            const variable = variablePtr[2];
            const letter = String.fromCharCode(
              "A".charCodeAt(0) + parseInt(variable, 10)
            ).toUpperCase();
            variables[variable] = {
              id: variable,
              name: oldVariables[variable]
                ? oldVariables[variable].name
                : `Variable ${letter}`
            };
          });
        }
      }
    });

    patch.variables = { ...variables };
    patch.actors = { ...actors };

    newState = updateEntitiesCustomEventScript(
      newState,
      "scenes",
      action.id,
      newState.entities.scenes,
      patch
    );
    newState = updateEntitiesCustomEventScript(
      newState,
      "actors",
      action.id,
      newState.entities.actors,
      patch
    );
    newState = updateEntitiesCustomEventScript(
      newState,
      "triggers",
      action.id,
      newState.entities.triggers,
      patch
    );
  }

  if (patch.name) {
    newState = updateEntitiesCustomEventName(
      newState,
      "scenes",
      action.id,
      newState.entities.scenes,
      patch.name
    );
    newState = updateEntitiesCustomEventName(
      newState,
      "actors",
      action.id,
      newState.entities.actors,
      patch.name
    );
    newState = updateEntitiesCustomEventName(
      newState,
      "triggers",
      action.id,
      newState.entities.triggers,
      patch.name
    );
  }

  return editEntity(newState, "customEvents", action.id, patch);
};

const patchEntityScripts = (state, type, entities, patchFn) => {

  let newState = state;
  Object.values(entities).forEach(entity => {
    if (!entity ||
      (!entity.script && !entity.startScript && !entity.updateScript && !entity.playerHit1Script && !entity.playerHit2Script && !entity.playerHit3Script && !entity.hit1Script && !entity.hit2Script && !entity.hit3Script)) {
      return;
    }
    const patchEntity = {
      ...entity,
      ...entity.script && { script: mapEvents(entity.script, patchFn) },
      ...entity.startScript && { startScript: mapEvents(entity.startScript, patchFn) },
      ...entity.updateScript && { updateScript: mapEvents(entity.updateScript, patchFn) },
      ...entity.playerHit1Script && { playerHit1Script: mapEvents(entity.playerHit1Script, patchFn) },
      ...entity.playerHit2Script && { playerHit2Script: mapEvents(entity.playerHit2Script, patchFn) },
      ...entity.playerHit3Script && { playerHit3Script: mapEvents(entity.playerHit3Script, patchFn) },
      ...entity.hit1Script && { hit1Script: mapEvents(entity.hit1Script, patchFn) },
      ...entity.hit2Script && { hit2Script: mapEvents(entity.hit2Script, patchFn) },
      ...entity.hit3Script && { hit3Script: mapEvents(entity.hit3Script, patchFn) }
    };
    newState = editEntity(newState, type, entity.id, patchEntity);
  });
  return newState;
};

const updateEntitiesCustomEventName = (state, type, id, entities, name) => {
  const patchCustomEventName = event => {
    if (event.command !== EVENT_CALL_CUSTOM_EVENT) {
      return event;
    }
    if (event.args.customEventId !== id) {
      return event;
    }
    return {
      ...event,
      args: {
        ...event.args,
        __name: name
      }
    };
  };
  return patchEntityScripts(state, type, entities, patchCustomEventName);
};

const updateEntitiesCustomEventScript = (state, type, id, entities, patch) => {
  const { variables, actors } = patch;
  const usedVariables = Object.keys(variables).map((i) => `__parameter_V${i}`);
  const usedActors = Object.keys(actors).map((i) => `__parameter_A${i}`); 
  
  const patchCustomEventScript = event => {
    if (event.command !== EVENT_CALL_CUSTOM_EVENT ||
      event.args.customEventId !== id) {
      return event;
    }
    const newArgs = {
      ...event.args,
    };

    usedVariables.forEach((v) => {
      // If the variable already exists in the arguments
      // use the existing value
      newArgs[v] = event.args[v] || 0;
    });

    usedActors.forEach((a) => {
      // If the actor already exists in the arguments
      // use the existing value
      newArgs[a] = event.args[a] || "player"
    });

    Object.keys(newArgs).forEach((k) => {
      // If the argument isn't used, delete it
      if (k.startsWith("__parameter_") &&
        !usedVariables.find((v) => v === k) &&
        !usedActors.find((a) => a === k)) {
        delete newArgs[k];
      }
    });

    return {
      ...event,
      args: newArgs
    };
  };
  return patchEntityScripts(state, type, entities, patchCustomEventScript);
};

const removeCustomEvent = (state, action) => {
  return removeEntity(state, "customEvents", action.customEventId);
};

const addActor = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];
  const spriteSheetId = state.result.spriteSheets[0];
  const script =
    action.defaults &&
    action.defaults.script &&
    action.defaults.script.map(regenerateEventIds);
  const newActor = Object.assign(
    {
      spriteSheetId,
      spriteType: SPRITE_TYPE_STATIC,
      direction: "down",
      moveSpeed: "1",
      animSpeed: "3"
    },
    action.defaults || {},
    script && {
      script
    },
    {
      id: action.id,
      x: clamp(action.x, 0, scene.width - 2),
      y: clamp(action.y, 0, scene.height - 1)
    }
  );

  // Add to scene
  const nextState = editEntity(state, "scenes", action.sceneId, {
    actors: [].concat(scene.actors, action.id)
  });

  return addEntity(nextState, "actors", newActor);
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

const resizeTrigger = (state, action) => {
  return editEntity(state, "triggers", action.id, {
    x: Math.min(action.x, action.startX),
    y: Math.min(action.y, action.startY),
    width: Math.abs(action.x - action.startX) + 1,
    height: Math.abs(action.y - action.startY) + 1
  });
};

const editActor = (state, action) => {
  const actor = state.entities.actors[action.id];
  const patch = { ...action.values };

  // If changed spriteSheetId
  if (patch.spriteSheetId) {
    const newSprite = state.entities.spriteSheets[patch.spriteSheetId];
    // If new sprite not an actor then reset sprite type back to static
    if (newSprite.numFrames !== 3 && newSprite.numFrames !== 6) {
      patch.spriteType = SPRITE_TYPE_STATIC;
    }
    const oldSprite = state.entities.spriteSheets[actor.spriteSheetId];
    // If new sprite is an actor and old one wasn't reset sprite type to actor
    if (
      oldSprite &&
      newSprite &&
      oldSprite.id !== newSprite.id &&
      (oldSprite.numFrames !== 3 && oldSprite.numFrames !== 6) &&
      (newSprite.numFrames === 3 || newSprite.numFrames === 6)
    ) {
      patch.spriteType = SPRITE_TYPE_ACTOR;
    }

    if (newSprite && newSprite.numFrames <= actor.frame) {
      patch.frame = 0;
    }
  }
  // If static and cycling frames start from frame 1 (facing downwards)
  if (
    (patch.animate && actor.spriteType === SPRITE_TYPE_STATIC) ||
    patch.spriteType === SPRITE_TYPE_STATIC
  ) {
    patch.direction = "down";
  }
  return editEntity(state, "actors", actor.id, patch);
};

const removeActor = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];

  // Remove from scene
  const nextState = editEntity(state, "scenes", action.sceneId, {
    actors: scene.actors.filter(actorId => {
      return actorId !== action.id;
    })
  });

  return removeEntity(nextState, "actors", action.id);
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

const addTrigger = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];
  const script =
    action.defaults &&
    action.defaults.script &&
    action.defaults.script.map(regenerateEventIds);

  const width = Math.min(action.width || 1, scene.width);
  const height = Math.min(action.height || 1, scene.height);

  const newTrigger = Object.assign(
    {
      trigger: "walk"
    },
    action.defaults || {},
    script && {
      script
    },
    {
      id: action.id,
      x: clamp(action.x, 0, scene.width - width),
      y: clamp(action.y, 0, scene.height - height),
      width,
      height
    }
  );

  // Add to scene
  const nextState = editEntity(state, "scenes", action.sceneId, {
    triggers: [].concat(scene.triggers, action.id)
  });

  return addEntity(nextState, "triggers", newTrigger);
};

const editTrigger = (state, action) => {
  const trigger = state.entities.triggers[action.id];
  const patch = { ...action.values };
  return editEntity(state, "triggers", trigger.id, patch);
};

const removeTrigger = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];

  // Remove from scene
  const nextState = editEntity(state, "scenes", action.sceneId, {
    triggers: scene.triggers.filter(triggerId => {
      return triggerId !== action.id;
    })
  });

  return removeEntity(nextState, "triggers", action.id);
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

const paintCollision = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];
  const background = state.entities.backgrounds[scene.backgroundId];
  const isTileProp = action.isTileProp;

  if (!background) {
    return state;
  }

  const collisionsSize = Math.ceil((background.width * background.height));
  const collisions = scene.collisions.slice(0, collisionsSize);

  if (collisions.length < collisionsSize) {
    for (let i = collisions.length; i < collisionsSize; i++) {
      collisions[i] = 0;
    }
  }

  const getValue = (x, y) => {
    const tileIndex = (background.width * y) + x;
    return collisions[tileIndex];
  }

  const setValue = (x, y, value) => {
    const tileIndex = (background.width * y) + x;
    let newValue = value;
    if (isTileProp) {
      // If is prop keep previous collision value
      newValue = (collisions[tileIndex] & COLLISION_ALL) + (value & TILE_PROPS);
    } else if (value !== 0) {
      // If is collision keep prop unless erasing
      newValue = (value & COLLISION_ALL) + (collisions[tileIndex] & TILE_PROPS);
    }
    collisions[tileIndex] = newValue;
  }

  const isInBounds = (x, y) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  }

  const equal = (a, b) => a === b;

  if(action.type === PAINT_COLLISION_TILE) {
    paint(action.x, action.y, action.brushSize, action.value, setValue, isInBounds);
  } else if (action.type === PAINT_COLLISION_LINE) {
    paintLine(action.startX, action.startY, action.endX, action.endY, action.brushSize, action.value, setValue, isInBounds);
  } else if (action.type === PAINT_COLLISION_FILL) {
    floodFill(action.x, action.y, action.value, getValue, setValue, isInBounds, equal);
  }

  return editEntity(state, "scenes", scene.id, {
    collisions
  });
};

const paintColor = (state, action) => {
  const scene = state.entities.scenes[action.sceneId];
  const background = state.entities.backgrounds[scene.backgroundId];

  if (!background) {
    return state;
  }

  const tileColorsSize = Math.ceil((background.width * background.height));
  const tileColors = (scene.tileColors || []).slice(0, tileColorsSize);

  if (tileColors.length < tileColorsSize) {
    for (let i = tileColors.length; i < tileColorsSize; i++) {
      tileColors[i] = 0;
    }
  }

  const getValue = (x, y) => {
    const tileColorIndex = (background.width * y) + x;
    return tileColors[tileColorIndex];    
  }

  const setValue = (x, y, value) => {
    const tileColorIndex = (background.width * y) + x;
    tileColors[tileColorIndex] = value;    
  }

  const isInBounds = (x, y) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  }

  const equal = (a, b) => a === b;

  if(action.type === PAINT_COLOR_TILE) {
    paint(action.x, action.y, action.brushSize, action.paletteIndex, setValue, isInBounds);
  } else if (action.type === PAINT_COLOR_LINE) {
    paintLine(action.startX, action.startY, action.endX, action.endY, action.brushSize, action.paletteIndex, setValue, isInBounds);
  } else if (action.type === PAINT_COLOR_FILL) {
    floodFill(action.x, action.y, action.paletteIndex, getValue, setValue, isInBounds, equal);
  }

  return editEntity(state, "scenes", scene.id, {
    tileColors
  });
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

const renameVariable = (state, action) => {
  if (action.name) {
    const currentVariable = state.entities.variables[action.variableId];
    if (currentVariable) {
      return editEntity(state, "variables", action.variableId, {
        name: action.name
      });
    }
    return addEntity(state, "variables", {
      id: action.variableId,
      name: action.name
    });
  }
  return removeEntity(state, "variables", action.variableId);
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
export const getSceneActorIds = (state, props) =>
  state.entities.present.entities.scenes[props.id].actors;
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

export const getSceneActors = createSelector(
  [getSceneActorIds, getActorsLookup],
  (actorIds, actors) => actorIds.map(actorId => actors[actorId])
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
    case EDIT_PROJECT_SETTINGS:
      return editProjectSettings(state, action);
    case EDIT_CUSTOM_EVENT:
      return editCustomEvent(state, action);
    case REMOVE_CUSTOM_EVENT:
      return removeCustomEvent(state, action);
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
    case ADD_CUSTOM_EVENT:
      return addCustomEvent(state, action);
    case ADD_SCENE:
      return addScene(state, action);
    case MOVE_SCENE:
      return moveScene(state, action);
    case EDIT_SCENE:
      return editScene(state, action);
    case REMOVE_SCENE:
      return removeScene(state, action);
    case ADD_ACTOR:
      return addActor(state, action);
    case EDIT_ACTOR:
      return editActor(state, action);
    case MOVE_ACTOR:
      return moveActor(state, action);
    case REMOVE_ACTOR:
      return removeActor(state, action);
    case REMOVE_ACTOR_AT:
      return removeActorAt(state, action);
    case ADD_TRIGGER:
      return addTrigger(state, action);
    case EDIT_TRIGGER:
      return editTrigger(state, action);
    case MOVE_TRIGGER:
      return moveTrigger(state, action);
    case RESIZE_TRIGGER:
      return resizeTrigger(state, action);
    case REMOVE_TRIGGER:
      return removeTrigger(state, action);
    case REMOVE_TRIGGER_AT:
      return removeTriggerAt(state, action);
    case PAINT_COLLISION_TILE:
      return paintCollision(state, action);
    case PAINT_COLLISION_LINE:
      return paintCollision(state, action);
    case PAINT_COLLISION_FILL:
      return paintCollision(state, action);         
    case PAINT_COLOR_TILE:
      return paintColor(state, action);
    case PAINT_COLOR_LINE:
      return paintColor(state, action);
    case PAINT_COLOR_FILL:
      return paintColor(state, action);              
    case EDIT_PLAYER_START_AT:
      return editPlayerStartAt(state, action);
    case EDIT_SCENE_EVENT_DESTINATION_POSITION:
      return editSceneEventDestinationPosition(state, action);
    case EDIT_ACTOR_EVENT_DESTINATION_POSITION:
      return editActorEventDestinationPosition(state, action);
    case EDIT_TRIGGER_EVENT_DESTINATION_POSITION:
      return editTriggerEventDestinationPosition(state, action);
    case RENAME_VARIABLE:
      return renameVariable(state, action);
    case ADD_PALETTE:
      return addPalette(state, action);
    case EDIT_PALETTE:
      return editPalette(state, action);
    case REMOVE_PALETTE:
      return removePalette(state, action);      
    case RELOAD_ASSETS:
      return reloadAssets(state, action);
    default:
      return state;
  }
}
