import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { TILE_SIZE } from "consts";
import clamp from "shared/lib/helpers/clamp";
import { v4 as uuid } from "uuid";
import {
  EntitiesState,
  ActorNormalized,
  ActorPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  genEntitySymbol,
  updateEntitySymbol,
  localVariableCodes,
} from "shared/lib/entities/entitiesHelpers";
import { omit } from "shared/types";
import { CoordinateType, Variable } from "shared/lib/resources/types";
import {
  actorsAdapter,
  scenesAdapter,
  actorPrefabsAdapter,
  scriptEventsAdapter,
  variablesAdapter,
} from "store/features/entities/adapters";
import {
  localSpriteSheetSelectAll,
  localSceneSelectById,
  localActorPrefabSelectById,
  localActorSelectById,
  localVariableSelectById,
  localScriptEventSelectById,
  duplicateScript,
} from "store/features/entities/helpers";
import { first } from "shared/lib/helpers/array";

const ACTOR_BASE_SIZE = 1;

const getActorMaxPositionForSceneAxis = (
  sceneSizeInTiles: number,
  coordinateType: CoordinateType,
) => {
  return coordinateType === "pixels"
    ? sceneSizeInTiles * TILE_SIZE - ACTOR_BASE_SIZE * TILE_SIZE
    : sceneSizeInTiles - ACTOR_BASE_SIZE;
};

const addActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
    x: number;
    y: number;
    defaults?: Partial<ActorNormalized>;
    variables?: Variable[];
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  const spriteSheetId = first(localSpriteSheetSelectAll(state))?.id;
  if (!spriteSheetId) {
    return;
  }

  // Add any variables from clipboard
  if (action.payload.defaults?.id && action.payload.variables) {
    const newVariables = action.payload.variables.map((variable) => {
      return {
        ...variable,
        id: variable.id.replace(
          action.payload.defaults?.id || "",
          action.payload.actorId,
        ),
      };
    });
    variablesAdapter.upsertMany(state.variables, newVariables);
  }

  // Set default name based on prefab if provided
  let name = "";
  if (action.payload.defaults?.prefabId) {
    const prefab = localActorPrefabSelectById(
      state,
      action.payload.defaults.prefabId,
    );
    if (prefab && prefab.name.length > 0) {
      name = prefab.name;
    }
  }

  const maxX = getActorMaxPositionForSceneAxis(scene.width, "tiles");
  const maxY = getActorMaxPositionForSceneAxis(scene.height, "tiles");

  const newActor: ActorNormalized = {
    name,
    frame: 0,
    animate: false,
    spriteSheetId,
    prefabId: "",
    direction: "down",
    moveSpeed: 1,
    animSpeed: 15,
    paletteId: "",
    isPinned: false,
    persistent: false,
    collisionGroup: "",
    collisionExtraFlags: [],
    prefabScriptOverrides: {},
    ...(action.payload.defaults || {}),
    symbol: genEntitySymbol(state, "actor_0"),
    script: [],
    startScript: [],
    updateScript: [],
    hit1Script: [],
    hit2Script: [],
    hit3Script: [],
    id: action.payload.actorId,
    coordinateType: "tiles",
    x: clamp(action.payload.x, 0, maxX),
    y: clamp(action.payload.y, 0, maxY),
  };

  // Add to scene
  scene.actors = ([] as string[]).concat(scene.actors, newActor.id);
  actorsAdapter.addOne(state.actors, newActor);
};

const editActor: CaseReducer<
  EntitiesState,
  PayloadAction<{ actorId: string; changes: Partial<ActorNormalized> }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  const patch = { ...action.payload.changes };

  if (!actor) {
    return;
  }

  // If prefab changes reset overrides
  if (patch.prefabId && actor.prefabId !== patch.prefabId) {
    patch.prefabScriptOverrides = {};
  }

  // If coordinate type changes, convert x/y to new type
  if (patch.coordinateType && actor.coordinateType !== patch.coordinateType) {
    if (patch.coordinateType === "pixels") {
      // Tiles -> Pixels
      patch.x = actor.x * TILE_SIZE;
      patch.y = actor.y * TILE_SIZE;
    } else {
      // Pixels -> Tiles
      patch.x = Math.floor(actor.x / TILE_SIZE);
      patch.y = Math.floor(actor.y / TILE_SIZE);
    }
  }

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: patch,
  });
};

