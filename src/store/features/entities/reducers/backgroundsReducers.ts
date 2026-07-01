import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  ensureSymbolsUnique,
  updateEntitySymbol,
  upsertAssetEntity,
} from "shared/lib/entities/entitiesHelpers";
import keyBy from "lodash/keyBy";
import { monoOverrideForFilename } from "shared/lib/assets/backgrounds";
import {
  BackgroundAsset,
  CompressedBackgroundResourceAsset,
} from "shared/lib/resources/types";
import { backgroundsAdapter } from "store/features/entities/adapters";
import {
  localBackgroundSelectById,
  localBackgroundSelectAll,
  localSceneSelectAll,
} from "store/features/entities/helpers";
import { resizeTiles } from "shared/lib/helpers/tiles";

const loadBackground: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: CompressedBackgroundResourceAsset;
  }>
> = (state, action) => {
  const existingBackground = localBackgroundSelectById(
    state,
    action.payload.data.id,
  );
  const modifiedSize =
    existingBackground &&
    (existingBackground.width !== action.payload.data.width ||
      existingBackground.height !== action.payload.data.height);

  const originalWidth = existingBackground?.width ?? 0;
  const originalHeight = existingBackground?.height ?? 0;

  upsertAssetEntity(
    state.backgrounds,
    backgroundsAdapter,
    {
      ...action.payload.data,
      tileColors: [],
    },
    ["id", "symbol", "autoColor", "tileColors"],
  );

  if (modifiedSize) {
    backgroundsAdapter.updateOne(state.backgrounds, {
      id: existingBackground.id,
      changes: {
        tileColors: resizeTiles(
          existingBackground.tileColors,
          originalWidth,
          originalHeight,
          action.payload.data.width,
          action.payload.data.height,
        ),
      },
    });
  }

  fixAllScenesWithModifiedBackgrounds(state);
  updateMonoOverrideIds(state);
  ensureSymbolsUnique(state);
};

const setBackgroundSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ backgroundId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.backgrounds,
    backgroundsAdapter,
    action.payload.backgroundId,
    action.payload.symbol,
  );
};

const editBackgroundAutoColor: CaseReducer<
  EntitiesState,
  PayloadAction<{ backgroundId: string; autoColor: boolean }>
> = (state, action) => {
  const background = localBackgroundSelectById(
    state,
    action.payload.backgroundId,
  );
  if (background) {
    backgroundsAdapter.updateOne(state.backgrounds, {
      id: background.id,
      changes: {
        autoColor: action.payload.autoColor,
      },
    });
  }
};

const editBackgroundAutoTileFlipOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    backgroundId: string;
    autoTileFlipOverride: boolean | undefined;
  }>
> = (state, action) => {
  const background = localBackgroundSelectById(
    state,
    action.payload.backgroundId,
  );
  if (background) {
    backgroundsAdapter.updateOne(state.backgrounds, {
      id: background.id,
      changes: {
        autoTileFlipOverride: action.payload.autoTileFlipOverride,
      },
    });
  }
};

export const fixAllScenesWithModifiedBackgrounds = (state: EntitiesState) => {
  const scenes = localSceneSelectAll(state);
  for (const scene of scenes) {
    if (scene.tilemap) {
      continue;
    }
    const background = localBackgroundSelectById(state, scene.backgroundId);
    if (
      !background ||
      scene.width !== background.width ||
      scene.height !== background.height
    ) {
      const newWidth = background ? background.width : 32;
      const newHeight = background ? background.height : 32;
      scene.collisions = resizeTiles(
        scene.collisions,
        scene.width,
        scene.height,
        newWidth,
        newHeight,
      );
      scene.width = newWidth;
      scene.height = newHeight;
    }
  }
};

export const updateMonoOverrideIds = (state: EntitiesState) => {
  const backgrounds = localBackgroundSelectAll(state);
  const getKey = (b: BackgroundAsset) => `${b.plugin ?? ""}_${b.filename}`;
  const getMonoKey = (b: BackgroundAsset) =>
    `${b.plugin ?? ""}_${monoOverrideForFilename(b.filename)}`;
  const monoOverrideLookup = keyBy(backgrounds, getKey);
  backgrounds.forEach((b) => {
    const monoKey = getMonoKey(b);
    b.monoOverrideId = monoOverrideLookup[monoKey]?.id;
  });
};

const backgroundsReducers = {
  loadBackground,
  setBackgroundSymbol,
  editBackgroundAutoColor,
  editBackgroundAutoTileFlipOverride,
} satisfies SliceCaseReducers<EntitiesState>;

export default backgroundsReducers;
