import reducer, {
  initialState,
  WarningsState,
} from "../../../../src/store/features/warnings/warningsState";
import actions from "../../../../src/store/features/warnings/warningsActions";

test("Should set loading flag while fetching background warnings", () => {
  const state: WarningsState = {
    ...initialState,
    backgroundsLoading: false,
  };
  const action = actions.checkBackgroundWarnings("bg1");
  const newState = reducer(state, action);
  expect(newState.backgroundsLoading).toBe(true);
});

test("Should be able to set background warnings", () => {
  const state: WarningsState = {
    ...initialState,
    backgroundsLoading: true,
    backgrounds: {},
  };
  const action = actions.setBackgroundWarnings({
    id: "bg1",
    warnings: ["warning 1", "warning 2"],
    numTiles: 10,
  });
  const newState = reducer(state, action);
  expect(newState.backgroundsLoading).toBe(false);
  expect(newState.backgrounds["bg1"]).toMatchObject({
    id: "bg1",
    warnings: ["warning 1", "warning 2"],
    numTiles: 10,
  });
  expect(newState.backgrounds["bg1"]?.timestamp).toBeGreaterThan(
    Date.now() - 1000
  );
});

test("Should replace existing warnings", () => {
  const state: WarningsState = {
    ...initialState,
    backgroundsLoading: true,
    backgrounds: {
      bg1: {
        id: "bg1",
        warnings: ["warning 1", "warning 2"],
        numTiles: 10,
        timestamp: 0,
      },
    },
  };
  const action = actions.setBackgroundWarnings({
    id: "bg1",
    warnings: ["warning 3"],
    numTiles: 15,
  });
  const newState = reducer(state, action);
  expect(newState.backgroundsLoading).toBe(false);
  expect(newState.backgrounds["bg1"]).toMatchObject({
    id: "bg1",
    warnings: ["warning 3"],
    numTiles: 15,
  });
  expect(newState.backgrounds["bg1"]?.timestamp).toBeGreaterThan(
    Date.now() - 1000
  );
});
