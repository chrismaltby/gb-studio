/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-nested-ternary */
import keyBy from "lodash/keyBy";
import { filterScenesEvents, filterEvents } from "lib/helpers/eventSystem";
import generateRandomWalkScript from "lib/movement/generateRandomWalkScript";
import generateRandomLookScript from "lib/movement/generateRandomLookScript";
import {
  COLLISION_ALL,
  DMG_PALETTE,
  EVENT_END,
  projectTemplatesRoot,
} from "consts";
import uuid from "uuid";
import { copySync, chmodSync } from "fs-extra";
import uniq from "lodash/uniq";
import { toValidSymbol } from "shared/lib/helpers/symbols";
import {
  mapScenesScript,
  mapScript,
  walkScenesScripts,
  walkScript,
} from "shared/lib/scripts/walk";
import {
  ScriptEventDefs,
  isVariableField,
} from "shared/lib/scripts/scriptDefHelpers";
import type { ProjectData } from "store/features/project/projectActions";
import {
  Actor,
  AvatarData,
  CustomEvent,
  CustomEventVariable,
  EmoteData,
  EngineFieldValue,
  FontData,
  Scene,
  ScriptEventArgs,
  ScriptEvent,
  SpriteAnimationData,
  SpriteAnimationType,
  SpriteSheetData,
} from "shared/lib/entities/entitiesTypes";
import {
  isUnionValue,
  isUnionVariableValue,
} from "shared/lib/entities/entitiesHelpers";

const indexById = <T>(arr: T[]) => keyBy(arr, "id");

export const LATEST_PROJECT_VERSION = "3.3.0";
export const LATEST_PROJECT_MINOR_VERSION = "2";

const ensureProjectAssetSync = (
  relativePath: string,
  { projectRoot }: { projectRoot: string }
) => {
  const projectPath = `${projectRoot}/${relativePath}`;
  const defaultPath = `${projectTemplatesRoot}/gbhtml/${relativePath}`;
  try {
    copySync(defaultPath, projectPath, {
      overwrite: false,
      errorOnExist: true,
    });
    chmodSync(projectPath, 0o644);
  } catch (e) {
    // Don't need to catch this, if it failed then the file already exists
    // and we can safely continue.
  }
  return `${projectPath}`;
};

/*
 * Helper function to make sure that all migrated functions
 * include the original metadata such as label text and comment status
 */
const generateMigrateMeta =
  <T extends { args?: ScriptEventArgs }>(event: T) =>
  (newEvent: T): T => {
    return {
      ...newEvent,
      args: {
        ...newEvent.args,
        __comment: event.args?.__comment,
        __label: event.args?.__label,
      },
    };
  };

type ProjectDataV1 = Omit<ProjectData, "spriteSheets" | "scenes"> & {
  spriteSheets: (SpriteSheetData & { numFrames: number })[];
  scenes: (Omit<Scene, "actors"> & {
    actors: (Actor & { movementType?: string })[];
  })[];
};

/*
 * In version 1 Actors using sprites with 3 or 6 frames and movementType static
 * would use have a direction input but in 1.1.0 they now have a frame selector
 * to match other static sprites. This function migrates all static actors
 * to the new format
 */
export const migrateFrom1To110Actors = (data: ProjectDataV1): ProjectData => {
  const actorDefaultFrame = (actor: any) => {
    const actorSprite = data.spriteSheets.find(
      (sprite: any) => sprite.id === actor.spriteSheetId
    );
    const isActor =
      actorSprite?.numFrames === 3 || actorSprite?.numFrames === 6;
    const framesPerDirection = actorSprite?.numFrames === 6 ? 2 : 1;

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
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        actors: scene.actors.map((actor) => {
          if (
            actor.movementType === "static" ||
            actor.movementType === "Static"
          ) {
            return {
              ...actor,
              direction: "down",
              movementType: "static",
              frame: actorDefaultFrame(actor),
            };
          }
          return actor;
        }),
      };
    }),
  };
};

/*
 * In version 1 scenes would store collisions for tiles outside of their boundaries
 * this function removes the excess data allowing collsions to work again on old scenes
 */
export const migrateFrom1To110Collisions = (data: ProjectData): ProjectData => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map((scene: any) => {
      const background = backgroundLookup[scene.backgroundId];
      const collisionsSize = background
        ? Math.ceil((background.width * background.height) / 64)
        : 0;
      const collisions = scene.collisions || [];
      if (!background || collisions.length !== collisionsSize) {
        return {
          ...scene,
          collisions: collisions.slice(0, collisionsSize),
        };
      }
      return scene;
    }),
  };
};

/*
 * In version 1 scenes would not contain their widths and heights. To get the width or height
 * of a scene you needed to manually find the background image of the scene and get the
 * dimensions of that instead. This function reads the current background images set in a
 * scene and stores the correct widths and heights
 */
export const migrateFrom1To110Scenes = (data: any) => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map((scene: any) => {
      const background = backgroundLookup[scene.backgroundId] as any;
      if (background) {
        return {
          ...scene,
          width: background.width,
          height: background.height,
        };
      }
      return scene;
    }),
  };
};

/*
 * Version 1.2.0 allows events to have multiple named child paths rather
 * than just true/false allowing custom events to be created with more
 * than two conditional paths. Also all old math events have been deprectated
 * since 1.1.0 and will now be migrated to using the variable math event.
 */