const moveActorIndexTop: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    actorId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const actorId = action.payload.actorId;
  const actors = [...scene.actors];
  const currentIndex = actors.indexOf(actorId);
  const newIndex = 0;
  if (currentIndex !== -1) {
    actors.splice(currentIndex, 1);
    actors.splice(newIndex, 0, actorId);
  }
  scene.actors = actors;
};

const moveActorIndexUp: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    actorId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const actorId = action.payload.actorId;
  const actors = [...scene.actors];
  const currentIndex = actors.indexOf(actorId);
  const newIndex = currentIndex - 1;
  if (currentIndex > 0) {
    actors.splice(currentIndex, 1);
    actors.splice(newIndex, 0, actorId);
  }
  scene.actors = actors;
};

const moveActorIndexDown: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    actorId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const actorId = action.payload.actorId;
  const actors = [...scene.actors];
  const currentIndex = actors.indexOf(actorId);
  const newIndex = currentIndex + 1;
  if (currentIndex !== -1 && currentIndex < actors.length - 1) {
    actors.splice(currentIndex, 1);
    actors.splice(newIndex, 0, actorId);
  }
  scene.actors = actors;
};

const moveActorIndexBottom: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    actorId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const actorId = action.payload.actorId;
  const actors = [...scene.actors];
  const newIndex = actors.length - 1;
  const currentIndex = actors.indexOf(actorId);
  if (currentIndex !== -1) {
    actors.splice(currentIndex, 1);
    actors.splice(newIndex, 0, actorId);
  }
  scene.actors = actors;
};

const setActorSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ actorId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.actors,
    actorsAdapter,
    action.payload.actorId,
    action.payload.symbol,
  );
};

const moveActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
    newSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
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
        actors: prevScene.actors.filter((actorId) => {
          return actorId !== action.payload.actorId;
        }),
      },
    });

    // Add to new scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.newSceneId,
      changes: {
        actors: ([] as string[]).concat(
          newScene.actors,
          action.payload.actorId,
        ),
      },
    });
  }
  const actor = localActorSelectById(state, action.payload.actorId);

  if (!actor) {
    return;
  }

  const maxX = getActorMaxPositionForSceneAxis(
    newScene.width,
    actor.coordinateType,
  );
  const maxY = getActorMaxPositionForSceneAxis(
    newScene.height,
    actor.coordinateType,
  );

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      x: clamp(action.payload.x, 0, maxX),
      y: clamp(action.payload.y, 0, maxY),
    },
  });
};

const unpackActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    force?: boolean;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }
  const prefab = localActorPrefabSelectById(state, actor.prefabId);
  if (!prefab) {
    return;
  }

  const overrides = actor.prefabScriptOverrides;

  const patch = {
    ...omit(
      prefab,
      "id",
      "name",
      "notes",
      "script",
      "startScript",
      "updateScript",
      "hit1Script",
      "hit2Script",
      "hit3Script",
    ),
    prefabId: "",
    script: duplicateScript(state, prefab.script, overrides),
    startScript: duplicateScript(state, prefab.startScript, overrides),
    updateScript: duplicateScript(state, prefab.updateScript, overrides),
    hit1Script: duplicateScript(state, prefab.hit1Script, overrides),
    hit2Script: duplicateScript(state, prefab.hit2Script, overrides),
    hit3Script: duplicateScript(state, prefab.hit3Script, overrides),
  };

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: patch,
  });

  // Duplicate prefab local variables
  for (const code of localVariableCodes) {
    const prefabLocalId = `${prefab.id}__${code}`;
    const actorLocalId = `${actor.id}__${code}`;
    const localVariable = localVariableSelectById(state, prefabLocalId);
    if (localVariable) {
      // Duplicate prefab's local into actor
      variablesAdapter.upsertOne(state.variables, {
        ...localVariable,
        id: actorLocalId,
      });
    } else {
      // Prefab didn't contain this local, remove it
      variablesAdapter.removeOne(state.variables, actorLocalId);
    }
  }
};

const convertActorToPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }
  const prefab = localActorPrefabSelectById(state, actor.prefabId);
  // Don't allow converting actor which is already a prefab into a prefab
  if (prefab) {
    return;
  }

  const newActorPrefab: ActorPrefabNormalized = {
    ...omit(
      actor,
      "id",
      "symbol",
      "prefabId",
      "notes",
      "coordinateType",
      "x",
      "y",
      "direction",
      "isPinned",
      "script",
      "startScript",
      "updateScript",
      "hit1Script",
      "hit2Script",
      "hit3Script",
    ),
    script: duplicateScript(state, actor.script),
    startScript: duplicateScript(state, actor.startScript),
    updateScript: duplicateScript(state, actor.updateScript),
    hit1Script: duplicateScript(state, actor.hit1Script),
    hit2Script: duplicateScript(state, actor.hit2Script),
    hit3Script: duplicateScript(state, actor.hit3Script),
    id: uuid(),
  };

  actorPrefabsAdapter.addOne(state.actorPrefabs, newActorPrefab);

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabId: newActorPrefab.id,
    },
  });

  // Duplicate local variables
  for (const code of localVariableCodes) {
    const actorLocalId = `${actor.id}__${code}`;
    const prefabLocalId = `${newActorPrefab.id}__${code}`;
    const localVariable = localVariableSelectById(state, actorLocalId);
    if (localVariable) {
      // Duplicate prefab's local into actor
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

const editActorPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    scriptEventId: string;
    args: Record<string, unknown>;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  const scriptEvent = localScriptEventSelectById(
    state,
    action.payload.scriptEventId,
  );
  if (!actor || !scriptEvent) {
    return;
  }
  const prefabScriptOverrides = actor.prefabScriptOverrides ?? {};
  const override = prefabScriptOverrides[scriptEvent.id] ?? {
    id: scriptEvent.id,
    args: {},
  };
  const argKeys = Object.keys(action.payload.args);
  for (const key of argKeys) {
    override.args[key] = action.payload.args[key];
  }
  prefabScriptOverrides[scriptEvent.id] = override;

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const revertActorPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
  }>
> = (state, action) => {
  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const revertActorPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }
  const prefabScriptOverrides = actor.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const applyActorPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }

  // Update script events using override data
  const overrides = Object.values(actor.prefabScriptOverrides);
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

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const applyActorPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }

  // Update script events using override data
  const override = actor.prefabScriptOverrides[action.payload.scriptEventId];
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

  const prefabScriptOverrides = actor.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const removeActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
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
      actors: scene.actors.filter((actorId) => {
        return actorId !== action.payload.actorId;
      }),
    },
  });

  actorsAdapter.removeOne(state.actors, action.payload.actorId);
};

const removeActorAt: CaseReducer<
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

  const removeActorId = scene.actors.find((actorId) => {
    const actor = localActorSelectById(state, actorId);
    return (
      actor &&
      (actor.x === action.payload.x || actor.x === action.payload.x - 1) &&
      (actor.y === action.payload.y || actor.y === action.payload.y + 1)
    );
  });

  if (removeActorId) {
    // Remove from scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        actors: scene.actors.filter((actorId) => {
          return actorId !== removeActorId;
        }),
      },
    });
    // Remove actor
    actorsAdapter.removeOne(state.actors, removeActorId);
  }
};

const actorsReducers = {
  addActor: {
    reducer: addActor,
    prepare: (payload: {
      sceneId: string;
      x: number;
      y: number;
      defaults?: Partial<ActorNormalized>;
      variables?: Variable[];
    }) => {
      return {
        payload: {
          ...payload,
          actorId: uuid(),
        },
      };
    },
  },
  editActor,
  moveActorIndexTop,
  moveActorIndexUp,
  moveActorIndexDown,
  moveActorIndexBottom,
  setActorSymbol,
  unpackActorPrefab,
  convertActorToPrefab,
  editActorPrefabScriptEventOverride,
  revertActorPrefabScriptEventOverrides,
  applyActorPrefabScriptEventOverrides,
  revertActorPrefabScriptEventOverride,
  applyActorPrefabScriptEventOverride,
  removeActor,
  removeActorAt,
  moveActor,
} satisfies SliceCaseReducers<EntitiesState>;

export default actorsReducers;
