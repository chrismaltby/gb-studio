import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import {
  EntitiesState,
  SceneNormalized,
} from "shared/lib/entities/entitiesTypes";
import { applyReparentFolderToCollection } from "shared/lib/entities/entitiesHelpers";
import { Note } from "shared/lib/resources/types";
import {
  localSceneSelectById,
  localNoteSelectById,
} from "store/features/entities/helpers";
import { MIN_WORLD_ENTITY_X, MIN_WORLD_ENTITY_Y } from "consts";

const moveWorldEntities: CaseReducer<
  EntitiesState,
  PayloadAction<{
    entityId: string;
    additionalEntityIds: string[];
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.entityId);
  const note = localNoteSelectById(state, action.payload.entityId);
  const entity = scene || note;

  const additionalEntities: (SceneNormalized | Note)[] =
    action.payload.additionalEntityIds
      .map(
        (id) =>
          localSceneSelectById(state, id) || localNoteSelectById(state, id),
      )
      .filter(Boolean);

  if (entity) {
    const minSelectionX = Math.min(
      ...additionalEntities.map((e) => (e ? e.x - entity.x : 0)),
    );
    const minSelectionY = Math.min(
      ...additionalEntities.map((e) => (e ? e.y - entity.y : 0)),
    );

    // Based on full selection determine minX and minY for current entity
    const newX = Math.max(MIN_WORLD_ENTITY_X - minSelectionX, action.payload.x);
    const newY = Math.max(MIN_WORLD_ENTITY_Y - minSelectionY, action.payload.y);
    const diffX = newX - entity.x;
    const diffY = newY - entity.y;

    // Move entity
    entity.x = newX;
    entity.y = newY;

    // Move additionally selected entities by same amount
    for (const additionalEntity of additionalEntities) {
      if (additionalEntity.id !== action.payload.entityId) {
        if (additionalEntity) {
          const newX = Math.max(MIN_WORLD_ENTITY_X, additionalEntity.x + diffX);
          const newY = Math.max(MIN_WORLD_ENTITY_Y, additionalEntity.y + diffY);
          additionalEntity.x = newX;
          additionalEntity.y = newY;
        }
      }
    }
  }
};

const reparentWorldFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentFolderToCollection(
    state.scenes.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
  applyReparentFolderToCollection(
    state.notes.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
};

const worldReducers = {
  moveWorldEntities,
  reparentWorldFolder,
} satisfies SliceCaseReducers<EntitiesState>;

export default worldReducers;
