import {
  createSlice,
  PayloadAction,
  ThunkDispatch,
  UnknownAction,
  createSelector,
  CaseReducer,
} from "@reduxjs/toolkit";
import l10n from "shared/lib/lang/l10n";
import {
  DMG_PALETTE,
  DRAG_PLAYER,
  DRAG_DESTINATION,
  DRAG_TRIGGER,
  DRAG_ACTOR,
  TILE_SIZE,
} from "consts";
import { RootState } from "store/storeTypes";
import settingsActions from "store/features/settings/settingsActions";
import uuid from "uuid";
import projectActions from "store/features/project/projectActions";
import {
  EntitiesState,
  SpriteSheetNormalized,
  ScriptNormalized,
  ScriptEventNormalized,
  MetaspriteNormalized,
  SpriteAnimationNormalized,
  SpriteStateNormalized,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import {
  ensureSymbolsUnique,
  removeAssetEntity,
  upsertAssetEntity,
  renameAssetEntity,
  paletteName,
  updateAllCustomEventsArgs,
  normalizeEntityResources,
  normalizeSprite,
} from "shared/lib/entities/entitiesHelpers";
import spriteActions from "store/features/sprite/spriteActions";
import keyBy from "lodash/keyBy";
import { Asset, AssetType } from "shared/lib/helpers/assets";
import { assertUnreachable } from "shared/lib/scriptValue/format";
import { addNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
import type { LoadProjectResult } from "lib/project/loadProjectData";
import { decompressProjectResources } from "shared/lib/resources/compression";
import {
  MetaspriteTile,
  Palette,
  SpriteResourceAsset,
} from "shared/lib/resources/types";
import trackerDocumentActions from "store/features/trackerDocument/trackerDocumentActions";
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
  localSpriteSheetSelectById,
  localSpriteSheetSelectAll,
  localBackgroundSelectAll,
  localMusicSelectAll,
} from "store/features/entities/helpers";
import actorsReducers from "store/features/entities/reducers/actorsReducers";
import triggersReducers from "store/features/entities/reducers/triggersReducers";
import scenesReducers from "store/features/entities/reducers/scenesReducers";
import worldReducers from "store/features/entities/reducers/worldReducers";
import notesReducers from "store/features/entities/reducers/notesReducers";
import spritesReducers from "store/features/entities/reducers/spritesReducers";
import constantsReducers from "store/features/entities/reducers/constantsReducers";
import prefabsReducers from "store/features/entities/reducers/prefabsReducers";
import scriptEventsReducers from "store/features/entities/reducers/scriptEventsReducers";
import palettesReducers from "store/features/entities/reducers/palettesReducers";
import variablesReducers from "store/features/entities/reducers/variablesReducers";
import customEventsReducers from "store/features/entities/reducers/customEventsReducers";
import engineFieldValuesReducers from "store/features/entities/reducers/engineFieldValuesReducers";
import backgroundsReducers, {
  fixAllScenesWithModifiedBackgrounds,
  updateMonoOverrideIds,
} from "store/features/entities/reducers/backgroundsReducers";
import tilesetsReducers from "store/features/entities/reducers/tilesetsReducers";
import musicReducers, {
  loadMusic,
} from "store/features/entities/reducers/musicReducers";
import soundsReducers from "store/features/entities/reducers/soundsReducers";
import emotesReducers from "store/features/entities/reducers/emotesReducers";
import fontsReducers from "store/features/entities/reducers/fontsReducers";
import avatarsReducers from "store/features/entities/reducers/avatarsReducers";
export { selectScriptIds } from "store/features/entities/helpers";

export const initialState: EntitiesState = {
  actors: actorsAdapter.getInitialState(),
  triggers: triggersAdapter.getInitialState(),
  scenes: scenesAdapter.getInitialState(),
  actorPrefabs: actorPrefabsAdapter.getInitialState(),
  triggerPrefabs: triggerPrefabsAdapter.getInitialState(),
  scriptEvents: scriptEventsAdapter.getInitialState(),
  backgrounds: backgroundsAdapter.getInitialState(),
  spriteSheets: spriteSheetsAdapter.getInitialState(),
  metasprites: metaspritesAdapter.getInitialState(),
  metaspriteTiles: metaspriteTilesAdapter.getInitialState(),
  spriteAnimations: spriteAnimationsAdapter.getInitialState(),
  spriteStates: spriteStatesAdapter.getInitialState(),
  palettes: palettesAdapter.getInitialState(),
  customEvents: customEventsAdapter.getInitialState(),
  music: musicAdapter.getInitialState(),
  sounds: soundsAdapter.getInitialState(),
  fonts: fontsAdapter.getInitialState(),
  avatars: avatarsAdapter.getInitialState(),
  emotes: emotesAdapter.getInitialState(),
  tilesets: tilesetsAdapter.getInitialState(),
  variables: variablesAdapter.getInitialState(),
  constants: constantsAdapter.getInitialState(),
  notes: notesAdapter.getInitialState(),
  engineFieldValues: engineFieldValuesAdapter.getInitialState(),
};

const pxToTiles = (x: number) => Math.floor(x / TILE_SIZE);

const moveSelectedEntityToPx =
  ({ sceneId, x, y }: { sceneId: string; x: number; y: number }) =>
  (
    dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
    getState: () => RootState,
  ) => {
    const state = getState();
    const { dragging, scene, eventId, entityId } = state.editor;
    if (dragging === DRAG_PLAYER) {
      dispatch(
        settingsActions.editPlayerStartAt({
          sceneId,
          x: pxToTiles(x),
          y: pxToTiles(y),
        }),
      );
    } else if (dragging === DRAG_DESTINATION) {
      dispatch(
        actions.editScriptEventDestination({
          scriptEventId: eventId,
          destSceneId: sceneId,
          x: pxToTiles(x),
          y: pxToTiles(y),
        }),
      );
    } else if (dragging === DRAG_ACTOR) {
      dispatch(
        actions.moveActorToPx({
          actorId: entityId,
          sceneId: scene,
          newSceneId: sceneId,
          x,
          y,
        }),
      );
    } else if (dragging === DRAG_TRIGGER) {
      dispatch(
        actions.moveTrigger({
          sceneId: scene,
          triggerId: entityId,
          newSceneId: sceneId,
          x: pxToTiles(x),
          y: pxToTiles(y),
        }),
      );
    }
  };

const removeSelectedEntity =
  () =>
  (
    dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
    getState: () => RootState,
  ) => {
    const state = getState();
    const {
      scene,
      entityId,
      type: editorType,
      sceneSelectionIds,
    } = state.editor;
    if (editorType === "scene") {
      if (sceneSelectionIds.length > 0) {
        dispatch(actions.removeScenes({ sceneIds: sceneSelectionIds }));
        dispatch(actions.removeNotes({ noteIds: sceneSelectionIds }));
      } else {
        dispatch(actions.removeScene({ sceneId: scene }));
      }
    } else if (editorType === "note") {
      if (sceneSelectionIds.length > 0) {
        dispatch(actions.removeScenes({ sceneIds: sceneSelectionIds }));
        dispatch(actions.removeNotes({ noteIds: sceneSelectionIds }));
      } else {
        dispatch(actions.removeNote({ noteId: entityId }));
      }
    } else if (editorType === "trigger") {
      dispatch(actions.removeTrigger({ sceneId: scene, triggerId: entityId }));
    } else if (editorType === "actor") {
      dispatch(actions.removeActor({ sceneId: scene, actorId: entityId }));
    }
  };

/**************************************************************************
 * Project
 */

const loadProject: CaseReducer<
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

  fixAllScenesWithModifiedBackgrounds(state);
  updateMonoOverrideIds(state);
  ensureSymbolsUnique(state);
  updateAllCustomEventsArgs(
    Object.values(state.customEvents.entities) as ScriptNormalized[],
    state.scriptEvents.entities,
    action.payload.scriptEventDefs,
  );
};