export const migrateFrom110To120Event = (
  event: ScriptEvent & {
    true?: ScriptEvent[];
    false?: ScriptEvent[];
    showIfKey?: string;
    showIfValue?: unknown;
  }
) => {
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
    EVENT_SET_RANDOM_VALUE: "set",
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
    EVENT_SET_RANDOM_VALUE: "rnd",
  };
  const oldMathEvents = Object.keys(operationLookup);
  if (oldMathEvents.indexOf(newEvent.command) > -1) {
    newEvent = {
      id: newEvent.id,
      command: "EVENT_VARIABLE_MATH",
      args: {
        vectorX: newEvent.args?.variable || newEvent.args?.vectorX,
        operation:
          operationLookup[newEvent.command as keyof typeof operationLookup],
        other: otherLookup[newEvent.command as keyof typeof otherLookup],
        vectorY: newEvent.args?.variable || newEvent.args?.vectorY,
        value: newEvent.args?.value || 0,
        minValue: 0,
        maxValue:
          newEvent.args?.maxValue !== undefined ? newEvent.args?.maxValue : 255,
      },
    };
  }
  // Migrate camera speed values
  if (
    newEvent.args &&
    (newEvent.command === "EVENT_CAMERA_MOVE_TO" ||
      newEvent.command === "EVENT_CAMERA_LOCK")
  ) {
    const speedMap = {
      0: "0",
      1: "2",
      2: "3",
      3: "4",
      4: "5",
      5: "5",
    };
    if (speedMap[newEvent.args?.speed as keyof typeof speedMap]) {
      newEvent.args.speed =
        speedMap[newEvent.args?.speed as keyof typeof speedMap];
    }
  }
  // Migrate conditionals
  if (newEvent.true || newEvent.false) {
    return {
      ...newEvent,
      children: Object.assign(
        {},
        newEvent.true && {
          true: mapScript(newEvent.true, migrateFrom110To120Event),
        },
        newEvent.false && {
          false: mapScript(newEvent.false, migrateFrom110To120Event),
        }
      ),
      true: undefined,
      false: undefined,
    };
  }
  // Migrate visibility conditions to support multiple ones
  if (newEvent.showIfKey || newEvent.showIfValue) {
    return {
      ...newEvent,
      conditions: [
        {
          key: newEvent.showIfKey,
          eq: newEvent.showIfValue,
        },
      ],
      showIfKey: undefined,
      showIfValue: undefined,
    };
  }
  return newEvent;
};

const migrateFrom110To120Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom110To120Event),
  };
};

/*
 * In version 1.2.0 and below scene width/height was mostly a calculated
 * from the image width and height. In version 2.0.0 the scene values are
 * kept up to date and are the single source of truth for scene dimensions
 */
const migrateFrom120To200Scenes = (data: ProjectData): ProjectData => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      const background = backgroundLookup[scene.backgroundId];
      return {
        ...scene,
        width: (background && background.width) || 32,
        height: (background && background.height) || 32,
      };
    }),
  };
};

/*
 * In version 1.2.0 Actors had a movementType field, in 2.0.0 movement
 * is now handled with movement scripts and whether an actor treats it's
 * spritesheet as static or an actor sprite is set using the spriteType field
 * Also actors using static spritesheets now animate while moving unless
 * animation speed is set to "None", this script migrates actors to preserve old default.
 */
export const migrateFrom120To200Actors = (
  data: Omit<ProjectData, "scenes"> & {
    scenes: (Omit<Scene, "actors"> & {
      actors: (Actor & { movementType?: string })[];
    })[];
  }
): ProjectData => {
  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        actors: scene.actors.map((actor) => {
          let updateScript: ScriptEvent[] = [];
          let animSpeed = actor.animSpeed;
          if (actor.movementType === "randomFace") {
            updateScript = generateRandomLookScript();
          } else if (actor.movementType === "randomWalk") {
            updateScript = generateRandomWalkScript();
          } else if (
            actor.movementType === "static" &&
            actor.animate !== true
          ) {
            animSpeed = null;
          }
          return {
            ...actor,
            spriteType: actor.movementType === "static" ? "static" : "actor",
            animSpeed,
            updateScript,
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
export const migrateFrom120To200Event = (event: ScriptEvent): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_SOUND_PLAY_EFFECT") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        wait: true,
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_MOVE_TO_VALUE") {
    return migrateMeta({
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
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_MOVE_TO") {
    return migrateMeta({
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
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_POSITION_TO_VALUE") {
    return migrateMeta({
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
        },
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_POSITION") {
    return migrateMeta({
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
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_DIRECTION_TO_VALUE") {
    return migrateMeta({
      ...event,
      command: "EVENT_ACTOR_SET_DIRECTION",
      args: {
        actorId: event.args.actorId,
        direction: {
          type: "variable",
          value: event.args.variable,
        },
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_DIRECTION") {
    return migrateMeta({
      ...event,
      args: {
        actorId: event.args.actorId,
        direction: {
          type: "direction",
          value: event.args.direction,
        },
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_FRAME_TO_VALUE") {
    return migrateMeta({
      ...event,
      command: "EVENT_ACTOR_SET_FRAME",
      args: {
        actorId: event.args.actorId,
        frame: {
          type: "variable",
          value: event.args.variable,
        },
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_FRAME") {
    return migrateMeta({
      ...event,
      args: {
        actorId: event.args.actorId,
        frame: {
          type: "number",
          value: event.args.frame,
        },
      },
    });
  }
  if (event.args && event.command === "EVENT_SET_VALUE") {
    return migrateMeta({
      ...event,
      args: {
        variable: event.args.variable,
        value: {
          type: "number",
          value: event.args.value,
        },
      },
    });
  }
  if (event.args && event.command === "EVENT_SET_INPUT_SCRIPT") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        persist: true,
      },
    });
  }
  if (event.args && event.command === "EVENT_TEXT_SET_ANIMATION_SPEED") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        allowFastForward: true,
      },
    });
  }
  if (event.args && event.command === "EVENT_PLAYER_SET_SPRITE") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        persist: true,
      },
    });
  }

  return event;
};

const migrateFrom120To200Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom120To200Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom120To200Event),
      };
    }),
  };
};

