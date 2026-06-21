import { createEntityAdapter } from "@reduxjs/toolkit";
import {
  ActorNormalized,
  TriggerNormalized,
  SceneNormalized,
  SpriteSheetNormalized,
  ScriptNormalized,
  ScriptEventNormalized,
  MetaspriteNormalized,
  SpriteAnimationNormalized,
  SpriteStateNormalized,
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import { sortByFilename } from "shared/lib/entities/entitiesHelpers";
import {
  AvatarAsset,
  BackgroundAsset,
  Constant,
  EmoteAsset,
  EngineFieldValue,
  FontAsset,
  MetaspriteTile,
  MusicAsset,
  Note,
  Palette,
  SoundAsset,
  TilesetAsset,
  Variable,
} from "shared/lib/resources/types";

export const scriptEventsAdapter = createEntityAdapter<ScriptEventNormalized>();
export const actorsAdapter = createEntityAdapter<ActorNormalized>();
export const triggersAdapter = createEntityAdapter<TriggerNormalized>();
export const scenesAdapter = createEntityAdapter<SceneNormalized>();
export const actorPrefabsAdapter = createEntityAdapter<ActorPrefabNormalized>();
export const triggerPrefabsAdapter =
  createEntityAdapter<TriggerPrefabNormalized>();
export const backgroundsAdapter = createEntityAdapter<BackgroundAsset>({
  sortComparer: sortByFilename,
});
export const spriteSheetsAdapter = createEntityAdapter<SpriteSheetNormalized>({
  sortComparer: sortByFilename,
});
export const tilesetsAdapter = createEntityAdapter<TilesetAsset>({
  sortComparer: sortByFilename,
});
export const metaspritesAdapter = createEntityAdapter<MetaspriteNormalized>();
export const metaspriteTilesAdapter = createEntityAdapter<MetaspriteTile>();
export const spriteAnimationsAdapter =
  createEntityAdapter<SpriteAnimationNormalized>();
export const spriteStatesAdapter = createEntityAdapter<SpriteStateNormalized>();
export const palettesAdapter = createEntityAdapter<Palette>();
export const customEventsAdapter = createEntityAdapter<ScriptNormalized>();
export const musicAdapter = createEntityAdapter<MusicAsset>({
  sortComparer: sortByFilename,
});
export const soundsAdapter = createEntityAdapter<SoundAsset>({
  sortComparer: sortByFilename,
});
export const fontsAdapter = createEntityAdapter<FontAsset>({
  sortComparer: sortByFilename,
});
export const avatarsAdapter = createEntityAdapter<AvatarAsset>({
  sortComparer: sortByFilename,
});
export const emotesAdapter = createEntityAdapter<EmoteAsset>({
  sortComparer: sortByFilename,
});
export const variablesAdapter = createEntityAdapter<Variable>();
export const constantsAdapter = createEntityAdapter<Constant>();
export const notesAdapter = createEntityAdapter<Note>();
export const engineFieldValuesAdapter = createEntityAdapter<EngineFieldValue>();