const removedAsset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    assetType: AssetType;
    asset: Asset;
  }>
> = (state, action) => {
  const { assetType, asset } = action.payload;
  if (assetType === "backgrounds") {
    removeAssetEntity(state.backgrounds, backgroundsAdapter, asset);
    updateMonoOverrideIds(state);
  } else if (assetType === "tilesets") {
    removeAssetEntity(state.tilesets, tilesetsAdapter, asset);
  } else if (assetType === "music") {
    removeAssetEntity(state.music, musicAdapter, asset);
  } else if (assetType === "sounds") {
    removeAssetEntity(state.sounds, soundsAdapter, asset);
  } else if (assetType === "fonts") {
    removeAssetEntity(state.fonts, fontsAdapter, asset);
  } else if (assetType === "avatars") {
    removeAssetEntity(state.avatars, avatarsAdapter, asset);
  } else if (assetType === "emotes") {
    removeAssetEntity(state.emotes, emotesAdapter, asset);
  } else if (assetType === "sprites") {
    removeAssetEntity(state.spriteSheets, spriteSheetsAdapter, asset);
  } else if (assetType === "ui") {
    // Ignore UI
  } else {
    assertUnreachable(assetType);
  }
};

const renamedAsset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    assetType: AssetType;
    asset: Asset;
    newFilename: string;
  }>
