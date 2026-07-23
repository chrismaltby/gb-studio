import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import l10n from "shared/lib/lang/l10n";
import { DMG_PALETTE } from "consts";
import { v4 as uuid } from "uuid";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  nextIndexedName,
  applyReparentFolderToCollection,
  applyReparentEntityToCollection,
} from "shared/lib/entities/entitiesHelpers";
import { Palette } from "shared/lib/resources/types";
import { palettesAdapter } from "store/features/entities/adapters";
import { localPaletteSelectTotal } from "store/features/entities/helpers";

const addPalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string; name?: string }>
> = (state, action) => {
  const newPalette: Palette = {
    id: action.payload.paletteId,
    name:
      action.payload.name ||
      `${l10n("TOOL_PALETTE_N", {
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

const editPaletteColor: CaseReducer<
  EntitiesState,
  PayloadAction<{
    paletteId: string;
    colorId: 0 | 1 | 2 | 3;
    color: string;
  }>
> = (state, action) => {
  const existingPalette = state.palettes.entities[action.payload.paletteId];
  if (!existingPalette) {
    return;
  }

  const [white, light, dark, black] = existingPalette.colors;

  if (action.payload.colorId === 0) {
    existingPalette.colors = [action.payload.color, light, dark, black];
  } else if (action.payload.colorId === 1) {
    existingPalette.colors = [white, action.payload.color, dark, black];
  } else if (action.payload.colorId === 2) {
    existingPalette.colors = [white, light, action.payload.color, black];
  } else {
    existingPalette.colors = [white, light, dark, action.payload.color];
  }
};

const duplicatePalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string; newPaletteId: string }>
> = (state, action) => {
  const existingPalette = state.palettes.entities[action.payload.paletteId];
  if (!existingPalette) {
    return;
  }

  const allNames = state.palettes.ids
    .map((id) => state.palettes.entities[id]?.name)
    .filter((n) => !!n);

  const newName = nextIndexedName(existingPalette.name, allNames);

  const newPalette: Palette = {
    ...existingPalette,
    id: action.payload.newPaletteId,
    name: newName,
  };

  palettesAdapter.addOne(state.palettes, newPalette);
};

const removePalette: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteId: string }>
> = (state, action) => {
  palettesAdapter.removeOne(state.palettes, action.payload.paletteId);
};

const removePalettes: CaseReducer<
  EntitiesState,
  PayloadAction<{ paletteIds: string[] }>
> = (state, action) => {
  palettesAdapter.removeMany(state.palettes, action.payload.paletteIds);
};

const reparentPalettesFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentFolderToCollection(
    state.palettes.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
};

const reparentPalette: CaseReducer<
  EntitiesState,
  PayloadAction<{
    paletteId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.palettes.entities,
    action.payload.paletteId,
    action.payload.toPath,
  );
};

const palettesReducers = {
  addPalette: {
    reducer: addPalette,
    prepare: (payload?: { name?: string }) => {
      return {
        payload: {
          ...payload,
          paletteId: uuid(),
        },
      };
    },
  },
  editPalette,
  editPaletteColor,
  duplicatePalette: {
    reducer: duplicatePalette,
    prepare: (payload: { paletteId: string }) => {
      return {
        payload: {
          ...payload,
          newPaletteId: uuid(),
        },
      };
    },
  },
  removePalette,
  removePalettes,
  reparentPalettesFolder,
  reparentPalette,
} satisfies SliceCaseReducers<EntitiesState>;

export default palettesReducers;
