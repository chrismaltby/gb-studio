import flatten from "lodash/flatten";
import { AnyAction, Dictionary, Dispatch, Middleware } from "@reduxjs/toolkit";
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
} from "../entities/entitiesState";
import {
  Actor,
  CustomEvent,
  Metasprite,
  MetaspriteTile,
  Scene,
  ScriptEvent,
  SpriteAnimation,
  Trigger,
  Variable,
} from "../entities/entitiesTypes";
import actions from "./clipboardActions";
import entitiesActions from "../entities/entitiesActions";
import editorActions from "../editor/editorActions";
import confirmReplaceCustomEvent from "lib/electron/dialog/confirmReplaceCustomEvent";
import { clipboard, copy, pasteAny } from "./clipboardHelpers";
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
  customEventName,
  isCustomEventEqual,
  walkActorScriptsKeys,
  walkNormalisedActorEvents,
  walkNormalisedCustomEventEvents,
  walkNormalisedSceneSpecificEvents,
  walkNormalisedScriptEvents,
  walkNormalisedTriggerEvents,
  walkSceneScriptsKeys,
  walkTriggerScriptsKeys,
} from "../entities/entitiesHelpers";
import keyBy from "lodash/keyBy";
import { patchEventArgs } from "lib/helpers/eventHelpers";
import { EVENT_CALL_CUSTOM_EVENT } from "lib/compiler/eventTypes";

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

const generateCustomEventInsertActions = (
  customEvent: CustomEvent,
  scriptEventsLookup: Dictionary<ScriptEvent>,
  existingCustomEvents: CustomEvent[],
  existingScriptEventsLookup: Dictionary<ScriptEvent>
): AnyAction[] => {
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
    const cancel = confirmReplaceCustomEvent(existingName);
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
  actor: Actor,
  scriptEventsLookup: Dictionary<ScriptEvent>,
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

const generateTriggerInsertActions = (
  trigger: Trigger,
  scriptEventsLookup: Dictionary<ScriptEvent>,
  variables: Variable[],
  sceneId: string,
  x: number,
  y: number
): AnyAction[] => {
  const actions: AnyAction[] = [];
  const scriptEventIds = trigger.script;
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

const generateSceneInsertActions = (
  scene: Scene,
  actors: Actor[],
  triggers: Trigger[],
  scriptEventsLookup: Dictionary<ScriptEvent>,
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
        data: action.payload.data.map((eventData: ScriptEvent) => {
          return {
            ...eventData,
            args: patchEventArgs(
              eventData.command,
              "actor",
              eventData.args || {},
              actorMapping
            ),
          };
        }),
      },
    };
  });

  return remappedActions;
};

const clipboardMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.copyText.match(action)) {
      clipboard.writeText(action.payload);
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
      const scriptEvents: ScriptEvent[] = [];
      const customEvents: CustomEvent[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const addEvent = (scriptEvent: ScriptEvent) => {
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

      walkNormalisedScriptEvents(
        action.payload.scriptEventIds,
        scriptEventsLookup,
        undefined,
        addEvent
      );
      for (const customEvent of customEvents) {
        walkNormalisedCustomEventEvents(
          customEvent,
          scriptEventsLookup,
          undefined,
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
      const triggers: Trigger[] = [];
      const scriptEvents: ScriptEvent[] = [];
      const customEvents: CustomEvent[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const allVariables = variableSelectors.selectAll(state);
      const variables = allVariables.filter((variable) => {
        return action.payload.triggerIds.find((id) =>
          variable.id.startsWith(id)
        );
      });

      const addEvent = (scriptEvent: ScriptEvent) => {
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
          walkNormalisedTriggerEvents(
            trigger,
            scriptEventsLookup,
            undefined,
            addEvent
          );
        }
      });
      for (const customEvent of customEvents) {
        walkNormalisedCustomEventEvents(
          customEvent,
          scriptEventsLookup,
          undefined,
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
        },
      });
    } else if (actions.copyActors.match(action)) {
      const state = store.getState();
      const actorsLookup = actorSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const actors: Actor[] = [];
      const scriptEvents: ScriptEvent[] = [];
      const customEvents: CustomEvent[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const allVariables = variableSelectors.selectAll(state);
      const variables = allVariables.filter((variable) => {
        return action.payload.actorIds.find((id) => variable.id.startsWith(id));
      });

      const addEvent = (scriptEvent: ScriptEvent) => {
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
          walkNormalisedActorEvents(
            actor,
            scriptEventsLookup,
            undefined,
            addEvent
          );
        }
      });
      for (const customEvent of customEvents) {
        walkNormalisedCustomEventEvents(
          customEvent,
          scriptEventsLookup,
          undefined,
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
        },
      });
    } else if (actions.copyScenes.match(action)) {
      const state = store.getState();
      const scenesLookup = sceneSelectors.selectEntities(state);
      const actorsLookup = actorSelectors.selectEntities(state);
      const triggersLookup = triggerSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const scenes: Scene[] = [];
      const actors: Actor[] = [];
      const triggers: Trigger[] = [];
      const customEvents: CustomEvent[] = [];
      const customEventsSeen: Record<string, boolean> = {};
      const scriptEvents: ScriptEvent[] = [];

      const addEvent = (scriptEvent: ScriptEvent) => {
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
              walkNormalisedActorEvents(
                actor,
                scriptEventsLookup,
                undefined,
                addEvent
              );
            }
          });
          scene.triggers.forEach((triggerId) => {
            const trigger = triggersLookup[triggerId];
            if (trigger) {
              triggers.push(trigger);
              walkNormalisedTriggerEvents(
                trigger,
                scriptEventsLookup,
                undefined,
                addEvent
              );
            }
          });
          walkNormalisedSceneSpecificEvents(
            scene,
            scriptEventsLookup,
            undefined,
            addEvent
          );
        }
      });
      for (const customEvent of customEvents) {
        walkNormalisedCustomEventEvents(
          customEvent,
          scriptEventsLookup,
          undefined,
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
        },
      });
    } else if (actions.pasteScriptEvents.match(action)) {
      const clipboard = pasteAny();
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
          const actions = generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          for (const action of actions) {
            store.dispatch(action);
          }
        }
      }
    } else if (actions.pasteScriptEventValues.match(action)) {
      const clipboard = pasteAny();
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
      const clipboard = pasteAny();
      if (clipboard && clipboard.format === ClipboardTypeTriggers) {
        const state = store.getState();
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const existingCustomEvents = customEventSelectors.selectAll(state);
        const existingScriptEventsLookup =
          scriptEventSelectors.selectEntities(state);
        for (const trigger of clipboard.data.triggers) {
          const actions = generateTriggerInsertActions(
            trigger,
            scriptEventsLookup,
            clipboard.data.variables,
            action.payload.sceneId,
            action.payload.x,
            action.payload.y
          );
          for (const action of actions) {
            store.dispatch(action);
          }
        }
        for (const customEvent of clipboard.data.customEvents) {
          const actions = generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          for (const action of actions) {
            store.dispatch(action);
          }
        }
      }
    } else if (actions.pasteActorAt.match(action)) {
      const clipboard = pasteAny();
      if (clipboard && clipboard.format === ClipboardTypeActors) {
        const state = store.getState();
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const existingCustomEvents = customEventSelectors.selectAll(state);
        const existingScriptEventsLookup =
          scriptEventSelectors.selectEntities(state);
        for (const actor of clipboard.data.actors) {
          const actions = generateActorInsertActions(
            actor,
            scriptEventsLookup,
            clipboard.data.variables,
            action.payload.sceneId,
            action.payload.x,
            action.payload.y
          );
          for (const action of actions) {
            store.dispatch(action);
          }
        }
        for (const customEvent of clipboard.data.customEvents) {
          const actions = generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          for (const action of actions) {
            store.dispatch(action);
          }
        }
      }
    } else if (actions.pasteSceneAt.match(action)) {
      const clipboard = pasteAny();
      if (clipboard && clipboard.format === ClipboardTypeScenes) {
        const state = store.getState();
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const existingCustomEvents = customEventSelectors.selectAll(state);
        const existingScriptEventsLookup =
          scriptEventSelectors.selectEntities(state);
        for (const scene of clipboard.data.scenes) {
          const actions = generateSceneInsertActions(
            scene,
            clipboard.data.actors,
            clipboard.data.triggers,
            scriptEventsLookup,
            clipboard.data.variables,
            action.payload.x,
            action.payload.y
          );
          for (const action of actions) {
            store.dispatch(action);
          }
        }
        for (const customEvent of clipboard.data.customEvents) {
          const actions = generateCustomEventInsertActions(
            customEvent,
            scriptEventsLookup,
            existingCustomEvents,
            existingScriptEventsLookup
          );
          for (const action of actions) {
            store.dispatch(action);
          }
        }
      }
    } else if (actions.fetchClipboard.match(action)) {
      const clipboard = pasteAny();
      if (clipboard) {
        store.dispatch(clipboardActions.setClipboardData(clipboard));
      } else {
        store.dispatch(clipboardActions.clearClipboardData());
      }
    } else if (actions.pasteSprite.match(action)) {
      const clipboard = pasteAny();

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
            {} as Dictionary<string>
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
          {} as Dictionary<string>
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
      const clipboard = pasteAny();

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
    }
    next(action);
  };

export default clipboardMiddleware;
