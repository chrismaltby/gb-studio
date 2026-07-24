import flatten from "lodash/flatten";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "store/storeTypes";
import { generateScriptEventInsertActions } from "store/features/entities/entitiesState";
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
  sceneSelectors,
  backgroundSelectors,
  actorPrefabSelectors,
  triggerPrefabSelectors,
} from "store/features/entities/entitiesSelectors";
import {
  ActorNormalized,
  ActorPrefabNormalized,
  ScriptNormalized,
  MetaspriteNormalized,
  SceneNormalized,
  ScriptEventNormalized,
  ScriptEventParentType,
  SpriteAnimationNormalized,
  TriggerNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import { copy as rawCopy, pasteAny } from "./clipboardHelpers";
import {
  ClipboardSceneGrid,
  ClipboardType,
  ClipboardTypeActors,
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
  ClipboardTypePaletteIds,
  ClipboardTypeScenes,
  ClipboardTypeScriptEvents,
  ClipboardTypeSpriteState,
  ClipboardTypeTriggers,
  ClipboardTypeSceneGrid,
} from "./clipboardTypes";
import { actions as clipboardStateActions } from "./clipboardState";
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
  remapActorReferencesInEventArgs,
  remapActorReferencesInEventOverrides,
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
import { sortSubsetStringArray } from "shared/lib/helpers/array";
import { MetaspriteTile, Variable } from "shared/lib/resources/types";
import { copyGridSelection } from "shared/lib/tiles/grid";
import {
  getTilemapLayersTileColors,
  isTilemapLayerCellTopmost,
} from "shared/lib/tiles/sceneTilemapData";

const generateLocalVariableInsertActions = (
  originalId: string,
  newId: string,
  variables: Variable[],
) => {
  const actions: UnknownAction[] = [];
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
  customEvent: ScriptNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  existingCustomEvents: ScriptNormalized[],
  existingScriptEventsLookup: Record<string, ScriptEventNormalized>,
): Promise<UnknownAction[]> => {
  const actions: UnknownAction[] = [];

  const existingEvent = existingCustomEvents.find(
    (e) => e.id === customEvent.id,
  );
  if (
    existingEvent &&
    isCustomEventEqual(
      customEvent,
      scriptEventsLookup,
      existingEvent,
      existingScriptEventsLookup,
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
      "script",
    ),
  );

  return actions;
};

const generateActorInsertActions = (
  actor: ActorNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  variables: Variable[],
  sceneId: string,
  x: number,
  y: number,
): UnknownAction[] => {
  const actions: UnknownAction[] = [];
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
        key,
      ),
    );
  });
  actions.push(
    ...generateLocalVariableInsertActions(
      actor.id,
      addActorAction.payload.actorId,
      variables,
    ),
  );
  return actions;
};

const generateActorPrefabInsertActions = async (
  prefab: ActorPrefabNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  existingActorPrefabs: ActorPrefabNormalized[],
  existingScriptEventsLookup: Record<string, ScriptEventNormalized>,
): Promise<UnknownAction[]> => {
  const actions: UnknownAction[] = [];

  const existingPrefab = existingActorPrefabs.find((e) => e.id === prefab.id);
  if (
    existingPrefab &&
    isActorPrefabEqual(
      prefab,
      scriptEventsLookup,
      existingPrefab,
      existingScriptEventsLookup,
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
      "script",
    ),
  );

  return actions;
};

const generateTriggerInsertActions = (
  trigger: TriggerNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  variables: Variable[],
  sceneId: string,
  x: number,
  y: number,
): UnknownAction[] => {
  const actions: UnknownAction[] = [];
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
        key,
      ),
    );
  });
  actions.push(
    ...generateLocalVariableInsertActions(
      trigger.id,
      addTriggerAction.payload.triggerId,
      variables,
    ),
  );
  return actions;
};

