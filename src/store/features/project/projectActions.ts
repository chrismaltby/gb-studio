import {
  createAsyncThunk,
  createAction,
  type EntitySelectors,
} from "@reduxjs/toolkit";
import {
  EntitiesState,
  ProjectEntitiesData,
} from "shared/lib/entities/entitiesTypes";
import type { AppThunk, RootState } from "store/storeTypes";
import { SettingsState } from "store/features/settings/settingsState";
import { MetadataState } from "store/features/metadata/metadataState";
import { denormalizeEntities } from "shared/lib/entities/entitiesHelpers";
import API from "renderer/lib/api";
import type { Asset, AssetType } from "shared/lib/helpers/assets";
import type { LoadProjectResult } from "lib/project/loadProjectData";
import { ProjectResources } from "shared/lib/resources/types";
import { compressProjectResources } from "shared/lib/resources/compression";
import { buildCompressedProjectResourcesPatch } from "shared/lib/resources/patch";
import {
  backgroundSelectors,
  musicSelectors,
  soundSelectors,
  spriteSheetSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesSelectors";
import { assertUnreachable } from "shared/lib/helpers/assert";

let saving = false;

export type ProjectData = ProjectEntitiesData & {
  name: string;
  author: string;
  notes: string;
  _version: string;
  _release: string;
  settings: SettingsState;
};

export type SaveStep =
  | "saving"
  | "normalizing"
  | "compressing"
  | "checksums"
  | "patching"
  | "writing"
  | "complete";

export const denormalizeProject = (project: {
  entities: EntitiesState;
  settings: SettingsState;
  metadata: MetadataState;
}): ProjectResources => {
  const entitiesData = denormalizeEntities(project.entities);
  return {
    ...entitiesData,
    settings: {
      _resourceType: "settings",
      ...project.settings,
    },
    metadata: {
      _resourceType: "project",
      ...project.metadata,
    },
  };
};

const closeProject = createAction<void>("project/closeProject");

const setSaveStep = createAction<SaveStep>("project/setSaveStep");
const setSaveWriteProgress = createAction<{ completed: number; total: number }>(
  "project/setSaveWriteProgress",
);

const loadProject = createAsyncThunk<
  LoadProjectResult & { path: string },
  string
>("project/loadProject", async (path) => {
  const data = await API.project.loadProject();
  return {
    ...data,
    path,
  };
});

const openProject =
  (path: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const shouldOpenProject = await API.dialog.migrateWarning(path);

    if (!shouldOpenProject) {
      dispatch(closeProject());
      return;
    }

    await API.app.showProjectWindow();
    await dispatch(loadProject(path));
  };

/**************************************************************************
 * UI
 */

const loadUI = createAction("project/loadUI");
const reloadAssets = createAction("project/reloadAssets");

/**************************************************************************
 * Asset Files
 */

const removeAsset = createAsyncThunk<
  {
    assetType: AssetType;
    asset: Asset;
  },
  {
    assetType: AssetType;
    asset: Asset;
  }
>("project/removeAsset", async ({ assetType, asset }) => {
  if (!(await API.project.removeAsset(assetType, asset))) {
    throw new Error("Didn't remove asset");
  }
  return {
    assetType,
    asset,
  };
});

const renameAsset = createAsyncThunk<
  {
    assetType: AssetType;
    asset: Asset;
    newFilename: string;
  },
  {
    assetType: AssetType;
    asset: Asset;
    newFilename: string;
  }
>("project/renameAsset", async ({ assetType, asset, newFilename }) => {
  if (!(await API.project.renameAsset(assetType, asset, newFilename))) {
    throw new Error("Didn't rename asset");
  }
  return {
    assetType,
    asset,
    newFilename,
  };
});

const renameMusicAsset = createAction<{ musicId: string; newFilename: string }>(
  "project/renameMusicAsset",
);

const renameSelectedAsset =
  <T extends Asset>(
    assetType: AssetType,
    assetSelectors: EntitySelectors<T, RootState, string>,
    assetId: string,
    newName: string,
    getExtension: (asset: T) => string,
  ): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const asset = assetSelectors.selectById(getState(), assetId);
    if (!asset) {
      return;
    }

    await dispatch(
      renameAsset({
        assetType,
        asset,
        newFilename: `${newName}.${getExtension(asset)}`,
      }),
    );
  };

