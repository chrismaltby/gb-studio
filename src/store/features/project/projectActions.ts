import { createAsyncThunk, createAction, Dictionary } from "@reduxjs/toolkit";
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
  Font,
  Avatar,
  Emote,
} from "../entities/entitiesTypes";
import type { RootState } from "store/configureStore";
import loadProjectData from "lib/project/loadProjectData";
import saveProjectData from "lib/project/saveProjectData";
import saveAsProjectData from "lib/project/saveAsProjectData";
import { loadSpriteData } from "lib/project/loadSpriteData";
import { loadBackgroundData } from "lib/project/loadBackgroundData";
import { loadMusicData } from "lib/project/loadMusicData";
import { loadFontData } from "lib/project/loadFontData";
import { SettingsState } from "../settings/settingsState";
import { MetadataState } from "../metadata/metadataState";
import parseAssetPath from "lib/helpers/path/parseAssetPath";
import { denormalizeEntities } from "../entities/entitiesHelpers";
import { matchAsset } from "../entities/entitiesHelpers";
import { loadAvatarData } from "lib/project/loadAvatarData";
import { loadEmoteData } from "lib/project/loadEmoteData";

let saving = false;

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
  fonts: Font[];
  avatars: Avatar[];
  emotes: Emote[];
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

const inodeToRecentBackground: Dictionary<Background> = {};
const inodeToRecentSpriteSheet: Dictionary<SpriteSheet> = {};

const openProject = createAction<string>("project/openProject");
const closeProject = createAction<void>("project/closeProject");

const loadProject = createAsyncThunk<
  { data: ProjectData; path: string; modifiedSpriteIds: string[] },
  string
>("project/loadProject", async (path) => {
  const { data, modifiedSpriteIds } = (await loadProjectData(path)) as {
    data: ProjectData;
    modifiedSpriteIds: string[];
  };

  return {
    data,
    path,
    modifiedSpriteIds,
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

    const backgrounds = state.project.present.entities.backgrounds.ids.map(
      (id) => state.project.present.entities.backgrounds.entities[id]
    ) as Background[];

    const existingAsset =
      backgrounds.find(matchAsset(data)) || inodeToRecentBackground[data.inode];

    const existingId = existingAsset?.id;

    if (existingId) {
      delete inodeToRecentBackground[data.inode];
      return {
        data: {
          ...existingAsset,
          ...data,
          id: existingId,
        },
      };
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

    const spriteSheets = state.project.present.entities.spriteSheets.ids.map(
      (id) => state.project.present.entities.spriteSheets.entities[id]
    ) as SpriteSheet[];

    const existingAsset =
      spriteSheets.find(matchAsset(data)) ||
      inodeToRecentSpriteSheet[data.inode];

    if (existingAsset) {
      delete inodeToRecentSpriteSheet[data.inode];
      const oldAutoName = existingAsset.filename.replace(/.png/i, "");
      return {
        data: {
          ...existingAsset,
          ...data,
          id: existingAsset.id,
          name:
            existingAsset.name !== oldAutoName
              ? existingAsset.name || data.name
              : data.name,
          states: existingAsset.states,
        },
      };
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

  const spriteSheets = state.project.present.entities.spriteSheets.ids.map(
    (id) => state.project.present.entities.spriteSheets.entities[id]
  ) as SpriteSheet[];

  const asset = {
    filename: file,
    plugin,
  };

  const existingAsset = spriteSheets.find(matchAsset(asset));

  if (existingAsset) {
    inodeToRecentSpriteSheet[existingAsset.inode] = existingAsset;
  }

  return asset;
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
 * Fonts
 */

const loadFont = createAsyncThunk<{ data: Font }, string>(
  "project/loadFont",
  async (filename, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    const projectRoot = state.document && state.document.root;
    const data = (await loadFontData(projectRoot)(filename)) as
      | Font
      | undefined;

    if (!data) {
      throw new Error("Unable to load font");
    }

    return {
      data,
    };
  }
);

const removeFont = createAsyncThunk<
  { filename: string; plugin: string | undefined },
  string
>("project/removeFont", async (filename, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "fonts");
  return {
    filename: file,
    plugin,
  };
});

/**************************************************************************
 * Avatars
 */

const loadAvatar = createAsyncThunk<{ data: Font }, string>(
  "project/loadAvatar",
  async (filename, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    const projectRoot = state.document && state.document.root;
    const data = (await loadAvatarData(projectRoot)(filename)) as
      | Avatar
      | undefined;

    if (!data) {
      throw new Error("Unable to load avatar");
    }

    return {
      data,
    };
  }
);

const removeAvatar = createAsyncThunk<
  { filename: string; plugin: string | undefined },
  string
>("project/removeAvatar", async (filename, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "avatars");
  return {
    filename: file,
    plugin,
  };
});

/**************************************************************************
 * Emotes
 */

const loadEmote = createAsyncThunk<{ data: Font }, string>(
  "project/loadEmote",
  async (filename, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    const projectRoot = state.document && state.document.root;
    const data = (await loadEmoteData(projectRoot)(filename)) as
      | Emote
      | undefined;

    if (!data) {
      throw new Error("Unable to load emote");
    }

    return {
      data,
    };
  }
);

const removeEmote = createAsyncThunk<
  { filename: string; plugin: string | undefined },
  string
>("project/removeEmote", async (filename, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "emotes");
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
      const normalizedProject = denormalizeProject(state.project.present);

      const data = {
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
  loadFont,
  removeFont,
  loadAvatar,
  removeAvatar,
  loadEmote,
  removeEmote,
  loadUI,
  addFileToProject,
  reloadAssets,
  saveProject,
};
