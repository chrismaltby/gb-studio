import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import {
  Background,
  SpriteSheet,
  Music,
  EntitiesState,
  Font,
  Avatar,
  Emote,
  ProjectEntitiesData,
  BackgroundData,
  SpriteSheetData,
  MusicData,
  FontData,
  AvatarData,
  EmoteData,
  Sound,
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
import { loadAvatarData } from "lib/project/loadAvatarData";
import { loadEmoteData } from "lib/project/loadEmoteData";
import { loadSoundData } from "lib/project/loadSoundData";

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

export const trimDenormalisedProject = (data: ProjectData): ProjectData => {
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

    return {
      data,
    };
  }
);

const removeBackground = createAsyncThunk<
  { filename: string; plugin?: string },
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
  { filename: string; plugin?: string },
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
      throw new Error("Unable to load music");
    }

    return {
      data,
    };
  }
);

const removeMusic = createAsyncThunk<
  { filename: string; plugin?: string },
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
 * Sound Effects
 */

const loadSound = createAsyncThunk<{ data: Sound }, string>(
  "project/loadSound",
  async (filename, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    const projectRoot = state.document && state.document.root;
    const data = (await loadSoundData(projectRoot)(filename)) as
      | Sound
      | undefined;

    if (!data) {
      throw new Error("Unable to load sound effect");
    }

    return {
      data,
    };
  }
);

const removeSound = createAsyncThunk<
  { filename: string; plugin?: string },
  string
>("project/removeSound", async (filename, thunkApi) => {
  const state = thunkApi.getState() as RootState;
  const projectRoot = state.document && state.document.root;
  const { file, plugin } = parseAssetPath(filename, projectRoot, "sounds");
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
  { filename: string; plugin?: string },
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

const loadAvatar = createAsyncThunk<{ data: Avatar }, string>(
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
  { filename: string; plugin?: string },
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

const loadEmote = createAsyncThunk<{ data: Emote }, string>(
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
  { filename: string; plugin?: string },
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
      const normalizedProject = trimDenormalisedProject(
        denormalizeProject(state.project.present)
      );

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
  loadSound,
  removeSound,
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