const generateTriggerPrefabInsertActions = async (
  prefab: TriggerPrefabNormalized,
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  existingTriggerPrefabs: TriggerPrefabNormalized[],
  existingScriptEventsLookup: Record<string, ScriptEventNormalized>,
): Promise<UnknownAction[]> => {
  const actions: UnknownAction[] = [];

  const existingPrefab = existingTriggerPrefabs.find((e) => e.id === prefab.id);
  if (
    existingPrefab &&
    isTriggerPrefabEqual(
      prefab,
      scriptEventsLookup,
      existingPrefab,
      existingScriptEventsLookup,
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
      "script",
    ),
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
  y: number,
): UnknownAction[] => {
  const actions: UnknownAction[] = [];
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
        key,
      ),
    );
  });
  actions.push(
    ...generateLocalVariableInsertActions(
      scene.id,
      addSceneAction.payload.sceneId,
      variables,
    ),
  );
  for (const actor of actors) {
    actions.push(
      ...generateActorInsertActions(
        actor,
        scriptEventsLookup,
        variables,
        addSceneAction.payload.sceneId,
        actor.x,
        actor.y,
      ),
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
        trigger.y,
      ),
    );
  }

  actions.push(
    editorActions.selectScene({ sceneId: addSceneAction.payload.sceneId }),
  );

  const actorMapping: Record<string, string> = actions
    .filter((action) => entitiesActions.addActor.match(action))
    .reduce(
      (memo, action) => {
        const oldId: string = action.payload?.defaults?.id ?? "";
        const newId: string = action.payload?.actorId;
        if (oldId && newId) {
          memo[oldId] = newId;
        }
        return memo;
      },
      {} as Record<string, string>,
    );

  const remappedActions = actions.map((action) => {
    if (entitiesActions.addActor.match(action)) {
      return {
        ...action,
        payload: {
          ...action.payload,
          defaults: {
            ...action.payload.defaults,
            prefabScriptOverrides: remapActorReferencesInEventOverrides(
              action.payload.defaults?.prefabScriptOverrides,
              scriptEventsLookup,
              actorMapping,
              scriptEventDefs,
            ),
          },
        },
      };
    }
    if (entitiesActions.addTrigger.match(action)) {
      return {
        ...action,
        payload: {
          ...action.payload,
          defaults: {
            ...action.payload.defaults,
            prefabScriptOverrides: remapActorReferencesInEventOverrides(
              action.payload.defaults?.prefabScriptOverrides,
              scriptEventsLookup,
              actorMapping,
              scriptEventDefs,
            ),
          },
        },
      };
    }
    if (entitiesActions.addScriptEvents.match(action)) {
      return {
        ...action,
        payload: {
          ...action.payload,
          data: action.payload.data.map((eventData) => {
            return {
              ...eventData,
              args: remapActorReferencesInEventArgs(
                eventData.command,
                eventData.args || {},
                actorMapping,
                scriptEventDefs,
              ),
            };
          }),
        },
      };
    }
    return action;
  });

  return remappedActions;
};

type ClipboardDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

const copyToClipboard = async (
  dispatch: ClipboardDispatch,
  data: ClipboardType,
) => {
  rawCopy(data);
  const clipboard = await pasteAny();
  if (clipboard) {
    dispatch(clipboardStateActions.setClipboardData(clipboard));
  } else {
    dispatch(clipboardStateActions.clearClipboardData());
  }
};

const copyText =
  (payload: string): AppThunk<Promise<void>> =>
  async () => {
    API.clipboard.writeText(payload);
  };

