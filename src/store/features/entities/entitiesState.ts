import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  ThunkDispatch,
  UnknownAction,
  createSelector,
  CaseReducer,
} from "@reduxjs/toolkit";
import l10n from "shared/lib/lang/l10n";
import {
  DMG_PALETTE,
  COLLISION_ALL,
  DRAG_PLAYER,
  DRAG_DESTINATION,
  DRAG_TRIGGER,
  DRAG_ACTOR,
  TILE_COLOR_PROPS,
  TILE_COLOR_PALETTE,
  COLLISION_SLOPE_45_LEFT,
  COLLISION_SLOPE_45_RIGHT,
  COLLISION_SLOPE_22_LEFT_BOT,
  COLLISION_SLOPE_22_RIGHT_BOT,
  COLLISION_SLOPE_22_LEFT_TOP,
  COLLISION_SLOPE_22_RIGHT_TOP,
  COLLISION_TOP,
  COLLISION_BOTTOM,
  COLLISION_RIGHT,
  COLLISION_LEFT,
  EVENT_CALL_CUSTOM_EVENT,
} from "consts";
import { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import clamp from "shared/lib/helpers/clamp";
import { RootState } from "store/configureStore";
import settingsActions from "store/features/settings/settingsActions";
import uuid from "uuid";
import {
  paint,
  paintLine,
  floodFill,
  paintMagic,
} from "shared/lib/helpers/paint";
import { Brush, SlopeIncline } from "store/features/editor/editorState";
import projectActions from "store/features/project/projectActions";
import {
  EntitiesState,
  ActorNormalized,
  TriggerNormalized,
  SceneNormalized,
  Background,
  SpriteSheetNormalized,
  Palette,
  Music,
  Variable,
  CustomEventNormalized,
  ScriptEventNormalized,
  MusicSettings,
  EngineFieldValue,
  Metasprite,
  MetaspriteTile,
  SpriteAnimation,
  Font,
  ObjPalette,
  Avatar,
  Emote,
  SpriteState,
  ScriptEventsRef,
  ScriptEventParentType,
  Sound,
  Tileset,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
  ScriptEventArgsOverride,
  ScriptEventArgs,
} from "shared/lib/entities/entitiesTypes";
import {
  sortByFilename,
  genEntitySymbol,
  ensureSymbolsUnique,
  removeAssetEntity,
  upsertAssetEntity,
  updateEntitySymbol,
  defaultLocalisedSceneName,
  renameAssetEntity,
  defaultLocalisedCustomEventName,
  paletteName,
  updateCustomEventArgs,
  updateAllCustomEventsArgs,
  normalizeEntityResources,
  localVariableCodes,
  normalizeSprite,
} from "shared/lib/entities/entitiesHelpers";
import spriteActions from "store/features/sprite/spriteActions";
import { isValueNumber } from "shared/lib/scriptValue/types";
import keyBy from "lodash/keyBy";
import { monoOverrideForFilename } from "shared/lib/assets/backgrounds";
import { Asset, AssetType } from "shared/lib/helpers/assets";
import { assertUnreachable } from "shared/lib/scriptValue/format";
import { addNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
import type { LoadProjectResult } from "lib/project/loadProjectData";
import { decompressProjectResources } from "shared/lib/resources/compression";
import { omit } from "shared/types";
import { isEqual } from "lodash";
import {
  AvatarResourceAsset,
  CompressedBackgroundResourceAsset,
  Constant,
  EmoteResourceAsset,
  FontResourceAsset,
  MusicResourceAsset,
  SoundResourceAsset,
  SpriteResourceAsset,
  TilesetResourceAsset,
} from "shared/lib/resources/types";
import {
  insertAfterElement,
  moveArrayElement,
  moveArrayElements,
  sortSubsetStringArray,
} from "shared/lib/helpers/array";
import { resizeTiles } from "shared/lib/helpers/tiles";

const MIN_SCENE_X = 60;
const MIN_SCENE_Y = 30;
const MIN_SCENE_WIDTH = 20;
const MIN_SCENE_HEIGHT = 18;

const scriptEventsAdapter = createEntityAdapter<ScriptEventNormalized>();
const actorsAdapter = createEntityAdapter<ActorNormalized>();
const triggersAdapter = createEntityAdapter<TriggerNormalized>();
const scenesAdapter = createEntityAdapter<SceneNormalized>();
const actorPrefabsAdapter = createEntityAdapter<ActorPrefabNormalized>();
const triggerPrefabsAdapter = createEntityAdapter<TriggerPrefabNormalized>();
const backgroundsAdapter = createEntityAdapter<Background>({
  sortComparer: sortByFilename,
});
const spriteSheetsAdapter = createEntityAdapter<SpriteSheetNormalized>({
  sortComparer: sortByFilename,
});
const tilesetsAdapter = createEntityAdapter<Tileset>({
  sortComparer: sortByFilename,
});
const metaspritesAdapter = createEntityAdapter<Metasprite>();
const metaspriteTilesAdapter = createEntityAdapter<MetaspriteTile>();
const spriteAnimationsAdapter = createEntityAdapter<SpriteAnimation>();
const spriteStatesAdapter = createEntityAdapter<SpriteState>();
const palettesAdapter = createEntityAdapter<Palette>();
const customEventsAdapter = createEntityAdapter<CustomEventNormalized>();
const musicAdapter = createEntityAdapter<Music>({
  sortComparer: sortByFilename,
});
const soundsAdapter = createEntityAdapter<Sound>({
  sortComparer: sortByFilename,
});
const fontsAdapter = createEntityAdapter<Font>({
  sortComparer: sortByFilename,
});
const avatarsAdapter = createEntityAdapter<Avatar>({
  sortComparer: sortByFilename,
});
const emotesAdapter = createEntityAdapter<Emote>({
  sortComparer: sortByFilename,
});
const variablesAdapter = createEntityAdapter<Variable>();
const constantsAdapter = createEntityAdapter<Constant>();
const engineFieldValuesAdapter = createEntityAdapter<EngineFieldValue>();

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
  engineFieldValues: engineFieldValuesAdapter.getInitialState(),
};

const moveSelectedEntity =
  ({ sceneId, x, y }: { sceneId: string; x: number; y: number }) =>
  (
    dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
    getState: () => RootState,
  ) => {
    const state = getState();
    const { dragging, scene, eventId, entityId } = state.editor;
    if (dragging === DRAG_PLAYER) {
      dispatch(settingsActions.editPlayerStartAt({ sceneId, x, y }));
    } else if (dragging === DRAG_DESTINATION) {
      dispatch(
        actions.editScriptEventDestination({
          scriptEventId: eventId,
          destSceneId: sceneId,
          x,
          y,
        }),
      );
    } else if (dragging === DRAG_ACTOR) {
      dispatch(
        actions.moveActor({
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
          x,
          y,
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
      } else {
        dispatch(actions.removeScene({ sceneId: scene }));
      }
    } else if (editorType === "trigger") {
      dispatch(actions.removeTrigger({ sceneId: scene, triggerId: entityId }));
    } else if (editorType === "actor") {
      dispatch(actions.removeActor({ sceneId: scene, actorId: entityId }));
    }
  };

const first = <T>(array: T[]): T | undefined => {
  if (array[0]) {
    return array[0];
  }
  return undefined;
};

/**************************************************************************
 * Project
 */

const loadProject: CaseReducer<
  EntitiesState,
  PayloadAction<LoadProjectResult>
> = (state, action) => {
  const uncompressedResources = decompressProjectResources(
    action.payload.resources,
  );

  const data = normalizeEntityResources(uncompressedResources);

  actorsAdapter.setAll(state.actors, data.entities.actors || {});
  triggersAdapter.setAll(state.triggers, data.entities.triggers || {});
  scenesAdapter.setAll(state.scenes, data.entities.scenes || {});
  actorPrefabsAdapter.setAll(
    state.actorPrefabs,
    data.entities.actorPrefabs || {},
  );
  triggerPrefabsAdapter.setAll(
    state.triggerPrefabs,
    data.entities.triggerPrefabs || {},
  );
  scriptEventsAdapter.setAll(
    state.scriptEvents,
    data.entities.scriptEvents || {},
  );
  backgroundsAdapter.setAll(state.backgrounds, data.entities.backgrounds || {});
  spriteSheetsAdapter.setAll(state.spriteSheets, data.entities.sprites || {});
  metaspritesAdapter.setAll(state.metasprites, data.entities.metasprites || {});
  metaspriteTilesAdapter.setAll(
    state.metaspriteTiles,
    data.entities.metaspriteTiles || {},
  );
  spriteAnimationsAdapter.setAll(
    state.spriteAnimations,
    data.entities.spriteAnimations || {},
  );
  spriteStatesAdapter.setAll(
    state.spriteStates,
    data.entities.spriteStates || {},
  );
  palettesAdapter.setAll(state.palettes, data.entities.palettes || {});
  musicAdapter.setAll(state.music, data.entities.music || {});
  soundsAdapter.setAll(state.sounds, data.entities.sounds || {});
  fontsAdapter.setAll(state.fonts, data.entities.fonts || {});
  avatarsAdapter.setAll(state.avatars, data.entities.avatars || {});
  emotesAdapter.setAll(state.emotes, data.entities.emotes || {});
  tilesetsAdapter.setAll(state.tilesets, data.entities.tilesets || {});
  customEventsAdapter.setAll(state.customEvents, data.entities.scripts || {});
  variablesAdapter.setAll(state.variables, data.entities.variables || {});
  constantsAdapter.setAll(state.constants, data.entities.constants || {});
  engineFieldValuesAdapter.setAll(
    state.engineFieldValues,
    data.entities.engineFieldValues || {},
  );

  fixAllScenesWithModifiedBackgrounds(state);
  updateMonoOverrideIds(state);
  ensureSymbolsUnique(state);
  updateAllCustomEventsArgs(
    Object.values(state.customEvents.entities) as CustomEventNormalized[],
    state.scriptEvents.entities,
    action.payload.scriptEventDefs,
  );
};

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
  const originalHeight = existingBackground?.width ?? 0;

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

const removedAsset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    assetType: AssetType;
    asset: Asset;
  }>
> = (state, action) => {
  const { assetType, asset } = action.payload;
  if (assetType === "backgrounds") {
    removeAssetEntity(state.backgrounds, backgroundsAdapter, asset);
    updateMonoOverrideIds(state);
  } else if (assetType === "tilesets") {
    removeAssetEntity(state.tilesets, tilesetsAdapter, asset);
  } else if (assetType === "music") {
    removeAssetEntity(state.music, musicAdapter, asset);
  } else if (assetType === "sounds") {
    removeAssetEntity(state.sounds, soundsAdapter, asset);
  } else if (assetType === "fonts") {
    removeAssetEntity(state.fonts, fontsAdapter, asset);
  } else if (assetType === "avatars") {
    removeAssetEntity(state.avatars, avatarsAdapter, asset);
  } else if (assetType === "emotes") {
    removeAssetEntity(state.emotes, emotesAdapter, asset);
  } else if (assetType === "sprites") {
    removeAssetEntity(state.spriteSheets, spriteSheetsAdapter, asset);
  } else if (assetType === "ui") {
    // Ignore UI
  } else {
    assertUnreachable(assetType);
  }
};

const renamedAsset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    assetType: AssetType;
    asset: Asset;
    newFilename: string;
  }>
> = (state, action) => {
  const { assetType, asset, newFilename } = action.payload;
  if (assetType === "backgrounds") {
    renameAssetEntity(
      state.backgrounds,
      backgroundsAdapter,
      asset,
      newFilename,
    );
    updateMonoOverrideIds(state);
  } else if (assetType === "tilesets") {
    renameAssetEntity(state.tilesets, tilesetsAdapter, asset, newFilename);
  } else if (assetType === "music") {
    renameAssetEntity(state.music, musicAdapter, asset, newFilename);
  } else if (assetType === "sounds") {
    renameAssetEntity(state.sounds, soundsAdapter, asset, newFilename);
  } else if (assetType === "fonts") {
    renameAssetEntity(state.fonts, fontsAdapter, asset, newFilename);
  } else if (assetType === "avatars") {
    renameAssetEntity(state.avatars, avatarsAdapter, asset, newFilename);
  } else if (assetType === "emotes") {
    renameAssetEntity(state.emotes, emotesAdapter, asset, newFilename);
  } else if (assetType === "sprites") {
    renameAssetEntity(
      state.spriteSheets,
      spriteSheetsAdapter,
      asset,
      newFilename,
    );
  } else if (assetType === "ui") {
    // Ignore UI
  } else {
    assertUnreachable(assetType);
  }
};

const loadSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: SpriteResourceAsset;
  }>