/*
 * In version 1.2.0 and below scenes collisions where stored as one bit per tile
 * since version 2.0.0 these are now stored as a byte per tile allowing single
 * direction collisions and tile props like ladders. A solid collision is represented
 * as the value 0xF
 */
export const migrateFrom120To200Collisions = (
  data: ProjectData
): ProjectData => {
  const backgroundLookup = indexById(data.backgrounds);

  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      const background = backgroundLookup[scene.backgroundId];
      const collisionsSize = background
        ? Math.ceil(background.width * background.height)
        : 0;
      const oldCollisions = scene.collisions || [];

      // If collisions already migrated for this scene don't migrate them again
      if (oldCollisions.length === collisionsSize) {
        return {
          ...scene,
          collisions: oldCollisions,
        };
      }

      const collisions = [];

      if (background && oldCollisions.length === collisionsSize / 8) {
        for (let x = 0; x < background.width; x++) {
          for (let y = 0; y < background.height; y++) {
            const i = x + y * background.width;
            const byteIndex = i >> 3;
            const byteOffset = i & 7;
            const byteMask = 1 << byteOffset;
            if (oldCollisions[byteIndex] & byteMask) {
              collisions[i] = COLLISION_ALL;
            } else {
              collisions[i] = 0;
            }
          }
        }
      }

      return {
        ...scene,
        collisions: collisions.slice(0, collisionsSize),
      };
    }),
  };
};

/*
 * Version 2.0.0 r1 had no persist field on EVENT_PLAYER_SET_SPRITE
 * this migration updates already migrated events from that release
 * to use the new default
 */
export const migrateFrom200r1To200r2Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_PLAYER_SET_SPRITE") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        persist: true,
      },
    });
  }

  return event;
};

const migrateFrom200r1To200r2Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r1To200r2Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r1To200r2Event),
      };
    }),
  };
};

/*
 * Version 2.0.0 r2 only allowed a script to be attached to
 * a single input at once. This migration updates existing
 * EVENT_SET_INPUT_SCRIPT events to use array values
 */
export const migrateFrom200r2To200r3Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_SET_INPUT_SCRIPT") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        input: Array.isArray(event.args.input)
          ? event.args.input
          : [event.args.input],
      },
    });
  }
  return event;
};

const migrateFrom200r2To200r3Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r2To200r3Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r2To200r3Event),
      };
    }),
  };
};

/*
 * Version 2.0.0 r3 used a separate event for handling updating the
 * fade style, this has now been merged into EVENT_ENGINE_FIELD_SET
 */
export const migrateFrom200r3To200r4Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_FADE_SETTINGS") {
    return migrateMeta({
      ...event,
      command: "EVENT_ENGINE_FIELD_SET",
      args: {
        ...event.args,
        engineFieldKey: "fade_style",
        value: {
          type: "select",
          value: event.args.style === "black" ? 1 : 0,
        },
      },
    });
  }
  return event;
};

const migrateFrom200r3To200r4Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r3To200r4Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r3To200r4Event),
      };
    }),
  };
};

type ProjectDataV200r3 = ProjectData & {
  settings: {
    defaultFadeStyle: string;
  };
};

/*
 * Version 2.0.0 r3 stored the default fade style in settings, this
 * has now been moved to an engine field value
 */
export const migrateFrom200r3To200r4EngineFieldValues = (
  data: ProjectDataV200r3
): ProjectData => {
  return {
    ...data,
    engineFieldValues: ([] as EngineFieldValue[]).concat(
      data.engineFieldValues || [],
      {
        id: "fade_style",
        value: data.settings.defaultFadeStyle === "black" ? 1 : 0,
      }
    ),
  };
};

/*
 * Version 2.0.0 r4 used string values for animSpeed and moveSpeed,
 * animSpeed is now number|null and moveSpeed is number
 */
export const migrateFrom200r4To200r5Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_ACTOR_SET_ANIMATION_SPEED") {
    let speed = event.args.speed;
    if (speed === "") {
      speed = null;
    } else if (speed === undefined) {
      speed = 3;
    } else {
      speed = parseInt(String(speed), 10);
    }
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        speed,
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_MOVEMENT_SPEED") {
    let speed = event.args.speed;
    if (speed === "" || speed === undefined) {
      speed = 1;
    } else {
      speed = parseInt(String(speed), 10);
    }
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        speed,
      },
    });
  }
  if (event.args && event.command === "EVENT_LAUNCH_PROJECTILE") {
    let speed = event.args.speed;
    if (speed === "" || speed === undefined) {
      speed = 2;
    } else {
      speed = parseInt(String(speed), 10);
    }
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        speed,
      },
    });
  }
  return event;
};

const migrateFrom200r4To200r5Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r4To200r5Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r4To200r5Event),
      };
    }),
  };
};

/*
 * Version 2.0.0 r4 used string values for animSpeed and moveSpeed,
 * animSpeed is now number|null and moveSpeed is number
 */
const migrateFrom200r4To200r5Actors = (data: ProjectData): ProjectData => {
  const fixMoveSpeed = (speed: number | undefined) => {
    if (speed === undefined) {
      return 1;
    }
    const parsedSpeed = parseInt(String(speed), 10);
    if (Number.isNaN(parsedSpeed)) {
      return 1;
    }
    return parsedSpeed;
  };

  const fixAnimSpeed = (speed: unknown) => {
    if (speed === "" || speed === null) {
      return null;
    }
    if (speed === undefined) {
      return 3;
    }
    const parsedSpeed = parseInt(String(speed), 10);
    if (Number.isNaN(parsedSpeed)) {
      return 3;
    }
    return parsedSpeed;
  };

  return {
    ...data,
    settings: {
      ...data.settings,
      startMoveSpeed: fixMoveSpeed(data.settings.startMoveSpeed),
      startAnimSpeed: fixAnimSpeed(data.settings.startAnimSpeed),
    },
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        actors: scene.actors.map((actor) => {
          return {
            ...actor,
            moveSpeed: fixMoveSpeed(actor.moveSpeed),
            animSpeed: fixAnimSpeed(actor.animSpeed),
          };
        }),
      };
    }),
  };
};

