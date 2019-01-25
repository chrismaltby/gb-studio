import initialState from "./initialState";
import {
  PROJECT_LOAD_SUCCESS,
  ADD_MAP,
  MOVE_MAP,
  EDIT_MAP,
  REMOVE_MAP,
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
  EDIT_PROJECT
} from "../actions/actionTypes";
import uuid from "../lib/uuid";

export default function world(state = initialState.world, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS:
      return action.data;
    case ADD_MAP:
      return {
        ...state,
        maps: [].concat(state.maps, {
          id: uuid(),
          name: "New Map",
          image: null,
          x: action.x,
          y: action.y,
          width: 32,
          height: 32,
          actors: [],
          triggers: [],
          collisions: []
        })
      };
    case MOVE_MAP:
      return {
        ...state,
        maps: state.maps.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            x: map.x + action.moveX,
            y: map.y + action.moveY
          };
        })
      };
    case EDIT_MAP:
      return {
        ...state,
        maps: state.maps.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            ...action.values
          };
        })
      };
    case REMOVE_MAP:
      return {
        ...state,
        maps: state.maps.filter(map => {
          return map.id !== action.mapId;
        })
      };
    case ADD_ACTOR:
      return {
        ...state,
        maps: state.maps.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }
          return {
            ...map,
            actors: [].concat(
              {
                id: uuid(),
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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
      return {
        ...state,
        maps: state.maps.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }

          const image =
            map.imageId && state.images.find(image => image.id === map.imageId);
          if (!image) {
            return map;
          }

          let collisions = [];
          const length = image.width * image.height;
          for (let i = 0; i < length; i++) {
            collisions[i] =
              map.collisions[i] || i === action.x + action.y * image.width;
          }

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
        maps: state.maps.map(map => {
          if (map.id !== action.mapId) {
            return map;
          }

          const image =
            map.imageId && state.images.find(image => image.id === map.imageId);
          if (!image) {
            return map;
          }

          let collisions = [];
          const length = image.width * image.height;
          for (let i = 0; i < length; i++) {
            collisions[i] =
              i !== action.x + action.y * image.width && map.collisions[i];
          }

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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
        maps: state.maps.map(map => {
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
    default:
      return state;
  }
}
