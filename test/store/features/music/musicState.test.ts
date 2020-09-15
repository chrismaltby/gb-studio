import reducer, {
  initialState,
  MusicState,
} from "../../../../src/store/features/music/musicState";
import actions from "../../../../src/store/features/music/musicActions";

test("Should set playing to true while playing music", () => {
  const state: MusicState = {
    ...initialState,
    playing: false,
  };
  const action = actions.playMusic({ musicId: "track1" });
  const newState = reducer(state, action);
  expect(newState.playing).toBe(true);
});

test("Should set playing to false while pausing music", () => {
  const state: MusicState = {
    ...initialState,
    playing: true,
  };
  const action = actions.pauseMusic();
  const newState = reducer(state, action);
  expect(newState.playing).toBe(false);
});
