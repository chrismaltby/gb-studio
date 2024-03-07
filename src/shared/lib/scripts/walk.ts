import mapValues from "lodash/mapValues";
import type { Dictionary } from "@reduxjs/toolkit";
import {
  actorScriptKeys,
  Actor,
  ActorDenormalized,
  ActorScriptKey,
  CustomEvent,
  Scene,
  SceneDenormalized,
  SceneScriptKey,
  ScriptEvent,
  ScriptEventDenormalized,
  Trigger,
  TriggerDenormalized,
  TriggerScriptKey,
  triggerScriptKeys,
  sceneScriptKeys,
  CustomEventDenormalized,
} from "shared/lib/entities/entitiesTypes";

//#region Denormalised Script Events

//#region Map Denormalised Script Events

/**
 * Updates all script events within an array using a map function
 *
 * @param script - An array of `ScriptEventDenormalized` objects to be mapped over. Defaults to an empty array if not provided.
 * @param callback - A mapping function that is applied to each ScriptEvent.
 * @returns An array of `ScriptEventDenormalized` objects that are the result of applying the `callback` function to each element of the `events` array.
 */
export const mapScript = (
  script: ScriptEventDenormalized[] = [],
  callback: (e: ScriptEventDenormalized) => ScriptEventDenormalized
): ScriptEventDenormalized[] => {
  return script.map((scriptEvent): ScriptEventDenormalized => {
    if (scriptEvent && scriptEvent.children) {
      const newEvent = callback(scriptEvent);
      return {
        ...newEvent,
        children: mapValues(
          newEvent.children || scriptEvent.children,
          (childEvents) => mapScript(childEvents, callback)
        ),
      };
    }
    if (!scriptEvent) {
      return scriptEvent;
    }
    return callback(scriptEvent);
  });
};

/**
 * Updates all script events within a single scene, including any actors or triggers within that scene using a map function
 *
 * @param scene - The denormalized scene
 * @param callback - A mapping function that is applied to each ScriptEvent.
 * @returns A new denormalized scene with updated scripts.
 */
export const mapSceneScript = (
  scene: SceneDenormalized,
  callback: (e: ScriptEventDenormalized) => ScriptEventDenormalized
) => {
  const newScene = {
    ...scene,
    actors: scene.actors.map((actor) => {
      const newActor = { ...actor };
      walkActorScriptsKeys((key) => {
        newActor[key] = mapScript(actor[key], callback);
      });
      return newActor;
      // return {
      //   ...actor,
      //   script: mapScript(actor.script, callback),
      //   startScript: mapScript(actor.startScript, callback),
      //   updateScript: mapScript(actor.updateScript, callback),
      //   hit1Script: mapScript(actor.hit1Script, callback),
      //   hit2Script: mapScript(actor.hit2Script, callback),
      //   hit3Script: mapScript(actor.hit3Script, callback),
      // };
    }),
    triggers: scene.triggers.map((trigger) => {
      const newTrigger = { ...trigger };
      walkTriggerScriptsKeys((key) => {
        newTrigger[key] = mapScript(trigger[key], callback);
      });
      return newTrigger;
      // return {
      //   ...trigger,
      //   script: mapScript(trigger.script, callback),
      //   leaveScript: mapScript(trigger.leaveScript, callback),
      // };
    }),
  };
  walkSceneScriptsKeys((key) => {
    newScene[key] = mapScript(scene[key], callback);
  });
  return newScene;

  // return {
  //   ...scene,
  //   script: mapScript(scene.script, callback),
  //   playerHit1Script: mapScript(scene.playerHit1Script, callback),
  //   playerHit2Script: mapScript(scene.playerHit2Script, callback),
  //   playerHit3Script: mapScript(scene.playerHit3Script, callback),
  //   actors: scene.actors.map((actor) => {
  //     return {
  //       ...actor,
  //       script: mapScript(actor.script, callback),
  //       startScript: mapScript(actor.startScript, callback),
  //       updateScript: mapScript(actor.updateScript, callback),
  //       hit1Script: mapScript(actor.hit1Script, callback),
  //       hit2Script: mapScript(actor.hit2Script, callback),
  //       hit3Script: mapScript(actor.hit3Script, callback),
  //     };
  //   }),
  //   triggers: scene.triggers.map((trigger) => {
  //     return {
  //       ...trigger,
  //       script: mapScript(trigger.script, callback),
  //       leaveScript: mapScript(trigger.leaveScript, callback),
  //     };
  //   }),
  // };
};

