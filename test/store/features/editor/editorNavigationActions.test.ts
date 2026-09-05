import type { RootState } from "store/storeTypes";
import editorActions from "store/features/editor/editorActions";

const state = {} as RootState;
const getState = () => state;

type TestDispatch = jest.Mock;
type TestThunk = (
  dispatch: TestDispatch,
  getState: () => RootState,
  extraArgument: undefined,
) => void;

const createThunkDispatch = () => {
  const dispatch: TestDispatch = jest.fn();
  dispatch.mockImplementation((action: unknown) => {
    if (typeof action === "function") {
      (action as TestThunk)(dispatch, getState, undefined);
    }
  });
  return dispatch;
};

const plainActions = (dispatch: jest.Mock) =>
  dispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => typeof action !== "function");

describe("editor resource navigation", () => {
  test.each([
    [
      { type: "scene" as const, sceneId: "scene-1" },
      [
        { type: "navigation/setSection", payload: "world" },
        { type: "editor/selectScene", payload: { sceneId: "scene-1" } },
        { type: "editor/editSearchTerm", payload: "" },
        { type: "editor/editSearchTerm", payload: "scene-1" },
      ],
    ],
    [
      { type: "actor" as const, sceneId: "scene-1", actorId: "actor-1" },
      [
        { type: "navigation/setSection", payload: "world" },
        {
          type: "editor/selectActor",
          payload: { sceneId: "scene-1", actorId: "actor-1" },
        },
        { type: "editor/editSearchTerm", payload: "" },
        { type: "editor/editSearchTerm", payload: "scene-1" },
      ],
    ],
    [
      {
        type: "trigger" as const,
        sceneId: "scene-1",
        triggerId: "trigger-1",
      },
      [
        { type: "navigation/setSection", payload: "world" },
        {
          type: "editor/selectTrigger",
          payload: { sceneId: "scene-1", triggerId: "trigger-1" },
        },
        { type: "editor/editSearchTerm", payload: "" },
        { type: "editor/editSearchTerm", payload: "scene-1" },
      ],
    ],
    [
      { type: "customEvent" as const, customEventId: "event-1" },
      [
        { type: "navigation/setSection", payload: "world" },
        {
          type: "editor/selectCustomEvent",
          payload: { customEventId: "event-1" },
        },
      ],
    ],
    [
      { type: "sprite" as const, spriteId: "sprite-1" },
      [
        { type: "navigation/setSection", payload: "sprites" },
        { type: "editor/setSelectedSpriteSheetId", payload: "sprite-1" },
      ],
    ],
    [
      { type: "background" as const, backgroundId: "background-1" },
      [
        { type: "navigation/setSection", payload: "images" },
        { type: "navigation/setNavigationId", payload: "background-1" },
      ],
    ],
    [
      { type: "music" as const, musicId: "music-1" },
      [
        { type: "navigation/setSection", payload: "music" },
        { type: "tracker/setSelectedSongId", payload: "music-1" },
      ],
    ],
    [
      { type: "sound" as const, soundId: "sound-1" },
      [
        { type: "navigation/setSection", payload: "sounds" },
        { type: "navigation/setNavigationId", payload: "sound-1" },
      ],
    ],
  ])("opens %o with its editor navigation", (target, expected) => {
    const dispatch = createThunkDispatch();

    editorActions.openEditorResourceById(target)(dispatch, getState, undefined);

    expect(plainActions(dispatch)).toEqual(expected);
  });
});
