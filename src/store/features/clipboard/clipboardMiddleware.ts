import { clipboard } from "electron";
import uniq from "lodash/uniq";
import flatten from "lodash/flatten";
import {
  getCustomEventIdsInEvents,
  getCustomEventIdsInActor,
  getCustomEventIdsInScene,
} from "lib/helpers/eventSystem";
import { Dictionary, Dispatch, Middleware } from "@reduxjs/toolkit";
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
} from "../entities/entitiesState";
import {
  CustomEvent,
  Metasprite,
  MetaspriteTile,
  ScriptEvent,
  SpriteAnimation,
  Trigger,
} from "../entities/entitiesTypes";
import actions from "./clipboardActions";
import entitiesActions from "../entities/entitiesActions";
import editorActions from "../editor/editorActions";
import confirmReplaceCustomEvent from "lib/electron/dialog/confirmReplaceCustomEvent";
import { copy, pasteAny } from "./clipboardHelpers";
import {
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
  ClipboardTypePaletteIds,
  ClipboardTypeScriptEvents,
  ClipboardTypeSpriteState,
  ClipboardTypeTriggers,
} from "./clipboardTypes";
import clipboardActions from "./clipboardActions";
import {
  walkNormalisedScriptEvents,
  walkNormalisedTriggerEvents,
} from "../entities/entitiesHelpers";
import keyBy from "lodash/keyBy";

const clipboardMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.copyActor.match(action)) {
      const state = store.getState();
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const usedCustomEventIds = uniq(getCustomEventIdsInActor(action.payload));
      const usedCustomEvents = usedCustomEventIds
        .map((id) => customEventsLookup[id])
        .filter((i) => i);
      const allVariables = variableSelectors.selectAll(state);
      const usedVariables = allVariables.filter((variable) => {
        return variable.id.startsWith(action.payload.id);
      });
      clipboard.writeText(
        JSON.stringify(
          {
            actor: action.payload,
            __type: "actor",
            __customEvents:
              usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
            __variables: usedVariables.length > 0 ? usedVariables : undefined,
          },
          null,
          4
        )
      );
    } else if (actions.copyTrigger.match(action)) {
      const state = store.getState();
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const usedCustomEventIds = uniq(
        getCustomEventIdsInEvents(action.payload.script)
      );
      const usedCustomEvents = usedCustomEventIds
        .map((id) => customEventsLookup[id])
        .filter((i) => i);
      const allVariables = variableSelectors.selectAll(state);
      const usedVariables = allVariables.filter((variable) => {
        return variable.id.startsWith(action.payload.id);
      });
      clipboard.writeText(
        JSON.stringify(
          {
            trigger: action.payload,
            __type: "trigger",
            __customEvents:
              usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
            __variables: usedVariables.length > 0 ? usedVariables : undefined,
          },
          null,
          4
        )
      );
    } else if (actions.copyScene.match(action)) {
      const state = store.getState();
      const actors = actorSelectors.selectEntities(state);
      const triggers = triggerSelectors.selectEntities(state);

      const scene = {
        ...action.payload,
        actors: action.payload.actors.map((actorId) => actors[actorId]),
        triggers: action.payload.triggers.map(
          (triggerId) => triggers[triggerId]
        ),
      };

      const customEventsLookup = customEventSelectors.selectEntities(state);
      const usedCustomEventIds = uniq(getCustomEventIdsInScene(scene));
      const usedCustomEvents = usedCustomEventIds
        .map((id) => customEventsLookup[id])
        .filter((i) => i);
      const allVariables = variableSelectors.selectAll(state);

      const entityIds = [
        action.payload.id,
        ...action.payload.actors,
        ...action.payload.triggers,
      ];
      const usedVariables = allVariables.filter((variable) => {
        return entityIds.find((id) => variable.id.startsWith(id));
      });

      clipboard.writeText(
        JSON.stringify(
          {
            scene,
            __type: "scene",
            __customEvents:
              usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
            __variables: usedVariables.length > 0 ? usedVariables : undefined,
          },
          null,
          4
        )
      );
    } else if (actions.copyEvent.match(action)) {
      const state = store.getState();
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const usedCustomEventIds = uniq(
        getCustomEventIdsInEvents([action.payload])
      );
      const usedCustomEvents = usedCustomEventIds
        .map((id) => customEventsLookup[id])
        .filter((i) => i);
      clipboard.writeText(
        JSON.stringify(
          {
            event: action.payload,
            __type: "event",
            __customEvents:
              usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          },
          null,
          4
        )
      );
    } else if (actions.copyScript.match(action)) {
      const state = store.getState();
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const usedCustomEventIds = uniq(
        getCustomEventIdsInEvents(action.payload)
      );
      const usedCustomEvents = usedCustomEventIds
        .map((id) => customEventsLookup[id])
        .filter((i) => i);
      clipboard.writeText(
        JSON.stringify(
          {
            script: action.payload,
            __type: "script",
            __customEvents:
              usedCustomEvents.length > 0 ? usedCustomEvents : undefined,
          },
          null,
          4
        )
      );
    } else if (actions.pasteCustomEvents.match(action)) {
      try {
        const clipboardData = JSON.parse(clipboard.readText());
        if (clipboardData.__customEvents) {
          const state = store.getState();

          clipboardData.__customEvents.forEach((customEvent: CustomEvent) => {
            const customEventsLookup =
              customEventSelectors.selectEntities(state);
            const existingCustomEvent = customEventsLookup[customEvent.id];

            if (existingCustomEvent) {
              if (
                JSON.stringify(customEvent) ===
                JSON.stringify(existingCustomEvent)
              ) {
                // Already have this custom event
                return;
              }

              // Display confirmation and stop replace if cancelled
              const cancel = confirmReplaceCustomEvent(
                existingCustomEvent.name
              );
              if (cancel) {
                return;
              }
            }

            store.dispatch(
              entitiesActions.editCustomEvent({
                customEventId: customEvent.id,
                changes: customEvent,
              })
            );
          });
        }
      } catch (err) {
        // Ignore
      }
    } else if (actions.copyText.match(action)) {
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
      const scriptEvents: ScriptEvent[] = [];
      walkNormalisedScriptEvents(
        action.payload.scriptEventIds,
        scriptEventsLookup,
        (scriptEvent) => {
          scriptEvents.push(scriptEvent);
        }
      );
      copy({
        format: ClipboardTypeScriptEvents,
        data: {
          scriptEvents,
          script: action.payload.scriptEventIds,
        },
      });
    } else if (actions.copyTriggers.match(action)) {
      const state = store.getState();
      const triggersLookup = triggerSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const triggers: Trigger[] = [];
      const scriptEvents: ScriptEvent[] = [];
      action.payload.triggerIds.forEach((triggerId) => {
        const trigger = triggersLookup[triggerId];
        if (trigger) {
          triggers.push(trigger);
          walkNormalisedTriggerEvents(
            trigger,
            scriptEventsLookup,
            (scriptEvent) => {
              scriptEvents.push(scriptEvent);
            }
          );
        }
      });
      copy({
        format: ClipboardTypeTriggers,
        data: {
          triggers,
          scriptEvents,
        },
      });
    } else if (actions.pasteScriptEvents.match(action)) {
      const clipboard = pasteAny();
      if (!clipboard) {
        return next(action);
      }
      if (clipboard.format === ClipboardTypeScriptEvents) {
        const scriptEventIds = clipboard.data.script;
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
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
        const trigger = clipboard.data.triggers[0];
        const scriptEventIds = trigger.script;
        const scriptEvents = clipboard.data.scriptEvents;
        const scriptEventsLookup = keyBy(scriptEvents, "id");
        const addTriggerAction = entitiesActions.addTrigger({
          sceneId: action.payload.sceneId,
          x: action.payload.x,
          y: action.payload.y,
          width: trigger.width,
          height: trigger.height,
          defaults: trigger,
        });
        const insertActions = generateScriptEventInsertActions(
          scriptEventIds,
          scriptEventsLookup,
          addTriggerAction.payload.triggerId,
          "trigger",
          "script"
        );
        store.dispatch(addTriggerAction);
        for (const action of insertActions) {
          store.dispatch(action);
        }
      } else {
        const addTriggerAction = entitiesActions.addTrigger({
          sceneId: action.payload.sceneId,
          x: action.payload.x,
          y: action.payload.y,
          width: 1,
          height: 1,
        });
        store.dispatch(addTriggerAction);
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
