import { PayloadAction, CaseReducer } from "@reduxjs/toolkit";
import {
  EntitiesState,
  ScriptNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  ensureSymbolsUnique,
  updateAllCustomEventsArgs,
  normalizeEntityResources,
} from "shared/lib/entities/entitiesHelpers";
import type { LoadProjectResult } from "lib/project/loadProjectData";
import { decompressProjectResources } from "shared/lib/resources/compression";
import {
  actorsAdapter,
  triggersAdapter,
  scenesAdapter,
  actorPrefabsAdapter,
  triggerPrefabsAdapter,
  scriptEventsAdapter,
  backgroundsAdapter,
  spriteSheetsAdapter,
  metaspritesAdapter,
  metaspriteTilesAdapter,
  spriteAnimationsAdapter,
  spriteStatesAdapter,
  palettesAdapter,
  customEventsAdapter,
  musicAdapter,
  soundsAdapter,
  fontsAdapter,
  avatarsAdapter,
  emotesAdapter,
  tilesetsAdapter,
  variablesAdapter,
  constantsAdapter,
  notesAdapter,
  engineFieldValuesAdapter,
} from "store/features/entities/adapters";
import {
  fixAllScenesWithModifiedBackgrounds,
  updateMonoOverrideIds,
} from "store/features/entities/reducers/backgroundsReducers";
import { updateAllTilemapReferences } from "store/features/entities/reducers/tilesetsReducers";

export const loadProject: CaseReducer<
  EntitiesState,
  PayloadAction<LoadProjectResult>
> = (state, action) => {
  const uncompressedResources = decompressProjectResources(
    action.payload.resources,
  );

  const data = normalizeEntityResources(uncompressedResources);

  actorsAdapter.setAll(state.actors, data.entities.actors || {});
  triggersAdapter.setAll(state.triggers, data.entities.triggers || {});
  scenesAdapter.setAll(state.scenes, data.entities.scenes || {});
  actorPrefabsAdapter.setAll(
    state.actorPrefabs,
    data.entities.actorPrefabs || {},
  );
  triggerPrefabsAdapter.setAll(
    state.triggerPrefabs,
    data.entities.triggerPrefabs || {},
  );
  scriptEventsAdapter.setAll(
    state.scriptEvents,
    data.entities.scriptEvents || {},
  );
  backgroundsAdapter.setAll(state.backgrounds, data.entities.backgrounds || {});
  spriteSheetsAdapter.setAll(state.spriteSheets, data.entities.sprites || {});
  metaspritesAdapter.setAll(state.metasprites, data.entities.metasprites || {});
  metaspriteTilesAdapter.setAll(
    state.metaspriteTiles,
    data.entities.metaspriteTiles || {},
  );
  spriteAnimationsAdapter.setAll(
    state.spriteAnimations,
    data.entities.spriteAnimations || {},
  );
  spriteStatesAdapter.setAll(
    state.spriteStates,
    data.entities.spriteStates || {},
  );
  palettesAdapter.setAll(state.palettes, data.entities.palettes || {});
  musicAdapter.setAll(state.music, data.entities.music || {});
  soundsAdapter.setAll(state.sounds, data.entities.sounds || {});
  fontsAdapter.setAll(state.fonts, data.entities.fonts || {});
  avatarsAdapter.setAll(state.avatars, data.entities.avatars || {});
  emotesAdapter.setAll(state.emotes, data.entities.emotes || {});
  tilesetsAdapter.setAll(state.tilesets, data.entities.tilesets || {});
  customEventsAdapter.setAll(state.customEvents, data.entities.scripts || {});
  variablesAdapter.setAll(state.variables, data.entities.variables || {});
  constantsAdapter.setAll(state.constants, data.entities.constants || {});
  engineFieldValuesAdapter.setAll(
    state.engineFieldValues,
    data.entities.engineFieldValues || {},
  );
  notesAdapter.setAll(state.notes, data.entities.notes || {});

  updateAllTilemapReferences(state);
  fixAllScenesWithModifiedBackgrounds(state);
  updateMonoOverrideIds(state);
  ensureSymbolsUnique(state);
  updateAllCustomEventsArgs(
    Object.values(state.customEvents.entities) as ScriptNormalized[],
    state.scriptEvents.entities,
    action.payload.scriptEventDefs,
  );
};
