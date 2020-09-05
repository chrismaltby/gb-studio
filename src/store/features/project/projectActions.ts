import { createAsyncThunk } from "@reduxjs/toolkit";
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
  denormalizeEntities,
  EntitiesState,
} from "../entities/entitiesSlice";
import migrateWarning from "../../../lib/project/migrateWarning";
import { RootState, AppDispatch } from "../../configureStore";
import loadProjectData from "../../../lib/project/loadProjectData";
import saveProjectData from "../../../lib/project/saveProjectData";
import saveAsProjectData from "../../../lib/project/saveAsProjectData";
import { loadSpriteData } from "../../../lib/project/loadSpriteData";
import { loadBackgroundData } from "../../../lib/project/loadBackgroundData";
import { loadMusicData } from "../../../lib/project/loadMusicData";
import { SettingsState } from "../settings/settingsSlice";
import { MetadataState } from "../metadata/metadataSlice";

let saving: boolean = false;

type ProjectData = {
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
  return JSON.parse(JSON.stringify({
    ...project.metadata,
    ...entitiesData,
    settings: project.settings
  }));
};

const loadProject = createAsyncThunk<
  { data: ProjectData; path: string },
  string
>("project/loadProject", async (path, thunkApi) => {
  const shouldOpenProject = await migrateWarning(path);

  if (!shouldOpenProject) {
    throw new Error("Cancelled opening project");
  }

  const data = (await loadProjectData(path)) as ProjectData;

  return {
    data,
    path,
  };
});

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

export const actions = {
  loadProject,
  saveProject,
};