/*
 * Version 2.0.0 r5 contained a bug where new actors would have an
 * empty array as their collision group rather than an empty string
 * preventing their collision scripts from being able to fire
 */
const migrateFrom200r5To200r6Actors = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        actors: scene.actors.map((actor) => {
          return {
            ...actor,
            collisionGroup:
              (Array.isArray(actor.collisionGroup)
                ? actor.collisionGroup[0]
                : actor.collisionGroup) || "",
          };
        }),
      };
    }),
  };
};

const migrateMoveSpeedr6r7 = (original: unknown) => {
  if (original === 0) {
    return 0.5;
  }
  return parseFloat(String(original)) || 1;
};
const migrateAnimSpeedr6r7 = (original: unknown) => {
  if (original === 4) {
    return 7;
  }
  if (original === 3) {
    return 15;
  }
  if (original === 2) {
    return 31;
  }
  if (original === 1) {
    return 63;
  }
  if (original === 0) {
    return 127;
  }
  return 15;
};

/*
 * Version 2.0.0 r7 now uses pixel per frame and animation speed mask values
 * rather than arbitrary speed values for anim/move speeds.
 * Save event also now includes an OnSave script.
 */
export const migrateFrom200r6To200r7Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);

  if (event.args && event.command === "EVENT_ACTOR_SET_ANIMATION_SPEED") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        speed: migrateAnimSpeedr6r7(event.args.speed),
      },
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SET_MOVEMENT_SPEED") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        speed: migrateMoveSpeedr6r7(event.args.speed),
      },
    });
  }
  if (event.args && event.command === "EVENT_LAUNCH_PROJECTILE") {
    let speed = event.args.speed;
    if (speed === "" || speed === undefined) {
      speed = 2;
    } else {
      speed = parseInt(String(speed), 10);
    }
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        speed,
      },
    });
  }

  if (event.args && event.command === "EVENT_SAVE_DATA") {
    return migrateMeta({
      ...event,
      children: {
        true: [
          {
            id: uuid(),
            command: EVENT_END,
          },
        ],
      },
    });
  }
  return event;
};

const migrateFrom200r6To200r7Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r6To200r7Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r6To200r7Event),
      };
    }),
  };
};

/*
 * Version 2.0.0 r7 switches
 * - movement to be stored as pixels per frame
 * - animation speed to be stored as tick mask
 */
const migrateFrom200r6To200r7Actors = (data: ProjectData): ProjectData => {
  return {
    ...data,
    settings: {
      ...data.settings,
      startMoveSpeed: migrateMoveSpeedr6r7(data.settings.startMoveSpeed),
      startAnimSpeed: migrateAnimSpeedr6r7(data.settings.startAnimSpeed),
    },
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        actors: scene.actors.map((actor) => {
          return {
            ...actor,
            moveSpeed: migrateMoveSpeedr6r7(actor.moveSpeed),
            animSpeed: migrateAnimSpeedr6r7(actor.animSpeed),
          };
        }),
      };
    }),
  };
};

type ProjectDataV200r6 = Omit<ProjectData, "scenes"> & {
  scenes: (Scene & {
    tileColors: number[];
  })[];
  settings: {
    playerSpriteSheetId: string;
  };
};

/*
 * Version 2.0.0 r7 moves image color data into background entity rather than scene
 */
const migrateFrom200r6To200r7Backgrounds = (
  data: ProjectDataV200r6
): ProjectData => {
  return {
    ...data,
    backgrounds: data.backgrounds.map((background) => {
      // Find an existing scene using this background and copy the tile colors used
      const scene = data.scenes.find(
        (scene) => scene.backgroundId === background.id
      );
      const tileColors = (scene && scene.tileColors) || [];
      return {
        ...background,
        tileColors,
      };
    }),
  };
};

/*
 * Version 2.0.0 r7 switches scene type to be a string enum
 */
const migrateFrom200r6To200r7Scenes = (data: ProjectData): ProjectData => {
  const migrateSceneType = (type: string) => {
    if (type === "0") {
      return "TOPDOWN";
    }
    if (type === "1") {
      return "PLATFORM";
    }
    if (type === "2") {
      return "ADVENTURE";
    }
    if (type === "3") {
      return "SHMUP";
    }
    if (type === "4") {
      return "POINTNCLICK";
    }
    if (type === "5") {
      return "LOGO";
    }
    return "TOPDOWN";
  };
  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        type: migrateSceneType(scene.type),
      };
    }),
  };
};

type ProjectDataV200r7 = Omit<ProjectData, "spriteSheets"> & {
  spriteSheets: (SpriteSheetData & {
    animationType: SpriteAnimationType;
    flipLeft: boolean;
    animations: SpriteAnimationData[];
  })[];
};

/*
 * Version 2.0.0 r8 moves sprite animations to be wrapped within states array
 */
const migrateFrom200r7To200r8Sprites = (
  data: ProjectDataV200r7
): ProjectData => {
  return {
    ...data,
    spriteSheets: data.spriteSheets.map((spriteSheet) => {
      return {
        ...spriteSheet,
        states: [
          {
            id: uuid(),
            name: "",
            animationType: spriteSheet.animationType,
            flipLeft: spriteSheet.flipLeft,
            animations: spriteSheet.animations || [],
          },
        ],
        animations: undefined,
        flipLeft: undefined,
        animationType: undefined,
      };
    }),
  };
};

/*
 * Version 2.0.0 r7 moves default player sprite to be per scene type.
 * UI Palette merged into defaultBackgroundPaletteIds.
 */