const copySceneGridSelection =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const state = getState();
    const selection = state.editor.scenePaintSelection;
    if (!selection) return;
    const scene = sceneSelectors.selectById(state, selection.sceneId);
    if (!scene) return;
    let values: number[] | undefined;
    let autotiles: number[] | undefined;
    let tileColors: number[] | undefined;
    let collisions: number[] | undefined;
    let linkedCells: boolean[] | undefined;
    let tilesets: ClipboardSceneGrid["tilesets"];
    let autotileDefinitions: ClipboardSceneGrid["autotileDefinitions"];
    if (selection.mode === "tiles") {
      const tilemap = scene.tilemap;
      if (!tilemap) return;
      tilesets = tilemap.tilesets;
      autotileDefinitions = tilemap.autotiles;
      const layerIndex = tilemap.layers.findIndex(
        (layer) => layer.id === selection.layerId,
      );
      const layer = layerIndex >= 0 ? tilemap.layers[layerIndex] : undefined;
      if (!layer) return;
      values = copyGridSelection(
        layer.tiles,
        scene.width,
        scene.height,
        selection.selection,
        0,
      );
      if (layer.autotiles) {
        autotiles = copyGridSelection(
          layer.autotiles,
          scene.width,
          scene.height,
          selection.selection,
          0,
        );
      }
      const colors = getTilemapLayersTileColors(
        tilemap,
        scene.width,
        scene.height,
      );
      tileColors = copyGridSelection(
        colors,
        scene.width,
        scene.height,
        selection.selection,
        0,
      );
      collisions = copyGridSelection(
        scene.collisions,
        scene.width,
        scene.height,
        selection.selection,
        0,
      );
      linkedCells = [];
      for (let y = 0; y < selection.selection.height; y++) {
        for (let x = 0; x < selection.selection.width; x++) {
          const sceneX = selection.selection.x + x;
          const sceneY = selection.selection.y + y;
          const cellIndex = sceneY * scene.width + sceneX;
          linkedCells.push(
            sceneX >= 0 &&
              sceneY >= 0 &&
              sceneX < scene.width &&
              sceneY < scene.height &&
              isTilemapLayerCellTopmost(tilemap, layerIndex, cellIndex),
          );
        }
      }
    } else if (selection.mode === "collisions") {
      values = copyGridSelection(
        scene.collisions,
        scene.width,
        scene.height,
        selection.selection,
        0,
      );
    } else {
      const background = scene.backgroundId
        ? backgroundSelectors.selectById(state, scene.backgroundId)
        : undefined;
      const width = scene.tilemap ? scene.width : background?.width;
      const height = scene.tilemap ? scene.height : background?.height;
      const colors = scene.tilemap
        ? getTilemapLayersTileColors(scene.tilemap, scene.width, scene.height)
        : background?.tileColors;
      if (!width || !height || !colors) return;
      values = copyGridSelection(colors, width, height, selection.selection, 0);
    }
    await copyToClipboard(dispatch, {
      format: ClipboardTypeSceneGrid,
      data: {
        mode: selection.mode,
        width: selection.selection.width,
        height: selection.selection.height,
        values,
        autotiles,
        tileColors,
        collisions,
        linkedCells,
        tilesets,
        autotileDefinitions,
      },
    });
  };

const copySpriteState =
  (payload: { spriteStateId: string }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const state = getState();
    const spriteStateLookup = spriteStateSelectors.selectEntities(state);
    const animationsLookup = spriteAnimationSelectors.selectEntities(state);
    const metaspritesLookup = metaspriteSelectors.selectEntities(state);
    const metaspriteTilesLookup = metaspriteTileSelectors.selectEntities(state);
    const spriteState = spriteStateLookup[action.payload.spriteStateId];
    if (!spriteState) {
      return;
    }
    const animations = spriteState.animations
      .map((id) => {
        return animationsLookup[id];
      })
      .filter(
        (animation): animation is SpriteAnimationNormalized => !!animation,
      );
    const metaspriteIds = flatten(
      animations.map((animation) => animation.frames),
    );
    const metasprites = metaspriteIds
      .map((id) => {
        return metaspritesLookup[id];
      })
      .filter((metasprite): metasprite is MetaspriteNormalized => !!metasprite);
    const metaspriteTileIds = flatten(
      metasprites.map((metasprite) => metasprite.tiles),
    );
    const metaspriteTiles = metaspriteTileIds
      .map((tileId) => {
        return metaspriteTilesLookup[tileId];
      })
      .filter((tile): tile is MetaspriteTile => !!tile);
    await copyToClipboard(dispatch, {
      format: ClipboardTypeSpriteState,
      data: {
        spriteState,
        animations,
        metasprites,
        metaspriteTiles,
      },
    });
  };

const copyMetasprites =
  (payload: {
    metaspriteIds: string[];
    spriteAnimationId: string;
  }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const state = getState();
    const metaspritesLookup = metaspriteSelectors.selectEntities(state);
    const metaspriteTilesLookup = metaspriteTileSelectors.selectEntities(state);
    const spriteAnimation = spriteAnimationSelectors.selectById(
      state,
      action.payload.spriteAnimationId,
    );
    if (!spriteAnimation) {
      return;
    }
    const sortedMetaspriteIds = sortSubsetStringArray(
      action.payload.metaspriteIds,
      spriteAnimation.frames,
    );
    const metasprites = sortedMetaspriteIds
      .map((id) => {
        return metaspritesLookup[id];
      })
      .filter((metasprite): metasprite is MetaspriteNormalized => !!metasprite);
    const metaspriteTileIds = flatten(
      metasprites.map((metasprite) => metasprite.tiles),
    );
    const metaspriteTiles = metaspriteTileIds
      .map((tileId) => {
        return metaspriteTilesLookup[tileId];
      })
      .filter((tile): tile is MetaspriteTile => !!tile);
    await copyToClipboard(dispatch, {
      format: ClipboardTypeMetasprites,
      data: {
        metasprites,
        metaspriteTiles,
      },
    });
  };

