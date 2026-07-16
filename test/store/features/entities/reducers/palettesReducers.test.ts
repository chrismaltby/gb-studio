import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import { dummyPalette } from "../../../../dummydata";
import { DMG_PALETTE } from "consts";

test("Should be able to add a palette", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addPalette();

  expect(state.palettes.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.palettes.ids.length).toBe(1);
  expect(newState.palettes.entities[action.payload.paletteId]?.id).toBe(
    action.payload.paletteId,
  );
  expect(newState.palettes.entities[action.payload.paletteId]?.colors).toEqual(
    DMG_PALETTE.colors,
  );
});

test("Should be able to edit a palette", () => {
  const state: EntitiesState = {
    ...initialState,
    palettes: {
      entities: {
        palette1: {
          ...dummyPalette,
          id: "palette1",
        },
      },
      ids: ["palette1"],
    },
  };

  const action = actions.editPalette({
    paletteId: "palette1",
    changes: {
      colors: ["ff0000", "00ff00", "0000ff", "ffffff"],
    },
  });

  const newState = reducer(state, action);
  expect(newState.palettes.entities[action.payload.paletteId]?.colors).toEqual([
    "ff0000",
    "00ff00",
    "0000ff",
    "ffffff",
  ]);
});

test("Should be able to edit a single palette color without changing others", () => {
  const state: EntitiesState = {
    ...initialState,
    palettes: {
      entities: {
        palette1: {
          ...dummyPalette,
          id: "palette1",
          colors: ["050505", "05050D", "050515", "202850"],
        },
      },
      ids: ["palette1"],
    },
  };

  const action = actions.editPaletteColor({
    paletteId: "palette1",
    colorId: 3,
    color: "000000",
  });

  const newState = reducer(state, action);
  expect(newState.palettes.entities[action.payload.paletteId]?.colors).toEqual([
    "050505",
    "05050D",
    "050515",
    "000000",
  ]);
});

test("Should be able to remove a palette", () => {
  const state: EntitiesState = {
    ...initialState,
    palettes: {
      entities: {
        palette1: {
          ...dummyPalette,
          id: "palette1",
        },
      },
      ids: ["palette1"],
    },
  };

  const action = actions.removePalette({
    paletteId: "palette1",
  });

  expect(state.palettes.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.palettes.ids.length).toBe(0);
});