const migrateFrom200r6To200r7Settings = (
  data: ProjectDataV200r6
): ProjectData => {
  return {
    ...data,
    spriteSheets: data.spriteSheets.map((spriteSheet) => {
      if (spriteSheet.id !== data.settings.playerSpriteSheetId) {
        return spriteSheet;
      }
      return {
        ...spriteSheet,
        boundsHeight: 8,
      };
    }),
    settings: {
      ...data.settings,
      defaultPlayerSprites: {
        TOPDOWN: data.settings.playerSpriteSheetId,
        PLATFORM: data.settings.playerSpriteSheetId,
        ADVENTURE: data.settings.playerSpriteSheetId,
        SHMUP: data.settings.playerSpriteSheetId,
        POINTNCLICK: data.settings.playerSpriteSheetId,
        LOGO: data.settings.playerSpriteSheetId,
      },
      defaultBackgroundPaletteIds: [
        data.settings.defaultBackgroundPaletteIds?.[0] || DMG_PALETTE.id,
        data.settings.defaultBackgroundPaletteIds?.[1] || DMG_PALETTE.id,
        data.settings.defaultBackgroundPaletteIds?.[2] || DMG_PALETTE.id,
        data.settings.defaultBackgroundPaletteIds?.[3] || DMG_PALETTE.id,
        data.settings.defaultBackgroundPaletteIds?.[4] || DMG_PALETTE.id,
        data.settings.defaultBackgroundPaletteIds?.[5] || DMG_PALETTE.id,
        data.settings.defaultBackgroundPaletteIds?.[6] || DMG_PALETTE.id,
        data.settings.defaultUIPaletteId || DMG_PALETTE.id,
      ],
      defaultSpritePaletteIds: [
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
        data.settings.defaultSpritePaletteId || DMG_PALETTE.id,
      ],
    },
  };
};

/* Version 2.0.0 r8 removes EVENT_END commands marking the end of script branches
 */
const filterFrom200r8To200r9Event = (event: ScriptEvent): boolean => {
  return event.command !== "EVENT_END";
};

const migrateFrom200r8To200r9Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: filterScenesEvents(data.scenes, filterFrom200r8To200r9Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: filterEvents(customEvent.script, filterFrom200r8To200r9Event),
      };
    }),
  };
};

export const migrateFrom200r9To200r10Triggers = (
  data: ProjectData
): ProjectData => {
  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      return {
        ...scene,
        triggers: scene.triggers.map((trigger) => {
          return {
            ...trigger,
            leaveScript: trigger.leaveScript || [],
          };
        }),
      };
    }),
  };
};

/* Version 2.0.0 r11 adds additional parameters to EVENT_LAUNCH_PROJECTILE
 */
export const migrateFrom200r10To200r11Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);

  if (event.args && event.command === "EVENT_LAUNCH_PROJECTILE") {
    const unionType =
      (isUnionValue(event.args?.direction) && event.args.direction.type) ||
      "direction";
    const unionValue =
      isUnionValue(event.args?.direction) && event.args.direction.value;

    let directionType = "direction";
    if (unionType === "variable") {
      directionType = "anglevar";
    } else if (unionType === "property") {
      directionType = "actor";
    }

    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        animSpeed: 7,
        lifeTime: 1,
        directionType,
        direction: unionType === "direction" ? unionValue : "right",
        angleVariable: unionType === "variable" ? unionValue : "0",
        angle: 0,
        otherActorId:
          unionType === "property"
            ? String(unionValue).replace(/:.*/, "")
            : "$self$",
      },
    });
  }

  return event;
};

const migrateFrom200r10To200r11Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r10To200r11Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r10To200r11Event),
      };
    }),
  };
};

/* Version 2.0.0 r12 adds variable support for camera events + ability to lock per axis
 */
export const migrateFrom200r11To200r12Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);

  if (event.args && event.command === "EVENT_CAMERA_MOVE_TO") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        x: {
          type: "number",
          value: event.args.x,
        },
        y: {
          type: "number",
          value: event.args.y,
        },
      },
    });
  } else if (event.args && event.command === "EVENT_CAMERA_LOCK") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        axis: ["x", "y"],
      },
    });
  }

  return event;
};

const migrateFrom200r11To200r12Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r11To200r12Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r11To200r12Event),
      };
    }),
  };
};

/* Version 2.0.0 r13 adds multiple save slots for save/load events
 */
export const migrateFrom200r12To200r13Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);

  if (
    event.args &&
    (event.command === "EVENT_SAVE_DATA" ||
      event.command === "EVENT_LOAD_DATA" ||
      event.command === "EVENT_CLEAR_DATA" ||
      event.command === "EVENT_IF_SAVED_DATA")
  ) {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        saveSlot: 0,
      },
    });
  }
  return event;
};

const migrateFrom200r12To200r13Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r12To200r13Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r12To200r13Event),
      };
    }),
  };
};

/* Version 2.0.0 r14 deprecates weapon attack event, replacing with launch projectile
 */
export const migrateFrom200r13To200r14Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);

  if (event.args && event.command === "EVENT_WEAPON_ATTACK") {
    return migrateMeta({
      ...event,
      command: "EVENT_LAUNCH_PROJECTILE",
      args: {
        ...event.args,
        otherActorId: event.args.actorId,
        directionType: "actor",
        initialOffset: event.args.offset,
        x: 0,
        y: 0,
        speed: 0,
        animSpeed: 15,
        lifeTime: 0.2,
      },
    });
  }
  return event;
};

const migrateFrom200r13To200r14Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom200r13To200r14Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom200r13To200r14Event),
      };
    }),
  };
};

/* Version 2.0.0 r15 migrates old emote events to new emotes format (and creates default emote pngs if missing)
 */