> = (state, action) => {
  const normalizedSpriteData = normalizeSprite(action.payload.data);
  const normalizedSprite =
    normalizedSpriteData.entities.spriteSheets[normalizedSpriteData.result];

  const didInsert = upsertAssetEntity(
    state.spriteSheets,
    spriteSheetsAdapter,
    normalizedSprite,
    [
      "id",
      "symbol",
      "states",
      "canvasWidth",
      "canvasHeight",
      "boundsX",
      "boundsY",
      "boundsWidth",
      "boundsHeight",
      "animSpeed",
      "numTiles",
    ],
  );

  if (didInsert) {
    // If inserted also insert metasprite + animation data
    metaspriteTilesAdapter.addMany(
      state.metaspriteTiles,
      normalizedSpriteData.entities.metaspriteTiles ?? {},
    );
    metaspritesAdapter.addMany(
      state.metasprites,
      normalizedSpriteData.entities.metasprites ?? {},
    );
    spriteAnimationsAdapter.addMany(
      state.spriteAnimations,
      normalizedSpriteData.entities.spriteAnimations ?? {},
    );
    spriteStatesAdapter.addMany(
      state.spriteStates,
      normalizedSpriteData.entities.spriteStates ?? {},
    );
  }

  fixAllSpritesWithMissingStates(state);
  ensureSymbolsUnique(state);
};

const loadDetectedSprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimations: SpriteAnimation[];
    spriteStates: SpriteState[];
    metasprites: Metasprite[];
    metaspriteTiles: MetaspriteTile[];
    state: SpriteState;
    changes: Partial<SpriteSheetNormalized>;
  }>
> = (state, action) => {
  const spriteSheet = localSpriteSheetSelectById(
    state,
    action.payload.spriteSheetId,
  );

  if (!spriteSheet) {
    return;
  }

  metaspriteTilesAdapter.addMany(
    state.metaspriteTiles,
    action.payload.metaspriteTiles,
  );

  metaspritesAdapter.addMany(state.metasprites, action.payload.metasprites);

  spriteAnimationsAdapter.addMany(
    state.spriteAnimations,
    action.payload.spriteAnimations,
  );

  spriteStatesAdapter.upsertOne(state.spriteStates, action.payload.state);

  const numStates = spriteSheet.states?.length || 0;

  spriteSheetsAdapter.updateOne(state.spriteSheets, {
    id: action.payload.spriteSheetId,
    changes: {
      ...action.payload.changes,
      states: numStates === 0 ? [action.payload.state.id] : spriteSheet.states,
    },
  });
};

const loadMusic: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: MusicResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.music, musicAdapter, action.payload.data, [
    "id",
    "symbol",
    "settings",
  ]);
  ensureSymbolsUnique(state);
};

const editMusicSettings: CaseReducer<
  EntitiesState,
  PayloadAction<{ musicId: string; changes: Partial<MusicSettings> }>
> = (state, action) => {
  const music = localMusicSelectById(state, action.payload.musicId);
  if (music) {
    musicAdapter.updateOne(state.music, {
      id: music.id,
      changes: {
        settings: {
          ...music.settings,
          ...action.payload.changes,
        },
      },
    });
  }
};

const setMusicSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ musicId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.music,
    musicAdapter,
    action.payload.musicId,
    action.payload.symbol,
  );
};

/**************************************************************************
 * Sounds
 */

const loadSound: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: SoundResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.sounds, soundsAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

const setSoundSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ soundId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.sounds,
    soundsAdapter,
    action.payload.soundId,
    action.payload.symbol,
  );
};

/**************************************************************************
 * Font
 */

const setFontSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ fontId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.fonts,
    fontsAdapter,
    action.payload.fontId,
    action.payload.symbol,
  );
};

const loadFont: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: FontResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.fonts, fontsAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

const removeFont: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin?: string;
  }>
> = (state, action) => {
  removeAssetEntity(state.fonts, fontsAdapter, action.payload);
};

/**************************************************************************
 * Avatar
 */

const loadAvatar: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: AvatarResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.avatars, avatarsAdapter, action.payload.data, ["id"]);
  ensureSymbolsUnique(state);
};

const removeAvatar: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin?: string;
  }>
> = (state, action) => {
  removeAssetEntity(state.avatars, avatarsAdapter, action.payload);
};

/**************************************************************************
 * Emote
 */

const setEmoteSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ emoteId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.emotes,
    emotesAdapter,
    action.payload.emoteId,
    action.payload.symbol,
  );
};

const loadEmote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: EmoteResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.emotes, emotesAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

const removeEmote: CaseReducer<
  EntitiesState,
  PayloadAction<{
    filename: string;
    plugin?: string;
  }>
> = (state, action) => {
  removeAssetEntity(state.emotes, emotesAdapter, action.payload);
};

/**************************************************************************
 * Tileset
 */

const setTilesetSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ tilesetId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.tilesets,
    tilesetsAdapter,
    action.payload.tilesetId,
    action.payload.symbol,
  );
};

const loadTileset: CaseReducer<
  EntitiesState,
  PayloadAction<{
    data: TilesetResourceAsset;
  }>
> = (state, action) => {
  upsertAssetEntity(state.tilesets, tilesetsAdapter, action.payload.data, [
    "id",
    "symbol",
  ]);
  ensureSymbolsUnique(state);
};

/**************************************************************************
 * Fix Scenes
 */

const fixAllScenesWithModifiedBackgrounds = (state: EntitiesState) => {
  const scenes = localSceneSelectAll(state);
  for (const scene of scenes) {
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

const fixAllSpritesWithMissingStates = (state: EntitiesState) => {
  const sprites = localSpriteSheetSelectAll(state);
  for (const sprite of sprites) {
    if (!sprite.states || sprite.states.length === 0) {
      // Create default state for newly added spritesheets
      const metasprites: Metasprite[] = Array.from(Array(8)).map(() => ({
        id: uuid(),
        tiles: [],
      }));
      const animations: SpriteAnimation[] = metasprites.map((metasprite) => ({
        id: uuid(),
        frames: [metasprite.id],
      }));
      const animationIds = animations.map((a) => a.id);
      const spriteState: SpriteState = {
        id: uuid(),
        name: "",
        animationType: "multi_movement",
        flipLeft: true,
        animations: animationIds,
      };
      metaspritesAdapter.addMany(state.metasprites, metasprites);
      spriteAnimationsAdapter.addMany(state.spriteAnimations, animations);
      spriteStatesAdapter.addOne(state.spriteStates, spriteState);
      spriteSheetsAdapter.upsertOne(state.spriteSheets, {
        ...sprite,
        states: [spriteState.id],
      });
    }
  }
};

/**************************************************************************
 * Scenes
 */

const addScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
    defaults?: Partial<SceneNormalized>;
    variables?: Variable[];
  }>
> = (state, action) => {
  const scenesTotal = localSceneSelectTotal(state);
  const backgroundId = String(localBackgroundSelectIds(state)[0]);
  const background = localBackgroundSelectById(state, backgroundId);

  const newScene: SceneNormalized = {
    name: defaultLocalisedSceneName(scenesTotal),
    backgroundId,
    tilesetId: "",
    width: Math.max(MIN_SCENE_WIDTH, background?.width || 0),
    height: Math.max(MIN_SCENE_HEIGHT, background?.height || 0),
    type: "TOPDOWN",
    colorModeOverride: "none",
    paletteIds: [],
    spritePaletteIds: [],
    collisions: [],
    autoFadeSpeed: 1,
    ...(action.payload.defaults || {}),
    id: action.payload.sceneId,
    symbol: genEntitySymbol(state, `scene_${scenesTotal + 1}`),
    x: Math.max(MIN_SCENE_X, action.payload.x),
    y: Math.max(MIN_SCENE_Y, action.payload.y),
    actors: [],
    triggers: [],
    script: [],
    playerHit1Script: [],
    playerHit2Script: [],
    playerHit3Script: [],
  };

  scenesAdapter.addOne(state.scenes, newScene);
};

const moveScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
    additionalSceneIds: string[];
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  const additionalScenes = action.payload.additionalSceneIds.map((id) =>
    localSceneSelectById(state, id),
  );
  if (scene) {
    const minSelectionX = Math.min(
      ...additionalScenes.map((s) => (s ? s.x - scene.x : 0)),
    );
    const minSelectionY = Math.min(
      ...additionalScenes.map((s) => (s ? s.y - scene.y : 0)),
    );

    // Based on full selection determine minX and minY for current scene
    const newX = Math.max(MIN_SCENE_X - minSelectionX, action.payload.x);
    const newY = Math.max(MIN_SCENE_Y - minSelectionY, action.payload.y);
    const diffX = newX - scene.x;
    const diffY = newY - scene.y;

    // Move scene
    scene.x = newX;
    scene.y = newY;

    // Move additionally selected scenes by same amount
    for (const additionalSceneId of action.payload.additionalSceneIds) {
      if (additionalSceneId !== action.payload.sceneId) {
        const additionalScene = localSceneSelectById(state, additionalSceneId);
        if (additionalScene) {
          const newX = Math.max(MIN_SCENE_X, additionalScene.x + diffX);
          const newY = Math.max(MIN_SCENE_Y, additionalScene.y + diffY);
          additionalScene.x = newX;
          additionalScene.y = newY;
        }
      }
    }
  }
};

const editScene: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; changes: Partial<SceneNormalized> }>
> = (state, action) => {
  const scene = state.scenes.entities[action.payload.sceneId];
  const patch = { ...action.payload.changes };

  if (!scene) {
    return;
  }

  if (patch.backgroundId) {
    const otherScene = localSceneSelectAll(state).find((s) => {
      return s.backgroundId === patch.backgroundId;
    });

    const actors = localActorSelectEntities(state);
    const triggers = localTriggerSelectEntities(state);

    const oldBackground =
      scene && state.backgrounds.entities[scene.backgroundId];
    const background = state.backgrounds.entities[patch.backgroundId];

    if (background) {
      if (otherScene) {
        patch.collisions = otherScene.collisions;
      } else if (
        oldBackground &&
        background &&
        oldBackground.width === background.width
      ) {
        const collisionsSize = Math.ceil(background.width * background.height);
        patch.collisions = scene.collisions.slice(0, collisionsSize);
      } else if (background) {
        const collisionsSize = Math.ceil(background.width * background.height);
        patch.collisions = [];
        for (let i = 0; i < collisionsSize; i++) {
          patch.collisions[i] = 0;
        }
      }

      patch.width = background.width;
      patch.height = background.height;

      scene.actors.forEach((actorId) => {
        const actor = actors[actorId];
        if (actor) {
          const x = Math.min(actor.x, background.width - 2);
          const y = Math.min(actor.y, background.height - 1);
          if (actor.x !== x || actor.y !== y) {
            actorsAdapter.updateOne(state.actors, {
              id: actor.id,
              changes: { x, y },
            });
          }
        }
      });

      scene.triggers.forEach((triggerId) => {
        const trigger = triggers[triggerId];
        if (trigger) {
          const x = Math.min(trigger.x, background.width - 1);
          const y = Math.min(trigger.y, background.height - 1);
          const width = Math.min(trigger.width, background.width - x);
          const height = Math.min(trigger.height, background.height - y);
          if (
            trigger.x !== x ||
            trigger.y !== y ||
            trigger.width !== width ||
            trigger.height !== height
          ) {
            triggersAdapter.updateOne(state.triggers, {
              id: trigger.id,
              changes: { x, y, width, height },
            });
          }
        }
      });
    }
  }

  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: patch,
  });
};

const editScenes: CaseReducer<
  EntitiesState,
  PayloadAction<Array<{ id: string; changes: Partial<SceneNormalized> }>>
> = (state, action) => {
  scenesAdapter.updateMany(state.scenes, action.payload);
};

const setSceneSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ sceneId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.scenes,
    scenesAdapter,
    action.payload.sceneId,
    action.payload.symbol,
  );
};

const removeScene: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
  }>
> = (state, action) => {
  scenesAdapter.removeOne(state.scenes, action.payload.sceneId);
};

const removeScenes: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneIds: string[];
  }>
> = (state, action) => {
  scenesAdapter.removeMany(state.scenes, action.payload.sceneIds);
};

/**************************************************************************
 * Actors
 */

const addActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
    x: number;
    y: number;
    defaults?: Partial<ActorNormalized>;
    variables?: Variable[];
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  const spriteSheetId = first(localSpriteSheetSelectAll(state))?.id;
  if (!spriteSheetId) {
    return;
  }

  // Add any variables from clipboard
  if (action.payload.defaults?.id && action.payload.variables) {
    const newVariables = action.payload.variables.map((variable) => {
      return {
        ...variable,
        id: variable.id.replace(
          action.payload.defaults?.id || "",
          action.payload.actorId,
        ),
      };
    });
    variablesAdapter.upsertMany(state.variables, newVariables);
  }

  // Set default name based on prefab if provided
  let name = "";
  if (action.payload.defaults?.prefabId) {
    const prefab = localActorPrefabSelectById(
      state,
      action.payload.defaults.prefabId,
    );
    if (prefab && prefab.name.length > 0) {
      name = prefab.name;
    }
  }

  const newActor: ActorNormalized = {
    name,
    frame: 0,
    animate: false,
    spriteSheetId,
    prefabId: "",
    direction: "down",
    moveSpeed: 1,
    animSpeed: 15,
    paletteId: "",
    isPinned: false,
    persistent: false,
    collisionGroup: "",
    collisionExtraFlags: [],
    prefabScriptOverrides: {},
    ...(action.payload.defaults || {}),
    symbol: genEntitySymbol(state, "actor_0"),
    script: [],
    startScript: [],
    updateScript: [],
    hit1Script: [],
    hit2Script: [],
    hit3Script: [],
    id: action.payload.actorId,
    x: clamp(action.payload.x, 0, scene.width - 2),
    y: clamp(action.payload.y, 0, scene.height - 1),
  };

  // Add to scene
  scene.actors = ([] as string[]).concat(scene.actors, newActor.id);
  actorsAdapter.addOne(state.actors, newActor);
};

