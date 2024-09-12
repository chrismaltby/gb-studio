import flatten from "lodash/flatten";
import { AnyAction, Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import {
  customEventSelectors,
  actorSelectors,
  triggerSelectors,
  variableSelectors,
  metaspriteSelectors,
  metaspriteTileSelectors,
  spriteStateSelectors,
  spriteAnimationSelectors,
  scriptEventSelectors,
  generateScriptEventInsertActions,
  sceneSelectors,
  actorPrefabSelectors,
  triggerPrefabSelectors,
} from "store/features/entities/entitiesState";
import {
  ActorNormalized,
  ActorPrefabNormalized,
  CustomEventNormalized,
  Metasprite,
  MetaspriteTile,
  SceneNormalized,
  ScriptEventNormalized,
  SpriteAnimation,
  TriggerNormalized,
  TriggerPrefabNormalized,
  Variable,
} from "shared/lib/entities/entitiesTypes";
import actions from "./clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { copy, pasteAny } from "./clipboardHelpers";
import {
  ClipboardTypeActors,
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
  ClipboardTypePaletteIds,
  ClipboardTypeScenes,
  ClipboardTypeScriptEvents,
  ClipboardTypeSpriteState,
  ClipboardTypeTriggers,
} from "./clipboardTypes";
import clipboardActions from "./clipboardActions";
import {
  actorName,
  customEventName,
  isActorPrefabEqual,
  isCustomEventEqual,
  isTriggerPrefabEqual,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import keyBy from "lodash/keyBy";
import {
  ScriptEventDefs,
  patchEventArgs,
} from "shared/lib/scripts/eventHelpers";
import { EVENT_CALL_CUSTOM_EVENT } from "consts";
import API from "renderer/lib/api";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import {
  walkActorScriptsKeys,
  walkNormalizedActorScripts,
  walkNormalizedCustomEventScripts,
  walkNormalizedSceneSpecificScripts,
  walkNormalizedScript,
  walkNormalizedTriggerScripts,
  walkSceneScriptsKeys,
  walkTriggerScriptsKeys,
} from "shared/lib/scripts/walk";
import { batch } from "react-redux";

const generateLocalVariableInsertActions = (
  originalId: string,
  newId: string,
  variables: Variable[]
) => {
  const actions: AnyAction[] = [];
  for (const variable of variables) {
    if (variable.id.startsWith(originalId)) {
      const variableId = variable.id.replace(originalId, newId);
      const addVarAction = entitiesActions.renameVariable({
        variableId,
        name: variable.name,
      });
      actions.push(addVarAction);
    }
  }
  return actions;
};

const generateCustomEventInsertActions = async (
  customEvent: CustomEventNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  existingCustomEvents: CustomEventNormalized[],
  existingScriptEventsLookup: Record<string, ScriptEventNormalized>
): Promise<AnyAction[]> => {
  const actions: AnyAction[] = [];

  const existingEvent = existingCustomEvents.find(
    (e) => e.id === customEvent.id
  );
  if (
    existingEvent &&
    isCustomEventEqual(
      customEvent,
      scriptEventsLookup,
      existingEvent,
      existingScriptEventsLookup
    )
  ) {
    return [];
  }

  if (existingEvent) {
    const existingEventIndex = existingCustomEvents.indexOf(existingEvent);
    const existingName = customEventName(existingEvent, existingEventIndex);
    const cancel = await API.dialog.confirmReplaceCustomEvent(existingName);
    if (cancel) {
      return [];
    }
  }

  if (!existingEvent) {
    const addCustomEventAction = entitiesActions.addCustomEvent({
      customEventId: customEvent.id,
      defaults: customEvent,
    });
    actions.push(addCustomEventAction);
  } else {
    const addCustomEventAction = entitiesActions.editCustomEvent({
      customEventId: customEvent.id,
      changes: {
        ...customEvent,
        script: [],
      },
    });
    actions.push(addCustomEventAction);
  }

  const scriptEventIds = customEvent.script;
  actions.push(
    ...generateScriptEventInsertActions(
      scriptEventIds,
      scriptEventsLookup,
      customEvent.id,
      "customEvent",
      "script"
    )
  );

  return actions;
};

const generateActorInsertActions = (
  actor: ActorNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  variables: Variable[],
  sceneId: string,
  x: number,
  y: number
): AnyAction[] => {
  const actions: AnyAction[] = [];
  const addActorAction = entitiesActions.addActor({
    sceneId,
    x,
    y,
    defaults: actor,
  });
  actions.push(addActorAction);
  walkActorScriptsKeys((key) => {
    const scriptEventIds = actor[key];
    actions.push(
      ...generateScriptEventInsertActions(
        scriptEventIds,
        scriptEventsLookup,
        addActorAction.payload.actorId,
        "actor",
        key
      )
    );
  });
  actions.push(
    ...generateLocalVariableInsertActions(
      actor.id,
      addActorAction.payload.actorId,
      variables
    )
  );
  return actions;
};

const generateActorPrefabInsertActions = async (
  prefab: ActorPrefabNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  existingActorPrefabs: ActorPrefabNormalized[],
  existingScriptEventsLookup: Record<string, ScriptEventNormalized>
): Promise<AnyAction[]> => {
  const actions: AnyAction[] = [];

  const existingPrefab = existingActorPrefabs.find((e) => e.id === prefab.id);
  if (
    existingPrefab &&
    isActorPrefabEqual(
      prefab,
      scriptEventsLookup,
      existingPrefab,
      existingScriptEventsLookup
    )
  ) {
    return [];
  }

  if (existingPrefab) {
    const existingEventIndex = existingActorPrefabs.indexOf(existingPrefab);
    const existingName = actorName(existingPrefab, existingEventIndex);
    const cancel = await API.dialog.confirmReplacePrefab(existingName);
    if (cancel) {
      return [];
    }
  }

  if (!existingPrefab) {
    const addActorPrefabAction = entitiesActions.addActorPrefab({
      actorPrefabId: prefab.id,
      defaults: prefab,
    });
    actions.push(addActorPrefabAction);
  } else {
    const addActorPrefabAction = entitiesActions.editActorPrefab({
      actorPrefabId: prefab.id,
      changes: {
        ...prefab,
        script: [],
      },
    });
    actions.push(addActorPrefabAction);
  }

  const scriptEventIds = prefab.script;
  actions.push(
    ...generateScriptEventInsertActions(
      scriptEventIds,
      scriptEventsLookup,
      prefab.id,
      "actorPrefab",
      "script"
    )
  );

  return actions;
};

const generateTriggerInsertActions = (
  trigger: TriggerNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  variables: Variable[],
  sceneId: string,
  x: number,
  y: number
): AnyAction[] => {
  const actions: AnyAction[] = [];
  const addTriggerAction = entitiesActions.addTrigger({
    sceneId,
    x,
    y,
    width: trigger.width,
    height: trigger.height,
    defaults: trigger,
  });
  actions.push(addTriggerAction);
  walkTriggerScriptsKeys((key) => {
    const scriptEventIds = trigger[key];
    actions.push(
      ...generateScriptEventInsertActions(
        scriptEventIds,
        scriptEventsLookup,
        addTriggerAction.payload.triggerId,
        "trigger",
        key
      )
    );
  });
  actions.push(
    ...generateLocalVariableInsertActions(
      trigger.id,
      addTriggerAction.payload.triggerId,
      variables
    )
  );
  return actions;
};

const generateTriggerPrefabInsertActions = async (
  prefab: TriggerPrefabNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  existingTriggerPrefabs: TriggerPrefabNormalized[],
  existingScriptEventsLookup: Record<string, ScriptEventNormalized>
): Promise<AnyAction[]> => {
  const actions: AnyAction[] = [];

  const existingPrefab = existingTriggerPrefabs.find((e) => e.id === prefab.id);
  if (
    existingPrefab &&
    isTriggerPrefabEqual(
      prefab,
      scriptEventsLookup,
      existingPrefab,
      existingScriptEventsLookup
    )
  ) {
    return [];
  }

  if (existingPrefab) {
    const existingEventIndex = existingTriggerPrefabs.indexOf(existingPrefab);
    const existingName = triggerName(existingPrefab, existingEventIndex);
    const cancel = await API.dialog.confirmReplacePrefab(existingName);
    if (cancel) {
      return [];
    }
  }

  if (!existingPrefab) {
    const addTriggerPrefabAction = entitiesActions.addTriggerPrefab({
      triggerPrefabId: prefab.id,
      defaults: prefab,
    });
    actions.push(addTriggerPrefabAction);
  } else {
    const addTriggerPrefabAction = entitiesActions.editTriggerPrefab({
      triggerPrefabId: prefab.id,
      changes: {
        ...prefab,
        script: [],
      },
    });
    actions.push(addTriggerPrefabAction);
  }

  const scriptEventIds = prefab.script;
  actions.push(
    ...generateScriptEventInsertActions(
      scriptEventIds,
      scriptEventsLookup,
      prefab.id,
      "triggerPrefab",
      "script"
    )
  );

  return actions;
};

const generateSceneInsertActions = (
  scene: SceneNormalized,
  actors: ActorNormalized[],
  triggers: TriggerNormalized[],
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  scriptEventDefs: ScriptEventDefs,
  variables: Variable[],
  x: number,
  y: number
): AnyAction[] => {
  const actions: AnyAction[] = [];
  const addSceneAction = entitiesActions.addScene({
    x,
    y,
    defaults: scene,
  });
  actions.push(addSceneAction);
  walkSceneScriptsKeys((key) => {
    const scriptEventIds = scene[key];
    actions.push(
      ...generateScriptEventInsertActions(
        scriptEventIds,
        scriptEventsLookup,
        addSceneAction.payload.sceneId,
        "scene",
        key
      )
    );
  });
  actions.push(
    ...generateLocalVariableInsertActions(
      scene.id,
      addSceneAction.payload.sceneId,
      variables
    )
  );
  for (const actor of actors) {
    actions.push(
      ...generateActorInsertActions(
        actor,
        scriptEventsLookup,
        variables,
        addSceneAction.payload.sceneId,
        actor.x,
        actor.y
      )
    );
  }
  for (const trigger of triggers) {
    actions.push(
      ...generateTriggerInsertActions(
        trigger,
        scriptEventsLookup,
        variables,
        addSceneAction.payload.sceneId,
        trigger.x,
        trigger.y
      )
    );
  }

  actions.push(
    editorActions.selectScene({ sceneId: addSceneAction.payload.sceneId })
  );

  const actorMapping: Record<string, string> = actions
    .filter((action) => {
      return action.type === "entities/addActor";
    })
    .reduce((memo, action) => {
      const oldId: string = action.payload?.defaults?.id;
      const newId: string = action.payload?.actorId;
      if (oldId && newId) {
        memo[oldId] = newId;
      }
      return memo;
    }, {} as Record<string, string>);

  const remappedActions = actions.map((action) => {
    if (action.type !== "entities/addScriptEvents") {
      return action;
    }
    return {
      ...action,
      payload: {
        ...action.payload,
        data: action.payload.data.map((eventData: ScriptEventNormalized) => {
          return {
            ...eventData,
            args: patchEventArgs(
              eventData.command,
              "actor",
              eventData.args || {},
              actorMapping,
              scriptEventDefs
            ),
          };
        }),
      },
    };
  });

  return remappedActions;
};

const clipboardMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.copyText.match(action)) {
      API.clipboard.writeText(action.payload);
    } else if (actions.copySpriteState.match(action)) {
      const state = store.getState();
      const spriteStateLookup = spriteStateSelectors.selectEntities(state);
      const animationsLookup = spriteAnimationSelectors.selectEntities(state);
      const metaspritesLookup = metaspriteSelectors.selectEntities(state);
      const metaspriteTilesLookup =
        metaspriteTileSelectors.selectEntities(state);

      const spriteState = spriteStateLookup[action.payload.spriteStateId];
      if (!spriteState) {
        return;
      }

      const animations = spriteState.animations
        .map((id) => {
          return animationsLookup[id];
        })
        .filter((animation): animation is SpriteAnimation => !!animation);

      const metaspriteIds = flatten(
        animations.map((animation) => animation.frames)
      );

      const metasprites = metaspriteIds
        .map((id) => {
          return metaspritesLookup[id];
        })
        .filter((metasprite): metasprite is Metasprite => !!metasprite);

      const metaspriteTileIds = flatten(
        metasprites.map((metasprite) => metasprite.tiles)
      );

      const metaspriteTiles = metaspriteTileIds
        .map((tileId) => {
          return metaspriteTilesLookup[tileId];
        })
        .filter((tile): tile is MetaspriteTile => !!tile);

      copy({
        format: ClipboardTypeSpriteState,
        data: {
          spriteState,
          animations,
          metasprites,
          metaspriteTiles,
        },
      });
    } else if (actions.copyMetasprites.match(action)) {
      const state = store.getState();
      const metaspritesLookup = metaspriteSelectors.selectEntities(state);
      const metaspriteTilesLookup =
        metaspriteTileSelectors.selectEntities(state);

      const metasprites = action.payload.metaspriteIds
        .map((id) => {
          return metaspritesLookup[id];
        })
        .filter((metasprite): metasprite is Metasprite => !!metasprite);

      const metaspriteTileIds = flatten(
        metasprites.map((metasprite) => metasprite.tiles)
      );

      const metaspriteTiles = metaspriteTileIds
        .map((tileId) => {
          return metaspriteTilesLookup[tileId];
        })
        .filter((tile): tile is MetaspriteTile => !!tile);

      copy({
        format: ClipboardTypeMetasprites,
        data: {
          metasprites,
          metaspriteTiles,
        },
      });
    } else if (actions.copyMetaspriteTiles.match(action)) {
      const state = store.getState();
      const metaspriteTilesLookup =
        metaspriteTileSelectors.selectEntities(state);
      const metaspriteTiles = action.payload.metaspriteTileIds
        .map((tileId) => {
          return metaspriteTilesLookup[tileId];
        })
        .filter((tile): tile is MetaspriteTile => !!tile);
      copy({
        format: ClipboardTypeMetaspriteTiles,
        data: {
          metaspriteTiles,
        },
      });
    } else if (actions.copyScriptEvents.match(action)) {
      const state = store.getState();
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const scriptEvents: ScriptEventNormalized[] = [];
      const customEvents: CustomEventNormalized[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const addEvent = (scriptEvent: ScriptEventNormalized) => {
        scriptEvents.push(scriptEvent);
        if (
          scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
          scriptEvent.args?.customEventId
        ) {
          const customEvent =
            customEventsLookup[scriptEvent.args?.customEventId as string];
          if (customEvent && !customEventsSeen[customEvent.id]) {
            customEventsSeen[customEvent.id] = true;
            customEvents.push(customEvent);
          }
        }
      };

      walkNormalizedScript(
        action.payload.scriptEventIds,
        scriptEventsLookup,
        {
          includeCommented: true,
        },
        addEvent
      );
      for (const customEvent of customEvents) {
        walkNormalizedCustomEventScripts(
          customEvent,
          scriptEventsLookup,
          {
            includeCommented: true,
          },
          addEvent
        );
      }
      copy({
        format: ClipboardTypeScriptEvents,
        data: {
          scriptEvents,
          customEvents,
          script: action.payload.scriptEventIds,
        },
      });
    } else if (actions.copyTriggers.match(action)) {
      const state = store.getState();
      const triggersLookup = triggerSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const triggerPrefabsLookup = triggerPrefabSelectors.selectEntities(state);
      const triggers: TriggerNormalized[] = [];
      const scriptEvents: ScriptEventNormalized[] = [];
      const customEvents: CustomEventNormalized[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const triggerPrefabs: TriggerPrefabNormalized[] = [];
      const triggerPrefabsSeen: Record<string, boolean> = {};
      const allVariables = variableSelectors.selectAll(state);
      const variables = allVariables.filter((variable) => {
        return action.payload.triggerIds.find((id) =>
          variable.id.startsWith(id)
        );
      });

      const addEvent = (scriptEvent: ScriptEventNormalized) => {
        scriptEvents.push(scriptEvent);
        if (
          scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
          scriptEvent.args?.customEventId
        ) {
          const customEvent =
            customEventsLookup[scriptEvent.args?.customEventId as string];
          if (customEvent && !customEventsSeen[customEvent.id]) {
            customEventsSeen[customEvent.id] = true;
            customEvents.push(customEvent);
          }
        }
      };

      action.payload.triggerIds.forEach((triggerId) => {
        const trigger = triggersLookup[triggerId];
        if (trigger) {
          triggers.push(trigger);
          walkNormalizedTriggerScripts(
            trigger,
            scriptEventsLookup,
            {},
            { includeCommented: true },
            addEvent
          );
          const prefab = triggerPrefabsLookup[trigger.prefabId];
          if (prefab && !triggerPrefabsSeen[prefab.id]) {
            triggerPrefabsSeen[prefab.id] = true;
            triggerPrefabs.push(prefab);
            walkNormalizedTriggerScripts(
              prefab,
              scriptEventsLookup,
              {},
              { includeCommented: true },
              addEvent
            );
          }
        }
      });
      for (const customEvent of customEvents) {
        walkNormalizedCustomEventScripts(
          customEvent,
          scriptEventsLookup,
          { includeCommented: true },
          addEvent
        );
      }

      copy({
        format: ClipboardTypeTriggers,
        data: {
          triggers,
          customEvents,
          variables,
          scriptEvents,
          triggerPrefabs,
        },
      });
    } else if (actions.copyActors.match(action)) {
      const state = store.getState();
      const actorsLookup = actorSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const actorPrefabsLookup = actorPrefabSelectors.selectEntities(state);
      const actors: ActorNormalized[] = [];
      const scriptEvents: ScriptEventNormalized[] = [];
      const customEvents: CustomEventNormalized[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const actorPrefabs: ActorPrefabNormalized[] = [];
      const actorPrefabsSeen: Record<string, boolean> = {};
      const allVariables = variableSelectors.selectAll(state);
      const variables = allVariables.filter((variable) => {
        return action.payload.actorIds.find((id) => variable.id.startsWith(id));
      });

      const addEvent = (scriptEvent: ScriptEventNormalized) => {
        scriptEvents.push(scriptEvent);
        if (
          scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
          scriptEvent.args?.customEventId
        ) {
          const customEvent =
            customEventsLookup[scriptEvent.args?.customEventId as string];
          if (customEvent && !customEventsSeen[customEvent.id]) {
            customEventsSeen[customEvent.id] = true;
            customEvents.push(customEvent);
          }
        }
      };

      action.payload.actorIds.forEach((actorId) => {
        const actor = actorsLookup[actorId];
        if (actor) {
          actors.push(actor);
          walkNormalizedActorScripts(
            actor,
            scriptEventsLookup,
            {},
            { includeCommented: true },
            addEvent
          );
          const prefab = actorPrefabsLookup[actor.prefabId];
          if (prefab && !actorPrefabsSeen[prefab.id]) {
            actorPrefabsSeen[prefab.id] = true;
            actorPrefabs.push(prefab);
            walkNormalizedActorScripts(
              prefab,
              scriptEventsLookup,
              {},
              { includeCommented: true },
              addEvent
            );
          }
        }
      });
      for (const customEvent of customEvents) {
        walkNormalizedCustomEventScripts(
          customEvent,
          scriptEventsLookup,
          { includeCommented: true },
          addEvent
        );
      }

      copy({
        format: ClipboardTypeActors,
        data: {
          actors,
          customEvents,
          variables,
          scriptEvents,
          actorPrefabs,
        },
      });
    } else if (actions.copyScenes.match(action)) {
      const state = store.getState();
      const scenesLookup = sceneSelectors.selectEntities(state);
      const actorsLookup = actorSelectors.selectEntities(state);
      const triggersLookup = triggerSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const actorPrefabsLookup = actorPrefabSelectors.selectEntities(state);
      const triggerPrefabsLookup = triggerPrefabSelectors.selectEntities(state);
      const scenes: SceneNormalized[] = [];
      const actors: ActorNormalized[] = [];
      const triggers: TriggerNormalized[] = [];
      const customEvents: CustomEventNormalized[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const actorPrefabs: ActorPrefabNormalized[] = [];
      const actorPrefabsSeen: Record<string, boolean> = {};
      const triggerPrefabs: TriggerPrefabNormalized[] = [];
      const triggerPrefabsSeen: Record<string, boolean> = {};

      const scriptEvents: ScriptEventNormalized[] = [];

      const addEvent = (scriptEvent: ScriptEventNormalized) => {
        scriptEvents.push(scriptEvent);
        if (
          scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
          scriptEvent.args?.customEventId
        ) {
          const customEvent =
            customEventsLookup[scriptEvent.args?.customEventId as string];
          if (customEvent && !customEventsSeen[customEvent.id]) {
            customEventsSeen[customEvent.id] = true;
            customEvents.push(customEvent);
          }
        }
      };

      const entityIds = [...action.payload.sceneIds];

      action.payload.sceneIds.forEach((sceneId) => {
        const scene = scenesLookup[sceneId];
        if (scene) {
          scenes.push(scene);
          entityIds.push(...scene.actors);
          entityIds.push(...scene.triggers);
          scene.actors.forEach((actorId) => {
            const actor = actorsLookup[actorId];
            if (actor) {
              actors.push(actor);
              walkNormalizedActorScripts(
                actor,
                scriptEventsLookup,
                {},
                { includeCommented: true },
                addEvent
              );
              const prefab = actorPrefabsLookup[actor.prefabId];
              if (prefab && !actorPrefabsSeen[prefab.id]) {
                actorPrefabsSeen[prefab.id] = true;
                actorPrefabs.push(prefab);
                walkNormalizedActorScripts(
                  prefab,
                  scriptEventsLookup,
                  {},
                  { includeCommented: true },
                  addEvent
                );
              }
            }
          });
          scene.triggers.forEach((triggerId) => {
            const trigger = triggersLookup[triggerId];
            if (trigger) {
              triggers.push(trigger);
              walkNormalizedTriggerScripts(
                trigger,
                scriptEventsLookup,
                {},
                { includeCommented: true },
                addEvent
              );
              const prefab = triggerPrefabsLookup[trigger.prefabId];
              if (prefab && !triggerPrefabsSeen[prefab.id]) {
                triggerPrefabsSeen[prefab.id] = true;
                triggerPrefabs.push(prefab);
                walkNormalizedTriggerScripts(
                  prefab,
                  scriptEventsLookup,
                  {},
                  { includeCommented: true },
                  addEvent
                );
              }
            }
          });
          walkNormalizedSceneSpecificScripts(
            scene,
            scriptEventsLookup,
            { includeCommented: true },
            addEvent
          );
        }
      });
      for (const customEvent of customEvents) {
        walkNormalizedCustomEventScripts(
          customEvent,
          scriptEventsLookup,
          { includeCommented: true },
          addEvent
        );
      }

      const allVariables = variableSelectors.selectAll(state);
      const variables = allVariables.filter((variable) => {
        return entityIds.find((id) => variable.id.startsWith(id));
      });

      copy({
        format: ClipboardTypeScenes,
        data: {
          scenes,
          actors,
          triggers,
          variables,
          customEvents,
          scriptEvents,
          actorPrefabs,
          triggerPrefabs,
        },
      });
    } else if (actions.pasteScriptEvents.match(action)) {
      const clipboard = await pasteAny();
      if (!clipboard) {
        return next(action);
      }
      if (clipboard.format === ClipboardTypeScriptEvents) {
        const state = store.getState();
        const scriptEventIds = clipboard.data.script;
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const existingCustomEvents = customEventSelectors.selectAll(state);
        const existingScriptEventsLookup =
          scriptEventSelectors.selectEntities(state);
        const insertActions = generateScriptEventInsertActions(
          scriptEventIds,
          scriptEventsLookup,
          action.payload.entityId,
          action.payload.type,
          action.payload.key,
          action.payload.insertId,
          action.payload.before
        );
        for (const action of insertActions) {
          store.dispatch(action);
        }
        for (const customEvent of clipboard.data.customEvents) {
          const actions = await generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
      }
    } else if (actions.pasteScriptEventValues.match(action)) {
      const clipboard = await pasteAny();
      if (!clipboard) {
        return next(action);
      }
      if (clipboard.format === ClipboardTypeScriptEvents) {
        const state = store.getState();
        const currentEvent =
          state.project.present.entities.scriptEvents.entities[
            action.payload.scriptEventId
          ];
        const scriptEvent = clipboard.data.scriptEvents[0];
        if (currentEvent && scriptEvent) {
          store.dispatch(
            entitiesActions.editScriptEvent({
              scriptEventId: action.payload.scriptEventId,
              changes: {
                args: {
                  ...currentEvent.args,
                  ...scriptEvent.args,
                },
              },
            })
          );
        }
      }
    } else if (actions.pasteTriggerAt.match(action)) {
      const clipboard = await pasteAny();
      if (clipboard && clipboard.format === ClipboardTypeTriggers) {
        const state = store.getState();
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const existingCustomEvents = customEventSelectors.selectAll(state);
        const existingTriggerPrefabs = triggerPrefabSelectors.selectAll(state);
        const existingScriptEventsLookup =
          scriptEventSelectors.selectEntities(state);

        for (const prefab of clipboard.data.triggerPrefabs ?? []) {
          const actions = await generateTriggerPrefabInsertActions(
            prefab,
            scriptEventsLookup,
            existingTriggerPrefabs,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
        for (const trigger of clipboard.data.triggers) {
          const actions = generateTriggerInsertActions(
            trigger,
            scriptEventsLookup,
            clipboard.data.variables,
            action.payload.sceneId,
            action.payload.x,
            action.payload.y
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
        for (const customEvent of clipboard.data.customEvents) {
          const actions = await generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
      }
    } else if (actions.pasteActorAt.match(action)) {
      const clipboard = await pasteAny();
      if (clipboard && clipboard.format === ClipboardTypeActors) {
        const state = store.getState();
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const existingCustomEvents = customEventSelectors.selectAll(state);
        const existingActorPrefabs = actorPrefabSelectors.selectAll(state);
        const existingScriptEventsLookup =
          scriptEventSelectors.selectEntities(state);
        for (const prefab of clipboard.data.actorPrefabs ?? []) {
          const actions = await generateActorPrefabInsertActions(
            prefab,
            scriptEventsLookup,
            existingActorPrefabs,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
        for (const actor of clipboard.data.actors) {
          const actions = generateActorInsertActions(
            actor,
            scriptEventsLookup,
            clipboard.data.variables,
            action.payload.sceneId,
            action.payload.x,
            action.payload.y
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
        for (const customEvent of clipboard.data.customEvents) {
          const actions = await generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
      }
    } else if (actions.pasteSceneAt.match(action)) {
      const clipboard = await pasteAny();
      if (clipboard && clipboard.format === ClipboardTypeScenes) {
        const state = store.getState();
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const scriptEventDefs = selectScriptEventDefs(state);
        const existingCustomEvents = customEventSelectors.selectAll(state);
        const existingActorPrefabs = actorPrefabSelectors.selectAll(state);
        const existingTriggerPrefabs = triggerPrefabSelectors.selectAll(state);
        const existingScriptEventsLookup =
          scriptEventSelectors.selectEntities(state);

        for (const prefab of clipboard.data.actorPrefabs ?? []) {
          const actions = await generateActorPrefabInsertActions(
            prefab,
            scriptEventsLookup,
            existingActorPrefabs,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }

        for (const prefab of clipboard.data.triggerPrefabs ?? []) {
          const actions = await generateTriggerPrefabInsertActions(
            prefab,
            scriptEventsLookup,
            existingTriggerPrefabs,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }

        for (const scene of clipboard.data.scenes) {
          const actions = generateSceneInsertActions(
            scene,
            clipboard.data.actors,
            clipboard.data.triggers,
            scriptEventsLookup,
            scriptEventDefs,
            clipboard.data.variables,
            action.payload.x,
            action.payload.y
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }

        for (const customEvent of clipboard.data.customEvents) {
          const actions = await generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          batch(() => {
            for (const action of actions) {
              store.dispatch(action);
            }
          });
        }
      }
    } else if (actions.fetchClipboard.match(action)) {
      const clipboard = await pasteAny();
      if (clipboard) {
        store.dispatch(clipboardActions.setClipboardData(clipboard));
      } else {
        store.dispatch(clipboardActions.clearClipboardData());
      }
    } else if (actions.pasteSprite.match(action)) {
      const clipboard = await pasteAny();

      if (!clipboard) {
        return next(action);
      }

      if (clipboard.format === ClipboardTypeSpriteState) {
        const data = clipboard.data;
        const state = store.getState();

        const spriteState = spriteStateSelectors.selectById(
          state,
          action.payload.spriteStateId
        );
        if (!spriteState) {
          return;
        }

        // Update Sprite State
        store.dispatch(
          entitiesActions.editSpriteState({
            spriteStateId: action.payload.spriteStateId,
            changes: {
              animationType: data.spriteState.animationType,
              flipLeft: data.spriteState.flipLeft,
            },
          })
        );

        // Update sprite animations
        for (let i = 0; i < spriteState.animations.length; i++) {
          const animationId = spriteState.animations[i];
          const newData = data.animations[i];
          if (!newData) {
            continue;
          }

          store.dispatch(
            entitiesActions.editSpriteAnimation({
              spriteSheetId: action.payload.spriteSheetId,
              spriteAnimationId: animationId,
              changes: {
                frames: [],
              },
            })
          );

          const animMetasprites = data.metasprites.filter((metasprite) => {
            return newData.frames.includes(metasprite.id);
          });

          const newActions = animMetasprites.map(() => {
            return entitiesActions.addMetasprite({
              spriteSheetId: action.payload.spriteSheetId,
              spriteAnimationId: animationId,
            });
          });

          for (const action of newActions) {
            store.dispatch(action);
          }

          const newIds = newActions.map(
            (action) => action.payload.metaspriteId
          );

          const tileIdMetaspriteLookup = animMetasprites.reduce(
            (memo, metasprite, index) => {
              for (const tileId of metasprite.tiles) {
                memo[tileId] = newIds[index];
              }
              return memo;
            },
            {} as Record<string, string>
          );

          const newTileActions = data.metaspriteTiles.map((tile) => {
            return entitiesActions.addMetaspriteTile({
              spriteSheetId: action.payload.spriteSheetId,
              metaspriteId: tileIdMetaspriteLookup[tile.id] || "",
              x: tile.x,
              y: tile.y,
              sliceX: tile.sliceX,
              sliceY: tile.sliceY,
              flipX: tile.flipX,
              flipY: tile.flipY,
              objPalette: tile.objPalette,
              paletteIndex: tile.paletteIndex,
              priority: tile.priority,
            });
          });

          for (const action of newTileActions) {
            store.dispatch(action);
          }
        }
      } else if (clipboard.format === ClipboardTypeMetasprites) {
        const data = clipboard.data;

        const newActions = data.metasprites.map(() => {
          return entitiesActions.addMetasprite({
            spriteSheetId: action.payload.spriteSheetId,
            spriteAnimationId: action.payload.spriteAnimationId,
          });
        });

        for (const action of newActions) {
          store.dispatch(action);
        }

        const newIds = newActions.map((action) => action.payload.metaspriteId);

        const tileIdMetaspriteLookup = data.metasprites.reduce(
          (memo, metasprite, index) => {
            for (const tileId of metasprite.tiles) {
              memo[tileId] = newIds[index];
            }
            return memo;
          },
          {} as Record<string, string>
        );

        const newTileActions = data.metaspriteTiles.map((tile) => {
          return entitiesActions.addMetaspriteTile({
            spriteSheetId: action.payload.spriteSheetId,
            metaspriteId: tileIdMetaspriteLookup[tile.id] || "",
            x: tile.x,
            y: tile.y,
            sliceX: tile.sliceX,
            sliceY: tile.sliceY,
            flipX: tile.flipX,
            flipY: tile.flipY,
            objPalette: tile.objPalette,
            paletteIndex: tile.paletteIndex,
            priority: tile.priority,
          });
        });

        for (const action of newTileActions) {
          store.dispatch(action);
        }
      } else if (clipboard.format === ClipboardTypeMetaspriteTiles) {
        const data = clipboard.data;

        const newActions = data.metaspriteTiles.map((tile) => {
          return entitiesActions.addMetaspriteTile({
            spriteSheetId: action.payload.spriteSheetId,
            metaspriteId: action.payload.metaspriteId,
            x: tile.x,
            y: tile.y,
            sliceX: tile.sliceX,
            sliceY: tile.sliceY,
            flipX: tile.flipX,
            flipY: tile.flipY,
            objPalette: tile.objPalette,
            paletteIndex: tile.paletteIndex,
            priority: tile.priority,
          });
        });

        for (const action of newActions) {
          store.dispatch(action);
        }

        const newIds = newActions.map(
          (action) => action.payload.metaspriteTileId
        );

        store.dispatch(editorActions.setSelectedMetaspriteTileIds(newIds));
      }
    } else if (actions.copyPaletteIds.match(action)) {
      copy({
        format: ClipboardTypePaletteIds,
        data: {
          paletteIds: action.payload.paletteIds,
        },
      });
    } else if (actions.pastePaletteIds.match(action)) {
      const clipboard = await pasteAny();

      if (!clipboard) {
        return next(action);
      }

      if (clipboard.format === ClipboardTypePaletteIds) {
        const data = clipboard.data;
        if (action.payload.type === "background") {
          store.dispatch(
            entitiesActions.editScene({
              sceneId: action.payload.sceneId,
              changes: {
                paletteIds: data.paletteIds,
              },
            })
          );
        } else {
          store.dispatch(
            entitiesActions.editScene({
              sceneId: action.payload.sceneId,
              changes: {
                spritePaletteIds: data.paletteIds,
              },
            })
          );
        }
      }
    } else if (
      editorActions.selectWorld.match(action) ||
      editorActions.selectScene.match(action) ||
      editorActions.selectActor.match(action) ||
      editorActions.selectTrigger.match(action) ||
      editorActions.selectCustomEvent.match(action) ||
      editorActions.selectVariable.match(action) ||
      editorActions.dragActorStart.match(action) ||
      editorActions.dragTriggerStart.match(action)
    ) {
      // Remove text selection (likely from debugger build log)
      // when making a selection to allow copy/paste binding to work
      window.getSelection()?.removeAllRanges();
    }
    next(action);
  };

export default clipboardMiddleware;
