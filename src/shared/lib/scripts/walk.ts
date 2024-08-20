import mapValues from "lodash/mapValues";
import type { Dictionary } from "@reduxjs/toolkit";
import {
  actorScriptKeys,
  ActorNormalized,
  Actor,
  ActorScriptKey,
  CustomEventNormalized,
  SceneNormalized,
  Scene,
  SceneScriptKey,
  ScriptEventNormalized,
  ScriptEvent,
  TriggerNormalized,
  Trigger,
  TriggerScriptKey,
  triggerScriptKeys,
  sceneScriptKeys,
  CustomEvent,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
  ActorPrefab,
  TriggerPrefab,
} from "shared/lib/entities/entitiesTypes";

//#region Script Events

//#region Map Script Events

/**
 * Updates all script events within an array using a map function
 *
 * @param script - An array of `ScriptEventDenormalized` objects to be mapped over. Defaults to an empty array if not provided.
 * @param callback - A mapping function that is applied to each ScriptEvent.
 * @returns An array of `ScriptEventDenormalized` objects that are the result of applying the `callback` function to each element of the `events` array.
 */
export const mapScript = (
  script: ScriptEvent[] = [],
  callback: (e: ScriptEvent) => ScriptEvent
): ScriptEvent[] => {
  return script.map((scriptEvent): ScriptEvent => {
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
 * Updates all script events within an array using a map function, skipping any which are commented
 *
 * @param script - An array of `ScriptEvent` objects to be mapped over. Defaults to an empty array if not provided.
 * @param callback - A mapping function that is applied to each ScriptEvent.
 * @returns An array of `ScriptEvent` objects that are the result of applying the `callback` function to each element of the `events` array.
 */
export const mapUncommentedScript = (
  script: ScriptEvent[] = [],
  callback: (e: ScriptEvent) => ScriptEvent
): ScriptEvent[] => {
  return script
    .map((scriptEvent): ScriptEvent | undefined => {
      if (scriptEvent && scriptEvent.children) {
        if (scriptEvent?.args?.__comment) {
          // Skip commented events
          return undefined;
        }
        const newEvent = callback(scriptEvent);
        return {
          ...newEvent,
          children: mapValues(
            newEvent.children || scriptEvent.children,
            (childEvents) => mapUncommentedScript(childEvents, callback)
          ),
        };
      }
      if (!scriptEvent) {
        return scriptEvent;
      }
      return callback(scriptEvent);
    })
    .filter((i) => i) as ScriptEvent[];
};

/**
 * Updates all script events within a single scene, including any actors or triggers within that scene using a map function
 *
 * @param scene - The denormalized scene
 * @param callback - A mapping function that is applied to each ScriptEvent.
 * @returns A new denormalized scene with updated scripts.
 */
export const mapSceneScript = (
  scene: Scene,
  callback: (e: ScriptEvent) => ScriptEvent
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
  scenes: Scene[],
  callback: (e: ScriptEvent) => ScriptEvent
) => {
  return scenes.map((scene) => {
    return mapSceneScript(scene, callback);
  });
};

export const mapActorScript = <T extends Actor | ActorPrefab>(
  actor: T,
  callback: (e: ScriptEvent) => ScriptEvent
): T => {
  const newActor = { ...actor };
  walkActorScriptsKeys((key) => {
    newActor[key] = mapScript(actor[key], callback);
  });
  return newActor;
};

export const mapTriggerScript = <T extends Trigger | TriggerPrefab>(
  trigger: T,
  callback: (e: ScriptEvent) => ScriptEvent
): T => {
  const newTrigger = { ...trigger };
  walkTriggerScriptsKeys((key) => {
    newTrigger[key] = mapScript(trigger[key], callback);
  });
  return newTrigger;
};

//#endregion Map Script Events

//#region Filter Script Events

/**
 * Filters a nested structure of `ScriptEventDenormalized` objects.
 *
 * @param data - An array of `ScriptEventDenormalized` objects to be filtered. Defaults to an empty array if not provided.
 * @param callback - A callback function that takes a `ScriptEventDenormalized` and returns true if the item should be kept in the new script.
 * @returns An array of `ScriptEventDenormalized` objects that have been filtered.
 */
export const filterEvents = (
  data: ScriptEvent[] = [],
  callback: (e: ScriptEvent) => boolean
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
  }, [] as ScriptEvent[]);
};

//#endregion Filter Script Events

//#region Walk Script Events

type WalkOptions =
  | undefined
  | {
      filter?: (ScriptEvent: ScriptEvent) => boolean;
      customEvents?: {
        lookup: Dictionary<CustomEvent>;
        maxDepth: number;
        args?: Record<string, unknown>;
        visitedIds?: Set<string>;
      };
    };

/**
 * Iterates over an array of `ScriptEventDenormalized` objects and calls a callback function with each element.
 *
 * @param script - An array of `ScriptEventDenormalized` objects to be iterated over.
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkScript = (
  script: ScriptEvent[] = [],
  options: WalkOptions,
  callback: (e: ScriptEvent) => void
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
        if (options.customEvents.visitedIds?.has(customEvent.id)) {
          continue;
        }
        const visitedIds = new Set<string>(
          options.customEvents.visitedIds
            ? [...options.customEvents.visitedIds, customEvent.id]
            : [customEvent.id]
        );

        walkScript(
          customEvent.script,
          {
            ...options,
            customEvents: {
              ...options.customEvents,
              maxDepth: options.customEvents.maxDepth - 1,
              args: scriptEvent.args || {},
              visitedIds,
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
  scene: Scene,
  options: WalkOptions,
  callback: (e: ScriptEvent) => void
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
  actor: Actor,
  options: WalkOptions,
  callback: (e: ScriptEvent) => void
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
  trigger: Trigger,
  options: WalkOptions,
  callback: (e: ScriptEvent) => void
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
  scene: Scene,
  options: WalkOptions,
  callback: (event: ScriptEvent, actor?: Actor, trigger?: Trigger) => void
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
  scenes: Scene[],
  options: WalkOptions,
  callback: (
    event: ScriptEvent,
    scene: Scene,
    actor?: Actor,
    trigger?: Trigger
  ) => void
) => {
  scenes.forEach((scene) => {
    walkSceneScripts(scene, options, (e, actor, trigger) =>
      callback(e, scene, actor, trigger)
    );
  });
};

//#endregion Walk Script Events

//#endregion Script Events

//#region Normalized Script Events

type WalkNormalizedOptions =
  | undefined
  | {
      filter?: (ScriptEvent: ScriptEventNormalized) => boolean;
      includeCommented?: boolean;
      customEvents?: {
        lookup: Dictionary<CustomEventNormalized>;
        maxDepth: number;
        args?: Record<string, unknown>;
        visitedIds?: Set<string>;
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
 * Iterates over an array of normalized `ScriptEvent` objects and calls a callback function with each element.
 *
 * @param script - An array of string ids for each script event to be iterated over.
 * @param lookup - A dictionary mapping script event ids to the normalized `ScriptEvent`s
 * @param options - Allows providing an optional filter function and a lookup of custom events to follow EVENT_CALL_CUSTOM_EVENT calls
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkNormalizedScript = (
  ids: string[] = [],
  lookup: Dictionary<ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void
) => {
  for (let i = 0; i < ids.length; i++) {
    const scriptEvent = lookup[ids[i]];
    if (scriptEvent) {
      if (scriptEvent?.args?.__comment && !options?.includeCommented) {
        // Skip commented events
        continue;
      }
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
          if (options.customEvents.visitedIds?.has(customEvent.id)) {
            continue;
          }

          const visitedIds = new Set<string>(
            options.customEvents.visitedIds
              ? [...options.customEvents.visitedIds, customEvent.id]
              : [customEvent.id]
          );

          walkNormalizedScript(
            customEvent.script,
            lookup,
            {
              ...options,
              customEvents: {
                ...options.customEvents,
                maxDepth: options.customEvents.maxDepth - 1,
                args: scriptEvent.args || {},
                visitedIds,
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
 * @param lookup - A dictionary mapping script event ids to the normalized `ScriptEvent`s
 * @param options - Allows providing an optional filter function and a lookup of custom events to follow EVENT_CALL_CUSTOM_EVENT calls
 * @param callback - A callback function that is applied to each script event and all children
 */
export const walkNormalizedSceneSpecificScripts = (
  scene: SceneNormalized,
  lookup: Dictionary<ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void
) => {
  walkSceneScriptsKeys((key) => {
    walkNormalizedScript(scene[key], lookup, options, callback);
  });
};

export const walkNormalizedActorScripts = (
  actor: ActorNormalized | ActorPrefabNormalized,
  lookup: Dictionary<ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void
) => {
  walkActorScriptsKeys((key) => {
    walkNormalizedScript(actor[key], lookup, options, callback);
  });
};

export const walkNormalizedTriggerScripts = (
  trigger: TriggerNormalized | TriggerPrefabNormalized,
  lookup: Dictionary<ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void
) => {
  walkTriggerScriptsKeys((key) => {
    walkNormalizedScript(trigger[key], lookup, options, callback);
  });
};

export const walkNormalizedSceneScripts = (
  scene: SceneNormalized,
  lookup: Dictionary<ScriptEventNormalized>,
  actorsLookup: Dictionary<ActorNormalized>,
  triggersLookup: Dictionary<TriggerNormalized>,
  options: WalkNormalizedOptions,
  callback: (
    scriptEvent: ScriptEventNormalized,
    actor?: ActorNormalized,
    trigger?: TriggerNormalized
  ) => void
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
  scenes: SceneNormalized[],
  lookup: Dictionary<ScriptEventNormalized>,
  actorsLookup: Dictionary<ActorNormalized>,
  triggersLookup: Dictionary<TriggerNormalized>,
  options: WalkNormalizedOptions,
  callback: (
    scriptEvent: ScriptEventNormalized,
    scene: SceneNormalized,
    actor?: ActorNormalized,
    trigger?: TriggerNormalized
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
  customEvent: CustomEventNormalized,
  lookup: Dictionary<ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void
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

//#endregion Normalized Script Events
