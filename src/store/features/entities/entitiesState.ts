import {
  createSlice,
  ThunkDispatch,
  UnknownAction,
  createSelector,
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
import projectActions from "store/features/project/projectActions";
import {
  EntitiesState,
  ScriptEventNormalized,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import { paletteName } from "shared/lib/entities/entitiesHelpers";
import spriteActions from "store/features/sprite/spriteActions";
import keyBy from "lodash/keyBy";
import { addNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { Palette } from "shared/lib/resources/types";
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
import actorsReducers from "store/features/entities/reducers/actorsReducers";
import triggersReducers from "store/features/entities/reducers/triggersReducers";
import scenesReducers from "store/features/entities/reducers/scenesReducers";
import worldReducers from "store/features/entities/reducers/worldReducers";
import notesReducers from "store/features/entities/reducers/notesReducers";
import spritesReducers, {
  loadDetectedSprite,
} from "store/features/entities/reducers/spritesReducers";
import constantsReducers from "store/features/entities/reducers/constantsReducers";
import prefabsReducers from "store/features/entities/reducers/prefabsReducers";
import scriptEventsReducers from "store/features/entities/reducers/scriptEventsReducers";
import palettesReducers from "store/features/entities/reducers/palettesReducers";
import variablesReducers from "store/features/entities/reducers/variablesReducers";
import customEventsReducers from "store/features/entities/reducers/customEventsReducers";
import engineFieldValuesReducers from "store/features/entities/reducers/engineFieldValuesReducers";
import backgroundsReducers from "store/features/entities/reducers/backgroundsReducers";
import tilesetsReducers from "store/features/entities/reducers/tilesetsReducers";
import musicReducers, {
  loadMusic,
} from "store/features/entities/reducers/musicReducers";
import soundsReducers from "store/features/entities/reducers/soundsReducers";
import emotesReducers from "store/features/entities/reducers/emotesReducers";
import fontsReducers from "store/features/entities/reducers/fontsReducers";
import avatarsReducers from "store/features/entities/reducers/avatarsReducers";
import assetsReducers, {
  reloadAssets,
  removedAsset,
  renamedAsset,
} from "store/features/entities/reducers/assetsReducers";
import { loadProject } from "store/features/entities/reducers/projectLifecycleReducers";
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
    ...assetsReducers,
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