const removeSelectedAsset =
  <T extends Asset>(
    assetType: AssetType,
    assetSelectors: EntitySelectors<T, RootState, string>,
    assetId: string,
  ): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const asset = assetSelectors.selectById(getState(), assetId);
    if (asset) {
      await dispatch(removeAsset({ assetType, asset }));
    }
  };

const renameBackgroundAsset = (payload: {
  backgroundId: string;
  newFilename: string;
}) =>
  renameSelectedAsset(
    "backgrounds",
    backgroundSelectors,
    payload.backgroundId,
    payload.newFilename,
    () => "png",
  );

const removeBackgroundAsset = (payload: { backgroundId: string }) =>
  removeSelectedAsset("backgrounds", backgroundSelectors, payload.backgroundId);

const renameTilesetAsset = (payload: {
  tilesetId: string;
  newFilename: string;
}) =>
  renameSelectedAsset(
    "tilesets",
    tilesetSelectors,
    payload.tilesetId,
    payload.newFilename,
    () => "png",
  );

const removeTilesetAsset = (payload: { tilesetId: string }) =>
  removeSelectedAsset("tilesets", tilesetSelectors, payload.tilesetId);

const renameSpriteAsset = (payload: {
  spriteSheetId: string;
  newFilename: string;
}) =>
  renameSelectedAsset(
    "sprites",
    spriteSheetSelectors,
    payload.spriteSheetId,
    payload.newFilename,
    () => "png",
  );

const removeSpriteAsset = (payload: { spriteSheetId: string }) =>
  removeSelectedAsset("sprites", spriteSheetSelectors, payload.spriteSheetId);

const removeMusicAsset = (payload: { musicId: string }) =>
  removeSelectedAsset("music", musicSelectors, payload.musicId);

const renameSoundAsset = (payload: { soundId: string; newFilename: string }) =>
  renameSelectedAsset(
    "sounds",
    soundSelectors,
    payload.soundId,
    payload.newFilename,
    (asset) =>
      asset.type === "fxhammer"
        ? "sav"
        : asset.type === "vgm"
          ? "vgm"
          : asset.type === "wav"
            ? "wav"
            : assertUnreachable(asset.type),
  );

const removeSoundAsset = (payload: { soundId: string }) =>
  removeSelectedAsset("sounds", soundSelectors, payload.soundId);

/**************************************************************************
 * Save
 */

const saveProject = createAsyncThunk<void>(
  "project/saveProject",
  async (_, thunkApi) => {
    const state = thunkApi.getState() as RootState;

    if (!state.document.loaded) {
      throw new Error("Cannot save project that has not finished loading");
    }
    if (saving) {
      throw new Error("Cannot save project while already saving");
    }

    saving = true;

    try {
      thunkApi.dispatch(setSaveStep("normalizing"));

      const normalizedProject = denormalizeProject(state.project.present);

      thunkApi.dispatch(setSaveStep("compressing"));

      const data = compressProjectResources({
        ...normalizedProject,
        settings: {
          ...normalizedProject.settings,
          zoom: state.editor.zoom,
          worldScrollX: state.editor.worldScrollX,
          worldScrollY: state.editor.worldScrollY,
          navigatorSplitSizes: state.editor.navigatorSplitSizesManuallyEdited
            ? state.editor.navigatorSplitSizes
            : normalizedProject.settings.navigatorSplitSizes,
        },
      });

      // Save
      thunkApi.dispatch(setSaveStep("checksums"));
      const resourceChecksums = await API.project.getResourceChecksums();

      thunkApi.dispatch(setSaveStep("patching"));
      const patch = buildCompressedProjectResourcesPatch(
        data,
        resourceChecksums,
      );

      thunkApi.dispatch(setSaveStep("writing"));
      await API.project.saveProject(patch);

      thunkApi.dispatch(setSaveStep("complete"));
    } catch (e) {
      console.error(e);
      saving = false;
      throw e;
    }

    saving = false;
  },
);

const projectActions = {
  openProject,
  closeProject,
  loadProject,
  loadUI,
  reloadAssets,
  saveProject,
  setSaveStep,
  setSaveWriteProgress,
  renameAsset,
  renameBackgroundAsset,
  renameTilesetAsset,
  renameSpriteAsset,
  renameMusicAsset,
  renameSoundAsset,
  removeAsset,
  removeBackgroundAsset,
  removeTilesetAsset,
  removeSpriteAsset,
  removeMusicAsset,
  removeSoundAsset,
};

export default projectActions;
