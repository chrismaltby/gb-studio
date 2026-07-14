import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import clamp from "shared/lib/helpers/clamp";
import { v4 as uuid } from "uuid";
import {
  EntitiesState,
  TriggerNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  genEntitySymbol,
  updateEntitySymbol,
  localVariableCodes,
} from "shared/lib/entities/entitiesHelpers";
import { omit } from "shared/types";
import { Variable } from "shared/lib/resources/types";
import {
  triggersAdapter,
  scenesAdapter,
  triggerPrefabsAdapter,
  scriptEventsAdapter,
  variablesAdapter,
} from "store/features/entities/adapters";
import {
  localSceneSelectById,
  localVariableSelectById,
  localScriptEventSelectById,
  localTriggerPrefabSelectById,
  localTriggerSelectById,
  duplicateScript,
} from "store/features/entities/helpers";

const addTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    defaults?: Partial<TriggerNormalized>;
    // variables?: Variable[];
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const width = Math.min(action.payload.width, scene.width);
  const height = Math.min(action.payload.height, scene.height);

  // Set default name based on prefab if provided
  let name = "";
  if (action.payload.defaults?.prefabId) {
    const prefab = localTriggerPrefabSelectById(
      state,
      action.payload.defaults.prefabId,
    );
    if (prefab && prefab.name.length > 0) {
      name = prefab.name;
    }
  }

  const newTrigger: TriggerNormalized = {
    name,
    prefabId: "",
    ...(action.payload.defaults || {}),
    id: action.payload.triggerId,
    x: clamp(action.payload.x, 0, scene.width - width),
    y: clamp(action.payload.y, 0, scene.height - height),
    symbol: genEntitySymbol(state, "trigger_0"),
    prefabScriptOverrides: {},
    width,
    height,
    script: [],
    leaveScript: [],
  };

  // Add to scene
  scene.triggers = ([] as string[]).concat(scene.triggers, newTrigger.id);
  triggersAdapter.addOne(state.triggers, newTrigger);
};

const editTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{ triggerId: string; changes: Partial<TriggerNormalized> }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);

  if (!trigger) {
    return;
  }
  const patch = { ...action.payload.changes };

  // If prefab changes reset overrides
  if (patch.prefabId && trigger.prefabId !== patch.prefabId) {
    patch.prefabScriptOverrides = {};
  }

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: patch,
  });
};

const moveTriggerIndexTop: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    triggerId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const triggerId = action.payload.triggerId;
  const triggers = [...scene.triggers];
  const currentIndex = triggers.indexOf(triggerId);
  const newIndex = 0;
  if (currentIndex !== -1) {
    triggers.splice(currentIndex, 1);
    triggers.splice(newIndex, 0, triggerId);
  }
  scene.triggers = triggers;
};

const moveTriggerIndexUp: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    triggerId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const triggerId = action.payload.triggerId;
  const triggers = [...scene.triggers];
  const currentIndex = triggers.indexOf(triggerId);
  const newIndex = currentIndex - 1;
  if (currentIndex > 0) {
    triggers.splice(currentIndex, 1);
    triggers.splice(newIndex, 0, triggerId);
  }
  scene.triggers = triggers;
};

const moveTriggerIndexDown: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    triggerId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const triggerId = action.payload.triggerId;
  const triggers = [...scene.triggers];
  const currentIndex = triggers.indexOf(triggerId);
  const newIndex = currentIndex + 1;
  if (currentIndex !== -1 && currentIndex < triggers.length - 1) {
    triggers.splice(currentIndex, 1);
    triggers.splice(newIndex, 0, triggerId);
  }
  scene.triggers = triggers;
};

const moveTriggerIndexBottom: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    triggerId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const triggerId = action.payload.triggerId;
  const triggers = [...scene.triggers];
  const newIndex = triggers.length - 1;
  const currentIndex = triggers.indexOf(triggerId);
  if (currentIndex !== -1) {
    triggers.splice(currentIndex, 1);
    triggers.splice(newIndex, 0, triggerId);
  }
  scene.triggers = triggers;
};

const setTriggerSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ triggerId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.triggers,
    triggersAdapter,
    action.payload.triggerId,
    action.payload.symbol,
  );
};

const moveTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
    newSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }

  const newScene = localSceneSelectById(state, action.payload.newSceneId);
  if (!newScene) {
    return;
  }

  if (action.payload.sceneId !== action.payload.newSceneId) {
    const prevScene = localSceneSelectById(state, action.payload.sceneId);
    if (!prevScene) {
      return;
    }

    // Remove from previous scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        triggers: prevScene.triggers.filter((triggerId) => {
          return triggerId !== action.payload.triggerId;
        }),
      },
    });

    // Add to new scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.newSceneId,
      changes: {
        triggers: ([] as string[]).concat(
          newScene.triggers,
          action.payload.triggerId,
        ),
      },
    });
  }

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      x: clamp(action.payload.x, 0, newScene.width - trigger.width),
      y: clamp(action.payload.y, 0, newScene.height - trigger.height),
    },
  });
};

const unpackTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    force?: boolean;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }
  const prefab = localTriggerPrefabSelectById(state, trigger.prefabId);
  if (!prefab) {
    return;
  }

  const overrides = trigger.prefabScriptOverrides;

  const patch = {
    ...omit(prefab, "id", "name", "notes", "script", "leaveScript"),
    prefabId: "",
    script: duplicateScript(state, prefab.script, overrides),
    leaveScript: duplicateScript(state, prefab.leaveScript, overrides),
  };

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: patch,
  });

  // Duplicate prefab local variables
  for (const code of localVariableCodes) {
    const prefabLocalId = `${prefab.id}__${code}`;
    const triggerLocalId = `${trigger.id}__${code}`;
    const localVariable = localVariableSelectById(state, prefabLocalId);
    if (localVariable) {
      // Duplicate prefab's local into trigger
      variablesAdapter.upsertOne(state.variables, {
        ...localVariable,
        id: triggerLocalId,
      });
    } else {
      // Prefab didn't contain this local, remove it
      variablesAdapter.removeOne(state.variables, triggerLocalId);
    }
  }
};

const convertTriggerToPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }
  const prefab = localTriggerPrefabSelectById(state, trigger.prefabId);
  // Don't allow converting trigger which is already a prefab into a prefab
  if (prefab) {
    return;
  }

  const newTriggerPrefab: TriggerPrefabNormalized = {
    ...omit(
      trigger,
      "id",
      "symbol",
      "prefabId",
      "notes",
      "x",
      "y",
      "width",
      "height",
      "script",
      "leaveScript",
    ),
    script: duplicateScript(state, trigger.script),
    leaveScript: duplicateScript(state, trigger.leaveScript),
    id: uuid(),
  };

  triggerPrefabsAdapter.addOne(state.triggerPrefabs, newTriggerPrefab);

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabId: newTriggerPrefab.id,
    },
  });

  // Duplicate local variables
  for (const code of localVariableCodes) {
    const triggerLocalId = `${trigger.id}__${code}`;
    const prefabLocalId = `${newTriggerPrefab.id}__${code}`;
    const localVariable = localVariableSelectById(state, triggerLocalId);
    if (localVariable) {
      // Duplicate prefab's local into trigger
      variablesAdapter.upsertOne(state.variables, {
        ...localVariable,
        id: prefabLocalId,
      });
    } else {
      // Prefab didn't contain this local, remove it
      variablesAdapter.removeOne(state.variables, prefabLocalId);
    }
  }
};

const resizeTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
  }>
> = (state, action) => {
  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      x: Math.min(action.payload.x, action.payload.startX),
      y: Math.min(action.payload.y, action.payload.startY),
      width: Math.abs(action.payload.x - action.payload.startX) + 1,
      height: Math.abs(action.payload.y - action.payload.startY) + 1,
    },
  });
};

const editTriggerPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    scriptEventId: string;
    args: Record<string, unknown>;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  const scriptEvent = localScriptEventSelectById(
    state,
    action.payload.scriptEventId,
  );
  if (!trigger || !scriptEvent) {
    return;
  }
  const prefabScriptOverrides = trigger.prefabScriptOverrides ?? {};
  const override = prefabScriptOverrides[scriptEvent.id] ?? {
    id: scriptEvent.id,
    args: {},
  };
  const argKeys = Object.keys(action.payload.args);
  for (const key of argKeys) {
    override.args[key] = action.payload.args[key];
  }
  prefabScriptOverrides[scriptEvent.id] = override;

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const revertTriggerPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
  }>
> = (state, action) => {
  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const revertTriggerPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }
  const prefabScriptOverrides = trigger.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const applyTriggerPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }

  // Update script events using override data
  const overrides = Object.values(trigger.prefabScriptOverrides);
  for (const override of overrides) {
    const scriptEvent = localScriptEventSelectById(state, override.id);
    if (scriptEvent) {
      scriptEventsAdapter.updateOne(state.scriptEvents, {
        id: override.id,
        changes: {
          args: {
            ...scriptEvent.args,
            ...override.args,
          },
        },
      });
    }
  }

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const applyTriggerPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }

  // Update script events using override data
  const override = trigger.prefabScriptOverrides[action.payload.scriptEventId];
  const scriptEvent = localScriptEventSelectById(state, override.id);
  if (scriptEvent) {
    scriptEventsAdapter.updateOne(state.scriptEvents, {
      id: override.id,
      changes: {
        args: {
          ...scriptEvent.args,
          ...override.args,
        },
      },
    });
  }

  const prefabScriptOverrides = trigger.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const removeTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  // Remove from scene
  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      triggers: scene.triggers.filter((triggerId) => {
        return triggerId !== action.payload.triggerId;
      }),
    },
  });

  triggersAdapter.removeOne(state.triggers, action.payload.triggerId);
};

const removeTriggerAt: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const removeTriggerId = scene.triggers.find((triggerId) => {
    const trigger = localTriggerSelectById(state, triggerId);
    return (
      trigger &&
      action.payload.x >= trigger.x &&
      action.payload.x < trigger.x + trigger.width &&
      action.payload.y >= trigger.y &&
      action.payload.y < trigger.y + trigger.height
    );
  });

  if (removeTriggerId) {
    // Remove from scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        triggers: scene.triggers.filter((triggerId) => {
          return triggerId !== removeTriggerId;
        }),
      },
    });

    triggersAdapter.removeOne(state.triggers, removeTriggerId);
  }
};

const triggersReducers = {
  addTrigger: {
    reducer: addTrigger,
    prepare: (payload: {
      sceneId: string;
      x: number;
      y: number;
      width: number;
      height: number;
      defaults?: Partial<TriggerNormalized>;
      variables?: Variable[];
    }) => {
      return {
        payload: {
          ...payload,
          triggerId: uuid(),
        },
      };
    },
  },

  editTrigger,
  moveTriggerIndexTop,
  moveTriggerIndexUp,
  moveTriggerIndexDown,
  moveTriggerIndexBottom,
  setTriggerSymbol,
  unpackTriggerPrefab,
  convertTriggerToPrefab,
  editTriggerPrefabScriptEventOverride,
  revertTriggerPrefabScriptEventOverrides,
  applyTriggerPrefabScriptEventOverrides,
  revertTriggerPrefabScriptEventOverride,
  applyTriggerPrefabScriptEventOverride,
  removeTrigger,
  removeTriggerAt,
  moveTrigger,
  resizeTrigger,
} satisfies SliceCaseReducers<EntitiesState>;

export default triggersReducers;