const editActor: CaseReducer<
  EntitiesState,
  PayloadAction<{ actorId: string; changes: Partial<ActorNormalized> }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  const patch = { ...action.payload.changes };

  if (!actor) {
    return;
  }

  // If prefab changes reset overrides
  if (patch.prefabId && actor.prefabId !== patch.prefabId) {
    patch.prefabScriptOverrides = {};
  }

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: patch,
  });
};

const setActorSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ actorId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.actors,
    actorsAdapter,
    action.payload.actorId,
    action.payload.symbol,
  );
};

const moveActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
    newSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const newScene = localSceneSelectById(state, action.payload.newSceneId);
  if (!newScene) {
    return;
  }

  if (action.payload.sceneId !== action.payload.newSceneId) {
    const prevScene = localSceneSelectById(state, action.payload.sceneId);
    if (!prevScene) {
      return;
    }

    // Remove from previous scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        actors: prevScene.actors.filter((actorId) => {
          return actorId !== action.payload.actorId;
        }),
      },
    });

    // Add to new scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.newSceneId,
      changes: {
        actors: ([] as string[]).concat(
          newScene.actors,
          action.payload.actorId,
        ),
      },
    });
  }

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      x: clamp(action.payload.x, 0, newScene.width - 2),
      y: clamp(action.payload.y, 0, newScene.height - 1),
    },
  });
};

const unpackActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    force?: boolean;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }
  const prefab = localActorPrefabSelectById(state, actor.prefabId);
  if (!prefab) {
    return;
  }

  const overrides = actor.prefabScriptOverrides;

  const patch = {
    ...omit(
      prefab,
      "id",
      "name",
      "notes",
      "script",
      "startScript",
      "updateScript",
      "hit1Script",
      "hit2Script",
      "hit3Script",
    ),
    prefabId: "",
    script: duplicateScript(state, prefab.script, overrides),
    startScript: duplicateScript(state, prefab.startScript, overrides),
    updateScript: duplicateScript(state, prefab.updateScript, overrides),
    hit1Script: duplicateScript(state, prefab.hit1Script, overrides),
    hit2Script: duplicateScript(state, prefab.hit2Script, overrides),
    hit3Script: duplicateScript(state, prefab.hit3Script, overrides),
  };

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: patch,
  });

  // Duplicate prefab local variables
  for (const code of localVariableCodes) {
    const prefabLocalId = `${prefab.id}__${code}`;
    const actorLocalId = `${actor.id}__${code}`;
    const localVariable = localVariableSelectById(state, prefabLocalId);
    if (localVariable) {
      // Duplicate prefab's local into actor
      variablesAdapter.upsertOne(state.variables, {
        ...localVariable,
        id: actorLocalId,
      });
    } else {
      // Prefab didn't contain this local, remove it
      variablesAdapter.removeOne(state.variables, actorLocalId);
    }
  }
};

const convertActorToPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }
  const prefab = localActorPrefabSelectById(state, actor.prefabId);
  // Don't allow converting actor which is already a prefab into a prefab
  if (prefab) {
    return;
  }

  const newActorPrefab: ActorPrefabNormalized = {
    ...omit(
      actor,
      "id",
      "symbol",
      "prefabId",
      "notes",
      "x",
      "y",
      "direction",
      "isPinned",
      "script",
      "startScript",
      "updateScript",
      "hit1Script",
      "hit2Script",
      "hit3Script",
    ),
    script: duplicateScript(state, actor.script),
    startScript: duplicateScript(state, actor.startScript),
    updateScript: duplicateScript(state, actor.updateScript),
    hit1Script: duplicateScript(state, actor.hit1Script),
    hit2Script: duplicateScript(state, actor.hit2Script),
    hit3Script: duplicateScript(state, actor.hit3Script),
    id: uuid(),
  };

  actorPrefabsAdapter.addOne(state.actorPrefabs, newActorPrefab);

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabId: newActorPrefab.id,
    },
  });

  // Duplicate local variables
  for (const code of localVariableCodes) {
    const actorLocalId = `${actor.id}__${code}`;
    const prefabLocalId = `${newActorPrefab.id}__${code}`;
    const localVariable = localVariableSelectById(state, actorLocalId);
    if (localVariable) {
      // Duplicate prefab's local into actor
      variablesAdapter.upsertOne(state.variables, {
        ...localVariable,
        id: prefabLocalId,
      });
    } else {
      // Prefab didn't contain this local, remove it
      variablesAdapter.removeOne(state.variables, prefabLocalId);
    }
  }
};

const editActorPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    scriptEventId: string;
    args: Record<string, unknown>;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  const scriptEvent = localScriptEventSelectById(
    state,
    action.payload.scriptEventId,
  );
  if (!actor || !scriptEvent) {
    return;
  }
  const prefabScriptOverrides = actor.prefabScriptOverrides ?? {};
  const override = prefabScriptOverrides[scriptEvent.id] ?? {
    id: scriptEvent.id,
    args: {},
  };
  const argKeys = Object.keys(action.payload.args);
  for (const key of argKeys) {
    override.args[key] = action.payload.args[key];
  }
  prefabScriptOverrides[scriptEvent.id] = override;

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const revertActorPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
  }>
> = (state, action) => {
  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const revertActorPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }
  const prefabScriptOverrides = actor.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const applyActorPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }

  // Update script events using override data
  const overrides = Object.values(actor.prefabScriptOverrides);
  for (const override of overrides) {
    const scriptEvent = localScriptEventSelectById(state, override.id);
    if (scriptEvent) {
      scriptEventsAdapter.updateOne(state.scriptEvents, {
        id: override.id,
        changes: {
          args: {
            ...scriptEvent.args,
            ...override.args,
          },
        },
      });
    }
  }

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const applyActorPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const actor = localActorSelectById(state, action.payload.actorId);
  if (!actor) {
    return;
  }

  // Update script events using override data
  const override = actor.prefabScriptOverrides[action.payload.scriptEventId];
  const scriptEvent = localScriptEventSelectById(state, override.id);
  if (scriptEvent) {
    scriptEventsAdapter.updateOne(state.scriptEvents, {
      id: override.id,
      changes: {
        args: {
          ...scriptEvent.args,
          ...override.args,
        },
      },
    });
  }

  const prefabScriptOverrides = actor.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  actorsAdapter.updateOne(state.actors, {
    id: action.payload.actorId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const removeActor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorId: string;
    sceneId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  // Remove from scene
  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      actors: scene.actors.filter((actorId) => {
        return actorId !== action.payload.actorId;
      }),
    },
  });

  actorsAdapter.removeOne(state.actors, action.payload.actorId);
};

const removeActorAt: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  const removeActorId = scene.actors.find((actorId) => {
    const actor = localActorSelectById(state, actorId);
    return (
      actor &&
      (actor.x === action.payload.x || actor.x === action.payload.x - 1) &&
      (actor.y === action.payload.y || actor.y === action.payload.y + 1)
    );
  });

  if (removeActorId) {
    // Remove from scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        actors: scene.actors.filter((actorId) => {
          return actorId !== removeActorId;
        }),
      },
    });
    // Remove actor
    actorsAdapter.removeOne(state.actors, removeActorId);
  }
};

/**************************************************************************
 * Triggers
 */

const addTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    defaults?: Partial<TriggerNormalized>;
    // variables?: Variable[];
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const width = Math.min(action.payload.width, scene.width);
  const height = Math.min(action.payload.height, scene.height);

  // Set default name based on prefab if provided
  let name = "";
  if (action.payload.defaults?.prefabId) {
    const prefab = localTriggerPrefabSelectById(
      state,
      action.payload.defaults.prefabId,
    );
    if (prefab && prefab.name.length > 0) {
      name = prefab.name;
    }
  }

  const newTrigger: TriggerNormalized = {
    name,
    prefabId: "",
    ...(action.payload.defaults || {}),
    id: action.payload.triggerId,
    x: clamp(action.payload.x, 0, scene.width - width),
    y: clamp(action.payload.y, 0, scene.height - height),
    symbol: genEntitySymbol(state, "trigger_0"),
    prefabScriptOverrides: {},
    width,
    height,
    script: [],
    leaveScript: [],
  };

  // Add to scene
  scene.triggers = ([] as string[]).concat(scene.triggers, newTrigger.id);
  triggersAdapter.addOne(state.triggers, newTrigger);
};

const editTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{ triggerId: string; changes: Partial<TriggerNormalized> }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);

  if (!trigger) {
    return;
  }
  const patch = { ...action.payload.changes };

  // If prefab changes reset overrides
  if (patch.prefabId && trigger.prefabId !== patch.prefabId) {
    patch.prefabScriptOverrides = {};
  }

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: patch,
  });
};

const setTriggerSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ triggerId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.triggers,
    triggersAdapter,
    action.payload.triggerId,
    action.payload.symbol,
  );
};

const moveTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
    newSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }

  const newScene = localSceneSelectById(state, action.payload.newSceneId);
  if (!newScene) {
    return;
  }

  if (action.payload.sceneId !== action.payload.newSceneId) {
    const prevScene = localSceneSelectById(state, action.payload.sceneId);
    if (!prevScene) {
      return;
    }

    // Remove from previous scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        triggers: prevScene.triggers.filter((triggerId) => {
          return triggerId !== action.payload.triggerId;
        }),
      },
    });

    // Add to new scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.newSceneId,
      changes: {
        triggers: ([] as string[]).concat(
          newScene.triggers,
          action.payload.triggerId,
        ),
      },
    });
  }

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      x: clamp(action.payload.x, 0, newScene.width - trigger.width),
      y: clamp(action.payload.y, 0, newScene.height - trigger.height),
    },
  });
};

const unpackTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    force?: boolean;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }
  const prefab = localTriggerPrefabSelectById(state, trigger.prefabId);
  if (!prefab) {
    return;
  }

  const overrides = trigger.prefabScriptOverrides;

  const patch = {
    ...omit(prefab, "id", "name", "notes", "script", "leaveScript"),
    prefabId: "",
    script: duplicateScript(state, prefab.script, overrides),
    leaveScript: duplicateScript(state, prefab.leaveScript, overrides),
  };

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: patch,
  });

  // Duplicate prefab local variables
  for (const code of localVariableCodes) {
    const prefabLocalId = `${prefab.id}__${code}`;
    const triggerLocalId = `${trigger.id}__${code}`;
    const localVariable = localVariableSelectById(state, prefabLocalId);
    if (localVariable) {
      // Duplicate prefab's local into trigger
      variablesAdapter.upsertOne(state.variables, {
        ...localVariable,
        id: triggerLocalId,
      });
    } else {
      // Prefab didn't contain this local, remove it
      variablesAdapter.removeOne(state.variables, triggerLocalId);
    }
  }
};

const convertTriggerToPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }
  const prefab = localTriggerPrefabSelectById(state, trigger.prefabId);
  // Don't allow converting trigger which is already a prefab into a prefab
  if (prefab) {
    return;
  }

  const newTriggerPrefab: TriggerPrefabNormalized = {
    ...omit(
      trigger,
      "id",
      "symbol",
      "prefabId",
      "notes",
      "x",
      "y",
      "width",
      "height",
      "script",
      "leaveScript",
    ),
    script: duplicateScript(state, trigger.script),
    leaveScript: duplicateScript(state, trigger.leaveScript),
    id: uuid(),
  };

  triggerPrefabsAdapter.addOne(state.triggerPrefabs, newTriggerPrefab);

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabId: newTriggerPrefab.id,
    },
  });

  // Duplicate local variables
  for (const code of localVariableCodes) {
    const triggerLocalId = `${trigger.id}__${code}`;
    const prefabLocalId = `${newTriggerPrefab.id}__${code}`;
    const localVariable = localVariableSelectById(state, triggerLocalId);
    if (localVariable) {
      // Duplicate prefab's local into trigger
      variablesAdapter.upsertOne(state.variables, {
        ...localVariable,
        id: prefabLocalId,
      });
    } else {
      // Prefab didn't contain this local, remove it
      variablesAdapter.removeOne(state.variables, prefabLocalId);
    }
  }
};

const resizeTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
  }>
> = (state, action) => {
  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      x: Math.min(action.payload.x, action.payload.startX),
      y: Math.min(action.payload.y, action.payload.startY),
      width: Math.abs(action.payload.x - action.payload.startX) + 1,
      height: Math.abs(action.payload.y - action.payload.startY) + 1,
    },
  });
};

const editTriggerPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    scriptEventId: string;
    args: Record<string, unknown>;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  const scriptEvent = localScriptEventSelectById(
    state,
    action.payload.scriptEventId,
  );
  if (!trigger || !scriptEvent) {
    return;
  }
  const prefabScriptOverrides = trigger.prefabScriptOverrides ?? {};
  const override = prefabScriptOverrides[scriptEvent.id] ?? {
    id: scriptEvent.id,
    args: {},
  };
  const argKeys = Object.keys(action.payload.args);
  for (const key of argKeys) {
    override.args[key] = action.payload.args[key];
  }
  prefabScriptOverrides[scriptEvent.id] = override;

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const revertTriggerPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
  }>
> = (state, action) => {
  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const revertTriggerPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }
  const prefabScriptOverrides = trigger.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const applyTriggerPrefabScriptEventOverrides: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }

  // Update script events using override data
  const overrides = Object.values(trigger.prefabScriptOverrides);
  for (const override of overrides) {
    const scriptEvent = localScriptEventSelectById(state, override.id);
    if (scriptEvent) {
      scriptEventsAdapter.updateOne(state.scriptEvents, {
        id: override.id,
        changes: {
          args: {
            ...scriptEvent.args,
            ...override.args,
          },
        },
      });
    }
  }

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides: {},
    },
  });
};

const applyTriggerPrefabScriptEventOverride: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    scriptEventId: string;
  }>
> = (state, action) => {
  const trigger = localTriggerSelectById(state, action.payload.triggerId);
  if (!trigger) {
    return;
  }

  // Update script events using override data
  const override = trigger.prefabScriptOverrides[action.payload.scriptEventId];
  const scriptEvent = localScriptEventSelectById(state, override.id);
  if (scriptEvent) {
    scriptEventsAdapter.updateOne(state.scriptEvents, {
      id: override.id,
      changes: {
        args: {
          ...scriptEvent.args,
          ...override.args,
        },
      },
    });
  }

  const prefabScriptOverrides = trigger.prefabScriptOverrides ?? {};
  delete prefabScriptOverrides[action.payload.scriptEventId];

  triggersAdapter.updateOne(state.triggers, {
    id: action.payload.triggerId,
    changes: {
      prefabScriptOverrides,
    },
  });
};

const removeTrigger: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerId: string;
    sceneId: string;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }

  // Remove from scene
  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      triggers: scene.triggers.filter((triggerId) => {
        return triggerId !== action.payload.triggerId;
      }),
    },
  });

  triggersAdapter.removeOne(state.triggers, action.payload.triggerId);
};

const removeTriggerAt: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const removeTriggerId = scene.triggers.find((triggerId) => {
    const trigger = localTriggerSelectById(state, triggerId);
    return (
      trigger &&
      action.payload.x >= trigger.x &&
      action.payload.x < trigger.x + trigger.width &&
      action.payload.y >= trigger.y &&
      action.payload.y < trigger.y + trigger.height
    );
  });

  if (removeTriggerId) {
    // Remove from scene
    scenesAdapter.updateOne(state.scenes, {
      id: action.payload.sceneId,
      changes: {
        triggers: scene.triggers.filter((triggerId) => {
          return triggerId !== removeTriggerId;
        }),
      },
    });

    triggersAdapter.removeOne(state.triggers, removeTriggerId);
  }
};

/**************************************************************************
 * Actor Prefabs
 */

const addActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorPrefabId: string;
    defaults?: Partial<ActorPrefabNormalized>;
  }>
> = (state, action) => {
  const spriteSheetId = first(localSpriteSheetSelectAll(state))?.id;
  if (!spriteSheetId) {
    return;
  }

  const newActorPrefab: ActorPrefabNormalized = {
    name: "",
    frame: 0,
    animate: false,
    spriteSheetId,
    moveSpeed: 1,
    animSpeed: 15,
    paletteId: "",
    persistent: false,
    collisionGroup: "",
    collisionExtraFlags: [],
    ...(action.payload.defaults || {}),
    script: [],
    startScript: [],
    updateScript: [],
    hit1Script: [],
    hit2Script: [],
    hit3Script: [],
    id: action.payload.actorPrefabId,
  };

  actorPrefabsAdapter.addOne(state.actorPrefabs, newActorPrefab);
};

const editActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorPrefabId: string;
    changes: Partial<ActorPrefabNormalized>;
  }>
> = (state, action) => {
  const actorPrefab = localActorPrefabSelectById(
    state,
    action.payload.actorPrefabId,
  );
  const patch = { ...action.payload.changes };

  if (!actorPrefab) {
    return;
  }

  actorPrefabsAdapter.updateOne(state.actorPrefabs, {
    id: action.payload.actorPrefabId,
    changes: patch,
  });
};

const removeActorPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    actorPrefabId: string;
  }>
> = (state, action) => {
  actorPrefabsAdapter.removeOne(
    state.actorPrefabs,
    action.payload.actorPrefabId,
  );
};

/**************************************************************************
 * Trigger Prefabs
 */

const addTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerPrefabId: string;
    defaults?: Partial<TriggerPrefabNormalized>;
  }>
> = (state, action) => {
  const spriteSheetId = first(localSpriteSheetSelectAll(state))?.id;
  if (!spriteSheetId) {
    return;
  }

  const newTriggerPrefab: TriggerPrefabNormalized = {
    name: "",
    ...(action.payload.defaults || {}),
    script: [],
    leaveScript: [],
    id: action.payload.triggerPrefabId,
  };

  triggerPrefabsAdapter.addOne(state.triggerPrefabs, newTriggerPrefab);
};

const editTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerPrefabId: string;
    changes: Partial<TriggerPrefabNormalized>;
  }>
> = (state, action) => {
  const triggerPrefab = localTriggerPrefabSelectById(
    state,
    action.payload.triggerPrefabId,
  );
  const patch = { ...action.payload.changes };

  if (!triggerPrefab) {
    return;
  }

  triggerPrefabsAdapter.updateOne(state.triggerPrefabs, {
    id: action.payload.triggerPrefabId,
    changes: patch,
  });
};

const removeTriggerPrefab: CaseReducer<
  EntitiesState,
  PayloadAction<{
    triggerPrefabId: string;
  }>
> = (state, action) => {
  triggerPrefabsAdapter.removeOne(
    state.triggerPrefabs,
    action.payload.triggerPrefabId,
  );
};

/**************************************************************************
 * Backgrounds
 */

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

const updateMonoOverrideIds = (state: EntitiesState) => {
  const backgrounds = localBackgroundSelectAll(state);
  const getKey = (b: Background) => `${b.plugin ?? ""}_${b.filename}`;
  const getMonoKey = (b: Background) =>
    `${b.plugin ?? ""}_${monoOverrideForFilename(b.filename)}`;
  const monoOverrideLookup = keyBy(backgrounds, getKey);
  backgrounds.forEach((b) => {
    const monoKey = getMonoKey(b);
    b.monoOverrideId = monoOverrideLookup[monoKey]?.id;
  });
};

/**************************************************************************
 * Sprite Sheets
 */

const editSpriteSheet: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    changes: Partial<SpriteSheetNormalized>;
  }>
> = (state, action) => {
  const spriteSheet = state.spriteSheets.entities[action.payload.spriteSheetId];
  const patch = { ...action.payload.changes };

  if (!spriteSheet) {
    return;
  }

  spriteSheetsAdapter.updateOne(state.spriteSheets, {
    id: action.payload.spriteSheetId,
    changes: patch,
  });
};

const setSpriteSheetSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteSheetId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.spriteSheets,
    spriteSheetsAdapter,
    action.payload.spriteSheetId,
    action.payload.symbol,
  );
};

/**************************************************************************
 * Metasprites
 */

const addMetasprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    spriteAnimationId: string;
    afterMetaspriteId: string;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newMetasprite: Metasprite = {
    id: action.payload.metaspriteId,
    tiles: [],
  };

  spriteAnimation.frames = insertAfterElement(
    spriteAnimation.frames,
    newMetasprite.id,
    action.payload.afterMetaspriteId,
  );

  metaspritesAdapter.addOne(state.metasprites, newMetasprite);
};

const cloneMetasprites: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteAnimationId: string;
    metaspriteIds: string[];
    newMetaspriteIds: string[];
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const sortedMetaspriteIds = sortSubsetStringArray(
    action.payload.metaspriteIds,
    spriteAnimation.frames,
  );

  if (sortedMetaspriteIds.length > action.payload.newMetaspriteIds.length) {
    return;
  }

  for (let i = 0; i < sortedMetaspriteIds.length; i++) {
    const fromMetaspriteId = sortedMetaspriteIds[i];
    const toMetaspriteId = action.payload.newMetaspriteIds[i];

    const metasprite = state.metasprites.entities[fromMetaspriteId];

    if (!spriteAnimation || !metasprite) {
      continue;
    }

    const metaspriteTiles = metasprite.tiles
      .map((id) => state.metaspriteTiles.entities[id])
      .filter((i) => i) as MetaspriteTile[];

    const newMetaspriteTiles = metaspriteTiles.map((tile) => ({
      ...tile,
      id: uuid(),
    }));

    const newMetasprite = {
      ...metasprite,
      id: toMetaspriteId,
      tiles: newMetaspriteTiles.map((tile) => tile.id),
    };

    const insertAfterId =
      i === 0
        ? sortedMetaspriteIds[sortedMetaspriteIds.length - 1]
        : action.payload.newMetaspriteIds[i - 1];

    spriteAnimation.frames = insertAfterElement(
      spriteAnimation.frames,
      newMetasprite.id,
      insertAfterId,
    );

    metaspritesAdapter.addOne(state.metasprites, newMetasprite);
    metaspriteTilesAdapter.addMany(state.metaspriteTiles, newMetaspriteTiles);
  }
};

const removeMetasprite: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    spriteAnimationId: string;
    spriteSheetId: string;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation || spriteAnimation.frames.length <= 1) {
    // Remove tiles if only frame in animation
    metaspritesAdapter.updateOne(state.metasprites, {
      id: action.payload.metaspriteId,
      changes: {
        tiles: [],
      },
    });
    return;
  }

  spriteAnimation.frames = spriteAnimation.frames.filter(
    (frameId) => frameId !== action.payload.metaspriteId,
  );

  metaspritesAdapter.removeOne(state.metasprites, action.payload.metaspriteId);
};

const removeMetasprites: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    metaspriteIds: string[];
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newFrames = spriteAnimation.frames.filter(
    (frameId) => !action.payload.metaspriteIds.includes(frameId),
  );

  if (newFrames.length > 0) {
    spriteAnimation.frames = newFrames;
    metaspritesAdapter.removeMany(
      state.metasprites,
      action.payload.metaspriteIds,
    );
  } else if (newFrames.length === 0 && spriteAnimation.frames[0]) {
    // if frames list would be empty keep first frame but clear tiles
    const keepId = spriteAnimation.frames[0];
    spriteAnimation.frames = [keepId];
    metaspritesAdapter.updateOne(state.metasprites, {
      id: keepId,
      changes: {
        tiles: [],
      },
    });
    metaspritesAdapter.removeMany(
      state.metasprites,
      action.payload.metaspriteIds.filter((id) => id !== keepId),
    );
  }
};

/**************************************************************************
 * Metasprite Tiles
 */

const addMetaspriteTile: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteTileId: string;
    metaspriteId: string;
    x: number;
    y: number;
    sliceX: number;
    sliceY: number;
    flipX: boolean;
    flipY: boolean;
    objPalette: ObjPalette;
    paletteIndex: number;
    priority: boolean;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  const newMetaspriteTile: MetaspriteTile = {
    id: action.payload.metaspriteTileId,
    x: action.payload.x,
    y: action.payload.y,
    sliceX: action.payload.sliceX,
    sliceY: action.payload.sliceY,
    palette: 0,
    flipX: action.payload.flipX,
    flipY: action.payload.flipY,
    objPalette: action.payload.objPalette,
    paletteIndex: action.payload.paletteIndex,
    priority: action.payload.priority,
  };

  // Add to metasprite
  metasprite.tiles = ([] as string[]).concat(
    metasprite.tiles,
    newMetaspriteTile.id,
  );
  metaspriteTilesAdapter.addOne(state.metaspriteTiles, newMetaspriteTile);
};

const moveMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTiles: {
      metaspriteTileId: string;
      x: number;
      y: number;
    }[];
  }>
> = (state, action) => {
  action.payload.metaspriteTiles.forEach(({ metaspriteTileId, x, y }) => {
    const tile = state.metaspriteTiles.entities[metaspriteTileId];
    if (tile) {
      tile.x = x;
      tile.y = y;
    }
  });
};

const moveMetaspriteTilesRelative: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileIds: string[];
    x: number;
    y: number;
  }>
> = (state, action) => {
  const metaspriteTiles = action.payload.metaspriteTileIds
    .map((id) => state.metaspriteTiles.entities[id])
    .filter((i) => i);

  metaspriteTiles.forEach((tile) => {
    if (tile) {
      tile.x += action.payload.x;
      tile.y += action.payload.y;
    }
  });
};

const flipXMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteSheetId: string; metaspriteTileIds: string[] }>
> = (state, action) => {
  const metaspriteTiles = action.payload.metaspriteTileIds
    .map((id) => state.metaspriteTiles.entities[id])
    .filter((i) => i);

  const leftEdge = metaspriteTiles.reduce((memo, tile) => {
    if (tile && tile.x < memo) {
      return tile.x;
    }
    return memo;
  }, Infinity);

  const rightEdge =
    metaspriteTiles.reduce((memo, tile) => {
      if (tile && tile.x > memo) {
        return tile.x;
      }
      return memo;
    }, -Infinity) + 8;

  const mirrorX = leftEdge + (rightEdge - leftEdge) / 2;

  metaspriteTiles.forEach((tile) => {
    if (tile) {
      tile.flipX = !tile.flipX;
      const middleX = tile.x + 4;
      const flippedMiddleX = mirrorX + (mirrorX - middleX);
      tile.x = flippedMiddleX - 4;
    }
  });
};

const flipYMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteSheetId: string; metaspriteTileIds: string[] }>
> = (state, action) => {
  const metaspriteTiles = action.payload.metaspriteTileIds
    .map((id) => state.metaspriteTiles.entities[id])
    .filter((i) => i);

  const bottomEdge = metaspriteTiles.reduce((memo, tile) => {
    if (tile && tile.y < memo) {
      return tile.y;
    }
    return memo;
  }, Infinity);

  const topEdge =
    metaspriteTiles.reduce((memo, tile) => {
      if (tile && tile.y > memo) {
        return tile.y;
      }
      return memo;
    }, -Infinity) + 16;

  const mirrorY = bottomEdge + (topEdge - bottomEdge) / 2;

  metaspriteTiles.forEach((tile) => {
    if (tile) {
      tile.flipY = !tile.flipY;
      const middleY = tile.y + 8;
      const flippedMiddleY = mirrorY + (mirrorY - middleY);
      tile.y = flippedMiddleY - 8;
    }
  });
};

const editMetaspriteTile: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileId: string;
    changes: Partial<MetaspriteTile>;
  }>
> = (state, action) => {
  const metaspriteTile =
    state.metaspriteTiles.entities[action.payload.metaspriteTileId];
  const patch = { ...action.payload.changes };

  if (!metaspriteTile) {
    return;
  }

  metaspriteTilesAdapter.updateOne(state.metaspriteTiles, {
    id: action.payload.metaspriteTileId,
    changes: patch,
  });
};

const editMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileIds: string[];
    changes: Partial<MetaspriteTile>;
  }>
> = (state, action) => {
  metaspriteTilesAdapter.updateMany(
    state.metaspriteTiles,
    action.payload.metaspriteTileIds.map((id) => ({
      id,
      changes: action.payload.changes,
    })),
  );
};

const sendMetaspriteTilesToFront: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    metaspriteTileIds: string[];
    spriteSheetId: string;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  const newTiles = ([] as string[]).concat(
    metasprite.tiles.filter(
      (tileId) => !action.payload.metaspriteTileIds.includes(tileId),
    ),
    action.payload.metaspriteTileIds,
  );

  metaspritesAdapter.updateOne(state.metasprites, {
    id: action.payload.metaspriteId,
    changes: {
      tiles: newTiles,
    },
  });
};

const sendMetaspriteTilesToBack: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    metaspriteTileIds: string[];
    spriteSheetId: string;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  const newTiles = ([] as string[]).concat(
    action.payload.metaspriteTileIds,
    metasprite.tiles.filter(
      (tileId) => !action.payload.metaspriteTileIds.includes(tileId),
    ),
  );

  metaspritesAdapter.updateOne(state.metasprites, {
    id: action.payload.metaspriteId,
    changes: {
      tiles: newTiles,
    },
  });
};

const removeMetaspriteTiles: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    metaspriteTileIds: string[];
    metaspriteId: string;
  }>
> = (state, action) => {
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!metasprite) {
    return;
  }

  metasprite.tiles = metasprite.tiles.filter(
    (tileId) => !action.payload.metaspriteTileIds.includes(tileId),
  );

  metaspriteTilesAdapter.removeMany(
    state.metaspriteTiles,
    action.payload.metaspriteTileIds,
  );
};

const removeMetaspriteTilesOutsideCanvas: CaseReducer<
  EntitiesState,
  PayloadAction<{
    metaspriteId: string;
    spriteSheetId: string;
  }>
> = (state, action) => {
  const spriteSheet = state.spriteSheets.entities[action.payload.spriteSheetId];
  const metasprite = state.metasprites.entities[action.payload.metaspriteId];

  if (!spriteSheet || !metasprite) {
    return;
  }

  const minX = -spriteSheet.canvasWidth / 2;
  const maxX = spriteSheet.canvasWidth / 2 + 8;
  const minY = -16;
  const maxY = spriteSheet.canvasHeight;

  const removeMetaspriteTiles = (
    metasprite.tiles
      .map((id) => state.metaspriteTiles.entities[id])
      .filter((i) => !!i) as MetaspriteTile[]
  )
    .filter(
      (tile) =>
        tile.x <= minX || tile.x >= maxX || tile.y <= minY || tile.y >= maxY,
    )
    .map((tile) => tile.id);

  metasprite.tiles = metasprite.tiles.filter(
    (tileId) => !removeMetaspriteTiles.includes(tileId),
  );

  metaspriteTilesAdapter.removeMany(
    state.metaspriteTiles,
    removeMetaspriteTiles,
  );
};

/**************************************************************************
 * Sprite Animations
 */

const editSpriteAnimation: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    changes: Partial<SpriteAnimation>;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];
  const patch = { ...action.payload.changes };

  if (!spriteAnimation) {
    return;
  }

  spriteAnimationsAdapter.updateOne(state.spriteAnimations, {
    id: action.payload.spriteAnimationId,
    changes: patch,
  });
};

const moveSpriteAnimationFrame: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    fromIndex: number;
    toIndex: number;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newFrames = moveArrayElement(
    action.payload.fromIndex,
    action.payload.toIndex,
    spriteAnimation.frames,
  );

  spriteAnimationsAdapter.updateOne(state.spriteAnimations, {
    id: action.payload.spriteAnimationId,
    changes: {
      frames: newFrames,
    },
  });
};

const moveSpriteAnimationFrames: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteAnimationId: string;
    fromIndexes: number[];
    toIndex: number;
  }>
> = (state, action) => {
  const spriteAnimation =
    state.spriteAnimations.entities[action.payload.spriteAnimationId];

  if (!spriteAnimation) {
    return;
  }

  const newFrames = moveArrayElements(
    action.payload.fromIndexes,
    action.payload.toIndex,
    spriteAnimation.frames,
  );

  spriteAnimationsAdapter.updateOne(state.spriteAnimations, {
    id: action.payload.spriteAnimationId,
    changes: {
      frames: newFrames,
    },
  });
};

/**************************************************************************
 * Sprite State
 */

const addSpriteState: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteStateId: string;
  }>
> = (state, action) => {
  const sprite = state.spriteSheets.entities[action.payload.spriteSheetId];

  if (!sprite) {
    return;
  }

  const eightElements = Array.from(Array(8));

  const newMetasprites: Metasprite[] = eightElements.map(() => ({
    id: uuid(),
    tiles: [],
  }));

  metaspritesAdapter.addMany(state.metasprites, newMetasprites);

  const newAnimations: SpriteAnimation[] = eightElements.map((_, index) => ({
    id: uuid(),
    frames: [newMetasprites[index].id],
  }));

  spriteAnimationsAdapter.addMany(state.spriteAnimations, newAnimations);

  const newSpriteState: SpriteState = {
    id: action.payload.spriteStateId,
    name: sprite.states.length > 0 ? l10n("FIELD_STATE_NEW_STATE_NAME") : "",
    animations: newAnimations.map((anim) => anim.id),
    animationType: "fixed",
    flipLeft: true,
  };

  // Add to sprite
  sprite.states = ([] as string[]).concat(sprite.states, newSpriteState.id);
  spriteStatesAdapter.addOne(state.spriteStates, newSpriteState);
};

const editSpriteState: CaseReducer<
  EntitiesState,
  PayloadAction<{ spriteStateId: string; changes: Partial<SpriteState> }>
> = (state, action) => {
  const spriteState = state.spriteStates.entities[action.payload.spriteStateId];

  const patch = { ...action.payload.changes };

  if (!spriteState) {
    return;
  }

  spriteStatesAdapter.updateOne(state.spriteStates, {
    id: action.payload.spriteStateId,
    changes: patch,
  });
};

const removeSpriteState: CaseReducer<
  EntitiesState,
  PayloadAction<{
    spriteSheetId: string;
    spriteStateId: string;
  }>
> = (state, action) => {
  const spriteSheet = localSpriteSheetSelectById(
    state,
    action.payload.spriteSheetId,
  );
  if (!spriteSheet) {
    return;
  }

  // Remove from sprite
  spriteSheetsAdapter.updateOne(state.spriteSheets, {
    id: action.payload.spriteSheetId,
    changes: {
      states: spriteSheet.states.filter((spriteStateId) => {
        return spriteStateId !== action.payload.spriteStateId;
      }),
    },
  });

  spriteStatesAdapter.removeOne(
    state.spriteStates,
    action.payload.spriteStateId,
  );
};

/**************************************************************************
 * Paint Helpers
 */

const paintCollision: CaseReducer<
  EntitiesState,
  PayloadAction<
    {
      sceneId: string;
      tileLookup?: number[];
      x: number;
      y: number;
      value: number;
      brush: Brush;
      mask: number;
    } & ({ drawLine?: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const background = localBackgroundSelectById(state, scene.backgroundId);
  if (!background) {
    return;
  }

  const brush = action.payload.brush;
  const mask = action.payload.mask;
  const drawSize = brush === "16px" ? 2 : 1;
  const collisionsSize = Math.ceil(background.width * background.height);
  const collisions = scene.collisions.slice(0, collisionsSize);

  // Fill collisions array if too small for image
  if (collisions.length < collisionsSize) {
    for (let i = collisions.length; i < collisionsSize; i++) {
      collisions[i] = 0;
    }
  }

  const getValue = (x: number, y: number) => {
    const tileIndex = background.width * y + x;
    return collisions[tileIndex];
  };

  const setValue = (x: number, y: number, value: number) => {
    const tileIndex = background.width * y + x;
    const originalValue = collisions[tileIndex] ?? 0;
    const newValue = (originalValue & ~mask) | (value & mask);
    collisions[tileIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "magic" && action.payload.tileLookup) {
    paintMagic(
      background.width,
      action.payload.tileLookup,
      action.payload.x,
      action.payload.y,
      action.payload.value,
      setValue,
      isInBounds,
    );
  } else if (brush === "fill") {
    floodFill(
      action.payload.x,
      action.payload.y,
      action.payload.value,
      getValue,
      setValue,
      isInBounds,
      equal,
    );
  } else if (action.payload.drawLine) {
    paintLine(
      action.payload.x,
      action.payload.y,
      action.payload.endX,
      action.payload.endY,
      drawSize,
      action.payload.value,
      setValue,
      isInBounds,
    );
  } else {
    paint(
      action.payload.x,
      action.payload.y,
      drawSize,
      action.payload.value,
      setValue,
      isInBounds,
    );
  }

  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      collisions,
    },
  });
};

const paintSlopeCollision: CaseReducer<
  EntitiesState,
  PayloadAction<{
    sceneId: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    offset: boolean;
    slopeIncline: SlopeIncline;
    slopeDirection: "left" | "right";
  }>
