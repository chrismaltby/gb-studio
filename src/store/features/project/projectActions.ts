import { createAsyncThunk, createAction, Dictionary } from "@reduxjs/toolkit";
import {
  EntitiesState,
  ProjectEntitiesData,
  BackgroundData,
  SpriteSheetData,
  MusicData,
  FontData,
  AvatarData,
  EmoteData,
  SoundData,
} from "shared/lib/entities/entitiesTypes";
import type { ScriptEventDef } from "lib/project/loadScriptEventHandlers";
import type { RootState } from "store/configureStore";
import { SettingsState } from "store/features/settings/settingsState";
import { MetadataState } from "store/features/metadata/metadataState";
import { denormalizeEntities } from "shared/lib/entities/entitiesHelpers";
import API from "renderer/lib/api";
import { EngineFieldSchema } from "store/features/engine/engineState";

let saving = false;

export type ProjectData = ProjectEntitiesData & {
  name: string;
  author: string;
  notes: string;
  _version: string;
  _release: string;
  settings: SettingsState;
};

export const denormalizeProject = (project: {
  entities: EntitiesState;
  settings: SettingsState;
  metadata: MetadataState;
}): ProjectData => {
  const entitiesData = denormalizeEntities(project.entities);
  return JSON.parse(
    JSON.stringify({
      ...project.metadata,
      ...entitiesData,
      settings: project.settings,
    })
  );
};

export const trimProjectData = (data: ProjectData): ProjectData => {
  return {
    ...data,
    backgrounds: data.backgrounds.map(
      (background) =>
        ({
          ...background,
          inode: undefined,
          _v: undefined,
        } as unknown as BackgroundData)
    ),
    spriteSheets: data.spriteSheets.map(
      (spriteSheet) =>
        ({
          ...spriteSheet,
          inode: undefined,
          _v: undefined,
        } as unknown as SpriteSheetData)
    ),
    music: data.music.map(
      (track) =>
        ({
          ...track,
          inode: undefined,
          _v: undefined,
        } as unknown as MusicData)
    ),
    sounds: data.sounds.map(
      (sound) =>
        ({
          ...sound,
          inode: undefined,
          _v: undefined,
        } as unknown as SoundData)
    ),
    fonts: data.fonts.map(
      (font) =>
        ({
          ...font,
          mapping: undefined,
          inode: undefined,
          _v: undefined,
        } as unknown as FontData)
    ),
    avatars: data.avatars.map(
      (avatar) =>
        ({
          ...avatar,
          inode: undefined,
          _v: undefined,
        } as unknown as AvatarData)
    ),
    emotes: data.emotes.map(
      (emote) =>
        ({
          ...emote,
          inode: undefined,
          _v: undefined,
        } as unknown as EmoteData)
    ),
  };
};

const openProject = createAction<string>("project/openProject");
const closeProject = createAction<void>("project/closeProject");

const loadProject = createAsyncThunk<
  {
    data: ProjectData;
    path: string;
    scriptEventDefs: Dictionary<ScriptEventDef>;
    engineFields: EngineFieldSchema[];
    modifiedSpriteIds: string[];
  },
  string
>("project/loadProject", async (path) => {
  const { data, scriptEventDefs, engineFields, modifiedSpriteIds } =
    await API.project.loadProject();
  return {
    data,
    path,
    scriptEventDefs,
    engineFields,
    modifiedSpriteIds,
  };
});

/**************************************************************************
 * UI
 */

const loadUI = createAction("project/loadUI");
const reloadAssets = createAction("project/reloadAssets");

/**************************************************************************
 * Asset Files
 */

const addFileToProject = createAction<string>("project/addFile");

/**************************************************************************
 * Save
 */

const saveProject = createAsyncThunk<void, string | undefined>(
  "project/saveProject",
  async (newPath, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    if (!state.document.loaded) {
      throw new Error("Cannot save project that has not finished loading");
    }
    if (saving) {
      throw new Error("Cannot save project while already saving");
    }
    if (!newPath && !state.document.modified) {
      throw new Error("Cannot save unmodified project");
    }

    saving = true;

    try {
      const normalizedProject = trimProjectData(
        denormalizeProject(state.project.present)
      );

      const data: ProjectData = {
        ...normalizedProject,
        settings: {
          ...normalizedProject.settings,
          zoom: state.editor.zoom,
          worldScrollX: state.editor.worldScrollX,
          worldScrollY: state.editor.worldScrollY,
          navigatorSplitSizes: state.editor.navigatorSplitSizes,
        },
      };

      if (newPath) {
        // Save As
        await API.project.saveProjectAs(newPath, data);
      } else {
        // Save
        await API.project.saveProject(data);
      }
    } catch (e) {
      console.error(e);
    }

    saving = false;
  }
);

const projectActions = {
  openProject,
  closeProject,
  loadProject,
  loadUI,
  addFileToProject,
  reloadAssets,
  saveProject,
};

export default projectActions;