const copyMetaspriteTiles =
  (payload: { metaspriteTileIds: string[] }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const state = getState();
    const metaspriteTilesLookup = metaspriteTileSelectors.selectEntities(state);
    const metaspriteTiles = action.payload.metaspriteTileIds
      .map((tileId) => {
        return metaspriteTilesLookup[tileId];
      })
      .filter((tile): tile is MetaspriteTile => !!tile);
    await copyToClipboard(dispatch, {
      format: ClipboardTypeMetaspriteTiles,
      data: {
        metaspriteTiles,
      },
    });
  };

const copyScriptEvents =
  (payload: { scriptEventIds: string[] }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const state = getState();
    const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const scriptEvents: ScriptEventNormalized[] = [];
    const customEvents: ScriptNormalized[] = [];
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
      addEvent,
    );
    for (const customEvent of customEvents) {
      walkNormalizedCustomEventScripts(
        customEvent,
        scriptEventsLookup,
        {
          includeCommented: true,
        },
        addEvent,
      );
    }
    await copyToClipboard(dispatch, {
      format: ClipboardTypeScriptEvents,
      data: {
        scriptEvents,
        customEvents,
        script: action.payload.scriptEventIds,
      },
    });
  };

const copyTriggers =
  (payload: { triggerIds: string[] }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const state = getState();
    const triggersLookup = triggerSelectors.selectEntities(state);
    const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const triggerPrefabsLookup = triggerPrefabSelectors.selectEntities(state);
    const triggers: TriggerNormalized[] = [];
    const scriptEvents: ScriptEventNormalized[] = [];
    const customEvents: ScriptNormalized[] = [];
    const customEventsSeen: Record<string, boolean> = {};
    const triggerPrefabs: TriggerPrefabNormalized[] = [];
    const triggerPrefabsSeen: Record<string, boolean> = {};
    const allVariables = variableSelectors.selectAll(state);
    const variables = allVariables.filter((variable) => {
      return action.payload.triggerIds.find((id) => variable.id.startsWith(id));
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
          addEvent,
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
            addEvent,
          );
        }
      }
    });
    for (const customEvent of customEvents) {
      walkNormalizedCustomEventScripts(
        customEvent,
        scriptEventsLookup,
        { includeCommented: true },
        addEvent,
      );
    }
    await copyToClipboard(dispatch, {
      format: ClipboardTypeTriggers,
      data: {
        triggers,
        customEvents,
        variables,
        scriptEvents,
        triggerPrefabs,
      },
    });
  };

const copyActors =
  (payload: { actorIds: string[] }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const state = getState();
    const actorsLookup = actorSelectors.selectEntities(state);
    const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
    const customEventsLookup = customEventSelectors.selectEntities(state);
    const actorPrefabsLookup = actorPrefabSelectors.selectEntities(state);
    const actors: ActorNormalized[] = [];
    const scriptEvents: ScriptEventNormalized[] = [];
    const customEvents: ScriptNormalized[] = [];
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
          addEvent,
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
            addEvent,
          );
        }
      }
    });
    for (const customEvent of customEvents) {
      walkNormalizedCustomEventScripts(
        customEvent,
        scriptEventsLookup,
        { includeCommented: true },
        addEvent,
      );
    }
    await copyToClipboard(dispatch, {
      format: ClipboardTypeActors,
      data: {
        actors,
        customEvents,
        variables,
        scriptEvents,
        actorPrefabs,
      },
    });
  };