> = (state, action) => {
  const scene = localSceneSelectById(state, action.payload.sceneId);
  if (!scene) {
    return;
  }
  const background = localBackgroundSelectById(state, scene.backgroundId);
  if (!background) {
    return;
  }

  const { slopeIncline, slopeDirection, offset } = action.payload;

  let startX = action.payload.startX;
  let startY = action.payload.startY;
  let endX = action.payload.endX;
  let endY = action.payload.endY;
  let skipFirstTile = false;

  // If slope is offset (holding shift key) then modify the
  // line start/end tiles to ensure the line is painted correctly
  if (offset && slopeIncline === "steep") {
    endX += endX < startX ? -0.5 : 0.5;
    startY += endY > startY ? -1 : 1;
    skipFirstTile = true;
  } else if (offset && slopeIncline === "shallow") {
    endY += endY < startY ? -0.5 : 0.5;
    startX += endX > startX ? -1 : 1;
    skipFirstTile = true;
  }

  const roundEndX = endX > startX ? Math.floor(endX) : Math.ceil(endX);
  const roundEndY = endY > startY ? Math.floor(endY) : Math.ceil(endY);

  const collisionsSize = Math.ceil(background.width * background.height);
  const collisions = scene.collisions.slice(0, collisionsSize);

  // Fill collisions array if too small for image
  if (collisions.length < collisionsSize) {
    for (let i = collisions.length; i < collisionsSize; i++) {
      collisions[i] = 0;
    }
  }

  const setValue = (x: number, y: number, value: number) => {
    // Don't draw last tile
    if (x === roundEndX && y === roundEndY) {
      return;
    }

    // Don't draw first tile when offsetting shallow & steep slopes
    if (skipFirstTile && x === startX && y === startY) {
      return;
    }

    const tileIndex = background.width * y + x;
    let newValue = value;

    if (
      startY === endY &&
      // Drag left to right for top collision
      // Drag right to left for bottom collision
      // Shift to toggle
      ((startX > endX && !offset) || (startX <= endX && offset))
    ) {
      newValue = COLLISION_BOTTOM;
    } else if (startY === endY) {
      newValue = COLLISION_TOP;
    } else if (
      startX === endX &&
      // Drag top to bottom for left collision
      // Drag bottom to top for right collision
      // Shift to toggle
      ((startY > endY && !offset) || (startY <= endY && offset))
    ) {
      newValue = COLLISION_RIGHT;
    } else if (startX === endX) {
      newValue = COLLISION_LEFT;
    } else if (slopeIncline === "medium") {
      // Medium incline slope uses 45deg tiles using slope direction
      if (slopeDirection === "left") {
        newValue = COLLISION_SLOPE_45_LEFT;
      } else {
        newValue = COLLISION_SLOPE_45_RIGHT;
      }
    } else if (slopeIncline === "shallow") {
      // Shallow incline slope uses the 22deg tiles using slope direction
      // alternating between the two 22deg tiles depending on position on line
      const oddTile = (startX % 2 !== x % 2) !== endY > startY;

      if (slopeDirection === "left") {
        newValue = oddTile
          ? COLLISION_SLOPE_22_LEFT_TOP
          : COLLISION_SLOPE_22_LEFT_BOT;
      } else {
        newValue = oddTile
          ? COLLISION_SLOPE_22_RIGHT_TOP
          : COLLISION_SLOPE_22_RIGHT_BOT;
      }
    }

    collisions[tileIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  };

  paintLine(
    startX,
    startY,
    roundEndX,
    roundEndY,
    1,
    COLLISION_ALL,
    setValue,
    isInBounds,
  );

  scenesAdapter.updateOne(state.scenes, {
    id: action.payload.sceneId,
    changes: {
      collisions,
    },
  });
};

const paintColor: CaseReducer<
  EntitiesState,
  PayloadAction<
    {
      backgroundId: string;
      sceneId: string;
      tileLookup?: number[];
      x: number;
      y: number;
      paletteIndex: number;
      brush: Brush;
      isTileProp: boolean;
    } & ({ drawLine?: false } | { drawLine: true; endX: number; endY: number })
  >
> = (state, action) => {
  const background = localBackgroundSelectById(
    state,
    action.payload.backgroundId,
  );
  if (!background) {
    return;
  }

  const isTileProp = action.payload.isTileProp;
  const brush = action.payload.brush;
  const drawSize = brush === "16px" ? 2 : 1;
  const tileColorsSize = Math.ceil(background.width * background.height);
  const tileColors = (background.tileColors || []).slice(0, tileColorsSize);

  if (tileColors.length < tileColorsSize) {
    for (let i = tileColors.length; i < tileColorsSize; i++) {
      tileColors[i] = 0;
    }
  }

  const getValue = (x: number, y: number) => {
    const tileColorIndex = background.width * y + x;
    return tileColors[tileColorIndex];
  };

  const setValue = (x: number, y: number, value: number) => {
    const tileColorIndex = background.width * y + x;
    let newValue = value;
    if (isTileProp) {
      // If is prop keep previous color value
      newValue =
        (tileColors[tileColorIndex] & TILE_COLOR_PALETTE) +
        (value & TILE_COLOR_PROPS);
    } else if (value !== 0) {
      // If is color keep prop unless erasing
      newValue =
        (value & TILE_COLOR_PALETTE) +
        (tileColors[tileColorIndex] & TILE_COLOR_PROPS);
    }
    tileColors[tileColorIndex] = newValue;
  };

  const isInBounds = (x: number, y: number) => {
    return x >= 0 && x < background.width && y >= 0 && y < background.height;
  };

  const equal = (a: number, b: number) => a === b;

  if (brush === "magic" && action.payload.tileLookup) {
    paintMagic(
      background.width,
      action.payload.tileLookup,
      action.payload.x,
      action.payload.y,
      action.payload.paletteIndex,
      setValue,
      isInBounds,
    );
  } else if (brush === "fill") {
    floodFill(
      action.payload.x,
      action.payload.y,
      action.payload.paletteIndex,
      getValue,
      setValue,
      isInBounds,
      equal,
    );
  } else if (action.payload.drawLine) {
    paintLine(
      action.payload.x,
      action.payload.y,
      action.payload.endX,
      action.payload.endY,
      drawSize,
      action.payload.paletteIndex,
      setValue,
      isInBounds,
    );
  } else {
    paint(
      action.payload.x,
      action.payload.y,
      drawSize,
      action.payload.paletteIndex,
      setValue,
      isInBounds,
    );
  }

  backgroundsAdapter.updateOne(state.backgrounds, {
    id: action.payload.backgroundId,
    changes: {
      tileColors,
    },
  });
};

/**************************************************************************
 * Variables
 */

const renameVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; name: string }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  const existingHasFlags =
    existingVariable?.flags && Object.keys(existingVariable.flags).length > 0;
  if (action.payload.name.length > 0 || existingHasFlags) {
    variablesAdapter.upsertOne(state.variables, {
      id: action.payload.variableId,
      name: action.payload.name,
      symbol:
        action.payload.name.length > 0
          ? genEntitySymbol(state, `var_${action.payload.name}`)
          : "",
    });
  } else {
    // Variable is being set with empty name and doesn't have flags
    // set so can safely remove it
    variablesAdapter.removeOne(state.variables, action.payload.variableId);
  }
};

const renameVariableFlags: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; flags: Record<string, string> }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  const numFlags = Object.values(action.payload.flags).length;
  const existingHasName =
    existingVariable?.name && existingVariable?.name.length > 0;
  if (numFlags > 0 || existingHasName) {
    variablesAdapter.upsertOne(state.variables, {
      id: action.payload.variableId,
      name: existingVariable?.name ?? "",
      symbol: existingVariable?.symbol ?? "",
      flags: action.payload.flags,
    });
  } else {
    // Variable is being set with empty flags and doesn't have name
    // set so can safely remove it
    variablesAdapter.removeOne(state.variables, action.payload.variableId);
  }
};

/**************************************************************************
 * Constants
 */

const addConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
  }>
> = (state, action) => {
  const numConstants = localConstantSelectTotal(state);

  const newConstant: Constant = {
    id: action.payload.constantId,
    name: "",
    symbol: genEntitySymbol(state, `const_constant_${numConstants + 1}`),
    value: 0,
  };

  constantsAdapter.addOne(state.constants, newConstant);
};

const editConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
    changes: Partial<Constant>;
  }>
> = (state, action) => {
  const constant = localConstantSelectById(state, action.payload.constantId);

  if (!constant) {
    return;
  }

  const patch = {
    ...action.payload.changes,
    symbol: action.payload.changes.name
      ? genEntitySymbol(state, `const_${action.payload.changes.name ?? "0"}`)
      : constant.symbol,
  };

  constantsAdapter.updateOne(state.constants, {
    id: action.payload.constantId,
    changes: patch,
  });
};

const renameConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{ constantId: string; name: string }>
> = (state, action) => {
  const constant = localConstantSelectById(state, action.payload.constantId);
  const patch = {
    name: action.payload.name,
    symbol: genEntitySymbol(state, `const_${action.payload.name ?? "0"}`),
  };

  if (!constant) {
    return;
  }

  constantsAdapter.updateOne(state.constants, {
    id: action.payload.constantId,
    changes: patch,
  });
};

const removeConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
  }>
> = (state, action) => {
  constantsAdapter.removeOne(state.constants, action.payload.constantId);
};

/**************************************************************************
 * Palettes
 */

const addPalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string }>
> = (state, action) => {
  const newPalette: Palette = {
    id: action.payload.paletteId,
    name: `${l10n("TOOL_PALETTE_N", {
      number: localPaletteSelectTotal(state) + 1,
    })}`,
    colors: [
      DMG_PALETTE.colors[0],
      DMG_PALETTE.colors[1],
      DMG_PALETTE.colors[2],
      DMG_PALETTE.colors[3],
    ],
  };
  palettesAdapter.addOne(state.palettes, newPalette);
};

const editPalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string; changes: Partial<Palette> }>
> = (state, action) => {
  const patch = { ...action.payload.changes };

  palettesAdapter.updateOne(state.palettes, {
    id: action.payload.paletteId,
    changes: patch,
  });
};

const removePalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string }>
> = (state, action) => {
  palettesAdapter.removeOne(state.palettes, action.payload.paletteId);
};

/**************************************************************************
 * Custom Events
 */

const addCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    defaults?: Partial<CustomEventNormalized>;
  }>
> = (state, action) => {
  const customEventsTotal = localCustomEventSelectTotal(state);
  const newCustomEvent: CustomEventNormalized = {
    id: action.payload.customEventId,
    name: defaultLocalisedCustomEventName(customEventsTotal),
    description: "",
    variables: {},
    actors: {},
    ...(action.payload.defaults || {}),
    symbol: genEntitySymbol(state, `script_${customEventsTotal + 1}`),
    script: [],
  };
  customEventsAdapter.addOne(state.customEvents, newCustomEvent);
};

const editCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    changes: Partial<CustomEventNormalized>;
  }>
> = (state, action) => {
  const patch = { ...action.payload.changes };
  customEventsAdapter.updateOne(state.customEvents, {
    id: action.payload.customEventId,
    changes: patch,
  });
};

const setCustomEventSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ customEventId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.customEvents,
    customEventsAdapter,
    action.payload.customEventId,
    action.payload.symbol,
  );
};

const removeCustomEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{ customEventId: string; deleteReferences?: boolean }>
> = (state, action) => {
  const allScriptEvents = localScriptEventSelectAll(state);
  const referenceIds: string[] = [];

  for (const scriptEvent of allScriptEvents) {
    if (
      scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
      scriptEvent.args?.customEventId === action.payload.customEventId
    ) {
      referenceIds.push(scriptEvent.id);
    }
  }

  if (action.payload.deleteReferences) {
    scriptEventsAdapter.removeMany(state.scriptEvents, referenceIds);
  } else {
    scriptEventsAdapter.updateMany(
      state.scriptEvents,
      referenceIds.map((id) => ({
        id,
        changes: {
          args: { customEventId: undefined },
        },
      })),
    );
  }

  customEventsAdapter.removeOne(
    state.customEvents,
    action.payload.customEventId,
  );
};

const refreshCustomEventArgs: CaseReducer<
  EntitiesState,
  PayloadAction<{
    customEventId: string;
    scriptEventDefs: ScriptEventDefs;
  }>
> = (state, action) => {
  const customEvent = state.customEvents.entities[action.payload.customEventId];
  if (!customEvent) {
    return;
  }
  updateCustomEventArgs(
    customEvent,
    state.scriptEvents.entities,
    action.payload.scriptEventDefs,
  );
};

/**************************************************************************
 * Script Events
 */

