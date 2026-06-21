import { createSelector } from "@reduxjs/toolkit";
import l10n from "shared/lib/lang/l10n";
import { DMG_PALETTE } from "consts";
import { RootState } from "store/storeTypes";
import { paletteName } from "shared/lib/entities/entitiesHelpers";
import keyBy from "lodash/keyBy";
import type { Palette } from "shared/lib/resources/types";
import {
  actorsAdapter,
  triggersAdapter,
  scenesAdapter,
  actorPrefabsAdapter,
  triggerPrefabsAdapter,
  scriptEventsAdapter,
  backgroundsAdapter,
  spriteSheetsAdapter,
  metaspritesAdapter,
  metaspriteTilesAdapter,
  spriteAnimationsAdapter,
  spriteStatesAdapter,
  palettesAdapter,
  customEventsAdapter,
  musicAdapter,
  soundsAdapter,
  fontsAdapter,
  avatarsAdapter,
  emotesAdapter,
  tilesetsAdapter,
  variablesAdapter,
  constantsAdapter,
  notesAdapter,
  engineFieldValuesAdapter,
} from "store/features/entities/adapters";

export const actorSelectors = actorsAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.actors,
);
export const triggerSelectors = triggersAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.triggers,
);
export const sceneSelectors = scenesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.scenes,
);
export const noteSelectors = notesAdapter.getSelectors(
  (state: RootState) => state.project.present.entities.notes,
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

export const getMaxWorldRight = createSelector(
  [sceneSelectors.selectAll, noteSelectors.selectAll],
  (scenes, notes) => {
    const maxSceneRight = scenes.reduce((memo, scene) => {
      const right = scene.x + scene.width * 8;
      return right > memo ? right : memo;
    }, 0);

    const maxNoteRight = notes.reduce((memo, note) => {
      const right = note.x + note.width * 8;
      return right > memo ? right : memo;
    }, 0);

    return Math.max(maxSceneRight, maxNoteRight);
  },
);

export const getMaxWorldBottom = createSelector(
  [sceneSelectors.selectAll, noteSelectors.selectAll],
  (scenes, notes) => {
    const maxSceneBottom = scenes.reduce((memo, scene) => {
      const bottom = scene.y + scene.height * 8;
      return bottom > memo ? bottom : memo;
    }, 0);

    const maxNoteBottom = notes.reduce((memo, note) => {
      const bottom = note.y + note.height * 8;
      return bottom > memo ? bottom : memo;
    }, 0);

    return Math.max(maxSceneBottom, maxNoteBottom);
  },
);

export const getSceneActorIds = (state: RootState, { id }: { id: string }) =>
  sceneSelectors.selectById(state, id)?.actors;
