import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import {
  EntitiesState,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  applyReparentFolderToCollection,
  applyReparentEntityToCollection,
} from "shared/lib/entities/entitiesHelpers";
import {
  actorPrefabsAdapter,
  triggerPrefabsAdapter,
} from "store/features/entities/adapters";
import {
  localSpriteSheetSelectAll,
  localActorPrefabSelectById,
  localTriggerPrefabSelectById,
} from "store/features/entities/helpers";
import { first } from "shared/lib/helpers/array";

/**************************************************************************
 * Actor Prefabs
 */

const addActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorPrefabId: string;
    defaults?: Partial<ActorPrefabNormalized>;
  }>
> = (state, action) => {
  const spriteSheetId = first(localSpriteSheetSelectAll(state))?.id;
  if (!spriteSheetId) {
    return;
  }

  const newActorPrefab: ActorPrefabNormalized = {
    name: "",
    frame: 0,
    animate: false,
    spriteSheetId,
    moveSpeed: 1,
    animSpeed: 15,
    paletteId: "",
    persistent: false,
    collisionGroup: "",
    collisionExtraFlags: [],
    ...(action.payload.defaults || {}),
    script: [],
    startScript: [],
    updateScript: [],
    hit1Script: [],
    hit2Script: [],
    hit3Script: [],
    id: action.payload.actorPrefabId,
  };

  actorPrefabsAdapter.addOne(state.actorPrefabs, newActorPrefab);
};

const editActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorPrefabId: string;
    changes: Partial<ActorPrefabNormalized>;
  }>
> = (state, action) => {
  const actorPrefab = localActorPrefabSelectById(
    state,
    action.payload.actorPrefabId,
  );
  const patch = { ...action.payload.changes };

  if (!actorPrefab) {
    return;
  }

  actorPrefabsAdapter.updateOne(state.actorPrefabs, {
    id: action.payload.actorPrefabId,
    changes: patch,
  });
};

const removeActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorPrefabId: string;
  }>
> = (state, action) => {
  actorPrefabsAdapter.removeOne(
    state.actorPrefabs,
    action.payload.actorPrefabId,
  );
};

const reparentActorPrefabsFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentFolderToCollection(
    state.actorPrefabs.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
};

const reparentActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorPrefabId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.actorPrefabs.entities,
    action.payload.actorPrefabId,
    action.payload.toPath,
  );
};

/**************************************************************************
 * Trigger Prefabs
 */

const addTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerPrefabId: string;
    defaults?: Partial<TriggerPrefabNormalized>;
  }>
> = (state, action) => {
  const spriteSheetId = first(localSpriteSheetSelectAll(state))?.id;
  if (!spriteSheetId) {
    return;
  }

  const newTriggerPrefab: TriggerPrefabNormalized = {
    name: "",
    ...(action.payload.defaults || {}),
    script: [],
    leaveScript: [],
    id: action.payload.triggerPrefabId,
  };

  triggerPrefabsAdapter.addOne(state.triggerPrefabs, newTriggerPrefab);
};

const editTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerPrefabId: string;
    changes: Partial<TriggerPrefabNormalized>;
  }>
> = (state, action) => {
  const triggerPrefab = localTriggerPrefabSelectById(
    state,
    action.payload.triggerPrefabId,
  );
  const patch = { ...action.payload.changes };

  if (!triggerPrefab) {
    return;
  }

  triggerPrefabsAdapter.updateOne(state.triggerPrefabs, {
    id: action.payload.triggerPrefabId,
    changes: patch,
  });
};

const removeTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerPrefabId: string;
  }>
> = (state, action) => {
  triggerPrefabsAdapter.removeOne(
    state.triggerPrefabs,
    action.payload.triggerPrefabId,
  );
};

const reparentTriggerPrefabsFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentFolderToCollection(
    state.triggerPrefabs.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
};

const reparentTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerPrefabId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.triggerPrefabs.entities,
    action.payload.triggerPrefabId,
    action.payload.toPath,
  );
};

const prefabsReducers = {
  // Actors
  addActorPrefab: {
    reducer: addActorPrefab,
    prepare: (payload?: {
      actorPrefabId?: string;
      defaults?: Partial<ActorPrefabNormalized>;
    }) => {
      return {
        payload: {
          ...payload,
          actorPrefabId: payload?.actorPrefabId ?? uuid(),
        },
      };
    },
  },

  editActorPrefab,
  removeActorPrefab,
  reparentActorPrefabsFolder,
  reparentActorPrefab,

  // Triggers
  addTriggerPrefab: {
    reducer: addTriggerPrefab,
    prepare: (payload?: {
      triggerPrefabId?: string;
      defaults?: Partial<TriggerPrefabNormalized>;
    }) => {
      return {
        payload: {
          ...payload,
          triggerPrefabId: payload?.triggerPrefabId ?? uuid(),
        },
      };
    },
  },

  editTriggerPrefab,
  removeTriggerPrefab,
  reparentTriggerPrefabsFolder,
  reparentTriggerPrefab,
} satisfies SliceCaseReducers<EntitiesState>;

export default prefabsReducers;