export const migrateFrom200r14To200r15Event =
  (emotesData: EmoteData[]) =>
  (event: ScriptEvent): ScriptEvent => {
    const migrateMeta = generateMigrateMeta(event);

    if (event.args && event.command === "EVENT_ACTOR_EMOTE") {
      return migrateMeta({
        ...event,
        command: "EVENT_ACTOR_EMOTE",
        args: {
          ...event.args,
          emoteId: (
            emotesData[parseInt(String(event.args?.emoteId))] || emotesData[0]
          ).id,
        },
      });
    }
    return event;
  };

const migrateFrom200r14Tor15Emotes = (
  data: ProjectData,
  projectRoot: string
): ProjectData => {
  if (data.emotes || !projectRoot) {
    return data;
  }
  const emoteNames = [
    "shock",
    "question",
    "love",
    "pause",
    "anger",
    "sweat",
    "music",
    "sleep",
  ];
  const emotesData = emoteNames.map((name) => ({
    id: uuid(),
    name,
    width: 16,
    height: 16,
    filename: `${name}.png`,
  })) as EmoteData[];

  for (let i = 0; i < emotesData.length; i++) {
    const emoteData = emotesData[i];
    ensureProjectAssetSync(`assets/emotes/${emoteData.name}.png`, {
      projectRoot,
    });
  }

  return {
    ...data,
    emotes: emotesData,
    scenes: mapScenesScript(
      data.scenes,
      migrateFrom200r14To200r15Event(emotesData)
    ),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(
          customEvent.script,
          migrateFrom200r14To200r15Event(emotesData)
        ),
      };
    }),
  };
};

/* Version 2.0.0 r16 migrates old avatar events to new avatars format (and copies sprites to correct folder)
 */
export const migrateFrom200r15To200r16Event =
  (avatarsIdLookup: Record<string, string>) =>
  (event: ScriptEvent): ScriptEvent => {
    const migrateMeta = generateMigrateMeta(event);

    if (event.args && event.command === "EVENT_TEXT") {
      return migrateMeta({
        ...event,
        command: "EVENT_TEXT",
        args: {
          ...event.args,
          avatarId:
            event.args.avatarId && avatarsIdLookup[String(event.args.avatarId)],
        },
      });
    }
    return event;
  };

const migrateFrom200r15Tor16Avatars = (
  data: ProjectData,
  projectRoot: string
): ProjectData => {
  if (data.avatars || !projectRoot) {
    return data;
  }

  const avatarIds: string[] = [];
  const handleEvent = (event: ScriptEvent) => {
    if (event.command === "EVENT_TEXT" && event.args && event.args.avatarId) {
      avatarIds.push(String(event.args.avatarId));
    }
  };

  walkScenesScripts(data.scenes, undefined, handleEvent);
  data.customEvents.forEach((customEvent) =>
    walkScript(customEvent.script, undefined, handleEvent)
  );

  const uniqueAvatarIds = uniq(avatarIds);

  const avatarsData = uniqueAvatarIds
    .map((spriteId) => {
      const sprite = data.spriteSheets.find((sprite) => sprite.id === spriteId);
      return (
        sprite && {
          id: uuid(),
          name: sprite.name,
          width: 16,
          height: 16,
          filename: sprite.filename,
        }
      );
    })
    .filter((i) => i) as AvatarData[];

  const avatarsIdLookup = uniqueAvatarIds.reduce((memo, oldId, index) => {
    const avatar = avatarsData[index];
    const newId = avatar && avatar.id;
    memo[oldId] = newId;
    return memo;
  }, {} as Record<string, string>);

  avatarsData.forEach((avatar) => {
    if (avatar) {
      try {
        const destPath = `${projectRoot}/assets/avatars/${avatar.filename}`;
        const spritePath = `${projectRoot}/assets/sprites/${avatar.filename}`;
        copySync(spritePath, destPath, {
          overwrite: false,
          errorOnExist: true,
        });
      } catch (e) {}
    }
  });

  return {
    ...data,
    avatars: avatarsData.filter((i) => i),
    scenes: mapScenesScript(
      data.scenes,
      migrateFrom200r15To200r16Event(avatarsIdLookup)
    ),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(
          customEvent.script,
          migrateFrom200r15To200r16Event(avatarsIdLookup)
        ),
      };
    }),
  };
};

/* Version 2.0.0 r17 migrates to new fonts format
 */
const migrateFrom200r16Tor17Fonts = (
  data: ProjectData,
  projectRoot: string
): ProjectData => {
  if (data.fonts || !projectRoot) {
    return data;
  }
  const fontNames = ["gbs-mono", "gbs-var"];
  const fontsData = fontNames.map((name) => ({
    id: uuid(),
    name,
    filename: `${name}.png`,
  })) as FontData[];

  for (let i = 0; i < fontsData.length; i++) {
    const fontData = fontsData[i];
    ensureProjectAssetSync(`assets/fonts/${fontData.name}.png`, {
      projectRoot,
    });
    ensureProjectAssetSync(`assets/fonts/${fontData.name}.json`, {
      projectRoot,
    });
  }

  return {
    ...data,
    fonts: fontsData,
    settings: {
      ...data.settings,
      defaultFontId: fontsData[0].id,
    },
  };
};

/* Version 3.0.0 r2 migrates old hide/show events to deactivate/activate to better match previous functionality
 */
export const migrateFrom300r1To300r2Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_ACTOR_HIDE") {
    return migrateMeta({
      ...event,
      command: "EVENT_ACTOR_DEACTIVATE",
    });
  }
  if (event.args && event.command === "EVENT_ACTOR_SHOW") {
    return migrateMeta({
      ...event,
      command: "EVENT_ACTOR_ACTIVATE",
    });
  }
  return event;
};

const migrateFrom300r1To300r2Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom300r1To300r2Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom300r1To300r2Event),
      };
    }),
  };
};