export const selectScriptIds = (
  state: EntitiesState,
  parentType: ScriptEventParentType,
  parentId: string,
  parentKey: string,
): string[] | undefined => {
  if (parentType === "scene") {
    const scene = state.scenes.entities[parentId];
    if (!scene) return;
    const script = scene[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (scene[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "scriptEvent") {
    const scriptEvent = state.scriptEvents.entities[parentId];
    if (!scriptEvent) return;
    const script = scriptEvent.children?.[parentKey];
    if (script) {
      return script;
    }
    if (!scriptEvent.children) {
      scriptEvent.children = {
        [parentKey]: [],
      };
      return scriptEvent.children?.[parentKey];
    } else {
      scriptEvent.children[parentKey] = [];
      return scriptEvent.children[parentKey];
    }
  } else if (parentType === "actor") {
    const actor = state.actors.entities[parentId];
    if (!actor) return;
    const script = actor[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (actor[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "trigger") {
    const trigger = state.triggers.entities[parentId];
    if (!trigger) return;
    const script = trigger[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (trigger[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "customEvent") {
    const customEvent = state.customEvents.entities[parentId];
    if (!customEvent) return;
    const script = customEvent[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (customEvent[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "actorPrefab") {
    const actorPrefab = state.actorPrefabs.entities[parentId];
    if (!actorPrefab) return;
    const script = actorPrefab[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (actorPrefab[parentKey as "script"] = []);
    return newScript;
  } else if (parentType === "triggerPrefab") {
    const triggerPrefab = state.triggerPrefabs.entities[parentId];
    if (!triggerPrefab) return;
    const script = triggerPrefab[parentKey as "script"];
    if (script) {
      return script;
    }
    const newScript = (triggerPrefab[parentKey as "script"] = []);
    return newScript;
  } else {
    assertUnreachable(parentType);
  }
};

const selectScriptIdsByRef = (
  state: EntitiesState,
  location: ScriptEventsRef,
): string[] | undefined => {
  return selectScriptIds(
    state,
    location.parentType,
    location.parentId,
    location.parentKey,
  );
};

const addScriptEvents: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventIds: string[];
    entityId: string;
    type: ScriptEventParentType;
    key: string;
    insertId?: string;
    before?: boolean;
    data: Omit<ScriptEventNormalized, "id">[];
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );

  if (!script) {
    return;
  }

  const newScriptEvents = action.payload.data.map(
    (scriptEventData, scriptEventIndex) => {
      const newScriptEvent: ScriptEventNormalized = {
        ...scriptEventData,
        id: action.payload.scriptEventIds[scriptEventIndex],
      };
      if (scriptEventData.children) {
        newScriptEvent.children = Object.keys(scriptEventData.children).reduce(
          (memo, key) => {
            memo[key] = [];
            return memo;
          },
          {} as Record<string, string[]>,
        );
      }
      return newScriptEvent;
    },
  );

  const insertIndex = action.payload.insertId
    ? Math.max(
        0,
        script.indexOf(action.payload.insertId || "") +
          (action.payload.before ? 0 : 1),
      )
    : script.length;

  scriptEventsAdapter.addMany(state.scriptEvents, newScriptEvents);
  script.splice(insertIndex, 0, ...action.payload.scriptEventIds);
};

const moveScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    from: ScriptEventsRef;
    to: ScriptEventsRef;
    additionalScriptEventIds: string[];
  }>
> = (state, action) => {
  const from = selectScriptIdsByRef(state, action.payload.from);
  const to = selectScriptIdsByRef(state, action.payload.to);
  if (!from || !to) {
    return;
  }

  const fromIndex = from.indexOf(action.payload.from.scriptEventId);
  let toIndex = to.indexOf(action.payload.to.scriptEventId);
  if (fromIndex === -1) {
    return;
  }
  if (toIndex === -1) {
    toIndex = to.length;
  }

  from.splice(fromIndex, 1);
  if (from === to && fromIndex < toIndex) {
    toIndex--;
  }
  to.splice(
    Math.min(Math.max(toIndex, 0), to.length),
    0,
    action.payload.from.scriptEventId,
  );

  const { additionalScriptEventIds } = action.payload;

  if (additionalScriptEventIds.length > 0) {
    const upperHalfRemainingScriptEventIds = to
      .slice(0, toIndex)
      .filter((c) => !additionalScriptEventIds.includes(c));
    const lowerHalfRemainingScriptEventIds = to
      .slice(toIndex)
      .filter((c) => !additionalScriptEventIds.includes(c));
    const newFrom = from.filter((c) => !additionalScriptEventIds.includes(c));
    const newTo = [
      ...upperHalfRemainingScriptEventIds,
      ...additionalScriptEventIds,
      ...lowerHalfRemainingScriptEventIds,
    ];
    from.length = 0;
    from.push(...newFrom);
    to.length = 0;
    to.push(...newTo);
  }
};

const editScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    changes: Partial<ScriptEventNormalized>;
  }>
> = (state, action) => {
  scriptEventsAdapter.updateOne(state.scriptEvents, {
    id: action.payload.scriptEventId,
    changes: action.payload.changes,
  });
};

const setScriptEventSymbol: CaseReducer<
  EntitiesState,
  PayloadAction<{ scriptEventId: string; symbol: string }>
> = (state, action) => {
  updateEntitySymbol(
    state,
    state.scriptEvents,
    scriptEventsAdapter,
    action.payload.scriptEventId,
    action.payload.symbol,
  );
};

const toggleScriptEventOpen: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__collapse = !scriptEvent.args.__collapse;
};

const toggleScriptEventComment: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    additionalScriptEventIds: string[];
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  const newValue = !scriptEvent.args.__comment;
  scriptEvent.args.__comment = newValue;

  // Toggle others in selection to match
  for (const scriptEventId of action.payload.additionalScriptEventIds) {
    const scriptEvent = state.scriptEvents.entities[scriptEventId];
    if (!scriptEvent || !scriptEvent.args) {
      continue;
    }
    scriptEvent.args.__comment = newValue;
  }
};

const toggleScriptEventDisableElse: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__disableElse = !scriptEvent.args.__disableElse;
};

const editScriptEventArg: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    key: string;
    value: unknown;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args[action.payload.key] = action.payload.value;
};

const editScriptEventDestination: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    destSceneId: string;
    x: number;
    y: number;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }

  scriptEvent.args = {
    ...scriptEvent.args,
    sceneId: action.payload.destSceneId,
    x: isValueNumber(scriptEvent.args.x)
      ? { type: "number", value: action.payload.x }
      : scriptEvent.args.x,
    y: isValueNumber(scriptEvent.args.y)
      ? { type: "number", value: action.payload.y }
      : scriptEvent.args.y,
  };
};

const editScriptEventLabel: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    value: string;
  }>
> = (state, action) => {
  const scriptEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!scriptEvent || !scriptEvent.args) {
    return;
  }
  scriptEvent.args.__label = action.payload.value;
};

const groupScriptEvents: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventIds: string[];
    parentId: string;
    parentType: ScriptEventParentType;
    parentKey: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.parentType,
    action.payload.parentId,
    action.payload.parentKey,
  );

  if (!script) {
    return;
  }

  // Use first id in list to determine insert position
  const insertId = action.payload.scriptEventIds[0];
  const insertIndex = insertId
    ? Math.max(0, script.indexOf(insertId || ""))
    : script.length;

  // Remove from previous parent
  for (const scriptEventId of action.payload.scriptEventIds) {
    const eventIndex = script.indexOf(scriptEventId);
    if (eventIndex === -1) {
      continue;
    }
    script.splice(eventIndex, 1);
  }

  // Build parent group
  const groupEvent: ScriptEventNormalized = {
    id: uuid(),
    command: "EVENT_GROUP",
    args: {},
    children: {
      true: action.payload.scriptEventIds,
    },
  };

  // Add group to previous parent
  scriptEventsAdapter.addOne(state.scriptEvents, groupEvent);
  script.splice(insertIndex, 0, groupEvent.id);
};

const resetScript: CaseReducer<
  EntitiesState,
  PayloadAction<{
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );
  if (script) {
    script.splice(0, script.length);
  }
};

const ungroupScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    parentId: string;
    parentType: ScriptEventParentType;
    parentKey: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.parentType,
    action.payload.parentId,
    action.payload.parentKey,
  );

  if (!script) {
    return;
  }

  const groupEvent = state.scriptEvents.entities[action.payload.scriptEventId];
  if (!groupEvent || !groupEvent.children || !groupEvent.children.true) {
    return;
  }

  const eventIndex = script.indexOf(action.payload.scriptEventId);
  if (eventIndex === -1) {
    return;
  }

  script.splice(eventIndex, 1, ...groupEvent.children.true);
  scriptEventsAdapter.removeOne(
    state.scriptEvents,
    action.payload.scriptEventId,
  );
};

const applyScriptEventPresetChanges: CaseReducer<
  EntitiesState,
  PayloadAction<{
    id: string;
    presetId: string;
    name: string;
    groups: string[];
    args: ScriptEventArgs;
    previousArgs: ScriptEventArgs;
  }>
> = (state, action) => {
  const scriptEvents = localScriptEventSelectAll(state);
  const actors = localActorSelectAll(state);
  const triggers = localTriggerSelectAll(state);

  const mergeArgs = (storedArgs?: ScriptEventArgs) => {
    const mergedArgs = { ...storedArgs };
    Object.keys({ ...mergedArgs, ...action.payload.args }).forEach((key) => {
      if (
        (!mergedArgs[key] ||
          isEqual(mergedArgs[key], action.payload.previousArgs[key])) &&
        action.payload.args[key] !== undefined
      ) {
        mergedArgs[key] = action.payload.args[key];
      }
    });
    return mergedArgs;
  };

  const scriptEventUpdates = scriptEvents
    .filter(
      (scriptEvent) =>
        scriptEvent.command === action.payload.id &&
        scriptEvent.args?.__presetId === action.payload.presetId,
    )
    .map((scriptEvent) => ({
      id: scriptEvent.id,
      changes: {
        args: mergeArgs(scriptEvent.args),
      },
    }));

  scriptEventsAdapter.updateMany(state.scriptEvents, scriptEventUpdates);

  // Apply preset to any uses in actor prefab overrides
  actors.forEach((actor) => {
    Object.values(actor.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = mergeArgs(override.args);
      }
    });
  });

  // Apply preset to any uses in trigger prefab overrides
  triggers.forEach((trigger) => {
    Object.values(trigger.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = mergeArgs(override.args);
      }
    });
  });
};

const removeScriptEventPresetReferences: CaseReducer<
  EntitiesState,
  PayloadAction<{
    id: string;
    presetId: string;
  }>
> = (state, action) => {
  const scriptEvents = localScriptEventSelectAll(state);
  const actors = localActorSelectAll(state);
  const triggers = localTriggerSelectAll(state);

  const stripPresetId = (storedArgs?: ScriptEventArgs) => {
    return { ...storedArgs, __presetId: undefined };
  };

  const scriptEventUpdates = scriptEvents
    .filter(
      (scriptEvent) =>
        scriptEvent.command === action.payload.id &&
        scriptEvent.args?.__presetId === action.payload.presetId,
    )
    .map((scriptEvent) => ({
      id: scriptEvent.id,
      changes: {
        args: stripPresetId(scriptEvent.args),
      },
    }));

  scriptEventsAdapter.updateMany(state.scriptEvents, scriptEventUpdates);

  // Remove presetId from any uses in actor prefab overrides
  actors.forEach((actor) => {
    Object.values(actor.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = stripPresetId(override.args);
      }
    });
  });

  // Remove presetId from any uses in trigger prefab overrides
  triggers.forEach((trigger) => {
    Object.values(trigger.prefabScriptOverrides).forEach((override) => {
      if (override.args?.__presetId === action.payload.presetId) {
        override.args = stripPresetId(override.args);
      }
    });
  });
};

const removeScriptEvent: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventId: string;
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );

  if (!script) {
    return;
  }

  const eventIndex = script.indexOf(action.payload.scriptEventId);
  if (eventIndex === -1) {
    return;
  }

  script.splice(eventIndex, 1);
  scriptEventsAdapter.removeOne(
    state.scriptEvents,
    action.payload.scriptEventId,
  );
};

const removeScriptEvents: CaseReducer<
  EntitiesState,
  PayloadAction<{
    scriptEventIds: string[];
    entityId: string;
    type: ScriptEventParentType;
    key: string;
  }>
> = (state, action) => {
  const script = selectScriptIds(
    state,
    action.payload.type,
    action.payload.entityId,
    action.payload.key,
  );

  if (!script) {
    return;
  }

  for (const scriptEventId of action.payload.scriptEventIds) {
    const eventIndex = script.indexOf(scriptEventId);
    if (eventIndex === -1) {
      continue;
    }
    script.splice(eventIndex, 1);
  }

  scriptEventsAdapter.removeMany(
    state.scriptEvents,
    action.payload.scriptEventIds,
  );
};

/**************************************************************************
 * Engine Field Values
 */

const editEngineFieldValue: CaseReducer<
  EntitiesState,
  PayloadAction<{
    engineFieldId: string;
    value: string | number | undefined;
  }>
> = (state, action) => {
  engineFieldValuesAdapter.upsertOne(state.engineFieldValues, {
    id: action.payload.engineFieldId,
    value: action.payload.value,
  });
};

const removeEngineFieldValue: CaseReducer<
  EntitiesState,
  PayloadAction<{ engineFieldId: string }>
> = (state, action) => {
  engineFieldValuesAdapter.removeOne(
    state.engineFieldValues,
    action.payload.engineFieldId,
  );
};

/**************************************************************************
 * General Assets
 */

const reloadAssets: CaseReducer<EntitiesState> = (state) => {
  const now = Date.now();

  const updateTimestamp = <T extends { _v: number }>(obj: T): T => {
    obj._v = now;
    return obj;
  };

  const backgrounds = localBackgroundSelectAll(state).map(updateTimestamp);
  const spriteSheets = localSpriteSheetSelectAll(state).map(updateTimestamp);
  const music = localMusicSelectAll(state).map(updateTimestamp);

  backgroundsAdapter.setAll(state.backgrounds, backgrounds);
  spriteSheetsAdapter.setAll(state.spriteSheets, spriteSheets);
  musicAdapter.setAll(state.music, music);
};

// Reducer ---------------------------------------------------------------------

