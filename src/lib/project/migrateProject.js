/* eslint-disable no-nested-ternary */
import { indexBy } from "../helpers/array";
import { mapScenesEvents, mapEvents } from "../helpers/eventSystem";
import generateRandomWalkScript from "../movement/generateRandomWalkScript";
import generateRandomLookScript from "../movement/generateRandomLookScript";
import { COLLISION_ALL } from "../../consts";

const indexById = indexBy("id");

export const LATEST_PROJECT_VERSION = "2.0.0";

const migrateProject = project => {
  let data = { ...project };
  let version = project._version || "1.0.0";
  if (version === "1") {
    version = "1.0.0";
  }

  // Migrate from 1.0.0 to 1.1.0
  if (version === "1.0.0") {
    data = migrateFrom1To110Scenes(data);
    data = migrateFrom1To110Actors(data);
    data = migrateFrom1To110Collisions(data);
    version = "1.1.0";
  }
  if (version === "1.1.0") {
    data = migrateFrom110To120Events(data);
    version = "1.2.0";
  }
  if (version === "1.2.0") {
    data = migrateFrom120To200Scenes(data);
    data = migrateFrom120To200Actors(data);
    data = migrateFrom120To200Events(data);
    data = migrateFrom120To200Collisions(data);
    version = "2.0.0";
  }

  if (process.env.NODE_ENV !== "production") {
    if (version === "2.0.0") {
      data = migrateFrom120To200Collisions(data);
    }
  }

  data._version = version;
  return data;
};

/*
 * In version 1 Actors using sprites with 3 or 6 frames and movementType static
 * would use have a direction input but in 1.1.0 they now have a frame selector
 * to match other static sprites. This function migrates all static actors
 * to the new format
 */
const migrateFrom1To110Actors = data => {
  const actorDefaultFrame = actor => {
    const actorSprite = data.spriteSheets.find(
      sprite => sprite.id === actor.spriteSheetId
    );
    const isActor = actorSprite.numFrames === 3 || actorSprite.numFrames === 6;
    const framesPerDirection = actorSprite.numFrames === 6 ? 2 : 1;

    if (actor.frame !== undefined) {
      return actor.frame;
    }
    if (isActor) {
      if (actor.direction === "down") {
        return 0;
      }
      if (actor.direction === "up") {
        return framesPerDirection;
      }
      return framesPerDirection * 2;
    }
    return 0;
  };

  return {
    ...data,
    scenes: data.scenes.map(scene => {
      return {
        ...scene,
        actors: scene.actors.map(actor => {
          if (
            actor.movementType === "static" ||
            actor.movementType === "Static"
          ) {
            return {
              ...actor,
              direction: "down",
              movementType: "static",
              frame: actorDefaultFrame(actor)
            };
          }
          return actor;
        })
      };
    })
  };
};

/*
 * In version 1 scenes would store collisions for tiles outside of their boundaries
 * this function removes the excess data allowing collsions to work again on old scenes
 */
const migrateFrom1To110Collisions = data => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map(scene => {
      const background = backgroundLookup[scene.backgroundId];
      const collisionsSize = background
        ? Math.ceil((background.width * background.height) / 8)
        : 0;
      const collisions = scene.collisions || [];
      if (!background || collisions.length !== collisionsSize) {
        return {
          ...scene,
          collisions: collisions.slice(0, collisionsSize)
        };
      }
      return scene;
    })
  };
};

/*
 * In version 1 scenes would not contain their widths and heights. To get the width or height
 * of a scene you needed to manually find the background image of the scene and get the
 * dimensions of that instead. This function reads the current background images set in a
 * scene and stores the correct widths and heights
 */
const migrateFrom1To110Scenes = data => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map(scene => {
      const background = backgroundLookup[scene.backgroundId];
      if (background) {
        return {
          ...scene,
          width: background.width,
          height: background.height
        };
      }
      return scene;
    })
  };
};

/*
 * Version 1.2.0 allows events to have multiple named child paths rather
 * than just true/false allowing custom events to be created with more
 * than two conditional paths. Also all old math events have been deprectated
 * since 1.1.0 and will now be migrated to using the variable math event.
 */