/**
 * Updates all script events within an array of scenes, including any actors or triggers within those scenes using a map function
 *
 * @param scenes - The denormalized scenes array
 * @param callback - A mapping function that is applied to each ScriptEvent.
 * @returns A new denormalized scene with updated scripts.
 */
export const mapScenesScript = (
  scenes: SceneDenormalized[],
  callback: (e: ScriptEventDenormalized) => ScriptEventDenormalized
) => {
  return scenes.map((scene) => {
    return mapSceneScript(scene, callback);
  });
};

//#endregion Map Denormalised Script Events

//#region Filter Denormalised Script Events

/**
 * Filters a nested structure of `ScriptEventDenormalized` objects.
 *
 * @param data - An array of `ScriptEventDenormalized` objects to be filtered. Defaults to an empty array if not provided.
 * @param callback - A callback function that takes a `ScriptEventDenormalized` and returns true if the item should be kept in the new script.
 * @returns An array of `ScriptEventDenormalized` objects that have been filtered.
 */
export const filterEvents = (
  data: ScriptEventDenormalized[] = [],
  callback: (e: ScriptEventDenormalized) => boolean
) => {
  return data.reduce((memo, o) => {
    if (callback(o)) {
      memo.push({
        ...o,
        children:
          o.children &&
          mapValues(o.children, (childEvents) =>
            filterEvents(childEvents, callback)
          ),
      });
    }
    return memo;
  }, [] as ScriptEventDenormalized[]);
};

//#endregion Filter Denormalised Script Events

//#region Walk Denormalised Script Events

type WalkOptions =
  | undefined
  | {
      filter?: (ScriptEvent: ScriptEventDenormalized) => boolean;
      customEvents?: {
        lookup: Dictionary<CustomEventDenormalized>;
        maxDepth: number;
        args?: Record<string, unknown>;
      };
    };