> = (state, action) => {
  const { assetType, asset, newFilename } = action.payload;
  if (assetType === "backgrounds") {
    renameAssetEntity(
      state.backgrounds,
      backgroundsAdapter,
      asset,
      newFilename,
    );
    updateMonoOverrideIds(state);
  } else if (assetType === "tilesets") {
    renameAssetEntity(state.tilesets, tilesetsAdapter, asset, newFilename);
  } else if (assetType === "music") {
    renameAssetEntity(state.music, musicAdapter, asset, newFilename);
  } else if (assetType === "sounds") {
    renameAssetEntity(state.sounds, soundsAdapter, asset, newFilename);
  } else if (assetType === "fonts") {
    renameAssetEntity(state.fonts, fontsAdapter, asset, newFilename);
  } else if (assetType === "avatars") {
    renameAssetEntity(state.avatars, avatarsAdapter, asset, newFilename);
  } else if (assetType === "emotes") {
    renameAssetEntity(state.emotes, emotesAdapter, asset, newFilename);
  } else if (assetType === "sprites") {
    renameAssetEntity(
      state.spriteSheets,
      spriteSheetsAdapter,
      asset,
      newFilename,
    );
  } else if (assetType === "ui") {
    // Ignore UI
  } else {
    assertUnreachable(assetType);
  }
};

const loadSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: SpriteResourceAsset;
  }>
> = (state, action) => {
  const normalizedSpriteData = normalizeSprite(action.payload.data);
  const normalizedSprite =
    normalizedSpriteData.entities.spriteSheets[normalizedSpriteData.result];

  const didInsert = upsertAssetEntity(
    state.spriteSheets,
    spriteSheetsAdapter,
    normalizedSprite,
    [
      "id",
      "symbol",
      "states",
      "canvasOriginX",
      "canvasOriginY",
      "canvasWidth",
      "canvasHeight",
      "boundsX",
      "boundsY",
      "boundsWidth",
      "boundsHeight",
      "animSpeed",
      "numTiles",
    ],
  );

  if (didInsert) {
    // If inserted also insert metasprite + animation data
    metaspriteTilesAdapter.addMany(
      state.metaspriteTiles,
      normalizedSpriteData.entities.metaspriteTiles ?? {},
    );
    metaspritesAdapter.addMany(
      state.metasprites,
      normalizedSpriteData.entities.metasprites ?? {},
    );
    spriteAnimationsAdapter.addMany(
      state.spriteAnimations,
      normalizedSpriteData.entities.spriteAnimations ?? {},
    );
    spriteStatesAdapter.addMany(
      state.spriteStates,
      normalizedSpriteData.entities.spriteStates ?? {},
    );
  }

  fixAllSpritesWithMissingStates(state);
  ensureSymbolsUnique(state);
};

const loadDetectedSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimations: SpriteAnimationNormalized[];
    spriteStates: SpriteStateNormalized[];
    metasprites: MetaspriteNormalized[];
    metaspriteTiles: MetaspriteTile[];
    state: SpriteStateNormalized;
    changes: Partial<SpriteSheetNormalized>;
  }>
> = (state, action) => {
  const spriteSheet = localSpriteSheetSelectById(
    state,
    action.payload.spriteSheetId,
  );

  if (!spriteSheet) {
    return;
  }

  metaspriteTilesAdapter.addMany(
    state.metaspriteTiles,
    action.payload.metaspriteTiles,
  );

  metaspritesAdapter.addMany(state.metasprites, action.payload.metasprites);

  spriteAnimationsAdapter.addMany(
    state.spriteAnimations,
    action.payload.spriteAnimations,
  );

  spriteStatesAdapter.upsertOne(state.spriteStates, action.payload.state);

  const numStates = spriteSheet.states?.length || 0;

  spriteSheetsAdapter.updateOne(state.spriteSheets, {
    id: action.payload.spriteSheetId,
    changes: {
      ...action.payload.changes,
      states: numStates === 0 ? [action.payload.state.id] : spriteSheet.states,
    },
  });
};

/**************************************************************************
 * Fix Scenes
 */