export const migrateFrom110To120Event = event => {
  let newEvent = event;
  // Migrate math events
  const operationLookup = {
    EVENT_MATH_ADD: "add",
    EVENT_MATH_SUB: "sub",
    EVENT_MATH_MUL: "mul",
    EVENT_MATH_DIV: "div",
    EVENT_MATH_MOD: "mod",
    EVENT_MATH_ADD_VALUE: "add",
    EVENT_MATH_SUB_VALUE: "sub",
    EVENT_MATH_MUL_VALUE: "mul",
    EVENT_MATH_DIV_VALUE: "div",
    EVENT_MATH_MOD_VALUE: "mod",
    EVENT_COPY_VALUE: "set",
    EVENT_SET_RANDOM_VALUE: "set"
  };
  const otherLookup = {
    EVENT_MATH_ADD: "val",
    EVENT_MATH_SUB: "val",
    EVENT_MATH_MUL: "val",
    EVENT_MATH_DIV: "val",
    EVENT_MATH_MOD: "val",
    EVENT_MATH_ADD_VALUE: "var",
    EVENT_MATH_SUB_VALUE: "var",
    EVENT_MATH_MUL_VALUE: "var",
    EVENT_MATH_DIV_VALUE: "var",
    EVENT_MATH_MOD_VALUE: "var",
    EVENT_COPY_VALUE: "var",
    EVENT_SET_RANDOM_VALUE: "rnd"
  };
  const oldMathEvents = Object.keys(operationLookup);
  if (oldMathEvents.indexOf(newEvent.command) > -1) {
    newEvent = {
      id: newEvent.id,
      command: "EVENT_VARIABLE_MATH",
      args: {
        vectorX: newEvent.args.variable || newEvent.args.vectorX,
        operation: operationLookup[newEvent.command],
        other: otherLookup[newEvent.command],
        vectorY: newEvent.args.variable || newEvent.args.vectorY,
        value: newEvent.args.value || 0,
        minValue: 0,
        maxValue:
          newEvent.args.maxValue !== undefined ? newEvent.args.maxValue : 255
      }
    };
  }
  // Migrate camera speed values
  if (
    newEvent.args &&
    (newEvent.command === "EVENT_CAMERA_MOVE_TO" ||
      newEvent.command === "EVENT_CAMERA_LOCK")
  ) {
    const speedMap = {
      "0": "0",
      "1": "2",
      "2": "3",
      "3": "4",
      "4": "5",
      "5": "5"
    };
    if (speedMap[newEvent.args.speed]) {
      newEvent.args.speed = speedMap[newEvent.args.speed];
    }
  }
  // Migrate conditionals
  if (newEvent.true || newEvent.false) {
    return {
      ...newEvent,
      children: Object.assign(
        {},
        newEvent.true && {
          true: mapEvents(newEvent.true, migrateFrom110To120Event)
        },
        newEvent.false && {
          false: mapEvents(newEvent.false, migrateFrom110To120Event)
        }
      ),
      true: undefined,
      false: undefined
    };
  }
  // Migrate visibility conditions to support multiple ones
  if (newEvent.showIfKey || newEvent.showIfValue) {
    return {
      ...newEvent,
      conditions: [
        {
          key: newEvent.showIfKey,
          eq: newEvent.showIfValue
        }
      ],
      showIfKey: undefined,
      showIfValue: undefined
    }
  }
  return newEvent;
};

const migrateFrom110To120Events = data => {
  return {
    ...data,
    scenes: mapScenesEvents(data.scenes, migrateFrom110To120Event)
  };
};

/*
 * In version 1.2.0 and below scene width/height was mostly a calculated
 * from the image width and height. In version 2.0.0 the scene values are
 * kept up to date and are the single source of truth for scene dimensions
 */
const migrateFrom120To200Scenes = (data) => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      const background = backgroundLookup[scene.backgroundId];
      return {
        ...scene,
        width: background && background.width || 32,
        height: background && background.height || 32,
      };
    }),
  };
};

/*
 * In version 1.2.0 Actors had a movementType field, in 2.0.0 movement
 * is now handled with movement scripts and whether an actor treats it's
 * spritesheet as static or an actor sprite is set using the spriteType field
 */
const migrateFrom120To200Actors = (data) => {
  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        actors: scene.actors.map((actor) => {
          let updateScript;
          if(actor.movementType === "randomFace") {
            updateScript = generateRandomLookScript();
          } else if (actor.movementType === "randomWalk") {
            updateScript = generateRandomWalkScript();
          }
          return {
            ...actor,
            spriteType: actor.movementType === "static" ? "static" : "actor",
            updateScript
          };
        }),
      };
    }),
  };
};

/*
 * Version 2.0.0 allows sound effects to play in background rather than
 * pausing the script until the sound has finished playing, wait flag
 * needs to be added to all sound scripts to make old functionality the default
 */