/* Version 3.0.0 r3 adds gbvm symbols to all entities
 */
export const migrateFrom300r2To300r3 = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: data.scenes.map((scene, sceneIndex) => {
      return {
        ...scene,
        symbol: toValidSymbol(`scene_${scene.name || sceneIndex + 1}`),
        actors: scene.actors.map((actor) => {
          return {
            ...actor,
            symbol: toValidSymbol(`actor_${actor.name || 0}`),
          };
        }),
        triggers: scene.triggers.map((trigger) => {
          return {
            ...trigger,
            symbol: toValidSymbol(`trigger_${trigger.name || 0}`),
          };
        }),
      };
    }),
    customEvents: data.customEvents.map((customEvent, customEventIndex) => {
      return {
        ...customEvent,
        symbol: toValidSymbol(
          `script_${customEvent.name || customEventIndex + 1}`
        ),
      };
    }),
    variables: (data.variables || []).map((variable, variableIndex) => {
      return {
        ...variable,
        symbol: toValidSymbol(`var_${variable.name || variableIndex + 1}`),
      };
    }),
  };
};

/* Version 3.1.0 r1 updates custom events to allow global variables
 * Need to make sure all variable inputs are prefixed with V
 * to distinguish from global variables
 */
export const migrateFrom300r3To310r1ScriptEvent = (
  event: ScriptEvent,
  scriptEventDefs: ScriptEventDefs
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args) {
    const newArgs = Object.keys(event.args).reduce(
      (memo, key) => {
        if (
          event.args &&
          isVariableField(event.command, key, event.args, scriptEventDefs)
        ) {
          const value = event.args[key];
          if (typeof value === "string") {
            memo[key] = `V${value}`;
          } else if (isUnionVariableValue(value)) {
            memo[key] = {
              ...value,
              value: `V${value.value}`,
            };
          }
        }
        return memo;
      },
      { ...event.args }
    );
    return migrateMeta({
      ...event,
      args: newArgs,
    });
  }
  return event;
};

/* Version 3.1.0 r1 updates custom events to use union inputs
 * Engine Field store needs missing inputs setting to "0" as new script context sensitive defaults change previous logic for missing values
 */
export const migrateFrom300r3To310r1Event = (
  event: ScriptEvent,
  customEvents: CustomEvent[]
) => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_CALL_CUSTOM_EVENT") {
    const customEvent = customEvents.find(
      (c) => c.id === event.args?.customEventId
    );
    if (!customEvent) {
      return event;
    }
    // Migrate custom event variable args to union type + set default for missing values to "0"
    const newArgs = Object.values(customEvent.variables).reduce(
      (memo, variable) => {
        if (!variable) {
          return memo;
        }
        const oldKey = `$variable[${variable.id}]$`;
        const newKey = `$variable[V${variable.id}]$`;
        memo[newKey] = {
          type: "variable",
          value: event.args?.[oldKey] ?? "0",
        };
        delete memo[oldKey];
        return memo;
      },
      { ...event.args }
    );
    return migrateMeta({
      ...event,
      args: newArgs,
    });
  } else if (event.command === "EVENT_ENGINE_FIELD_STORE") {
    // Set default variable for missing engine field store values to "0"
    const newArgs = {
      ...event.args,
      value: event.args?.value ?? "0",
    };
    return migrateMeta({
      ...event,
      args: newArgs,
    });
  }
  return event;
};

/* Version 3.1.0 r1 updates custom events to use union inputs and allows global variables
 * used from within scripts
 */
export const migrateFrom300r3To310r1 = (
  data: ProjectData,
  scriptEventDefs: ScriptEventDefs
): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, (e) =>
      migrateFrom300r3To310r1Event(e, data.customEvents)
    ),
    customEvents: data.customEvents.map((customEvent) => {
      return {
        ...customEvent,
        variables: Object.values(customEvent.variables).reduce(
          (memo, variable) => {
            if (!variable) {
              return memo;
            }
            const newId = `V${variable.id}`;
            memo[newId] = {
              ...variable,
              id: newId,
              passByReference: true,
            };
            return memo;
          },
          {} as Record<string, CustomEventVariable>
        ),
        script: mapScript(customEvent.script, (e) =>
          migrateFrom300r3To310r1Event(
            migrateFrom300r3To310r1ScriptEvent(e, scriptEventDefs),
            data.customEvents
          )
        ),
      };
    }),
  };
};

/* Version 3.1.0 r2 updates projectile events to set new fields as true by default
 */
export const migrateFrom310r1To310r2Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_LAUNCH_PROJECTILE") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        loopAnim: true,
        destroyOnHit: true,
      },
    });
  }
  return event;
};

const migrateFrom310r1To310r2Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom310r1To310r2Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom310r1To310r2Event),
      };
    }),
  };
};

/* Version 3.1.0 r3 updates For Loops to include comparison and operation selectors
 */
export const migrateFrom310r2To310r3Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (event.args && event.command === "EVENT_LOOP_FOR") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        comparison: "<=",
        operation: "+=",
        value: event.args.inc,
      },
    });
  }
  return event;
};

const migrateFrom310r2To310r3Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom310r2To310r3Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom310r2To310r3Event),
      };
    }),
  };
};

/* Version 3.1.1 r1 updates timer events to include a timer context value defaulting to 1
 */
export const migrateFrom310r3To311r1Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);
  if (
    event.args &&
    (event.command === "EVENT_SET_TIMER_SCRIPT" ||
      event.command === "EVENT_TIMER_RESTART" ||
      event.command === "EVENT_TIMER_DISABLE")
  ) {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        timer: event.args.timer || 1,
      },
    });
  }
  return event;
};

const migrateFrom310r3To311r1Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom310r3To311r1Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom310r3To311r1Event),
      };
    }),
  };
};

/* Version 3.2.0 r2 updates the camera shake event to include a magnitude value defaulting to 5
 */