const copyScenes =
  (payload: { sceneIds: string[] }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const state = getState();
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
    const customEvents: ScriptNormalized[] = [];
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
              addEvent,
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
                addEvent,
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
              addEvent,
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
                addEvent,
              );
            }
          }
        });
        walkNormalizedSceneSpecificScripts(
          scene,
          scriptEventsLookup,
          { includeCommented: true },
          addEvent,
        );
      }
    });
    for (const customEvent of customEvents) {
      walkNormalizedCustomEventScripts(
        customEvent,
        scriptEventsLookup,
        { includeCommented: true },
        addEvent,
      );
    }
    const allVariables = variableSelectors.selectAll(state);
    const variables = allVariables.filter((variable) => {
      return entityIds.find((id) => variable.id.startsWith(id));
    });
    await copyToClipboard(dispatch, {
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
  };

const pasteScriptEvents =
  (payload: {
    entityId: string;
    type: ScriptEventParentType;
    key: string;
    insertId?: string;
    before?: boolean;
  }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const clipboard = await pasteAny();
    if (!clipboard) {
      return;
    }
    if (clipboard.format === ClipboardTypeScriptEvents) {
      const state = getState();
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
        action.payload.before,
      );
      for (const action of insertActions) {
        dispatch(action);
      }
      for (const customEvent of clipboard.data.customEvents) {
        const actions = await generateCustomEventInsertActions(
          customEvent,
          scriptEventsLookup,
          existingCustomEvents,
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }
    }
  };

const pasteScriptEventValues =
  (payload: { scriptEventId: string }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const clipboard = await pasteAny();
    if (!clipboard) {
      return;
    }
    if (clipboard.format === ClipboardTypeScriptEvents) {
      const state = getState();
      const currentEvent =
        state.project.present.entities.scriptEvents.entities[
          action.payload.scriptEventId
        ];
      const scriptEvent = clipboard.data.scriptEvents[0];
      if (currentEvent && scriptEvent) {
        dispatch(
          entitiesActions.editScriptEvent({
            scriptEventId: action.payload.scriptEventId,
            changes: {
              args: {
                ...currentEvent.args,
                ...scriptEvent.args,
              },
            },
          }),
        );
      }
    }
  };

const pasteTriggerAt =
  (payload: {
    sceneId: string;
    x: number;
    y: number;
  }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const clipboard = await pasteAny();
    if (clipboard && clipboard.format === ClipboardTypeTriggers) {
      const state = getState();
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
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
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
          action.payload.y,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }
      for (const customEvent of clipboard.data.customEvents) {
        const actions = await generateCustomEventInsertActions(
          customEvent,
          scriptEventsLookup,
          existingCustomEvents,
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }
    }
  };

const pasteActorAt =
  (payload: {
    sceneId: string;
    x: number;
    y: number;
  }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const clipboard = await pasteAny();
    if (clipboard && clipboard.format === ClipboardTypeActors) {
      const state = getState();
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
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
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
          action.payload.y,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }
      for (const customEvent of clipboard.data.customEvents) {
        const actions = await generateCustomEventInsertActions(
          customEvent,
          scriptEventsLookup,
          existingCustomEvents,
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }
    }
  };

const pasteSceneAt =
  (payload: { x: number; y: number }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const clipboard = await pasteAny();
    if (clipboard && clipboard.format === ClipboardTypeScenes) {
      const state = getState();
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
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }

      for (const prefab of clipboard.data.triggerPrefabs ?? []) {
        const actions = await generateTriggerPrefabInsertActions(
          prefab,
          scriptEventsLookup,
          existingTriggerPrefabs,
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
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
          action.payload.y,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }

      for (const customEvent of clipboard.data.customEvents) {
        const actions = await generateCustomEventInsertActions(
          customEvent,
          scriptEventsLookup,
          existingCustomEvents,
          existingScriptEventsLookup,
        );
        batch(() => {
          for (const action of actions) {
            dispatch(action);
          }
        });
      }
    }
  };

const fetchClipboard = (): AppThunk<Promise<void>> => async (dispatch) => {
  const clipboard = await pasteAny();
  if (clipboard) {
    dispatch(clipboardStateActions.setClipboardData(clipboard));
  } else {
    dispatch(clipboardStateActions.clearClipboardData());
  }
};

const pasteSprite =
  (payload: {
    spriteSheetId: string;
    metaspriteId: string;
    spriteAnimationId: string;
    spriteStateId: string;
  }): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const action = { payload: payload };
    const clipboard = await pasteAny();
    if (!clipboard) {
      return;
    }
    if (clipboard.format === ClipboardTypeSpriteState) {
      const data = clipboard.data;
      const state = getState();

      const spriteState = spriteStateSelectors.selectById(
        state,
        action.payload.spriteStateId,
      );
      if (!spriteState) {
        return;
      }

      // Update Sprite State
      dispatch(
        entitiesActions.editSpriteState({
          spriteStateId: action.payload.spriteStateId,
          changes: {
            animationType: data.spriteState.animationType,
            flipLeft: data.spriteState.flipLeft,
          },
        }),
      );

      // Update sprite animations
      for (let i = 0; i < spriteState.animations.length; i++) {
        const animationId = spriteState.animations[i];
        const newData = data.animations[i];
        if (!newData) {
          continue;
        }

        dispatch(
          entitiesActions.editSpriteAnimation({
            spriteSheetId: action.payload.spriteSheetId,
            spriteAnimationId: animationId,
            changes: {
              frames: [],
            },
          }),
        );

        const animMetasprites = data.metasprites.filter((metasprite) => {
          return newData.frames.includes(metasprite.id);
        });

        const newActions = animMetasprites.map(() => {
          return entitiesActions.addMetasprite({
            spriteSheetId: action.payload.spriteSheetId,
            spriteAnimationId: animationId,
            afterMetaspriteId: "",
          });
        });

        for (const action of newActions) {
          dispatch(action);
        }

        const newIds = newActions.map((action) => action.payload.metaspriteId);

        const tileIdMetaspriteLookup = animMetasprites.reduce(
          (memo, metasprite, index) => {
            for (const tileId of metasprite.tiles) {
              memo[tileId] = newIds[index];
            }
            return memo;
          },
          {} as Record<string, string>,
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
          dispatch(action);
        }
      }
    } else if (clipboard.format === ClipboardTypeMetasprites) {
      const data = clipboard.data;

      const state = getState();

      const currentMetasprite = metaspriteSelectors.selectById(
        state,
        action.payload.metaspriteId,
      );
      const reuseCurrentMetasprite =
        currentMetasprite && currentMetasprite.tiles.length === 0;

      const newActions = data.metasprites
        .filter((_, index) => {
          return !reuseCurrentMetasprite || index > 0;
        })
        .map(() => {
          return entitiesActions.addMetasprite({
            spriteSheetId: action.payload.spriteSheetId,
            spriteAnimationId: action.payload.spriteAnimationId,
            afterMetaspriteId: action.payload.metaspriteId,
          });
        });

      for (const action of newActions) {
        dispatch(action);
      }

      const newIds = [
        ...(reuseCurrentMetasprite ? [currentMetasprite.id] : []),
        // Reverse new ids as they get created in reverse order afterMetaspriteId
        ...newActions.map((action) => action.payload.metaspriteId).reverse(),
      ];

      const tileIdMetaspriteLookup = data.metasprites.reduce(
        (memo, metasprite, index) => {
          for (const tileId of metasprite.tiles) {
            memo[tileId] = newIds[index];
          }
          return memo;
        },
        {} as Record<string, string>,
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
        dispatch(action);
      }

      if (reuseCurrentMetasprite) {
        dispatch(editorActions.setSelectedMetaspriteId(currentMetasprite.id));
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
        dispatch(action);
      }

      const newIds = newActions.map(
        (action) => action.payload.metaspriteTileId,
      );

      dispatch(editorActions.setSelectedMetaspriteTileIds(newIds));
    }
  };