const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    /**************************************************************************
     * Scenes
     */

    addScene: {
      reducer: addScene,
      prepare: (payload: {
        x: number;
        y: number;
        defaults?: Partial<SceneNormalized>;
        variables?: Variable[];
      }) => {
        return {
          payload: {
            ...payload,
            sceneId: uuid(),
          },
        };
      },
    },

    editScene,
    editScenes,
    setSceneSymbol,
    removeScene,
    removeScenes,
    moveScene,
    paintCollision,
    paintSlopeCollision,
    paintColor,

    /**************************************************************************
     * Actors
     */

    addActor: {
      reducer: addActor,
      prepare: (payload: {
        sceneId: string;
        x: number;
        y: number;
        defaults?: Partial<ActorNormalized>;
        variables?: Variable[];
      }) => {
        return {
          payload: {
            ...payload,
            actorId: uuid(),
          },
        };
      },
    },

    editActor,
    setActorSymbol,
    unpackActorPrefab,
    convertActorToPrefab,
    editActorPrefabScriptEventOverride,
    revertActorPrefabScriptEventOverrides,
    applyActorPrefabScriptEventOverrides,
    revertActorPrefabScriptEventOverride,
    applyActorPrefabScriptEventOverride,
    removeActor,
    removeActorAt,
    moveActor,

    /**************************************************************************
     * Triggers
     */

    addTrigger: {
      reducer: addTrigger,
      prepare: (payload: {
        sceneId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        defaults?: Partial<TriggerNormalized>;
        variables?: Variable[];
      }) => {
        return {
          payload: {
            ...payload,
            triggerId: uuid(),
          },
        };
      },
    },

    editTrigger,
    setTriggerSymbol,
    unpackTriggerPrefab,
    convertTriggerToPrefab,
    editTriggerPrefabScriptEventOverride,
    revertTriggerPrefabScriptEventOverrides,
    applyTriggerPrefabScriptEventOverrides,
    revertTriggerPrefabScriptEventOverride,
    applyTriggerPrefabScriptEventOverride,
    removeTrigger,
    removeTriggerAt,
    moveTrigger,
    resizeTrigger,

    /**************************************************************************
     * Actor Prefabs
     */

    addActorPrefab: {
      reducer: addActorPrefab,
      prepare: (payload?: {
        actorPrefabId?: string;
        defaults?: Partial<ActorPrefabNormalized>;
      }) => {
        return {
          payload: {
            ...payload,
            actorPrefabId: payload?.actorPrefabId ?? uuid(),
          },
        };
      },
    },

    editActorPrefab,
    removeActorPrefab,

    /**************************************************************************
     * Trigger Prefabs
     */

    addTriggerPrefab: {
      reducer: addTriggerPrefab,
      prepare: (payload?: {
        triggerPrefabId?: string;
        defaults?: Partial<TriggerPrefabNormalized>;
      }) => {
        return {
          payload: {
            ...payload,
            triggerPrefabId: payload?.triggerPrefabId ?? uuid(),
          },
        };
      },
    },

    editTriggerPrefab,
    removeTriggerPrefab,

    /**************************************************************************
     * Backgrounds
     */

    setBackgroundSymbol,
    editBackgroundAutoColor,

    /**************************************************************************
     * Sprites
     */

    editSpriteSheet,
    setSpriteSheetSymbol,

    /**************************************************************************
     * Metasprites
     */

    addMetasprite: {
      reducer: addMetasprite,
      prepare: (payload: {
        spriteAnimationId: string;
        spriteSheetId: string;
        afterMetaspriteId: string;
      }) => {
        return {
          payload: {
            ...payload,
            metaspriteId: uuid(),
          },
        };
      },
    },

    cloneMetasprites: {
      reducer: cloneMetasprites,
      prepare: (payload: {
        spriteSheetId: string;
        spriteAnimationId: string;
        metaspriteIds: string[];
      }) => {
        return {
          payload: {
            ...payload,
            newMetaspriteIds: payload.metaspriteIds.map(() => uuid()),
          },
        };
      },
    },

    sendMetaspriteTilesToFront,
    sendMetaspriteTilesToBack,
    removeMetasprite,
    removeMetasprites,

    /**************************************************************************
     * Metasprite Tiles
     */

    addMetaspriteTile: {
      reducer: addMetaspriteTile,
      prepare: (payload: {
        spriteSheetId: string;
        metaspriteId: string;
        x: number;
        y: number;
        sliceX: number;
        sliceY: number;
        flipX: boolean;
        flipY: boolean;
        objPalette: ObjPalette;
        paletteIndex: number;
        priority: boolean;
      }) => {
        return {
          payload: {
            ...payload,
            metaspriteTileId: uuid(),
          },
        };
      },
    },

    moveMetaspriteTiles,
    moveMetaspriteTilesRelative,
    flipXMetaspriteTiles,
    flipYMetaspriteTiles,
    editMetaspriteTile,
    editMetaspriteTiles,
    removeMetaspriteTiles,
    removeMetaspriteTilesOutsideCanvas,

    /**************************************************************************
     * Sprite Animations
     */

    editSpriteAnimation,
    moveSpriteAnimationFrame,
    moveSpriteAnimationFrames,

    /**************************************************************************
     * Sprite States
     */

    addSpriteState: {
      reducer: addSpriteState,
      prepare: (payload: { spriteSheetId: string }) => {
        return {
          payload: {
            ...payload,
            spriteStateId: uuid(),
          },
        };
      },
    },

    editSpriteState,
    removeSpriteState,

    /**************************************************************************
     * Variables
     */

    renameVariable,
    renameVariableFlags,

    /**************************************************************************
     * Constants
     */

    addConstant: {
      reducer: addConstant,
      prepare: () => {
        return {
          payload: {
            constantId: uuid(),
          },
        };
      },
    },

    editConstant,
    renameConstant,
    removeConstant,

    /**************************************************************************
     * Palettes
     */

    addPalette: {
      reducer: addPalette,
      prepare: () => {
        return {
          payload: {
            paletteId: uuid(),
          },
        };
      },
    },
    editPalette,
    removePalette,

    /**************************************************************************
     * Custom Events
     */

    addCustomEvent: {
      reducer: addCustomEvent,
      prepare: (payload?: {
        customEventId?: string;
        defaults?: Partial<CustomEventNormalized>;
      }) => {
        return {
          payload: {
            customEventId: payload?.customEventId ?? uuid(),
            defaults: payload?.defaults,
          },
        };
      },
    },

    editCustomEvent,
    setCustomEventSymbol,
    removeCustomEvent,
    refreshCustomEventArgs: {
      reducer: refreshCustomEventArgs,
      prepare: (payload: {
        customEventId: string;
        scriptEventDefs: ScriptEventDefs;
      }) => {
        return {
          payload: {
            customEventId: payload.customEventId,
            scriptEventDefs: payload.scriptEventDefs,
          },
          meta: {
            throttle: 1000,
            key: `refresh_${payload.customEventId}`,
          },
        };
      },
    },

    /**************************************************************************
     * Script Events
     */

    addScriptEvents: {
      reducer: addScriptEvents,
      prepare: (payload: {
        entityId: string;
        type: ScriptEventParentType;
        key: string;
        insertId?: string;
        before?: boolean;
        data: Omit<ScriptEventNormalized, "id">[];
      }) => {
        return {
          payload: {
            ...payload,
            scriptEventIds: payload.data.map(() => uuid()),
          },
        };
      },
    },

    moveScriptEvent,
    editScriptEvent,
    setScriptEventSymbol,
    groupScriptEvents,
    ungroupScriptEvent,
    applyScriptEventPresetChanges,
    removeScriptEventPresetReferences,
    resetScript,
    toggleScriptEventOpen,
    toggleScriptEventComment,
    toggleScriptEventDisableElse,
    editScriptEventArg,
    editScriptEventDestination,
    editScriptEventLabel,
    removeScriptEvent,
    removeScriptEvents,

    /**************************************************************************
     * Music
     */

    editMusicSettings,
    setMusicSymbol,

    /**************************************************************************
     * Sounds
     */

    setSoundSymbol,

    /**************************************************************************
     * Emote
     */

    setEmoteSymbol,

    /**************************************************************************
     * Tileset
     */

    setTilesetSymbol,

    /**************************************************************************
     * Font
     */

    setFontSymbol,

    /**************************************************************************
     * Engine Field Values
     */

    editEngineFieldValue,
    removeEngineFieldValue,

    /*
     * Load assets
     */
    loadBackground,
    loadSprite,
    loadMusic,
    loadSound,
    loadFont,
    removeFont,
    loadAvatar,
    removeAvatar,
    loadEmote,
    removeEmote,
    loadTileset,
    removedAsset,
    renamedAsset,
  },
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.fulfilled, loadProject)
      .addCase(projectActions.removeAsset.fulfilled, removedAsset)
      .addCase(projectActions.renameAsset.fulfilled, renamedAsset)
      .addCase(spriteActions.detectSpriteComplete, loadDetectedSprite)
      .addCase(projectActions.reloadAssets, reloadAssets)
      .addCase(addNewSongFile.fulfilled, loadMusic),
});

export const { reducer } = entitiesSlice;

export const actions = {
  ...entitiesSlice.actions,
  moveSelectedEntity,
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

export const duplicateScript = (
  state: EntitiesState,
  scriptEventIds: string[],
  overrides?: Record<string, ScriptEventArgsOverride>,
): string[] => {
  const newIds = scriptEventIds.map(() => uuid());
  scriptEventIds.forEach((scriptEventId, index) => {
    const scriptEvent = localScriptEventSelectById(state, scriptEventId);
    if (scriptEvent) {
      const duplicatedChildren: Record<string, string[]> = {};
      if (scriptEvent.children) {
        for (const [key, childIds] of Object.entries(scriptEvent.children)) {
          duplicatedChildren[key] = duplicateScript(
            state,
            childIds || [],
            overrides,
          );
        }
      }
      const override = overrides?.[scriptEvent.id];
      scriptEventsAdapter.addOne(state.scriptEvents, {
        ...scriptEvent,
        args: override
          ? {
              ...scriptEvent.args,
              ...override.args,
            }
          : scriptEvent.args,
        id: newIds[index],
        children: duplicatedChildren,
      });
    }
  });
  return newIds;
};

/**************************************************************************
 * Selectors
 */

// Local (only for use in reducers within this file)
const localSceneSelectById = (state: EntitiesState, id: string) =>
  state.scenes.entities[id];

const localSceneSelectAll = (state: EntitiesState) =>
  state.scenes.ids.map((id) => state.scenes.entities[id]);

const localSceneSelectTotal = (state: EntitiesState) => state.scenes.ids.length;

const localActorSelectById = (state: EntitiesState, id: string) =>
  state.actors.entities[id];

const localActorSelectEntities = (state: EntitiesState) =>
  state.actors.entities;

const localActorSelectAll = (state: EntitiesState) =>
  state.actors.ids.map((id) => state.actors.entities[id]);

const localTriggerSelectById = (state: EntitiesState, id: string) =>
  state.triggers.entities[id];

const localTriggerSelectEntities = (state: EntitiesState) =>
  state.triggers.entities;

const localTriggerSelectAll = (state: EntitiesState) =>
  state.triggers.ids.map((id) => state.triggers.entities[id]);

const localActorPrefabSelectById = (state: EntitiesState, id: string) =>
  state.actorPrefabs.entities[id];

const localTriggerPrefabSelectById = (state: EntitiesState, id: string) =>
  state.triggerPrefabs.entities[id];

const localScriptEventSelectById = (state: EntitiesState, id: string) =>
  state.scriptEvents.entities[id];

const localScriptEventSelectAll = (state: EntitiesState) =>
  state.scriptEvents.ids.map((id) => state.scriptEvents.entities[id]);

const localCustomEventSelectTotal = (state: EntitiesState) =>
  state.customEvents.ids.length;

const localSpriteSheetSelectById = (state: EntitiesState, id: string) =>
  state.spriteSheets.entities[id];

const localSpriteSheetSelectAll = (state: EntitiesState) =>
  state.spriteSheets.ids.map((id) => state.spriteSheets.entities[id]);

const localBackgroundSelectById = (state: EntitiesState, id: string) =>
  state.backgrounds.entities[id];

const localBackgroundSelectAll = (state: EntitiesState) =>
  state.backgrounds.ids.map((id) => state.backgrounds.entities[id]);

const localBackgroundSelectIds = (state: EntitiesState) =>
  state.backgrounds.ids;

const localPaletteSelectTotal = (state: EntitiesState) =>
  state.palettes.ids.length;

const localMusicSelectById = (state: EntitiesState, id: string) =>
  state.music.entities[id];

const localMusicSelectAll = (state: EntitiesState) =>
  state.music.ids.map((id) => state.music.entities[id]);

const localVariableSelectById = (state: EntitiesState, id: string) =>
  state.variables.entities[id];

const localConstantSelectById = (state: EntitiesState, id: string) =>
  state.constants.entities[id];

const localConstantSelectTotal = (state: EntitiesState) =>
  state.constants.ids.length;

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

export const getMaxSceneRight = createSelector(
  [sceneSelectors.selectAll],
  (scenes) =>
    scenes.reduce((memo, scene) => {
      const sceneRight = scene.x + scene.width * 8;
      if (sceneRight > memo) {
        return sceneRight;
      }
      return memo;
    }, 0),
);

export const getMaxSceneBottom = createSelector(
  [sceneSelectors.selectAll],
  (scenes) =>
    scenes.reduce((memo, scene) => {
      const sceneBottom = scene.y + scene.height * 8;
      if (sceneBottom > memo) {
        return sceneBottom;
      }
      return memo;
    }, 0),
);

export const getSceneActorIds = (state: RootState, { id }: { id: string }) =>
  sceneSelectors.selectById(state, id)?.actors;

export default reducer;
