import { Middleware } from "@reduxjs/toolkit";
import ScripTracker from "../../../lib/vendor/scriptracker/scriptracker";
import { playMusic, pauseMusic } from "./musicSlice";
import {
  PLAY_SOUNDFX_BEEP,
  PLAY_SOUNDFX_TONE,
  PLAY_SOUNDFX_CRASH,
  SET_SECTION,
  SET_NAVIGATION_ID,
} from "../../../actions/actionTypes";
import { RootState } from "../../configureStore";

let modPlayer: ScripTracker;

function initMusic() {
  modPlayer = new ScripTracker();
  modPlayer.on(ScripTracker.Events.playerReady, onSongLoaded);
  window.removeEventListener("click", initMusic);
  window.removeEventListener("keydown", initMusic);
}

// Initialise audio on first click
window.addEventListener("click", initMusic);
window.addEventListener("keydown", initMusic);
window.addEventListener("blur", pause);

function onSongLoaded(player: ScripTracker) {
  player.play();
}

function play(filename: string) {
  if (modPlayer) {
    modPlayer.loadModule(`file://${filename}`);
  }
}

function pause() {
  if (modPlayer && modPlayer.isPlaying) {
    modPlayer.stop();
  }
}

const musicMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (playMusic.match(action)) {
    play(action.payload.filename);
  } else if (pauseMusic.match(action)) {
    pause();
  } else if (
    action.type === PLAY_SOUNDFX_BEEP ||
    action.type === PLAY_SOUNDFX_TONE ||
    action.type === PLAY_SOUNDFX_CRASH ||
    action.type === SET_SECTION ||
    action.type === SET_NAVIGATION_ID
  ) {
    console.log("PAUSE MUSIC")!;
    store.dispatch(pauseMusic());
  }

  return next(action);
};

export default musicMiddleware;