export const migrateFrom120To200Event = event => {
  if (event.args && event.command === "EVENT_SOUND_PLAY_EFFECT") {
    return {
      ...event,
      args: {
        ...event.args,
        wait: true
      }
    }
  }
  if(event.args && event.command === "EVENT_ACTOR_MOVE_TO_VALUE") {
    return {
      ...event,
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: event.args.actorId,
        x: {
          type: "variable",
          value: event.args.vectorX,
        },
        y: {
          type: "variable",
          value: event.args.vectorY,
        },
        useCollisions: false,
        verticalFirst: false,
      }
    };
  }
  if(event.args && event.command === "EVENT_ACTOR_MOVE_TO") {
    return {
      ...event,
      args: {
        actorId: event.args.actorId,
        x: {
          type: "number",
          value: event.args.x,
        },
        y: {
          type: "number",
          value: event.args.y,
        },
        useCollisions: false,
        verticalFirst: false,
      }
    };
  } 
  if(event.args && event.command === "EVENT_ACTOR_SET_POSITION_TO_VALUE") {
    return {
      ...event,
      command: "EVENT_ACTOR_SET_POSITION",
      args: {
        actorId: event.args.actorId,
        x: {
          type: "variable",
          value: event.args.vectorX,
        },
        y: {
          type: "variable",
          value: event.args.vectorY,
        }
      }
    };
  }
  if(event.args && event.command === "EVENT_ACTOR_SET_POSITION") {
    return {
      ...event,
      args: {
        actorId: event.args.actorId,
        x: {
          type: "number",
          value: event.args.x,
        },
        y: {
          type: "number",
          value: event.args.y,
        }
      }
    };
  }  
  if(event.args && event.command === "EVENT_ACTOR_SET_DIRECTION_TO_VALUE") {
    return {
      ...event,
      command: "EVENT_ACTOR_SET_DIRECTION",
      args: {
        actorId: event.args.actorId,
        direction: {
          type: "variable",
          value: event.args.variable,
        }
      }
    };
  }  
  if(event.args && event.command === "EVENT_ACTOR_SET_DIRECTION") {
    return {
      ...event,
      args: {
        actorId: event.args.actorId,
        direction: {
          type: "direction",
          value: event.args.direction,
        }
      }
    };
  }
  if(event.args && event.command === "EVENT_ACTOR_SET_FRAME_TO_VALUE") {
    return {
      ...event,
      command: "EVENT_ACTOR_SET_FRAME",
      args: {
        actorId: event.args.actorId,
        frame: {
          type: "variable",
          value: event.args.variable,
        }
      }
    };
  }  
  if(event.args && event.command === "EVENT_ACTOR_SET_FRAME") {
    return {
      ...event,
      args: {
        actorId: event.args.actorId,
        frame: {
          type: "number",
          value: event.args.frame,
        }
      }
    };
  }
  if(event.args && event.command === "EVENT_SET_VALUE") {
    return {
      ...event,
      args: {
        variable: event.args.variable,
        value: {
          type: "number",
          value: event.args.value,          
        }
      }
    }
  }
  if(event.args && event.command === "EVENT_SET_INPUT_SCRIPT") {
    return {
      ...event,
      args: {
        ...event.args,
        persist: true
      }
    }
  }
  
  return event;
};

const migrateFrom120To200Events = data => {
  return {
    ...data,
    scenes: mapScenesEvents(data.scenes, migrateFrom120To200Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapEvents(customEvent.script, migrateFrom120To200Event)
      }
    })
  };
};

/*
 * In version 1.2.0 and below scenes collisions where stored as one bit per tile
 * since version 2.0.0 these are now stored as a byte per tile allowing single
 * direction collisions and tile props like ladders. A solid collision is represented
 * as the value 0xF
 */
export const migrateFrom120To200Collisions = data => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map(scene => {
      const background = backgroundLookup[scene.backgroundId];
      const collisionsSize = background
        ? Math.ceil(background.width * background.height)
        : 0;
      const oldCollisions = scene.collisions || [];

      // If collisions already migrated for this scene don't migrate them again
      if (oldCollisions.length === collisionsSize) {
        return {
          ...scene,
          collisions: oldCollisions
        }
      }

      const collisions = [];

      if (background && oldCollisions.length === (collisionsSize / 8)) {
        for (let x = 0; x < background.width; x++) {
          for (let y = 0; y < background.height; y++) {
            const i = x + (y * background.width);
            const byteIndex = i >> 3;
            const byteOffset = i & 7;
            const byteMask = 1 << byteOffset;          
            if(oldCollisions[byteIndex] & byteMask) {
              collisions[i] = COLLISION_ALL;
            } else {
              collisions[i] = 0;
            }
          }
        }
      }

      return {
        ...scene,
        collisions: collisions.slice(0, collisionsSize)
      };
    })
  };
};

export default migrateProject;
