import initialState from "./initialState";
import {
  PROJECT_LOAD_SUCCESS,
  SPRITE_LOAD_SUCCESS,
  SPRITE_REMOVE,
  BACKGROUND_LOAD_SUCCESS,
  BACKGROUND_REMOVE,
  MUSIC_LOAD_SUCCESS,
  MUSIC_REMOVE,
  ADD_SCENE,
  MOVE_SCENE,
  EDIT_SCENE,
  REMOVE_SCENE,
  ADD_ACTOR,
  MOVE_ACTOR,
  EDIT_ACTOR,
  REMOVE_ACTOR,
  REMOVE_ACTOR_AT,
  ADD_COLLISION_TILE,
  REMOVE_COLLISION_TILE,
  ADD_TRIGGER,
  REMOVE_TRIGGER,
  REMOVE_TRIGGER_AT,
  RESIZE_TRIGGER,
  EDIT_TRIGGER,
  MOVE_TRIGGER,
  RENAME_VARIABLE,
  EDIT_PROJECT,
  EDIT_PROJECT_SETTINGS,
  EDIT_PLAYER_START_AT
} from "../actions/actionTypes";
import deepmerge from "deepmerge";
import uuid from "uuid/v4";
import clamp from "../lib/helpers/clamp";

const MAX_ACTORS = 7;
const MAX_TRIGGERS = 7;
const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;

const sortFilename = (a, b) => {
  if (a.filename > b.filename) return 1;
  if (a.filename < b.filename) return -1;
  return 0;
};

const sortRecent = (a, b) => {
  if (a._v > b._v) return -1;
  if (a._v < b._v) return 1;
  return 0;
};

