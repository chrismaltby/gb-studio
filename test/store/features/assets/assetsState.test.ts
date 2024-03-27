import reducer, {
  initialState,
  AssetsState,
} from "../../../../src/store/features/assets/assetsState";
import actions from "../../../../src/store/features/assets/assetsActions";

test("Should set loading flag while fetching background warnings", () => {
  const state: AssetsState = {
    ...initialState,
    backgroundsLoading: false,
  };
  const action = actions.loadBackgroundAssetInfo({
    backgroundId: "bg1",
    is360: false,
  });
  const newState = reducer(state, action);
  expect(newState.backgroundsLoading).toBe(true);
});

test("Should be able to set background warnings", () => {
  const state: AssetsState = {
    ...initialState,
    backgroundsLoading: true,
    backgrounds: {},
  };
  const action = actions.setBackgroundAssetInfo({
    id: "bg1",
    warnings: ["warning 1", "warning 2"],
    numTiles: 10,
    is360: false,
    isCGBOnly: false,
    lookup: [],
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
  const state: AssetsState = {
    ...initialState,
    backgroundsLoading: true,
    backgrounds: {
      bg1: {
        id: "bg1",
        warnings: ["warning 1", "warning 2"],
        numTiles: 10,
        is360: false,
        isCGBOnly: false,
        timestamp: 0,
        lookup: [],
      },
    },
  };
  const action = actions.setBackgroundAssetInfo({
    id: "bg1",
    warnings: ["warning 3"],
    numTiles: 15,
    is360: false,
    isCGBOnly: false,
    lookup: [],
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