const copyPaletteIds =
  (payload: { paletteIds: string[] }): AppThunk<Promise<void>> =>
  async (dispatch) => {
    await copyToClipboard(dispatch, {
      format: ClipboardTypePaletteIds,
      data: {
        paletteIds: payload.paletteIds,
      },
    });
  };

const pastePaletteIds =
  (payload: {
    sceneId: string;
    type: "background" | "sprite";
  }): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const clipboard = await pasteAny();
    if (!clipboard) {
      return;
    }
    if (clipboard.format === ClipboardTypePaletteIds) {
      const data = clipboard.data;
      if (payload.type === "background") {
        dispatch(
          entitiesActions.editScene({
            sceneId: payload.sceneId,
            changes: {
              paletteIds: data.paletteIds,
            },
          }),
        );
      } else {
        dispatch(
          entitiesActions.editScene({
            sceneId: payload.sceneId,
            changes: {
              spritePaletteIds: data.paletteIds,
            },
          }),
        );
      }
    }
  };

const pasteSceneGridSelectionAt =
  (payload: { sceneId: string; layerId?: string; x: number; y: number }) =>
  async (dispatch: ClipboardDispatch) => {
    const clipboard = await pasteAny();
    if (!clipboard || clipboard.format !== ClipboardTypeSceneGrid) return;
    dispatch(
      entitiesActions.pasteSceneGridSelection({
        ...payload,
        ...clipboard.data,
      }),
    );
    dispatch(
      editorActions.setScenePaintSelection({
        sceneId: payload.sceneId,
        layerId: clipboard.data.mode === "tiles" ? payload.layerId : undefined,
        mode: clipboard.data.mode,
        selection: {
          x: payload.x,
          y: payload.y,
          width: clipboard.data.width,
          height: clipboard.data.height,
        },
        offset: { x: 0, y: 0 },
      }),
    );
  };