const createDefaultSpriteStateData = (): {
  metasprites: MetaspriteNormalized[];
  animations: SpriteAnimationNormalized[];
  spriteState: SpriteStateNormalized;
} => {
  const metasprites: MetaspriteNormalized[] = Array.from(Array(8)).map(() => ({
    id: uuid(),
    tiles: [],
  }));

  const animations: SpriteAnimationNormalized[] = metasprites.map(
    (metasprite) => ({
      id: uuid(),
      frames: [metasprite.id],
    }),
  );

  const spriteState: SpriteStateNormalized = {
    id: uuid(),
    name: "",
    animationType: "multi_movement",
    flipLeft: true,
    animations: animations.map((animation) => animation.id),
  };

  return {
    metasprites,
    animations,
    spriteState,
  };
};

export const fixAllSpritesWithMissingStates = (state: EntitiesState) => {
  const sprites = localSpriteSheetSelectAll(state);

  for (const sprite of sprites) {
    const validStateIds = (sprite.states ?? []).filter((spriteStateId) => {
      return !!state.spriteStates.entities[spriteStateId];
    });

    if (validStateIds.length > 0) {
      if (validStateIds.length !== sprite.states?.length) {
        spriteSheetsAdapter.updateOne(state.spriteSheets, {
          id: sprite.id,
          changes: {
            states: validStateIds,
          },
        });
      }

      continue;
    }

    const { metasprites, animations, spriteState } =
      createDefaultSpriteStateData();

    metaspritesAdapter.addMany(state.metasprites, metasprites);
    spriteAnimationsAdapter.addMany(state.spriteAnimations, animations);
    spriteStatesAdapter.addOne(state.spriteStates, spriteState);

    spriteSheetsAdapter.updateOne(state.spriteSheets, {
      id: sprite.id,
      changes: {
        states: [spriteState.id],
      },
    });
  }
};

/**************************************************************************
 * General Assets
 */

const reloadAssets: CaseReducer<EntitiesState> = (state) => {
  const now = Date.now();

  const updateTimestamp = <T extends { _v: number }>(obj: T): T => {
    obj._v = now;
    return obj;
  };

  const backgrounds = localBackgroundSelectAll(state).map(updateTimestamp);
  const spriteSheets = localSpriteSheetSelectAll(state).map(updateTimestamp);
  const music = localMusicSelectAll(state).map(updateTimestamp);

  backgroundsAdapter.setAll(state.backgrounds, backgrounds);
  spriteSheetsAdapter.setAll(state.spriteSheets, spriteSheets);
  musicAdapter.setAll(state.music, music);
};

// Reducer ---------------------------------------------------------------------

const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    ...scenesReducers,
    ...notesReducers,
    ...worldReducers,
    ...actorsReducers,
    ...triggersReducers,
    ...prefabsReducers,
    ...spritesReducers,
    ...constantsReducers,
    ...scriptEventsReducers,
    ...palettesReducers,
    ...variablesReducers,
    ...customEventsReducers,
    ...engineFieldValuesReducers,
    ...backgroundsReducers,
    ...tilesetsReducers,
    ...musicReducers,
    ...soundsReducers,
    ...emotesReducers,
    ...fontsReducers,
    ...avatarsReducers,

    /*
     * Load assets
     */
    loadSprite,
    removedAsset,
    renamedAsset,
  },
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.fulfilled, loadProject)
      .addCase(projectActions.removeAsset.fulfilled, removedAsset)
      .addCase(projectActions.renameAsset.fulfilled, renamedAsset)
      .addCase(spriteActions.detectSpriteComplete, loadDetectedSprite)
      .addCase(projectActions.reloadAssets, reloadAssets)
      .addCase(addNewSongFile.fulfilled, loadMusic)
      .addCase(trackerDocumentActions.convertModToUgeSong.fulfilled, loadMusic),
});

export const actions = {
  ...entitiesSlice.actions,
  moveSelectedEntityToPx,
  removeSelectedEntity,
};

/**************************************************************************
 * Action Generators
 */

export const generateScriptEventInsertActions = (
  scriptEventIds: string[],
  scriptEventsLookup: Record<string, ScriptEventNormalized>,
  entityId: string,
  type: ScriptEventParentType,
  key: string,
  insertId?: string,
  before?: boolean,
) => {
  const insertActions: ReturnType<
    typeof entitiesSlice.actions.addScriptEvents
  >[] = [];

  const collectInsertActions = (
    scriptEventIds: string[],
    entityId: string,
    type: ScriptEventParentType,
    key: string,
    insertId?: string,
    before?: boolean,
  ) => {
    const insertEvents: ScriptEventNormalized[] = [];
    for (let i = 0; i < scriptEventIds.length; i++) {
      const scriptEvent = scriptEventsLookup[scriptEventIds[i]];
      if (!scriptEvent) {
        continue;
      }
      insertEvents.push(scriptEvent);
    }

    const action = entitiesSlice.actions.addScriptEvents({
      entityId,
      type,
      key,
      insertId,
      before,
      data: insertEvents,
    });

    if (insertEvents.length > 0) {
      insertActions.push(action);
    }

    // Child events
    for (let i = 0; i < insertEvents.length; i++) {
      const insertedEvent = insertEvents[i];
      if (insertedEvent.children) {
        Object.keys(insertedEvent.children).forEach((key) => {
          const childIds = insertedEvent?.children?.[key] || [];
          const newParentId = action.payload.scriptEventIds[i];
          collectInsertActions(childIds, newParentId, "scriptEvent", key);
        });
      }
    }
  };

  collectInsertActions(scriptEventIds, entityId, type, key, insertId, before);

  return insertActions;
};