/**
 * Iterates over an array of `ScriptEventDenormalized` objects and calls a callback function with each element.
 *
 * @param script - An array of `ScriptEventDenormalized` objects to be iterated over.
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkScript = (
  script: ScriptEventDenormalized[] = [],
  options: WalkOptions,
  callback: (e: ScriptEventDenormalized) => void
) => {
  if (!script) {
    return;
  }
  for (let i = 0; i < script.length; i++) {
    const scriptEvent = script[i];
    // If filter is provided skip events that fail filter
    if (options?.filter && !options.filter(scriptEvent)) {
      continue;
    }
    if (scriptEvent?.args?.__comment) {
      // Skip commented events
      continue;
    }
    callback(replaceCustomEventArgs(scriptEvent, options?.customEvents?.args));
    if (
      scriptEvent.children &&
      scriptEvent.command !== "EVENT_CALL_CUSTOM_EVENT"
    ) {
      Object.keys(scriptEvent.children).forEach((key) => {
        const script = scriptEvent.children?.[key];
        if (script) {
          walkScript(script, options, callback);
        }
      });
    }
    if (
      options?.customEvents &&
      options.customEvents.maxDepth >= 0 &&
      scriptEvent.command === "EVENT_CALL_CUSTOM_EVENT"
    ) {
      const customEvent =
        options.customEvents.lookup[
          String(scriptEvent.args?.customEventId || "")
        ];
      if (customEvent) {
        walkScript(
          customEvent.script,
          {
            ...options,
            customEvents: {
              ...options.customEvents,
              maxDepth: options.customEvents.maxDepth - 1,
              args: scriptEvent.args || {},
            },
          },
          callback
        );
      }
    }
  }
};

/**
 * Iterates over all scene specific scripts for a single scene and calls a callback function with each element.
 * Does not walk any included actors or triggers, see `walkSceneScripts` if this is needed.
 *
 * @param scene - A denormalized scene to walk
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkSceneSpecificScripts = (
  scene: SceneDenormalized,
  options: WalkOptions,
  callback: (e: ScriptEventDenormalized) => void
) => {
  walkSceneScriptsKeys((key) => {
    walkScript(scene[key], options, callback);
  });
};

/**
 * Iterates over all scripts for a actor and calls a callback function with each element.
 *
 * @param actor - A denormalized actor to walk
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkActorScripts = (
  actor: ActorDenormalized,
  options: WalkOptions,
  callback: (e: ScriptEventDenormalized) => void
) => {
  walkActorScriptsKeys((key) => {
    walkScript(actor[key], options, callback);
  });
};

/**
 * Iterates over all scripts for a trigger and calls a callback function with each element.
 *
 * @param trigger - A denormalized trigger to walk
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkTriggerScripts = (
  trigger: TriggerDenormalized,
  options: WalkOptions,
  callback: (e: ScriptEventDenormalized) => void
) => {
  walkTriggerScriptsKeys((key) => {
    walkScript(trigger[key], options, callback);
  });
};

/**
 * Iterates over all scripts for a single scene, including any used by actors and triggers
 * in the scene, and calls a callback function with each element.
 *
 * @param scene - A denormalized scene to walk
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkSceneScripts = (
  scene: SceneDenormalized,
  options: WalkOptions,
  callback: (
    event: ScriptEventDenormalized,
    actor?: ActorDenormalized,
    trigger?: TriggerDenormalized
  ) => void
) => {
  walkSceneSpecificScripts(scene, options, (e) =>
    callback(e, undefined, undefined)
  );
  scene.actors.forEach((actor) => {
    walkActorScripts(actor, options, (e) => callback(e, actor, undefined));
  });
  scene.triggers.forEach((trigger) => {
    walkTriggerScripts(trigger, options, (e) =>
      callback(e, undefined, trigger)
    );
  });
};

/**
 * Iterates over all scripts for an array of scenes, including any used by actors and triggers
 * in the scenes, and calls a callback function with each element.
 *
 * @param scene - An array of denormalized scenes to walk
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkScenesScripts = (
  scenes: SceneDenormalized[],
  options: WalkOptions,
  callback: (
    event: ScriptEventDenormalized,
    scene: SceneDenormalized,
    actor?: ActorDenormalized,
    trigger?: TriggerDenormalized
  ) => void
) => {
  scenes.forEach((scene) => {
    walkSceneScripts(scene, options, (e, actor, trigger) =>
      callback(e, scene, actor, trigger)
    );
  });
};

//#endregion Walk Denormalised Script Events

//#endregion Denormalised Script Events

//#region Normalised Script Events

type WalkNormalizedOptions =
  | undefined
  | {
      filter?: (ScriptEvent: ScriptEvent) => boolean;
      customEvents?: {
        lookup: Dictionary<CustomEvent>;
        maxDepth: number;
        args?: Record<string, unknown>;
      };
    };

export const replaceCustomEventArgs = <
  T extends {
    args?: Record<string, unknown>;
  }
>(
  scriptEvent: T,
  customEventArgs: Record<string, unknown> | undefined
): T => {
  if (!customEventArgs) {
    return scriptEvent;
  }
  return {
    ...scriptEvent,
    args: {
      ...scriptEvent.args,
      actorId:
        customEventArgs[`$actor[${scriptEvent.args?.actorId || 0}]$`] ??
        "$self$",
      // @todo Replace other custom event fields
    },
  };
};

/**
 * Iterates over an array of normalised `ScriptEvent` objects and calls a callback function with each element.
 *
 * @param script - An array of string ids for each script event to be iterated over.
 * @param lookup - A dictionary mapping script event ids to the normalised `ScriptEvent`s
 * @param options - Allows providing an optional filter function and a lookup of custom events to follow EVENT_CALL_CUSTOM_EVENT calls
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkNormalizedScript = (
  ids: string[] = [],
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  for (let i = 0; i < ids.length; i++) {
    const scriptEvent = lookup[ids[i]];
    if (scriptEvent) {
      // If filter is provided skip events that fail filter
      if (options?.filter && !options.filter(scriptEvent)) {
        continue;
      }
      callback(
        replaceCustomEventArgs(scriptEvent, options?.customEvents?.args)
      );
      if (
        scriptEvent.children &&
        scriptEvent.command !== "EVENT_CALL_CUSTOM_EVENT"
      ) {
        Object.keys(scriptEvent.children).forEach((key) => {
          const script = scriptEvent.children?.[key];
          if (script) {
            walkNormalizedScript(script, lookup, options, callback);
          }
        });
      }
      if (
        options?.customEvents &&
        options.customEvents.maxDepth >= 0 &&
        scriptEvent.command === "EVENT_CALL_CUSTOM_EVENT"
      ) {
        const customEvent =
          options.customEvents.lookup[
            String(scriptEvent.args?.customEventId || "")
          ];
        if (customEvent) {
          walkNormalizedScript(
            customEvent.script,
            lookup,
            {
              ...options,
              customEvents: {
                ...options.customEvents,
                maxDepth: options.customEvents.maxDepth - 1,
                args: scriptEvent.args || {},
              },
            },
            callback
          );
        }
      }
    }
  }
};

/**
 * Iterates over all scene specific scripts for a single normalized scene and calls a callback function with each element.
 * Does not walk any included actors or triggers, see `walkNormalizedSceneScripts` if this is needed.
 *
 * @param scene - A normalized scene to walk
 * @param lookup - A dictionary mapping script event ids to the normalised `ScriptEvent`s
 * @param options - Allows providing an optional filter function and a lookup of custom events to follow EVENT_CALL_CUSTOM_EVENT calls
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkNormalizedSceneSpecificScripts = (
  scene: Scene,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkSceneScriptsKeys((key) => {
    walkNormalizedScript(scene[key], lookup, options, callback);
  });
};

export const walkNormalizedActorScripts = (
  actor: Actor,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkActorScriptsKeys((key) => {
    walkNormalizedScript(actor[key], lookup, options, callback);
  });
};

export const walkNormalizedTriggerScripts = (
  trigger: Trigger,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkTriggerScriptsKeys((key) => {
    walkNormalizedScript(trigger[key], lookup, options, callback);
  });
};

export const walkNormalizedSceneScripts = (
  scene: Scene,
  lookup: Dictionary<ScriptEvent>,
  actorsLookup: Dictionary<Actor>,
  triggersLookup: Dictionary<Trigger>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent, actor?: Actor, trigger?: Trigger) => void
) => {
  walkNormalizedSceneSpecificScripts(scene, lookup, options, (e) =>
    callback(e, undefined, undefined)
  );
  scene.actors.forEach((actorId) => {
    const actor = actorsLookup[actorId];
    if (actor) {
      walkNormalizedActorScripts(actor, lookup, options, (e) =>
        callback(e, actor, undefined)
      );
    }
  });
  scene.triggers.forEach((triggerId) => {
    const trigger = triggersLookup[triggerId];
    if (trigger) {
      walkNormalizedTriggerScripts(trigger, lookup, options, (e) =>
        callback(e, undefined, trigger)
      );
    }
  });
};

export const walkNormalizedScenesScripts = (
  scenes: Scene[],
  lookup: Dictionary<ScriptEvent>,
  actorsLookup: Dictionary<Actor>,
  triggersLookup: Dictionary<Trigger>,
  options: WalkNormalizedOptions,
  callback: (
    scriptEvent: ScriptEvent,
    scene: Scene,
    actor?: Actor,
    trigger?: Trigger
  ) => void
) => {
  scenes.forEach((scene) => {
    walkNormalizedSceneScripts(
      scene,
      lookup,
      actorsLookup,
      triggersLookup,
      options,
      (e, actor, trigger) => callback(e, scene, actor, trigger)
    );
  });
};

export const walkNormalizedCustomEventScripts = (
  customEvent: CustomEvent,
  lookup: Dictionary<ScriptEvent>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEvent) => void
) => {
  walkNormalizedScript(customEvent.script, lookup, options, callback);
};

export const walkActorScriptsKeys = (
  callback: (scriptKey: ActorScriptKey) => void
) => {
  actorScriptKeys.forEach((key) => callback(key));
};

export const walkTriggerScriptsKeys = (
  callback: (scriptKey: TriggerScriptKey) => void
) => {
  triggerScriptKeys.forEach((key) => callback(key));
};

export const walkSceneScriptsKeys = (
  callback: (scriptKey: SceneScriptKey) => void
) => {
  sceneScriptKeys.forEach((key) => callback(key));
};

//#endregion Normalised Script Events
