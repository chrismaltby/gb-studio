import mapValues from "lodash/mapValues";
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
  ScriptEventArgsOverride,
} from "shared/lib/entities/entitiesTypes";
import type {
  CompressedSceneResourceWithChildren,
  SceneResource,
  ScriptResource,
} from "shared/lib/resources/types";

type ScriptMapOptions =
  | undefined
  | {
      includePrefabOverrides: true;
      prefabEventsLookup: Record<string, ScriptEvent>;
    }
  | {
      includePrefabOverrides?: never;
    };

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
  callback: (e: ScriptEvent) => ScriptEvent,
): ScriptEvent[] => {
  return script.map((scriptEvent): ScriptEvent => {
    if (scriptEvent && scriptEvent.children) {
      const newEvent = callback(scriptEvent);
      return {
        ...newEvent,
        children: mapValues(
          newEvent.children || scriptEvent.children,
          (childEvents) => mapScript(childEvents, callback),
        ),
      };
    }
    if (!scriptEvent) {
      return scriptEvent;
    }
    return callback(scriptEvent);
  });
};

export const mapPrefabOverrides = (
  overrides: Record<string, ScriptEventArgsOverride>,
  prefabEventsLookup: Record<string, ScriptEvent>,
  callback: (e: ScriptEvent) => ScriptEvent,
): Record<string, ScriptEventArgsOverride> => {
  return Object.fromEntries(
    Object.entries(overrides).map(([key, value]) => {
      const prefabEvent = prefabEventsLookup[key] as ScriptEvent | undefined;
      if (!prefabEvent) {
        return [key, value];
      }

      // Merge event and overrides to get mapped data
      const mappedEvent = callback({
        ...prefabEvent,
        args: {
          ...prefabEvent.args,
          ...value.args,
        },
      });

      // Update any mapped data in override
      const migratedOverrideArgs = Object.fromEntries(
        Object.keys(value.args).map((key) => [
          key,
          mappedEvent.args && key in mappedEvent.args
            ? mappedEvent.args[key]
            : value.args[key],
        ]),
      );

      return [
        key,
        {
          ...value,
          args: migratedOverrideArgs,
        },
      ];
    }),
  );
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
  callback: (e: ScriptEvent) => ScriptEvent,
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
            (childEvents) => mapUncommentedScript(childEvents, callback),
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
export const mapSceneScript = <
  T extends Scene | SceneResource | CompressedSceneResourceWithChildren,
>(
  scene: T,
  options: ScriptMapOptions,
  callback: (e: ScriptEvent) => ScriptEvent,
): T => {
  const newScene = {
    ...scene,
    actors: scene.actors.map((actor) => {
      const newActor = { ...actor };
      walkActorScriptsKeys((key) => {
        newActor[key] = mapScript(actor[key], callback);
      });
      if (options?.includePrefabOverrides && newActor.prefabId) {
        newActor.prefabScriptOverrides = mapPrefabOverrides(
          newActor.prefabScriptOverrides,
          options.prefabEventsLookup,
          callback,
        );
      }
      return newActor;
    }),
    triggers: scene.triggers.map((trigger) => {
      const newTrigger = { ...trigger };
      walkTriggerScriptsKeys((key) => {
        newTrigger[key] = mapScript(trigger[key], callback);
      });
      if (options?.includePrefabOverrides && newTrigger.prefabId) {
        newTrigger.prefabScriptOverrides = mapPrefabOverrides(
          newTrigger.prefabScriptOverrides,
          options.prefabEventsLookup,
          callback,
        );
      }
      return newTrigger;
    }),
  };
  walkSceneScriptsKeys((key) => {
    newScene[key] = mapScript(scene[key], callback);
  });
  return newScene;
};

/**
 * Updates all script events within an array of scenes, including any actors or triggers within those scenes using a map function
 *
 * @param scenes - The denormalized scenes array
 * @param callback - A mapping function that is applied to each ScriptEvent.
 * @returns A new denormalized scene with updated scripts.
 */
export const mapScenesScript = <
  T extends Scene | SceneResource | CompressedSceneResourceWithChildren,
>(
  scenes: T[],
  options: ScriptMapOptions,
  callback: (e: ScriptEvent) => ScriptEvent,
): T[] => {
  return scenes.map((scene) => {
    return mapSceneScript(scene, options, callback);
  });
};

export const mapActorScript = <T extends Actor | ActorPrefab>(
  actor: T,
  callback: (e: ScriptEvent) => ScriptEvent,
): T => {
  const newActor = { ...actor };
  walkActorScriptsKeys((key) => {
    newActor[key] = mapScript(actor[key], callback);
  });
  return newActor;
};

export const mapActorsScript = <T extends Actor | ActorPrefab>(
  actors: T[],
  callback: (e: ScriptEvent) => ScriptEvent,
): T[] => {
  return actors.map((actor) => {
    return mapActorScript(actor, callback);
  });
};

export const mapTriggerScript = <T extends Trigger | TriggerPrefab>(
  trigger: T,
  callback: (e: ScriptEvent) => ScriptEvent,
): T => {
  const newTrigger = { ...trigger };
  walkTriggerScriptsKeys((key) => {
    newTrigger[key] = mapScript(trigger[key], callback);
  });
  return newTrigger;
};

export const mapTriggersScript = <T extends Trigger | TriggerPrefab>(
  triggers: T[],
  callback: (e: ScriptEvent) => ScriptEvent,
): T[] => {
  return triggers.map((trigger) => {
    return mapTriggerScript(trigger, callback);
  });
};

export const mapCustomScriptScript = <T extends CustomEvent | ScriptResource>(
  customScript: T,
  callback: (e: ScriptEvent) => ScriptEvent,
): T => {
  return {
    ...customScript,
    script: mapScript(customScript.script, callback),
  };
};

export const mapCustomScriptsScript = <T extends CustomEvent | ScriptResource>(
  customScripts: T[],
  callback: (e: ScriptEvent) => ScriptEvent,
): T[] => {
  return customScripts.map((customScript) => {
    return mapCustomScriptScript(customScript, callback);
  });
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
  callback: (e: ScriptEvent) => boolean,
) => {
  return data.reduce((memo, o) => {
    if (callback(o)) {
      memo.push({
        ...o,
        children:
          o.children &&
          mapValues(o.children, (childEvents) =>
            filterEvents(childEvents, callback),
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
        lookup: Record<string, CustomEvent>;
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
  callback: (e: ScriptEvent) => void,
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
            : [customEvent.id],
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
          callback,
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
  callback: (e: ScriptEvent) => void,
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
  actor: Actor | ActorPrefab,
  options: WalkOptions,
  callback: (e: ScriptEvent) => void,
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
  trigger: Trigger | TriggerPrefab,
  options: WalkOptions,
  callback: (e: ScriptEvent) => void,
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
  callback: (event: ScriptEvent, actor?: Actor, trigger?: Trigger) => void,
) => {
  walkSceneSpecificScripts(scene, options, (e) =>
    callback(e, undefined, undefined),
  );
  scene.actors.forEach((actor) => {
    walkActorScripts(actor, options, (e) => callback(e, actor, undefined));
  });
  scene.triggers.forEach((trigger) => {
    walkTriggerScripts(trigger, options, (e) =>
      callback(e, undefined, trigger),
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
    trigger?: Trigger,
  ) => void,
) => {
  scenes.forEach((scene) => {
    walkSceneScripts(scene, options, (e, actor, trigger) =>
      callback(e, scene, actor, trigger),
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
      overrides?: Record<string, ScriptEventArgsOverride>;
      customEvents?: {
        lookup: Record<string, CustomEventNormalized>;
        maxDepth: number;
        args?: Record<string, unknown>;
        visitedIds?: Set<string>;
      };
    };

export const replaceCustomEventArgs = <
  T extends {
    args?: Record<string, unknown>;
  },
>(
  scriptEvent: T,
  customEventArgs: Record<string, unknown> | undefined,
  overrideArgs?: Record<string, unknown> | undefined,
): T => {
  if (!customEventArgs && !overrideArgs) {
    return scriptEvent;
  }
  if (!customEventArgs) {
    return {
      ...scriptEvent,
      args: {
        ...scriptEvent.args,
        ...overrideArgs,
      },
    };
  }
  return {
    ...scriptEvent,
    args: {
      ...scriptEvent.args,
      ...overrideArgs,
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
  lookup: Record<string, ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void,
) => {
  for (let i = 0; i < ids.length; i++) {
    const scriptEvent = lookup[ids[i]];
    if (scriptEvent) {
      const override = options?.overrides?.[scriptEvent.id];
      if (scriptEvent.args?.__comment && !options?.includeCommented) {
        // Skip commented events
        continue;
      }
      // If filter is provided skip events that fail filter
      if (options?.filter && !options.filter(scriptEvent)) {
        continue;
      }
      callback(
        replaceCustomEventArgs(
          scriptEvent,
          options?.customEvents?.args,
          override?.args,
        ),
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
              : [customEvent.id],
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
            callback,
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
  lookup: Record<string, ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void,
) => {
  walkSceneScriptsKeys((key) => {
    walkNormalizedScript(scene[key], lookup, options, callback);
  });
};

export const walkNormalizedActorScripts = (
  actor: ActorNormalized | ActorPrefabNormalized,
  lookup: Record<string, ScriptEventNormalized>,
  prefabsLookup: Record<string, ActorPrefabNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void,
) => {
  const prefabId = "prefabId" in actor ? actor.prefabId : "";
  const prefab = prefabsLookup[prefabId];
  if (prefab) {
    const overrides =
      "prefabScriptOverrides" in actor
        ? actor.prefabScriptOverrides
        : undefined;
    const optionsWithOverrides = overrides
      ? { ...options, overrides }
      : options;
    return walkActorScriptsKeys((key) => {
      walkNormalizedScript(prefab[key], lookup, optionsWithOverrides, callback);
    });
  }
  walkActorScriptsKeys((key) => {
    walkNormalizedScript(actor[key], lookup, options, callback);
  });
};

export const walkNormalizedTriggerScripts = (
  trigger: TriggerNormalized | TriggerPrefabNormalized,
  lookup: Record<string, ScriptEventNormalized>,
  prefabsLookup: Record<string, TriggerPrefabNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void,
) => {
  const prefabId = "prefabId" in trigger ? trigger.prefabId : "";
  const prefab = prefabsLookup[prefabId];

  if (prefab) {
    const overrides =
      "prefabScriptOverrides" in trigger
        ? trigger.prefabScriptOverrides
        : undefined;
    const optionsWithOverrides = overrides
      ? { ...options, overrides }
      : options;
    return walkTriggerScriptsKeys((key) => {
      walkNormalizedScript(prefab[key], lookup, optionsWithOverrides, callback);
    });
  }
  walkTriggerScriptsKeys((key) => {
    walkNormalizedScript(trigger[key], lookup, options, callback);
  });
};

export const walkNormalizedSceneScripts = (
  scene: SceneNormalized,
  lookup: Record<string, ScriptEventNormalized>,
  actorsLookup: Record<string, ActorNormalized>,
  triggersLookup: Record<string, TriggerNormalized>,
  actorPrefabsLookup: Record<string, ActorPrefabNormalized>,
  triggerPrefabsLookup: Record<string, TriggerPrefabNormalized>,
  options: WalkNormalizedOptions,
  callback: (
    scriptEvent: ScriptEventNormalized,
    actor?: ActorNormalized,
    trigger?: TriggerNormalized,
  ) => void,
) => {
  walkNormalizedSceneSpecificScripts(scene, lookup, options, (e) =>
    callback(e, undefined, undefined),
  );
  scene.actors.forEach((actorId) => {
    const actor = actorsLookup[actorId];
    if (actor) {
      walkNormalizedActorScripts(
        actor,
        lookup,
        actorPrefabsLookup,
        options,
        (e) => callback(e, actor, undefined),
      );
    }
  });
  scene.triggers.forEach((triggerId) => {
    const trigger = triggersLookup[triggerId];
    if (trigger) {
      walkNormalizedTriggerScripts(
        trigger,
        lookup,
        triggerPrefabsLookup,
        options,
        (e) => callback(e, undefined, trigger),
      );
    }
  });
};

export const walkNormalizedScenesScripts = (
  scenes: SceneNormalized[],
  lookup: Record<string, ScriptEventNormalized>,
  actorsLookup: Record<string, ActorNormalized>,
  triggersLookup: Record<string, TriggerNormalized>,
  actorPrefabsLookup: Record<string, ActorPrefabNormalized>,
  triggerPrefabsLookup: Record<string, TriggerPrefabNormalized>,
  options: WalkNormalizedOptions,
  callback: (
    scriptEvent: ScriptEventNormalized,
    scene: SceneNormalized,
    actor?: ActorNormalized,
    trigger?: TriggerNormalized,
  ) => void,
) => {
  scenes.forEach((scene) => {
    walkNormalizedSceneScripts(
      scene,
      lookup,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      options,
      (e, actor, trigger) => callback(e, scene, actor, trigger),
    );
  });
};

export const walkNormalizedCustomEventScripts = (
  customEvent: CustomEventNormalized,
  lookup: Record<string, ScriptEventNormalized>,
  options: WalkNormalizedOptions,
  callback: (scriptEvent: ScriptEventNormalized) => void,
) => {
  walkNormalizedScript(customEvent.script, lookup, options, callback);
};

export const walkActorScriptsKeys = (
  callback: (scriptKey: ActorScriptKey) => void,
) => {
  actorScriptKeys.forEach((key) => callback(key));
};

export const walkTriggerScriptsKeys = (
  callback: (scriptKey: TriggerScriptKey) => void,
) => {
  triggerScriptKeys.forEach((key) => callback(key));
};

export const walkSceneScriptsKeys = (
  callback: (scriptKey: SceneScriptKey) => void,
) => {
  sceneScriptKeys.forEach((key) => callback(key));
};

//#endregion Normalized Script Events
