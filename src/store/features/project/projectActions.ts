import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import {
  Scene,
  Background,
  SpriteSheet,
  Palette,
  Music,
  Variable,
  Actor,
  Trigger,
  CustomEvent,
  EntitiesState,
} from "../entities/entitiesTypes";
import { RootState } from "../../configureStore";
import loadProjectData from "../../../lib/project/loadProjectData";
import saveProjectData from "../../../lib/project/saveProjectData";
import saveAsProjectData from "../../../lib/project/saveAsProjectData";
import { loadSpriteData } from "../../../lib/project/loadSpriteData";
import { loadBackgroundData } from "../../../lib/project/loadBackgroundData";
import { loadMusicData } from "../../../lib/project/loadMusicData";
import { SettingsState } from "../settings/settingsState";
import { MetadataState } from "../metadata/metadataState";
import parseAssetPath from "../../../lib/helpers/path/parseAssetPath";
import { denormalizeEntities } from "../entities/entitiesHelpers";

let saving: boolean = false;

export type ProjectData = {
  name: string;
  author: string;
  notes: string;
  _version: string;
  _release: string;
  scenes: SceneData[];
  backgrounds: Background[];
  spriteSheets: SpriteSheet[];
  palettes: Palette[];
  customEvents: CustomEvent[];
  music: Music[];
  variables: Variable[];
  settings: SettingsState;
};

type SceneData = Omit<Scene, "actors" | "triggers"> & {
  actors: Actor[];
  triggers: Trigger[];
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

const openProject = createAction<string>("project/openProject");
const closeProject = createAction<void>("project/closeProject");

const loadProject = createAsyncThunk<
  { data: ProjectData; path: string },
  string
>("project/loadProject", async (path) => {
  const data = (await loadProjectData(path)) as ProjectData;

  return {
    data,
    path,
  };
});

/**************************************************************************
 * Backgrounds
 */

const loadBackground = createAsyncThunk<{ data: Background }, string>(
  "project/loadBackground",
  async (filename, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    const projectRoot = state.document && state.document.root;
    const data = (await loadBackgroundData(projectRoot)(filename)) as
      | Background
      | undefined;

    if (!data) {
      throw new Error("Unable to load background");
    }

    return {
      data,
    };
  }
);

const removeBackground = createAsyncThunk<
  { filename: string; plugin: string | undefined },
  string
>("project/removeBackground", async (filename, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "backgrounds");
  return {
    filename: file,
    plugin,
  };
});

/**************************************************************************
 * Sprites
 */

const loadSprite = createAsyncThunk<{ data: SpriteSheet }, string>(
  "project/loadSprite",
  async (filename, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    const projectRoot = state.document && state.document.root;
    const data = (await loadSpriteData(projectRoot)(filename)) as
      | SpriteSheet
      | undefined;

    if (!data) {
      throw new Error("Unable to load sprite sheet");
    }

    return {
      data,
    };
  }
);

const removeSprite = createAsyncThunk<
  { filename: string; plugin: string | undefined },
  string
>("project/removeSprite", async (filename, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "sprites");
  return {
    filename: file,
    plugin,
  };
});

/**************************************************************************
 * Music
 */

const loadMusic = createAsyncThunk<{ data: Music }, string>(
  "project/loadMusic",
  async (filename, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    const projectRoot = state.document && state.document.root;
    const data = (await loadMusicData(projectRoot)(filename)) as
      | Music
      | undefined;

    if (!data) {
      throw new Error("Unable to load sprite sheet");
    }

    return {
      data,
    };
  }
);

const removeMusic = createAsyncThunk<
  { filename: string; plugin: string | undefined },
  string
>("project/removeMusic", async (filename, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "music");
  return {
    filename: file,
    plugin,
  };
});

/**************************************************************************
 * UI
 */

const loadUI = createAction("project/loadUI");
const reloadAssets = createAction("project/reloadAssets");

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
      const normalizedProject = denormalizeProject(state.project.present);

      const data = {
        ...normalizedProject,
        settings: {
          ...normalizedProject.settings,
          zoom: state.editor.zoom,
          worldScrollX: state.editor.worldScrollX,
          worldScrollY: state.editor.worldScrollY,
        },
      };

      if (newPath) {
        // Save As
        await saveAsProjectData(state.document.path, newPath, data);
      } else {
        // Save
        await saveProjectData(state.document.path, data);
      }
    } catch (e) {
      console.error(e);
    }

    saving = false;
  }
);

export default {
  openProject,
  closeProject,
  loadProject,
  loadBackground,
  removeBackground,
  loadSprite,
  removeSprite,
  loadMusic,
  removeMusic,
  loadUI,
  reloadAssets,
  saveProject,
};