export default function project(state = initialState.project, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS:
      return deepmerge(state, action.data);
    case SPRITE_REMOVE:
      return {
        ...state,
        spriteSheets: state.spriteSheets.filter(spriteSheet => {
          return spriteSheet.filename !== action.filename;
        })
      };
    case SPRITE_LOAD_SUCCESS:
      const currentSprite = state.spriteSheets.find(
        sprite => sprite.filename === action.data.filename
      );
      return {
        ...state,
        spriteSheets: []
          .concat(
            state.spriteSheets.filter(spriteSheet => {
              return spriteSheet.filename !== action.data.filename;
            }),
            {
              ...action.data,
              id: currentSprite ? currentSprite.id : action.data.id
            }
          )
          .sort(sortFilename)
      };
    case BACKGROUND_REMOVE:
      return {
        ...state,
        backgrounds: state.backgrounds.filter(background => {
          return background.filename !== action.filename;
        })
      };
    case BACKGROUND_LOAD_SUCCESS:
      const currentBackground = state.backgrounds.find(
        background => background.filename === action.data.filename
      );
      return {
        ...state,
        backgrounds: []
          .concat(
            state.backgrounds.filter(background => {
              return background.filename !== action.data.filename;
            }),
            {
              ...action.data,
              id: currentBackground ? currentBackground.id : action.data.id
            }
          )
          .sort(sortFilename)
      };
    case MUSIC_REMOVE:
      return {
        ...state,
        music: state.music.filter(music => {
          return music.filename !== action.filename;
        })
      };
    case MUSIC_LOAD_SUCCESS:
      const currentMusic = state.music.find(
        music => music.filename === action.data.filename
      );
      return {
        ...state,
        music: []
          .concat(
            state.music.filter(music => {
              return music.filename !== action.data.filename;
            }),
            {
              ...action.data,
              id: currentMusic ? currentMusic.id : action.data.id
            }
          )
          .sort(sortFilename)
      };
    case ADD_SCENE:
      return {
        ...state,
        scenes: [].concat(state.scenes, {
          id: action.id,
          name: "Scene " + (state.scenes.length + 1),
          backgroundId:
            state.backgrounds &&
            state.backgrounds[0] &&
            state.backgrounds.slice().sort(sortRecent)[0].id,
          x: Math.max(MIN_SCENE_X, action.x),
          y: Math.max(MIN_SCENE_Y, action.y),
          width: 32,
          height: 32,
          actors: [],
          triggers: [],
          collisions: []
        })
      };
    case MOVE_SCENE:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            x: Math.max(MIN_SCENE_X, scene.x + action.moveX),
            y: Math.max(MIN_SCENE_Y, scene.y + action.moveY)
          };
        })
      };
    case EDIT_SCENE:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }

          // If switched background use collisions from another
          // scene using the background already if available
          // otherwise make empty collisions array of
          // the correct size
          let newCollisions;
          let newActors;
          let newTriggers;
          if (action.values.backgroundId) {
            const otherScene = state.scenes.find(otherScene => {
              return otherScene.backgroundId === action.values.backgroundId;
            });
            const background = state.backgrounds.find(
              background => background.id === action.values.backgroundId
            );

            if (otherScene) {
              newCollisions = otherScene.collisions;
            } else {
              let collisionsSize = Math.ceil((background.width * background.height) / 8);
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
          }

          return Object.assign(
            {},
            scene,
            action.values,
            action.values.backgroundId && {
              collisions: newCollisions || [],
              actors: newActors,
              triggers: newTriggers
            }
          );
        })
      };
    case REMOVE_SCENE:
      return {
        ...state,
        scenes: state.scenes.filter(scene => {
          return scene.id !== action.sceneId;
        })
      };
    case ADD_ACTOR:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            actors: []
              .concat(
                {
                  id: uuid(),
                  spriteSheetId:
                    state.spriteSheets[0] && state.spriteSheets[0].id,
                  x: action.x,
                  y: action.y,
                  movementType: "static",
                  direction: "down"
                },
                scene.actors
              )
              .slice(-MAX_ACTORS)
          };
        })
      };
    case MOVE_ACTOR:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          const sceneImage = state.backgrounds.find(
            background => background.id === scene.backgroundId
          );
          return {
            ...scene,
            actors: scene.actors.map((actor, index) => {
              if (index !== action.index) {
                return actor;
              }
              return {
                ...actor,
                x: clamp(actor.x + action.moveX, 0, sceneImage.width - 2),
                y: clamp(actor.y + action.moveY, 0, sceneImage.height - 1)
              };
            })
          };
        })
      };
    case EDIT_ACTOR:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            actors: scene.actors.map((actor, index) => {
              if (index !== action.index) {
                return actor;
              }
              if (action.values.spriteSheetId) {
                const newSprite = state.spriteSheets.find(
                  s => s.id === action.values.spriteSheetId
                );
                // If new sprite only has one frame reset movement type back to static
                if (newSprite.numFrames === 1) {
                  return {
                    ...actor,
                    ...action.values,
                    movementType: "static"
                  };
                }
                const oldSprite = state.spriteSheets.find(
                  s => s.id === actor.spriteSheetId
                );
                // If previous sprite had only one frame reset movement type to face interaction
                if (oldSprite.numFrames === 1) {
                  return {
                    ...actor,
                    ...action.values,
                    movementType: "faceInteraction"
                  };
                }
              }
              return {
                ...actor,
                ...action.values
              };
            })
          };
        })
      };
    case REMOVE_ACTOR:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            actors: scene.actors.filter((actor, index) => {
              return action.index !== index;
            })
          };
        })
      };
    case REMOVE_ACTOR_AT:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            actors: scene.actors.filter(actor => {
              return !(
                (actor.x === action.x || actor.x === action.x - 1) &&
                (actor.y === action.y || actor.y === action.y + 1)
              );
            })
          };
        })
      };
    case ADD_COLLISION_TILE: {
      console.log("ADD_COLLISION_TILE", {
        a: state,
        b: state.scenes
      });

      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }

          const background =
            scene.backgroundId &&
            state.backgrounds.find(background => background.id === scene.backgroundId);
          if (!background) {
            return scene;
          }

          let collisionsSize = Math.ceil((background.width * background.height) / 8);
          const collisions = scene.collisions.slice(0, collisionsSize);

          if (collisions.length < collisionsSize) {
            for (let i = collisions.length; i < collisionsSize; i++) {
              collisions[i] = 0;
            }
          }

          const collisionIndex = background.width * action.y + action.x;
          const collisionByteIndex = collisionIndex >> 3;
          const collisionByteOffset = collisionIndex & 7;
          const collisionByteMask = 1 << collisionByteOffset;
          collisions[collisionByteIndex] |= collisionByteMask;

          return {
            ...scene,
            collisions
          };
        })
      };
    }
    case REMOVE_COLLISION_TILE: {
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }

          const background =
            scene.backgroundId &&
            state.backgrounds.find(background => background.id === scene.backgroundId);
          if (!background) {
            return scene;
          }

          let collisionsSize = Math.ceil((background.width * background.height) / 8);
          const collisions = scene.collisions.slice(0, collisionsSize);

          if (collisions.length < collisionsSize) {
            for (let i = collisions.length; i < collisionsSize; i++) {
              collisions[i] = 0;
            }
          }

          const collisionIndex = background.width * action.y + action.x;
          const collisionByteIndex = collisionIndex >> 3;
          const collisionByteOffset = collisionIndex & 7;
          const collisionByteMask = 1 << collisionByteOffset;
          collisions[collisionByteIndex] &= ~collisionByteMask;

          return {
            ...scene,
            collisions
          };
        })
      };
    }
    case ADD_TRIGGER:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            triggers: []
              .concat(
                {
                  id: uuid(),
                  x: action.x,
                  y: action.y,
                  width: 1,
                  height: 1,
                  trigger: "walk"
                },
                scene.triggers
              )
              .slice(-MAX_TRIGGERS)
          };
        })
      };
    case REMOVE_TRIGGER:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            triggers: scene.triggers.filter((trigger, index) => {
              return action.index !== index;
            })
          };
        })
      };
    case REMOVE_TRIGGER_AT: {
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            triggers: scene.triggers.filter(trigger => {
              return (
                action.x < trigger.x ||
                action.x >= trigger.x + trigger.width ||
                action.y < trigger.y ||
                action.y >= trigger.y + trigger.height
              );
            })
          };
        })
      };
    }
    case RESIZE_TRIGGER:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            triggers: scene.triggers.map((trigger, index) => {
              if (index !== action.index) {
                return trigger;
              }
              return {
                ...trigger,
                x: Math.min(action.x, action.startX),
                y: Math.min(action.y, action.startY),
                width: Math.abs(action.x - action.startX) + 1,
                height: Math.abs(action.y - action.startY) + 1
              };
            })
          };
        })
      };
    case EDIT_TRIGGER:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          return {
            ...scene,
            triggers: scene.triggers.map((trigger, index) => {
              if (index !== action.index) {
                return trigger;
              }
              return {
                ...trigger,
                ...action.values
              };
            })
          };
        })
      };
    case MOVE_TRIGGER:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.sceneId) {
            return scene;
          }
          const sceneImage = state.backgrounds.find(
            background => background.id === scene.backgroundId
          );
          return {
            ...scene,
            triggers: scene.triggers.map((trigger, index) => {
              if (index !== action.index) {
                return trigger;
              }
              return {
                ...trigger,
                x: clamp(
                  trigger.x + action.moveX,
                  0,
                  sceneImage.width - trigger.width
                ),
                y: clamp(
                  trigger.y + action.moveY,
                  0,
                  sceneImage.height - trigger.height
                )
              };
            })
          };
        })
      };
    case RENAME_VARIABLE: {
      return {
        ...state,
        variables: [].concat(
          state.variables.filter(variable => {
            return variable.id !== action.variableId;
          }),
          action.name
            ? {
                id: action.variableId,
                name: action.name
              }
            : []
        )
      };
    }
    case EDIT_PROJECT:
      return {
        ...state,
        ...action.values
      };
    case EDIT_PROJECT_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.values
        }
      };
    case EDIT_PLAYER_START_AT:
      return {
        ...state,
        settings: {
          ...state.settings,
          startSceneId: action.sceneId,
          startX: action.x,
          startY: action.y
        }
      };
    default:
      return state;
  }
}
