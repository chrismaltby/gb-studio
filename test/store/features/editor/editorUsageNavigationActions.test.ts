import type { RootState } from "store/storeTypes";
import editorActions from "store/features/editor/editorActions";
import {
  backgroundSelectors,
  musicSelectors,
  sceneSelectors,
  soundSelectors,
  spriteSheetSelectors,
} from "store/features/entities/entitiesSelectors";

jest.mock("store/features/entities/entitiesSelectors", () => ({
  actorSelectors: { selectById: jest.fn() },
  sceneSelectors: { selectAll: jest.fn() },
  spriteSheetSelectors: { selectAll: jest.fn() },
  backgroundSelectors: { selectAll: jest.fn() },
  musicSelectors: { selectAll: jest.fn() },
  soundSelectors: { selectAll: jest.fn() },
}));
const state = {} as RootState;
const getState = () => state;
type Thunk = (
  dispatch: jest.Mock,
  getState: () => RootState,
  extra: undefined,
) => void;
const dispatchForThunk = () => {
  const dispatch = jest.fn();
  dispatch.mockImplementation((action: unknown) => {
    if (typeof action === "function")
      (action as Thunk)(dispatch, getState, undefined);
  });
  return dispatch;
};
const plainActions = (dispatch: jest.Mock) =>
  dispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => typeof action !== "function");

describe("usage table editor navigation", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(sceneSelectors.selectAll).mockReturnValue([]);
    jest.mocked(spriteSheetSelectors.selectAll).mockReturnValue([]);
    jest.mocked(backgroundSelectors.selectAll).mockReturnValue([]);
    jest.mocked(musicSelectors.selectAll).mockReturnValue([]);
    jest.mocked(soundSelectors.selectAll).mockReturnValue([]);
  });
  test("opens a scene collision script's exact tabs", () => {
    const dispatch = dispatchForThunk();
    editorActions.openEditorScript({
      sceneId: "scene-1",
      entityId: "scene-1",
      entityType: "scene",
      scriptKey: "playerHit2Script",
    })(dispatch, getState, undefined);
    expect(plainActions(dispatch)).toEqual([
      { type: "editor/setScriptTabScene", payload: "hit" },
      { type: "editor/setScriptTabSecondary", payload: "hit2" },
      { type: "navigation/setSection", payload: "world" },
      { type: "editor/selectScene", payload: { sceneId: "scene-1" } },
      { type: "editor/editSearchTerm", payload: "" },
      { type: "editor/editSearchTerm", payload: "scene-1" },
    ]);
  });
  test("resolves an asset symbol before opening its editor", () => {
    const dispatch = dispatchForThunk();
    jest
      .mocked(musicSelectors.selectAll)
      .mockReturnValue([{ id: "song-1", symbol: "song" }] as never);
    editorActions.openEditorResourceBySymbol({ type: "music", symbol: "song" })(
      dispatch,
      getState,
      undefined,
    );
    expect(plainActions(dispatch)).toEqual([
      { type: "navigation/setSection", payload: "music" },
      { type: "tracker/setSelectedSongId", payload: "song-1" },
    ]);
  });
});
