import initialState from "./initialState";
import {
  PROJECT_LOAD_SUCCESS,
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
  RENAME_FLAG,
  EDIT_PROJECT,
  EDIT_PROJECT_SETTINGS,
  ZOOM_IN,
  ZOOM_OUT,
  ZOOM_RESET
} from "../actions/actionTypes";
import deepmerge from "deepmerge";

export default function project(state = initialState.project, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS:
      return deepmerge(state, action.data);
    case ADD_SCENE:
      return {
        ...state,
        scenes: [].concat(state.scenes, {
          id: action.id,
          name: "New Scene " + state.scenes.length,
          image: null,
          x: Math.max(50, action.x),
          y: Math.max(10, action.y),
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
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            x: Math.max(50, map.x + action.moveX),
            y: Math.max(10, map.y + action.moveY)
          };
        })
      };
    case EDIT_SCENE:
      return {
        ...state,
        scenes: state.scenes.map(scene => {
          if (scene.id !== action.mapId) {
            return scene;
          }

          // If switched image use collisions from another
          // scene using the image already if available
          // otherwise make empty collisions array of
          // the correct size
          let newCollisions;
          if (action.values.imageId) {
            const otherScene = state.scenes.find(otherScene => {
              return otherScene.imageId === action.values.imageId;
            });
            if (otherScene) {
              newCollisions = otherScene.collisions;
            } else {
              const image = state.images.find(
                image => image.id === action.values.imageId
              );
              let collisionsSize = Math.ceil((image.width * image.height) / 8);
              newCollisions = [];
              for (let i = 0; i < collisionsSize; i++) {
                newCollisions[i] = 0;
              }
            }
          }

          return Object.assign(
            {},
            scene,
            action.values,
            action.values.imageId && {
              collisions: newCollisions || []
            }
          );
        })
      };
    case REMOVE_SCENE:
      return {
        ...state,
        scenes: state.scenes.filter(map => {
          return map.id !== action.mapId;
        })
      };
    case ADD_ACTOR:
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            actors: [].concat(
              {
                id: action.id,
                spriteSheetId:
                  state.spriteSheets[0] && state.spriteSheets[0].id,
                x: action.x,
                y: action.y,
                movementType: "static",
                direction: "down"
              },
              map.actors
            )
          };
        })
      };
    case MOVE_ACTOR:
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            actors: map.actors.map((actor, index) => {
              if (index !== action.index) {
                return actor;
              }
              return {
                ...actor,
                x: actor.x + action.moveX,
                y: actor.y + action.moveY
              };
            })
          };
        })
      };
    case EDIT_ACTOR:
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            actors: map.actors.map((actor, index) => {
              if (index !== action.index) {
                return actor;
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
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            actors: map.actors.filter((actor, index) => {
              return action.index !== index;
            })
          };
        })
      };
    case REMOVE_ACTOR_AT:
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            actors: map.actors.filter(actor => {
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
        a: state
      });

      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }

          const image =
            map.imageId && state.images.find(image => image.id === map.imageId);
          if (!image) {
            return map;
          }

          let collisionsSize = Math.ceil((image.width * image.height) / 8);
          const collisions = map.collisions.slice(0, collisionsSize);

          if (collisions.length < collisionsSize) {
            for (let i = collisions.length; i < collisionsSize; i++) {
              collisions[i] = 0;
            }
          }

          const collisionIndex = image.width * action.y + action.x;
          const collisionByteIndex = collisionIndex >> 3;
          const collisionByteOffset = collisionIndex & 7;
          const collisionByteMask = 1 << collisionByteOffset;
          collisions[collisionByteIndex] |= collisionByteMask;

          return {
            ...map,
            collisions
          };
        })
      };
    }
    case REMOVE_COLLISION_TILE: {
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }

          const image =
            map.imageId && state.images.find(image => image.id === map.imageId);
          if (!image) {
            return map;
          }

          let collisionsSize = Math.ceil((image.width * image.height) / 8);
          const collisions = map.collisions.slice(0, collisionsSize);

          if (collisions.length < collisionsSize) {
            for (let i = collisions.length; i < collisionsSize; i++) {
              collisions[i] = 0;
            }
          }

          const collisionIndex = image.width * action.y + action.x;
          const collisionByteIndex = collisionIndex >> 3;
          const collisionByteOffset = collisionIndex & 7;
          const collisionByteMask = 1 << collisionByteOffset;
          collisions[collisionByteIndex] &= ~collisionByteMask;

          return {
            ...map,
            collisions
          };
        })
      };
    }
    case ADD_TRIGGER:
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            triggers: [].concat(
              {
                x: action.x,
                y: action.y,
                width: 1,
                height: 1,
                trigger: "walk"
              },
              map.triggers
            )
          };
        })
      };
    case REMOVE_TRIGGER:
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            triggers: map.triggers.filter((trigger, index) => {
              return action.index !== index;
            })
          };
        })
      };
    case REMOVE_TRIGGER_AT: {
      return {
        ...state,
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            triggers: map.triggers.filter(trigger => {
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
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            triggers: map.triggers.map((trigger, index) => {
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
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            triggers: map.triggers.map((trigger, index) => {
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
        scenes: state.scenes.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            triggers: map.triggers.map((trigger, index) => {
              if (index !== action.index) {
                return trigger;
              }
              return {
                ...trigger,
                x: trigger.x + action.moveX,
                y: trigger.y + action.moveY
              };
            })
          };
        })
      };
    case RENAME_FLAG: {
      return {
        ...state,
        flags: [].concat(
          state.flags.filter(flag => {
            return flag.id !== action.flagId;
          }),
          action.name
            ? {
              id: action.flagId,
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
    case ZOOM_IN:
      return {
        ...state,
        settings: {
          ...state.settings,
          zoom: Math.min(800, state.settings.zoom * 2)
        }
      };
    case ZOOM_OUT:
      return {
        ...state,
        settings: {
          ...state.settings,
          zoom: Math.max(25, state.settings.zoom / 2)
        }
      };
    case ZOOM_RESET:
      return {
        ...state,
        settings: {
          ...state.settings,
          zoom: 100
        }
      };
    default:
      return state;
  }
}
