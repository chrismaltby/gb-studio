import reducer, {
  initialState,
  NavigationState,
} from "../../../../src/store/features/navigation/navigationState";
import actions from "../../../../src/store/features/navigation/navigationActions";
import entityActions from "../../../../src/store/features/entities/entitiesActions";
import consoleActions from "../../../../src/store/features/console/consoleActions";

test("Should be able to set section", () => {
  const state: NavigationState = {
    ...initialState,
    section: "music",
  };
  const action = actions.setSection("palettes");
  expect(state.section).toBe("music");

  const newState = reducer(state, action);
  expect(newState.section).toBe("palettes");
});

test("Should be able to set navigation id", () => {
  const state: NavigationState = {
    ...initialState,
    id: "1",
  };
  const action = actions.setNavigationId("2");
  expect(state.id).toBe("1");

  const newState = reducer(state, action);
  expect(newState.id).toBe("2");
});

test("Should set navigation id to newly created palette", () => {
  const state: NavigationState = {
    ...initialState,
    id: "1",
  };
  const action = entityActions.addPalette();
  const newPaletteId = action.payload.paletteId;

  const newState = reducer(state, action);
  expect(newState.id).toBe(newPaletteId);
});

test("Should switch to build page on any console errors", () => {
  const state: NavigationState = {
    ...initialState,
    section: "world",
  };
  const action = consoleActions.stdErr("Failed to build");

  const newState = reducer(state, action);
  expect(newState.section).toBe("build");
});