const copySelectedEntity = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const { scene: sceneId, entityId, type: editorType } = state.editor;
  if (editorType === "scene") {
    const scene = sceneSelectors.selectById(state, sceneId);
    if (scene) {
      dispatch(copyScenes({ sceneIds: [scene.id] }));
    }
  } else if (editorType === "actor") {
    const actor = actorSelectors.selectById(state, entityId);
    if (actor) {
      dispatch(copyActors({ actorIds: [actor.id] }));
    }
  } else if (editorType === "trigger") {
    const trigger = triggerSelectors.selectById(state, entityId);
    if (trigger) {
      dispatch(copyTriggers({ triggerIds: [trigger.id] }));
    }
  }
};

const pasteClipboardEntity =
  (): AppThunk<Promise<void>> => async (dispatch) => {
    const clipboard = await pasteAny();
    if (!clipboard) {
      return;
    }
    if (clipboard.format === ClipboardTypeTriggers) {
      dispatch(editorActions.setTool({ tool: "triggers" }));
      dispatch(editorActions.setPasteMode(true));
    } else if (clipboard.format === ClipboardTypeActors) {
      dispatch(editorActions.setTool({ tool: "actors" }));
      dispatch(editorActions.setPasteMode(true));
    } else if (clipboard.format === ClipboardTypeScenes) {
      dispatch(editorActions.setTool({ tool: "scene" }));
      dispatch(editorActions.setPasteMode(true));
    }
  };

const pasteClipboardEntityInPlace =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const clipboard = await pasteAny();
    if (!clipboard) {
      return;
    }
    const state = getState();
    const { scene: sceneId } = state.editor;
    if (clipboard.format === ClipboardTypeTriggers) {
      const trigger = clipboard.data.triggers[0];
      await dispatch(
        pasteTriggerAt({
          sceneId,
          x: trigger.x,
          y: trigger.y,
        }),
      );
    } else if (clipboard.format === ClipboardTypeActors) {
      const actor = clipboard.data.actors[0];
      await dispatch(
        pasteActorAt({
          sceneId,
          x: actor.x,
          y: actor.y,
        }),
      );
    } else if (clipboard.format === ClipboardTypeScenes) {
      const scene = clipboard.data.scenes[0];
      await dispatch(
        pasteSceneAt({
          x: scene.x,
          y: scene.y,
        }),
      );
    }
  };

const clipboardActions = {
  ...clipboardStateActions,
  fetchClipboard,
  copyText,
  copyScriptEvents,
  copyTriggers,
  copyActors,
  copyScenes,
  copyMetasprites,
  copyMetaspriteTiles,
  copySpriteState,
  copySelectedEntity,
  copyPaletteIds,
  pasteClipboardEntity,
  pasteClipboardEntityInPlace,
  pasteSprite,
  pastePaletteIds,
  pasteScriptEvents,
  pasteScriptEventValues,
  pasteTriggerAt,
  pasteActorAt,
  pasteSceneAt,
  copySceneGridSelection,
  pasteSceneGridSelectionAt,
};

export default clipboardActions;