/**************************************************************************
 * Helpers
 */

/**************************************************************************
 * Selectors
 */

// Global
export const actorSelectors = actorsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.actors,
);
export const triggerSelectors = triggersAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.triggers,
);
export const sceneSelectors = scenesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.scenes,
);
export const noteSelectors = notesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.notes,
);
export const actorPrefabSelectors = actorPrefabsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.actorPrefabs,
);
export const triggerPrefabSelectors = triggerPrefabsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.triggerPrefabs,
);
export const scriptEventSelectors = scriptEventsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.scriptEvents,
);
export const spriteSheetSelectors = spriteSheetsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.spriteSheets,
);
export const metaspriteSelectors = metaspritesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.metasprites,
);
export const metaspriteTileSelectors = metaspriteTilesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.metaspriteTiles,
);
export const spriteAnimationSelectors = spriteAnimationsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.spriteAnimations,
);
export const spriteStateSelectors = spriteStatesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.spriteStates,
);
export const backgroundSelectors = backgroundsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.backgrounds,
);
export const paletteSelectors = palettesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.palettes,
);
export const customEventSelectors = customEventsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.customEvents,
);
export const musicSelectors = musicAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.music,
);
export const soundSelectors = soundsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.sounds,
);
export const fontSelectors = fontsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.fonts,
);
export const avatarSelectors = avatarsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.avatars,
);
export const emoteSelectors = emotesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.emotes,
);
export const tilesetSelectors = tilesetsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.tilesets,
);
export const variableSelectors = variablesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.variables,
);
export const constantSelectors = constantsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.constants,
);
export const engineFieldValueSelectors = engineFieldValuesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.engineFieldValues,
);

export const getLocalisedPalettes = createSelector(
  [paletteSelectors.selectAll],
  (palettes) =>
    palettes.map((palette, index) => ({
      ...palette,
      name: paletteName(palette, index),
    })),
);

export const getLocalisedPalettesLookup = createSelector(
  [getLocalisedPalettes],
  (palettes) => keyBy(palettes, "id"),
);

export const getLocalisedPaletteById = createSelector(
  [paletteSelectors.selectById, paletteSelectors.selectIds],
  (palette, ids) =>
    palette && {
      ...palette,
      name: paletteName(palette, ids.indexOf(palette.id)),
    },
);

export const getLocalisedDMGPalette = () =>
  ({
    ...DMG_PALETTE,
    name: l10n("FIELD_PALETTE_DEFAULT_DMG"),
  }) as Palette;

export const getMaxWorldRight = createSelector(
  [sceneSelectors.selectAll, noteSelectors.selectAll],
  (scenes, notes) => {
    const maxSceneRight = scenes.reduce((memo, scene) => {
      const right = scene.x + scene.width * 8;
      return right > memo ? right : memo;
    }, 0);

    const maxNoteRight = notes.reduce((memo, note) => {
      const right = note.x + note.width * 8;
      return right > memo ? right : memo;
    }, 0);

    return Math.max(maxSceneRight, maxNoteRight);
  },
);

export const getMaxWorldBottom = createSelector(
  [sceneSelectors.selectAll, noteSelectors.selectAll],
  (scenes, notes) => {
    const maxSceneBottom = scenes.reduce((memo, scene) => {
      const bottom = scene.y + scene.height * 8;
      return bottom > memo ? bottom : memo;
    }, 0);

    const maxNoteBottom = notes.reduce((memo, note) => {
      const bottom = note.y + note.height * 8;
      return bottom > memo ? bottom : memo;
    }, 0);

    return Math.max(maxSceneBottom, maxNoteBottom);
  },
);

export const getSceneActorIds = (state: RootState, { id }: { id: string }) =>
  sceneSelectors.selectById(state, id)?.actors;

export default entitiesSlice.reducer;
