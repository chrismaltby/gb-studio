import { createSlice, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { RootState } from "store/storeTypes";
import projectActions from "store/features/project/projectActions";
import {
  EntitiesState,
  ScriptEventNormalized,
  ScriptEventParentType,
} from "shared/lib/entities/entitiesTypes";
import spriteActions from "store/features/sprite/spriteActions";
import { addNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
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

export default entitiesSlice.reducer;