export const migrateFrom320r1To320r2Event = (
  event: ScriptEvent
): ScriptEvent => {
  const migrateMeta = generateMigrateMeta(event);

  if (event.args && event.command === "EVENT_CAMERA_SHAKE") {
    return migrateMeta({
      ...event,
      args: {
        ...event.args,
        magnitude: {
          type: "number",
          value: 5,
        },
      },
    });
  }

  return event;
};

const migrateFrom320r1To320r2Events = (data: ProjectData): ProjectData => {
  return {
    ...data,
    scenes: mapScenesScript(data.scenes, migrateFrom320r1To320r2Event),
    customEvents: (data.customEvents || []).map((customEvent) => {
      return {
        ...customEvent,
        script: mapScript(customEvent.script, migrateFrom320r1To320r2Event),
      };
    }),
  };
};

type ProjectDataV320r2 = ProjectData & {
  settings: {
    customColorsEnabled: boolean;
  };
};

export const migrateFrom320r2To330r1Settings = (
  data: ProjectDataV320r2
): ProjectData => {
  return {
    ...data,
    settings: {
      ...data.settings,
      colorMode: data.settings.customColorsEnabled ? "mixed" : "mono",
    },
  };
};

const migrateProject = (
  project: ProjectData,
  projectRoot: string,
  scriptEventDefs: ScriptEventDefs
): ProjectData => {
  let data = { ...project };
  let version = project._version || "1.0.0";
  let release = project._release || "1";

  if (version === "1") {
    version = "1.0.0";
  }

  // Migrate from 1.0.0 to 1.1.0
  if (version === "1.0.0") {
    data = migrateFrom1To110Scenes(data);
    data = migrateFrom1To110Actors(data as ProjectDataV1);
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
    release = "2";
  }
  if (version === "2.0.0") {
    if (release === "1") {
      data = migrateFrom200r1To200r2Events(data);
      release = "2";
    }
    if (release === "2") {
      data = migrateFrom200r2To200r3Events(data);
      release = "3";
    }
    if (release === "3") {
      data = migrateFrom200r3To200r4EngineFieldValues(
        data as ProjectDataV200r3
      );
      data = migrateFrom200r3To200r4Events(data);
      release = "4";
    }
    if (release === "4") {
      data = migrateFrom200r4To200r5Events(data);
      data = migrateFrom200r4To200r5Actors(data);
      release = "5";
    }
    if (release === "5") {
      data = migrateFrom200r5To200r6Actors(data);
      release = "6";
    }
    if (release === "6") {
      data = migrateFrom200r6To200r7Events(data);
      data = migrateFrom200r6To200r7Actors(data);
      data = migrateFrom200r6To200r7Backgrounds(data as ProjectDataV200r6);
      data = migrateFrom200r6To200r7Scenes(data);
      data = migrateFrom200r6To200r7Settings(data as ProjectDataV200r6);
      release = "7";
    }
    if (release === "7") {
      data = migrateFrom200r7To200r8Sprites(data as ProjectDataV200r7);
      release = "8";
    }
    if (release === "8") {
      data = migrateFrom200r8To200r9Events(data);
      release = "9";
    }
    if (release === "9") {
      data = migrateFrom200r9To200r10Triggers(data);
      release = "10";
    }
    if (release === "10") {
      data = migrateFrom200r10To200r11Events(data);
      release = "11";
    }
    if (release === "11") {
      data = migrateFrom200r11To200r12Events(data);
      release = "12";
    }
    if (release === "12") {
      data = migrateFrom200r12To200r13Events(data);
      release = "13";
    }
    if (release === "13") {
      data = migrateFrom200r13To200r14Events(data);
      release = "14";
    }
    if (release === "14") {
      data = migrateFrom200r14Tor15Emotes(data, projectRoot);
      release = "15";
    }
    if (release === "15") {
      data = migrateFrom200r15Tor16Avatars(data, projectRoot);
      release = "16";
    }
    if (release === "16") {
      data = migrateFrom200r16Tor17Fonts(data, projectRoot);
      version = "3.0.0";
      release = "1";
    }
  }

  if (version === "3.0.0") {
    if (release === "1") {
      data = migrateFrom300r1To300r2Events(data);
      release = "2";
    }
    if (release === "2") {
      data = migrateFrom300r2To300r3(data);
      release = "3";
    }
    if (release === "3") {
      data = migrateFrom300r3To310r1(data, scriptEventDefs);
      version = "3.1.0";
      release = "1";
    }
  }

  if (version === "3.1.0") {
    if (release === "0" || release === "1") {
      data = migrateFrom310r1To310r2Events(data);
      release = "2";
    }
    if (release === "2") {
      data = migrateFrom310r2To310r3Events(data);
      release = "3";
    }
    if (release === "3") {
      version = "3.1.1";
      release = "1";
    }
  }

  if (version === "3.1.1") {
    if (release === "1") {
      data = migrateFrom310r3To311r1Events(data);
      release = "2";
    }
    if (release === "2") {
      version = "3.2.0";
      release = "1";
    }
  }

  if (version === "3.2.0") {
    if (release === "1") {
      data = migrateFrom320r1To320r2Events(data);
      release = "2";
    }
    if (release === "2") {
      version = "3.3.0";
      release = "1";
    }
  }

  if (version === "3.3.0") {
    if (release === "1") {
      data = migrateFrom320r2To330r1Settings(data as ProjectDataV320r2);
      release = "2";
    }
  }

  if (process.env.NODE_ENV !== "production") {
    if (version === "2.0.0") {
      data = migrateFrom120To200Collisions(data);
    }
  }

  data._version = LATEST_PROJECT_VERSION;
  data._release = LATEST_PROJECT_MINOR_VERSION;

  return data;
};

export default migrateProject;
