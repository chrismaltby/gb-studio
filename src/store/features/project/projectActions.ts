import { createAsyncThunk } from "@reduxjs/toolkit";
import { normalize, denormalize, schema } from "normalizr";
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
} from "../entities/entitiesSlice";
import migrateWarning from "../../../lib/project/migrateWarning";
import { actions as errorActions } from "../error/errorSlice";
import { RootState, AppDispatch } from "../../configureStore";
import loadProjectData from "../../../lib/project/loadProjectData";
import saveProjectData from "../../../lib/project/saveProjectData";
import saveAsProjectData from "../../../lib/project/saveAsProjectData";
import { loadSpriteData } from "../../../lib/project/loadSpriteData";
import { loadBackgroundData } from "../../../lib/project/loadBackgroundData";
import { loadMusicData } from "../../../lib/project/loadMusicData";
import { SettingsState } from "../settings/settingsSlice";

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

export const actions = {
  loadProject,
};
